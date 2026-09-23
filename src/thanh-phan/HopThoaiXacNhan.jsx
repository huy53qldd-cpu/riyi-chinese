/* =============================================================================
   HỘP THOẠI XÁC NHẬN (GĐ 12, quyết định 18.42)
   =============================================================================

   Hộp thoại nhỏ giữa màn hình, dùng khi cần người dùng đọc kỹ rồi mới quyết
   định tiếp tục hay ở lại (ví dụ: "chưa hoàn thành chữ này", "đổi mục tiêu
   cấp HSK"). Khác với ThongBao.jsx (chỉ hiện thông báo ngắn rồi tự tắt),
   hộp thoại này CHỜ người dùng bấm nút.

   Cách dùng:
       <HopThoaiXacNhan
         tieuDe="Đổi mục tiêu?"
         noiDung={<p>...</p>}
         nutXacNhan="Đổi mục tiêu"
         nutHuy="Ở lại"
         khiXacNhan={...}
         khiHuy={...}
       />
   ============================================================================= */

import BieuTuong from "./BieuTuong.jsx";

export default function HopThoaiXacNhan({
  tieuDe,
  noiDung,
  nutXacNhan,
  nutHuy,
  khiXacNhan,
  khiHuy,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tieuDe}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--mo-dan)] p-4 sm:items-center"
      onClick={khiHuy}
    >
      <div
        className="border-vien bg-nen-noi flex w-full max-w-sm flex-col gap-4 rounded-[var(--bo-goc-lon)] border p-5 shadow-[0_8px_30px_var(--bong)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">{tieuDe}</h2>
        <div className="text-[length:var(--co-chu-latin-nho)] leading-relaxed">{noiDung}</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {nutHuy && (
            <button
              type="button"
              onClick={khiHuy}
              className="border-vien inline-flex items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
            >
              {nutHuy}
            </button>
          )}
          {nutXacNhan && (
            <button
              type="button"
              onClick={khiXacNhan}
              className="border-nhan bg-nhan text-chu-tren-nhan inline-flex items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-bold"
            >
              <BieuTuong ten="kiem-tra" co={16} />
              {nutXacNhan}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
