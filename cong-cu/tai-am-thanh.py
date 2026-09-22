# -*- coding: utf-8 -*-
"""
Công cụ TẢI ÂM THANH ÂM TIẾT PINYIN (GĐ 10, tab Phát âm, quyết định 18.28).

NGUỒN: bộ audio-cmn (github.com/hugolpz/audio-cmn), thư mục 64k/syllabs/:
  1.707 âm tiết tiếng Trung, mỗi âm tiết đủ 4 thanh, người bản xứ đọc
  (Chen Wang), giấy phép CC BY-SA. Chất lượng 64 kbps (đủ rõ để học phát âm).

TÊN FILE sau khi tải (thống nhất, chỉ dùng chữ ASCII cho đường dẫn web):
  public/am-thanh/am-tiet/<âm tiết không dấu, ü viết là v><thanh 1-4>.mp3
  ví dụ: ma1.mp3, zhuang4.mp3, nv3.mp3 (nǚ), lve4.mp3 (lüè), ju4.mp3 (jù)
  (sau j q x y viết u theo đúng cách viết pinyin, dù file gốc có khi ghi ü/v)
  File gốc đôi khi viết ü là "ü", đôi khi là "v", có file có dấu "_" ở đầu
  (âm tiết hiếm): công cụ này gộp hết về một kiểu tên.

  Kèm theo: public/am-thanh/am-tiet/danh-sach.json (các âm tiết có file) và
  public/am-thanh/GIAY-PHEP.txt (ghi công tác giả, bắt buộc theo CC BY-SA).

CÁCH CHẠY:
    npm run tai-am-thanh
File nào đã có thì bỏ qua, chạy lại nhiều lần không sao.
"""

import json
import re
import shutil
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

GOC = "https://raw.githubusercontent.com/hugolpz/audio-cmn/master/"
CAY = "https://api.github.com/repos/hugolpz/audio-cmn/git/trees/master?recursive=1"
THU_MUC = "64k/syllabs/"
RA = Path("public/am-thanh/am-tiet")


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


def ten_chuan(ten_goc):
    """cmn-_nü3.mp3 → nv3 ; trả về None nếu không phải file âm tiết."""
    m = re.fullmatch(r"cmn-_?([a-zü]+?)([1-4])\.mp3", ten_goc)
    if not m:
        return None
    am = m.group(1).replace("ü", "v")
    # Sau j q x y, pinyin viết ü thành u (ju, que, xuan, yun): đặt tên theo cách viết
    if am[0] in "jqxy" and len(am) > 1 and am[1] == "v":
        am = am[0] + "u" + am[2:]
    return am + m.group(2)


def dung():
    RA.mkdir(parents=True, exist_ok=True)
    cay = json.loads(tai_ve(CAY))
    cac_file = [x["path"] for x in cay["tree"] if x["path"].startswith(THU_MUC)]
    # Ưu tiên file không có dấu "_" (bản chính) khi trùng tên chuẩn
    chon = {}
    for duong in sorted(cac_file, key=lambda p: "_" in p.split("/")[-1]):
        ten = ten_chuan(duong.split("/")[-1])
        if ten and ten not in chon:
            chon[ten] = duong

    moi = 0
    for ten, duong in sorted(chon.items()):
        dich = RA / f"{ten}.mp3"
        if dich.exists() and dich.stat().st_size > 0:
            continue
        dich.write_bytes(tai_ve(GOC + urllib.parse.quote(duong)))
        moi += 1

    am_tiet = sorted({re.sub(r"[1-4]$", "", t) for t in chon})
    (RA / "danh-sach.json").write_text(
        json.dumps({
            "nguon": "audio-cmn (github.com/hugolpz/audio-cmn), 64k/syllabs, giọng Chen Wang, CC BY-SA",
            "ghiChu": "Tên file: âm tiết không dấu (ü viết là v) + số thanh 1-4. Mỗi âm tiết ở đây có ít nhất một thanh.",
            "coFile": sorted(chon),
        }, ensure_ascii=False, indent=0) + "\n",
        encoding="utf-8",
    )
    Path("public/am-thanh/GIAY-PHEP.txt").write_text(
        "ÂM THANH ÂM TIẾT PINYIN — NGUỒN VÀ GIẤY PHÉP\n\n"
        "- am-tiet/ : bộ audio-cmn, https://github.com/hugolpz/audio-cmn\n"
        "  Giọng đọc: Chen Wang. Quản lý dự án: Hugo Lopez (PLIDAM, INALCO).\n"
        "  Giấy phép: CC BY-SA (https://creativecommons.org/licenses/by-sa/3.0/).\n"
        "  Riyi chỉ đổi tên file cho thống nhất, không sửa nội dung âm thanh.\n",
        encoding="utf-8",
    )
    print(f"Có {len(chon)} file ({len(am_tiet)} âm tiết), tải mới {moi} file vào {RA}")


if __name__ == "__main__":
    dung()
