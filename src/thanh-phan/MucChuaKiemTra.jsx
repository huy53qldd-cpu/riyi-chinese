/* =============================================================================
   MỤC "CHƯA KIỂM TRA"
   =============================================================================

   Hiện danh sách những chỗ dữ liệu chưa được người xác minh (trường
   cangKiemTra trong file dữ liệu), để chủ dự án rà lại. Ẩn hẳn khi danh sách
   rỗng, nghĩa là mục đó đã kiểm tra xong.
   ============================================================================= */

import VanBanPha from "./VanBanPha.jsx";

export default function MucChuaKiemTra({ danhSach = [] }) {
  if (danhSach.length === 0) return null;

  return (
    <details className="border-vien rounded-[var(--bo-goc)] border border-dashed p-3">
      <summary className="text-canh-bao cursor-pointer text-[length:var(--co-chu-latin-nho)] font-bold">
        Chưa kiểm tra ({danhSach.length})
      </summary>
      <ul className="text-chu-mo m-0 mt-2 pl-5 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        {danhSach.map((dong) => (
          <li key={dong}>
            <VanBanPha noiDung={dong} />
          </li>
        ))}
      </ul>
    </details>
  );
}
