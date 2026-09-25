/* =============================================================================
   SOẠN NỘI DUNG THÔNG BÁO (GĐ 11, quyết định 18.40)
   =============================================================================

   Chỉ có LOGIC THUẦN, không gọi mạng, không đọc file: nhờ vậy chạy thử và
   kiểm thử được dễ dàng (xem thu.test.js).

   Ba khung giờ mỗi ngày, tính theo giờ Việt Nam:
     7h  — chào ngày mới. Hôm đó là ngày đặc biệt thì báo ngày đặc biệt, không
           thì lấy 1 trong 10 câu, quay vòng theo số ngày kể từ 2026-01-01.
     14h — tiến độ hôm nay + câu động viên theo mức %.
     21h — tiến độ hôm nay + câu động viên theo mức %, chủ đề "điều học trước
           khi ngủ sẽ theo bạn vào giấc mơ".

   Nội dung các câu do chủ dự án soạn, KHÔNG tự sửa chữ.
   ============================================================================= */

import { TONG_BUOC } from "../../src/luyen-tap/cacBuoc.js";

/** Mốc ngày để quay vòng 10 câu chào buổi sáng. */
export const NGAY_GOC = "2026-01-01";

export const CAU_CHAO = [
  "Chào buổi sáng! Mặt trời đã lên, Riyi cũng đã sẵn sàng. Mình học vài từ mới nhé!",
  "Ngày mới, từ mới! Chỉ 10 phút với Riyi thôi, bạn sẽ thấy sự khác biệt.",
  "Một tách cà phê, một bài học nhỏ – khởi đầu ngày mới thật trọn vẹn cùng Riyi.",
  "Mỗi ngày một chút, một năm sẽ là rất nhiều. Hôm nay mình bắt đầu thôi!",
  "Nắng sớm đẹp quá! Mở Riyi, học một chữ Hán thật đẹp cho ngày hôm nay nhé.",
  "Buổi sáng đầu óc còn tươi mới – thời điểm tuyệt vời để ôn bài cùng Riyi!",
  "Chào ngày mới! Mục tiêu hôm nay đang chờ bạn chinh phục đấy.",
  "Người giỏi ngoại ngữ không phải người học nhiều nhất, mà là người học đều đặn nhất. Tiếp tục nhé!",
  "Riyi chúc bạn một ngày rực rỡ như ánh mặt trời. Đừng quên bài học hôm nay nhé!",
  "Mỗi bước nhỏ hôm nay là nền móng cho ngày bạn nói trôi chảy. Bắt đầu thôi!",
];

export const CAU_14H = [
  { tu: 0, den: 0, cau: "Buổi chiều vẫn còn dài – chỉ cần 5 phút để khởi động thôi!" },
  { tu: 1, den: 49, cau: "Khởi đầu tốt rồi đó! Tranh thủ giờ nghỉ học thêm một chút nhé." },
  { tu: 50, den: 69, cau: "Đã qua nửa chặng đường! Giữ vững nhịp độ này nhé." },
  { tu: 70, den: 99, cau: "Sắp về đích rồi! Thêm một chút nữa là hoàn thành mục tiêu." },
  { tu: 100, den: 100, cau: "Xuất sắc! Bạn đã hoàn thành mục tiêu trước cả buổi tối 🎉" },
];

export const CAU_21H = [
  { tu: 0, den: 0, cau: "Vẫn còn kịp! Học vài từ trước khi ngủ – chúng sẽ theo bạn vào giấc mơ 🌙" },
  {
    tu: 1,
    den: 49,
    cau: "Ôn thêm vài phút trước khi ngủ nhé – những gì bạn học lúc này sẽ theo bạn vào giấc mơ.",
  },
  { tu: 50, den: 69, cau: "Hơn nửa chặng rồi! Học nốt một chút rồi mang từ mới vào giấc mơ nhé 🌙" },
  {
    tu: 70,
    den: 99,
    cau: "Chỉ còn chút xíu! Hoàn thành nốt để ngủ thật ngon và mơ bằng ngoại ngữ nào.",
  },
  {
    tu: 100,
    den: 100,
    cau: "Tuyệt vời! Ôn nhẹ vài từ rồi đi ngủ, để những gì đã học theo bạn vào giấc mơ. Ngủ ngon nhé!",
  },
];

/** "YYYY-MM-DD" của thời điểm `luc` theo GIỜ VIỆT NAM (UTC+7). */
export function ngayVietNam(luc = new Date()) {
  const vn = new Date(luc.getTime() + 7 * 60 * 60 * 1000);
  return vn.toISOString().slice(0, 10);
}

/** Số ngày từ ngày này đến ngày kia (hai chuỗi "YYYY-MM-DD"). */
export function soNgayGiua(tu, den) {
  const ms = Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

/**
 * % hoàn thành mục tiêu hôm nay của một người.
 * Tiến độ chỉ tính khi bài đang làm ĐÚNG LÀ bài của hôm nay (loTrinh.ngay),
 * vì sang ngày mới mà chưa mở app thì các bước hôm qua không còn giá trị.
 */
export function phanTramTienDo(loTrinh, ngayHomNay) {
  const buoc = loTrinh?.buoc?.length ?? 0;
  if (!loTrinh || loTrinh.ngay !== ngayHomNay || buoc === 0) return 0;
  return Math.min(100, Math.floor((buoc / TONG_BUOC) * 100));
}

/** Câu động viên theo mức % (dùng cho cả 14h và 21h). */
export function cauTheoMuc(danhSach, phanTram) {
  return danhSach.find((m) => phanTram >= m.tu && phanTram <= m.den)?.cau ?? danhSach[0].cau;
}

/** Câu chào buổi sáng khi KHÔNG phải ngày đặc biệt: quay vòng 10 câu theo ngày. */
export function cauChaoTheoNgay(ngay) {
  const i = ((soNgayGiua(NGAY_GOC, ngay) % CAU_CHAO.length) + CAU_CHAO.length) % CAU_CHAO.length;
  return CAU_CHAO[i];
}

/** Ngày đặc biệt của hôm nay trong bảng ngay-dac-biet.json, không có thì null. */
export function ngayDacBietCuaNgay(danhSach, ngay) {
  return danhSach?.find((m) => m.ngay === ngay) ?? null;
}

/** Nội dung thông báo 7h sáng. */
export function thongBao7h(ngay, danhSachNgayDacBiet) {
  const dip = ngayDacBietCuaNgay(danhSachNgayDacBiet, ngay);
  const than = dip
    ? `Bạn có biết hôm nay là ${dip.ten} (${dip.quocGia}) không? Hãy mở Riyi để có một ${dip.cum} hoàn hảo nhé!`
    : cauChaoTheoNgay(ngay);
  return { tieuDe: "Riyi ☀️", than, dip };
}

/** Nội dung thông báo 14h hoặc 21h. */
export function thongBaoTienDo(khung, phanTram) {
  const danhSach = khung === "21h" ? CAU_21H : CAU_14H;
  return {
    tieuDe: `Riyi – Tiến độ hôm nay: ${phanTram}%`,
    than: cauTheoMuc(danhSach, phanTram),
  };
}

/**
 * Nội dung cho một người ở một khung giờ.
 * @param khung "7h" | "14h" | "21h"
 */
export function soanCho(khung, { ngay, loTrinh, ngayDacBiet }) {
  if (khung === "7h") return thongBao7h(ngay, ngayDacBiet);
  return thongBaoTienDo(khung, phanTramTienDo(loTrinh, ngay));
}

const GIO_CUA_KHUNG = { "7h": 7, "14h": 14, "21h": 21 };

/**
 * Ngày (giờ VN) mà một khung giờ thuộc về, khi lần chạy bị GitHub làm trễ
 * (quyết định 18.48). Ví dụ khung 21h ngày 5/3 trễ tới 1h sáng 6/3 thì vẫn là
 * ngày 5/3: giờ hiện tại còn nhỏ hơn giờ của khung nghĩa là khung đó là của
 * hôm qua.
 */
export function ngayCuaKhung(khung, luc = new Date()) {
  const gioKhung = GIO_CUA_KHUNG[khung];
  const gioVn = new Date(luc.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
  if (gioKhung == null || gioVn >= gioKhung) return ngayVietNam(luc);
  return ngayVietNam(new Date(luc.getTime() - 24 * 60 * 60 * 1000));
}

/**
 * Quá bao nhiêu giờ sau giờ của khung thì THÔI không gửi nữa (quyết định
 * 18.57): lỡ dịch vụ hẹn giờ ngừng lâu thì không để nhắc "7h" tới lúc trưa.
 */
export const CUA_SO_GUI_GIO = 2;

/**
 * Khung nhắc học ĐANG TỚI HẠN mà chưa gửi, hoặc null (quyết định 18.57).
 * cron-job.org gọi GitHub 5 phút một lần; lần gọi đầu tiên sau 7h / 14h / 21h
 * (trong vòng CUA_SO_GUI_GIO giờ) sẽ gửi khung đó, các lần sau thấy đã gửi
 * rồi thì bỏ qua.
 * @param {Date} luc  Thời điểm đang chạy
 * @param {Record<string, unknown>} daGui  Các khung đã gửi, khoá "YYYY-MM-DD-7h"
 * @returns {{khung: string, ngay: string, khoa: string} | null}
 */
export function khungDenHan(luc, daGui = {}) {
  const ngay = ngayVietNam(luc);
  const gioVn = new Date(luc.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
  for (const [khung, gio] of Object.entries(GIO_CUA_KHUNG)) {
    const khoa = `${ngay}-${khung}`;
    if (gioVn >= gio && gioVn < gio + CUA_SO_GUI_GIO && !daGui[khoa]) {
      return { khung, ngay, khoa };
    }
  }
  return null;
}

/** Khung giờ ứng với thời điểm chạy (theo giờ Việt Nam). Không đúng giờ thì null. */
export function khungGio(luc = new Date()) {
  const gioVn = new Date(luc.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
  if (gioVn === 7) return "7h";
  if (gioVn === 14) return "14h";
  if (gioVn === 21) return "21h";
  return null;
}
