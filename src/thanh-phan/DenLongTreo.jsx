/* =============================================================================
   ĐÈN LỒNG TREO (theme Hoa Đăng Dạ Nguyệt, quyết định 18.49)
   =============================================================================

   Hai chiếc đèn lồng đỏ nhỏ treo ngay dưới thanh trên, mỗi chiếc một sợi dây
   vàng mảnh. Chúng lắc nhẹ như có gió (lệch nhịp nhau) và có đốm nến sáng tối
   bên trong. Hiệu ứng nằm ở index.css (.den-long-treo).

   Chỉ hiện ở theme này (CSS ẩn ở các theme khác). Đèn nằm ở KHOẢNG TRỐNG hai
   bên mép của cột nội dung (cột nội dung cách mép 1.25rem), nên không che thẻ
   nào; lại không bắt bấm (pointer-events: none), bấm xuyên qua được.
   Máy bật "Giảm chuyển động" thì đèn đứng yên.
   ============================================================================= */

/** Một chiếc đèn lồng treo: dây vàng, thân đỏ, đốm nến vàng bên trong. */
function ChiecDen({ dai, tre = 0, nhip = 3.6 }) {
  // dai: chiều dài sợi dây (rem). Thân đèn cao 1.5rem, rộng 0.875rem.
  // tre, nhip: lệch nhịp và độ dài một lần lắc (giây), để hai đèn không lắc cùng lúc
  return (
    <svg
      className="chiec block"
      viewBox={`0 0 14 ${dai * 16 + 26}`}
      width="0.875rem"
      height={`${dai + 1.625}rem`}
      aria-hidden="true"
      focusable="false"
      overflow="visible"
      style={{ animationDelay: `${tre}s`, animationDuration: `${nhip}s` }}
    >
      {/* Dây treo */}
      <line x1="7" y1="0" x2="7" y2={dai * 16 + 2} stroke="var(--lantern-gold)" strokeWidth="0.8" />
      <g transform={`translate(0 ${dai * 16})`}>
        {/* Nắp trên, thân đèn, đáy, tua rua */}
        <rect x="4" y="2" width="6" height="2" rx="0.8" fill="var(--lantern-gold)" />
        <ellipse cx="7" cy="11" rx="6.5" ry="7.5" fill="var(--lantern-cta-sang)" />
        <path
          d="M4.4 4.6 C3.2 7 3.2 15 4.4 17.4 M9.6 4.6 C10.8 7 10.8 15 9.6 17.4"
          stroke="var(--lantern-cta-toi)"
          strokeWidth="0.7"
          fill="none"
        />
        {/* Đốm nến bên trong: sáng tối nhẹ */}
        <circle className="nen-den" cx="7" cy="11" r="2.6" fill="var(--lantern-gold)" opacity="0.8" />
        <rect x="4" y="18" width="6" height="1.8" rx="0.8" fill="var(--lantern-gold)" />
        <line x1="7" y1="19.8" x2="7" y2="24" stroke="var(--lantern-gold)" strokeWidth="0.8" />
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
      <div className="absolute left-[0.1875rem]">
        <ChiecDen dai={1.25} />
      </div>
      <div className="absolute right-[0.1875rem]">
        <ChiecDen dai={2.25} tre={-0.5} nhip={3.2} />
      </div>
    </div>
  );
}
