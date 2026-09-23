# -*- coding: utf-8 -*-
"""
Công cụ DỰNG BẢNG NGÀY ĐẶC BIỆT cho thông báo 7h sáng (quyết định 18.40).

Danh sách ngày lễ Việt Nam – Trung Quốc – Nhật Bản do chủ dự án đưa. Công cụ
này chỉ QUY ĐỔI ra ngày dương lịch cụ thể cho từng năm:

  - Ngày âm lịch Việt Nam tính theo UTC+7, ngày âm lịch Trung Quốc theo UTC+8
    (hai bên có năm lệch nhau 1 ngày, xem cong-cu/lich_am.py).
  - Thanh Minh, Xuân phân, Thu phân tính theo kinh độ Mặt Trời.
  - Ngày Thành nhân (Nhật) là thứ Hai tuần thứ hai của tháng 1.

Một ngày dương trùng nhiều dịp thì chỉ giữ MỘT, thứ tự ưu tiên:
Việt Nam → Trung Quốc → Nhật Bản.

CÁCH CHẠY:
    npm run dung-ngay-dac-biet
KẾT QUẢ:
    public/du-lieu/ngay-dac-biet.json  (thông báo 7h đọc file này)
    In ra bảng [ngày dương | tên ngày | quốc gia] để người kiểm tra rà lại.

CHƯA KIỂM TRA: bảng do máy tính ra, chủ dự án phải rà trước khi dùng thật.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lich_am import am_sang_duong, ngay_tiet_khi, thu_n_trong_thang  # noqa: E402

NAM = [2026, 2027]
RA = Path("public/du-lieu/ngay-dac-biet.json")

VN, TQ, NB = "Việt Nam", "Trung Quốc", "Nhật Bản"
MUI_VN, MUI_TQ, MUI_NB = 7, 8, 9

# (tên ngày, quốc gia, cụm từ trong câu thông báo, cách tính)
#   ("duong", dd, mm)          : ngày dương lịch cố định
#   ("am", ngay, thang, mui)   : ngày âm lịch (mui = múi giờ tính âm lịch)
#   ("tiet", goc_do, mui)      : tiết khí theo kinh độ Mặt Trời
#   ("thu", thang, thu, lan)   : thứ `thu` (0 = thứ Hai) lần thứ `lan` của tháng
NGAY_LE = [
    # --- Việt Nam ---
    ("Tết Dương lịch", VN, "năm mới khởi đầu", ("duong", 1, 1)),
    ("Tết Nguyên đán", VN, "ngày Tết", ("am", 1, 1, MUI_VN)),
    ("Rằm tháng Giêng", VN, "ngày Rằm", ("am", 15, 1, MUI_VN)),
    ("Ngày Quốc tế Phụ nữ", VN, "ngày 8/3", ("duong", 8, 3)),
    ("Giỗ Tổ Hùng Vương", VN, "ngày Giỗ Tổ ý nghĩa", ("am", 10, 3, MUI_VN)),
    ("Ngày Giải phóng miền Nam", VN, "ngày lễ", ("duong", 30, 4)),
    ("Ngày Quốc tế Lao động", VN, "ngày nghỉ lễ", ("duong", 1, 5)),
    ("Tết Đoan ngọ", VN, "ngày Đoan ngọ", ("am", 5, 5, MUI_VN)),
    ("Ngày Quốc tế Thiếu nhi", VN, "ngày Thiếu nhi", ("duong", 1, 6)),
    ("Lễ Vu Lan", VN, "ngày Vu Lan", ("am", 15, 7, MUI_VN)),
    ("Tết Trung thu", VN, "ngày Trung thu", ("am", 15, 8, MUI_VN)),
    ("Ngày Quốc khánh", VN, "ngày Quốc khánh", ("duong", 2, 9)),
    ("Ngày Phụ nữ Việt Nam", VN, "ngày 20/10", ("duong", 20, 10)),
    ("Ngày Nhà giáo Việt Nam", VN, "ngày tri ân thầy cô", ("duong", 20, 11)),
    ("Ngày Giáng sinh", VN, "ngày Giáng sinh", ("duong", 25, 12)),
    ("Ngày ông Công ông Táo", VN, "ngày tiễn Táo quân", ("am", 23, 12, MUI_VN)),
    # --- Trung Quốc ---
    ("春节 (Xuân Tiết)", TQ, "ngày Tết kiểu Trung Hoa", ("am", 1, 1, MUI_TQ)),
    ("元宵节 (Tết Nguyên Tiêu)", TQ, "ngày Nguyên Tiêu", ("am", 15, 1, MUI_TQ)),
    ("清明节 (Tiết Thanh Minh)", TQ, "ngày Thanh Minh", ("tiet", 15, MUI_TQ)),
    ("端午节 (Tết Đoan Ngọ)", TQ, "ngày Đoan Ngọ", ("am", 5, 5, MUI_TQ)),
    ("七夕 (Thất Tịch)", TQ, "ngày Thất Tịch", ("am", 7, 7, MUI_TQ)),
    ("中秋节 (Tết Trung Thu)", TQ, "ngày Trung Thu", ("am", 15, 8, MUI_TQ)),
    ("重阳节 (Tết Trùng Dương)", TQ, "ngày Trùng Dương", ("am", 9, 9, MUI_TQ)),
    ("教师节 (Ngày Nhà giáo)", TQ, "ngày Nhà giáo", ("duong", 10, 9)),
    ("国庆节 (Quốc khánh)", TQ, "ngày Quốc khánh", ("duong", 1, 10)),
    # --- Nhật Bản ---
    ("元日 (Ganjitsu – Năm mới)", NB, "ngày đầu năm", ("duong", 1, 1)),
    ("成人の日 (Ngày Thành nhân)", NB, "ngày Thành nhân", ("thu", 1, 0, 2)),
    ("建国記念の日 (Ngày Kiến quốc)", NB, "ngày Kiến quốc", ("duong", 11, 2)),
    ("ひな祭り (Lễ hội búp bê)", NB, "ngày Hinamatsuri", ("duong", 3, 3)),
    ("春分の日 (Xuân phân)", NB, "ngày Xuân phân", ("tiet", 0, MUI_NB)),
    ("こどもの日 (Ngày Thiếu nhi)", NB, "ngày Kodomo no hi", ("duong", 5, 5)),
    ("七夕 (Tanabata)", NB, "ngày Tanabata", ("duong", 7, 7)),
    ("お盆 (Obon)", NB, "mùa Obon", ("duong", 13, 8)),
    ("秋分の日 (Thu phân)", NB, "ngày Thu phân", ("tiet", 180, MUI_NB)),
    ("七五三 (Shichi-Go-San)", NB, "ngày Shichi-Go-San", ("duong", 15, 11)),
    ("大晦日 (Đêm giao thừa)", NB, "ngày cuối năm", ("duong", 31, 12)),
]

UU_TIEN = {VN: 0, TQ: 1, NB: 2}


def cac_ngay_cua_le(cach, nam):
    """Ngày dương (yyyy-mm-dd) của một dịp trong năm `nam`. Có thể rỗng."""
    loai = cach[0]
    if loai == "duong":
        _, dd, mm = cach
        return [(nam, mm, dd)]
    if loai == "thu":
        _, thang, thu, lan = cach
        dd, mm, yy = thu_n_trong_thang(nam, thang, thu, lan)
        return [(yy, mm, dd)]
    if loai == "tiet":
        _, goc, mui = cach
        kq = ngay_tiet_khi(nam, goc, mui)
        return [(kq[2], kq[1], kq[0])] if kq else []
    # Âm lịch: năm âm lịch nào rơi vào năm dương này thì lấy (23/12 âm rơi sang năm sau)
    _, ngay, thang, mui = cach
    ra = []
    for nam_am in (nam - 1, nam, nam + 1):
        kq = am_sang_duong(ngay, thang, nam_am, False, mui)
        if kq and kq[2] == nam:
            ra.append((kq[2], kq[1], kq[0]))
    return ra


def dung():
    tho = []
    for nam in NAM:
        for ten, quoc_gia, cum, cach in NGAY_LE:
            for yy, mm, dd in cac_ngay_cua_le(cach, nam):
                tho.append({
                    "ngay": f"{yy:04d}-{mm:02d}-{dd:02d}",
                    "ten": ten,
                    "quocGia": quoc_gia,
                    "cum": cum,
                })

    # Một ngày chỉ giữ một dịp: Việt Nam → Trung Quốc → Nhật Bản
    tho.sort(key=lambda m: (m["ngay"], UU_TIEN[m["quocGia"]]))
    giu, bo = [], []
    for m in tho:
        if giu and giu[-1]["ngay"] == m["ngay"]:
            bo.append(m)
        else:
            giu.append(m)

    RA.write_text(
        json.dumps({
            "loai": "ngay-dac-biet",
            "phienBan": 1,
            "nguon": "Danh sách ngày lễ do chủ dự án đưa; ngày âm lịch và tiết khí quy đổi bằng thuật toán Hồ Ngọc Đức (cong-cu/lich_am.py), âm lịch Việt Nam theo UTC+7, Trung Quốc theo UTC+8.",
            "cangKiemTra": "Bảng do máy quy đổi, chủ dự án cần rà lại trước khi dùng thật.",
            "nam": NAM,
            "danhSach": giu,
        }, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )

    print(f"Đã ghi {len(giu)} ngày vào {RA} (bỏ {len(bo)} dịp trùng ngày)\n")
    print(f"{'NGÀY DƯƠNG':12} | {'TÊN NGÀY':30} | QUỐC GIA")
    print("-" * 62)
    for m in giu:
        print(f"{m['ngay']:12} | {m['ten']:30} | {m['quocGia']}")
    if bo:
        print("\nTrùng ngày, KHÔNG gửi (đã có dịp ưu tiên hơn):")
        for m in bo:
            print(f"{m['ngay']:12} | {m['ten']:30} | {m['quocGia']}")


if __name__ == "__main__":
    dung()
