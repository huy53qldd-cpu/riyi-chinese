# -*- coding: utf-8 -*-
"""
Công cụ DỰNG FILE DỮ LIỆU ĐỒNG TỰ DỊ NGHĨA (Tab B).

CÁCH LÀM:
  Ghép các nguồn thành public/du-lieu/dong-tu-di-nghia.json:

    TỰ ĐỘNG (không gõ tay):
      - CC-CEDICT : pinyin và xác nhận nghĩa tiếng Trung của từ
      - JMdict    : xác nhận cách đọc tiếng Nhật của từ
      - KANJIDIC2 : đối chiếu âm Hán Việt từng chữ
      - HSK       : cấp HSK của từ (tra trong danh sách rút từ PDF)
      - Tatoeba   : câu ví dụ (CC BY 2.0 FR), lấy theo mã câu
      - pypinyin  : gắn pinyin từng chữ cho câu tiếng Trung
      - fugashi   : gắn furigana cho câu tiếng Nhật
    NHẬP TAY (cong-cu/dong-tu-nhap-tay.json): nghĩa Việt, giải thích, câu dịch
    Việt, ghi chú biến điệu, mức nguy hiểm. Đây là bản nháp cần người rà lại.

  Chỗ nào nguồn tự động không khớp với bản nhập tay thì ghi vào cangKiemTra.
  Pinyin và furigana gắn tự động cho câu ví dụ có thể sai ở chữ nhiều âm đọc,
  nên MỌI câu đều được đánh dấu cần kiểm tra.

CÁCH CHẠY:
    npm run dung-dong-tu
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

from ngon_ngu import (
    DAU,
    HAN,
    am_tiet_co_dau,
    bo_dau,
    doc_lien_tuc,
    gan_furigana,
    kata_sang_hira,
    pinyin_cau,
)

N = Path("cong-cu/nguon-mo")
NHAP_TAY = Path("cong-cu/dong-tu-nhap-tay.json")
FILE_RA = Path("public/du-lieu/dong-tu-di-nghia.json")
NGAY = "2026-09-20"

# --------------------------------------------------------------------------
# Đọc các nguồn
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


def doc_jmdict():
    """{chữ Nhật: tập cách đọc} từ JMdict."""
    kq = defaultdict(set)
    for e in ET.parse(gzip.open(N / "JMdict_e.gz")).getroot().findall("entry"):
        doc = [r.find("reb").text for r in e.findall("r_ele")]
        for k in e.findall("k_ele"):
            kq[k.find("keb").text].update(doc)
    return kq


def doc_cedict():
    """{giản thể: [(pinyin dạng số thanh, nghĩa tiếng Anh)]} từ CC-CEDICT."""
    kq = defaultdict(list)
    z = zipfile.ZipFile(N / "cedict_1_0_ts_utf-8_mdbg.zip")
    for dong in z.read(z.namelist()[0]).decode("utf-8").splitlines():
        m = re.match(r"(\S+) (\S+) \[([^\]]+)\] /(.+)/", dong)
        if m:
            kq[m.group(2)].append((m.group(3), m.group(4)))
    return kq


def doc_han_viet():
    """{chữ Nhật: tập âm Hán Việt (chữ thường)} từ KANJIDIC2."""
    goc = ET.parse(gzip.open(N / "kanjidic2.xml.gz")).getroot()
    return {
        e.find("literal").text: {
            unicodedata.normalize("NFC", r.text.lower()) for r in e.iter("reading") if r.get("r_type") == "vietnam"
        }
        for e in goc.findall("character")
    }


def doc_pinyin_hsk():
    """{từ HSK 1-3: pinyin từng chữ} lấy từ file từ vựng đã dựng (theo đại cương, có thanh nhẹ)."""
    kq = {}
    for tep in sorted(Path("public/du-lieu").glob("tu-vung-hsk*.json")):
        for m in json.loads(tep.read_text(encoding="utf-8"))["danhSach"]:
            kq.setdefault(m["tu"], m["pinyin"])
    return kq


def doc_cap_hsk():
    """{từ giản thể: cấp HSK thấp nhất}."""
    d = json.loads(Path("src/du-lieu/hsk-goc/tu-vung-goc.json").read_text(encoding="utf-8"))
    kq = {}
    for m in d["danhSach"]:
        kq[m["tu"]] = min(m["cap"], kq.get(m["tu"], 99))
    return kq


# --------------------------------------------------------------------------
# Pinyin
# --------------------------------------------------------------------------
def chon_pinyin_cedict(tu, cac_muc):
    """
    CC-CEDICT có thể có nhiều mục cho cùng một chữ (汤 có shang1 và tang1).
    Chọn mục có pinyin trùng với pinyin máy gắn, không tính thanh nhẹ (5).
    Trả về None nếu không mục nào khớp.
    """
    may = [a[0] for a in pinyin(tu, style=Style.TONE, errors=lambda s: list(s))]
    for am_so, _ in cac_muc:
        ung_vien = [am_tiet_co_dau(a) for a in am_so.split()]
        if len(ung_vien) == len(may) and all(
            u == m or (bo_dau(u) == bo_dau(m) and not any(c in u for c in "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ"))
            for u, m in zip(ung_vien, may)
        ):
            return ung_vien
    return None


# --------------------------------------------------------------------------
# Furigana
# --------------------------------------------------------------------------
# --------------------------------------------------------------------------
def dung():
    nhap = json.loads(NHAP_TAY.read_text(encoding="utf-8"))
    print("Đang nạp nguồn dữ liệu...")
    jpn, cmn, vie = doc_cau("jpn_sentences.tsv.bz2"), doc_cau("cmn_sentences.tsv.bz2"), doc_cau("vie_sentences.tsv.bz2")
    jpn_vie = doc_lien_ket("jpn-vie_links.tsv.bz2")
    jm, cd, hv, hsk = doc_jmdict(), doc_cedict(), doc_han_viet(), doc_cap_hsk()
    py_hsk = doc_pinyin_hsk()
    tagger = Tagger()

    ds = []
    for i, m in enumerate(nhap["danhSach"], start=1):
        nhat, gian = m["chuNhat"], m["gianThe"]
        ton_tai = m.get("tonTaiTrongTiengTrung", True)
        cang = ["Nghĩa Việt, phần giải thích, chỗ dễ nhầm và câu dịch Việt là bản nháp, chưa có người xác minh."]

        # --- Đối chiếu cách đọc tiếng Nhật với JMdict ---
        if m["docNhat"] not in jm.get(nhat, set()):
            cang.append(f"Cách đọc {m['docNhat']} không có trong JMdict cho {nhat}, cần kiểm tra.")

        # --- Đối chiếu âm Hán Việt với KANJIDIC2 (từng chữ Nhật) ---
        chu_han_nhat = [c for c in nhat if HAN.match(c)]
        am_hv = unicodedata.normalize("NFC", m["hanViet"]).split()
        if len(chu_han_nhat) == len(am_hv):
            for c, a in zip(chu_han_nhat, am_hv):
                if a not in hv.get(c, set()):
                    cang.append(f"Âm Hán Việt '{a}' của chữ {c} không có trong KANJIDIC2, cần kiểm tra.")
        else:
            cang.append("Số âm Hán Việt không khớp số chữ Hán, cần kiểm tra.")

        # --- Phần tiếng Trung ---
        muc_cd = [e for e in cd.get(gian, []) if not e[0][0].isupper()]
        if ton_tai:
            if not muc_cd:
                raise SystemExit(f"{gian}: đánh dấu có tồn tại nhưng CC-CEDICT không có")
            # Từ có trong HSK 1-3 thì lấy pinyin theo đại cương (ví dụ 东西 dōngxi,
            # 地方 dìfang), không để máy chọn giữa các mục CC-CEDICT
            pinyin_tu = py_hsk.get(gian) or chon_pinyin_cedict(gian, muc_cd)
            if pinyin_tu is None:
                cang.append("Không mục CC-CEDICT nào khớp pinyin máy gắn, đang dùng mục đầu tiên, cần kiểm tra.")
                pinyin_tu = [am_tiet_co_dau(a) for a in muc_cd[0][0].split()]
            if len(pinyin_tu) != len(gian):
                cang.append("Số âm tiết pinyin không khớp số chữ, cần kiểm tra.")
        else:
            if muc_cd:
                cang.append("Đánh dấu không tồn tại trong tiếng Trung nhưng CC-CEDICT lại có mục này, cần kiểm tra.")
            pinyin_tu = None

        trung = {"pinyin": pinyin_tu, "nghia": m["nghiaTrung"], "viDu": None}
        vd = m.get("viDuTrung")
        if vd:
            if "id" in vd:
                cau, nguon = cmn[vd["id"]], f"Tatoeba #{vd['id']}"
            else:
                cau, nguon = vd["tuSoan"], "Claude tự soạn (Tatoeba không có câu phù hợp)"
                cang.append("Câu ví dụ tiếng Trung do Claude tự soạn, không lấy từ Tatoeba.")
            py = pinyin_cau(cau)
            # Đối chiếu pinyin của từ đích trong câu với CC-CEDICT
            vt = cau.find(gian)
            if vt >= 0 and pinyin_tu:
                # Từ đích lấy pinyin của CC-CEDICT (có thanh nhẹ), không lấy của máy
                py[vt : vt + len(gian)] = pinyin_tu
            elif vt < 0:
                cang.append(f"Câu tiếng Trung không chứa nguyên từ {gian}.")
            cang.append("Pinyin của câu tiếng Trung do máy gắn tự động, cần kiểm tra chữ nhiều âm đọc.")
            trung["viDu"] = {
                "trung": cau,
                "pinyin": py,
                "nghiaViet": vd["viet"],
                "ghiChuBienDieu": vd.get("ghiChuBienDieu"),
                "nguon": nguon,
            }

        # --- Phần tiếng Nhật ---
        vn = m["viDuNhat"]
        if "id" in vn:
            cau_nhat, nguon_nhat = jpn[vn["id"]], f"Tatoeba #{vn['id']}"
        else:
            cau_nhat, nguon_nhat = vn["tuSoan"], "Claude tự soạn (Tatoeba không có câu phù hợp)"
            cang.append("Câu ví dụ tiếng Nhật do Claude tự soạn, không lấy từ Tatoeba.")
        # Chỗ máy gắn furigana sai (小心者, 非常口...) thì nhập tay nguyên câu có furigana
        furi = vn.get("furigana") or gan_furigana(cau_nhat, tagger)
        # Từ ngoại lai như マージャン viết bằng kanji thì furigana hiện katakana
        if re.search("[ァ-ヶ]", m["docNhat"]):
            furi = furi.replace(f"[{kata_sang_hira(m['docNhat'])}]", f"[{m['docNhat']}]")
        if kata_sang_hira(m["docNhat"]) not in kata_sang_hira(doc_lien_tuc(furi)):
            cang.append(f"Furigana tự gắn cho câu Nhật không chứa cách đọc {m['docNhat']} của từ đích, cần kiểm tra.")
        cang.append("Furigana của câu tiếng Nhật do máy gắn tự động, cần kiểm tra.")
        nghia_viet_nhat = vn["viet"]
        if nghia_viet_nhat is None and "id" in vn:
            # Lấy bản dịch Việt của Tatoeba nếu có
            # sorted để lần chạy nào cũng chọn cùng một bản dịch (tập hợp không có thứ tự cố định)
            nghia_viet_nhat = next((vie[j] for j in sorted(jpn_vie.get(vn["id"], ()), key=int) if j in vie), None)
            if nghia_viet_nhat is None and "id" in vn:
                raise SystemExit(f"{nhat}: không có bản dịch Việt của Tatoeba và cũng chưa nhập tay")
        nhat_kq = {
            "cachDoc": m["docNhat"],
            "nghia": m["nghiaNhat"],
            "viDu": {
                "nhat": furi,
                "nghiaViet": nghia_viet_nhat,
                "nguon": nguon_nhat,
            },
        }

        ds.append({
            "id": f"dtdn-{i:04d}",
            "chuNhat": nhat,
            "chuTrungGianThe": gian,
            "amHanViet": m["hanViet"],
            "tonTaiTrongTiengTrung": ton_tai,
            "mucNguyHiem": m["mucNguyHiem"],
            # Cấp HSK tra trong danh sách rút từ PDF; ngoài HSK 1-3 thì để null
            "capHsk": hsk.get(gian) if hsk.get(gian, 9) <= 3 else None,
            "trung": trung,
            "nhat": nhat_kq,
            "viet": {"giaiThich": m["giaiThich"], "choDeNham": m["choDeNham"]},
            "cangKiemTra": cang,
        })

    FILE_RA.write_text(
        json.dumps({
            "loai": "dong-tu-di-nghia",
            "phienBan": 2,
            "capNhatLuc": NGAY,
            "nguon": "Nghĩa tiếng Trung đối chiếu CC-CEDICT, cách đọc tiếng Nhật đối chiếu JMdict, âm Hán Việt đối chiếu KANJIDIC2 (đều EDRDG/MDBG, CC BY-SA). Câu ví dụ: Tatoeba (CC BY 2.0 FR).",
            "luuYDauTab": nhap["luuYDauTab"],
            "danhSach": ds,
        }, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Đã ghi {len(ds)} cặp vào {FILE_RA}\n")
    for m in ds:
        loi = [c for c in m["cangKiemTra"] if "cần kiểm tra" in c or "khác CC-CEDICT" in c or "không chứa" in c]
        print(m["chuNhat"], m["chuTrungGianThe"], m["capHsk"], m["trung"]["pinyin"], "|", m["nhat"]["viDu"]["nhat"])
        if m["trung"]["viDu"]:
            print("    ZH:", m["trung"]["viDu"]["trung"], " ".join(m["trung"]["viDu"]["pinyin"]))
        for l in loi:
            print("    !!", l)


if __name__ == "__main__":
    dung()
