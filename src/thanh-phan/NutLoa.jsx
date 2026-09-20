/* =============================================================================
   NÚT LOA — PHÁT ÂM
   =============================================================================

   Mọi chỗ cần nghe phát âm đều dùng nút này. Nút gọi vào hàm phatAm() duy nhất
   ở src/am-thanh/phatAm.js.

   Hiện tại chưa có nguồn âm thanh nên bấm sẽ hiện thông báo tiếng Việt.
   Khi nào gắn âm thanh thật, KHÔNG phải sửa file này — chỉ sửa phatAm.js.
   ============================================================================= */

import { phatAm, NGON_NGU } from "../am-thanh/phatAm.js";
import { useThongBao } from "./ThongBao.jsx";

export default function NutLoa({
  noiDung,
  ngonNgu = NGON_NGU.TRUNG,
  co = 40,
  className = "",
}) {
  const hienThongBao = useThongBao();

  async function khiBam() {
    const ketQua = await phatAm(noiDung, ngonNgu);
    if (!ketQua.thanhCong && ketQua.thongBao) {
      hienThongBao(ketQua.thongBao);
    }
  }

  return (
    <button
      type="button"
      onClick={khiBam}
      // Nhãn cho trình đọc màn hình. Không đọc nội dung chữ Hán ra ở đây
      // vì trình đọc tiếng Việt sẽ đọc sai.
      aria-label="Nghe phát âm"
      title="Nghe phát âm"
      className={`border-vien text-nhan hover:bg-nhan-nhat active:bg-nhan-nhat inline-flex shrink-0 items-center justify-center rounded-[var(--bo-goc-tron)] border bg-transparent transition-colors ${className}`}
      style={{ width: co, height: co }}
    >
      {/* Biểu tượng loa vẽ bằng SVG, không dùng ảnh, để đổi màu và phóng to
          thoải mái mà không bị vỡ nét */}
      <svg
        width={co * 0.5}
        height={co * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  );
}
