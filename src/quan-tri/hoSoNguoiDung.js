/* =============================================================================
   HỒ SƠ NGƯỜI DÙNG — ĐỂ QUẢN TRỊ XEM AI MỚI ĐĂNG KÝ (quyết định 18.72)
   =============================================================================

   Gói Spark không có Cloud Functions nên app KHÔNG đọc được danh sách tài khoản
   của Firebase Authentication. Thay vào đó, mỗi lần đăng nhập app tự ghi một
   hồ sơ nhỏ:

     hoSo/{uid} = { ten, email, cach: "google" | "email", taoLuc, lanCuoi }
       taoLuc   ngày tạo tài khoản (lấy từ Firebase Authentication)
       lanCuoi  lần mở app gần nhất

   Luật Firestore: mỗi người chỉ ghi được hồ sơ của chính mình; CHỈ tài khoản
   quản trị (UID trong src/thong-bao/quanTri.js) đọc được.

   Hệ quả: người đăng ký trước bản cập nhật này chỉ hiện khi họ mở lại app
   (vẫn đúng ngày đăng ký gốc). Khách (không đăng nhập) không có hồ sơ.
   ============================================================================= */

import { layDichVu } from "../firebase/khoiTao.js";

const BO_SUU_TAP = "hoSo";

/** Ghi / cập nhật hồ sơ của người vừa đăng nhập. Lỗi thì bỏ qua (không ảnh hưởng việc học). */
export async function ghiHoSo(n) {
  if (!n?.uid || !n.taoTaiKhoan) return;
  try {
    const [{ db }, { doc, setDoc, serverTimestamp, Timestamp }] = await Promise.all([
      layDichVu(),
      import("firebase/firestore"),
    ]);
    await setDoc(
      doc(db, BO_SUU_TAP, n.uid),
      {
        ten: String(n.ten ?? "").slice(0, 100),
        email: String(n.email ?? "").slice(0, 200),
        cach: n.phuongThuc === "google.com" ? "google" : "email",
        taoLuc: Timestamp.fromDate(new Date(n.taoTaiKhoan)),
        lanCuoi: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    /* mất mạng hoặc bị chặn: lần đăng nhập sau ghi lại */
  }
}

/** 0 giờ theo giờ Việt Nam của hôm nay lùi `soNgay - 1` ngày. */
export function dauKhoang(soNgay) {
  const homNay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const dau = new Date(`${homNay}T00:00:00+07:00`);
  dau.setTime(dau.getTime() - (soNgay - 1) * 86400000);
  return dau;
}

/**
 * Người đăng ký từ `tuLuc` tới nay (mới nhất trước) và tổng số hồ sơ đã ghi nhận.
 * @returns {Promise<{ds: Array<{uid, ten, email, cach, taoLuc: Date}>, tong: number|null, loi?: string}>}
 */
export async function docNguoiDangKy(tuLuc) {
  try {
    const [{ db }, fs] = await Promise.all([layDichVu(), import("firebase/firestore")]);
    const { collection, getCountFromServer, getDocs, orderBy, query, Timestamp, where } = fs;
    const [anh, dem] = await Promise.all([
      getDocs(
        query(collection(db, BO_SUU_TAP), where("taoLuc", ">=", Timestamp.fromDate(tuLuc)), orderBy("taoLuc", "desc")),
      ),
      getCountFromServer(collection(db, BO_SUU_TAP)).catch(() => null),
    ]);
    return {
      ds: anh.docs.map((d) => ({ uid: d.id, ...d.data(), taoLuc: d.get("taoLuc")?.toDate?.() ?? null })),
      tong: dem ? dem.data().count : null,
    };
  } catch (loi) {
    return {
      ds: [],
      tong: null,
      loi: String(loi?.code ?? "").endsWith("permission-denied")
        ? "Chỉ tài khoản quản trị mới xem được danh sách này."
        : "Chưa tải được danh sách. Hãy kiểm tra mạng rồi thử lại.",
    };
  }
}
