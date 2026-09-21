# -*- coding: utf-8 -*-
"""
Công cụ tạo ảnh màn hình chờ (splash) cho iPhone và iPad.

Android tự vẽ màn hình chờ từ manifest.webmanifest (icon + màu nền), nhưng
iPhone/iPad thì KHÔNG: phải có sẵn một ảnh đúng khít cỡ màn hình của từng dòng
máy, nếu không sẽ chỉ hiện một màn hình trống.

Script này:
  1. Lấy logo đầy đủ (public/hinh/logo-sang.png) đặt giữa nền kem thương hiệu
  2. Xuất một ảnh cho mỗi cỡ màn hình trong bảng CO_MAN_HINH, vào public/hinh/splash/
  3. Tự viết lại khối <link rel="apple-touch-startup-image"> trong index.html
     (nằm giữa hai dòng đánh dấu SPLASH-BAT-DAU / SPLASH-KET-THUC)

CÁCH CHẠY (mở Terminal tại thư mục dự án):
    npm run tao-splash

Chỉ cần chạy lại khi đổi logo, hoặc khi Apple ra cỡ màn hình mới (thêm một dòng
vào bảng CO_MAN_HINH rồi chạy lại).
"""

from pathlib import Path

from PIL import Image

LOGO = Path("public/hinh/logo-sang.png")
RA = Path("public/hinh/splash")
INDEX = Path("index.html")

# Màu nền kem, lấy từ logo (giống --goc-kem trong src/styles/tokens.css)
KEM = (255, 246, 229)

# Logo rộng bằng bao nhiêu phần cạnh ngắn của màn hình
TI_LE_LOGO = 0.46

# (rộng CSS, cao CSS, tỉ lệ điểm ảnh, tên máy) — chỉ khổ dọc.
# Cỡ ảnh thật = rộng CSS × tỉ lệ, cao CSS × tỉ lệ.
CO_MAN_HINH = [
    (440, 956, 3, "iPhone 16 Pro Max, 17 Pro Max"),
    (402, 874, 3, "iPhone 16 Pro, 17, 17 Pro"),
    (430, 932, 3, "iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus"),
    (393, 852, 3, "iPhone 14 Pro, 15, 15 Pro, 16"),
    (428, 926, 3, "iPhone 12 Pro Max, 13 Pro Max, 14 Plus"),
    (390, 844, 3, "iPhone 12, 12 Pro, 13, 13 Pro, 14, 16e"),
    (375, 812, 3, "iPhone X, XS, 11 Pro, 12 mini, 13 mini"),
    (414, 896, 3, "iPhone XS Max, 11 Pro Max"),
    (414, 896, 2, "iPhone XR, 11"),
    (414, 736, 3, "iPhone 6 Plus, 7 Plus, 8 Plus"),
    (375, 667, 2, "iPhone 6, 7, 8, SE 2, SE 3"),
    (320, 568, 2, "iPhone SE đời đầu"),
    (1024, 1366, 2, "iPad Pro 12.9"),
    (834, 1194, 2, "iPad Pro 11"),
    (820, 1180, 2, "iPad Air 10.9"),
    (768, 1024, 2, "iPad, iPad mini đời cũ"),
    (744, 1133, 2, "iPad mini 8.3"),
]


def tao_anh(logo, rong, cao):
    """Một ảnh splash: nền kem, logo nằm giữa, hơi lệch lên trên một chút."""
    nen = Image.new("RGB", (rong, cao), KEM)
    rong_logo = round(min(rong, cao) * TI_LE_LOGO)
    cao_logo = round(logo.height * rong_logo / logo.width)
    anh_logo = logo.resize((rong_logo, cao_logo), Image.LANCZOS)
    x = (rong - rong_logo) // 2
    y = round(cao * 0.45 - cao_logo / 2)
    nen.paste(anh_logo, (x, y), anh_logo)
    return nen


def main():
    logo = Image.open(LOGO).convert("RGBA")
    RA.mkdir(parents=True, exist_ok=True)
    for cu in RA.glob("*.png"):
        cu.unlink()

    dong_link = []
    tong = 0
    for rong_css, cao_css, ti_le, ten_may in CO_MAN_HINH:
        rong, cao = rong_css * ti_le, cao_css * ti_le
        ten = f"splash-{rong}x{cao}.png"
        duong_dan = RA / ten
        # Ảnh chỉ có vài màu (kem, cam, nâu và viền pha trộn) nên lưu dạng bảng
        # 64 màu: nhẹ hơn nhiều mà mắt không thấy khác
        anh = tao_anh(logo, rong, cao).quantize(colors=64, method=Image.Quantize.MEDIANCUT)
        anh.save(duong_dan, optimize=True)
        tong += duong_dan.stat().st_size
        dong_link.append(
            f'    <!-- {ten_may} -->\n'
            f'    <link rel="apple-touch-startup-image" href="/hinh/splash/{ten}"\n'
            f'      media="(device-width: {rong_css}px) and (device-height: {cao_css}px) '
            f'and (-webkit-device-pixel-ratio: {ti_le}) and (orientation: portrait)" />'
        )
        print(f"  {ten}  ({ten_may})")

    # Viết lại khối splash trong index.html
    html = INDEX.read_text(encoding="utf-8")
    dau, cuoi = "<!-- SPLASH-BAT-DAU", "<!-- SPLASH-KET-THUC -->"
    i, j = html.index(dau), html.index(cuoi)
    i = html.index("-->", i) + 3
    html = html[:i] + "\n" + "\n".join(dong_link) + "\n    " + html[j:]
    INDEX.write_text(html, encoding="utf-8", newline="\n")

    print(f"Đã tạo {len(CO_MAN_HINH)} ảnh, tổng {tong / 1024:.0f} KB, và cập nhật index.html")


if __name__ == "__main__":
    main()
