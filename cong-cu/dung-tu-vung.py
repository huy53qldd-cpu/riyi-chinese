# -*- coding: utf-8 -*-
"""
Công cụ DỰNG FILE DỮ LIỆU TỪ VỰNG (Tab C, giai đoạn 4).

CÁCH LÀM:
  Ghép các nguồn thành public/du-lieu/tu-vung-hsk1.json:

    TỰ ĐỘNG:
      - PDF đại cương HSK: từ, pinyin, cấp, từ loại (词性), cấp phụ, dạng rút gọn
      - JMdict + CC-CEDICT: ĐỐI CHIẾU nghĩa tiếng Anh của từ Nhật tương đương
        với nghĩa tiếng Anh của từ Trung, báo nếu hai bên không có từ nào chung
      - Tatoeba: câu ví dụ tiếng Trung và bản dịch tiếng Nhật đi cặp (CC BY 2.0 FR)
      - pypinyin / fugashi: gắn pinyin và furigana cho câu
      - Quy tắc biến điệu (不, 一, hai thanh 3 liền nhau): sinh ghi chú tự động
    NHẬP TAY (cong-cu/tu-vung-nhap-tay.json): từ Nhật tương đương, nghĩa Việt,
    chủ đề, mã câu ví dụ, bản dịch Việt của câu. Đây là bản nháp cần người rà.

  Từ nào không tìm được câu ví dụ phù hợp thì để trống, không bịa.

CÁCH CHẠY:
    npm run dung-tu-vung
"""

import bz2
import gzip
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from pathlib import Path

from fugashi import Tagger
from pypinyin import Style, pinyin

from ngon_ngu import HAN, bo_dau, gan_furigana, ghi_chu_bien_dieu, pinyin_cau

N = Path("cong-cu/nguon-mo")
NHAP_TAY = Path("cong-cu/tu-vung-nhap-tay.json")
PDF_JSON = Path("src/du-lieu/hsk-goc/tu-vung-goc.json")
FILE_RA = Path("public/du-lieu/tu-vung-hsk1.json")
NGAY = "2026-09-20"
SO_TU = 100  # giai đoạn 4 làm 100 từ đầu (số thứ tự 1-100) của HSK 1

# Từ loại trong PDF (词性) -> tiếng Việt
TU_LOAI = {
    "名": "danh từ", "动": "động từ", "形": "tính từ", "副": "phó từ",
    "数": "số từ", "量": "lượng từ", "代": "đại từ", "助": "trợ từ",
    "介": "giới từ", "连": "liên từ", "前缀": "tiền tố", "后缀": "hậu tố",
    "叹": "thán từ", "拟声": "từ tượng thanh",
}
# Từ hay gặp mà chỉ nghĩa tiếng Anh khác nhau về từ ngữ, không cần cảnh báo
TU_DUNG = {"to", "a", "an", "the", "of", "or", "and", "sb", "sth", "be", "one", "in", "on", "for", "with", "used", "as", "cl"}


# --------------------------------------------------------------------------
# Đọc nguồn
# --------------------------------------------------------------------------
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


def tu_khoa_nghia(chuoi):
    """Tách một chuỗi nghĩa tiếng Anh thành tập từ khoá (chữ thường, bỏ từ vô nghĩa)."""
    tu = re.findall(r"[a-z]+", chuoi.lower())
    return {t.rstrip("s") for t in tu if len(t) > 2 and t not in TU_DUNG}


def doc_jmdict_nghia():
    """{chữ Nhật (viết bằng kanji hoặc kana): tập từ khoá nghĩa tiếng Anh}."""
    kq = defaultdict(set)
    for e in ET.parse(gzip.open(N / "JMdict_e.gz")).getroot().findall("entry"):
        nghia = set()
        for s in e.findall("sense"):
            for g in s.findall("gloss"):
                nghia |= tu_khoa_nghia(g.text or "")
        cach_viet = [k.find("keb").text for k in e.findall("k_ele")] + [
            r.find("reb").text for r in e.findall("r_ele")
        ]
        for c in cach_viet:
            kq[c] |= nghia
    return kq


def doc_cedict_nghia():
    """{giản thể: tập từ khoá nghĩa tiếng Anh}."""
    kq = defaultdict(set)
    z = zipfile.ZipFile(N / "cedict_1_0_ts_utf-8_mdbg.zip")
    for dong in z.read(z.namelist()[0]).decode("utf-8").splitlines():
        m = re.match(r"(\S+) (\S+) \[([^\]]+)\] /(.+)/", dong)
        if m:
            kq[m.group(2)] |= tu_khoa_nghia(m.group(4))
    return kq


# --------------------------------------------------------------------------
# Pinyin của từ
# --------------------------------------------------------------------------
def tach_pinyin_pdf(tu, pinyin_pdf):
    """
    PDF ghi pinyin liền một chuỗi (ví dụ "diànyǐngyuàn", "dǎ diànhuà"), còn
    app cần tách theo TỪNG CHỮ. Dùng pypinyin chỉ để biết mỗi chữ dài bao nhiêu
    chữ cái, rồi cắt chuỗi của PDF theo độ dài đó. Thanh điệu vẫn lấy từ PDF.
    Trả về None nếu độ dài không khớp (để báo người kiểm tra).
    """
    chuoi = unicodedata.normalize("NFC", pinyin_pdf).replace(" ", "").replace("'", "")
    may = [a[0] for a in pinyin(tu, style=Style.TONE, errors=lambda s: list(s))]
    do_dai = [len(bo_dau(a)) for a in may]
    # 儿 hoá âm cuối: 玩儿 trong PDF là "wánr", chữ 儿 chỉ còn "r"
    if tu.endswith("儿") and sum(do_dai) != len(chuoi):
        do_dai[-1] = 1
    if sum(do_dai) != len(chuoi):
        return None
    ra, vt = [], 0
    for d in do_dai:
        ra.append(chuoi[vt : vt + d])
        vt += d
    # Chữ đầu câu có thể viết hoa trong PDF (Hànyǔ), pinyin thường không viết hoa
    return [a.lower() for a in ra]


def sua_furigana(so, furi, nhap):
    """Áp các bản sửa tay furigana (nếu có) cho câu của từ số `so`."""
    for sai, dung_ in nhap.get("suaFurigana", {}).get(so, []):
        if sai not in furi:
            raise SystemExit(f"Từ {so}: bản sửa furigana đã cũ, không thấy '{sai}' trong '{furi}'")
        furi = furi.replace(sai, dung_)
    return furi


def dich_tu_loai(pdf):
    """'名、（副）' -> 'danh từ, (phó từ)'. Trong ngoặc là dùng phụ."""
    if not pdf:
        return None
    ra = []
    for muc in pdf.split("、"):
        trong_ngoac = muc.startswith("（")
        ma = muc.strip("（）")
        ten = TU_LOAI.get(ma)
        if ten is None:
            return f"?{pdf}"  # gặp từ loại lạ thì để lộ ra cho người kiểm tra
        ra.append(f"({ten})" if trong_ngoac else ten)
    return ", ".join(ra)


# --------------------------------------------------------------------------
def dung():
    nhap = json.loads(NHAP_TAY.read_text(encoding="utf-8"))
    pdf = json.loads(PDF_JSON.read_text(encoding="utf-8"))["danhSach"][:SO_TU]

    print("Đang nạp nguồn dữ liệu...")
    cmn, jpn = doc_cau("cmn_sentences.tsv.bz2"), doc_cau("jpn_sentences.tsv.bz2")
    cmn_jpn = doc_lien_ket("cmn-jpn_links.tsv.bz2")
    jm, cd = doc_jmdict_nghia(), doc_cedict_nghia()
    tagger = Tagger()

    ds, canh_bao = [], []
    for m in pdf:
        so = str(m["soThuTu"])
        tay = nhap["danhSach"][so]
        tu = m["dangRutGon"] or m["tu"]
        cang = ["Từ Nhật tương đương, nghĩa Việt, chủ đề là bản nháp, chưa có người xác minh."]

        # --- Pinyin từng chữ ---
        am_tiet = tach_pinyin_pdf(m["tu"], m["pinyin"])
        if am_tiet is None:
            canh_bao.append(f"{so} {m['tu']}: không tách được pinyin '{m['pinyin']}' theo từng chữ")
            am_tiet = [m["pinyin"]]
            cang.append("Không tách được pinyin theo từng chữ, cần kiểm tra.")

        # PDF ghi 不 đã biến điệu (bú kèqi, búyào), còn quy tắc dự án là ghi thanh
        # GỐC (quyết định 4.3); biến điệu đã có trong ghi chú tự sinh bên dưới
        if len(am_tiet) == len(m["tu"]):
            am_tiet = [
                "bù" if c == "不" and a in ("bú", "bù") else "yī" if c == "一" else a
                for c, a in zip(m["tu"], am_tiet)
            ]

        # --- Từ loại ---
        tu_loai = dich_tu_loai(m["tuLoaiPDF"])
        if tu_loai and tu_loai.startswith("?"):
            canh_bao.append(f"{so} {m['tu']}: từ loại lạ {m['tuLoaiPDF']}")

        # --- Đối chiếu nghĩa tiếng Anh: từ Nhật (JMdict) với từ Trung (CC-CEDICT) ---
        if tay["kiem"]:
            nghia_cd = cd.get(m["tu"], set())
            chung = set()
            thieu_jm = []
            for khoa in tay["kiem"]:
                if khoa not in jm:
                    thieu_jm.append(khoa)
                chung |= jm.get(khoa, set()) & nghia_cd
            if thieu_jm:
                cang.append(f"Từ khoá {'/'.join(thieu_jm)} không có trong JMdict, cần kiểm tra.")
                canh_bao.append(f"{so} {m['tu']}: {'/'.join(thieu_jm)} không có trong JMdict")
            elif not chung:
                cang.append("Nghĩa tiếng Anh của từ Nhật (JMdict) không có từ nào trùng với từ Trung (CC-CEDICT), cần kiểm tra nghĩa.")
                canh_bao.append(f"{so} {m['tu']}: nghĩa JMdict và CC-CEDICT không trùng ({'/'.join(tay['kiem'])})")
        else:
            cang.append("Không đối chiếu tự động được với từ điển (trợ từ, tiền tố hoặc cụm từ), cần kiểm tra nghĩa.")

        # --- Ghi chú biến điệu của chính từ ---
        chu_tu = list(m["tu"])
        bien_dieu = ghi_chu_bien_dieu(chu_tu, am_tiet) if len(am_tiet) == len(chu_tu) else None

        # --- Câu ví dụ ---
        vi_du = []
        vd = nhap["viDu"].get(so)
        if vd:
            cau = cmn[vd["id"]]
            nhat_goc = next((jpn[j] for j in sorted(cmn_jpn.get(vd["id"], ())) if j in jpn), None)
            if nhat_goc is None:
                raise SystemExit(f"{so} {tu}: câu {vd['id']} không có bản dịch Nhật")
            py = pinyin_cau(cau)
            vt = cau.find(m["tu"]) if cau.find(m["tu"]) >= 0 else cau.find(tu)
            if vt >= 0 and len(am_tiet) == len(m["tu"]) and cau[vt : vt + len(m["tu"])] == m["tu"]:
                # Từ đích lấy pinyin của PDF (chuẩn), không lấy của máy
                py[vt : vt + len(m["tu"])] = am_tiet
            elif vt < 0:
                cang.append(f"Câu ví dụ không chứa nguyên từ {tu}, cần kiểm tra.")
            vi_du.append({
                "trung": cau,
                "pinyin": py,
                "nhat": sua_furigana(so, gan_furigana(nhat_goc, tagger), nhap),
                "viet": vd["viet"],
                "ghiChuBienDieu": ghi_chu_bien_dieu(list(cau), py),
                "nguon": f"Tatoeba #{vd['id']}",
            })
            cang.append("Pinyin, furigana, ghi chú biến điệu của câu ví dụ do máy gắn theo quy tắc, và bản dịch Việt là bản nháp, cần kiểm tra.")
        else:
            cang.append("Chưa có câu ví dụ: Tatoeba không có câu phù hợp cho từ này.")

        ds.append({
            "id": f"tu-{m['soThuTu']:04d}",
            "capHsk": m["cap"],
            "soThuTuHsk": m["soThuTu"],
            "tu": m["tu"],
            "pinyin": am_tiet,
            "tuLoai": tu_loai,
            "chuDe": tay["chuDe"],
            "nghiaNhat": tay["nhat"],
            "nghiaViet": tay["viet"],
            "ghiChuBienDieu": tay.get("ghiChuBienDieu") or bien_dieu,
            "capPhu": m["capPhu"],
            "dangRutGon": m["dangRutGon"],
            "viDu": vi_du,
            "cangKiemTra": cang,
        })

    FILE_RA.write_text(
        json.dumps({
            "loai": "tu-vung",
            "cap": 1,
            "phienBan": 1,
            "capNhatLuc": NGAY,
            "nguon": "Từ, pinyin, từ loại: đại cương HSK 2025-11. Đối chiếu nghĩa: JMdict, CC-CEDICT (EDRDG/MDBG, CC BY-SA). Câu ví dụ và bản dịch Nhật: Tatoeba (CC BY 2.0 FR).",
            "danhMucChuDe": nhap["danhMucChuDe"],
            "danhSach": ds,
        }, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Đã ghi {len(ds)} từ vào {FILE_RA}")
    print(f"Từ có câu ví dụ: {sum(1 for m in ds if m['viDu'])}/{len(ds)}")
    print(f"\nCẢNH BÁO ({len(canh_bao)}):")
    for c in canh_bao:
        print("  !!", c)


if __name__ == "__main__":
    dung()
