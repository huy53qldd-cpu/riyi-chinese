/* =============================================================================
   TIỆN ÍCH CHO PHẦN LUYỆN TẬP
   ============================================================================= */

/** Trả về bản sao đã xáo trộn ngẫu nhiên (không sửa mảng gốc). */
export function tronNgauNhien(mang) {
  const ra = [...mang];
  for (let i = ra.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [ra[i], ra[j]] = [ra[j], ra[i]];
  }
  return ra;
}

/**
 * Chọn ngẫu nhiên tối đa `soLuong` giá trị KHÁC NHAU từ `nguon`, bỏ qua những
 * giá trị nằm trong `tru` (ví dụ đáp án đúng, để đáp án nhiễu không trùng nó).
 */
export function chonKhacNhau(nguon, soLuong, tru = []) {
  const daCo = new Set(tru);
  const ra = [];
  for (const gt of tronNgauNhien(nguon)) {
    if (ra.length >= soLuong) break;
    if (gt == null || daCo.has(gt)) continue;
    daCo.add(gt);
    ra.push(gt);
  }
  return ra;
}

// Class dùng chung cho các màn luyện tập (màu lấy từ tokens.css qua Tailwind)
export const kieu = {
  nutChinh:
    "border-nhan bg-nhan text-chu-tren-nhan inline-flex items-center justify-center gap-2 rounded-[var(--bo-goc-tron)] border px-5 py-2.5 text-[length:var(--co-chu-latin)] font-bold disabled:opacity-40",
  // Cùng kích thước nút chính nhưng viền xanh, nền trong: bước đã xong ở Bài hôm nay
  nutDaXong:
    "border-dung text-dung inline-flex items-center justify-center gap-2 rounded-[var(--bo-goc-tron)] border bg-transparent px-5 py-2.5 text-[length:var(--co-chu-latin)] font-bold",
  nutPhu:
    "border-vien inline-flex items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold disabled:opacity-40",
  khung:
    "border-vien bg-nen-noi flex flex-col gap-2 rounded-[var(--bo-goc)] border p-4",
  nhanTieuDe:
    "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide",
  chuNho: "text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed",
};
