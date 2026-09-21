# -*- coding: utf-8 -*-
"""
Công cụ rút dữ liệu HSK từ file PDF đại cương chính thức.

NGUỒN: tai-lieu/新版HSK考试大纲（词汇、汉字、语法）.pdf
       Bản công bố 2025-11, áp dụng 2026-07, do 中外语言交流合作中心 phát hành.
       Đây là NGUỒN CHUẨN DUY NHẤT của dự án. Mọi danh sách từ, chữ, pinyin
       đều lấy từ đây, KHÔNG gõ tay, KHÔNG lấy từ trí nhớ.

Script tạo ra 2 nhóm file:
  1. src/du-lieu/hsk-goc/*.json  — dữ liệu thô rút thẳng từ PDF (để tra cứu)
  2. cong-cu/bo-ky-tu.txt        — danh sách ký tự dùng để CẮT FONT

CÁCH CHẠY:
    npm run rut-hsk
"""

import json
import re
import unicodedata
from pathlib import Path

from pypdf import PdfReader

PDF = Path("tai-lieu/新版HSK考试大纲（词汇、汉字、语法）.pdf")
RA_JSON = Path("src/du-lieu/hsk-goc")
RA_KYTU = Path("cong-cu/bo-ky-tu.txt")

# Chỉ lấy cấp 1, 2, 3 theo phạm vi dự án
CAC_CAP = (1, 2, 3)

SO_TRUNG = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7}

# Khoảng mã Unicode của chữ Hán
HAN = r"一-鿿㐀-䶿"
LA_HAN = re.compile("[" + HAN + "]")


def doc_trang(reader, tu, den):
    """Đọc chữ từ trang `tu` đến trang `den` (đánh số từ 0, không tính `den`)."""
    return [(i, reader.pages[i].extract_text() or "") for i in range(tu, den)]


# -----------------------------------------------------------------------------
# 1. TỪ VỰNG (词汇大纲)
# -----------------------------------------------------------------------------
# Mỗi mục có dạng:  序号  等级  词语  拼音  词性
#   "1 1 爱 ài 动"                -> cấp 1
#   "7 1（4） 半 bàn 数、（副）"   -> cấp chính 1, có thêm nghĩa ở cấp 4
#   "10 1 本1 běn 量"             -> chữ số nhỏ phân biệt từ đồng tự khác nghĩa
#   "14 1 不客气 bú kèqi"          -> không có từ loại
#
# PDF xuống dòng khá lộn xộn (có dòng dính 2 mục vào nhau), nên không tách theo
# dòng mà quét toàn bộ chữ bằng biểu thức, rồi kiểm tra 序号 có tăng liên tục
# hay không để biết có sót mục nào không.

PINYIN = r"a-zA-Z()À-ɏḀ-ỿǕ-ǜ"

# Lưu ý về cột 词语: một số từ có ngoặc đơn đánh dấu phần CÓ THỂ LƯỢC BỎ.
#   没（有）      -> nói "没" hoặc "没有" đều được
#   有（一）点儿  -> nói "有点儿" hoặc "有一点儿" đều được
# Vì vậy biểu thức phải cho phép （） nằm trong từ, nếu không sẽ bỏ sót.
MAU_TU_VUNG = re.compile(
    r"(\d{1,5})\s+"                               # 序号
    r"(\d|7-9)"                                   # 等级 chính
    r"((?:（[^）]*）)*)\s+"                        # các cấp phụ, ví dụ （4）
    r"([" + HAN + r"]+(?:（[" + HAN + r"]+）[" + HAN + r"]*)*\d?)\s+"  # 词语
    r"([" + PINYIN + r"]+(?:\s+[" + PINYIN + r"]+)*)"  # 拼音
    # 词性 (từ loại), có thể không có. Dùng [ 	] chứ không dùng \s để không
    # nuốt sang dòng kế tiếp. Ví dụ: 动 | 名、后缀 | 数、（副）
    r"(?:[ 	]+((?:[" + HAN + r"]+|（[" + HAN + r"]+）)(?:、(?:[" + HAN + r"]+|（[" + HAN + r"]+）))*))?"
)


def rut_tu_vung(reader):
    # Cấp 4 bắt đầu ở trang in 25, nhưng ta vẫn quét dư rồi lọc theo cột 等级,
    # như vậy không phụ thuộc vào việc cắt trang cho chuẩn.
    ket_qua = []
    da_thay = set()

    for _, chu in doc_trang(reader, 2, 40):
        for khop in MAU_TU_VUNG.finditer(chu):
            so_tt, cap, cap_phu_tho, tu, pinyin, tu_loai = khop.groups()

            if cap not in ("1", "2", "3"):
                continue
            so_tt = int(so_tt)
            if so_tt in da_thay:
                continue
            da_thay.add(so_tt)

            cap_phu = [int(x) for x in re.findall(r"\d", cap_phu_tho)]

            # Tách chữ số phân biệt từ đồng tự (本1 -> từ "本", số phân biệt 1)
            so_phan_biet = None
            if tu and tu[-1].isdigit():
                so_phan_biet = int(tu[-1])
                tu = tu[:-1]

            # Ngoặc đơn trong từ = phần có thể lược bỏ khi nói.
            # Lưu thêm dạng đầy đủ và dạng rút gọn để app hiển thị cho đúng.
            co_ngoac = "（" in tu
            dang_day_du = tu.replace("（", "").replace("）", "")
            dang_rut_gon = re.sub(r"（[^）]*）", "", tu)

            ket_qua.append(
                {
                    "soThuTu": so_tt,
                    "tu": dang_day_du,
                    "pinyin": pinyin.strip().replace("(", "").replace(")", ""),
                    "cap": int(cap),
                    # 词性 nguyên văn trong PDF, ví dụ "名、后缀". None nếu PDF không ghi
                    "tuLoaiPDF": tu_loai,
                    # Cấp phụ: từ này còn một NGHĨA KHÁC thuộc cấp cao hơn.
                    # App chỉ dạy nghĩa của cấp chính, nhưng lưu lại để biết.
                    "capPhu": cap_phu,
                    "soPhanBiet": so_phan_biet,
                    # Chỉ có ở vài từ: phần trong ngoặc nói cũng được, bỏ cũng được
                    "dangRutGon": dang_rut_gon if co_ngoac else None,
                    "dangGocTrongPDF": tu if co_ngoac else None,
                }
            )

    ket_qua.sort(key=lambda x: x["soThuTu"])
    return ket_qua


# -----------------------------------------------------------------------------
# 2. CHỮ HÁN (汉字大纲 — 认读字, chữ phải nhận biết được)
# -----------------------------------------------------------------------------
# Dạng:  "1. 爱"  hoặc  "169.四"  (có hoặc không có dấu cách)

MAU_TIEU_DE_CHU = re.compile(r"HSK[（(]([一二三四五六七])[^）)]*[)）]\s*认读字")
MAU_CHU = re.compile(r"(\d{1,4})\s*[.．]\s*([" + HAN + r"])")


def rut_chu_han(reader):
    theo_cap = {c: [] for c in CAC_CAP}
    cap_hien_tai = None

    # Phần chữ Hán bắt đầu ở trang in 264 -> chỉ số PDF 265
    for _, chu in doc_trang(reader, 265, 292):
        tieu_de = MAU_TIEU_DE_CHU.search(chu)
        if tieu_de:
            cap_hien_tai = SO_TRUNG.get(tieu_de.group(1))
        if cap_hien_tai not in CAC_CAP:
            continue
        for khop in MAU_CHU.finditer(chu):
            ky_tu = khop.group(2)
            if ky_tu not in theo_cap[cap_hien_tai]:
                theo_cap[cap_hien_tai].append(ky_tu)

    return theo_cap


# -----------------------------------------------------------------------------
# 3. NGỮ PHÁP (语法大纲)
# -----------------------------------------------------------------------------
# Phần này là bảng nhiều cột, cấu trúc phức tạp. Ở GĐ 0 chỉ lưu lại chữ thô
# theo từng cấp để làm nguyên liệu cho GĐ 5, chưa bóc tách thành thẻ ngữ pháp.

MAU_TIEU_DE_NP = re.compile(r"HSK[（(]([一二三四五六七])[^）)]*[)）]\s*语法")


def rut_ngu_phap(reader):
    theo_cap = {c: [] for c in CAC_CAP}
    cap_hien_tai = None

    for _, chu in doc_trang(reader, 295, 306):
        tieu_de = MAU_TIEU_DE_NP.search(chu)
        if tieu_de:
            cap_hien_tai = SO_TRUNG.get(tieu_de.group(1))
        if cap_hien_tai not in CAC_CAP:
            continue
        # Bỏ dòng đóng dấu bản quyền lặp đi lặp lại trong PDF
        sach = [
            d.strip()
            for d in chu.split("\n")
            if d.strip() and d.strip() != "汉考国际"
        ]
        theo_cap[cap_hien_tai].extend(sach)

    return theo_cap


# -----------------------------------------------------------------------------
# 4. BỘ KÝ TỰ ĐỂ CẮT FONT
# -----------------------------------------------------------------------------
def gom_bo_ky_tu(tu_vung, chu_han, ngu_phap):
    """
    Gom tất cả ký tự mà app sẽ cần vẽ ra màn hình.

    Cắt font theo đúng bộ này, thay vì tải font CJK bản đầy đủ (hơn 10MB mỗi
    font, rất chậm trên 4G).
    """
    bo = set()

    # --- Chữ Hán từ cả 3 nguồn trong PDF ---
    for muc in tu_vung:
        bo.update(muc["tu"])
    for cap in chu_han.values():
        bo.update(cap)
    for cap in ngu_phap.values():
        for dong in cap:
            bo.update(c for c in dong if LA_HAN.match(c))

    # --- Chữ cái Latin, chữ số, dấu câu ---
    bo.update("abcdefghijklmnopqrstuvwxyz")
    bo.update("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    bo.update("0123456789")
    bo.update(" .,;:!?()[]{}/-_+=*&%#@~|<>^$")
    bo.update('"')
    bo.update("'")
    bo.update("\\")
    bo.update("–—")  # gạch ngang dài

    # --- Pinyin: nguyên âm kèm 4 thanh điệu ---
    bo.update("āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹḿ")
    bo.update("ĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙÜ")

    # --- Dấu câu tiếng Trung / tiếng Nhật ---
    bo.update("，。、；：？！“”‘’（）《》〈〉【】〔〕…·「」『』〜ー～")

    # --- Kana tiếng Nhật ---
    for ma in range(0x3041, 0x3097):  # hiragana
        bo.add(chr(ma))
    for ma in range(0x30A0, 0x30FB):  # katakana
        bo.add(chr(ma))
    bo.add("々")  # dấu lặp chữ Hán, hay gặp trong tiếng Nhật (人々, 時々)
    bo.add("ヶ")

    # --- Chữ tiếng Việt có dấu ---
    dau = "̣̀́̃̉"  # huyền, sắc, ngã, hỏi, nặng
    nen = "aăâeêioôơuưyAĂÂEÊIOÔƠUƯY"
    for k in nen:
        bo.add(k)
        for d in dau:
            bo.add(unicodedata.normalize("NFC", k + d))
    bo.update("đĐăĂâÂêÊôÔơƠưƯ")

    return bo


def main():
    if not PDF.exists():
        raise SystemExit("Không tìm thấy file PDF: " + str(PDF))

    print("Đang đọc PDF (317 trang, mất khoảng 30 giây)...")
    reader = PdfReader(str(PDF))

    print("Đang rút từ vựng...")
    tu_vung = rut_tu_vung(reader)

    print("Đang rút chữ Hán...")
    chu_han = rut_chu_han(reader)

    print("Đang rút ngữ pháp...")
    ngu_phap = rut_ngu_phap(reader)

    RA_JSON.mkdir(parents=True, exist_ok=True)
    nguon = {
        "nguon": "新版HSK考试大纲（词汇、汉字、语法）",
        "donViPhatHanh": "中外语言交流合作中心",
        "banCongBo": "2025-11",
        "apDung": "2026-07",
        "ghiChu": "Dữ liệu rút tự động từ PDF gốc, không chỉnh sửa tay.",
    }

    def ghi(ten, noi_dung):
        (RA_JSON / ten).write_text(
            json.dumps(noi_dung, ensure_ascii=False, indent=1), encoding="utf-8"
        )

    ghi("tu-vung-goc.json", {**nguon, "soMuc": len(tu_vung), "danhSach": tu_vung})
    ghi(
        "chu-han-goc.json",
        {
            **nguon,
            "soMuc": {str(k): len(v) for k, v in chu_han.items()},
            "danhSach": {str(k): v for k, v in chu_han.items()},
        },
    )
    ghi("ngu-phap-goc.json", {**nguon, "dongChu": {str(k): v for k, v in ngu_phap.items()}})

    bo = gom_bo_ky_tu(tu_vung, chu_han, ngu_phap)
    RA_KYTU.write_text("".join(sorted(bo)), encoding="utf-8")

    # --- Báo cáo để người dùng tự kiểm tra ---
    print()
    print("KẾT QUẢ")
    print("-" * 46)
    for c in CAC_CAP:
        n = sum(1 for m in tu_vung if m["cap"] == c)
        print("  Tu vung cap {}          : {:>5} tu".format(c, n))
    print("  Tong tu vung cap 1-3   : {:>5} tu".format(len(tu_vung)))
    print()
    for c in CAC_CAP:
        print("  Chu Han (认读字) cap {} : {:>5} chu".format(c, len(chu_han[c])))
    tong_chu = len(set().union(*chu_han.values()))
    print("  Tong chu Han cap 1-3   : {:>5} chu".format(tong_chu))
    print()
    so_han = sum(1 for c in bo if LA_HAN.match(c))
    print("  Bo ky tu de cat font   : {:>5} ky tu ({} chu Han)".format(len(bo), so_han))
    print("-" * 46)

    # Cảnh báo nếu 序号 bị đứt quãng, nghĩa là có mục PDF không đọc được
    so = [m["soThuTu"] for m in tu_vung]
    if so:
        thieu = sorted(set(range(1, max(so) + 1)) - set(so))
        if thieu:
            print()
            print("  ! CANH BAO: thieu {} so thu tu trong dai 1-{}.".format(len(thieu), max(so)))
            print("    Vi du cac so bi thieu: {}".format(thieu[:20]))
            print("    Can kiem tra lai truoc khi dung cho bai hoc.")
        else:
            print()
            print("  OK: so thu tu 1-{} lien tuc, khong sot muc nao.".format(max(so)))


if __name__ == "__main__":
    main()
