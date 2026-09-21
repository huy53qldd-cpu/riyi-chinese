/* =============================================================================
   MẶT TRỜI MỤC TIÊU
   =============================================================================

   Hình mặt trời lấy từ logo Riyi. Chưa đạt mục tiêu thì xám mờ, đạt rồi thì
   rực rỡ và toả sáng nhẹ. Hiệu ứng nằm ở index.css (.mat-troi-*).

   `lanVuaDat` tăng lên mỗi lần vừa đạt mục tiêu: đổi key để trình duyệt chạy
   lại hiệu ứng "nảy lên" một lần.
   ============================================================================= */

export default function MatTroi({ dat, lanVuaDat = 0, rong = 34, className = "" }) {
  const hieuUng = !dat
    ? "mat-troi-chua-dat"
    : lanVuaDat > 0
      ? "mat-troi-vua-dat"
      : "mat-troi-da-dat";
  return (
    <img
      key={lanVuaDat}
      src="/hinh/mat-troi.png"
      alt=""
      width={rong}
      height={Math.round((rong * 18) / 34)}
      className={`mat-troi shrink-0 ${hieuUng} ${className}`}
    />
  );
}
