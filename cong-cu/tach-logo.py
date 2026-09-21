# -*- coding: utf-8 -*-
"""
Công cụ tách logo Riyi.

File gốc "thuong-hieu/Riyi Chinese.png" là một BẢNG NHẬN DIỆN gồm 3 ô ghép chung.
Script này cắt bảng đó ra thành các file riêng mà app dùng được:
  - logo-sang.png   : logo đầy đủ, nền trong suốt, dùng trên nền sáng
  - logo-toi.png    : logo đầy đủ, nền trong suốt, dùng trên nền tối
  - logo-anh-dao.png: logo tông hồng cho theme hoa anh đào (GĐ 10), tô lại màu
                      từ bản sáng, hình dạng giữ nguyên
  - mat-troi.png    : chỉ riêng hình mặt trời (dùng cho tab Mục tiêu)
  - icon-*.png      : icon app vuông cho PWA, nhiều kích cỡ
  - favicon.ico     : icon hiện trên tab trình duyệt

CÁCH CHẠY (mở Terminal tại thư mục dự án):
    python cong-cu/tach-logo.py

Chỉ cần chạy lại khi anh thay file logo gốc.
"""

from PIL import Image, ImageDraw
from pathlib import Path

GOC = Path("thuong-hieu/Riyi Chinese.png")
RA = Path("public/hinh")

# 4 màu thương hiệu, lấy trực tiếp từ file logo gốc
CAM = (240, 96, 15)       # #F0600F - mặt trời
NAU = (42, 31, 26)        # #2A1F1A - chữ, đường chân trời
KEM = (255, 246, 229)     # #FFF6E5 - nền sáng
BE = (234, 223, 203)      # #EADFCB - nền phụ

# Màu theme hoa anh đào, chép từ src/styles/tokens.css (--goc-hong, --goc-man)
HONG = (226, 116, 147)    # #E27493 - mặt trời
MAN = (58, 34, 41)        # #3A2229 - chữ, đường chân trời

# Toạ độ 3 ô trong bảng nhận diện (đã đo bằng máy, không phải ước lượng)
O_TRAI = (0, 0, 1360, 1280)         # logo trên nền kem
O_PHAI_TREN = (1360, 0, 2240, 640)  # logo trên nền nâu
VUNG_MAT_TROI = (520, 268, 840, 444)  # riêng hình mặt trời trong ô trái


def tach_nen(anh, mau_nen, cac_mau_chu):
    """
    Biến nền phẳng thành trong suốt.

    Không dùng cách "xoá pixel giống màu nền" vì viền chữ sẽ bị răng cưa xấu.
    Thay vào đó: mỗi pixel viền là sự pha trộn giữa màu nền và màu chữ, nên ta
    giải ngược ra độ mờ (alpha) và trả lại đúng màu chữ gốc. Viền sẽ mượt.
    """
    anh = anh.convert("RGB")
    rong, cao = anh.size
    nguon = anh.load()
    ket_qua = Image.new("RGBA", (rong, cao), (0, 0, 0, 0))
    dich = ket_qua.load()

    for y in range(cao):
        for x in range(rong):
            p = nguon[x, y]
            tot_nhat = None
            for chu in cac_mau_chu:
                # Chọn kênh màu có độ lệch lớn nhất giữa chữ và nền cho ổn định
                kenh = max(range(3), key=lambda i: abs(chu[i] - mau_nen[i]))
                mau_so = chu[kenh] - mau_nen[kenh]
                if mau_so == 0:
                    continue
                a = (p[kenh] - mau_nen[kenh]) / mau_so
                a = max(0.0, min(1.0, a))
                # Dựng lại pixel để xem đoán có khớp không
                dung_lai = tuple(a * chu[i] + (1 - a) * mau_nen[i] for i in range(3))
                sai_so = sum(abs(dung_lai[i] - p[i]) for i in range(3))
                if tot_nhat is None or sai_so < tot_nhat[0]:
                    tot_nhat = (sai_so, chu, a)
            if tot_nhat is None:
                continue
            _, chu, a = tot_nhat
            if a > 0.004:
                dich[x, y] = (chu[0], chu[1], chu[2], int(round(a * 255)))
    return ket_qua


def cat_sat_vien(anh, le=0):
    """Cắt bỏ phần trong suốt thừa quanh hình, chừa lại một chút lề."""
    hop = anh.getbbox()
    if hop is None:
        return anh
    t, tr, p, d = hop
    t = max(0, t - le)
    tr = max(0, tr - le)
    p = min(anh.size[0], p + le)
    d = min(anh.size[1], d + le)
    return anh.crop((t, tr, p, d))


def doi_mau(anh, mau_moi):
    """Giữ nguyên hình dạng và độ mờ, chỉ thay màu. Dùng để đổi mặt trời sang màu kem."""
    ra = Image.new("RGBA", anh.size, mau_moi + (0,))
    ra.putalpha(anh.getchannel("A"))
    return ra


def vuong_bo_goc(canh, mau_nen, ban_kinh_ti_le=0.22):
    """Tạo nền vuông bo góc màu cam, giống icon trong file logo gốc."""
    # Vẽ ở cỡ gấp 4 rồi thu nhỏ để cạnh bo mượt, không răng cưa
    ty_le = 4
    lon = Image.new("RGBA", (canh * ty_le, canh * ty_le), (0, 0, 0, 0))
    but = ImageDraw.Draw(lon)
    but.rounded_rectangle(
        [0, 0, canh * ty_le - 1, canh * ty_le - 1],
        radius=int(canh * ty_le * ban_kinh_ti_le),
        fill=mau_nen + (255,),
    )
    return lon.resize((canh, canh), Image.LANCZOS)


def main():
    if not GOC.exists():
        raise SystemExit(f"Không tìm thấy file logo gốc: {GOC}")

    RA.mkdir(parents=True, exist_ok=True)
    goc = Image.open(GOC).convert("RGB")

    # --- 1. Logo cho theme sáng: nền kem, chữ nâu, mặt trời cam ---
    logo_sang = cat_sat_vien(tach_nen(goc.crop(O_TRAI), KEM, [NAU, CAM]))
    logo_sang.save(RA / "logo-sang.png")
    print(f"  logo-sang.png      {logo_sang.size[0]}x{logo_sang.size[1]}")

    # --- 2. Logo cho theme tối: nền nâu, chữ kem, mặt trời cam ---
    logo_toi = cat_sat_vien(tach_nen(goc.crop(O_PHAI_TREN), NAU, [KEM, CAM]))
    logo_toi.save(RA / "logo-toi.png")
    print(f"  logo-toi.png       {logo_toi.size[0]}x{logo_toi.size[1]}")

    # --- 2b. Logo cho theme hoa anh đào: tô lại bản sáng ---
    # Mỗi pixel của bản sáng mang đúng màu nâu (chữ) hoặc cam (mặt trời) kèm độ
    # mờ, nên chỉ việc đổi màu theo từng pixel, giữ nguyên độ mờ để viền mượt.
    logo_anh_dao = logo_sang.copy()
    px = logo_anh_dao.load()
    for y in range(logo_anh_dao.size[1]):
        for x in range(logo_anh_dao.size[0]):
            r, g, b, a = px[x, y]
            if a:
                moi = HONG if (r, g, b) == CAM else MAN
                px[x, y] = moi + (a,)
    logo_anh_dao.save(RA / "logo-anh-dao.png")
    print(f"  logo-anh-dao.png   {logo_anh_dao.size[0]}x{logo_anh_dao.size[1]}")

    # --- 3. Riêng hình mặt trời, dùng cho tab Mục tiêu hôm nay ---
    mat_troi = cat_sat_vien(tach_nen(goc.crop(VUNG_MAT_TROI), KEM, [NAU, CAM]))
    mat_troi.save(RA / "mat-troi.png")
    print(f"  mat-troi.png       {mat_troi.size[0]}x{mat_troi.size[1]}")

    # --- 4. Icon app: nền cam bo góc + mặt trời màu kem ---
    # Dựng lại thay vì cắt icon nhỏ trong file gốc, để nét sắc ở mọi kích cỡ.
    mat_troi_kem = doi_mau(mat_troi, KEM)
    for canh in (512, 192, 180, 167, 152, 120, 32):
        nen = vuong_bo_goc(canh, CAM)
        # Mặt trời chiếm khoảng 62% chiều rộng icon, căn giữa
        rong_moi = int(canh * 0.62)
        cao_moi = max(1, round(rong_moi * mat_troi_kem.size[1] / mat_troi_kem.size[0]))
        hinh = mat_troi_kem.resize((rong_moi, cao_moi), Image.LANCZOS)
        nen.alpha_composite(hinh, ((canh - rong_moi) // 2, (canh - cao_moi) // 2))
        nen.save(RA / f"icon-{canh}.png")
    print("  icon-*.png         512, 192, 180, 167, 152, 120, 32")

    # --- 5. Icon 'maskable' cho Android: chừa lề rộng để hệ điều hành cắt tròn ---
    canh = 512
    nen = Image.new("RGBA", (canh, canh), CAM + (255,))
    rong_moi = int(canh * 0.42)
    cao_moi = max(1, round(rong_moi * mat_troi_kem.size[1] / mat_troi_kem.size[0]))
    hinh = mat_troi_kem.resize((rong_moi, cao_moi), Image.LANCZOS)
    nen.alpha_composite(hinh, ((canh - rong_moi) // 2, (canh - cao_moi) // 2))
    nen.save(RA / "icon-maskable-512.png")
    print("  icon-maskable-512.png")

    # --- 6. favicon.ico cho tab trình duyệt ---
    Image.open(RA / "icon-512.png").save(
        RA / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("  favicon.ico")


if __name__ == "__main__":
    print("Đang tách logo...")
    main()
    print("Xong.")
