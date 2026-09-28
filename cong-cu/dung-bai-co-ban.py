# -*- coding: utf-8 -*-
"""
=============================================================================
DỰNG BÀI HỌC PHẦN 2 "TIẾNG TRUNG CƠ BẢN" TỪ BẢN CHÉP TAY GIÁO TRÌNH (18.64–18.67)
=============================================================================

Đầu vào:  cong-cu/co-ban/nguon/hsk<cấp>-bai-<số>.json  (chép tay từ HSK标准教程,
          pinyin gõ cách nhau theo từng chữ, ví dụ "nǐ men hǎo").
Đầu ra:   public/du-lieu/co-ban/hsk<cấp>/bai-<số>.json

Công cụ làm:
  1. Tách pinyin thành mảng khớp TỪNG KÝ TỰ của câu (dấu câu = ""), giống định
     dạng tu-vung-hsk*.json để app dùng chung component ChuTrung.
     Một cụm chữ số (50, 20) ứng với MỘT mục pinyin.
  2. Đối chiếu pinyin chép tay với từ điển pypinyin (mọi cách đọc của chữ):
     âm nào không có trong từ điển thì BÁO LỖI (bắt lỗi gõ nhầm).
  3. Tự sinh ghi chú biến điệu (不, 一, hai thanh 3) — pinyin luôn giữ thanh gốc.
  4. Đối chiếu từ mới với danh sách từ HSK 2025 của app (tu-vung-hsk1..3.json):
     gắn idTuVung + capHsk; từ không có trong danh sách 2025 thì ghi lại để báo.
  5. Kiểm tra file âm thanh được nhắc tới có trong thư mục giáo trình không.

Cách chạy:  python cong-cu/dung-bai-co-ban.py
=============================================================================
"""

import json
import os
import re
import sys
from datetime import date
from pathlib import Path

from pypinyin import Style, pinyin

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ngon_ngu import HAN, bo_dau, ghi_chu_bien_dieu, pinyin_cau  # noqa: E402

GOC = Path(__file__).resolve().parent.parent
NGUON = GOC / "cong-cu" / "co-ban" / "nguon"
DU_LIEU = GOC / "public" / "du-lieu"
GIAO_TRINH = GOC / "Giao_trinh"

SO = re.compile(r"[0-9]+")
# Cách đọc đã xác minh khác gợi ý của pypinyin (đối chiếu đại cương HSK 2025):
# 谁 shéi (HSK 1), 照片 zhàopiàn (HSK 3)
DA_XAC_MINH = {("谁", "shéi"), ("片", "piàn")}
loi, canh_bao = [], []


def tach_pinyin(trung, py, noi):
    """'你们好！' + 'nǐ men hǎo' -> ['nǐ','men','hǎo','']. Sai số lượng thì ghi lỗi."""
    the = py.split()
    ra, k, i = [], 0, 0
    while i < len(trung):
        c = trung[i]
        m = SO.match(trung, i)
        if m:  # cụm chữ số ăn một mục pinyin, các chữ số sau để rỗng
            ra.append(the[k] if k < len(the) else "?")
            ra += [""] * (len(m.group()) - 1)
            k += 1
            i = m.end()
            continue
        if HAN.match(c) or trung.startswith("___", i) or trung.startswith("……", i):
            do_dai = 3 if trung.startswith("___", i) else 2 if trung.startswith("……", i) else 1
            ra.append(the[k] if k < len(the) else "?")
            ra += [""] * (do_dai - 1)
            k += 1
            i += do_dai
            continue
        ra.append("")
        i += 1
    if k != len(the):
        loi.append(f"{noi}: '{trung}' có {k} chữ nhưng pinyin có {len(the)} âm: '{py}'")
    return ra


def kiem_tra_am(trung, am_tiet, noi):
    """Âm chép tay phải là một cách đọc của chữ theo từ điển (thanh nhẹ: so không dấu)."""
    for c, a in zip(trung, am_tiet):
        if not HAN.match(c) or not a:
            continue
        cac = pinyin(c, style=Style.TONE, heteronym=True)[0]
        a_nho = a.lower()
        if a_nho in cac:
            continue
        if bo_dau(a_nho) == a_nho and a_nho in {bo_dau(x) for x in cac}:
            continue  # thanh nhẹ
        loi.append(f"{noi}: chữ {c} chép '{a}', từ điển chỉ có {cac}")
    # Cách đọc theo ngữ cảnh (pypinyin xét cả cụm từ): khác bản chép tay thì cảnh báo
    # để người rà lại. Bỏ qua 一/不 (sách/app ghi thanh gốc) và thanh nhẹ.
    goi_y = pinyin_cau(trung)
    for c, a, g in zip(trung, am_tiet, goi_y):
        if (a and g and c not in "一不" and a.lower() != g and bo_dau(a.lower()) != a.lower()
                and (c, a) not in DA_XAC_MINH):
            canh_bao.append(f"{noi}: '{trung}' chữ {c} chép '{a}', từ điển đọc theo cụm là '{g}'")


def cau(trung, py, noi, **them):
    am = tach_pinyin(trung, py, noi)
    kiem_tra_am(trung, am, noi)
    ra = {"trung": trung, "pinyin": am}
    ghi = ghi_chu_bien_dieu(trung, am)
    if ghi:
        ra["ghiChuBienDieu"] = ghi
    ra.update({k: v for k, v in them.items() if v})
    return ra


def tai_tu_vung():
    tu = {}
    for cap in (1, 2, 3):
        for w in json.loads((DU_LIEU / f"tu-vung-hsk{cap}.json").read_text(encoding="utf-8"))["danhSach"]:
            tu.setdefault(w["tu"], w)
    return tu


def tim_am_thanh():
    """Mã file mp3: sách giáo khoa '01-1', sách bài tập có tiền tố 'bt-01-1'."""
    ra = set()
    for r, _, fs in os.walk(GIAO_TRINH):
        tien_to = "" if "课本" in r else "bt-" if "练习册" in r else None
        if tien_to is not None:
            ra |= {tien_to + f[:-4] for f in fs if f.endswith(".mp3")}
    return ra


def dung_bai(nguon, tu_vung, am_co):
    b = nguon["bai"]
    noi = f"bài {b}"
    thieu_tu = []

    def tu_moi(ds, loai):
        ra = []
        for x in ds:
            tu, py, tl = x[0], x[1], x[2] if len(x) > 2 else ""
            w = tu_vung.get(tu)
            muc = cau(tu, py, f"{noi} {loai} {tu}", tuLoai=tl)
            if len(x) > 3 and x[3] == "boSung":
                muc["boSung"] = True  # sách đánh dấu * : từ bổ sung
            if w:
                muc["idTuVung"], muc["capHsk"] = w["id"], w["capHsk"]
                muc["viet"] = w["nghiaViet"]
            elif loai == "tuMoi":
                thieu_tu.append(tu)
            else:
                muc["viet"] = x[2]
                muc.pop("tuLoai", None)
            ra.append(muc)
        return ra

    def am(ma):
        if ma and ma not in am_co:
            loi.append(f"{noi}: không thấy file âm thanh {ma}.mp3 trong Giao_trinh")
        return ma

    ra = {
        "loai": "bai-co-ban",
        "version": 1,
        "cap": 1,
        "bai": b,
        "capNhatLuc": date.today().isoformat(),
        "nguon": f"HSK标准教程 1 (HSK Standard Course 1), bài {b}: hội thoại, âm thanh, bài tập chọn lọc.",
        "ten": cau(nguon["ten"][0], nguon["ten"][1], noi, viet=nguon["ten"][2]),
    }
    if "khoiDong" in nguon:
        k = nguon["khoiDong"]
        ra["khoiDong"] = {
            "tieuDe": k["tieuDe"],
            "anh": k["anh"],
            "tu": [cau(t, p, f"{noi} khởi động", dapAn=d) for t, p, d in k["tu"]],
        }
    ra["hoiThoai"] = []
    for i, h in enumerate(nguon["hoiThoai"], 1):
        muc = {"so": i, "am": am(h["am"]), "anh": h.get("anh")}
        if "boiCanh" in h:
            t, p, v = h["boiCanh"]
            muc["boiCanh"] = cau(t, p, noi, viet=v)
        muc["cau"] = [cau(t, p, f"{noi} hội thoại {i}", nguoi=n, viet=v) for n, t, p, v in h["cau"]]
        muc["tuMoi"] = tu_moi(h["tuMoi"], "tuMoi")
        if "tenRieng" in h:
            muc["tenRieng"] = tu_moi(h["tenRieng"], "tenRieng")
        ra["hoiThoai"].append(muc)

    if "nguPhap" in nguon:
        ra["nguPhap"] = [
            {
                "ten": {"trung": g["ten"][0], "viet": g["ten"][1]},
                **({"mau": g["mau"]} if "mau" in g else {}),
                "giaiThich": g["giaiThich"],
                "viDu": [cau(t, p, f"{noi} ngữ pháp", viet=v) for t, p, v in g["viDu"]],
            }
            for g in nguon["nguPhap"]
        ]
    if "luyenTap" in nguon:
        ra["luyenTap"] = []
        for lt in nguon["luyenTap"]:
            muc = {"loai": lt["loai"], "tieuDe": lt["tieuDe"], "cau": []}
            for x in lt["cau"]:
                c = cau(x[0], x[1], f"{noi} luyện tập")
                if len(x) > 2:
                    c["dapAn"] = x[2].split("|")
                muc["cau"].append(c)
            ra["luyenTap"].append(muc)

    # Phát âm: giữ nguyên cấu trúc, chỉ đổi các cặp chữ Hán + pinyin thành câu có mảng pinyin
    ra["phatAm"] = []
    for p in nguon["phatAm"]:
        p = dict(p)
        if p.get("am"):
            am(p["am"])
        for khoa in ("giuNguyen", "doiThanh2", "doiThanh4"):
            if khoa in p:
                p[khoa] = [cau(t, py, f"{noi} {p['tieuDe']}", viet=v) for t, py, v in p[khoa]]
        if p["loai"] == "thanh-nhe":
            p["viDu"] = [cau(t, py, f"{noi} thanh nhẹ", viet=v) for t, py, v in p["viDu"]]
        if p["loai"] == "thanh-dieu":
            p["viDu"] = [cau(t, py, f"{noi} thanh điệu", viet=v) for t, py, v in p["viDu"]]
        if "am_tiet" in p:
            p["amTiet"] = p.pop("am_tiet")
        ra["phatAm"].append(p)

    if "cumTuLop" in nguon:
        c = nguon["cumTuLop"]
        ra["cumTuLop"] = {"am": am(c["am"]), "cau": [cau(t, p, f"{noi} câu dùng trong lớp", viet=v) for t, p, v in c["cau"]]}
    if "chuHan" in nguon:
        ch = nguon["chuHan"]
        ra["chuHan"] = {
            "net": [{"net": n, "ten": t, "pinyin": p, "viet": v, "viDu": vd} for n, t, p, v, vd in ch["net"]],
            "chuDocThe": [{**cau(c, p, f"{noi} chữ độc thể"), "giaiThich": g} for c, p, g in ch["chuDocThe"]],
        }
        if "butThuan" in ch:
            ra["chuHan"]["butThuan"] = [{"quyTac": q, "viet": v, "viDu": vd} for q, v, vd in ch["butThuan"]]
    if "vanDung" in nguon:
        v = nguon["vanDung"]
        ra["vanDung"] = {"tieuDe": v["tieuDe"], "viDu": [cau(t, p, f"{noi} vận dụng", nguoi=n, viet=vi) for n, t, p, vi in v["viDu"]]}
        if "tuBoSung" in v:
            ra["vanDung"]["tuBoSung"] = tu_moi(v["tuBoSung"], "tuBoSung")
    if "vanHoa" in nguon:
        v = nguon["vanHoa"]
        ra["vanHoa"] = {
            "tieuDe": {"trung": v["tieuDe"][0], "viet": v["tieuDe"][1]},
            "noiDung": v["noiDung"],
            "cau": [cau(t, p, f"{noi} văn hóa") for t, p in v["cau"]],
        }

    # Từ HSK 1 bản 2025 sách không dạy, gắn vào bài này (hsk1-tu-bo-sung.json, 18.65)
    bo_sung = json.loads((NGUON / "hsk1-tu-bo-sung.json").read_text(encoding="utf-8")).get(str(b), [])
    ra["tuBoSung2025"] = []
    for t in bo_sung:
        w = tu_vung.get(t)
        if not w:
            loi.append(f"{noi}: từ bổ sung {t} không có trong tu-vung-hsk*.json")
            continue
        ra["tuBoSung2025"].append({"trung": t, "pinyin": w["pinyin"], "idTuVung": w["id"],
                                   "capHsk": w["capHsk"], "viet": w["nghiaViet"]})
    bt = dung_bai_tap(b, am, noi)
    if bt:
        ra["baiTap"] = bt
    # Điểm ngữ pháp HSK 1 bản 2025 dạy trong bài (hsk1-ngu-phap.json)
    ra["nguPhapHsk"] = json.loads((NGUON / "hsk1-ngu-phap.json").read_text(encoding="utf-8"))[str(b)]["hsk"]
    gan_hinh(ra, noi)
    ra["canKiemTra"] = [
        "Bản dịch tiếng Việt của hội thoại, ví dụ, giải thích là bản nháp của Claude, chưa có người duyệt.",
        "Pinyin chép tay từ sách (đã đối chiếu tự động với từ điển); ghi chú biến điệu do máy sinh theo quy tắc.",
    ]
    if "khoiDong" in nguon:
        ra["canKiemTra"].append("Đáp án phần khởi động do Claude suy từ ảnh (sách không in đáp án).")
    return ra, thieu_tu


DAU_CAU = "，。！？、：；…“”"


def tach_chu(chuoi, noi):
    """'你|Nǐ 好|hǎo ，我|wǒ __ 。' -> [['你','Nǐ'],['好','hǎo'],['，',''],['我','wǒ'],['__',''],['。','']]"""
    ra = []
    # Pinyin có thể có dấu cách ("Lǐ Yuè") nên tách theo ranh giới chữ Hán, không theo dấu cách
    for dau, trong, tu, py, khac in re.findall(
        rf"([{DAU_CAU}]+)|(__)|([㐀-鿿0-9]+)\|([^㐀-鿿0-9{DAU_CAU}_]*)|([^\s㐀-鿿{DAU_CAU}|_]+)", chuoi
    ):
        if dau or trong or khac:
            ra.append([dau or trong or khac, ""])
            continue
        py = py.strip()
        # Đối chiếu pinyin với từ điển (không tính dấu thanh, dấu cách, dấu cách âm)
        # bo_dau bỏ luôn hai chấm của ü nên so sánh ở dạng u; 谁 đọc shéi (đã xác minh, xem DA_XAC_MINH)
        goi_y = "".join(x[0] for x in pinyin(tu, style=Style.NORMAL, v_to_u=True)).replace("ü", "u")
        goi_y = goi_y.replace("shui", "shei") if "谁" in tu else goi_y
        if not any(c.isdigit() for c in tu) and bo_dau(py.lower()).replace(" ", "").replace("'", "").replace("’", "") != goi_y:
            canh_bao.append(f"{noi}: '{tu}' pinyin '{py}' khác từ điển '{goi_y}'")
        ra.append([tu, py])
    return ra


def dung_bai_tap(b, am, noi):
    """Bài tập chọn lọc từ sách bài tập (hsk1-bt-XX.json), cùng định dạng với đề Thi thử."""
    f = NGUON / f"hsk1-bt-{b:02d}.json"
    if not f.exists():
        return None
    nguon = json.loads(f.read_text(encoding="utf-8"))

    def cau_hoi(c):
        c = dict(c)
        for k in ("chu",):
            if k in c:
                c[k] = tach_chu(c[k], noi)
        if isinstance(c.get("luaChon"), list) and c["luaChon"] and "|" in c["luaChon"][0]:
            c["luaChon"] = [{"ma": "ABC"[i], "chu": tach_chu(x, noi)} for i, x in enumerate(c["luaChon"])]
            c["dapAn"] = c["dapAn"]
        return c

    ra = {}
    for phan in ("nghe", "doc", "phatAm"):
        if phan not in nguon:
            continue
        p = nguon[phan]
        muc = {"nhom": []}
        if p.get("am"):
            muc["am"] = am("bt-" + p["am"])
        for n in p["nhom"]:
            n = dict(n)
            if isinstance(n.get("luaChon"), dict):
                n["luaChon"] = [
                    {"ma": k, **({"hinh": v} if v.startswith("bt-") else {"chu": tach_chu(v, noi)})}
                    for k, v in n["luaChon"].items()
                ]
            if "viDu" in n:
                n["viDu"] = [cau_hoi(x) for x in n["viDu"]] if isinstance(n["viDu"], list) else cau_hoi(n["viDu"])
            n["cau"] = [cau_hoi(c) for c in n["cau"]]
            muc["nhom"].append(n)
        ra[phan] = muc
    return ra


def gan_hinh(bai, noi):
    """
    Gắn tên ảnh (do cat-anh-co-ban.py cắt ra, thư mục hinh/bai-XX/) vào bài.
    App ghép đường dẫn: du-lieu/co-ban/hsk1/hinh/bai-XX/<tên>.webp
    """
    thu_muc = DU_LIEU / "co-ban" / "hsk1" / "hinh" / f"bai-{bai['bai']:02d}"

    def co(ten):
        if not (thu_muc / f"{ten}.webp").exists():
            loi.append(f"{noi}: thiếu ảnh {ten}.webp")
        return ten

    for h in bai["hoiThoai"]:
        if h.get("anh"):
            h["anh"] = co(h["anh"])
    if "khoiDong" in bai:
        bai["khoiDong"]["anh"] = [co(f"khoi-dong-{c}") for c in bai["khoiDong"]["anh"]]
    # Ảnh của bài tập (tên bt-p<trang>-<số>)
    def moi_hinh(x):
        if isinstance(x, dict):
            for k, v in x.items():
                if k == "hinh" and isinstance(v, str) and v.startswith("bt-"):
                    co(v)
                else:
                    moi_hinh(v)
        elif isinstance(x, list):
            for y in x:
                moi_hinh(y)

    moi_hinh(bai.get("baiTap"))
    for p in bai["phatAm"]:
        if p["loai"] == "doc-hinh":
            p["hinh"] = [co(f"am-{p['am']}-{i}") for i in range(1, len(p["tu"]) + 1)]
        elif p["loai"] == "thanh-nhe":
            p["hinh"] = [co(f"thanh-nhe-{i}") for i in range(1, len(p["viDu"]) + 1)]
        elif p["loai"] == "er-hoa":
            p["hinh"] = [co(f"er-hoa-{i}") for i in range(1, len(p["viDu"]) + 1)]
        elif p["loai"] == "phan-biet" and isinstance(p.get("hinh"), str):
            # "j-q-x" -> mieng-j, mieng-q, mieng-x (ü đặt tên là v)
            p["hinh"] = [co(f"mieng-{a.replace('ü', 'v')}") for a in p["hinh"].split("-")]


def main():
    tu_vung = tai_tu_vung()
    am_co = tim_am_thanh()
    thu_muc = DU_LIEU / "co-ban" / "hsk1"
    thu_muc.mkdir(parents=True, exist_ok=True)
    tong_thieu = {}
    for f in sorted(NGUON.glob("hsk1-bai-*.json")):
        nguon = json.loads(f.read_text(encoding="utf-8"))
        bai, thieu = dung_bai(nguon, tu_vung, am_co)
        (thu_muc / f"bai-{nguon['bai']:02d}.json").write_text(
            json.dumps(bai, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        tong_thieu[nguon["bai"]] = thieu
        print(f"bài {nguon['bai']}: {len(bai['hoiThoai'])} hội thoại, "
              f"{sum(len(h['tuMoi']) for h in bai['hoiThoai'])} từ mới")
    # Mục lục khóa: tên 15 bài (bài chưa dựng: daCo = false) để app vẽ lộ trình
    muc_luc = json.loads((NGUON / "hsk1-muc-luc.json").read_text(encoding="utf-8"))
    for m in muc_luc["bai"]:
        m["daCo"] = (thu_muc / f"bai-{m['so']:02d}.json").exists()
    muc_luc.pop("_ghiChu", None)
    (thu_muc / "muc-luc.json").write_text(json.dumps(muc_luc, ensure_ascii=False, indent=1), encoding="utf-8")
    for b, t in tong_thieu.items():
        if t:
            print(f"  bài {b}: từ của sách KHÔNG có trong HSK 1–3 bản 2025: {' '.join(t)}")
    for x in canh_bao:
        print("CẢNH BÁO:", x)
    for x in loi:
        print("LỖI:", x)
    sys.exit(1 if loi else 0)


if __name__ == "__main__":
    main()
