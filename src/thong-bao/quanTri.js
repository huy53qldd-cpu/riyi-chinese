/* =============================================================================
   TÀI KHOẢN QUẢN TRỊ (quyết định 18.56)
   =============================================================================

   Chỉ DUY NHẤT một tài khoản có quyền quản trị: tài khoản Google của chủ dự án.
   Ghi bằng mã tài khoản (UID) thay vì email, vì code nằm trên GitHub công khai.

   File này dùng ở hai nơi:
     - App (CaiDat.jsx): chỉ để QUYẾT ĐỊNH CÓ HIỆN khung gửi thông báo hay không.
     - Máy chủ (functions/index.js, được chép sang khi deploy): KIỂM TRA QUYỀN
       THẬT SỰ. Ai sửa app để hiện khung này lên cũng không gửi được, vì máy
       chủ tự kiểm tra lại mã tài khoản của người gọi.
   ============================================================================= */

export const UID_QUAN_TRI = "NGEhCGlJnwXQTJpgDH5bMPNPgwT2";

/** Tài khoản này có phải quản trị không. */
export function laQuanTri(uid) {
  return Boolean(uid) && uid === UID_QUAN_TRI;
}

/** Độ dài tối đa của thông báo quản trị gửi (số ký tự). */
export const GIOI_HAN_THONG_BAO = { tieuDe: 60, than: 300 };
