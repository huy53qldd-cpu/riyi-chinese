/* =============================================================================
   TÀI KHOẢN QUẢN TRỊ (quyết định 18.56)
   =============================================================================

   Chỉ DUY NHẤT một tài khoản có quyền quản trị: tài khoản Google của chủ dự án.
   Ghi bằng mã tài khoản (UID) thay vì email, vì code nằm trên GitHub công khai.

   File này dùng ở hai nơi:
     - App (CaiDat.jsx): chỉ để QUYẾT ĐỊNH CÓ HIỆN khung gửi thông báo hay không.
     - KIỂM TRA QUYỀN THẬT SỰ nằm ở firestore.rules (hàng chờ thongBaoCho): mã
       UID ở đó PHẢI TRÙNG mã dưới đây. Ai sửa app để hiện khung này lên cũng
       không gửi được, vì Firestore chặn ghi của mọi tài khoản khác.
   ============================================================================= */

export const UID_QUAN_TRI = "NGEhCGlJnwXQTJpgDH5bMPNPgwT2";

/** Tài khoản này có phải quản trị không. */
export function laQuanTri(uid) {
  return Boolean(uid) && uid === UID_QUAN_TRI;
}

/** Độ dài tối đa của thông báo quản trị gửi (số ký tự). */
export const GIOI_HAN_THONG_BAO = { tieuDe: 60, than: 300 };
