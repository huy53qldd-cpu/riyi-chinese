# -*- coding: utf-8 -*-
"""
Công cụ TẢI CÁC FILE NGUỒN MỞ dùng để DỰNG LẠI dữ liệu bài học.

KHI NÀO CẦN:
  Chỉ khi muốn chạy lại các lệnh npm run dung-... trên một máy mới. App chạy và
  học được mà KHÔNG cần các file này, vì dữ liệu đã dựng xong nằm sẵn trong kho
  (public/du-lieu/).

TẢI VỀ ĐÂU (cả hai thư mục đều KHÔNG lưu trong kho Git vì rất nặng):
    cong-cu/nguon-mo/      KANJIDIC2, Unihan, JMdict, CC-CEDICT, CVDICT, Tatoeba
    kanji_kakijun/         KanjiVG (bộ nét chữ Nhật, dùng cho tập viết)

Tải tổng cộng khoảng 80 MB (KanjiVG thêm khoảng 270 MB sau khi giải nén).
File nào đã có thì bỏ qua, chạy lại nhiều lần không sao.

CÁCH CHẠY:
    npm run tai-nguon-mo
"""

import urllib.request
import zipfile
from pathlib import Path

NGUON_MO = Path("cong-cu/nguon-mo")
KANJIVG_ZIP = Path("kanji_kakijun/kanjivg-20250816-all.zip")
KANJIVG_THU_MUC = Path("kanji_kakijun/kanjivg-20250816-all")

TATOEBA = "https://downloads.tatoeba.org/exports/per_language/"

CAC_FILE = [
    # (tên file lưu, địa chỉ tải)
    ("kanjidic2.xml.gz", "https://www.edrdg.org/kanjidic/kanjidic2.xml.gz"),
    ("Unihan.zip", "https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip"),
    ("JMdict_e.gz", "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz"),
    ("cedict_1_0_ts_utf-8_mdbg.zip", "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.zip"),
    # Từ điển Trung–Việt (CC BY-SA 4.0), dịch từ CC-CEDICT. Nguồn nghĩa tiếng Việt từ GĐ 9.
    ("CVDICT.u8", "https://raw.githubusercontent.com/ph0ngp/CVDICT/main/CVDICT.u8"),
    ("jpn_sentences.tsv.bz2", TATOEBA + "jpn/jpn_sentences.tsv.bz2"),
    ("cmn_sentences.tsv.bz2", TATOEBA + "cmn/cmn_sentences.tsv.bz2"),
    ("vie_sentences.tsv.bz2", TATOEBA + "vie/vie_sentences.tsv.bz2"),
    ("cmn-jpn_links.tsv.bz2", TATOEBA + "cmn/cmn-jpn_links.tsv.bz2"),
    ("jpn-vie_links.tsv.bz2", TATOEBA + "jpn/jpn-vie_links.tsv.bz2"),
]

KANJIVG_URL = "https://github.com/KanjiVG/kanjivg/releases/download/r20250816/kanjivg-20250816-all.zip"


def tai(url, dich):
    if dich.exists():
        print(f"  đã có   {dich}")
        return
    dich.parent.mkdir(parents=True, exist_ok=True)
    print(f"  đang tải {dich.name} ...")
    # Tải ra file tạm rồi đổi tên, để tải dở không để lại file hỏng trông như đã xong
    tam = dich.with_name(dich.name + ".dang-tai")
    urllib.request.urlretrieve(url, tam)
    tam.rename(dich)


def main():
    print("Nguồn dữ liệu bài học:")
    for ten, url in CAC_FILE:
        tai(url, NGUON_MO / ten)

    print("KanjiVG (nét chữ Nhật):")
    if KANJIVG_THU_MUC.exists():
        print(f"  đã có   {KANJIVG_THU_MUC}")
    else:
        tai(KANJIVG_URL, KANJIVG_ZIP)
        print("  đang giải nén ...")
        # File zip có thư mục kanji/ ngay ở gốc, nên giải nén thẳng vào
        # kanjivg-20250816-all/ để ra đúng kanjivg-20250816-all/kanji/
        with zipfile.ZipFile(KANJIVG_ZIP) as z:
            z.extractall(KANJIVG_THU_MUC)
        if not (KANJIVG_THU_MUC / "kanji").exists():
            print("  CẢNH BÁO: không thấy thư mục kanji/ sau khi giải nén, cần kiểm tra tay.")

    print("\nXong. Giờ chạy được các lệnh: npm run dung-chu-han, dung-net-viet, dung-dong-tu, dung-tu-vung, dung-ngu-phap.")


if __name__ == "__main__":
    main()
