#!/usr/bin/env python3
"""把所有路由图标统一转成 256x256 RGBA PNG；并为无源的两个站点生成占位图标。"""
import os
from PIL import Image

OUT_DIR = "public/assets/routes"
SIZE = (256, 256)

# 已下载但格式/尺寸不一的文件，统一转换
TO_NORMALIZE = [
    "Bilibili.png",
    "ChatGPT.png",
    "Claude.png",
    "Gemini.png",
    "HeroSMS.png",
    "JavaGuide.png",
    "OpenRouter.png",
    "OpenTheRank.png",
    "QQ邮箱.png",
    "西电信息网络技术中心.png",
    "西电学生邮箱.png",
    "豆包.png",
    "链动小铺.png",
]

# 无可用 favicon，用纯色底 + 站点首字生成占位图标
PLACEHOLDERS = {
    "鲜枣课堂.png": ("#3f7d3f", "鲜"),
    "西电智课平台.png": ("#4f46e5", "智"),
}

def normalize(fname):
    path = os.path.join(OUT_DIR, fname)
    try:
        img = Image.open(path).convert("RGBA")
        # 1. 裁掉透明边，让实际 logo 紧贴边缘
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        # 2. 高质量缩放到 256x256（既会放大也会缩小）
        img = img.resize(SIZE, Image.LANCZOS)
        img.save(path, "PNG")
        print(f"OK   {fname} -> {img.size}")
    except Exception as e:
        print(f"FAIL {fname}: {e}")

def make_placeholder(fname, color, char):
    path = os.path.join(OUT_DIR, fname)
    rgb = tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))
    img = Image.new("RGBA", SIZE, rgb + (255,))
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(img)
    # 找一个支持中文的字体
    font = None
    for fp in [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]:
        try:
            font = ImageFont.truetype(fp, 150)
            break
        except Exception:
            continue
    draw.text((SIZE[0] // 2, SIZE[1] // 2), char, font=font,
              fill=(255, 255, 255, 255), anchor="mm")
    img.save(path, "PNG")
    print(f"OK   {fname} (占位: {char})")

for f in TO_NORMALIZE:
    normalize(f)
for fname, (color, char) in PLACEHOLDERS.items():
    make_placeholder(fname, color, char)
