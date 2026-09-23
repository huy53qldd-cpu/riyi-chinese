/* =============================================================================
   NÚT LOA — PHÁT ÂM
   =============================================================================

   Mọi chỗ cần nghe phát âm đều dùng nút này. Nút gọi vào hàm phatAm() duy nhất
   ở src/am-thanh/phatAm.js. Đổi nguồn âm thanh thì sửa phatAm.js, không sửa đây.

   TỪ CHƯA CÓ GHI ÂM thì nút TỰ ẨN (quyết định 18.37), để không ai bấm vào một
   nút câm. Chỉ áp dụng cho từ tiếng Trung; các chỗ khác nút vẫn hiện như cũ.
   ============================================================================= */

import { useEffect, useState } from "react";

import { coAmTu, NGON_NGU, phatAm, taiDanhSachAmTu } from "../am-thanh/phatAm.js";
import { useThongBao } from "./ThongBao.jsx";

export default function NutLoa({
  noiDung,
  ngonNgu = NGON_NGU.TRUNG,
  co = 40,
  className = "",
  // true: chỉ hiện nút khi từ này có ghi âm thật (dùng cho danh sách và chi tiết từ)
  anKhiChuaCoAm = false,
}) {
  const hienThongBao = useThongBao();
  const [coAm, setCoAm] = useState(() => (anKhiChuaCoAm ? coAmTu(noiDung) : true));

  useEffect(() => {
    if (!anKhiChuaCoAm) return;
    let conSong = true;
    taiDanhSachAmTu().then(() => conSong && setCoAm(coAmTu(noiDung)));
    return () => {
      conSong = false;
    };
  }, [anKhiChuaCoAm, noiDung]);

  // Chưa tải xong danh sách (null) cũng chưa hiện, để nút không nhấp nháy
  if (anKhiChuaCoAm && !coAm) return null;

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
