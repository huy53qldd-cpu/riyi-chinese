# -*- coding: utf-8 -*-
"""
=============================================================================
TẢI ÂM HÁN VIỆT CHO CHỮ HÁN HSK 1–3 (Phần 2, quyết định 18.66)
=============================================================================

Nguồn: bộ dữ liệu "Kai Hanzi HSK × Sino-Vietnamese"
    https://github.com/binhbuithithanh/hanzi-sino-vietnamese
    Giấy phép CC BY 4.0 — BẮT BUỘC ghi công (xem public/du-lieu/han-viet-GIAY-PHEP.txt).

Tạo public/du-lieu/han-viet.json:
    { "version": 1, "nguon": ..., "chu": { "学": {"am": "học", "meoNho": "..."} } }
Chỉ lấy chữ có trong danh sách chữ Hán HSK 1–3 của app (chu-han-hsk*.json).
Chữ bộ dữ liệu không có thì KHÔNG điền (app ẩn âm Hán Việt của chữ đó).

LƯU Ý: bộ dữ liệu chỉ có MỘT âm cho mỗi chữ. Chữ có nhiều âm (了 liễu/liệu,
行 hành/hàng…) cần người xem lại theo nghĩa trong từng từ, nên mọi mục đều gắn
"canKiemTra": true cho tới khi được duyệt.

Cách chạy:  python cong-cu/tai-han-viet.py
=============================================================================
"""

import json
import urllib.request
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
DU_LIEU = GOC / "public" / "du-lieu"
NGUON = "https://raw.githubusercontent.com/binhbuithithanh/hanzi-sino-vietnamese/main/data/characters.json"
GHI_CONG = (
    "ÂM HÁN VIỆT VÀ MẸO NHỚ CHỮ HÁN — NGUỒN VÀ GIẤY PHÉP\n\n"
    "Data from the Kai Hanzi HSK × Sino-Vietnamese dataset, CC BY 4.0.\n"
    "https://github.com/binhbuithithanh/hanzi-sino-vietnamese (nguồn gốc: https://kaihanzi.com/chu)\n"
    "Giấy phép: https://creativecommons.org/licenses/by/4.0/\n"
    "Riyi chỉ lọc ra chữ HSK 1–3 có trong app và viết thường âm Hán Việt; không sửa nội dung.\n"
)


def main():
    with urllib.request.urlopen(NGUON, timeout=60) as r:
        nguon = {x["hanzi"]: x for x in json.load(r)}
    chu_app = [
        c["gianThe"]
        for cap in (1, 2, 3)
        for c in json.loads((DU_LIEU / f"chu-han-hsk{cap}.json").read_text(encoding="utf-8"))["danhSach"]
    ]
    ra, thieu = {}, []
    for c in chu_app:
        x = nguon.get(c)
        if not x or not x.get("sinoViet"):
            thieu.append(c)
            continue
        muc = {"am": x["sinoViet"].strip().lower(), "canKiemTra": True}
        if x.get("mnemonic"):
            muc["meoNho"] = x["mnemonic"].strip()
        ra[c] = muc
    (DU_LIEU / "han-viet.json").write_text(
        json.dumps({"version": 1, "nguon": "Kai Hanzi HSK × Sino-Vietnamese (CC BY 4.0)", "chu": ra},
                   ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    (DU_LIEU / "han-viet-GIAY-PHEP.txt").write_text(GHI_CONG, encoding="utf-8")
    print(f"Có âm Hán Việt: {len(ra)}/{len(chu_app)} chữ. Thiếu {len(thieu)}: {''.join(thieu)}")


if __name__ == "__main__":
    main()
