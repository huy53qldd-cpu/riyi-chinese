# -*- coding: utf-8 -*-
"""
Công cụ DỰNG LỘ TRÌNH BÀI HỌC (GĐ 10, quyết định 18.17 – 18.20).

Mỗi ngày học một "Bài hôm nay": 5 chữ Hán + 10 từ vựng + 3 điểm ngữ pháp
(từ 1 lên 3 điểm theo quyết định 18.24).
File này xếp toàn bộ HSK 1–3 thành các bài theo thứ tự DỄ → KHÓ:

  TỪ VỰNG
    - HSK 1 trước, rồi HSK 2, HSK 3.
    - Trong mỗi cấp, từ THÔNG DỤNG đứng trước. Độ thông dụng lấy từ tần suất
      trong từ điển của jieba (giấy phép MIT). Danh sách đại cương HSK xếp theo
      bảng chữ cái pinyin nên không dùng thứ tự đó được.
    - Mỗi bài 10 từ liên tiếp. 1000 từ = 100 bài.

  CHỮ HÁN
    - 5 chữ của bài lấy trong các từ ĐÃ HỌC (tới bài đó) mà chưa học chữ: chữ
      HSK thấp và thông dụng nhất trước. Chữ luôn thuộc từ đã gặp, và chữ rất
      thông dụng (的 我 他...) được học sớm.
    - 655 chữ = 131 bài, nhiều hơn 100 bài từ vựng: từ bài 101 trở đi phần từ
      vựng là ÔN LẠI 10 từ đã học có chứa chữ của bài.

  NGỮ PHÁP
    - Theo cấp HSK. Trong các điểm còn lại, chọn điểm có câu ví dụ dùng nhiều
      từ ĐÃ HỌC nhất (đếm theo cách chia mảnh câu tachTu).
    - 3 điểm mỗi bài: 70 điểm = 24 bài đầu (bài 24 có 1 điểm mới + 2 điểm ôn);
      từ bài 25 là ÔN LẠI 3 điểm một bài, lần lượt từ điểm học sớm nhất.

CÁCH CHẠY:
    npm run dung-lo-trinh
KẾT QUẢ:
    public/du-lieu/lo-trinh.json
"""

import json
from collections import defaultdict
from pathlib import Path

DU_LIEU = Path("public/du-lieu")
JIEBA = Path("cong-cu/nguon-mo/jieba-dict.txt")
RA = DU_LIEU / "lo-trinh.json"
NGAY = "2026-09-22"

SO_TU, SO_CHU, SO_NGU_PHAP = 10, 5, 3


def doc(ten):
    return json.loads((DU_LIEU / ten).read_text(encoding="utf-8"))["danhSach"]


def doc_tan_suat():
    if not JIEBA.exists():
        raise SystemExit("Thiếu cong-cu/nguon-mo/jieba-dict.txt, hãy chạy npm run tai-nguon-mo")
    ts = {}
    for dong in JIEBA.read_text(encoding="utf-8").splitlines():
        p = dong.split(" ")
        if len(p) >= 2 and p[1].isdigit():
            ts[p[0]] = max(ts.get(p[0], 0), int(p[1]))
    return ts


def tan_suat_tu(tu, ts):
    """Tần suất của một từ HSK; thử thêm dạng bỏ 儿 và dạng tách ngoặc (如 "…（儿）")."""
    for dang in (tu, tu.replace("儿", ""), tu.split("（")[0], tu.split("|")[0]):
        if dang in ts:
            return ts[dang]
    return 0


def dung():
    ts = doc_tan_suat()
    tu_vung = [t for c in (1, 2, 3) for t in doc(f"tu-vung-hsk{c}.json")]
    chu_han = [m for c in (1, 2, 3) for m in doc(f"chu-han-hsk{c}.json")]
    ngu_phap = [m for c in (1, 2, 3) for m in doc(f"ngu-phap-hsk{c}.json")]

    # --- Từ vựng: cấp HSK, rồi thông dụng trước ---
    tu_xep = sorted(tu_vung, key=lambda t: (t["capHsk"], -tan_suat_tu(t["tu"], ts), t["soThuTuHsk"]))
    # Chia 10 từ một bài. Không để hai từ VIẾT GIỐNG NHAU (如 过 guò / 过 guo)
    # vào cùng một bài, vì trò chơi lật thẻ sẽ có hai thẻ Trung trông y hệt:
    # từ trùng mặt chữ thì dời sang bài sau.
    nhom_tu, dang, doi = [], [], []
    for t in tu_xep:
        cho = doi + [t]
        doi = []
        for x in cho:
            if any(y["tu"] == x["tu"] for y in dang):
                doi.append(x)
            else:
                dang.append(x)
            if len(dang) == SO_TU:
                nhom_tu.append(dang)
                dang = []
    dang += doi
    if dang:
        nhom_tu.append(dang)

    # --- Chữ Hán ---
    chu_theo_mat = {m["gianThe"]: m for m in chu_han}

    def khoa_chu(c):
        return (chu_theo_mat[c]["capHsk"], -ts.get(c, 0))

    # "Kho" = chữ nằm trong các từ ĐÃ HỌC (tới bài hiện tại) mà chưa xếp vào bài
    # nào. Mỗi bài lấy 5 chữ dễ nhất trong kho: cấp HSK thấp, rồi thông dụng
    # nhất. Nhờ vậy chữ luôn thuộc từ đã học, và chữ rất thông dụng (的 我 他...)
    # được học sớm thay vì phải xếp hàng sau chữ của từng bài.
    da_xep_chu = set()
    kho = []
    chu_moi_bai = []
    for nhom in nhom_tu:
        for t in nhom:
            for c in t["tu"]:
                if c in chu_theo_mat and c not in da_xep_chu and c not in kho:
                    kho.append(c)
        kho.sort(key=khoa_chu)
        lay, kho = kho[:SO_CHU], kho[SO_CHU:]
        da_xep_chu.update(lay)
        chu_moi_bai.append(lay)

    # Chữ còn lại (trong kho + chữ không nằm trong từ HSK nào) cho các bài sau bài 100
    con_lai = kho + sorted(
        (c for c in chu_theo_mat if c not in da_xep_chu and c not in kho), key=khoa_chu
    )
    while con_lai:
        chu_moi_bai.append(con_lai[:SO_CHU])
        con_lai = con_lai[SO_CHU:]

    so_bai = len(chu_moi_bai)

    # --- Ngữ pháp: theo cấp, ưu tiên điểm có câu ví dụ dùng từ đã học ---
    con_diem = list(ngu_phap)
    thu_tu_diem = []  # điểm mới của từng bài (bài 1..70)
    da_hoc_tu = set()
    for k in range(len(ngu_phap)):
        i = k // SO_NGU_PHAP  # bài thứ i (từ 0) nhận điểm thứ k
        if i < len(nhom_tu):
            da_hoc_tu.update(t["tu"] for t in nhom_tu[i])
        cap_bai = nhom_tu[min(i, len(nhom_tu) - 1)][0]["capHsk"]
        cap_thap = min(d["capHsk"] for d in con_diem)
        ung_vien = [d for d in con_diem if d["capHsk"] <= max(cap_bai, cap_thap)]

        def do_phu(d):
            manh = [m for v in d["viDu"] for m in v["tachTu"]]
            return sum(m in da_hoc_tu for m in manh) / max(1, len(manh))

        # Cấp thấp trước; cùng cấp thì điểm phủ nhiều từ đã học hơn; hoà thì theo mã
        chon = min(ung_vien, key=lambda d: (d["capHsk"], -do_phu(d), d["id"]))
        con_diem.remove(chon)
        thu_tu_diem.append(chon["id"])

    # --- Ghép thành bài ---
    bai_hoc = []
    for i in range(so_bai):
        so = i + 1
        chu_ids = [chu_theo_mat[c]["id"] for c in chu_moi_bai[i]]
        if i < len(nhom_tu):
            tu_ids = [t["id"] for t in nhom_tu[i]]
            cap = nhom_tu[i][0]["capHsk"]
            on_tu = False
        else:
            # Ôn lại: 10 từ đã học có chứa chữ của bài, thiếu thì lấy từ học sớm nhất
            bai_chu = set(chu_moi_bai[i])
            co_chu = [t for t in tu_xep if bai_chu & set(t["tu"])]
            con = [t for t in tu_xep if t not in co_chu]
            tu_ids = [t["id"] for t in (co_chu + con)[:SO_TU]]
            cap = max(chu_theo_mat[c]["capHsk"] for c in chu_moi_bai[i])
            on_tu = True
        # 3 điểm của bài: điểm mới nếu còn, thiếu thì lấy điểm ôn lần lượt từ đầu
        np_ids, on_np = [], []
        for j in range(SO_NGU_PHAP):
            k = i * SO_NGU_PHAP + j
            if k < len(thu_tu_diem):
                np_ids.append(thu_tu_diem[k])
                on_np.append(False)
            else:
                np_ids.append(thu_tu_diem[(k - len(thu_tu_diem)) % len(thu_tu_diem)])
                on_np.append(True)
        bai_hoc.append({
            "so": so,
            "capHsk": cap,
            "chu": chu_ids,
            "tu": tu_ids,
            "tuOnTap": on_tu,
            "nguPhap": np_ids,
            "nguPhapOnTap": on_np,
        })

    RA.write_text(
        json.dumps({
            "loai": "lo-trinh",
            "phienBan": 2,
            "capNhatLuc": NGAY,
            "nguon": "Xếp từ HSK 1–3 (đại cương 2025-11) theo cấp và độ thông dụng (tần suất trong từ điển jieba, giấy phép MIT). Chữ Hán lấy từ chính các từ của bài; ngữ pháp theo cấp, ưu tiên điểm có câu ví dụ dùng từ đã học.",
            "moiBai": {"chu": SO_CHU, "tu": SO_TU, "nguPhap": SO_NGU_PHAP},
            "soBai": so_bai,
            "baiHoc": bai_hoc,
        }, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )

    # --- In tóm tắt để người kiểm tra xem qua ---
    ten_tu = {t["id"]: t["tu"] for t in tu_vung}
    ten_chu = {m["id"]: m["gianThe"] for m in chu_han}
    ten_np = {m["id"]: m["ten"] for m in ngu_phap}
    print(f"Đã ghi {so_bai} bài vào {RA}")
    for b in bai_hoc[:5] + bai_hoc[28:32] + bai_hoc[98:103] + bai_hoc[-2:]:
        print(
            f"  Bài {b['so']:3} HSK{b['capHsk']}: "
            f"{' '.join(ten_chu[c] for c in b['chu'])} | "
            f"{' '.join(ten_tu[t] for t in b['tu'])}{' (ôn)' if b['tuOnTap'] else ''} | "
            f"{' / '.join(ten_np[n][:18] + (' (ôn)' if o else '') for n, o in zip(b['nguPhap'], b['nguPhapOnTap']))}"
        )
    thieu_ts = [t["tu"] for t in tu_vung if tan_suat_tu(t["tu"], ts) == 0]
    print(f"Từ không có trong bảng tần suất (xếp cuối cấp): {len(thieu_ts)}: {' '.join(thieu_ts[:40])}")
    dem = defaultdict(int)
    for b in bai_hoc:
        dem[len(b["chu"])] += 1
    print("Số chữ mỗi bài:", dict(dem))


if __name__ == "__main__":
    dung()
