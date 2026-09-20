# -*- coding: utf-8 -*-
"""
Công cụ ĐỐI CHIẾU TỰ DẠNG giữa font tiếng Trung và font tiếng Nhật.

VÌ SAO CẦN:
  Cùng một mã Unicode nhưng tiếng Trung và tiếng Nhật vẽ nét khác nhau.
  Ô kiểm tra font ở màn hình đầu cần chọn đúng những chữ khác nhau RÕ RỆT.
  Nếu chọn nhầm chữ vốn giống hệt nhau thì người dùng sẽ tưởng app bị lỗi font.

CÁCH LÀM:
  Script KHÔNG đoán và cũng không so toạ độ. Lý do: Noto Sans SC và Noto Sans JP
  là hai bộ font được vẽ độc lập, nên toạ độ điểm luôn khác nhau kể cả với chữ
  trông y hệt. So toạ độ sẽ cho kết quả sai.

  Thay vào đó, script VẼ THẬT từng chữ ra ảnh bằng cả hai font, rồi đếm xem
  bao nhiêu phần trăm điểm ảnh khác nhau. Đây đúng là thứ mắt người nhìn thấy.

  Script cũng xuất ra một ảnh so sánh để xem trực tiếp bằng mắt:
      cong-cu/ket-qua-so-sanh-tu-dang.png

CÁCH CHẠY:
    python cong-cu/so-sanh-tu-dang.py          # danh sách chữ mặc định
    python cong-cu/so-sanh-tu-dang.py 直骨今    # chữ tự chọn
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT_TRUNG = Path("cong-cu/font-goc/noto-sans-sc.ttf")
FONT_NHAT = Path("cong-cu/font-goc/noto-sans-jp.ttf")
ANH_RA = Path("cong-cu/ket-qua-so-sanh-tu-dang.png")

CO_VE = 128  # cỡ chữ lúc vẽ để so sánh, càng lớn càng chính xác

# Các chữ thường được nhắc tới khi nói về khác biệt tự dạng Trung - Nhật.
# Đây chỉ là danh sách ỨNG VIÊN. Chữ nào thật sự khác thì máy quyết định.
CHU_MAC_DINH = "直骨今令海画具花草言雪半天次空分道者番強歩芸雨対社決類毎歯"

# Ngưỡng phân loại, tính theo phần trăm điểm ảnh khác nhau
NGUONG_RO = 6.0
NGUONG_VUA = 2.0


def mo_font(duong_dan):
    """
    Mở font và chọn độ đậm Regular.

    Font biến thiên (variable font) mặc định mở ra ở độ mảnh nhất (Thin),
    nét rất mảnh, so sánh sẽ không chuẩn. Phải chuyển sang Regular.
    """
    font = ImageFont.truetype(str(duong_dan), CO_VE)
    try:
        font.set_variation_by_name("Regular")
    except (OSError, AttributeError):
        # Font không phải loại biến thiên, hoặc thư viện không hỗ trợ.
        # Vẫn dùng được, chỉ là nét mảnh hơn.
        pass
    return font


def ve_chu(font, ky_tu, canh):
    """Vẽ một chữ ra ảnh đen trắng, căn giữa ô vuông."""
    anh = Image.new("L", (canh, canh), 0)
    but = ImageDraw.Draw(anh)
    # anchor="mm" = căn giữa theo cả chiều ngang lẫn chiều dọc
    but.text((canh / 2, canh / 2), ky_tu, font=font, fill=255, anchor="mm")
    return anh


def mo_font_co(duong_dan, co):
    """Mở font ở một cỡ chữ khác. Dùng cho ảnh so sánh, để chữ không bị cắt."""
    font = ImageFont.truetype(str(duong_dan), co)
    try:
        font.set_variation_by_name("Regular")
    except (OSError, AttributeError):
        pass
    return font


def do_khac_nhau(anh_a, anh_b):
    """
    Đếm phần trăm điểm ảnh khác nhau giữa hai chữ.

    Trả về số từ 0 đến 100. 0 = vẽ giống hệt.
    """
    diem_a = list(anh_a.getdata())
    diem_b = list(anh_b.getdata())

    # Chỉ tính trong vùng có nét, không tính nền trắng bao quanh,
    # nếu không thì chữ nào cũng ra "khác rất ít" vì nền chiếm đa số.
    vung_net = 0
    khac = 0
    for a, b in zip(diem_a, diem_b):
        if a > 32 or b > 32:
            vung_net += 1
            # Lệch quá 1/3 sắc độ mới tính là khác, để bỏ qua răng cưa
            if abs(a - b) > 85:
                khac += 1

    if vung_net == 0:
        return None
    return khac / vung_net * 100


def xuat_anh_so_sanh(ket_qua, _font_t, _font_n):
    """Vẽ ảnh so sánh để người dùng tự nhìn bằng mắt."""
    if not ket_qua:
        return
    canh = 110
    # Vẽ chữ nhỏ hơn ô một chút để không bị cắt mất phần trên và phần dưới
    font_t = mo_font_co(FONT_TRUNG, int(canh * 0.72))
    font_n = mo_font_co(FONT_NHAT, int(canh * 0.72))
    cao_nhan = 26
    rong = canh * 2 + 30
    cao = cao_nhan + len(ket_qua) * canh

    anh = Image.new("RGB", (rong, cao), (255, 246, 229))
    but = ImageDraw.Draw(anh)
    try:
        font_nhan = ImageFont.truetype("arial.ttf", 13)
    except OSError:
        font_nhan = ImageFont.load_default()

    but.text((canh / 2, 8), "Tieng Trung", fill=(42, 31, 26), font=font_nhan, anchor="ma")
    but.text((canh * 1.5 + 30, 8), "Tieng Nhat", fill=(42, 31, 26), font=font_nhan, anchor="ma")

    for i, (ky_tu, muc) in enumerate(ket_qua):
        y = cao_nhan + i * canh
        for cot, font in ((0, font_t), (canh + 30, font_n)):
            o = ve_chu(font, ky_tu, canh)
            # Đổi ảnh đen trắng thành chữ nâu trên nền kem
            mau = Image.new("RGB", (canh, canh), (42, 31, 26))
            anh.paste(mau, (cot, y), o)
        but.text(
            (canh + 15, y + canh / 2),
            "{:.0f}%".format(muc),
            fill=(240, 96, 15),
            font=font_nhan,
            anchor="mm",
        )
        but.line([(0, y), (rong, y)], fill=(221, 208, 184), width=1)

    anh.save(ANH_RA)
    print()
    print("Da xuat anh so sanh: " + str(ANH_RA))


def main():
    for f in (FONT_TRUNG, FONT_NHAT):
        if not f.exists():
            raise SystemExit("Khong tim thay font goc: " + str(f))

    chu_can_xem = sys.argv[1] if len(sys.argv) > 1 else CHU_MAC_DINH

    font_t = mo_font(FONT_TRUNG)
    font_n = mo_font(FONT_NHAT)

    print("So sanh tu dang: Noto Sans SC  <->  Noto Sans JP")
    print("Cach do: ve that ra anh {}px roi dem diem anh khac nhau".format(CO_VE))
    print("=" * 62)
    print("{:<5} {:>10}   {}".format("Chu", "Khac", "Ket luan"))
    print("-" * 62)

    khac_ro = []
    for ky_tu in chu_can_xem:
        if not ky_tu.strip():
            continue

        anh_t = ve_chu(font_t, ky_tu, CO_VE)
        anh_n = ve_chu(font_n, ky_tu, CO_VE)
        muc = do_khac_nhau(anh_t, anh_n)

        if muc is None:
            print("{:<5} {:>10}   {}".format(ky_tu, "--", "khong ve duoc"))
            continue

        if muc >= NGUONG_RO:
            ket_luan = "KHAC RO - dung duoc de kiem tra"
            khac_ro.append((ky_tu, muc))
        elif muc >= NGUONG_VUA:
            ket_luan = "khac it - nhin ky moi thay"
        else:
            ket_luan = "giong nhau - khong dung de kiem tra"

        print("{:<5} {:>9.1f}%   {}".format(ky_tu, muc, ket_luan))

    print("-" * 62)
    khac_ro.sort(key=lambda x: -x[1])
    if khac_ro:
        print("Chu khac ro nhat, nen dung cho o kiem tra font:")
        print("   " + "  ".join("{} ({:.0f}%)".format(c, m) for c, m in khac_ro))
    else:
        print("Khong tim thay chu nao khac ro.")

    xuat_anh_so_sanh(khac_ro[:8], font_t, font_n)


if __name__ == "__main__":
    main()
