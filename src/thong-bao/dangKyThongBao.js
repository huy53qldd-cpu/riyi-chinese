/* =============================================================================
   ĐĂNG KÝ NHẬN THÔNG BÁO NHẮC HỌC (GĐ 11, quyết định 18.40)
   =============================================================================

   Ba khung giờ mỗi ngày: 7h, 14h, 21h (giờ Việt Nam). Người gửi KHÔNG phải app
   mà là GitHub Actions (cong-cu/thong-bao/gui.js), được cron-job.org gọi 5 phút
   một lần nên gửi đúng giờ (quyết định 18.57). Quản trị còn gửi được thông
   báo tự soạn bất kỳ lúc nào (Cài đặt → Gửi thông báo cho mọi người).

   Việc của file này chỉ gồm:
     1. Xin quyền hiện thông báo của trình duyệt.
     2. Lấy "token" của thiết bị (Firebase Cloud Messaging) và lưu lên Firestore
        ở nguoiDung/{uid}.thongBao = { bat: true, token: { "<token>": true } }.
        Một người có thể mở app trên nhiều máy nên lưu nhiều token.
     3. Tắt thông báo: xoá token của máy này, đặt bat = false.

   MẶC ĐỊNH BẬT (quyết định 18.58): người học chưa từng tắt thì coi như bật.
     - Lần đầu mở app trên một máy, HoiQuyenThongBao.jsx hỏi "Cho phép Riyi gửi
       thông báo?" (trình duyệt, nhất là iPhone, chỉ cho bật hộp xin quyền sau
       một lần BẤM của người dùng, nên không tự bật lên được). Chỉ hỏi một lần
       mỗi máy (daHoiQuyenMayNay / ghiDaHoiQuyen).
     - Mỗi lần mở app, nếu máy đã cho phép và người học không tắt, app tự lưu
       mã thiết bị (dangKyLaiNeuCan). Mã có thể đổi theo thời gian; chỉ ghi lên
       Firestore khi mã khác lần trước (nhớ trong localStorage) cho đỡ tốn.

   ĐIỀU KIỆN:
     - Phải đăng nhập (chế độ khách không lưu gì trên Firestore).
     - Phải có VITE_VAPID_KEY trong .env (xem tai-lieu/HUONG-DAN-THONG-BAO.md).
     - iPhone: chỉ nhận được thông báo khi đã CÀI app vào màn hình chính
       (yêu cầu của iOS, không phải lỗi app).
   ============================================================================= */

import { layDichVu } from "../firebase/khoiTao.js";

const VAPID = import.meta.env.VITE_VAPID_KEY;

// localStorage: đã hỏi quyền trên máy này chưa; mã thiết bị đã lưu lần trước
const KHOA_DA_HOI = "riyi-da-hoi-thong-bao";
const KHOA_TOKEN = "riyi-token-thong-bao";

function docMay(khoa) {
  try {
    return localStorage.getItem(khoa);
  } catch {
    return null;
  }
}

function ghiMay(khoa, giaTri) {
  try {
    if (giaTri == null) localStorage.removeItem(khoa);
    else localStorage.setItem(khoa, giaTri);
  } catch {
    // Trình duyệt chặn bộ nhớ (chế độ riêng tư...): bỏ qua, chỉ là hỏi lại lần sau
  }
}

/** Đã hỏi quyền thông báo trên máy này chưa (dù người dùng chọn gì). */
export function daHoiQuyenMayNay() {
  return docMay(KHOA_DA_HOI) === "1";
}

export function ghiDaHoiQuyen() {
  ghiMay(KHOA_DA_HOI, "1");
}

/** Xin quyền hiện thông báo. PHẢI gọi ngay trong lúc người dùng bấm nút. */
export async function xinQuyen() {
  if (!trinhDuyetHoTro()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Lấy mã thiết bị và lưu lên Firestore, đánh dấu bat = true. Mã giống hệt lần
 * trước (cùng tài khoản) thì không ghi lại. Ném lỗi nếu hỏng.
 */
async function luuTokenMayNay(uid, batBuocGhi) {
  const dangKy = await navigator.serviceWorker.ready;
  const { messaging, getToken } = await layMessaging();
  const token = await getToken(messaging, {
    vapidKey: VAPID,
    serviceWorkerRegistration: dangKy,
  });
  if (!token) throw new Error("khong-co-token");
  const daLuu = `${uid}|${token}`;
  if (!batBuocGhi && docMay(KHOA_TOKEN) === daLuu) return;
  const [{ doc, setDoc, serverTimestamp }, { db }] = await Promise.all([
    import("firebase/firestore"),
    layDichVu(),
  ]);
  await setDoc(
    doc(db, "nguoiDung", uid),
    { thongBao: { bat: true, token: { [token]: true }, capNhatLuc: serverTimestamp() } },
    { merge: true },
  );
  ghiMay(KHOA_TOKEN, daLuu);
}

/**
 * Gọi mỗi lần mở app (quyết định 18.58): máy đã cho phép thông báo và người học
 * không tắt thì lặng lẽ lưu mã thiết bị. Không hỏi quyền, không báo lỗi.
 * @returns {Promise<boolean>} true nếu máy này đang nhận được thông báo
 */
export async function dangKyLaiNeuCan(uid) {
  if (!uid || !trinhDuyetHoTro() || !daCauHinhThongBao()) return false;
  if (Notification.permission !== "granted") return false;
  try {
    await luuTokenMayNay(uid, false);
    return true;
  } catch {
    return false;
  }
}

/** Trình duyệt này có hỗ trợ thông báo đẩy không. */
export function trinhDuyetHoTro() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/** Đã cấu hình đủ để dùng thông báo chưa (có VAPID key). */
export function daCauHinhThongBao() {
  return Boolean(VAPID);
}

/** Trạng thái quyền hiện tại: "granted" | "denied" | "default". */
export function quyenHienTai() {
  return trinhDuyetHoTro() ? Notification.permission : "denied";
}

async function layMessaging() {
  const [{ getMessaging, getToken, deleteToken }, { getApp }] = await Promise.all([
    import("firebase/messaging"),
    import("firebase/app"),
  ]);
  await layDichVu(); // bảo đảm app Firebase đã được khởi tạo
  return { messaging: getMessaging(getApp()), getToken, deleteToken };
}

/**
 * Bật thông báo cho thiết bị này.
 * @returns {Promise<{thanhCong: boolean, thongBao: string|null}>} luôn trả về
 *          kết quả bằng tiếng Việt, không ném lỗi ra ngoài.
 */
export async function batThongBao(uid) {
  if (!uid) return { thanhCong: false, thongBao: "Hãy đăng nhập để nhận thông báo nhắc học." };
  if (!trinhDuyetHoTro()) {
    return { thanhCong: false, thongBao: "Trình duyệt này chưa hỗ trợ thông báo nhắc học." };
  }
  if (!daCauHinhThongBao()) {
    return { thanhCong: false, thongBao: "App chưa được cấu hình khoá thông báo." };
  }

  const quyen = await Notification.requestPermission();
  if (quyen !== "granted") {
    return {
      thanhCong: false,
      thongBao:
        "Bạn đã từ chối quyền thông báo. Hãy bật lại trong phần cài đặt của trình duyệt rồi thử lần nữa.",
    };
  }

  try {
    // Bấm bật trong Cài đặt thì luôn ghi, kể cả khi mã giống lần trước (vì có
    // thể lần trước đã tắt, bat đang là false)
    await luuTokenMayNay(uid, true);
    return { thanhCong: true, thongBao: null };
  } catch {
    return {
      thanhCong: false,
      thongBao: "Chưa bật được thông báo. Hãy kiểm tra mạng rồi thử lại.",
    };
  }
}

/** Tắt thông báo: bỏ token của máy này và đánh dấu tắt. */
export async function tatThongBao(uid) {
  if (!uid) return { thanhCong: true, thongBao: null };
  try {
    const [{ doc, setDoc, updateDoc, deleteField }, { db }] = await Promise.all([
      import("firebase/firestore"),
      layDichVu(),
    ]);
    let token = null;
    if (trinhDuyetHoTro() && daCauHinhThongBao() && Notification.permission === "granted") {
      const dangKy = await navigator.serviceWorker.ready;
      const { messaging, getToken, deleteToken } = await layMessaging();
      token = await getToken(messaging, { vapidKey: VAPID, serviceWorkerRegistration: dangKy });
      await deleteToken(messaging).catch(() => {});
    }
    await setDoc(doc(db, "nguoiDung", uid), { thongBao: { bat: false } }, { merge: true });
    ghiMay(KHOA_TOKEN, null);
    if (token) {
      await updateDoc(doc(db, "nguoiDung", uid), {
        [`thongBao.token.${token}`]: deleteField(),
      }).catch(() => {});
    }
    return { thanhCong: true, thongBao: null };
  } catch {
    return { thanhCong: false, thongBao: "Chưa tắt được thông báo. Hãy thử lại sau." };
  }
}
