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
    ],    6: [
        *sau_o(59, [(300, 467, 624, 680), (680, 467, 1003, 680), (1059, 467, 1384, 680),
                    (300, 741, 624, 954), (680, 741, 1002, 954), (1059, 741, 1384, 954)]),
        ("hoi-thoai-1", 59, (891, 1380, 1353, 1685)),
        ("hoi-thoai-2", 60, (270, 282, 730, 586)),
        ("hoi-thoai-3", 60, (887, 1155, 1351, 1458)),
        ("phoi-thanh-1", 63, (350, 540, 560, 720)),
        ("phoi-thanh-2", 63, (599, 530, 857, 738)),
        ("phoi-thanh-3", 63, (875, 530, 1133, 738)),
        ("phoi-thanh-4", 63, (1150, 530, 1408, 740)),
    ],
    7: [
        *sau_o(67, [(290, 439, 612, 648), (717, 439, 941, 648), (1047, 439, 1370, 648),
                    (290, 699, 612, 908), (717, 699, 941, 908), (1047, 699, 1370, 908)]),
        ("hoi-thoai-1", 67, (975, 1275, 1262, 1612)),
        ("hoi-thoai-2", 68, (310, 275, 680, 630)),
        ("hoi-thoai-3", 68, (859, 1107, 1363, 1437)),
        ("phoi-thanh-1", 71, (340, 1390, 560, 1545)),
        ("phoi-thanh-2", 71, (600, 1388, 838, 1542)),
        ("phoi-thanh-3", 71, (885, 1388, 1121, 1535)),
        ("phoi-thanh-4", 71, (1230, 1388, 1347, 1542)),
    ],
    8: [
        *sau_o(75, [(290, 447, 515, 657), (620, 447, 943, 657), (1046, 447, 1370, 657),
                    (290, 715, 515, 926), (620, 715, 943, 926), (1046, 715, 1372, 926)]),
        ("hoi-thoai-1", 75, (817, 1310, 1295, 1620)),
        ("hoi-thoai-2", 76, (305, 285, 545, 633)),
        ("hoi-thoai-3", 76, (824, 1162, 1330, 1490)),
        ("phoi-thanh-1", 79, (355, 1360, 470, 1525)),
        ("phoi-thanh-2", 79, (620, 1380, 820, 1510)),
        ("phoi-thanh-3", 79, (940, 1360, 1045, 1530)),
        ("phoi-thanh-4", 79, (1175, 1370, 1375, 1510)),
    ],
    9: [
        *sau_o(83, [(296, 440, 620, 650), (686, 440, 1008, 650), (1085, 440, 1308, 650),
                    (298, 684, 620, 894), (686, 684, 1008, 894), (1085, 684, 1308, 894)]),
        ("hoi-thoai-1", 83, (798, 1250, 1221, 1527)),
        ("hoi-thoai-2", 84, (345, 295, 560, 640)),
        ("hoi-thoai-3", 84, (781, 1235, 1254, 1542)),
        ("phoi-thanh-1", 87, (330, 585, 555, 715)),
        ("phoi-thanh-2", 87, (625, 585, 850, 740)),
        ("phoi-thanh-3", 87, (928, 590, 1093, 740)),
        ("phoi-thanh-4", 87, (1195, 585, 1370, 740)),
    ],
    10: [
        *sau_o(91, [(286, 421, 609, 631), (716, 421, 938, 631), (1044, 421, 1368, 631),
                    (286, 675, 609, 886), (716, 675, 938, 886), (1044, 675, 1368, 886)]),
        ("hoi-thoai-1", 91, (960, 1263, 1381, 1510)),
        ("hoi-thoai-2", 92, (302, 282, 711, 596)),
        ("hoi-thoai-3", 92, (785, 1250, 1221, 1535)),
        ("thanh-nhe-1", 95, (335, 1760, 540, 1925)),
        ("thanh-nhe-2", 95, (612, 1752, 828, 1920)),
        ("thanh-nhe-3", 95, (930, 1740, 1055, 1925)),
        ("thanh-nhe-4", 95, (1225, 1745, 1330, 1930)),
    ],
}


# Sách bài tập: ảnh lưu rời thành nhiều mảnh nhỏ (khoảng 230 px, bảng màu hạn chế).
# Gom các mảnh chạm nhau thành một tranh, render 216 dpi rồi thu nhỏ (khử nhiễu).
# Tên: bt-p<trang PDF>-<thứ tự trên trang, trái→phải, trên→dưới>.
BAI_TAP_TRANG = {1: range(9, 13), 2: range(13, 17), 3: range(17, 25), 4: range(25, 33), 5: range(33, 41),
                 6: range(41, 49), 7: range(49, 57), 8: range(57, 65), 9: range(65, 73), 10: range(73, 81)}


def gom_manh(rects):
    """Gộp các khung chạm/chồng nhau (sai lệch ≤ 1,5 pt) thành khung lớn."""
    hop = [list(r) for r in rects]
    doi = True
    while doi:
        doi = False
        for i in range(len(hop)):
            for j in range(i + 1, len(hop)):
                a, b = hop[i], hop[j]
                if a[0] <= b[2] + 1.5 and b[0] <= a[2] + 1.5 and a[1] <= b[3] + 1.5 and b[1] <= a[3] + 1.5:
                    hop[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
                    del hop[j]
                    doi = True
                    break
            if doi:
                break
    return hop


def cat_bai_tap():
    f = next(Path(r) / x for r, _, fs in os.walk(GOC / "Giao_trinh" / "HSK1") for x in fs if x.endswith("练习册.pdf"))
    d = pymupdf.open(f)
    tong = dem = 0
    for bai, trang in BAI_TAP_TRANG.items():
        thu_muc = RA / f"bai-{bai:02d}"
        thu_muc.mkdir(parents=True, exist_ok=True)
        for t in trang:
            p = d[t - 1]
            rects = [tuple(r) for im in p.get_images(full=True) for r in p.get_image_rects(im[0])]
            hop = [h for h in gom_manh(rects) if h[2] - h[0] >= 30 and h[3] - h[1] >= 30]  # bỏ biểu tượng đĩa CD
            hop.sort(key=lambda h: (round(h[1] / 25), h[0]))
            for i, h in enumerate(hop, 1):
                pix = p.get_pixmap(dpi=216, clip=pymupdf.Rect(*h))
                anh = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")
                anh.thumbnail((360, 360), Image.LANCZOS)
                ra = thu_muc / f"bt-p{t}-{i}.webp"
                anh.save(ra, "WEBP", quality=60, method=6)
                tong += ra.stat().st_size
                dem += 1
    print(f"Sách bài tập: {dem} ảnh, {tong / 1e6:.2f} MB")


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
    print(f"Sách giáo khoa: {dem} ảnh, {tong / 1e6:.2f} MB")
    cat_bai_tap()


if __name__ == "__main__":
    main()
