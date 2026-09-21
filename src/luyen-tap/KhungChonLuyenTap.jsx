/* =============================================================================
   Ô CHỌN CÁCH LUYỆN TẬP (đặt đầu danh sách ở Tab B, C, F)
   =============================================================================

   Luyện trên đúng những mục đang hiện theo bộ lọc, nên muốn luyện riêng HSK 1
   hay một chủ đề thì lọc trước rồi bấm.
   ============================================================================= */

import { kieu } from "./tienIch.js";

/**
 * @param {Array<{ma: string, nhan: string}>} cacCach  Các cách luyện
 * @param {number}   soMuc  Số mục đang hiện theo bộ lọc
 * @param {Function} chon   Gọi với mã cách luyện được chọn
 */
export default function KhungChonLuyenTap({ cacCach, soMuc, chon }) {
  return (
    <div className={`${kieu.khung} mt-4`}>
      <p className={kieu.nhanTieuDe}>Luyện tập</p>
      <div className="flex flex-wrap gap-2">
        {cacCach.map((c) => (
          <button
            key={c.ma}
            type="button"
            onClick={() => chon(c.ma)}
            disabled={soMuc === 0}
            className={kieu.nutChinh}
          >
            {c.nhan}
          </button>
        ))}
      </div>
      <p className={kieu.chuNho}>
        Mỗi lượt 10 câu, lấy từ {soMuc} mục đang hiện theo bộ lọc. Trả lời đúng
        được tính vào mục tiêu hôm nay, trả lời sai sẽ vào mục Review.
      </p>
    </div>
  );
}
