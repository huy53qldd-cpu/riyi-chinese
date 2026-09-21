/* =============================================================================
   LOGO RIYI
   =============================================================================

   Logo có ba bản: chữ nâu cho nền sáng, chữ kem cho nền tối, và bản tông hồng
   (chữ nâu mận, mặt trời hồng) cho theme hoa anh đào (GĐ 10).

   LƯU Ý QUAN TRỌNG — đây là chỗ rất dễ làm sai:
   KHÔNG được chọn logo theo prefers-color-scheme (tức là theo cài đặt sáng/tối
   của điện thoại). Vì app có nút đổi theme riêng, nên hai thứ đó có thể lệch
   nhau: điện thoại để chế độ tối nhưng app đang ở nền sáng. Khi đó sẽ lấy nhầm
   logo chữ kem đặt lên nền kem, và chữ "Riyi" biến mất, chỉ còn mặt trời.

   Vì vậy phải chọn theo data-theme của chính app. Việc chọn do CSS lo
   (xem phần .logo-sang / .logo-toi / .logo-anh-dao trong index.css).
   ============================================================================= */

export default function Logo({ rong = 150, className = "" }) {
  return (
    <span
      className={`inline-block leading-none ${className}`}
      style={{ width: rong }}
    >
      {/* Bản dùng cho nền sáng */}
      <img
        src="/hinh/logo-sang.png"
        alt="Riyi"
        width="738"
        height="714"
        className="logo-sang h-auto w-full"
      />

      {/* Bản dùng cho nền tối. alt để trống và aria-hidden vì đây chỉ là
          bản thay thế của cùng một logo, không phải ảnh thứ hai. */}
      <img
        src="/hinh/logo-toi.png"
        alt=""
        aria-hidden="true"
        width="480"
        height="468"
        className="logo-toi h-auto w-full"
      />

      {/* Bản tông hồng cho theme hoa anh đào */}
      <img
        src="/hinh/logo-anh-dao.png"
        alt=""
        aria-hidden="true"
        width="738"
        height="714"
        className="logo-anh-dao h-auto w-full"
      />
    </span>
  );
}
