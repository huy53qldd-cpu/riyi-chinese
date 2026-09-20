# -*- coding: utf-8 -*-
"""
Công cụ TẢI FONT GỐC.

Ba file font gốc nặng tổng cộng khoảng 27 MB nên không lưu trong kho Git.
Script này tải lại chúng từ kho chính thức của Google Fonts.

KHI NÀO CẦN CHẠY:
  - Lần đầu tải dự án về một máy mới
  - Khi thư mục cong-cu/font-goc/ bị xoá mất

Sau khi tải xong, chạy tiếp "npm run cat-font" để cắt nhỏ font.

CÁCH CHẠY:
    npm run tai-font
"""

import urllib.request
from pathlib import Path

RA = Path("cong-cu/font-goc")

GOC = "https://github.com/google/fonts/raw/main/ofl/"

DANH_SACH = [
    ("notosanssc/NotoSansSC%5Bwght%5D.ttf", "noto-sans-sc.ttf", "Noto Sans SC (tiếng Trung)"),
    ("notosansjp/NotoSansJP%5Bwght%5D.ttf", "noto-sans-jp.ttf", "Noto Sans JP (tiếng Nhật)"),
    ("nunito/Nunito%5Bwght%5D.ttf", "nunito.ttf", "Nunito (tiếng Việt và pinyin)"),
]


def main():
    RA.mkdir(parents=True, exist_ok=True)
    print("Dang tai font goc tu Google Fonts...")
    print()

    for duong_dan, ten_tep, mo_ta in DANH_SACH:
        dich = RA / ten_tep
        if dich.exists():
            mb = dich.stat().st_size / 1024 / 1024
            print("  Da co san: {:<20} ({:.1f} MB) - {}".format(ten_tep, mb, mo_ta))
            continue

        print("  Dang tai:  {:<20} - {}".format(ten_tep, mo_ta))
        try:
            urllib.request.urlretrieve(GOC + duong_dan, dich)
            mb = dich.stat().st_size / 1024 / 1024
            print("             xong ({:.1f} MB)".format(mb))
        except Exception as e:
            print("             LOI: " + str(e))
            print("             Kiem tra lai ket noi mang roi chay lai lenh nay.")
            return

    print()
    print("Xong. Buoc tiep theo: npm run cat-font")


if __name__ == "__main__":
    main()
