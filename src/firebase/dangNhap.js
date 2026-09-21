/* =============================================================================
   ĐĂNG NHẬP BẰNG GOOGLE
   =============================================================================

   CHỈ có đăng nhập bằng Google. Không tạo tài khoản, không email/mật khẩu,
   không quên mật khẩu, không liên kết tài khoản.

   QUY TẮC: mọi lỗi báo cho người dùng đều bằng TIẾNG VIỆT ngắn gọn, KHÔNG
   bao giờ hiện mã lỗi tiếng Anh của Firebase (như "auth/popup-blocked").
   ============================================================================= */

import { layDichVu } from "./khoiTao.js";

/** Đổi mã lỗi của Firebase thành câu tiếng Việt cho người dùng. */
function loiDangNhapTiengViet(loi) {
  const ma = loi?.code ?? loi?.message ?? "";
  if (ma.includes("popup-closed-by-user") || ma.includes("cancelled-popup-request")) {
    return "Bạn đã đóng cửa sổ đăng nhập.";
  }
  if (ma.includes("network-request-failed")) {
    return "Không kết nối được mạng. Hãy kiểm tra mạng rồi thử lại.";
  }
  if (ma.includes("unauthorized-domain")) {
    return "Địa chỉ này chưa được phép đăng nhập. Hãy báo chủ dự án thêm địa chỉ vào Firebase.";
  }
  if (ma.includes("chua-cau-hinh")) {
    return "Đăng nhập chưa sẵn sàng vì app chưa được kết nối Firebase.";
  }
  return "Không đăng nhập được. Hãy thử lại sau.";
}

/**
 * Bắt đầu đăng nhập Google. Trả về {thanhCong, thongBao}.
 * Hàm LUÔN trả về kết quả chứ không ném lỗi ra ngoài.
 *
 * Thử mở cửa sổ nhỏ (popup) trước. Trình duyệt điện thoại hay chặn cửa sổ nhỏ,
 * khi đó chuyển sang cách chuyển trang (redirect). Với cách chuyển trang, kết
 * quả đăng nhập sẽ đến qua theoDoiDangNhap khi trang tải lại.
 */
export async function dangNhapGoogle() {
  try {
    const { auth } = await layDichVu();
    const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
      await import("firebase/auth");
    const nhaCungCap = new GoogleAuthProvider();
    // Luôn cho chọn tài khoản, để người có nhiều tài khoản Google không bị
    // đăng nhập nhầm vào tài khoản cũ
    nhaCungCap.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithPopup(auth, nhaCungCap);
    } catch (loi) {
      const ma = loi?.code ?? "";
      if (ma.includes("popup-blocked") || ma.includes("operation-not-supported")) {
        await signInWithRedirect(auth, nhaCungCap);
      } else {
        throw loi;
      }
    }
    return { thanhCong: true, thongBao: null };
  } catch (loi) {
    return { thanhCong: false, thongBao: loiDangNhapTiengViet(loi) };
  }
}

/** Đăng xuất. Trả về {thanhCong, thongBao}. */
export async function dangXuatGoogle() {
  try {
    const { auth } = await layDichVu();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    return { thanhCong: true, thongBao: null };
  } catch {
    return { thanhCong: false, thongBao: "Không đăng xuất được. Hãy thử lại." };
  }
}

/**
 * Theo dõi trạng thái đăng nhập: gọi `khiDoi(nguoiDung | null)` ngay khi biết
 * trạng thái, và mỗi khi đăng nhập/đăng xuất.
 * Trả về hàm để ngừng theo dõi. Nếu chưa cấu hình Firebase hoặc lỗi thì gọi
 * `khiDoi(null)` một lần, tức coi như chế độ khách.
 */
export function theoDoiDangNhap(khiDoi) {
  let ngung = () => {};
  let daNgung = false;

  layDichVu()
    .then(async ({ auth }) => {
      const { onAuthStateChanged } = await import("firebase/auth");
      if (daNgung) return;
      ngung = onAuthStateChanged(
        auth,
        (nguoi) =>
          khiDoi(
            nguoi
              ? {
                  uid: nguoi.uid,
                  ten: nguoi.displayName ?? "",
                  email: nguoi.email ?? "",
                }
              : null,
          ),
        () => khiDoi(null),
      );
    })
    .catch(() => khiDoi(null));

  return () => {
    daNgung = true;
    ngung();
  };
}
