# -*- coding: utf-8 -*-
"""
=============================================================================
DỰNG ĐỀ THI THỬ HSK TỪ FILE PDF + MP3 (quyết định 18.59)
=============================================================================

Đọc đề gốc trong thư mục de_thi_HSK/ (file .pdf và .mp3 cùng tên, ví dụ
H10901.pdf + H10901.mp3), rồi tạo:

    public/du-lieu/thi-thu/<MÃ>/de.json    toàn bộ câu hỏi, pinyin, đáp án,
                                           lời thoại phần nghe
    public/du-lieu/thi-thu/<MÃ>/hinh/*.jpg ảnh từng câu (cắt sạch, bỏ logo
                                           chân trang của trang nguồn)
    public/du-lieu/thi-thu/<MÃ>/nghe.mp3   file nghe (chép nguyên)
    public/du-lieu/thi-thu/danh-sach.json  danh sách các đề đã dựng

CHỈ LẤY ĐÚNG NHỮNG GÌ CÓ TRONG ĐỀ: chữ Hán, pinyin, đáp án đều đọc thẳng từ
PDF (không đoán, không tự thêm pinyin). Pinyin đặt trên CẢ TỪ đúng như đề gốc
(ví dụ "shāngdiàn" trên 商店), vì đề thi phải giữ nguyên bản.

Hiện chỉ hiểu bố cục HSK cấp 1 (mã H1xxxx). Đề cấp khác: báo lỗi, cần viết
thêm phần dựng riêng.

Cách chạy:
    python cong-cu/dung-de-thi.py H10901
    python cong-cu/dung-de-thi.py H10901 H10902 ...

Cần thư viện PyMuPDF:  python -m pip install pymupdf
Sau khi chạy, LUÔN mở đề trong app đối chiếu với PDF gốc trước khi đưa lên.
=============================================================================
"""

import json
import re
import shutil
import sys
from pathlib import Path

import pymupdf

GOC = Path(__file__).resolve().parent.parent
THU_MUC_DE = GOC / "de_thi_HSK"
THU_MUC_RA = GOC / "public" / "du-lieu" / "thi-thu"
PHIEN_BAN = 1

CO_CHU_HAN = 12  # cỡ chữ Hán / số trong câu
CO_PINYIN = 10  # cỡ pinyin (dòng ngay trên chữ Hán)
CO_NHAN = 14  # cỡ số câu, chữ cái A-F, tiêu đề
CHAN_TRANG_Y = 770  # dưới mức này là số trang và logo trang nguồn: bỏ

DAU_CAU = "，。？！、；：,.?!;:．"
CJK = re.compile(r"[㐀-鿿]+")


# ---------------------------------------------------------------------------
# Đọc các mảnh chữ (span) và ảnh của một trang
# ---------------------------------------------------------------------------
class Manh:
    def __init__(self, s):
        self.x0, self.y0, self.x1, self.y1 = s["bbox"]
        self.co = round(s["size"])
        self.chu = s["text"]
        self.font = s["font"]

    @property
    def giua_x(self):
        return (self.x0 + self.x1) / 2

    def __repr__(self):
        return f"<{self.chu!r} {self.co} {self.x0:.0f},{self.y0:.0f}>"


def doc_trang(trang):
    manh, anh = [], []
    for b in trang.get_text("dict")["blocks"]:
        if b["type"] != 0:
            x0, y0, x1, y1 = b["bbox"]
            if y1 < CHAN_TRANG_Y and (x1 - x0) > 20:
                anh.append([x0, y0, x1, y1])
            continue
        for dong in b["lines"]:
            for s in dong["spans"]:
                if s["text"].strip() and s["bbox"][1] < CHAN_TRANG_Y:
                    manh.append(Manh(s))
    return manh, gop_anh(anh)


def gop_anh(ds):
    """Ảnh gốc hay bị cắt làm 2 nửa trên/dưới: nửa nào chạm nhau thì gộp lại."""
    ds = sorted(ds, key=lambda a: (a[0], a[1]))
    gop = []
    for a in ds:
        for g in gop:
            cung_cot = abs(g[0] - a[0]) < 3 and abs(g[2] - a[2]) < 3
            cham = abs(g[3] - a[1]) < 3 or abs(a[3] - g[1]) < 3
            if cung_cot and cham:
                g[1], g[3] = min(g[1], a[1]), max(g[3], a[3])
                break
        else:
            gop.append(list(a))
    return gop


# ---------------------------------------------------------------------------
# Ghép một dòng chữ Hán với dòng pinyin phía trên thành danh sách [chữ, pinyin]
# ---------------------------------------------------------------------------
def tach_doan(m):
    """Tách một mảnh chữ Hán thành các đoạn (chữ Hán / số / dấu), kèm vị trí x ước lượng."""
    chu = m.chu.strip()
    lech = len(m.chu) - len(m.chu.lstrip())
    rong_1 = (m.x1 - m.x0) / max(len(m.chu), 1)
    ket_qua = []
    for kq in re.finditer(r"[㐀-鿿]+|[0-9]+|\S", chu):
        x0 = m.x0 + (kq.start() + lech) * rong_1
        x1 = m.x0 + (kq.end() + lech) * rong_1
        ket_qua.append((kq.group(), x0, x1))
    return ket_qua


def lam_sach_pinyin(s):
    return s.strip().rstrip(DAU_CAU).strip()


def ghep_dong(manh_han, manh_py, nhan_trong=None):
    """
    manh_han: các mảnh cỡ 12 cùng một dòng; manh_py: mảnh pinyin cỡ 10 phía trên.
    nhan_trong: chữ cái điền sẵn trong chỗ trống (câu ví dụ), nếu có.
    Trả về danh sách token: [chữ, pinyin]; chỗ trống là ["__", "<chữ cái điền sẵn hoặc rỗng>"].
    """
    py = [p for p in manh_py if lam_sach_pinyin(p.chu)]
    token = []
    for m in sorted(manh_han, key=lambda m: m.x0):
        for doan, x0, x1 in tach_doan(m):
            if CJK.fullmatch(doan):
                khop = [p for p in py if x0 - 3 <= p.giua_x <= x1 + 3]
                pinyin = " ".join(lam_sach_pinyin(p.chu) for p in khop)
                for p in khop:
                    py.remove(p)
                token.append([doan, pinyin])
            else:
                token.append([doan, ""])
    if py:
        raise ValueError(f"Còn pinyin chưa ghép được: {py} (dòng {manh_han})")
    # Gộp "（" … "）" thành một chỗ trống
    ra, i = [], 0
    while i < len(token):
        if token[i][0] in "（(":
            j = i + 1
            while j < len(token) and token[j][0] not in "）)":
                j += 1
            ra.append(["__", nhan_trong or ""])
            i = j + 1
            continue
        ra.append(token[i])
        i += 1
    return ra


def cac_dong(manh, x_tu=0, x_den=10_000):
    """Nhóm các mảnh cỡ 12 thành dòng (cùng y), kèm pinyin phía trên mỗi dòng."""
    han = [m for m in manh if m.co == CO_CHU_HAN and x_tu <= m.x0 < x_den]
    py = [m for m in manh if m.co == CO_PINYIN and x_tu - 15 <= m.x0 < x_den]
    dong = {}
    for m in han:
        y = next((k for k in dong if abs(k - m.y0) < 4), m.y0)
        dong.setdefault(y, []).append(m)
    ket_qua = []
    for y in sorted(dong):
        tren = [p for p in py if 6 < y - p.y0 < 20]
        ket_qua.append((y, dong[y], tren))
    return ket_qua


# ---------------------------------------------------------------------------
# Tìm số câu, chữ cái, trang theo tiêu đề
# ---------------------------------------------------------------------------
def so_cau(manh):
    """Số câu (cỡ 14, sát lề trái) và vị trí y của nó. Bỏ dòng tiêu đề "第1-5题"."""
    y_tieu_de = [m.y0 for m in manh if "题" in m.chu or m.chu.strip() == "第"]
    return [
        (int(m.chu.strip()), m.y0)
        for m in manh
        if m.co == CO_NHAN
        and m.x0 < 125
        and m.chu.strip().isdigit()
        and all(abs(m.y0 - y) > 5 for y in y_tieu_de)
    ]


def vi_du_y(manh):
    return next((m.y0 for m in manh if "例如" in m.chu), None)


def chu_cai(manh, x_tu=0, x_den=10_000):
    """Chữ cái A-F cỡ 14 (nhãn lựa chọn)."""
    ra = []
    for m in manh:
        if m.co == CO_NHAN and x_tu <= m.giua_x < x_den:
            for kq in re.finditer(r"[A-F]", m.chu):
                ra.append((kq.group(), m, m.x0 + kq.start() * (m.x1 - m.x0) / max(len(m.chu), 1)))
    return ra


def tim_trang(tai_lieu, tieu_de, sau_trang=0):
    for i in range(sau_trang, tai_lieu.page_count):
        if tieu_de in tai_lieu[i].get_text().replace(" ", ""):
            return i
    raise ValueError(f"Không thấy trang có '{tieu_de}'")


# ---------------------------------------------------------------------------
# Cắt ảnh
# ---------------------------------------------------------------------------
class CatAnh:
    def __init__(self, tai_lieu, thu_muc):
        self.tai_lieu = tai_lieu
        self.thu_muc = thu_muc
        thu_muc.mkdir(parents=True, exist_ok=True)

    def cat(self, so_trang, khung, ten):
        trang = self.tai_lieu[so_trang]
        anh = trang.get_pixmap(clip=pymupdf.Rect(khung), dpi=160)
        anh.save(str(self.thu_muc / f"{ten}.jpg"), jpg_quality=82)
        return f"{ten}.jpg"


def anh_trong_hang(anh, y_giua, lech=45):
    """Các ảnh nằm cùng hàng với một số câu (tâm ảnh gần y_giua), trái sang phải."""
    return sorted(
        [a for a in anh if abs((a[1] + a[3]) / 2 - y_giua) < lech],
        key=lambda a: a[0],
    )


def anh_theo_chu_cai(manh, anh):
    """Ảnh A-F: mỗi chữ cái ứng với ảnh gần nhất ở bên phải nó."""
    ra = {}
    for cc, m, _ in chu_cai(manh):
        if cc in ra:
            continue
        ung = [a for a in anh if a[0] > m.x0 - 5]
        tot = min(ung, key=lambda a: abs((a[1] + a[3]) / 2 - m.y0) + abs(a[0] - m.x1) * 0.3)
        ra[cc] = tot
    return ra


# ---------------------------------------------------------------------------
# Đáp án và lời thoại
# ---------------------------------------------------------------------------
def doc_dap_an(tai_lieu):
    trang = tai_lieu[tim_trang(tai_lieu, "卷答案")]
    ra = {}
    for so, dap in re.findall(r"(\d+)\s*[．.]\s*([A-F√×])", trang.get_text()):
        ra[int(so)] = {"√": "dung", "×": "sai"}.get(dap, dap)
    if len(ra) != 40:
        raise ValueError(f"Đọc được {len(ra)} đáp án, cần 40")
    return ra


def doc_loi_nghe(tai_lieu):
    """Lời thoại phần nghe theo từng câu (dùng khi xem lại bài), đúng nguyên văn."""
    bat_dau = tim_trang(tai_lieu, "听力材料")
    chu = "\n".join(tai_lieu[i].get_text() for i in range(bat_dau, bat_dau + 3))
    ra, cau = {}, None
    for dong in chu.splitlines():
        dong = dong.strip()
        if not dong or re.fullmatch(r"H\d+\s*-\s*\d+", dong):
            continue
        kq = re.match(r"^(\d+)\s*[．.]\s*(.*)$", dong)
        if kq and 1 <= int(kq.group(1)) <= 20:
            cau = int(kq.group(1))
            ra[cau] = [re.sub(r"\s+", "", kq.group(2))]  # chữ Hán không có dấu cách
        elif cau and re.match(r"^(男|女|问)：", dong):
            ra[cau].append(re.sub(r"\s+", "", dong))
        elif dong.startswith("第") or "结束" in dong:
            cau = None
    return ra


# ---------------------------------------------------------------------------
# DỰNG ĐỀ HSK CẤP 1
# ---------------------------------------------------------------------------
def dung_hsk1(tai_lieu, ma, cat):
    dap_an = doc_dap_an(tai_lieu)

    # ===== NGHE — phần 1: nghe, xem ảnh, chọn đúng / sai (câu 1-5)
    t = tim_trang(tai_lieu, "一、听力")
    manh, anh = doc_trang(tai_lieu[t])
    anh = [a for a in anh if a[1] > 150]
    vd_y = vi_du_y(manh)
    vi_du = sorted([a for a in anh if abs((a[1] + a[3]) / 2 - vd_y) < 80], key=lambda a: a[1])
    nghe1 = {
        "tieuDe": "第一部分",
        "kieu": "dung-sai-hinh",
        "viDu": [
            {"hinh": cat.cat(t, vi_du[0], "n1-vd1"), "dapAn": "dung"},
            {"hinh": cat.cat(t, vi_du[1], "n1-vd2"), "dapAn": "sai"},
        ],
        "cau": [],
    }
    for so, y in so_cau(manh):
        (a,) = anh_trong_hang(anh, y + 7)
        nghe1["cau"].append({"so": so, "hinh": cat.cat(t, a, f"c{so}"), "dapAn": dap_an[so]})

    # ===== NGHE — phần 2: chọn 1 trong 3 ảnh (câu 6-10), có thể sang trang sau
    t2 = tim_trang(tai_lieu, "第二部分", t)
    nghe2 = {"tieuDe": "第二部分", "kieu": "chon-hinh", "cau": []}
    for trang in (t2, t2 + 1):
        manh, anh = doc_trang(tai_lieu[trang])
        vd_y = vi_du_y(manh)
        if vd_y is not None:
            ba = anh_trong_hang(anh, vd_y - 10, 60)
            nghe2["viDu"] = {
                "hinh": [cat.cat(trang, a, f"n2-vd-{c}") for a, c in zip(ba, "ABC")],
                "dapAn": "A",
            }
        for so, y in so_cau(manh):
            if 6 <= so <= 10:
                ba = anh_trong_hang(anh, y + 7, 60)
                assert len(ba) == 3, (so, ba)
                nghe2["cau"].append({
                    "so": so,
                    "hinh": [cat.cat(trang, a, f"c{so}-{c}") for a, c in zip(ba, "ABC")],
                    "dapAn": dap_an[so],
                })

    # ===== NGHE — phần 3: nghe hội thoại, chọn ảnh A-F (câu 11-15)
    t3 = tim_trang(tai_lieu, "第三部分", t)
    manh, anh = doc_trang(tai_lieu[t3])
    vd_y = vi_du_y(manh)
    anh_af = anh_theo_chu_cai([m for m in manh if m.y0 < vd_y], anh)
    dong_vd = [ghep_dong(h, p) for _, h, p in cac_dong(manh) if _ >= vd_y - 5]
    nghe3 = {
        "tieuDe": "第三部分",
        "kieu": "ghep-hinh",
        "luaChon": [{"ma": c, "hinh": cat.cat(t3, anh_af[c], f"n3-{c}")} for c in sorted(anh_af)],
        "viDu": {"dong": dong_vd, "dapAn": "C"},
        "cau": [{"so": s, "dapAn": dap_an[s]} for s, _ in so_cau(manh)],
    }

    # ===== NGHE — phần 4: nghe câu + câu hỏi, chọn A/B/C bằng chữ (câu 16-20)
    t4 = tim_trang(tai_lieu, "第四部分", t)
    manh, _ = doc_trang(tai_lieu[t4])
    nghe4 = {"tieuDe": "第四部分", "kieu": "chon-chu", "cau": []}
    cac_so = so_cau(manh)
    vd_y = vi_du_y(manh)
    moc = [(0, vd_y)] + cac_so  # (số câu, y); 0 = ví dụ
    for i, (so, y) in enumerate(moc):
        y_het = moc[i + 1][1] - 12 if i + 1 < len(moc) else CHAN_TRANG_Y
        nhom = [m for m in manh if y - 16 <= m.y0 < y_het]
        luac = lua_chon_chu(nhom)
        if so == 0:
            cau_dong = [ghep_dong(h, p) for yy, h, p in cac_dong(nhom) if yy < min(m.y0 for _, m, _x in chu_cai(nhom)) - 8]
            nghe4["viDu"] = {"dong": cau_dong, "luaChon": luac, "dapAn": "A"}
        else:
            nghe4["cau"].append({"so": so, "luaChon": luac, "dapAn": dap_an[so]})

    # ===== ĐỌC — phần 1: ảnh + từ, chọn đúng / sai (câu 21-25)
    d1 = tim_trang(tai_lieu, "二、阅读")
    manh, anh = doc_trang(tai_lieu[d1])
    anh = [a for a in anh if a[1] > 150]
    vd_y = vi_du_y(manh)
    doc1 = {"tieuDe": "第一部分", "kieu": "dung-sai-hinh-chu", "viDu": [], "cau": []}
    tu = {y: ghep_dong(h, p) for y, h, p in cac_dong(manh)}
    for a, dap, ten in zip(sorted([a for a in anh if abs((a[1] + a[3]) / 2 - vd_y) < 80], key=lambda a: a[1]), ["sai", "dung"], ["d1-vd1", "d1-vd2"]):
        y_tu = min(tu, key=lambda y: abs(y - (a[1] + a[3]) / 2))
        doc1["viDu"].append({"hinh": cat.cat(d1, a, ten), "chu": tu[y_tu], "dapAn": dap})
    for so, y in so_cau(manh):
        (a,) = anh_trong_hang(anh, y + 7)
        y_tu = min(tu, key=lambda yy: abs(yy - y))
        doc1["cau"].append({"so": so, "hinh": cat.cat(d1, a, f"c{so}"), "chu": tu[y_tu], "dapAn": dap_an[so]})

    # ===== ĐỌC — phần 2: đọc câu, chọn ảnh A-F (câu 26-30)
    d2 = tim_trang(tai_lieu, "第二部分", d1)
    manh, anh = doc_trang(tai_lieu[d2])
    vd_y = vi_du_y(manh)
    anh_af = anh_theo_chu_cai([m for m in manh if m.y0 < vd_y - 5], anh)
    doc2 = {
        "tieuDe": "第二部分",
        "kieu": "ghep-hinh",
        "luaChon": [{"ma": c, "hinh": cat.cat(d2, anh_af[c], f"d2-{c}")} for c in sorted(anh_af)],
        "cau": [],
    }
    for y, h, p in cac_dong(manh):
        if y < vd_y - 5:
            continue
        so = next((s for s, ys in so_cau(manh) if abs(ys - y) < 5), 0)
        if so == 0:
            doc2["viDu"] = {"dong": [ghep_dong(h, p)], "dapAn": "E"}
        else:
            doc2["cau"].append({"so": so, "dong": [ghep_dong(h, p)], "dapAn": dap_an[so]})

    # ===== ĐỌC — phần 3: ghép câu hỏi (trái) với câu trả lời A-F (phải) (câu 31-35)
    d3 = tim_trang(tai_lieu, "第三部分", d1)
    manh, _ = doc_trang(tai_lieu[d3])
    cot_phai = min(x for cc, m, x in chu_cai(manh) if m.x0 > 360) - 5
    doc3 = {"tieuDe": "第三部分", "kieu": "ghep-cau", "luaChon": [], "cau": []}
    vd_y = vi_du_y(manh)
    for y, h, p in cac_dong(manh, 0, cot_phai):
        so = next((s for s, ys in so_cau(manh) if abs(ys - y) < 5), 0)
        if so == 0 and abs(y - vd_y) < 8:
            doc3["viDu"] = {"dong": [ghep_dong(h, p)], "dapAn": "F"}
        elif so:
            doc3["cau"].append({"so": so, "dong": [ghep_dong(h, p)], "dapAn": dap_an[so]})
    nhan_phai = [(cc, m) for cc, m, x in chu_cai(manh) if x >= cot_phai]
    for y, h, p in cac_dong(manh, cot_phai):
        cc = next(c for c, m in nhan_phai if abs(m.y0 - y) < 5)
        doc3["luaChon"].append({"ma": cc, "chu": ghep_dong(h, p)})
    doc3["luaChon"].sort(key=lambda l: l["ma"])

    # ===== ĐỌC — phần 4: chọn từ A-F điền vào chỗ trống (câu 36-40)
    d4 = tim_trang(tai_lieu, "第四部分", d1)
    manh, _ = doc_trang(tai_lieu[d4])
    vd_y = vi_du_y(manh)
    cac_so = so_cau(manh)
    doc4 = {"tieuDe": "第四部分", "kieu": "dien-tu", "cau": []}
    kho = [m for m in manh if m.y0 < vd_y - 20 and m.y0 > 150]
    doc4["luaChon"] = lua_chon_chu(kho)
    moc = [(0, vd_y)] + cac_so
    for i, (so, y) in enumerate(moc):
        y_het = moc[i + 1][1] - 15 if i + 1 < len(moc) else CHAN_TRANG_Y
        nhom = [m for m in manh if y - 16 <= m.y0 < y_het]
        dien_san = next((m.chu.strip() for m in nhom if m.co == CO_NHAN and m.x0 > 200 and re.fullmatch(r"[A-F]", m.chu.strip())), None)
        dong = [ghep_dong(h, p, dien_san) for _, h, p in cac_dong(nhom)]
        if so == 0:
            doc4["viDu"] = {"dong": dong, "dapAn": dien_san}
        else:
            doc4["cau"].append({"so": so, "dong": dong, "dapAn": dap_an[so]})

    return {
        "phan": [
            {"ma": "nghe", "ten": "听力", "tenViet": "Nghe hiểu", "amThanh": "nghe.mp3",
             "nhom": [nghe1, nghe2, nghe3, nghe4]},
            {"ma": "doc", "ten": "阅读", "tenViet": "Đọc hiểu", "thoiGianPhut": 17,
             "nhom": [doc1, doc2, doc3, doc4]},
        ],
        "loiNghe": {str(k): v for k, v in doc_loi_nghe(tai_lieu).items()},
        "diemMoiCau": 5,
        "diemDat": 120,
    }


def lua_chon_chu(nhom):
    """Các lựa chọn bằng chữ trên CÙNG một dòng: 'A 他的  B 我的  C 同学的'."""
    nhan = sorted(chu_cai(nhom), key=lambda t: t[2])
    if not nhan:
        return []
    ra = []
    for i, (cc, m, x) in enumerate(nhan):
        x_het = nhan[i + 1][2] - 1 if i + 1 < len(nhan) else 10_000
        # Dòng chữ của CHÍNH chữ cái này (chữ cái có khi in lệch cao thấp vài điểm)
        dong = [d for d in cac_dong(nhom, x + 5, x_het) if abs(d[0] - m.y0) < 9]
        ra.append({"ma": cc, "chu": ghep_dong(dong[0][1], dong[0][2]) if dong else []})
    return ra


def dung_de(ma):
    pdf = THU_MUC_DE / f"{ma}.pdf"
    mp3 = THU_MUC_DE / f"{ma}.mp3"
    if not pdf.exists() or not mp3.exists():
        raise SystemExit(f"Thiếu {pdf.name} hoặc {mp3.name} trong {THU_MUC_DE}")
    if not ma.startswith("H1"):
        raise SystemExit(f"{ma}: chưa hỗ trợ cấp này (mới có HSK 1).")

    ra = THU_MUC_RA / ma
    if ra.exists():
        shutil.rmtree(ra)
    tai_lieu = pymupdf.open(pdf)
    noi_dung = dung_hsk1(tai_lieu, ma, CatAnh(tai_lieu, ra / "hinh"))
    shutil.copyfile(mp3, ra / "nghe.mp3")

    de = {"version": PHIEN_BAN, "ma": ma, "cap": 1, **noi_dung}
    so = sum(len(n["cau"]) for p in de["phan"] for n in p["nhom"])
    if so != 40:
        raise SystemExit(f"{ma}: dựng được {so} câu, cần 40. Kiểm tra lại bố cục.")
    (ra / "de.json").write_text(json.dumps(de, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{ma}: đủ 40 câu, {len(list((ra / 'hinh').glob('*.jpg')))} ảnh.")
    return {"ma": ma, "cap": 1, "soCau": so}


def ghi_danh_sach():
    ds = []
    for tep in sorted(THU_MUC_RA.glob("*/de.json")):
        de = json.loads(tep.read_text(encoding="utf-8"))
        ds.append({"ma": de["ma"], "cap": de["cap"], "version": de["version"]})
    (THU_MUC_RA / "danh-sach.json").write_text(
        json.dumps({"version": PHIEN_BAN, "de": ds}, ensure_ascii=False, indent=1), encoding="utf-8"
    )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Cách dùng: python cong-cu/dung-de-thi.py H10901 [H10902 ...]")
    for ma in sys.argv[1:]:
        dung_de(ma)
    ghi_danh_sach()
