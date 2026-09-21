/* =============================================================================
   ĐÁNH DẤU "ĐÃ HỌC"
   =============================================================================

   Hai mảnh nhỏ dùng ở Tab A (chữ Hán), Tab C (từ vựng), Tab F (ngữ pháp):

     <NutDaHoc id="han-0001" />   nút bật/tắt trong trang chi tiết
     <DauDaHoc id="han-0001" />   dấu ✓ nhỏ trên thẻ ở danh sách

   Chế độ khách không lưu tiến độ, nên ở chế độ khách cả hai đều KHÔNG hiện.
   ============================================================================= */

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";

/** Nút bật/tắt "đã học" trong trang chi tiết. */
export default function NutDaHoc({ id }) {
  const nd = useNguoiDung();
  if (!nd.daDangNhap) return null;

  const daHoc = Boolean(nd.daHoc[id]);
  return (
    <button
      type="button"
      aria-pressed={daHoc}
      onClick={() => nd.danhDauDaHoc(id, !daHoc)}
      className={`self-start rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors ${
        daHoc
          ? "border-dung text-dung"
          : "border-vien bg-transparent"
      }`}
    >
      {daHoc ? "✓ Đã học" : "Đánh dấu đã học"}
    </button>
  );
}

/** Dấu nhỏ "đã học" trên thẻ ở danh sách. Không hiện gì nếu chưa học. */
export function DauDaHoc({ id }) {
  const nd = useNguoiDung();
  if (!nd.daDangNhap || !nd.daHoc[id]) return null;
  return (
    <span className="text-dung text-[length:var(--co-chu-latin-nho)] font-bold">
      ✓ Đã học
    </span>
  );
}
