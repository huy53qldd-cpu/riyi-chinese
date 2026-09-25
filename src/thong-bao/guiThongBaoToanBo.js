/* =============================================================================
   QUẢN TRỊ GỬI THÔNG BÁO CHO MỌI NGƯỜI (quyết định 18.56)
   =============================================================================

   Gọi hàm máy chủ guiThongBaoToanBo (functions/index.js). App KHÔNG tự gửi
   được, vì gửi thông báo cần khoá bí mật chỉ nằm trên máy chủ. Máy chủ cũng tự
   kiểm tra người gọi có phải tài khoản quản trị không.
   ============================================================================= */

import { layDichVu } from "../firebase/khoiTao.js";

// Phải trùng vùng của hàm trên máy chủ (functions/index.js, setGlobalOptions)
const VUNG_MAY_CHU = "asia-southeast1";

/**
 * @returns {Promise<{thanhCong: boolean, ketQua?: {soNguoi: number, daGui: number, hong: number, loi: number}, thongBao?: string}>}
 */
export async function guiThongBaoToanBo(tieuDe, than) {
  try {
    await layDichVu(); // bảo đảm app Firebase đã khởi tạo
    const [{ getApp }, { getFunctions, httpsCallable }] = await Promise.all([
      import("firebase/app"),
      import("firebase/functions"),
    ]);
    const goiHam = httpsCallable(getFunctions(getApp(), VUNG_MAY_CHU), "guiThongBaoToanBo");
    const { data } = await goiHam({ tieuDe, than });
    return { thanhCong: true, ketQua: data };
  } catch (loi) {
    const ma = String(loi?.code ?? "");
    if (ma.endsWith("permission-denied")) {
      return { thanhCong: false, thongBao: "Chỉ tài khoản quản trị mới được gửi thông báo." };
    }
    if (ma.endsWith("invalid-argument")) {
      return { thanhCong: false, thongBao: "Nội dung chưa hợp lệ: không được trống và không quá dài." };
    }
    if (ma.endsWith("not-found") || ma.endsWith("internal") || ma.endsWith("unimplemented")) {
      return { thanhCong: false, thongBao: "Máy chủ gửi thông báo chưa sẵn sàng. Hãy thử lại sau." };
    }
    return { thanhCong: false, thongBao: "Chưa gửi được. Hãy kiểm tra mạng rồi thử lại." };
  }
}
