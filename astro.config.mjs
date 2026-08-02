import { defineConfig } from 'astro/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeLongTermState } from './src/data/tracker-config.js';

const trackerSnapshotPath = fileURLToPath(new URL('./public/data/tracker-snapshot.json', import.meta.url));

function earliestDateKey(...values) {
  return values
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value || ''))
    .sort()[0] || values.find(Boolean);
}

function mergeDailyRecords(currentRecords, incomingRecords) {
  return {
    ...(currentRecords && typeof currentRecords === 'object' ? currentRecords : {}),
    ...(incomingRecords && typeof incomingRecords === 'object' ? incomingRecords : {}),
  };
}

function mergeLongTermGoals(currentGoals, incomingGoals) {
  const merged = new Map();
  for (const goal of Array.isArray(currentGoals) ? currentGoals : []) {
    if (goal?.id) merged.set(goal.id, goal);
  }
  for (const goal of Array.isArray(incomingGoals) ? incomingGoals : []) {
    if (!goal?.id) continue;
    const previous = merged.get(goal.id);
    merged.set(goal.id, {
      ...previous,
      ...goal,
      startedAt: earliestDateKey(previous?.startedAt, goal.startedAt),
    });
  }
  return [...merged.values()];
}

function trackerSyncPlugin() {
  return {
    name: 'tracker-sync',
    configureServer(server) {
      server.middlewares.use('/__tracker_sync', (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (payload?.schemaVersion !== 1 || !payload?.startedOn || !payload?.dailyRecords || typeof payload.dailyRecords !== 'object') {
              throw new Error('invalid tracker snapshot');
            }

            let currentSnapshot = null;
            if (existsSync(trackerSnapshotPath)) {
              try { currentSnapshot = JSON.parse(readFileSync(trackerSnapshotPath, 'utf8')); } catch { currentSnapshot = null; }
            }

            const mergedStartedOn = earliestDateKey(currentSnapshot?.startedOn, payload.startedOn);
            const nextSnapshot = {
              schemaVersion: 1,
              snapshotAt: payload.snapshotAt || new Date().toISOString(),
              startedOn: mergedStartedOn,
              dailyRecords: mergeDailyRecords(currentSnapshot?.dailyRecords, payload.dailyRecords),
              longTerm: normalizeLongTermState({
                ...(currentSnapshot?.longTerm || {}),
                ...(payload.longTerm || {}),
                goals: mergeLongTermGoals(currentSnapshot?.longTerm?.goals, payload.longTerm?.goals),
              }, mergedStartedOn)
            };

            const currentData = JSON.stringify({ dailyRecords: currentSnapshot?.dailyRecords || {}, longTerm: currentSnapshot?.longTerm || { goals: [] } });
            const nextData = JSON.stringify({ dailyRecords: nextSnapshot.dailyRecords, longTerm: nextSnapshot.longTerm });
            if (currentSnapshot?.schemaVersion === 1 && currentData === nextData) {
              response.writeHead(200, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ changed: false, snapshotAt: currentSnapshot.snapshotAt }));
              return;
            }

            mkdirSync(dirname(trackerSnapshotPath), { recursive: true });
            writeFileSync(trackerSnapshotPath, `${JSON.stringify(nextSnapshot, null, 2)}\n`, 'utf8');
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ changed: true, snapshotAt: nextSnapshot.snapshotAt }));
          } catch (error) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'invalid request' }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  output: 'static',
  vite: {
    plugins: [trackerSyncPlugin()],
    server: { strictPort: true }
  },
  build: {
    format: 'directory'
  }
});
