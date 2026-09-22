# -*- coding: utf-8 -*-
"""
Công cụ DỰNG BẢNG PINYIN cho tab Phát âm (GĐ 10, quyết định 18.28 – 18.30).

Bảng theo mẫu 18 bảng phiên âm của chủ dự án, gộp các bảng cùng cột thành
5 nhóm để chọn trên điện thoại:
  1. a o e i u ü           (b p m f · d t n l · g k h · j q x · zh ch sh r · z c s)
  2. ai ei ao ou an en ang eng ong
  3. ia ie ian iang iao iu in ing iong
  4. ua uo uai ui uan un uang ueng
  5. üe üan ün             (n l · j q x)

Ô nào có trong bảng KHÔNG đoán: chỉ hiện ô có file âm thanh thật trong bộ
audio-cmn (public/am-thanh/am-tiet/danh-sach.json, tải bằng npm run tai-am-thanh).
Mỗi ô ghi sẵn các thanh (1–4) có file, để bấm vào không bao giờ bị câm.

Quy tắc viết pinyin áp dụng khi ghép phụ âm + vần:
  - ü sau j q x viết thành u (ju, jue, juan, jun); sau n l giữ ü (nü, lüe)
  - j q x không đi với u thường (ô đó để trống)
  - Âm tiết không có phụ âm đầu: i→yi, u→wu, ü→yu, ia→ya, iu→you, ui→wei,
    un→wen, üe→yue... (ô tiêu đề cột, bấm vào nghe được)
  - Ô tiêu đề hàng (phụ âm): đọc theo cách dạy thông thường bo po mo fo,
    de te ne le, ge ke he, ji qi xi, zhi chi shi ri, zi ci si

CÁCH CHẠY:
    npm run dung-bang-pinyin
KẾT QUẢ:
    public/du-lieu/bang-pinyin.json
"""

import json
import re
from pathlib import Path

DANH_SACH = Path("public/am-thanh/am-tiet/danh-sach.json")
RA = Path("public/du-lieu/bang-pinyin.json")

NHOM = [
    {
        "ma": "don",
        "nhan": "a o e i u ü",
        "van": ["a", "o", "e", "i", "u", "ü"],
        "phuAm": ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x",
                  "zh", "ch", "sh", "r", "z", "c", "s"],
    },
    {
        "ma": "ghep",
        "nhan": "ai ei ao ou an en ang eng ong",
        "van": ["ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong"],
        "phuAm": ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h",
                  "zh", "ch", "sh", "r", "z", "c", "s"],
    },
    {
        "ma": "i",
        "nhan": "ia ie ian iang iao iu in ing iong",
        "van": ["ia", "ie", "ian", "iang", "iao", "iu", "in", "ing", "iong"],
        "phuAm": ["b", "p", "m", "d", "t", "n", "l", "j", "q", "x"],
    },
    {
        "ma": "u",
        "nhan": "ua uo uai ui uan un uang ueng",
        "van": ["ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng"],
        "phuAm": ["d", "t", "n", "l", "g", "k", "h", "zh", "ch", "sh", "r", "z", "c", "s"],
    },
    {
        "ma": "v",
        "nhan": "üe üan ün",
        "van": ["üe", "üan", "ün"],
        "phuAm": ["n", "l", "j", "q", "x"],
    },
]

# Âm tiết không có phụ âm đầu, viết theo quy tắc y / w
KHONG_PHU_AM = {
    "i": "yi", "u": "wu", "ü": "yu",
    "ia": "ya", "ie": "ye", "ian": "yan", "iang": "yang", "iao": "yao", "iu": "you",
    "in": "yin", "ing": "ying", "iong": "yong",
    "ua": "wa", "uo": "wo", "uai": "wai", "ui": "wei", "uan": "wan", "un": "wen",
    "uang": "wang", "ueng": "weng",
    "üe": "yue", "üan": "yuan", "ün": "yun",
}

# Cách đọc phụ âm khi dạy (âm tiết đại diện)
DOC_PHU_AM = {
    "b": "bo", "p": "po", "m": "mo", "f": "fo", "d": "de", "t": "te", "n": "ne", "l": "le",
    "g": "ge", "k": "ke", "h": "he", "j": "ji", "q": "qi", "x": "xi",
    "zh": "zhi", "ch": "chi", "sh": "shi", "r": "ri", "z": "zi", "c": "ci", "s": "si",
}


def ghep(phu_am, van):
    """Ghép phụ âm + vần theo quy tắc viết pinyin. Không ghép được thì None."""
    # j q x chỉ đi với i và ü, không đi với u thường (ju là j + ü, đã có ở cột ü)
    if phu_am in ("j", "q", "x") and van.startswith("u"):
        return None
    if van.startswith("ü"):
        if phu_am in ("j", "q", "x"):
            return phu_am + "u" + van[1:]
        return phu_am + van
    return phu_am + van


def khoa(viet):
    """Tên file: ü viết là v (xem cong-cu/tai-am-thanh.py)."""
    return viet.replace("ü", "v")


def dung():
    co_file = json.loads(DANH_SACH.read_text(encoding="utf-8"))["coFile"]
    thanh_cua = {}
    for ten in co_file:
        m = re.fullmatch(r"([a-z]+)([1-4])", ten)
        thanh_cua.setdefault(m.group(1), []).append(int(m.group(2)))

    def o(viet):
        if viet is None:
            return None
        k = khoa(viet)
        return {"viet": viet, "khoa": k, "thanh": sorted(thanh_cua[k])} if k in thanh_cua else None

    nhom_ra = []
    so_o = 0
    for n in NHOM:
        cot = []
        for v in n["van"]:
            tieu_de = o(KHONG_PHU_AM.get(v, v))
            cot.append({"van": v, "o": tieu_de})
        hang = []
        for p in n["phuAm"]:
            cac_o = [o(ghep(p, v)) for v in n["van"]]
            so_o += sum(1 for x in cac_o if x)
            hang.append({"phuAm": p, "o": o(DOC_PHU_AM[p]), "cacO": cac_o})
        nhom_ra.append({"ma": n["ma"], "nhan": n["nhan"], "cot": cot, "hang": hang})

    RA.write_text(
        json.dumps({
            "loai": "bang-pinyin",
            "phienBan": 1,
            "nguon": "Bảng theo mẫu 18 bảng phiên âm của chủ dự án; chỉ gồm ô có file âm thanh trong bộ audio-cmn (CC BY-SA).",
            "nhom": nhom_ra,
        }, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"Đã ghi {len(nhom_ra)} nhóm, {so_o} ô có âm thanh vào {RA}")
    for n in nhom_ra:
        for h in n["hang"]:
            print(f"  {n['ma']:4} {h['phuAm']:3}", " ".join((x["viet"] if x else "·").ljust(6) for x in h["cacO"]))


if __name__ == "__main__":
    dung()
