/* =============================================================================
   ĐĂNG KÝ NHẬN THÔNG BÁO NHẮC HỌC (GĐ 11, quyết định 18.40)
   =============================================================================

   Ba khung giờ mỗi ngày: 7h, 14h, 21h (giờ Việt Nam). Người gửi KHÔNG phải app
   mà là Cloud Functions trên máy chủ (functions/index.js, quyết định 18.56;
   trước đó là GitHub Actions nhưng hay trễ vài tiếng). Quản trị còn gửi được
   thông báo tự soạn bất kỳ lúc nào (Cài đặt → Gửi thông báo cho mọi người).

   Việc của file này chỉ gồm:
     1. Xin quyền hiện thông báo của trình duyệt.
     2. Lấy "token" của thiết bị (Firebase Cloud Messaging) và lưu lên Firestore
        ở nguoiDung/{uid}.thongBao = { bat: true, token: { "<token>": true } }.
        Một người có thể mở app trên nhiều máy nên lưu nhiều token.
     3. Tắt thông báo: xoá token của máy này, đặt bat = false.

   ĐIỀU KIỆN:
     - Phải đăng nhập (chế độ khách không lưu gì trên Firestore).
     - Phải có VITE_VAPID_KEY trong .env (xem tai-lieu/HUONG-DAN-THONG-BAO.md).
     - iPhone: chỉ nhận được thông báo khi đã CÀI app vào màn hình chính
       (yêu cầu của iOS, không phải lỗi app).
   ============================================================================= */

import { layDichVu } from "../firebase/khoiTao.js";

const VAPID = import.meta.env.VITE_VAPID_KEY;

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
    const dangKy = await navigator.serviceWorker.ready;
    const { messaging, getToken } = await layMessaging();
    const token = await getToken(messaging, {
      vapidKey: VAPID,
      serviceWorkerRegistration: dangKy,
    });
    if (!token) {
      return { thanhCong: false, thongBao: "Không lấy được mã thiết bị. Hãy thử lại sau." };
    }
    const [{ doc, setDoc, serverTimestamp }, { db }] = await Promise.all([
      import("firebase/firestore"),
      layDichVu(),
    ]);
    await setDoc(
      doc(db, "nguoiDung", uid),
      { thongBao: { bat: true, token: { [token]: true }, capNhatLuc: serverTimestamp() } },
      { merge: true },
    );
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
