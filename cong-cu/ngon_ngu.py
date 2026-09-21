# -*- coding: utf-8 -*-
"""
Hàm ngôn ngữ dùng chung cho các công cụ dựng dữ liệu: gắn pinyin cho câu tiếng
Trung, gắn furigana cho câu tiếng Nhật, đổi pinyin số thanh sang có dấu.

Các công cụ trong cong-cu/ import module này (Python tự tìm được vì cùng thư mục).
"""

import re
import unicodedata

from pypinyin import Style, pinyin

HAN = re.compile(r"[一-鿿㐀-䶿々]")

DAU = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}


def am_tiet_co_dau(am):
    """'xue2' -> 'xué', 'lu:4' -> 'lǜ'. Thanh 5 (nhẹ) không ghi dấu."""
    am = am.replace("u:", "ü").replace("v", "ü")
    if not am or not am[-1].isdigit():
        return am
    thanh, goc = int(am[-1]), am[:-1]
    if thanh == 5:
        return goc
    # Quy tắc đặt dấu: a, e ưu tiên; "ou" đặt ở o; còn lại ở nguyên âm cuối
    vt = next((goc.index(c) for c in "ae" if c in goc), None)
    if vt is None and "ou" in goc:
        vt = goc.index("o")
    if vt is None:
        cac = [i for i, c in enumerate(goc) if c in DAU]
        vt = cac[-1] if cac else None
    if vt is None:
        return goc
    return goc[:vt] + DAU[goc[vt]][thanh - 1] + goc[vt + 1 :]


def bo_dau(am):
    """'xué' -> 'xue' để so sánh không tính thanh điệu."""
    return "".join(c for c in unicodedata.normalize("NFD", am) if not unicodedata.combining(c))


def pinyin_cau(cau):
    """Pinyin từng chữ cho một câu tiếng Trung; dấu câu và chữ khác để rỗng."""
    kq = pinyin(cau, style=Style.TONE, errors=lambda s: list(s))
    ra = []
    for chu, am in zip(cau, kq):
        ra.append(am[0] if HAN.match(chu) else "")
    # pypinyin tự biến điệu 一 và 不 theo từ điển; quy tắc dự án là ghi thanh
    # GỐC, còn biến điệu ghi riêng vào ghiChuBienDieu
    return ["yī" if c == "一" else "bù" if c == "不" else a for c, a in zip(cau, ra)]


def kata_sang_hira(s):
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s)


def gan_furigana(cau, tagger):
    """
    Trả về chuỗi dạng 漢字[かんじ]. Phần okurigana (kana đứng sau chữ Hán) được
    tách ra ngoài ngoặc: 食べる -> 食[た]べる.
    """
    ra = []
    for tu in tagger(cau):
        be_mat = tu.surface
        kana = getattr(tu.feature, "kana", None)
        if not HAN.search(be_mat) or not kana or kana == "*":
            ra.append(be_mat)
            continue
        doc = kata_sang_hira(kana)
        # Cắt kana đuôi giống nhau ở cả mặt chữ và cách đọc
        duoi = ""
        while (
            len(be_mat) > 1
            and not HAN.match(be_mat[-1])
            and doc.endswith(kata_sang_hira(be_mat[-1]))
            and len(doc) > 1
        ):
            duoi = be_mat[-1] + duoi
            be_mat, doc = be_mat[:-1], doc[:-1]
        ra.append(f"{be_mat}[{doc}]{duoi}")
    # Từ điển của máy đọc 私 là わたくし (văn phong trang trọng); trong câu đời
    # thường đọc わたし
    return "".join(ra).replace("私[わたくし]", "私[わたし]")


def doc_lien_tuc(chuoi_furigana):
    """Ghép mọi cách đọc của câu thành một chuỗi kana liền, để đối chiếu từ đích."""
    return re.sub(r"[一-鿿々]+\[([^\]]+)\]", r"\1", chuoi_furigana)


def thanh_dieu(am):
    """Số thanh của một âm tiết pinyin có dấu (0 = thanh nhẹ)."""
    for c in unicodedata.normalize("NFD", am):
        if c == "̄":
            return 1
        if c == "́":
            return 2
        if c == "̌":
            return 3
        if c == "̀":
            return 4
    return 0


def ghi_chu_bien_dieu(chuoi, am_tiet):
    """
    Sinh ghi chú biến điệu theo QUY TẮC (chỉ để người kiểm tra rà lại):
      - 不 đứng trước thanh 4 -> đọc bú
      - 一 đứng trước thanh 4 -> yí, trước thanh 1/2/3 -> yì
      - hai thanh 3 liền nhau -> chữ đầu đọc thành thanh 2
      - từ ba thanh 3 liền nhau trở lên -> ghi chú chung (cách đọc tuỳ ngắt nhịp)
    Trả về None nếu không có gì đặc biệt.
    """
    ghi = []
    n = len(am_tiet)
    for i, chu in enumerate(chuoi):
        if i + 1 >= n or not am_tiet[i + 1]:
            continue
        sau, chu_sau = thanh_dieu(am_tiet[i + 1]), chuoi[i + 1]
        if chu == "不" and sau == 4:
            ghi.append(f"不 đọc thành bú vì đứng trước thanh 4 ({chu_sau}).")
        if chu == "一" and sau in (1, 2, 3, 4):
            doc = "yí" if sau == 4 else "yì"
            ghi.append(f"一 đọc thành {doc} vì đứng trước thanh {sau} ({chu_sau}).")
    # Các đoạn thanh 3 liền nhau
    i = 0
    while i < n:
        if am_tiet[i] and thanh_dieu(am_tiet[i]) == 3:
            j = i
            while j + 1 < n and am_tiet[j + 1] and thanh_dieu(am_tiet[j + 1]) == 3:
                j += 1
            if j - i == 1:
                ghi.append(f"{chuoi[i]} đọc thành thanh 2 khi đứng trước thanh 3 ({chuoi[j]}).")
            elif j - i >= 2:
                ghi.append(f"{''.join(chuoi[i:j+1])}: có {j-i+1} thanh 3 liền nhau, cách biến điệu phụ thuộc cách ngắt nhịp câu.")
            i = j + 1
        else:
            i += 1
    return " ".join(ghi) if ghi else None
