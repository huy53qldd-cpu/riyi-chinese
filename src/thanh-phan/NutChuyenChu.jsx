/* =============================================================================
   NÚT CHUYỂN CHỮ KHI TẬP VIẾT (quyết định 18.54, 18.55)
   =============================================================================

   Dùng ở bước Tập viết của Bài hôm nay / Review (PhienLuyenTap.jsx) và ở trang
   chi tiết chữ Hán (TabChuHan.jsx). Nút nằm bên phải thanh cố định phía trên
   thanh tab dưới (KhungTapViet vẽ thanh đó, nhận nút này qua prop nutChuyen),
   đúng chỗ nút "Bắt đầu học ngay".

   - Còn chữ sau: "Chuyển chữ tiếp theo", màu nút hành động.
   - Chữ cuối: "Hoàn thành", màu khác (lớp .nut-hoan-thanh ở index.css).
   - Viết xong chữ đang xem mới bấm được; trước đó nút mờ đi.
   ============================================================================= */

import BieuTuong from "./BieuTuong.jsx";

/**
 * @param {boolean}  conCau  Còn chữ sau không (không còn thì là nút "Hoàn thành")
 * @param {boolean}  daViet  Đã viết xong chữ đang xem chưa
 * @param {Function} chuyen  Gọi khi bấm nút
 */
export default function NutChuyenChu({ conCau, daViet, chuyen }) {
  return (
    <button
      type="button"
      onClick={chuyen}
      disabled={!daViet}
      title={daViet ? undefined : "Viết xong chữ này để chuyển tiếp"}
      className={`inline-flex items-center gap-2 rounded-[var(--bo-goc-tron)] border py-3 pr-4 pl-5 text-[length:var(--co-chu-latin)] font-bold shadow-[0_4px_16px_var(--bong)] disabled:opacity-45 ${
        conCau ? "border-nhan bg-nhan text-chu-tren-nhan" : "nut-hoan-thanh"
      }`}
    >
      {conCau ? "Chuyển chữ tiếp theo" : "Hoàn thành"}
      <BieuTuong ten={conCau ? "sau" : "kiem-tra"} co={18} />
    </button>
  );
}
