# -*- coding: utf-8 -*-
"""
Công cụ TẢI ÂM THANH TỪ VỰNG (GĐ 10, quyết định 18.37).

NGUỒN: vẫn là bộ audio-cmn (github.com/hugolpz/audio-cmn), thư mục 64k/hsk/:
  8.596 file từ HSK, mỗi file một từ do người bản xứ đọc (Chen Wang),
  giấy phép CC BY-SA. Chỉ tải những từ CÓ TRONG dữ liệu của app
  (public/du-lieu/tu-vung-hsk1..3.json), không tải cả bộ.

TÊN FILE sau khi tải:
  public/am-thanh/tu/<chữ Trung của từ>.mp3   ví dụ: 爱.mp3, 北京.mp3
  (giữ nguyên chữ Hán trong tên file; đường dẫn web tự mã hoá)

Từ nào bộ âm thanh KHÔNG có thì bỏ qua, ghi vào danh sách thiếu để sau này bổ
sung. App đọc public/am-thanh/tu/danh-sach.json để biết từ nào có tiếng, từ nào
không (từ không có tiếng thì ẨN nút loa, không để người học bấm vào bị câm).

CÁCH CHẠY:
    npm run tai-am-tu
File nào đã có thì bỏ qua, chạy lại nhiều lần không sao.
"""

import json
import shutil
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

GOC = "https://raw.githubusercontent.com/hugolpz/audio-cmn/master/"
CAY = "https://api.github.com/repos/hugolpz/audio-cmn/git/trees/master?recursive=1"
THU_MUC = "64k/hsk/"
RA = Path("public/am-thanh/tu")
DU_LIEU = sorted(Path("public/du-lieu").glob("tu-vung-hsk*.json"))


def tai_ve(url):
    """Tải một URL. Dùng urllib, mạng chặn phân giải tên miền thì dùng curl."""
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            return r.read()
    except Exception:
        if not shutil.which("curl"):
            raise
        kq = subprocess.run(["curl", "-sfL", "-m", "60", url], capture_output=True, check=True)
        return kq.stdout


def cac_tu_cua_app():
    """Tất cả từ tiếng Trung trong dữ liệu app, giữ thứ tự và không trùng."""
    ra = []
    for f in DU_LIEU:
        for m in json.loads(f.read_text(encoding="utf-8"))["danhSach"]:
            if m["tu"] not in ra:
                ra.append(m["tu"])
    return ra


def dung():
    RA.mkdir(parents=True, exist_ok=True)
    cay = json.loads(tai_ve(CAY))
    # Tên file gốc dạng "cmn-你好.mp3" → khoá tra cứu là "你好"
    co_san = {}
    for x in cay["tree"]:
        duong = x["path"]
        if duong.startswith(THU_MUC) and duong.endswith(".mp3"):
            ten = duong[len(THU_MUC):-len(".mp3")]
            if ten.startswith("cmn-"):
                co_san.setdefault(ten[4:], duong)

    cac_tu = cac_tu_cua_app()
    co, thieu, moi = [], [], 0
    for tu in cac_tu:
        duong = co_san.get(tu)
        if not duong:
            thieu.append(tu)
            continue
        co.append(tu)
        dich = RA / f"{tu}.mp3"
        if dich.exists() and dich.stat().st_size > 0:
            continue
        dich.write_bytes(tai_ve(GOC + urllib.parse.quote(duong)))
        moi += 1

    (RA / "danh-sach.json").write_text(
        json.dumps({
            "nguon": "audio-cmn (github.com/hugolpz/audio-cmn), 64k/hsk, giọng Chen Wang, CC BY-SA",
            "ghiChu": "coFile: các từ CÓ file tiếng. Từ nằm trong thieu là chưa có ghi âm, app ẩn nút loa.",
            "coFile": sorted(co),
            "thieu": sorted(thieu),
        }, ensure_ascii=False, indent=0) + "\n",
        encoding="utf-8",
    )
    print(f"Tổng {len(cac_tu)} từ: có tiếng {len(co)}, thiếu {len(thieu)}, tải mới {moi} file vào {RA}")


if __name__ == "__main__":
    dung()
