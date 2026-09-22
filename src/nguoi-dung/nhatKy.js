/* =============================================================================
   NHẬT KÝ HỌC: MỤC TIÊU NGÀY, CHUỖI NGÀY, TỔNG KẾT TUẦN
   =============================================================================

   Các hàm tính toán thuần (không đụng tới giao diện hay Firebase), để dễ đọc
   và dễ kiểm tra. NguoiDung.jsx giữ dữ liệu, file này chỉ tính.

   Nhật ký lưu theo NGÀY, khoá là ngày theo giờ của máy người dùng:

       nhatKy: {
         "2026-09-21": {
           dung: { "tu-0006": 2, "han-0003": 1 },   // mã mục → số lần làm đúng
           sai:  { "dtdn-0005": 1 },                // mã mục → số lần làm sai
           giay: 540,                               // thời gian học, tính bằng giây
           dat:  true                               // đã đạt mục tiêu ngày đó chưa
         }
       }

   Từ GĐ 10 mỗi ngày còn có thêm `baiXong: [7]` = các bài học xong trong ngày.

   MỤC TIÊU NGÀY (từ GĐ 10, quyết định 18.17): học xong "Bài hôm nay" (5 chữ
   Hán + 10 từ + 1 ngữ pháp, làm đủ các bước). Không còn mục tiêu tự chọn
   chữ Hán / từ / phút như GĐ 7.

   Quy ước đã chốt (xem QUYET-DINH-DA-CHOT.md, mục GĐ 7):
     - Một mục chỉ tính vào mục tiêu khi TRẢ LỜI ĐÚNG. Đúng nhiều lần trong
       ngày vẫn chỉ tính một.
     - Tuần chạy từ thứ Hai đến Chủ nhật.
   ============================================================================= */

/**
 * Tiến độ theo lộ trình bài học (GĐ 10), lưu trên Firestore ở trường `loTrinh`:
 *   { bai: 7, buoc: ["tu-the", "chu-tap-viet"] }
 *   bai  : số bài đang học (bắt đầu từ 1, tăng mãi; hết lộ trình thì quay vòng)
 *   buoc : các bước ĐÃ XONG của bài đang học
 */
export const LO_TRINH_BAN_DAU = {
  bai: 1,
  buoc: [],
  them: { chuViet: [], chuGame: [], tu: [], np: [] },
};

/**
 * Giữ lại tiến độ hợp lệ, chỗ nào sai thì dùng giá trị ban đầu.
 * Giữ cả ngày giao bài, danh sách mục hôm nay và phần cộng thêm (xem
 * src/luyen-tap/baiHoc.js); thiếu thì để trống, luật sang ngày sẽ tự tạo lại.
 */
export function chuanHoaLoTrinh(thu) {
  const bai = Math.round(Number(thu?.bai));
  const ds = (x) => (Array.isArray(x) ? x.filter((v) => typeof v === "string") : []);
  const ra = {
    bai: bai >= 1 ? bai : 1,
    buoc: ds(thu?.buoc),
  };
  if (typeof thu?.ngay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(thu.ngay)) ra.ngay = thu.ngay;
  const m = thu?.muc;
  if (m && typeof m === "object") {
    ra.muc = { chu: ds(m.chu), chuViet: ds(m.chuViet), chuGame: ds(m.chuGame), tu: ds(m.tu), np: ds(m.np) };
  }
  const t = thu?.them;
  ra.them = {
    chuViet: ds(t?.chuViet),
    chuGame: ds(t?.chuGame),
    tu: ds(t?.tu),
    np: ds(t?.np),
  };
  return ra;
}

// -----------------------------------------------------------------------------
// NGÀY THÁNG
// Dùng giờ của máy người dùng, KHÔNG dùng giờ quốc tế (UTC). Nếu dùng UTC thì
// ở Việt Nam, học lúc 6 giờ sáng sẽ bị tính vào ngày hôm trước.
// -----------------------------------------------------------------------------

/** Đổi một ngày thành chuỗi "YYYY-MM-DD" theo giờ máy. */
export function chuoiNgay(ngay = new Date()) {
  const n = ngay.getFullYear();
  const t = String(ngay.getMonth() + 1).padStart(2, "0");
  const d = String(ngay.getDate()).padStart(2, "0");
  return `${n}-${t}-${d}`;
}

/** Đọc chuỗi "YYYY-MM-DD" thành ngày (lúc 12 giờ trưa để tránh lệch giờ). */
export function docNgay(chuoi) {
  const [n, t, d] = chuoi.split("-").map(Number);
  return new Date(n, t - 1, d, 12);
}

/** Cộng (hoặc trừ, nếu số âm) một số ngày vào chuỗi ngày. */
export function congNgay(chuoi, soNgay) {
  const ngay = docNgay(chuoi);
  ngay.setDate(ngay.getDate() + soNgay);
  return chuoiNgay(ngay);
}

/** Ngày thứ Hai của tuần chứa ngày đã cho. */
export function dauTuan(chuoi) {
  const thu = docNgay(chuoi).getDay(); // 0 = Chủ nhật, 1 = thứ Hai...
  return congNgay(chuoi, thu === 0 ? -6 : 1 - thu);
}

/** 7 ngày của tuần bắt đầu từ thứ Hai `ngayDau`. */
export function cacNgayTrongTuan(ngayDau) {
  return Array.from({ length: 7 }, (_, i) => congNgay(ngayDau, i));
}

// -----------------------------------------------------------------------------
// MỘT NGÀY
// -----------------------------------------------------------------------------

/** Dấu hiệu "xoá ngày này khỏi nhật ký" trong hàng chờ ghi lên Firestore. */
export const XOA = "__xoa__";

export const NGAY_TRONG = () => ({ dung: {}, sai: {}, giay: 0, dat: false });

/** Loại của một mục, đoán theo đầu mã. */
export function loaiMuc(id) {
  if (id.startsWith("han-")) return "chu-han";
  if (id.startsWith("tu-")) return "tu";
  if (id.startsWith("dtdn-")) return "dong-tu";
  if (id.startsWith("np-")) return "ngu-phap";
  return "khac";
}

/**
 * Số đã làm được trong ngày, theo loại mục tiêu.
 *   chu-han : số chữ Hán khác nhau đã tập viết đạt
 *   tu      : số từ khác nhau đã trả lời đúng (gồm Tab C và Tab B)
 *   phut    : số phút học
 */
export function daLamTrongNgay(ngay, loai) {
  if (!ngay) return 0;
  if (loai === "phut") return Math.floor((ngay.giay ?? 0) / 60);
  const ids = Object.keys(ngay.dung ?? {});
  if (loai === "chu-han") return ids.filter((id) => loaiMuc(id) === "chu-han").length;
  return ids.filter((id) => ["tu", "dong-tu"].includes(loaiMuc(id))).length;
}

// -----------------------------------------------------------------------------
// CHUỖI NGÀY LIÊN TIẾP (STREAK)
// Lưu riêng thành { dai, ngayCuoiDat } để không phụ thuộc vào việc nhật ký cũ
// đã bị dọn bớt.
// -----------------------------------------------------------------------------

/** Chuỗi mới sau khi hôm nay vừa đạt mục tiêu. */
export function noiChuoi(chuoi, homNay) {
  if (chuoi?.ngayCuoiDat === homNay) return chuoi;
  const hopLe = chuoi?.ngayCuoiDat === congNgay(homNay, -1);
  return { dai: hopLe ? chuoi.dai + 1 : 1, ngayCuoiDat: homNay };
}

/** Độ dài chuỗi đang hiển thị. Bỏ lỡ trọn một ngày thì chuỗi về 0. */
export function doDaiChuoi(chuoi, homNay) {
  if (!chuoi?.ngayCuoiDat) return 0;
  if (chuoi.ngayCuoiDat === homNay || chuoi.ngayCuoiDat === congNgay(homNay, -1)) {
    return chuoi.dai;
  }
  return 0;
}

// -----------------------------------------------------------------------------
// DỌN NHẬT KÝ CŨ
// Chỉ giữ SO_NGAY_GIU ngày gần nhất, để tài liệu Firestore không phình mãi.
// Đủ cho trang Review xem lại khoảng 10 tuần.
// -----------------------------------------------------------------------------

export const SO_NGAY_GIU = 70;

/** Danh sách ngày quá cũ, cần xoá khỏi nhật ký. */
export function ngayCanDon(nhatKy, homNay) {
  const moc = congNgay(homNay, -SO_NGAY_GIU);
  return Object.keys(nhatKy).filter((ngay) => ngay < moc);
}

// -----------------------------------------------------------------------------
// TỔNG KẾT TUẦN (Tab E)
// -----------------------------------------------------------------------------

/**
 * Tổng hợp một tuần.
 * @returns {{
 *   cacNgay: Array<{ngay, chuHan, tu, phut, dung, sai, dat}>,
 *   chuHan: number, tu: number, phut: number,
 *   soLanDung: number, soLanSai: number, tiLeDung: number|null,
 *   soNgayDat: number,
 *   saiNhieuNhat: Array<{id, soLan}>
 * }}
 */
export function tongKetTuan(nhatKy, ngayDau) {
  const chuHan = new Set();
  const tu = new Set();
  const demSai = {};
  let giay = 0;
  let soLanDung = 0;
  let soLanSai = 0;
  let soNgayDat = 0;

  const cacNgay = cacNgayTrongTuan(ngayDau).map((ngay) => {
    const d = nhatKy[ngay] ?? NGAY_TRONG();
    const dung = Object.values(d.dung ?? {}).reduce((a, b) => a + b, 0);
    const sai = Object.values(d.sai ?? {}).reduce((a, b) => a + b, 0);

    for (const id of Object.keys(d.dung ?? {})) {
      const l = loaiMuc(id);
      if (l === "chu-han") chuHan.add(id);
      if (l === "tu" || l === "dong-tu") tu.add(id);
    }
    for (const [id, so] of Object.entries(d.sai ?? {})) {
      demSai[id] = (demSai[id] ?? 0) + so;
    }
    giay += d.giay ?? 0;
    soLanDung += dung;
    soLanSai += sai;
    if (d.dat) soNgayDat += 1;

    return {
      ngay,
      chuHan: daLamTrongNgay(d, "chu-han"),
      tu: daLamTrongNgay(d, "tu"),
      phut: daLamTrongNgay(d, "phut"),
      dung,
      sai,
      dat: Boolean(d.dat),
    };
  });

  const tong = soLanDung + soLanSai;
  return {
    cacNgay,
    chuHan: chuHan.size,
    tu: tu.size,
    phut: Math.floor(giay / 60),
    soLanDung,
    soLanSai,
    tiLeDung: tong > 0 ? soLanDung / tong : null,
    soNgayDat,
    saiNhieuNhat: Object.entries(demSai)
      .map(([id, soLan]) => ({ id, soLan }))
      .sort((a, b) => b.soLan - a.soLan || a.id.localeCompare(b.id)),
  };
}
