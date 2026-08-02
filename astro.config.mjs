import { defineConfig } from 'astro/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const trackerSnapshotPath = fileURLToPath(new URL('./public/data/tracker-snapshot.json', import.meta.url));

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

            const nextSnapshot = {
              schemaVersion: 1,
              snapshotAt: payload.snapshotAt || new Date().toISOString(),
              startedOn: payload.startedOn,
              dailyRecords: payload.dailyRecords,
              longTerm: payload.longTerm || { goals: [] }
            };
            let currentSnapshot = null;
            if (existsSync(trackerSnapshotPath)) {
              try { currentSnapshot = JSON.parse(readFileSync(trackerSnapshotPath, 'utf8')); } catch { currentSnapshot = null; }
            }

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
