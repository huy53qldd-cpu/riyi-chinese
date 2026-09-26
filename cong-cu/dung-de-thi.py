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

Hiểu bố cục HSK 1–6 (quyết định 18.61). Đề nằm thẳng trong de_thi_HSK/ hoặc
trong thư mục con HSK1…HSK6. HSK 1–2 có pinyin (ghép theo vị trí), HSK 3–6
đọc theo dòng chữ; mỗi cấp khai báo nhóm nào là dạng câu nào (BO_CUC).

Cách chạy:
    python cong-cu/dung-de-thi.py H10901
    python cong-cu/dung-de-thi.py H10901 H10902 ...
    python cong-cu/dung-de-thi.py tat-ca          (mọi đề trong de_thi_HSK/)

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

DAU_CAU = "，。？！、；：,.?!;:．“”‘’《》…—\""
CJK = re.compile(r"[㐀-鿿]+")


# ---------------------------------------------------------------------------
# Đọc các mảnh chữ (span) và ảnh của một trang
# ---------------------------------------------------------------------------
class Manh:
    def __init__(self, s):
        self.x0, self.y0, self.x1, self.y1 = s["bbox"]
        self.co = round(s["size"])
        self.font = s["font"]
        # Từng ký tự kèm vị trí (x0, x1): để ghép pinyin theo TỪNG CHỮ, vì có đề
        # gộp pinyin của nhiều chữ vào một mảnh ("Xiǎo  Wáng" trên 小 và 王)
        self.ky_tu = [(c["c"], c["bbox"][0], c["bbox"][2]) for c in s["chars"]]
        self.chu = "".join(c for c, _, _ in self.ky_tu)

    @property
    def giua_x(self):
        return (self.x0 + self.x1) / 2

    def __repr__(self):
        return f"<{self.chu!r} {self.co} {self.x0:.0f},{self.y0:.0f}>"


def doc_trang(trang):
    manh, anh = [], []
    for b in trang.get_text("rawdict")["blocks"]:
        if b["type"] != 0:
            x0, y0, x1, y1 = b["bbox"]
            if y1 < CHAN_TRANG_Y and (x1 - x0) > 20:
                anh.append([x0, y0, x1, y1])
            continue
        for dong in b["lines"]:
            for s in dong["spans"]:
                m = Manh(s)
                if m.chu.strip() and m.y0 < CHAN_TRANG_Y:
                    manh.append(m)
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
    return s.strip().strip(DAU_CAU).strip()


def ghep_dong(manh_han, manh_py, nhan_trong=None):
    """
    manh_han: các mảnh cỡ 12 cùng một dòng; manh_py: mảnh pinyin cỡ 10 phía trên.
    nhan_trong: chữ cái điền sẵn trong chỗ trống (câu ví dụ), nếu có.
    Trả về danh sách token: [chữ, pinyin]; chỗ trống là ["__", "<chữ cái điền sẵn hoặc rỗng>"].
    """
    # Các TỪ pinyin (tách theo dấu cách) kèm vị trí thật của từng từ
    tu_py = []
    for p in manh_py:
        hien = []
        for c, x0, x1 in p.ky_tu + [(" ", 0, 0)]:
            if c.isspace():
                chu = lam_sach_pinyin("".join(k for k, _, _ in hien))
                if chu:
                    tu_py.append({"chu": chu, "x0": hien[0][1], "x1": hien[-1][2], "cac": []})
                hien = []
            else:
                hien.append((c, x0, x1))
    # Mỗi chữ Hán gắn với từ pinyin nằm ngay trên nó (tâm chữ lọt vào khoảng của từ)
    ky_tu = sorted((k for m in manh_han for k in m.ky_tu if not k[0].isspace()), key=lambda k: k[1])
    gan = []
    for c, x0, x1 in ky_tu:
        tu = None
        if CJK.fullmatch(c):
            giua = (x0 + x1) / 2
            ung = [t for t in tu_py if t["x0"] - 4 <= giua <= t["x1"] + 4]
            tu = min(ung, key=lambda t: abs((t["x0"] + t["x1"]) / 2 - giua), default=None)
            if tu:
                tu["cac"].append(c)
        gan.append((c, tu))
    thua = [t["chu"] for t in tu_py if not t["cac"]]
    if thua:
        raise ValueError(f"Còn pinyin chưa ghép được: {thua} (dòng {manh_han})")
    # Gộp: chữ Hán liền nhau cùng một từ pinyin → một token; số liền nhau → một token
    token = []
    for c, tu in gan:
        truoc = token[-1] if token else None
        if truoc and tu is not None and truoc[2] is tu:
            truoc[0] += c
        elif truoc and tu is None and CJK.fullmatch(c) and truoc[2] == "han" and CJK.fullmatch(truoc[0][-1]):
            truoc[0] += c
        elif truoc and c.isdigit() and truoc[2] == "so":
            truoc[0] += c
        else:
            token.append([c, tu["chu"] if tu else "", tu if tu else ("han" if CJK.fullmatch(c) else "so" if c.isdigit() else None)])
    token = [[chu, py] for chu, py, _ in token]
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
    # chỉ chữ "题"/"第" cỡ lớn mới là tiêu đề (câu hỏi cũng có thể có chữ 题, như 考试题)
    y_tieu_de = [m.y0 for m in manh if m.co == CO_NHAN and ("题" in m.chu or m.chu.strip() == "第")]
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


# ===========================================================================
# PHẦN DÙNG CHUNG CHO HSK 2–6 (quyết định 18.61)
# ===========================================================================
def tim_file(ma, duoi):
    """File đề nằm thẳng trong de_thi_HSK/ hoặc trong thư mục con HSK1…HSK6."""
    thang = THU_MUC_DE / f"{ma}.{duoi}"
    if thang.exists():
        return thang
    return next(THU_MUC_DE.rglob(f"{ma}.{duoi}"), None)


def thong_tin_bia(tai_lieu):
    """Số câu và số phút từng phần, đọc từ trang bìa: 听力（35 题，约25 分钟）."""
    chu = re.sub(r"\s+", "", tai_lieu[0].get_text())
    ra = {}
    for ten, so, phut in re.findall(r"(听力|阅读|书写)（(\d+)题，约?(\d+)分钟）", chu):
        ra[{"听力": "nghe", "阅读": "doc", "书写": "viet"}[ten]] = (int(so), int(phut))
    return ra


def hang_trang(trang):
    """Các dòng chữ (line của PyMuPDF) kèm vị trí, bỏ chân trang."""
    ra = []
    for b in trang.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for l in b["lines"]:
            t = "".join(s["text"] for s in l["spans"])
            if t.strip() and l["bbox"][1] < CHAN_TRANG_Y:
                x0, y0, x1, y1 = l["bbox"]
                ra.append({"text": t, "x0": x0, "y0": y0, "x1": x1, "y1": y1, "spans": l["spans"]})
    return ra


RE_NHOM = re.compile(r"^第(\d+)(?:[-－–](\d+))?题[：:]?(.*)$")


def tim_cac_nhom(tai_lieu):
    """
    Chia đề thành các nhóm câu theo tiêu đề "第a-b题". Mỗi nhóm có:
    phan (nghe/doc/viet), tieuDe (第一部分…), tu, den, huongDan (chữ sau "题：")
    và vung = [(số trang, y từ, y đến)]: nhóm có thể kéo sang trang sau.
    """
    bat_dau = tim_trang(tai_lieu, "一、听力")
    ket_thuc = tim_trang(tai_lieu, "听力材料")
    moc = []
    phan, bo_phan, dinh_cho = None, None, None
    for t in range(bat_dau, ket_thuc):
        # gộp các line cùng hàng để đọc tiêu đề (có đề tách "第","1","-","5","题")
        hang = {}
        for h in hang_trang(tai_lieu[t]):
            k = next((y for y in hang if abs(y - h["y0"]) < 4), h["y0"])
            hang.setdefault(k, []).append(h)
        for y in sorted(hang):
            ds = sorted(hang[y], key=lambda h: h["x0"])
            txt = re.sub(r"\s+", "", "".join(h["text"] for h in ds))
            if re.match(r"^[一二三]、(听力|阅读|书写)$", txt):
                phan = {"听": "nghe", "阅": "doc", "书": "viet"}[txt[2]]
                dinh_cho = (t, y)
                continue
            m = re.match(r"^第([一二三四])部分$", txt)
            if m:
                bo_phan = f"第{m.group(1)}部分"
                if not dinh_cho or dinh_cho[0] != t:
                    dinh_cho = (t, y)
                continue
            m = RE_NHOM.match(txt)
            if m:
                tu = int(m.group(1))
                den = int(m.group(2) or m.group(1))
                dinh = dinh_cho if dinh_cho and dinh_cho[0] == t else (t, y)
                moc.append({
                    "phan": phan, "tieuDe": bo_phan, "tu": tu, "den": den,
                    "huongDan": m.group(3).strip(), "dinh": dinh,
                    "bat_dau": (t, max(ds[0]["y1"], y + 8)),
                })
                dinh_cho = None
    for i, n in enumerate(moc):
        t0, y0 = n["bat_dau"]
        t1, y1 = moc[i + 1]["dinh"] if i + 1 < len(moc) else (ket_thuc, 0)
        vung = []
        for t in range(t0, t1 + 1):
            if t >= ket_thuc:
                break
            a = y0 if t == t0 else 40
            b = y1 - 1 if t == t1 else CHAN_TRANG_Y
            if b > a:
                vung.append((t, a, b))
        n["vung"] = vung
    return moc


def trong_vung(tai_lieu, vung):
    """[(số trang, các Manh, các ảnh, các line)] nằm trong vùng của một nhóm."""
    ra = []
    for t, a, b in vung:
        manh, anh = doc_trang(tai_lieu[t])
        manh = [m for m in manh if a <= m.y0 < b]
        anh = [x for x in anh if a - 5 <= x[1] < b]
        dong = [h for h in hang_trang(tai_lieu[t]) if a <= h["y0"] < b]
        if manh or anh:  # bỏ vùng trống (khoảng trên tiêu đề của nhóm sau)
            ra.append((t, manh, anh, dong))
    return ra


def doc_dap_an_chung(tai_lieu):
    """Đáp án khách quan (A–F, √ ×, BCA…) và đáp án phần Viết."""
    t = tim_trang(tai_lieu, "卷答案")
    chu = "\n".join(tai_lieu[i].get_text() for i in range(t, tai_lieu.page_count))
    chu = re.sub(r"H\d+\s*-\s*\d+", "\n", chu)
    vt = chu.find("三、书")
    khach_quan, viet = chu if vt < 0 else chu[:vt], "" if vt < 0 else chu[vt:]
    ra = {}
    for so, dap in re.findall(r"(\d+)\s*[．.]\s*([A-F]{1,5}|[√×])(?![A-Za-z\u3400-\u9fff])", khach_quan):
        ra[int(so)] = {"√": "dung", "×": "sai"}.get(dap, dap)
    # Phần Viết: nối các dòng bị ngắt, tách theo số câu; "/" = nhiều cách đúng
    viet = re.sub(r"三、书\s*写|第[一二]部分|（参考答案）|（略）", "\n", viet)
    viet = re.sub(r"\n(?!\s*\d+\s*[．.])", "", viet)
    ra_viet = {}
    for so, noi in re.findall(r"(\d+)\s*[．.]\s*([^\n]+)", viet):
        noi = noi.strip()
        if noi and noi != "（略）":
            ra_viet[int(so)] = [bo_cach(x) for x in noi.split("/") if x.strip()]
    return ra, ra_viet


def doc_loi_nghe_chung(tai_lieu, so_cau_nghe):
    """
    Lời thoại phần nghe theo từng câu, đúng nguyên văn. Đoạn nghe chung cho
    nhiều câu ("第31到33题是根据下面一段话：") được gắn vào từng câu của đoạn.
    """
    t0 = tim_trang(tai_lieu, "听力材料")
    t1 = tim_trang(tai_lieu, "卷答案", t0)
    dong = []
    for i in range(t0, t1 + 1):
        chu = tai_lieu[i].get_text()
        if i == t1:
            chu = chu[: chu.find("卷答案")]
        dong += [re.sub(r"\s+", "", d) for d in chu.splitlines()]
    ra, cau, nhom, vi_du = {}, None, None, False
    for d in dong:
        if not d or re.fullmatch(r"H\d+(-\d+)?|-\d+-", d) or "听力材料" in d:
            continue
        m = re.match(r"^第(\d+)(?:到|至|-|－)(\d+)题(?:是)?根据", d)
        if m:
            nhom = {"tu": int(m.group(1)), "den": int(m.group(2)), "dong": []}
            cau, vi_du = None, False
            continue
        m = re.match(r"^(\d+)[．.](.*)$", d)
        if m and 1 <= int(m.group(1)) <= so_cau_nghe and not vi_du:
            cau = int(m.group(1))
            ra[cau] = list(nhom["dong"]) if nhom and nhom["tu"] <= cau <= nhom["den"] else []
            if m.group(2):
                ra[cau].append(m.group(2))
            continue
        # câu ví dụ của đề là "例如：…"; "例如很多…" ở giữa bài nghe là lời nói bình thường
        if d.startswith(("例如：", "例如:")):
            vi_du, cau = True, None
            continue
        if re.match(r"^(第[一二三四]部分|现在开始|一共|听力考试|大家好|（音乐|HSK|请大家注意)", d) or "欢迎参加" in d:
            if d.startswith(("现在开始", "第")):
                vi_du = False
            if d.startswith("第"):
                cau, nhom = None, None
            continue
        if vi_du:
            continue
        if nhom and cau is None:
            nhom["dong"].append(d)
        elif cau is not None:
            if nhom and cau == nhom["den"] and not re.match(r"^(男|女|问)[：:]", d) and ra[cau]:
                # hết đoạn chung: dòng lạ sau câu cuối là đoạn khác, không gắn nhầm
                pass
            ra[cau].append(d)
    return ra


# ---------------------------------------------------------------------------
# HSK 3–6: đọc theo DÒNG chữ (không có pinyin)
# ---------------------------------------------------------------------------
CJK_DAU = "\u3000-\u303f\uff00-\uffef\u3400-\u9fff“”‘’…—・·"


def bo_cach(t):
    """Bỏ dấu cách thừa quanh chữ Hán (PDF chèn vào, ví dụ '5 点' → '5点')."""
    t = re.sub(rf"\s+(?=[{CJK_DAU}])", "", t)
    t = re.sub(rf"(?<=[{CJK_DAU}])\s+", "", t)
    return re.sub(r"\s+", " ", t).strip()


def chuan_hoa(t):
    return t.replace("„", "…").replace("\u00a0", " ")


def sang_token(t, tu=0, den=-1, trong=True):
    """
    Một đoạn chữ → token [[chữ, ""]]; chỗ trống → ["__", nhãn]:
      （  ）, （ E ）  ngoặc trống / có chữ cái điền sẵn (câu ví dụ)
      （71）          ô đánh số trong bài (选句填空)
      "两名 46 着"    số câu nằm giữa đoạn văn (完形填空), chỉ khi thuộc nhóm
      ≥4 dấu cách     chỗ trống để điền từ (选词填空) → "＿＿＿"
    """
    t = chuan_hoa(t).rstrip()
    if not trong:
        return [[bo_cach(re.sub(r"\s{2,}", "　", t)), ""]] if t.strip() else []
    ra, vt = [], 0
    mau = re.compile(r"（\s*([A-F]|\d{1,3})?\s*）|(?<=\S)\s+(\d{2,3})\s+(?=\S)|(?<=\S)\s{4,}(?=\S)")
    for m in mau.finditer(t):
        truoc = bo_cach(t[vt:m.start()])
        if m.group(0).lstrip().startswith("（"):
            if truoc:
                ra.append([truoc, ""])
            ra.append(["__", m.group(1) or ""])
        elif m.group(2):
            if not (tu <= int(m.group(2)) <= den):
                continue  # số bình thường trong câu, không phải chỗ trống
            if truoc:
                ra.append([truoc, ""])
            ra.append(["__", m.group(2)])
        else:
            if truoc:
                ra.append([truoc, ""])
            ra.append(["＿＿＿", ""])
        vt = m.end()
    cuoi = bo_cach(t[vt:])
    if cuoi:
        ra.append([cuoi, ""])
    return ra


def cac_hang(tai_lieu, vung, tu, den):
    """
    Các hàng chữ của một nhóm theo ĐÚNG THỨ TỰ ĐỌC. Trang in 2 cột (HSK 5–6
    phần nghe: câu 1–6 bên trái, 7–12 bên phải) thì đọc hết cột trái mới sang
    cột phải. Các line cùng hàng, cùng cột được gộp; cách nhau xa thì chèn 4
    dấu cách (để tách lựa chọn A B C D), gần thì nối liền.
    Trả về danh sách hàng: {"trang","cot","y0","x0","text"} và ảnh {"anh": bbox}.
    """
    ra = []
    for t, _, anh, dong in trong_vung(tai_lieu, vung):
        hai_cot = any(
            h["x0"] > 290 and (m := re.match(r"^\s*(\d+)\s*[．.]", h["text"])) and tu <= int(m.group(1)) <= den
            for h in dong
        )
        cot = lambda x: 1 if hai_cot and x > 290 else 0  # noqa: E731
        gop = {}
        for h in dong:
            k = next((kk for kk in gop if kk[0] == cot(h["x0"]) and abs(kk[1] - h["y0"]) < 3), (cot(h["x0"]), h["y0"]))
            gop.setdefault(k, []).append(h)
        for (c, y), ds in gop.items():
            ds.sort(key=lambda h: h["x0"])
            text = ds[0]["text"]
            for a, b in zip(ds, ds[1:]):
                # cách xa, hoặc dòng sau là một lựa chọn "D …" (có khi in rất sát) → tách ra
                tach = b["x0"] - a["x1"] > 15 or re.match(r"^\s*[A-F]\s", b["text"])
                text += ("    " if tach else "") + b["text"]
            ra.append({"trang": t, "cot": c, "y0": y, "x0": ds[0]["x0"], "text": text})
        for a in anh:
            ra.append({"trang": t, "cot": cot(a[0]), "y0": a[1], "x0": a[0], "anh": a})
    ra.sort(key=lambda h: (h["trang"], h["cot"], h["y0"], h["x0"]))
    return ra


# Chữ cái lựa chọn: sau nó là dấu cách, hoặc dính liền dấu mở《“「（ ("A《西游记》…")
RE_LUA_CHON = re.compile(r"(?:^|\s{2,})([A-F])(?:\s+|(?=[《“「（]))")


def tach_lua_chon(t):
    """'A 使用温水   B 常换牙刷' → [("A","使用温水"), ("B","常换牙刷")]; không phải dòng lựa chọn → None."""
    s = t.strip()
    if not re.match(r"^[A-F](\s|(?=[《“「（]))", s):
        return None
    phan = RE_LUA_CHON.split(s)
    return [(phan[i], phan[i + 1].strip()) for i in range(1, len(phan) - 1, 2)]


RE_O_CUOI = re.compile(r"\s{3,}（\s*([A-F√×]?)\s*）\s*$")
RE_CHU_CAI_CUOI = re.compile(r"\s{3,}([A-F](?:\s+[A-F]){0,4})\s*$")


def phan_tich_nhom(hang, tu, den):
    """
    Tách một nhóm thành: ví dụ, các đoạn văn chung, lựa chọn chung (A–F in sẵn
    phía trên), và từng câu {so, dong, luaChon, hinh}.
    Ô trả lời cuối dòng "（  E  ）" / chữ cái cuối dòng "B  A  C" là đáp án
    của câu ví dụ (câu thường thì ô trống), được tách riêng khỏi chữ.
    """
    kq = {"viDu": None, "doan": [], "chung": [], "cau": {}}
    hien = None  # đối tượng đang ghi: ví dụ / đoạn / câu

    def moi_vi_du():
        return {"dong": [], "luaChon": [], "hinh": [], "dapAn": None, "cacVd": []}

    for h in hang:
        if "anh" in h:
            if hien is not None:
                hien["hinh"].append(h["anh"])
            continue
        t = chuan_hoa(h["text"])
        s = t.strip()
        if not s:
            continue
        dap = None
        m = RE_O_CUOI.search(t)
        if m:
            dap, t = m.group(1) or None, t[: m.start()]
        else:
            m = RE_CHU_CAI_CUOI.search(t)
            if m and not tach_lua_chon(t[: m.start()]) is None or (m and not re.match(r"^\s*[A-F]\s", t)):
                dap, t = re.sub(r"\s+", "", m.group(1)), t[: m.start()]
        s = t.strip()

        if s.startswith("例如"):
            hien = kq["viDu"] = moi_vi_du()
            s = re.sub(r"^例如[：:]?\s*", "", s)
        else:
            m = re.match(r"^(\d+)\s*[-－–]\s*(\d+)\s*[．.]\s*$", s)
            if m and tu <= int(m.group(1)) <= den:
                hien = {"tu": int(m.group(1)), "den": int(m.group(2)), "dong": [], "luaChon": [], "hinh": []}
                kq["doan"].append(hien)
                continue
            m = re.match(r"^(\d+)\s*[．.]\s*(.*)$", s)
            if m and tu <= int(m.group(1)) <= den and int(m.group(1)) not in kq["cau"]:
                so = int(m.group(1))
                hien = kq["cau"][so] = {"so": so, "dong": [], "luaChon": [], "hinh": []}
                s = m.group(2).strip()
        if dap and hien is kq["viDu"] and hien is not None:
            hien["dapAn"] = dap
        if not s:
            continue
        # Đoạn văn kèm nhiều câu hỏi chỉ bắt đầu bằng ★ (HSK 4: "80-81．" rồi 2 câu ★):
        # dòng ★ trong đoạn (hoặc sau câu đã có lựa chọn) → câu tiếp theo của đoạn
        if s.startswith("★") and hien is not None and hien is not kq["viDu"]:
            doan = hien if "tu" in hien else hien.get("_doan")
            if doan is not None and ("tu" in hien or hien["luaChon"]):
                so = next((x for x in range(doan["tu"], doan["den"] + 1) if x not in kq["cau"]), None)
                if so is not None:
                    hien = kq["cau"][so] = {"so": so, "dong": [], "luaChon": [], "hinh": [], "_doan": doan}
        lc = tach_lua_chon(s)
        dich = hien if hien is not None else None
        if lc:
            ds = []
            for ma, noi in lc:
                if "√" in noi and dich is kq["viDu"]:
                    kq["viDu"]["dapAn"] = ma
                ds.append([ma, noi.replace("√", "").strip()])
            (dich["luaChon"] if dich is not None else kq["chung"]).extend(ds)
        elif dich is not None and dich["luaChon"] and "tu" not in dich:
            dich["luaChon"][-1][1] += s  # lựa chọn dài bị xuống dòng
        elif dich is not None:
            # Dòng thụt vào (≈2 chữ) so với lề trái là đầu một đoạn văn mới: đánh
            # dấu bằng 2 dấu cách để doan_van_raw() tách đoạn
            dich["dong"].append(("  " if "tu" in dich and h["x0"] > 105 and h["cot"] == 0 else "") + s)
            if dich is kq["viDu"] and dap:
                dich["cacVd"].append((len(dich["dong"]), dap))
    return kq


def tokens_dong(ds, tu, den):
    return [sang_token(d, tu, den) for d in ds]


def tokens_lua_chon(lc):
    return [{"ma": ma, "chu": sang_token(noi, trong=False)} for ma, noi in lc]


def cat_cac_anh(cat, ds, ten):
    """Cắt danh sách ảnh (kèm số trang) → tên file."""
    return [cat.cat(t, a, f"{ten}-{i + 1}" if len(ds) > 1 else ten) for i, (t, a) in enumerate(ds)]


def dung_nhom_cao(tai_lieu, n, kieu, dap_an, dap_an_viet, cat):
    """Dựng một nhóm câu HSK 3–6 theo dạng `kieu`."""
    tu, den = n["tu"], n["den"]
    nhom = {"tieuDe": n["tieuDe"], "kieu": kieu, "huongDan": n["huongDan"], "cau": []}

    if kieu == "ghep-hinh":  # HSK 3 nghe phần 1: ảnh A–F, nghe hội thoại
        (t, manh, anh, _), = trong_vung(tai_lieu, n["vung"][:1])
        vd_y = vi_du_y(manh)
        tren = [m for m in manh if m.y0 < (vd_y if vd_y else min(y for _, y in so_cau(manh)))]
        af = anh_theo_chu_cai(tren, anh)
        nhom["luaChon"] = [{"ma": c, "hinh": cat.cat(t, af[c], f"c{tu}-{c}")} for c in sorted(af)]
        kq = phan_tich_nhom(cac_hang(tai_lieu, n["vung"], tu, den), tu, den)
        if kq["viDu"]:
            nhom["viDu"] = {"dong": tokens_dong(kq["viDu"]["dong"], tu, den), "dapAn": kq["viDu"]["dapAn"]}
        for so in range(tu, den + 1):
            nhom["cau"].append({"so": so, "dapAn": dap_an[so]})
        return nhom

    if kieu == "dien-chu":  # HSK 3 viết phần 2: pinyin cho sẵn, viết chữ Hán
        for t, manh, _, _ in trong_vung(tai_lieu, n["vung"]):
            han = [m for m in manh if m.co == CO_CHU_HAN or (m.co == CO_NHAN and "例如" not in m.chu and not m.chu.strip().isdigit())]
            py = [m for m in manh if m.co == CO_PINYIN]
            cac_so = so_cau(manh)
            vd_y = vi_du_y(manh)
            moc = ([(0, vd_y)] if vd_y else []) + cac_so
            for i, (so, y) in enumerate(moc):
                y_het = moc[i + 1][1] - 12 if i + 1 < len(moc) else CHAN_TRANG_Y
                dong_han = sorted([m for m in han if y - 3 <= m.y0 < y_het and m.co == CO_CHU_HAN], key=lambda m: m.x0)
                # pinyin gợi ý nằm NGAY TRÊN dòng câu này (không lấy của câu sau)
                goi_y = " ".join(lam_sach_pinyin(p.chu) for p in py if y - 25 <= p.y0 < y - 3)
                chu = "".join(m.chu for m in dong_han)
                m = re.match(r"^(.*?)（(.*?)）(.*)$", chu)
                if not m:
                    raise ValueError(f"Câu {so}: không thấy ô （ ） trong '{chu}'")
                token = ([[bo_cach(m.group(1)), ""]] if m.group(1).strip() else []) + [["__", bo_cach(m.group(2))]] + (
                    [[bo_cach(m.group(3)), ""]] if m.group(3).strip() else []
                )
                muc = {"dong": [token], "goiY": goi_y}
                if so == 0:
                    nhom["viDu"] = {**muc, "dapAn": bo_cach(m.group(2))}
                else:
                    muc["dong"][0] = [tk if tk[0] != "__" else ["__", ""] for tk in token]
                    nhom["cau"].append({"so": so, **muc, "dapAn": dap_an_viet[so][0]})
        return nhom

    if kieu == "viet-hinh":  # HSK 4 viết phần 2: ảnh + từ, đặt câu (không chấm)
        # Mỗi hàng có thể có 2 câu (96 | 97): tìm số câu ở MỌI vị trí trong hàng
        for t, manh, anh, _ in trong_vung(tai_lieu, n["vung"]):
            moc = []
            for m in manh:
                c = m.chu.strip()
                mm = re.fullmatch(r"(\d+)\s*[．.]?", c)
                if m.co == CO_NHAN and mm and tu <= int(mm.group(1)) <= den:
                    moc.append((int(mm.group(1)), m))
                elif "例如" in c:
                    moc.append((0, m))
            for so, m in moc:
                cung_hang = [x for _, x in moc if x is not m and abs(x.y0 - m.y0) < 10 and x.x0 > m.x0]
                x_het = min((x.x0 for x in cung_hang), default=10_000)
                a = min([a for a in anh if abs((a[1] + a[3]) / 2 - m.y0) < 70 and m.x0 < a[0] < x_het],
                        key=lambda a: a[0] - m.x0)
                chu = sorted([x for x in manh if x.co == CO_CHU_HAN and abs(x.y0 - m.y0) < 10 and a[2] - 5 < x.x0 < x_het],
                             key=lambda x: x.x0)
                cac = [bo_cach(x) for x in re.split(r"\s{2,}", "  ".join(x.chu for x in chu)) if x.strip()]
                if so == 0:
                    nhom["viDu"] = {"hinh": cat.cat(t, a, "viet-vd"), "tuGoiY": cac[0], "thamKhao": cac[1:2]}
                else:
                    nhom["cau"].append({"so": so, "hinh": cat.cat(t, a, f"c{so}"), "tuGoiY": cac[0],
                                        "thamKhao": dap_an_viet.get(so, [])})
        nhom["cau"].sort(key=lambda c: c["so"])
        return nhom

    kq = phan_tich_nhom(cac_hang(tai_lieu, n["vung"], tu, den), tu, den)
    anh_vung = {}
    for t, _, anh, _ in trong_vung(tai_lieu, n["vung"]):
        for a in anh:
            anh_vung[tuple(a)] = t

    def hinh(ds, ten):
        return cat_cac_anh(cat, [(anh_vung[tuple(a)], a) for a in ds], ten)

    if kieu == "viet-tom-tat":  # HSK 6: 缩写 — đọc bài 10 phút rồi ẩn, viết tóm tắt
        # Không có dòng "101．": cả nhóm là 5 dòng hướng dẫn （1）…（5） rồi bài đọc.
        # Hướng dẫn: từ đầu tới hết mục （5） (kể cả dòng bị ngắt); bài đọc: từ dòng
        # thụt đầu dòng đầu tiên sau đó.
        hd, bai, het_hd = [], [], False
        for h in cac_hang(tai_lieu, n["vung"], tu, den):
            if "anh" in h:
                continue
            t = chuan_hoa(h["text"]).strip()
            if not t:
                continue
            if not het_hd and re.match(r"^（\d）", t):
                hd.append(t)
            elif not het_hd and hd and not (h["x0"] > 105 and hd[-1].startswith("（5）")):
                hd[-1] += t  # dòng hướng dẫn bị ngắt
            else:
                het_hd = True
                bai.append(("  " if h["x0"] > 105 else "") + t)
        if not hd or not bai:
            raise ValueError("Đề 缩写: không tách được hướng dẫn / bài đọc")
        nhom["cau"].append({"so": tu, "dong": tokens_dong(hd, 0, -1), "baiDoc": doan_van(bai), "phutDoc": 10, "thamKhao": []})
        return nhom

    if kieu == "viet-van":  # HSK 5: viết đoạn văn 80 chữ (không chấm)
        for so, c in sorted(kq["cau"].items()):
            nhom["cau"].append({"so": so, "dong": tokens_dong(c["dong"], 0, -1), "hinh": hinh(c["hinh"], f"c{so}"),
                                "thamKhao": dap_an_viet.get(so, [])})
        return nhom

    if kieu == "sap-xep-tu":  # HSK 3–5 viết phần 1: bấm các mảnh thành câu
        def manh_tu(d):
            return [bo_cach(x) for x in re.split(r"\s{2,}", chuan_hoa(d).strip()) if x.strip()]

        if kq["viDu"]:
            ds = kq["viDu"]["dong"]
            nhom["viDu"] = {"manh": manh_tu(ds[0]), "dapAn": [bo_cach(ds[1])] if len(ds) > 1 else []}
        for so, c in sorted(kq["cau"].items()):
            nhom["cau"].append({"so": so, "manh": manh_tu(" ".join(c["dong"])), "dapAn": dap_an_viet[so]})
        return nhom

    # ----- các dạng có đáp án chữ cái -----
    if kq["viDu"]:
        vd = kq["viDu"]
        if kieu == "dung-sai-cau" and vd["cacVd"]:
            # nhiều ví dụ: mỗi ví dụ kết thúc ở dòng ★ có dấu √ / ×
            cac, dau = [], 0
            for cuoi, dap in vd["cacVd"]:
                cac.append({"dong": tokens_dong(vd["dong"][dau:cuoi], tu, den), "dapAn": {"√": "dung", "×": "sai"}.get(dap, dap)})
                dau = cuoi
            nhom["viDu"] = cac
        else:
            nhom["viDu"] = {
                "dong": tokens_dong(vd["dong"], tu, den),
                "luaChon": tokens_lua_chon(vd["luaChon"]),
                "dapAn": {"√": "dung", "×": "sai"}.get(vd["dapAn"], vd["dapAn"]),
            }
            if not nhom["viDu"]["dapAn"]:  # đáp án ví dụ nằm trong ô （ E ） giữa câu
                nhom["viDu"]["dapAn"] = next((t[1] for d in nhom["viDu"]["dong"] for t in d if t[0] == "__" and t[1]), None)
    if kq["chung"]:
        nhom["luaChon"] = tokens_lua_chon(kq["chung"])
    if kq["doan"]:
        nhom["doanVan"] = [
            {"tu": d["tu"], "den": d["den"], "dong": doan_van_token(d["dong"], tu, den), "hinh": hinh(d["hinh"], f"doan{d['tu']}"),
             **({"luaChon": tokens_lua_chon(d["luaChon"])} if d["luaChon"] else {})}
            for d in kq["doan"]
        ]
    for so in range(tu, den + 1):
        c = kq["cau"].get(so)
        if c is None:
            # 选句填空: câu không có dòng riêng, chỉ là ô (71) trong đoạn văn
            if not any(d["tu"] <= so <= d["den"] for d in kq["doan"]):
                raise ValueError(f"Không thấy câu {so}")
            nhom["cau"].append({"so": so, "dapAn": dap_an[so]})
            continue
        muc = {"so": so, "dong": tokens_dong(c["dong"], tu, den), "dapAn": dap_an[so]}
        if c["luaChon"]:
            muc["luaChon"] = tokens_lua_chon(c["luaChon"])
        if c["hinh"]:
            muc["hinh"] = hinh(c["hinh"], f"c{so}")
        nhom["cau"].append(muc)
    return nhom


def doan_van(ds):
    """Nối các dòng của đoạn văn thành đoạn: dòng thụt đầu dòng (2 chữ) là đoạn mới."""
    doan = []
    for d in ds:
        t = chuan_hoa(d)
        moi = t.startswith(("  ", "\u3000")) or not doan
        (doan.append(bo_cach(t)) if moi else doan.__setitem__(-1, doan[-1] + bo_cach(t)))
    return doan


def doan_van_token(ds, tu, den):
    return [sang_token(p, tu, den) for p in doan_van_raw(ds)]


def doan_van_raw(ds):
    """Như doan_van nhưng giữ dấu cách (để còn nhận ra chỗ trống)."""
    doan = []
    for d in ds:
        t = chuan_hoa(d)
        if t.startswith(("  ", "\u3000")) or not doan:
            doan.append(t.strip())
        else:
            doan[-1] += " " + t.strip() if re.search(r"\s{2,}$", doan[-1]) else t.strip()
    return doan


BO_CUC = {
    3: ["ghep-hinh", "ghep-hinh", "dung-sai-cau", "chon", "chon",
        "ghep-cau", "ghep-cau", "dien-tu", "dien-tu", "chon",
        "sap-xep-tu", "dien-chu"],
    4: ["dung-sai-cau", "chon", "chon",
        "dien-tu", "dien-tu", "sap-xep-doan", "chon",
        "sap-xep-tu", "viet-hinh"],
    5: ["chon", "chon", "chon", "chon", "chon", "sap-xep-tu", "viet-van"],
    6: ["chon", "chon", "chon", "chon", "chon", "dien-cau", "chon", "viet-tom-tat"],
}

TEN_PHAN = {
    "nghe": ("听力", "Nghe hiểu"),
    "doc": ("阅读", "Đọc hiểu"),
    "viet": ("书写", "Viết"),
}


def dung_hsk_cao(tai_lieu, ma, cap, cat):
    """Dựng đề HSK 3–6."""
    bia = thong_tin_bia(tai_lieu)
    dap_an, dap_an_viet = doc_dap_an_chung(tai_lieu)
    cac_nhom = tim_cac_nhom(tai_lieu)
    if len(cac_nhom) != len(BO_CUC[cap]):
        raise ValueError(f"{ma}: thấy {len(cac_nhom)} nhóm câu, bố cục HSK {cap} cần {len(BO_CUC[cap])}: "
                         + ", ".join(f"{n['tu']}-{n['den']}" for n in cac_nhom))
    phan = {}
    for n, kieu in zip(cac_nhom, BO_CUC[cap]):
        phan.setdefault(n["phan"], []).append(dung_nhom_cao(tai_lieu, n, kieu, dap_an, dap_an_viet, cat))
    return lap_de(tai_lieu, bia, phan)


def lap_de(tai_lieu, bia, phan):
    ra = []
    for ma_phan in ("nghe", "doc", "viet"):
        if ma_phan not in phan:
            continue
        ten, ten_viet = TEN_PHAN[ma_phan]
        p = {"ma": ma_phan, "ten": ten, "tenViet": ten_viet, "nhom": phan[ma_phan]}
        if ma_phan == "nghe":
            p["amThanh"] = "nghe.mp3"
        else:
            p["thoiGianPhut"] = bia[ma_phan][1]
        so = sum(len(nh["cau"]) for nh in phan[ma_phan])
        if so != bia[ma_phan][0]:
            raise ValueError(f"Phần {ten}: dựng được {so} câu, bìa đề ghi {bia[ma_phan][0]}")
        ra.append(p)
    return {
        "phan": ra,
        "loiNghe": {str(k): v for k, v in doc_loi_nghe_chung(tai_lieu, bia["nghe"][0]).items()},
        # Tổng điểm CHỈ tính Nghe + Đọc, mỗi phần quy về 100 (quyết định 18.61)
        "diemMoiPhan": 100,
        "diemDat": 120,
    }


# ---------------------------------------------------------------------------
# HSK 2: có pinyin như HSK 1, dùng lại cách ghép pinyin theo vị trí
# ---------------------------------------------------------------------------
def dap_an_o(manh, y_tu=0, y_den=10_000):
    """Chữ cái / dấu √ × đáp án của câu ví dụ, in ở ô bên phải."""
    for m in manh:
        c = m.chu.strip()
        # vị trí thật của chữ cái (mảnh chữ hay có nhiều dấu cách đứng trước)
        x = m.x0 + (len(m.chu) - len(m.chu.lstrip())) * (m.x1 - m.x0) / max(len(m.chu), 1)
        if y_tu <= m.y0 < y_den and x > 380 and (re.fullmatch(r"[A-F]", c) or c in "√×"):
            return {"√": "dung", "×": "sai"}.get(c, c)
    return None


def dung_hsk2(tai_lieu, ma, cat):
    bia = thong_tin_bia(tai_lieu)
    dap_an, _ = doc_dap_an_chung(tai_lieu)
    cac_nhom = tim_cac_nhom(tai_lieu)
    kieu_theo_so = {1: "dung-sai-hinh", 11: "ghep-hinh", 16: "ghep-hinh", 21: "chon-chu", 31: "chon-chu",
                    36: "ghep-hinh", 41: "dien-tu", 46: "dung-sai-cau", 51: "ghep-cau", 56: "ghep-cau"}
    phan = {}
    for n in cac_nhom:
        kieu = kieu_theo_so[n["tu"]]
        nhom = {"tieuDe": n["tieuDe"], "kieu": kieu, "huongDan": n["huongDan"], "cau": []}
        vung = trong_vung(tai_lieu, n["vung"])
        for so_vung, (t, manh, anh, _) in enumerate(vung):
            cac_so = [(s, y) for s, y in so_cau(manh) if n["tu"] <= s <= n["den"]]
            vd_y = vi_du_y(manh)
            if kieu == "dung-sai-hinh":
                if vd_y is not None:
                    vd = sorted([a for a in anh if abs((a[1] + a[3]) / 2 - vd_y) < 80], key=lambda a: a[1])
                    nhom["viDu"] = [
                        {"hinh": cat.cat(t, vd[0], f"n1-vd1"), "dapAn": "dung"},
                        {"hinh": cat.cat(t, vd[1], f"n1-vd2"), "dapAn": "sai"},
                    ]
                for so, y in cac_so:
                    (a,) = anh_trong_hang(anh, y + 7)
                    nhom["cau"].append({"so": so, "hinh": cat.cat(t, a, f"c{so}"), "dapAn": dap_an[so]})
            elif kieu == "ghep-hinh":
                moc_tren = vd_y if vd_y is not None else min(y for _, y in cac_so)
                af = anh_theo_chu_cai([m for m in manh if m.y0 < moc_tren - 5], anh)
                nhom["luaChon"] = [{"ma": c, "hinh": cat.cat(t, af[c], f"c{n['tu']}-{c}")} for c in sorted(af)]
                for y, h, p in cac_dong(manh):
                    if y < moc_tren - 5:
                        continue
                    so = next((s for s, ys in cac_so if abs(ys - y) < 5), 0)
                    dong = ghep_dong(h, p)
                    if so == 0 and vd_y is not None and y < min([ys for _, ys in cac_so] or [10_000]):
                        nhom.setdefault("viDu", {"dong": [], "dapAn": dap_an_o(manh, vd_y - 10, (min([ys for _, ys in cac_so] or [10_000])))})
                        nhom["viDu"]["dong"].append(dong)
                    elif so:
                        muc = {"so": so, "dapAn": dap_an[so]}
                        if n["phan"] == "doc":
                            muc["dong"] = [dong]
                        nhom["cau"].append(muc)
                for so, _ in cac_so:  # câu nghe không có chữ
                    if not any(c["so"] == so for c in nhom["cau"]):
                        nhom["cau"].append({"so": so, "dapAn": dap_an[so]})
                nhom["cau"].sort(key=lambda c: c["so"])
            elif kieu in ("chon-chu", "dien-tu", "dung-sai-cau", "ghep-cau"):
                moc = ([(0, vd_y)] if vd_y is not None else []) + cac_so
                if kieu in ("dien-tu", "ghep-cau") and so_vung == 0:
                    tren = [m for m in manh if m.y0 < (vd_y if vd_y is not None else moc[0][1]) - 10]
                    if kieu == "dien-tu":
                        nhom["luaChon"] = lua_chon_chu(tren)
                    else:
                        nhom["luaChon"] = []
                        for cc, m, _ in sorted(chu_cai(tren), key=lambda x: x[1].y0):
                            dong = [d for d in cac_dong(tren, 100) if abs(d[0] - m.y0) < 6]
                            nhom["luaChon"].append({"ma": cc, "chu": ghep_dong(dong[0][1], dong[0][2])})
                for i, (so, y) in enumerate(moc):
                    y_het = moc[i + 1][1] - 12 if i + 1 < len(moc) else CHAN_TRANG_Y
                    trong = [m for m in manh if y - 16 <= m.y0 < y_het]
                    if kieu == "chon-chu":
                        nhan = chu_cai(trong)
                        y_lc = min((m.y0 for _, m, _x in nhan), default=CHAN_TRANG_Y)
                        dong = [ghep_dong(h, p) for yy, h, p in cac_dong(trong) if yy < y_lc - 8]
                        lc = lua_chon_chu([m for m in trong if m.y0 >= y_lc - 16])
                        if so == 0:
                            dung = next((m for m in trong if m.chu.strip() == "√"), None)
                            dap = None
                            if dung:
                                dap = max((x for x in sorted(chu_cai(trong), key=lambda t: t[2]) if x[2] < dung.x0), key=lambda x: x[2])[0]
                            nhom["viDu"] = {"dong": dong, "luaChon": lc, "dapAn": dap}
                        else:
                            nhom["cau"].append({"so": so, "luaChon": lc, "dapAn": dap_an[so]})
                    else:
                        dien = next((m.chu.strip() for m in trong if m.co == CO_NHAN and 150 < m.x0 < 400 and re.fullmatch(r"[A-F]", m.chu.strip())), None)
                        dong = [ghep_dong(h, p, dien) for _, h, p in cac_dong([m for m in trong if m.chu.strip() not in ("√", "×")])]
                        if kieu == "dung-sai-cau":
                            # bỏ ô （ ） trả lời ở cuối dòng ★
                            dong = [d[:-1] if d and d[-1][0] == "__" else d for d in dong]
                        if so == 0:
                            if kieu == "dung-sai-cau":
                                # 2 ví dụ, mỗi ví dụ kết thúc ở dòng ★ có dấu √ / ×
                                dau = [m for m in trong if m.chu.strip() in ("√", "×")]
                                dong_y = [yy for yy, _, _ in cac_dong(trong)]
                                cac, bd = [], 0
                                for d in sorted(dau, key=lambda m: m.y0):
                                    cuoi = next(i for i, yy in enumerate(dong_y) if abs(yy - d.y0) < 8) + 1
                                    cac.append({"dong": dong[bd:cuoi], "dapAn": {"√": "dung", "×": "sai"}[d.chu.strip()]})
                                    bd = cuoi
                                nhom["viDu"] = cac
                            else:
                                nhom["viDu"] = {"dong": dong, "dapAn": dien or dap_an_o(trong)}
                        else:
                            nhom["cau"].append({"so": so, "dong": dong, "dapAn": dap_an[so]})
        phan.setdefault(n["phan"], []).append(nhom)
    return lap_de(tai_lieu, bia, phan)


# ---------------------------------------------------------------------------
# CHẠY
# ---------------------------------------------------------------------------
def dung_de(ma):
    pdf, mp3 = tim_file(ma, "pdf"), tim_file(ma, "mp3")
    if not pdf or not mp3:
        raise SystemExit(f"Thiếu {ma}.pdf hoặc {ma}.mp3 trong {THU_MUC_DE}")
    cap = int(ma[1])
    ra = THU_MUC_RA / ma
    if ra.exists():
        shutil.rmtree(ra)
    tai_lieu = pymupdf.open(pdf)
    cat = CatAnh(tai_lieu, ra / "hinh")
    if cap == 1:
        noi_dung = dung_hsk1(tai_lieu, ma, cat)
    elif cap == 2:
        noi_dung = dung_hsk2(tai_lieu, ma, cat)
    else:
        noi_dung = dung_hsk_cao(tai_lieu, ma, cap, cat)
    shutil.copyfile(mp3, ra / "nghe.mp3")

    de = {"version": PHIEN_BAN, "ma": ma, "cap": cap, **noi_dung}
    so = sum(len(n["cau"]) for p in de["phan"] for n in p["nhom"])
    if cap == 1 and so != 40:
        raise SystemExit(f"{ma}: dựng được {so} câu, cần 40. Kiểm tra lại bố cục.")
    (ra / "de.json").write_text(json.dumps(de, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{ma}: {so} câu, {len(list((ra / 'hinh').glob('*.jpg')))} ảnh.")
    return {"ma": ma, "cap": cap, "soCau": so}


def ghi_danh_sach():
    ds = []
    for tep in sorted(THU_MUC_RA.glob("*/de.json")):
        de = json.loads(tep.read_text(encoding="utf-8"))
        so = sum(len(n["cau"]) for p in de["phan"] for n in p["nhom"])
        ds.append({"ma": de["ma"], "cap": de["cap"], "version": de["version"], "soCau": so,
                   "phut": {p["ma"]: p.get("thoiGianPhut") for p in de["phan"]}})
    (THU_MUC_RA / "danh-sach.json").write_text(
        json.dumps({"version": PHIEN_BAN, "de": ds}, ensure_ascii=False, indent=1), encoding="utf-8"
    )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Cách dùng: python cong-cu/dung-de-thi.py H10901 [H10902 ...]   hoặc   tat-ca")
    cac_ma = sys.argv[1:]
    if cac_ma == ["tat-ca"]:
        cac_ma = sorted(p.stem for p in THU_MUC_DE.rglob("H*.pdf"))
    loi = []
    for ma in cac_ma:
        try:
            dung_de(ma)
        except Exception as e:  # noqa: BLE001 — báo lỗi từng đề, làm tiếp đề khác
            loi.append(f"{ma}: {e}")
            print(f"{ma}: LỖI {e}")
    ghi_danh_sach()
    if loi:
        raise SystemExit("Có đề lỗi:\n" + "\n".join(loi))
