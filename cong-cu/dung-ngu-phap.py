# -*- coding: utf-8 -*-
"""
Công cụ DỰNG FILE DỮ LIỆU NGỮ PHÁP (Tab F, giai đoạn 5).

CÁCH LÀM:
  Ghép thành public/du-lieu/ngu-phap-hsk1.json (điểm HSK 1) và
  public/du-lieu/ngu-phap-hsk2.json (điểm HSK 2):

    TỰ ĐỘNG:
      - Tatoeba: câu ví dụ tiếng Trung và bản dịch tiếng Nhật đi cặp (CC BY 2.0 FR)
      - pypinyin / fugashi: gắn pinyin và furigana cho câu
      - Quy tắc biến điệu: sinh ghi chú tự động (chỉ để người kiểm tra rà lại)
    NHẬP TAY (cong-cu/ngu-phap-nhap-tay.json): tên điểm, công thức, giải thích,
    đối chiếu tiếng Nhật, chỗ lệch, cảnh báo lỗi, câu sai/đúng, bản dịch Việt.
    Đây là kiến thức ngữ pháp KHÔNG có từ điển nào kiểm được, nên mọi điểm đều
    được đánh dấu cần kiểm tra.

  Nhãn đối chiếu tiếng Nhật luôn là "gần tương đương, không trùng khít" (quy tắc
  dự án), vì các điểm ở đây đều không có cấu trúc trùng khít trong tiếng Nhật.

CÁCH CHẠY:
    npm run dung-ngu-phap
"""

import bz2
import json
from collections import defaultdict
from pathlib import Path

from fugashi import Tagger

from ngon_ngu import gan_furigana, ghi_chu_bien_dieu, pinyin_cau

N = Path("cong-cu/nguon-mo")
NHAP_TAY = Path("cong-cu/ngu-phap-nhap-tay.json")
THU_MUC_RA = Path("public/du-lieu")
NGAY = "2026-09-21"

NHAN_DOI_CHIEU = "gần tương đương, không trùng khít"


def doc_cau(ten):
    kq = {}
    with bz2.open(N / ten, "rt", encoding="utf-8") as f:
        for dong in f:
            p = dong.rstrip("\n").split("\t")
            if len(p) >= 3:
                kq[p[0]] = p[2]
    return kq


def doc_lien_ket(ten):
    kq = defaultdict(set)
    with bz2.open(N / ten, "rt", encoding="utf-8") as f:
        for dong in f:
            p = dong.rstrip("\n").split("\t")
            if len(p) == 2:
                kq[p[0]].add(p[1])
    return kq


DAU_CAU = "。！？，"


def tach_tu(cau, vd, i):
    """
    Cách chia câu thành các mảnh cho bài sắp xếp câu (GĐ 7). Chia tay trong file
    nhập tay, dạng "我/学/英语". Kiểm tra ghép lại phải ra đúng câu (bỏ dấu câu
    cuối), và mỗi cách xếp khác phải dùng đúng bộ mảnh đó.
    """
    manh = vd["tachTu"].split("/")
    if "".join(manh) != cau.rstrip(DAU_CAU):
        raise SystemExit(f"Điểm {i}: tachTu '{vd['tachTu']}' không khớp câu {cau}")
    khac = [k.split("/") for k in vd.get("cachXepKhac", [])]
    for k in khac:
        if sorted(k) != sorted(manh):
            raise SystemExit(f"Điểm {i}: cachXepKhac '{'/'.join(k)}' không cùng bộ mảnh")
    return manh, khac


def pinyin_diem(cau, tro_tu):
    """
    Pinyin từng chữ của câu, rồi ép các trợ từ ngữ pháp về âm nhẹ của chúng.
    Máy đọc 得 thành dé và 过 thành guò (âm của từ đầy đủ), nhưng khi làm trợ
    từ ngữ pháp thì đọc nhẹ là de và guo. `tro_tu` lấy từ file nhập tay.
    """
    return [tro_tu.get(c, a) if a else a for c, a in zip(cau, pinyin_cau(cau))]


def cau_co_pinyin(cau, tro_tu):
    """Câu tiếng Trung tự soạn (câu sai/đúng) kèm pinyin từng chữ."""
    return {"trung": cau, "pinyin": pinyin_diem(cau, tro_tu)}


def dung():
    nhap = json.loads(NHAP_TAY.read_text(encoding="utf-8"))
    print("Đang nạp nguồn dữ liệu...")
    cmn, jpn = doc_cau("cmn_sentences.tsv.bz2"), doc_cau("jpn_sentences.tsv.bz2")
    cmn_jpn = doc_lien_ket("cmn-jpn_links.tsv.bz2")
    tagger = Tagger()

    theo_cap = defaultdict(list)
    for i, m in enumerate(nhap["danhSach"], start=1):
        cang = [
            "Giải thích, đối chiếu tiếng Nhật, chỗ lệch, cảnh báo lỗi và bản dịch Việt do Claude soạn từ kiến thức ngữ pháp, không có nguồn đối chứng ngoài, cần người biết tiếng Nhật và tiếng Trung rà lại."
        ]

        vi_du = []
        for vd in m["viDu"]:
            cau = cmn[vd["id"]]
            nhat_goc = next((jpn[j] for j in sorted(cmn_jpn.get(vd["id"], ()), key=int) if j in jpn), None)
            if nhat_goc is None:
                raise SystemExit(f"Điểm {i}: câu {vd['id']} không có bản dịch Nhật")
            py = pinyin_diem(cau, m.get("troTu", {}))
            manh, khac = tach_tu(cau, vd, i)
            vi_du.append({
                "trung": cau,
                "pinyin": py,
                "nhat": gan_furigana(nhat_goc, tagger),
                "viet": vd["viet"],
                "ghiChuBienDieu": ghi_chu_bien_dieu(list(cau), py),
                "nguon": f"Tatoeba #{vd['id']}",
                "tachTu": manh,
                "cachXepKhac": khac,
            })
        cang.append("Pinyin, furigana, ghi chú biến điệu của câu ví dụ do máy gắn theo quy tắc, cần kiểm tra.")

        canh_bao = []
        for cb in m["canhBaoLoi"]:
            canh_bao.append({
                "loai": cb["loai"],
                "noiDung": cb["noiDung"],
                "cauSai": cau_co_pinyin(cb["cauSai"], m.get("troTu", {})) if cb["cauSai"] else None,
                "cauDung": cau_co_pinyin(cb["cauDung"], m.get("troTu", {})) if cb["cauDung"] else None,
            })
        if any(cb["cauSai"] for cb in m["canhBaoLoi"]):
            cang.append("Câu sai và câu đúng trong phần cảnh báo do Claude tự soạn (không nguồn nào có câu sai), cần kiểm tra.")
        cang.append("Cách chia câu thành các mảnh và các cách xếp khác được chấp nhận trong bài sắp xếp câu do Claude chia tay, cần kiểm tra.")

        theo_cap[m["capHsk"]].append({
            "id": f"np-{i:04d}",
            "capHsk": m["capHsk"],
            "ten": m["ten"],
            "congThuc": m["congThuc"],
            "viDu": vi_du,
            "doiChieuNhat": {
                # Tất cả các điểm ở đây đều không có cấu trúc trùng khít trong tiếng Nhật
                "coCauTrucTrungKhit": False,
                "cauTruc": m["cauTrucNhat"],
                "nhan": NHAN_DOI_CHIEU,
                "choLech": m["choLech"],
            },
            "giaiThichViet": m["giaiThichViet"],
            "canhBaoLoi": canh_bao,
            "nguonPDF": m["nguonPDF"],
            "cangKiemTra": cang,
        })

    for cap, ds in sorted(theo_cap.items()):
        ra = THU_MUC_RA / f"ngu-phap-hsk{cap}.json"
        ra.write_text(
            json.dumps({
                "loai": "ngu-phap",
                "cap": cap,
                "phienBan": 2,
                "capNhatLuc": NGAY,
                "nguon": "Các điểm chọn theo đại cương HSK 2025-11 (mục nguonPDF). Câu ví dụ và bản dịch Nhật: Tatoeba (CC BY 2.0 FR).",
                "danhSach": ds,
            }, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Đã ghi {len(ds)} điểm HSK {cap} vào {ra}")

    for ds in theo_cap.values():
        for m in ds:
            print(m["id"], m["ten"])
            for v in m["viDu"]:
                print("   ", v["trung"], "|", v["nhat"], "|", v["ghiChuBienDieu"] or "")
            for cb in m["canhBaoLoi"]:
                if cb["cauSai"]:
                    print("    SAI:", cb["cauSai"]["trung"], " ".join(x for x in cb["cauSai"]["pinyin"] if x), "| ĐÚNG:", cb["cauDung"]["trung"], " ".join(x for x in cb["cauDung"]["pinyin"] if x))


if __name__ == "__main__":
    dung()
