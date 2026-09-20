/* =============================================================================
   THANH TRÊN — "MỤC TIÊU HÔM NAY"
   =============================================================================

   Đây là tab thứ 6, đặt riêng ở trên cùng vì với người học thì mục tiêu hằng
   ngày là thứ quan trọng nhất, phải nhìn thấy ngay mà không cần bấm tìm.

   Chỉ hiện khi ĐÃ ĐĂNG NHẬP. Chế độ khách không có mục tiêu, không có streak,
   nên thanh này ẩn hẳn và thay bằng dải nhắc chế độ khách.

   GIAI ĐOẠN 0: chỉ dựng hình, số liệu là số giả để xem bố cục.
   Số thật và hiệu ứng mặt trời tỏa sáng làm ở GĐ 7.
   ============================================================================= */

export default function ThanhTren({ daDangNhap, daLam = 0, mucTieu = 0, moMucTieu }) {
  // -------------------------------------------------------------------------
  // CHẾ ĐỘ KHÁCH — không có mục tiêu, chỉ nhắc nhẹ một dòng
  // -------------------------------------------------------------------------
  if (!daDangNhap) {
    return (
      <div
        className="bg-nen-phu text-chu-mo fixed inset-x-0 top-0 z-40 flex items-center justify-center px-4 text-center text-[length:var(--co-chu-latin-nho)]"
        style={{
          minHeight: "var(--cao-thanh-tren)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        Bạn đang học ở chế độ khách, tiến độ sẽ không được lưu.
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ĐÃ ĐĂNG NHẬP — hiện mặt trời và tiến độ
  // -------------------------------------------------------------------------
  const datMucTieu = mucTieu > 0 && daLam >= mucTieu;
  const tiLe = mucTieu > 0 ? Math.min(1, daLam / mucTieu) : 0;

  return (
    <button
      type="button"
      onClick={moMucTieu}
      aria-label={`Mục tiêu hôm nay, đã làm ${daLam} trên ${mucTieu}`}
      className="bg-nen-noi border-vien fixed inset-x-0 top-0 z-40 flex w-full items-center gap-3 border-b px-4 text-left"
      style={{
        minHeight: "var(--cao-thanh-tren)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* Mặt trời lấy từ logo Riyi.
          Chưa đạt mục tiêu thì xám mờ, đạt rồi thì rực rỡ màu cam.
          Hiệu ứng động sẽ thêm ở GĐ 7. */}
      <img
        src="/hinh/mat-troi.png"
        alt=""
        width="34"
        height="18"
        className="shrink-0 transition-all duration-500"
        style={{
          filter: datMucTieu ? "none" : "grayscale(1) opacity(0.45)",
        }}
      />

      <div className="min-w-0 flex-1">
        <div className="text-[length:var(--co-chu-latin-nho)] leading-tight font-bold">
          Mục tiêu hôm nay
        </div>

        {/* Thanh tiến độ */}
        <div
          className="bg-nen-phu mt-1 h-1.5 w-full overflow-hidden rounded-[var(--bo-goc-tron)]"
          role="progressbar"
          aria-valuenow={daLam}
          aria-valuemin={0}
          aria-valuemax={mucTieu}
        >
          <div
            className="bg-nhan h-full rounded-[var(--bo-goc-tron)] transition-[width] duration-500"
            style={{ width: `${tiLe * 100}%` }}
          />
        </div>
      </div>

      <div className="text-chu-mo shrink-0 text-[length:var(--co-chu-latin-nho)] font-semibold tabular-nums">
        {daLam}/{mucTieu}
      </div>
    </button>
  );
}
