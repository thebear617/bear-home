#!/usr/bin/env python3
"""一次性脚本：为 personal 路由表下载各站 favicon 到本地 public/assets/routes/。
仅构建期运行一次，产物为本地 PNG，运行时不依赖任何外部服务。"""
import os
import subprocess
import urllib.request

OUT_DIR = "public/assets/routes"
os.makedirs(OUT_DIR, exist_ok=True)

# (输出文件名, 域名) —— 用 DuckDuckGo 的 favicon 服务抓取各站图标
TARGETS = [
    ("Claude.png", "claude.ai"),
    ("ChatGPT.png", "chat.openai.com"),
    ("豆包.png", "www.doubao.com"),
    ("Gemini.png", "gemini.google.com"),
    ("链动小铺.png", "pay.ldxp.cn"),
    ("HeroSMS.png", "hero-sms.com"),
    ("OpenTheRank.png", "opentherank.com"),
    ("OpenRouter.png", "openrouter.ai"),
    ("鲜枣课堂.png", "www.xzclass.com"),
    ("JavaGuide.png", "javaguide.cn"),
    ("QQ邮箱.png", "mail.qq.com"),
    ("西电学生邮箱.png", "mail.stu.xidian.edu.cn"),
    ("西电智课平台.png", "xdspoc.xidian.edu.cn"),
    ("西电信息网络技术中心.png", "xxzx.xidian.edu.cn"),
    ("Bilibili.png", "www.bilibili.com"),
]

def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = r.read()
    with open(dest, "wb") as f:
        f.write(data)
    return data

for fname, domain in TARGETS:
    dest = os.path.join(OUT_DIR, fname)
    try:
        data = download(f"https://icons.duckduckgo.com/ip3/{domain}.ico", dest)
        print(f"OK   {fname}  ({len(data)} bytes, {domain})")
    except Exception as e:
        print(f"FAIL {fname}  ({domain}): {e}")
