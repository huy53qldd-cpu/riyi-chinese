/* =============================================================================
   MẶT TRỜI MỤC TIÊU
   =============================================================================

   Hình mặt trời lấy từ logo Riyi. Chưa đạt mục tiêu thì xám mờ, đạt rồi thì
   rực rỡ và toả sáng nhẹ. Hiệu ứng nằm ở index.css (.mat-troi-*).

   `lanVuaDat` tăng lên mỗi lần vừa đạt mục tiêu: đổi key để trình duyệt chạy
   lại hiệu ứng "nảy lên" một lần.
   Ở theme hoa anh đào, mặt trời được thay bằng bông hoa anh đào (quyết định
   18.3). Cả hai cùng được vẽ, CSS ẩn cái không hợp theme (.tru-anh-dao,
   .chi-anh-dao trong index.css).
   ============================================================================= */

import { HoaAnhDao, VangTrang } from "./BieuTuong.jsx";

export default function MatTroi({ dat, lanVuaDat = 0, rong = 34, className = "" }) {
  const hieuUng = !dat
    ? "mat-troi-chua-dat"
    : lanVuaDat > 0
      ? "mat-troi-vua-dat"
      : "mat-troi-da-dat";
  const cao = Math.round((rong * 18) / 34);
  return (
    <>
      {/* Theme sáng, tối: mặt trời lấy từ logo */}
      <img
        key={`mt-${lanVuaDat}`}
        src="/hinh/mat-troi.png"
        alt=""
        width={rong}
        height={cao}
        style={{ width: `${rong / 16}rem`, height: "auto" }}
        className={`mat-troi tru-hinh-theme shrink-0 ${hieuUng} ${className}`}
      />
      {/* Theme hoa anh đào: bông hoa, cùng hiệu ứng xám / toả sáng / nảy lên.
          Hoa hình tròn nên lấy cỡ lớn hơn chiều cao mặt trời một chút. */}
      <span
        key={`hoa-${lanVuaDat}`}
        className={`mat-troi chi-anh-dao shrink-0 text-[var(--mat-troi-dat)] ${hieuUng} ${className}`}
      >
        <HoaAnhDao co={Math.round(cao * 1.3)} />
      </span>
      {/* Theme Hoa Đăng Dạ Nguyệt (quyết định 18.49): vầng trăng rằm có hào
          quang, cùng hiệu ứng xám / toả sáng / nảy lên */}
      <span
        key={`trang-${lanVuaDat}`}
        className={`mat-troi chi-den-long vang-trang shrink-0 text-[var(--mat-troi-dat)] ${hieuUng} ${className}`}
      >
        <VangTrang co={Math.round(cao * 1.3)} />
      </span>
    </>
  );
}
