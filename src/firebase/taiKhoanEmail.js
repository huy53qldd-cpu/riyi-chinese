/* =============================================================================
   TÀI KHOẢN EMAIL + MẬT KHẨU (GĐ 10, quyết định 18.12 – 18.15)
   =============================================================================

   Cách đăng nhập thứ hai, bên cạnh Google:
     - Tạo tài khoản: tên hiển thị, email, mật khẩu (tối thiểu 8 ký tự)
     - Đăng nhập: email + mật khẩu
     - Quên mật khẩu: gửi EMAIL CÓ LINK đặt mật khẩu mới. Không gửi lại được
       mật khẩu cũ, vì Firebase chỉ lưu mật khẩu ở dạng mã hoá một chiều.
     - Đổi mật khẩu: phải nhập đúng mật khẩu hiện tại trước
     - Tạo xong dùng được ngay, và gửi email xác minh

   Mọi email Firebase gửi đi đều bằng tiếng Việt (auth.languageCode = "vi").

   QUY TẮC: mọi hàm LUÔN trả về {thanhCong, thongBao}, không ném lỗi ra ngoài,
   và mọi thông báo bằng TIẾNG VIỆT, không hiện mã lỗi tiếng Anh của Firebase.
   ============================================================================= */

import { layDichVu } from "./khoiTao.js";

export const DO_DAI_MAT_KHAU_TOI_THIEU = 8;

/** Đổi mã lỗi của Firebase thành câu tiếng Việt. */
function loiTiengViet(loi) {
  const ma = loi?.code ?? loi?.message ?? "";
  if (ma.includes("email-already-in-use")) {
    return "Email này đã có tài khoản (có thể là tài khoản đăng nhập bằng Google). Hãy đăng nhập, hoặc dùng email khác.";
  }
  if (ma.includes("invalid-email")) return "Email không hợp lệ. Hãy kiểm tra lại.";
  if (ma.includes("weak-password")) {
    return `Mật khẩu quá yếu. Hãy dùng ít nhất ${DO_DAI_MAT_KHAU_TOI_THIEU} ký tự.`;
  }
  // Firebase gộp chung "sai email" và "sai mật khẩu" để không lộ email nào có tài khoản
  if (
    ma.includes("invalid-credential") ||
    ma.includes("wrong-password") ||
    ma.includes("user-not-found") ||
    ma.includes("invalid-login-credentials")
  ) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (ma.includes("too-many-requests")) {
    return "Bạn đã thử quá nhiều lần. Hãy đợi vài phút rồi thử lại.";
  }
  if (ma.includes("network-request-failed")) {
    return "Không kết nối được mạng. Hãy kiểm tra mạng rồi thử lại.";
  }
  if (ma.includes("operation-not-allowed")) {
    return "Đăng nhập bằng email chưa được bật. Hãy báo chủ dự án bật trong Firebase.";
  }
  if (ma.includes("requires-recent-login")) {
    return "Vì an toàn, hãy đăng xuất rồi đăng nhập lại trước khi đổi mật khẩu.";
  }
  if (ma.includes("user-disabled")) return "Tài khoản này đã bị khoá.";
  if (ma.includes("chua-cau-hinh")) {
    return "Đăng nhập chưa sẵn sàng vì app chưa được kết nối Firebase.";
  }
  return "Có lỗi xảy ra. Hãy thử lại sau.";
}

/** Lấy auth và các hàm của thư viện, đặt ngôn ngữ email là tiếng Việt. */
async function chuanBi() {
  const { auth } = await layDichVu();
  auth.languageCode = "vi";
  const thuVien = await import("firebase/auth");
  return { auth, ...thuVien };
}

/**
 * Kiểm tra ô nhập trước khi gửi lên Firebase. Trả về câu báo lỗi, hoặc null.
 * Dùng chung cho màn tạo tài khoản và đổi mật khẩu.
 */
export function kiemTraMatKhauMoi(matKhau, nhapLai) {
  if (matKhau.length < DO_DAI_MAT_KHAU_TOI_THIEU) {
    return `Mật khẩu cần ít nhất ${DO_DAI_MAT_KHAU_TOI_THIEU} ký tự.`;
  }
  if (matKhau !== nhapLai) return "Hai lần nhập mật khẩu không giống nhau.";
  return null;
}

/** Tạo tài khoản mới, đặt tên hiển thị, gửi email xác minh. */
export async function taoTaiKhoan({ ten, email, matKhau, nhapLai }) {
  const tenGon = ten.trim();
  if (!tenGon) return { thanhCong: false, thongBao: "Hãy nhập tên hiển thị." };
  if (tenGon.length > 40) {
    return { thanhCong: false, thongBao: "Tên hiển thị dài tối đa 40 ký tự." };
  }
  const loiMatKhau = kiemTraMatKhauMoi(matKhau, nhapLai);
  if (loiMatKhau) return { thanhCong: false, thongBao: loiMatKhau };

  try {
    const { auth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } =
      await chuanBi();
    const kq = await createUserWithEmailAndPassword(auth, email.trim(), matKhau);
    await updateProfile(kq.user, { displayName: tenGon });
    // Gửi xác minh hỏng (mạng chập chờn...) thì vẫn cho dùng, Cài đặt có nút gửi lại
    try {
      await sendEmailVerification(kq.user);
    } catch {
      // bỏ qua
    }
    return { thanhCong: true, thongBao: null, ten: tenGon };
  } catch (loi) {
    return { thanhCong: false, thongBao: loiTiengViet(loi) };
  }
}

/** Đăng nhập bằng email + mật khẩu. */
export async function dangNhapEmail({ email, matKhau }) {
  if (!email.trim() || !matKhau) {
    return { thanhCong: false, thongBao: "Hãy nhập email và mật khẩu." };
  }
  try {
    const { auth, signInWithEmailAndPassword } = await chuanBi();
    await signInWithEmailAndPassword(auth, email.trim(), matKhau);
    return { thanhCong: true, thongBao: null };
  } catch (loi) {
    return { thanhCong: false, thongBao: loiTiengViet(loi) };
  }
}

/**
 * Quên mật khẩu: gửi email có link đặt mật khẩu mới.
 * Luôn báo cùng một câu dù email có tài khoản hay không, để người lạ không dò
 * được email nào đã đăng ký.
 */
export async function guiEmailDatLaiMatKhau(email) {
  if (!email.trim()) return { thanhCong: false, thongBao: "Hãy nhập email của bạn." };
  try {
    const { auth, sendPasswordResetEmail } = await chuanBi();
    await sendPasswordResetEmail(auth, email.trim());
  } catch (loi) {
    const ma = loi?.code ?? "";
    if (!ma.includes("user-not-found")) {
      return { thanhCong: false, thongBao: loiTiengViet(loi) };
    }
  }
  return {
    thanhCong: true,
    thongBao:
      "Nếu email này có tài khoản, chúng tôi đã gửi link đặt mật khẩu mới. Hãy mở hộp thư (xem cả mục Thư rác).",
  };
}

/** Đổi mật khẩu: xác nhận lại mật khẩu hiện tại, rồi đặt mật khẩu mới. */
export async function doiMatKhau({ matKhauCu, matKhauMoi, nhapLai }) {
  if (!matKhauCu) return { thanhCong: false, thongBao: "Hãy nhập mật khẩu hiện tại." };
  const loiMatKhau = kiemTraMatKhauMoi(matKhauMoi, nhapLai);
  if (loiMatKhau) return { thanhCong: false, thongBao: loiMatKhau };
  if (matKhauMoi === matKhauCu) {
    return { thanhCong: false, thongBao: "Mật khẩu mới phải khác mật khẩu hiện tại." };
  }
  try {
    const { auth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
      await chuanBi();
    const nguoi = auth.currentUser;
    if (!nguoi?.email) return { thanhCong: false, thongBao: "Bạn chưa đăng nhập." };
    await reauthenticateWithCredential(
      nguoi,
      EmailAuthProvider.credential(nguoi.email, matKhauCu),
    );
    await updatePassword(nguoi, matKhauMoi);
    return { thanhCong: true, thongBao: "Đã đổi mật khẩu." };
  } catch (loi) {
    const ma = loi?.code ?? "";
    if (ma.includes("invalid-credential") || ma.includes("wrong-password")) {
      return { thanhCong: false, thongBao: "Mật khẩu hiện tại không đúng." };
    }
    return { thanhCong: false, thongBao: loiTiengViet(loi) };
  }
}

/** Gửi lại email xác minh cho người đang đăng nhập. */
export async function guiLaiEmailXacMinh() {
  try {
    const { auth, sendEmailVerification } = await chuanBi();
    if (!auth.currentUser) return { thanhCong: false, thongBao: "Bạn chưa đăng nhập." };
    await sendEmailVerification(auth.currentUser);
    return {
      thanhCong: true,
      thongBao: "Đã gửi email xác minh. Hãy mở hộp thư (xem cả mục Thư rác).",
    };
  } catch (loi) {
    return { thanhCong: false, thongBao: loiTiengViet(loi) };
  }
}

/**
 * Tải lại thông tin tài khoản từ Firebase (để biết đã bấm link xác minh chưa).
 * Trả về true nếu email đã được xác minh.
 */
export async function kiemTraDaXacMinh() {
  try {
    const { auth } = await chuanBi();
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    return auth.currentUser.emailVerified;
  } catch {
    return false;
  }
}
