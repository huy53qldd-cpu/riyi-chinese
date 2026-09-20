# -*- coding: utf-8 -*-
"""
Công cụ CẮT NHỎ FONT (subset).

VÌ SAO CẦN:
  Font CJK bản đầy đủ rất nặng — Noto Sans SC là 17.8 MB, Noto Sans JP là 9.6 MB.
  Nếu bắt điện thoại tải ngần ấy qua mạng 4G thì app sẽ chậm không dùng được.
  Cắt nhỏ chỉ giữ lại đúng những ký tự app thực sự dùng, thường giảm còn
  dưới 1 MB.

CÁCH HOẠT ĐỘNG:
  Script tự đi gom ký tự từ 5 nguồn, nên KHI THÊM BÀI HỌC MỚI chỉ cần chạy lại
  là font tự có thêm chữ mới, không phải khai báo tay:

    1. cong-cu/bo-ky-tu.txt   — chữ HSK 1-3 rút từ PDF chính thức
    2. Chữ phồn thể           — đổi tự động từ chữ giản thể (cho cột đối chiếu)
    3. Mọi file .json         — trong src/du-lieu/ và public/du-lieu/
    4. Mọi file .jsx và .js   — để bắt chữ Hán viết thẳng trong giao diện
    5. cong-cu/ky-tu-them.txt — chỗ thêm tay, dùng khi cần ký tự đặc biệt

CÁCH CHẠY:
    npm run cat-font
"""

import json
import re
import unicodedata
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

FONT_GOC = Path("cong-cu/font-goc")
FONT_RA = Path("public/fonts")
BO_KY_TU = Path("cong-cu/bo-ky-tu.txt")
KY_TU_THEM = Path("cong-cu/ky-tu-them.txt")

THU_MUC_DU_LIEU = [Path("src/du-lieu"), Path("public/du-lieu")]
THU_MUC_MA_NGUON = [Path("src")]

HAN = re.compile(r"[一-鿿㐀-䶿豈-﫿]")
KANA = re.compile(r"[぀-ヿ]")


def gom_tu_file_chu(duong_dan):
    """Đọc mọi ký tự trong một file chữ."""
    if not duong_dan.exists():
        return set()
    return set(duong_dan.read_text(encoding="utf-8"))


def gom_tu_json(thu_muc):
    """
    Lấy mọi ký tự xuất hiện trong dữ liệu bài học.

    Đọc cả khoá lẫn giá trị, vì chữ Hán có thể nằm ở cả hai chỗ.
    """
    bo = set()
    for goc in thu_muc:
        if not goc.exists():
            continue
        for tep in goc.rglob("*.json"):
            try:
                du_lieu = json.loads(tep.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                print("  ! Bo qua file JSON doc khong duoc:", tep)
                continue
            bo.update(_duyet(du_lieu))
    return bo


def _duyet(nut):
    """Đi khắp mọi ngóc ngách của dữ liệu JSON để nhặt chữ."""
    ra = set()
    if isinstance(nut, str):
        ra.update(nut)
    elif isinstance(nut, dict):
        for khoa, gia_tri in nut.items():
            ra.update(khoa)
            ra.update(_duyet(gia_tri))
    elif isinstance(nut, list):
        for muc in nut:
            ra.update(_duyet(muc))
    return ra


def gom_tu_ma_nguon(thu_muc):
    """
    Lấy chữ Hán và kana viết thẳng trong file giao diện.

    Cần thiết vì có chỗ viết chữ ngay trong code, ví dụ ô kiểm tra tự dạng
    dùng chữ 直 và 骨. Nếu không gom thì font thiếu đúng 2 chữ đó.
    """
    bo = set()
    for goc in thu_muc:
        if not goc.exists():
            continue
        for duoi in ("*.jsx", "*.js"):
            for tep in goc.rglob(duoi):
                chu = tep.read_text(encoding="utf-8", errors="ignore")
                bo.update(HAN.findall(chu))
                bo.update(KANA.findall(chu))
    return bo


def them_phon_the(bo):
    """
    Thêm chữ phồn thể tương ứng, phục vụ cột thứ 3 của bảng đối chiếu tự dạng
    ở Tab A (Giản thể | Tự dạng Nhật | Phồn thể).

    Dùng thư viện OpenCC. Nếu máy chưa cài thì bỏ qua và báo cho biết,
    chứ không làm hỏng cả việc cắt font.
    """
    try:
        from opencc import OpenCC
    except ImportError:
        print("  ! Chua cai opencc, bo qua phan chu phon the.")
        print("    Cai bang lenh: python -m pip install opencc-python-reimplemented")
        return set()

    cc = OpenCC("s2t")
    them = set()
    for ky_tu in list(bo):
        if HAN.match(ky_tu):
            them.update(cc.convert(ky_tu))
    return them - bo


def cat(ten_font_goc, ten_font_ra, ky_tu, ten_hien_thi):
    """Cắt một font theo bộ ký tự đã cho và ghi ra file .woff2."""
    duong_dan_goc = FONT_GOC / ten_font_goc
    if not duong_dan_goc.exists():
        print("  ! Khong tim thay font goc:", duong_dan_goc)
        return None

    font = TTFont(str(duong_dan_goc))

    # Chỉ giữ những ký tự font đó THỰC SỰ có. Ví dụ font Nunito không có chữ
    # Hán, nên đòi nó giữ chữ Hán sẽ báo lỗi.
    co_san = set()
    for bang in font["cmap"].tables:
        co_san.update(bang.cmap.keys())
    giu = {c for c in ky_tu if ord(c) in co_san}
    thieu = ky_tu - giu

    tuy_chon = subset.Options()
    tuy_chon.flavor = "woff2"
    # Giữ layout cơ bản để chữ Hán và kana ghép nét đúng
    tuy_chon.layout_features = ["*"]
    # Giữ trục độ đậm của font biến thiên, để dùng được cả chữ thường lẫn đậm
    tuy_chon.retain_gids = False
    tuy_chon.desubroutinize = False
    tuy_chon.name_IDs = ["*"]
    tuy_chon.notdef_outline = True
    tuy_chon.drop_tables = []

    bo_cat = subset.Subsetter(options=tuy_chon)
    bo_cat.populate(unicodes=[ord(c) for c in giu])
    bo_cat.subset(font)

    FONT_RA.mkdir(parents=True, exist_ok=True)
    duong_dan_ra = FONT_RA / ten_font_ra
    font.flavor = "woff2"
    font.save(str(duong_dan_ra))
    font.close()

    goc_mb = duong_dan_goc.stat().st_size / 1024 / 1024
    ra_kb = duong_dan_ra.stat().st_size / 1024
    print(
        "  {:<16} {:>6} ky tu | {:>7.1f} MB -> {:>6.0f} KB".format(
            ten_hien_thi, len(giu), goc_mb, ra_kb
        )
    )
    return thieu


def main():
    print("Dang gom ky tu can dung...")

    bo = set()
    bo |= gom_tu_file_chu(BO_KY_TU)
    n1 = len(bo)
    print("  Tu bo-ky-tu.txt (HSK 1-3) :", n1)

    them_json = gom_tu_json(THU_MUC_DU_LIEU) - bo
    bo |= them_json
    print("  Tu du lieu bai hoc (JSON) :", len(them_json), "ky tu moi")

    them_ma = gom_tu_ma_nguon(THU_MUC_MA_NGUON) - bo
    bo |= them_ma
    print("  Tu ma nguon giao dien     :", len(them_ma), "ky tu moi")

    them_tay = gom_tu_file_chu(KY_TU_THEM) - bo
    bo |= them_tay
    print("  Tu ky-tu-them.txt         :", len(them_tay), "ky tu moi")

    phon_the = them_phon_the(bo)
    bo |= phon_the
    print("  Chu phon the them vao     :", len(phon_the), "ky tu moi")

    # Bỏ ký tự điều khiển và ký tự xuống dòng, font không cần
    bo = {c for c in bo if unicodedata.category(c)[0] != "C"}
    bo.add(" ")

    so_han = sum(1 for c in bo if HAN.match(c))
    print()
    print("TONG CONG: {} ky tu ({} chu Han)".format(len(bo), so_han))
    print()

    print("Dang cat font...")
    cat("noto-sans-sc.ttf", "noto-sans-sc-subset.woff2", bo, "Noto Sans SC")
    cat("noto-sans-jp.ttf", "noto-sans-jp-subset.woff2", bo, "Noto Sans JP")

    # Nunito chỉ dùng cho chữ Việt và pinyin, không cần chữ Hán và kana
    bo_latin = {c for c in bo if not HAN.match(c) and not KANA.match(c)}
    cat("nunito.ttf", "nunito-subset.woff2", bo_latin, "Nunito")

    print()
    print("Xong. Font da nam trong public/fonts/")


if __name__ == "__main__":
    main()
