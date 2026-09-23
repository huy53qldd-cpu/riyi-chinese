# -*- coding: utf-8 -*-
"""
ÂM LỊCH VÀ TIẾT KHÍ (dùng cho công cụ dựng bảng ngày đặc biệt).

Thuật toán âm lịch: bản của Hồ Ngọc Đức (dựa theo Jean Meeus, "Astronomical
Algorithms"), đúng thuật toán mà lịch Việt Nam vẫn dùng. Múi giờ là THAM SỐ:
  - Âm lịch Việt Nam tính theo UTC+7
  - Âm lịch Trung Quốc tính theo UTC+8
Hai bên có năm lệch nhau 1 ngày, nên phải tính riêng, không dùng chung.

Tiết khí (Thanh Minh, Xuân phân, Thu phân) tính theo kinh độ Mặt Trời.

LƯU Ý: đây là thuật toán xấp xỉ (sai số nhỏ). Ngày nào rơi rất sát nửa đêm thì
vẫn có thể lệch, nên bảng kết quả PHẢI được người kiểm tra lại trước khi dùng.
"""

import math

PI = math.pi


def jd_tu_ngay(dd, mm, yy):
    """Ngày dương → số ngày Julius."""
    a = int((14 - mm) / 12)
    y = yy + 4800 - a
    m = mm + 12 * a - 3
    jd = dd + int((153 * m + 2) / 5) + 365 * y + int(y / 4) - int(y / 100) + int(y / 400) - 32045
    if jd < 2299161:
        jd = dd + int((153 * m + 2) / 5) + 365 * y + int(y / 4) - 32083
    return jd


def ngay_tu_jd(jd):
    """Số ngày Julius → (dd, mm, yy)."""
    if jd > 2299160:
        a = jd + 32044
        b = int((4 * a + 3) / 146097)
        c = a - int((b * 146097) / 4)
    else:
        b = 0
        c = jd + 32082
    d = int((4 * c + 3) / 1461)
    e = c - int((1461 * d) / 4)
    m = int((5 * e + 2) / 153)
    day = e - int((153 * m + 2) / 5) + 1
    month = m + 3 - 12 * int(m / 10)
    year = b * 100 + d - 4800 + int(m / 10)
    return day, month, year


def trang_moi(k):
    """Thời điểm trăng mới thứ k (tính từ 1900-01-01), theo ngày Julius."""
    T = k / 1236.85
    T2 = T * T
    T3 = T2 * T
    dr = PI / 180
    Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
    Jd1 = Jd1 + 0.00033 * math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
    M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
    Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
    F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
    C1 = (0.1734 - 0.000393 * T) * math.sin(M * dr) + 0.0021 * math.sin(2 * dr * M)
    C1 = C1 - 0.4068 * math.sin(Mpr * dr) + 0.0161 * math.sin(dr * 2 * Mpr)
    C1 = C1 - 0.0004 * math.sin(dr * 3 * Mpr)
    C1 = C1 + 0.0104 * math.sin(dr * 2 * F) - 0.0051 * math.sin(dr * (M + Mpr))
    C1 = C1 - 0.0074 * math.sin(dr * (M - Mpr)) + 0.0004 * math.sin(dr * (2 * F + M))
    C1 = C1 - 0.0004 * math.sin(dr * (2 * F - M)) - 0.0006 * math.sin(dr * (2 * F + Mpr))
    C1 = C1 + 0.0010 * math.sin(dr * (2 * F - Mpr)) + 0.0005 * math.sin(dr * (2 * Mpr + M))
    if T < -11:
        deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    else:
        deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
    return Jd1 + C1 - deltat


def kinh_do_mat_troi(jdn):
    """Kinh độ Mặt Trời (radian) tại thời điểm jdn (ngày Julius, có phần lẻ)."""
    T = (jdn - 2451545.0) / 36525
    T2 = T * T
    dr = PI / 180
    M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2
    L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
    DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * math.sin(dr * M)
    DL = DL + (0.019993 - 0.000101 * T) * math.sin(dr * 2 * M) + 0.000290 * math.sin(dr * 3 * M)
    L = (L0 + DL) * dr
    return L - PI * 2 * int(L / (PI * 2))


def _goc_mat_troi(ngay, mui_gio):
    """Kinh độ Mặt Trời quy về 12 cung (0-11) lúc 0 giờ địa phương."""
    return int(kinh_do_mat_troi(ngay - 0.5 - mui_gio / 24.0) / PI * 6)


def _ngay_trang_moi(k, mui_gio):
    return int(trang_moi(k) + 0.5 + mui_gio / 24.0)


def _thang_11(yy, mui_gio):
    off = jd_tu_ngay(31, 12, yy) - 2415021
    k = int(off / 29.530588853)
    nm = _ngay_trang_moi(k, mui_gio)
    if _goc_mat_troi(nm, mui_gio) >= 9:
        nm = _ngay_trang_moi(k - 1, mui_gio)
    return nm


def _thang_nhuan(a11, mui_gio):
    k = int((a11 - 2415021.076998695) / 29.530588853 + 0.5)
    i = 1
    arc = _goc_mat_troi(_ngay_trang_moi(k + i, mui_gio), mui_gio)
    while True:
        last = arc
        i += 1
        arc = _goc_mat_troi(_ngay_trang_moi(k + i, mui_gio), mui_gio)
        if arc == last or i >= 14:
            break
    return i - 1


def am_sang_duong(ngay_am, thang_am, nam_am, nhuan, mui_gio):
    """Ngày âm lịch → (dd, mm, yy) dương lịch. Trả None nếu không có ngày đó."""
    if thang_am < 11:
        a11 = _thang_11(nam_am - 1, mui_gio)
        b11 = _thang_11(nam_am, mui_gio)
    else:
        a11 = _thang_11(nam_am, mui_gio)
        b11 = _thang_11(nam_am + 1, mui_gio)
    k = int(0.5 + (a11 - 2415021.076998695) / 29.530588853)
    off = thang_am - 11
    if off < 0:
        off += 12
    if b11 - a11 > 365:
        leap_off = _thang_nhuan(a11, mui_gio)
        leap_month = leap_off - 2
        if leap_month < 0:
            leap_month += 12
        if nhuan and thang_am != leap_month:
            return None
        if nhuan or off >= leap_off:
            off += 1
    nm = _ngay_trang_moi(k + off, mui_gio)
    return ngay_tu_jd(nm + ngay_am - 1)


def ngay_tiet_khi(nam, goc_do, mui_gio):
    """
    Ngày (dd, mm, yy) mà Mặt Trời đi qua kinh độ `goc_do` trong năm `nam`,
    tính theo múi giờ đã cho. Dùng cho Thanh Minh (15°), Xuân phân (0°),
    Thu phân (180°).
    """
    muc_tieu = math.radians(goc_do)
    # Dò từng giờ trong khoảng hợp lý quanh thời điểm cần tìm
    jd_dau = jd_tu_ngay(1, 1, nam) - 1
    truoc = None
    for gio in range(0, 366 * 24):
        jd = jd_dau + gio / 24.0 - mui_gio / 24.0
        goc = kinh_do_mat_troi(jd)
        if truoc is not None:
            hieu_truoc = (truoc - muc_tieu) % (2 * PI)
            hieu_sau = (goc - muc_tieu) % (2 * PI)
            # Vừa vượt qua mốc: trước đó còn thiếu (gần 2π), sau đó đã qua (gần 0)
            if hieu_truoc > 2 * PI - 0.1 and hieu_sau < 0.1:
                # Thời điểm nằm trong khoảng [giờ trước, giờ này): lấy NGÀY của
                # giờ trước, vì nếu sự kiện rơi vào 23h xx thì vẫn là ngày hôm đó
                dd, mm, yy = ngay_tu_jd(int(jd_dau + (gio - 1) / 24.0 + 0.5))
                if yy == nam:
                    return dd, mm, yy
        truoc = goc
    return None


def thu_n_trong_thang(nam, thang, thu, lan):
    """Ví dụ thứ Hai (thu=0) lần thứ 2 của tháng 1: thu_n_trong_thang(2026, 1, 0, 2)."""
    jd = jd_tu_ngay(1, nam=nam, mm=thang) if False else jd_tu_ngay(1, thang, nam)
    # jd % 7 == 0 là thứ Hai (kiểm chứng: 2026-01-01 là thứ Năm)
    thu_ngay_dau = (jd + 1) % 7  # 0 = thứ Hai
    dich = (thu - thu_ngay_dau) % 7
    return ngay_tu_jd(jd + dich + (lan - 1) * 7)
