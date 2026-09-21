# -*- coding: utf-8 -*-
"""
Công cụ DỰNG FILE DỮ LIỆU CHỮ HÁN (Tab A).

CÁCH LÀM:
  Ghép hai nguồn thành file public/du-lieu/chu-han-hsk1.json:

    1. TỰ ĐỘNG từ nguồn mở (không gõ tay, không nhớ từ trí nhớ):
         - KANJIDIC2 (EDRDG): âm On, âm Kun, âm Hán Việt
         - Unihan (Unicode):  pinyin, phồn thể, số nét, bộ thủ
    2. NHẬP TAY từ cong-cu/chu-han-nhap-tay.json: nghĩa Trung/Nhật/Việt,
       từ ví dụ, nhãn so sánh tự dạng. Đây là bản nháp, cần người rà lại.

  Script còn ĐỐI CHIẾU: âm nhập tay phải nằm trong âm của nguồn mở. Chỗ nào
  lệch thì ghi vào cangKiemTra để người kiểm tra biết.

CÁCH CHẠY:
    python cong-cu/dung-chu-han.py
"""

import gzip
import json
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

THU_MUC_NGUON = Path("cong-cu/nguon-mo")
NHAP_TAY = Path("cong-cu/chu-han-nhap-tay.json")
FILE_RA = Path("public/du-lieu/chu-han-hsk1.json")
NGAY = "2026-09-20"

URL_KANJIDIC = "https://www.edrdg.org/kanjidic/kanjidic2.xml.gz"
URL_UNIHAN = "https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip"

# Bộ thủ giản thể trong Unihan ghi dạng 159' (dấu phẩy trên), không có trong
# bảng Khang Hy nên phải tra riêng.
BO_THU_GIAN_THE = {"159'": "车", "147'": "见", "149'": "讠"}


def tai_neu_chua_co(url):
    """Tải file nguồn về thư mục cache nếu chưa có."""
    THU_MUC_NGUON.mkdir(parents=True, exist_ok=True)
    dich = THU_MUC_NGUON / url.rsplit("/", 1)[1]
    if not dich.exists():
        print(f"Đang tải {url} ...")
        urllib.request.urlretrieve(url, dich)
    return dich


def doc_unihan():
    """Trả về {chữ: {tên trường: giá trị}} cho các trường cần dùng."""
    can = {"kMandarin", "kTotalStrokes", "kRSUnicode", "kTraditionalVariant"}
    kq = {}
    z = zipfile.ZipFile(tai_neu_chua_co(URL_UNIHAN))
    for ten in z.namelist():
        for dong in z.read(ten).decode("utf-8").splitlines():
            if dong.startswith("#") or not dong.strip():
                continue
            ma, truong, gia_tri = dong.split("\t", 2)
            if truong in can:
                kq.setdefault(chr(int(ma[2:], 16)), {})[truong] = gia_tri
    return kq


def doc_kanjidic():
    """Trả về {chữ: phần tử XML} của KANJIDIC2."""
    goc = ET.parse(gzip.open(tai_neu_chua_co(URL_KANJIDIC))).getroot()
    return {e.find("literal").text: e for e in goc.findall("character")}


def bo_thu(ma_rs):
    """Đổi mã bộ thủ của Unihan (ví dụ '39.5') thành chữ bộ thủ ('子')."""
    so_bo = ma_rs.split()[0].split(".")[0]
    if so_bo in BO_THU_GIAN_THE:
        return BO_THU_GIAN_THE[so_bo]
    # Khối "Kangxi Radicals" bắt đầu ở U+2F00, chuẩn hoá NFKC ra chữ thường
    return unicodedata.normalize("NFKC", chr(0x2F00 + int(so_bo) - 1))


def chuan_pinyin(so):
    """'xue2' -> 'xué'. KANJIDIC ghi số thanh, còn Unihan ghi sẵn dấu."""
    dau = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}
    if not so or not so[-1].isdigit():
        return so
    thanh, am = int(so[-1]), so[:-1].replace("v", "ü")
    if thanh == 5:
        return am
    # Quy tắc đặt dấu: a, e ưu tiên; "ou" đặt ở o; còn lại đặt ở nguyên âm cuối
    vi_tri = None
    for nguyen_am in "ae":
        if nguyen_am in am:
            vi_tri = am.index(nguyen_am)
            break
    if vi_tri is None and "ou" in am:
        vi_tri = am.index("o")
    if vi_tri is None:
        cac = [i for i, c in enumerate(am) if c in dau]
        vi_tri = cac[-1] if cac else None
    if vi_tri is None:
        return am
    return am[:vi_tri] + dau[am[vi_tri]][thanh - 1] + am[vi_tri + 1 :]


def dung():
    nhap = json.loads(NHAP_TAY.read_text(encoding="utf-8"))["danhSach"]
    unihan = doc_unihan()
    kanji = doc_kanjidic()
    ds = []

    for i, (gian, tay) in enumerate(nhap.items(), start=1):
        nhat = tay["tuDangNhat"]
        cang = list(tay.get("cangKiemTraThem", []))
        u = unihan[gian]
        e = kanji[nhat]

        # Phồn thể: Unihan có thể trả nhiều dạng, lấy dạng đầu và báo nếu nhiều
        bien_the = [chr(int(x[2:], 16)) for x in u.get("kTraditionalVariant", "").split()]
        phon = bien_the[0] if bien_the else gian
        if len(bien_the) > 1:
            cang.append(f"Phồn thể có nhiều dạng ({' '.join(bien_the)}), đang dùng {phon}.")

        # Âm Hán Việt lấy từ KANJIDIC2, thứ tự nguồn giữ nguyên
        hv = [r.text.lower() for r in e.iter("reading") if r.get("r_type") == "vietnam"]
        chinh_hv = tay.get("hanVietChinh", hv[0] if hv else None)
        han_viet = [{"am": a, "chinh": a == chinh_hv} for a in hv]

        # Đối chiếu pinyin nhập tay với Unihan và KANJIDIC2
        am_nguon = set(u.get("kMandarin", "").split()) | {
            chuan_pinyin(r.text) for r in e.iter("reading") if r.get("r_type") == "pinyin"
        }
        for m in tay["pinyin"]:
            if m["am"] not in am_nguon:
                cang.append(f"Pinyin {m['am']} không có trong Unihan/KANJIDIC2, cần kiểm tra.")

        # Đối chiếu âm On/Kun (KANJIDIC ghi katakana/hiragana, dấu . ngăn okurigana)
        on_nguon = {r.text for r in e.iter("reading") if r.get("r_type") == "ja_on"}
        kun_nguon = {r.text.replace(".", "-") for r in e.iter("reading") if r.get("r_type") == "ja_kun"}
        for m in tay["amOn"]:
            if m["am"] not in on_nguon:
                cang.append(f"Âm On {m['am']} không có trong KANJIDIC2, cần kiểm tra.")
        for m in tay["amKun"]:
            if m["am"] not in kun_nguon:
                cang.append(f"Âm Kun {m['am']} không có trong KANJIDIC2, cần kiểm tra.")

        # Mọi nghĩa và từ ví dụ là bản nháp nhập tay
        cang.append("Nghĩa Trung/Nhật/Việt và từ ví dụ là bản nháp, chưa có người xác minh.")

        ds.append({
            "id": f"han-{i:04d}",
            "capHsk": tay["capHsk"],
            "gianThe": gian,
            "tuDangNhat": nhat,
            "phonThe": phon,
            "soSanhTuDang": {
                "trungVsNhat": tay["trungVsNhat"],
                # Chỉ chữ cùng mã Unicode mới có thể khác nét vẽ. Giá trị này do
                # người quyết định (nhập tay), xem thêm npm run so-sanh-tu-dang.
                "khacNetVe": tay.get("khacNetVe", False),
                "ghiChu": tay.get("ghiChuTuDang"),
            },
            "amDoc": {
                "pinyin": tay["pinyin"],
                "amOn": tay["amOn"],
                "amKun": tay["amKun"],
                "amHanViet": han_viet,
            },
            "nghia": tay["nghia"],
            # Số nét và bộ thủ tính theo chữ giản thể (chữ Trung)
            "soNet": int(u["kTotalStrokes"].split()[0]),
            "boThu": bo_thu(u["kRSUnicode"]),
            # Pinyin của chính chữ bộ thủ, lấy từ Unihan, để hiện được ruby
            "boThuPinyin": unihan.get(bo_thu(u["kRSUnicode"]), {}).get("kMandarin", "").split()[:1],
            "cangKiemTra": cang,
        })

    FILE_RA.write_text(
        json.dumps({
            "loai": "chu-han",
            "cap": 1,
            "phienBan": 1,
            "capNhatLuc": NGAY,
            "nguon": "Chữ Hán lấy từ đại cương HSK 2025-11. Âm On/Kun/Hán Việt: KANJIDIC2 (EDRDG, CC BY-SA 4.0). Pinyin, phồn thể, số nét, bộ thủ: Unihan (Unicode).",
            "danhSach": ds,
        }, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Đã ghi {len(ds)} chữ vào {FILE_RA}")
    for m in ds:
        print(m["gianThe"], m["soNet"], m["boThu"], [c for c in m["cangKiemTra"] if "cần kiểm tra" in c])


if __name__ == "__main__":
    dung()
