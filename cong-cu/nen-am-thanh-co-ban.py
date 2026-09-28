# -*- coding: utf-8 -*-
"""
=============================================================================
NÉN ÂM THANH GIÁO TRÌNH CHO PHẦN 2 (quyết định 18.66, 18.67)
=============================================================================

Chỉ nén những file mà bài học đã dựng (public/du-lieu/co-ban/hsk1/bai-*.json)
thực sự dùng (trường "am"), không đưa cả thư mục âm thanh lên.

Thông số: MP3 mono, 24 kHz, 40 kbps (còn khoảng 42% dung lượng gốc 96 kbps).
Không hạ xuống 32 kbps vì bài phát âm cần phân biệt s / sh / x (năng lượng ở
dải tần cao, nén mạnh thì mờ).

ffmpeg lấy từ gói imageio-ffmpeg (pip install imageio-ffmpeg), không cài vào máy.

Cách chạy:  python cong-cu/nen-am-thanh-co-ban.py
=============================================================================
"""

import json
import os
import subprocess
from pathlib import Path

import imageio_ffmpeg

GOC = Path(__file__).resolve().parent.parent
BAI = GOC / "public" / "du-lieu" / "co-ban" / "hsk1"
RA = BAI / "am"


def tim_nguon():
    """{'01-1': mp3 sách giáo khoa, 'bt-01-1': mp3 sách bài tập}."""
    ra = {}
    for r, _, fs in os.walk(GOC / "Giao_trinh"):
        tien_to = "" if "课本" in r else "bt-" if "练习册" in r else None
        if tien_to is None:
            continue
        for f in fs:
            if f.endswith(".mp3"):
                ra[tien_to + f[:-4]] = Path(r) / f
    return ra


def ma_dung(bai):
    """Mọi mã âm thanh ("am") xuất hiện ở bất kỳ đâu trong bài."""
    if isinstance(bai, dict):
        for k, v in bai.items():
            if k == "am" and isinstance(v, str):
                yield v
            else:
                yield from ma_dung(v)
    elif isinstance(bai, list):
        for x in bai:
            yield from ma_dung(x)


def main():
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    nguon = tim_nguon()
    RA.mkdir(parents=True, exist_ok=True)
    can = sorted({m for f in BAI.glob("bai-*.json") for m in ma_dung(json.loads(f.read_text(encoding="utf-8")))})
    goc = sau = 0
    for m in can:
        ra = RA / f"{m}.mp3"
        if not ra.exists():
            subprocess.run([ff, "-v", "error", "-y", "-i", str(nguon[m]), "-ac", "1", "-ar", "24000",
                            "-b:a", "40k", "-map_metadata", "-1", str(ra)], check=True)
        goc += nguon[m].stat().st_size
        sau += ra.stat().st_size
    # Xoá file không còn bài nào dùng
    for f in RA.glob("*.mp3"):
        if f.stem not in can:
            f.unlink()
    print(f"{len(can)} file: {goc / 1e6:.1f} MB -> {sau / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
