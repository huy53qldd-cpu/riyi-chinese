# -*- coding: utf-8 -*-
"""
Công cụ DỰNG DỮ LIỆU NÉT VIẾT cho chế độ tập viết (Tab A, giai đoạn 2).

MỖI CHỮ CÓ HAI BỘ NÉT:
  - Chữ giản thể (Trung): lấy từ hanzi-writer-data (giấy phép Arphic).
    Tải về nguyên dạng, không sửa.
  - Chữ Nhật: lấy từ KanjiVG (Ulrich Apel, CC BY-SA 3.0) trong thư mục
    kanji_kakijun/ trên máy. KanjiVG chỉ có ĐƯỜNG TÂM của từng nét, còn thư viện
    HanziWriter cần thêm HÌNH TÔ KÍN của nét, nên script tự vẽ hình tô kín bằng
    cách làm dày đường tâm. Hình này không thon dần như bản gốc, nhưng đủ để
    tập viết.

CÁCH CHẠY (tự đọc danh sách chữ từ public/du-lieu/chu-han-hsk*.json):
    npm run dung-net-viet

KẾT QUẢ:
    public/du-lieu/net-viet/trung/<chữ>.json
    public/du-lieu/net-viet/nhat/<chữ>.json
    public/du-lieu/net-viet/GIAY-PHEP.txt
"""

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from shapely.geometry import LineString
from svgpathtools import parse_path

THU_MUC_DU_LIEU = Path("public/du-lieu")
RA = THU_MUC_DU_LIEU / "net-viet"
KANJIVG = Path("kanji_kakijun/kanjivg-20250816-all/kanji")
PHIEN_BAN_HANZI = "2.0.1"
URL_HANZI = f"https://cdn.jsdelivr.net/npm/hanzi-writer-data@{PHIEN_BAN_HANZI}/"

# KanjiVG vẽ trong khung 109x109. HanziWriter dùng khung 1024, trục y hướng LÊN
# và đường cơ sở ở y=900, nên phải đổi toạ độ: y_hanzi = 900 - y_kanjivg * TL
TI_LE = 1024 / 109
# Độ dày nét (nửa bề rộng, tính theo đơn vị KanjiVG). Chọn qua xem ảnh thử.
NUA_DO_DAY = 2.6
# Số điểm lấy mẫu dọc mỗi nét, đủ mượt để chấm nét viết
SO_DIEM = 24


def doi_toa_do(x, y):
    return (round(x * TI_LE), round(900 - y * TI_LE))


def duong_tam(d):
    """Lấy mẫu đường tâm của một nét (chuỗi path SVG) thành danh sách điểm."""
    path = parse_path(d)
    diem = [path.point(i / (SO_DIEM - 1)) for i in range(SO_DIEM)]
    return [(p.real, p.imag) for p in diem]


def hinh_to_kin(diem):
    """Làm dày đường tâm thành hình tô kín, trả về chuỗi path SVG (toạ độ HanziWriter)."""
    vung = LineString(diem).buffer(NUA_DO_DAY, cap_style="round", join_style="round")
    toa_do = [doi_toa_do(x, y) for x, y in vung.exterior.coords]
    return "M " + " L ".join(f"{x} {y}" for x, y in toa_do) + " Z"


def tu_kanjivg(chu):
    """Đọc file SVG của KanjiVG, trả về dữ liệu theo định dạng HanziWriter."""
    tep = KANJIVG / f"{ord(chu):05x}.svg"
    if not tep.exists():
        return None
    noi_dung = tep.read_text(encoding="utf-8")
    # Mỗi nét là một <path id="kvg:MÃ-sN" d="...">, N là thứ tự nét
    cac_net = re.findall(r'<path id="kvg:[0-9a-f]+-s(\d+)"[^>]*? d="([^"]+)"', noi_dung)
    cac_net.sort(key=lambda m: int(m[0]))

    strokes, medians = [], []
    for _, d in cac_net:
        diem = duong_tam(d)
        strokes.append(hinh_to_kin(diem))
        medians.append([list(doi_toa_do(x, y)) for x, y in diem])
    return {"strokes": strokes, "medians": medians, "radStrokes": []}


def tu_hanzi_writer(chu):
    """Tải dữ liệu nét của chữ giản thể từ hanzi-writer-data, giữ nguyên."""
    url = URL_HANZI + urllib.parse.quote(chu) + ".json"
    try:
        return json.load(urllib.request.urlopen(url, timeout=30))
    except Exception:
        return None


def ghi(duong_dan, du_lieu):
    duong_dan.parent.mkdir(parents=True, exist_ok=True)
    duong_dan.write_text(json.dumps(du_lieu, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def dung():
    cac_chu = []
    for tep in sorted(THU_MUC_DU_LIEU.glob("chu-han-hsk*.json")):
        cac_chu += json.loads(tep.read_text(encoding="utf-8"))["danhSach"]

    thieu = []
    for m in cac_chu:
        for thu_muc, chu, ham in (
            ("trung", m["gianThe"], tu_hanzi_writer),
            ("nhat", m["tuDangNhat"], tu_kanjivg),
        ):
            # Chữ tiếng Nhật không dùng (tuDangNhat = null) thì không có bộ nét Nhật
            if chu is None:
                continue
            du_lieu = ham(chu)
            if du_lieu is None:
                thieu.append(f"{thu_muc}/{chu}")
                continue
            ghi(RA / thu_muc / f"{chu}.json", du_lieu)
            print(f"{thu_muc:5} {chu}  {len(du_lieu['strokes'])} nét")

    # Tệp giấy phép đi kèm dữ liệu nét
    giay_phep = urllib.request.urlopen(URL_HANZI + "ARPHICPL.TXT", timeout=30).read().decode("utf-8", "replace")
    (RA / "GIAY-PHEP.txt").write_text(
        "DỮ LIỆU NÉT VIẾT — NGUỒN VÀ GIẤY PHÉP\n\n"
        "- trung/ : hanzi-writer-data (Make Me a Hanzi), dùng theo Arphic Public License. Nội dung giấy phép ở dưới.\n"
        "- nhat/  : KanjiVG, bản quyền Ulrich Apel, giấy phép CC BY-SA 3.0\n"
        "           https://creativecommons.org/licenses/by-sa/3.0/  (đã chuyển đường tâm thành hình tô kín)\n\n"
        "==== ARPHIC PUBLIC LICENSE ====\n\n" + giay_phep,
        encoding="utf-8",
    )
    if thieu:
        print("\nKHÔNG CÓ DỮ LIỆU NÉT:", ", ".join(thieu))


if __name__ == "__main__":
    dung()
