/* =============================================================================
   ĐÁNH DẤU "ĐÃ HỌC"
   =============================================================================

   Hai mảnh nhỏ dùng ở Tab A (chữ Hán), Tab C (từ vựng), Tab F (ngữ pháp):

     <NutDaHoc id="han-0001" />   nút bật/tắt trong trang chi tiết
     <DauDaHoc id="han-0001" />   dấu ✓ nhỏ trên thẻ ở danh sách

   Chế độ khách không lưu tiến độ, nên ở chế độ khách cả hai đều KHÔNG hiện.
   ============================================================================= */

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BieuTuong, { CanhHoa } from "./BieuTuong.jsx";

/** Hình của "đã học": dấu sách ở theme sáng/tối, cánh hoa ở theme hoa anh đào. */
function HinhDaHoc({ co }) {
  return (
    <>
      <span className="tru-anh-dao inline-flex">
        <BieuTuong ten="da-hoc" co={co} />
      </span>
      <span className="chi-anh-dao">
        <CanhHoa co={co} />
      </span>
    </>
  );
}

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
      className={`inline-flex items-center gap-1.5 self-start rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors ${
        daHoc
          ? "border-dung text-dung"
          : "border-vien bg-transparent"
      }`}
    >
      <HinhDaHoc co={16} />
      {daHoc ? "Đã học" : "Đánh dấu đã học"}
    </button>
  );
}

/** Dấu nhỏ "đã học" trên thẻ ở danh sách. Không hiện gì nếu chưa học. */
export function DauDaHoc({ id }) {
  const nd = useNguoiDung();
  if (!nd.daDangNhap || !nd.daHoc[id]) return null;
  return (
    <span className="text-dung inline-flex items-center gap-1 text-[length:var(--co-chu-latin-nho)] font-bold">
      <HinhDaHoc co={14} />
      Đã học
    </span>
  );
}
