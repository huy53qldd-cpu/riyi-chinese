/* =============================================================================
   ĐÈN LỒNG TREO (theme Hoa Đăng Dạ Nguyệt, quyết định 18.49)
   =============================================================================

   Hai chiếc đèn lồng đỏ treo ngay dưới thanh trên, mỗi chiếc một sợi dây
   vàng mảnh. Chúng lắc nhẹ như có gió (lệch nhịp nhau) và có đốm nến sáng tối
   bên trong. Hiệu ứng nằm ở index.css (.den-long-treo).

   Chỉ hiện ở theme này (CSS ẩn ở các theme khác). Đèn nằm ở KHOẢNG TRỐNG hai
   bên mép của cột nội dung (cột nội dung cách mép 1.25rem, đèn rộng đúng
   1.25rem nên không che chữ, chỉ quầng sáng lan vào); lại không bắt bấm (pointer-events: none), bấm xuyên qua được.
   Máy bật "Giảm chuyển động" thì đèn đứng yên.
   ============================================================================= */

import { useId } from "react";

/** Một chiếc đèn lồng treo: dây vàng, thân đỏ sáng dần vào lõi nến, quầng đỏ
 *  toả ra xung quanh, chóp và đáy hổ phách, tua rua. Màu ở tokens.css. */
function ChiecDen({ dai, tre = 0, nhip = 3.6 }) {
  // dai: chiều dài sợi dây (tính theo khung vẽ, 16 đơn vị ~ 0.83rem). Đèn rộng
  // 1.25rem, vừa khít khoảng trống cạnh cột nội dung (quyết định 18.51: to gần
  // gấp đôi bản đầu để ra dáng đèn lồng Trung thu, mà không đè lên chữ).
  // tre, nhip: lệch nhịp và độ dài một lần lắc (giây), để hai đèn không lắc cùng lúc
  const ma = `den-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const y = dai * 16; // chỗ dây chạm chóp đèn (px trong khung vẽ)
  return (
    <svg
      className="chiec block"
      viewBox={`0 0 24 ${y + 44}`}
      width="1.25rem"
      height={`${((y + 44) / 24) * 1.25}rem`}
      aria-hidden="true"
      focusable="false"
      overflow="visible"
      style={{ animationDelay: `${tre}s`, animationDuration: `${nhip}s` }}
    >
      <defs>
        <radialGradient id={`${ma}-than`} cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="var(--lantern-den-tim)" />
          <stop offset="35%" stopColor="var(--lantern-den-than)" />
          <stop offset="100%" stopColor="var(--lantern-den-ria)" />
        </radialGradient>
        <radialGradient id={`${ma}-quang`}>
          <stop offset="0%" stopColor="var(--lantern-den-quang)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* Dây treo */}
      <line x1="12" y1="0" x2="12" y2={y + 2} stroke="var(--lantern-gold)" strokeWidth="1" />
      <g transform={`translate(0 ${y})`}>
        {/* Quầng sáng đỏ toả ra quanh đèn: sáng tối theo nhịp nến */}
        <circle className="nen-den" cx="12" cy="17" r="20" fill={`url(#${ma}-quang)`} />
        {/* Chóp trên */}
        <rect x="7" y="1.5" width="10" height="3" rx="1.2" fill="var(--lantern-gold)" />
        {/* Thân đèn và các nan tre */}
        <ellipse cx="12" cy="17" rx="11" ry="12.5" fill={`url(#${ma}-than)`} />
        <path
          d="M7.6 5.6 C4.6 10 4.6 24 7.6 28.4 M16.4 5.6 C19.4 10 19.4 24 16.4 28.4 M12 4.5 V29.5"
          stroke="var(--lantern-den-ria)"
          strokeOpacity="0.55"
          strokeWidth="0.9"
          fill="none"
        />
        {/* Đốm nến bên trong: sáng tối nhẹ */}
        <ellipse className="nen-den" cx="12" cy="17" rx="4" ry="5" fill="var(--lantern-trang-tam)" opacity="0.55" />
        {/* Đáy và tua rua */}
        <rect x="7" y="29" width="10" height="3" rx="1.2" fill="var(--lantern-gold)" />
        <path
          d="M10 32 V42 M12 32 V43.5 M14 32 V42"
          stroke="var(--lantern-tertiary)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default function DenLongTreo() {
  return (
    <div
      className="den-long-treo pointer-events-none fixed inset-x-0 z-30 mx-auto w-full max-w-xl"
      style={{ top: "calc(var(--cao-thanh-tren) + env(safe-area-inset-top))" }}
      aria-hidden="true"
    >
      <div className="absolute left-0">
        <ChiecDen dai={1.25} />
      </div>
      <div className="absolute right-0">
        <ChiecDen dai={2.25} tre={-0.5} nhip={3.2} />
      </div>
    </div>
  );
}
