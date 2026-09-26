# -*- coding: utf-8 -*-
"""
=============================================================================
CẮT ẢNH MINH HỌA TỪ GIÁO TRÌNH CHO PHẦN 2 (quyết định 18.66, 18.67)
=============================================================================

Sách HSK标准教程 1 là ảnh scan nguyên trang (2360 × 3283 px, ảnh xám). Công cụ
cắt CHỌN LỌC các ảnh dùng trong bài (ảnh hội thoại, ảnh khởi động, ảnh từ đọc
theo tranh, hình khẩu hình phát âm). KHÔNG lấy: ảnh người nổi tiếng ở phần bài
tập / vận dụng, ảnh trang văn hóa, và mọi phần ngoài khung ảnh (chân trang có
chữ của trang nguồn nằm ngoài mọi khung).

Toạ độ trong bảng ANH đo trên bản render trang rộng 1505 px (x1, y1, x2, y2);
hệ số K đổi sang điểm ảnh của bản scan. Mỗi cạnh thu vào 4 px để không dính
viền ô hoặc chữ chú thích.

Đầu ra: public/du-lieu/co-ban/hsk1/hinh/bai-XX/<tên>.webp, rộng tối đa 480 px,
WebP chất lượng 60 (ảnh gốc là ảnh xám nên file rất nhẹ).

Cách chạy:  python cong-cu/cat-anh-co-ban.py
=============================================================================
"""

import io
import os
from pathlib import Path

import pymupdf
from PIL import Image

GOC = Path(__file__).resolve().parent.parent
RA = GOC / "public" / "du-lieu" / "co-ban" / "hsk1" / "hinh"
K = 1.568  # 1 px bản render rộng 1505 px = 1,568 px bản scan
THU = 4
RONG_TOI_DA = 480


def luoi(ten, trang, cot, hang, bat_dau=1):
    """Ảnh xếp dạng lưới: cot = [(x1,x2)...], hang = [(y1,y2)...] -> tên-1, tên-2..."""
    ra, i = [], bat_dau
    for y1, y2 in hang:
        for x1, x2 in cot:
            ra.append((f"{ten}-{i}", trang, (x1, y1, x2, y2)))
            i += 1
    return ra


def sau_o(trang, o):
    """Khởi động: 6 ảnh A–F."""
    return [(f"khoi-dong-{c}", trang, b) for c, b in zip("ABCDEF", o)]


ANH = {
    1: [
        ("hoi-thoai-1", 21, (559, 410, 926, 687)),
        ("hoi-thoai-2", 21, (558, 972, 926, 1330)),
        ("hoi-thoai-3", 21, (558, 1532, 920, 1895)),
        *luoi("am-01-6", 23, [(327, 573), (596, 842), (865, 1111), (1133, 1381)],
              [(1196, 1374), (1453, 1632), (1708, 1886)]),
        *luoi("am-01-7", 24, [(328, 507), (551, 798), (843, 1091), (1135, 1384)], [(338, 518)]),
        *luoi("am-01-7", 24, [(329, 576), (598, 845), (866, 1114), (1136, 1385)], [(596, 775)], 5),
    ],
    2: [
        ("hoi-thoai-1", 27, (551, 400, 854, 773)),
        ("hoi-thoai-2", 27, (551, 1001, 929, 1332)),
        ("hoi-thoai-3", 27, (552, 1561, 929, 1890)),
        *luoi("am-02-5", 28, [(318, 564), (587, 833), (855, 1102), (1124, 1371)],
              [(896, 1073), (1162, 1340), (1424, 1602), (1691, 1869)]),
        *luoi("am-02-6", 29, [(335, 581), (603, 850), (872, 1119), (1141, 1388)], [(337, 515), (589, 768)]),
        *luoi("thanh-nhe", 29, [(334, 580), (602, 849), (870, 1117), (1140, 1387)], [(1208, 1385)]),
    ],
    3: [
        *sau_o(33, [(307, 457, 630, 677), (684, 457, 1008, 667), (1062, 457, 1387, 667),
                    (307, 737, 630, 948), (684, 737, 1008, 948), (1062, 737, 1387, 948)]),
        ("hoi-thoai-1", 33, (850, 1340, 1068, 1577)),
        ("hoi-thoai-2", 34, (296, 241, 683, 493)),
        ("hoi-thoai-3", 34, (978, 888, 1356, 1133)),
        ("mieng-j", 36, (350, 1615, 567, 1885)),
        ("mieng-q", 36, (720, 1615, 955, 1885)),
        ("mieng-x", 36, (1100, 1615, 1325, 1885)),
        ("mieng-z", 37, (352, 890, 570, 1160)),
        ("mieng-c", 37, (705, 890, 955, 1160)),
        ("mieng-s", 37, (1093, 890, 1340, 1160)),
        ("mieng-i", 38, (355, 445, 585, 717)),
        ("mieng-u", 38, (713, 445, 965, 717)),
        ("mieng-v", 38, (1096, 445, 1345, 717)),
    ],
    4: [
        *sau_o(41, [(285, 463, 608, 674), (711, 463, 937, 674), (1040, 463, 1365, 674),
                    (285, 733, 608, 944), (711, 733, 937, 944), (1040, 733, 1365, 944)]),
        ("hoi-thoai-1", 41, (954, 1393, 1341, 1645)),
        ("hoi-thoai-2", 42, (296, 247, 678, 495)),
        ("hoi-thoai-3", 42, (886, 820, 1268, 1072)),
        ("mieng-zh", 44, (338, 1645, 555, 1918)),
        ("mieng-ch", 44, (590, 1645, 835, 1918)),
        ("mieng-sh", 44, (870, 1645, 1115, 1918)),
        ("mieng-r", 44, (1150, 1645, 1397, 1918)),
        ("mieng-n", 45, (470, 1155, 705, 1425)),
        ("mieng-ng", 45, (880, 1155, 1122, 1425)),
    ],
    5: [
        *sau_o(49, [(298, 454, 622, 665), (677, 454, 1001, 665), (1056, 454, 1381, 665),
                    (298, 731, 510, 942), (677, 731, 1001, 942), (1056, 731, 1381, 942)]),
        ("hoi-thoai-1", 49, (800, 1405, 1052, 1668)),
        ("hoi-thoai-2", 50, (300, 272, 768, 578)),
        ("hoi-thoai-3", 50, (820, 1268, 1285, 1572)),
        ("er-hoa-1", 53, (299, 464, 625, 673)),
        ("er-hoa-2", 53, (697, 464, 895, 673)),
        ("er-hoa-3", 53, (968, 464, 1127, 673)),
        ("er-hoa-4", 53, (1206, 464, 1376, 673)),
    ],
}


def anh_trang(d, so, bo_dem):
    if so not in bo_dem:
        p = d[so - 1]
        pix = pymupdf.Pixmap(d, p.get_images()[0][0])
        bo_dem[so] = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")
    return bo_dem[so]


def main():
    f = next(Path(r) / x for r, _, fs in os.walk(GOC / "Giao_trinh" / "HSK1") for x in fs if x.endswith("HSK标准教程1.pdf"))
    d = pymupdf.open(f)
    bo_dem, tong, dem = {}, 0, 0
    for bai, ds in ANH.items():
        thu_muc = RA / f"bai-{bai:02d}"
        thu_muc.mkdir(parents=True, exist_ok=True)
        for ten, trang, (x1, y1, x2, y2) in ds:
            anh = anh_trang(d, trang, bo_dem).crop(
                (round((x1 + THU) * K), round((y1 + THU) * K), round((x2 - THU) * K), round((y2 - THU) * K)))
            if anh.width > RONG_TOI_DA:
                anh = anh.resize((RONG_TOI_DA, round(anh.height * RONG_TOI_DA / anh.width)), Image.LANCZOS)
            ra = thu_muc / f"{ten}.webp"
            anh.save(ra, "WEBP", quality=60, method=6)
            tong += ra.stat().st_size
            dem += 1
    print(f"{dem} ảnh, {tong / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
