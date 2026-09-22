/* =============================================================================
   THANH TRÊN — "MỤC TIÊU HÔM NAY"
   =============================================================================

   Đây là tab thứ 6, đặt riêng ở trên cùng vì với người học thì mục tiêu hằng
   ngày là thứ quan trọng nhất, phải nhìn thấy ngay mà không cần bấm tìm.

   Chỉ hiện khi ĐÃ ĐĂNG NHẬP. Chế độ khách không có mục tiêu, không có streak,
   nên thanh này ẩn hẳn và thay bằng dải nhắc chế độ khách.

   Số liệu lấy từ nd.tienDoHomNay (NguoiDung.jsx). Đạt mục tiêu thì mặt trời
   nảy lên và toả sáng. Bấm vào thanh để mở tab Mục tiêu.

   Cả hai trạng thái đều có nút bánh răng để mở Cài đặt.
   ============================================================================= */

import { TONG_BUOC } from "../luyen-tap/baiHoc.js";
import MatTroi from "./MatTroi.jsx";
import BieuTuong from "./BieuTuong.jsx";

export default function ThanhTren({
  daDangNhap,
  tienDo,
  lanVuaDat = 0,
  moMucTieu,
  moCaiDat,
}) {
  // -------------------------------------------------------------------------
  // CHẾ ĐỘ KHÁCH — không có mục tiêu, chỉ nhắc nhẹ một dòng
  // -------------------------------------------------------------------------
  if (!daDangNhap) {
    return (
      <div
        className="bg-nen-phu text-chu-mo fixed inset-x-0 top-0 z-40 flex items-center gap-2 px-4 text-center text-[length:var(--co-chu-latin-nho)]"
        style={{
          minHeight: "var(--cao-thanh-tren)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <span className="flex-1 py-2">
          Bạn đang học ở chế độ khách, tiến độ sẽ không được lưu.
        </span>
        <NutCaiDat moCaiDat={moCaiDat} />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ĐÃ ĐĂNG NHẬP — hiện mặt trời và tiến độ
  // -------------------------------------------------------------------------
  // Mục tiêu ngày (GĐ 10): học xong Bài hôm nay, tiến độ tính theo số bước
  const { bai, soBuocXong, dat, chuoi } = tienDo;
  const tiLe = Math.min(1, soBuocXong / TONG_BUOC);

  return (
    <div
      className="bg-nen-noi border-vien fixed inset-x-0 top-0 z-40 flex w-full items-center gap-2 border-b px-4"
      style={{
        minHeight: "var(--cao-thanh-tren)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <button
        type="button"
        onClick={moMucTieu}
        aria-label={`Bài hôm nay: bài ${bai}, đã xong ${soBuocXong} trên ${TONG_BUOC} bước${dat ? ", đã đạt mục tiêu" : ""}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {/* Mặt trời lấy từ logo Riyi: chưa đạt thì xám mờ, đạt rồi thì toả sáng */}
        <MatTroi dat={dat} lanVuaDat={lanVuaDat} />

        <div className="min-w-0 flex-1">
          {/* Luôn một dòng. Chữ to (thanh kéo cỡ chữ) mà hết chỗ thì phần
              "· N ngày liền" bị rút gọn bằng dấu "…", tên mục tiêu giữ nguyên */}
          <div className="flex items-baseline gap-2 text-[length:var(--co-chu-latin-nho)] leading-tight font-bold whitespace-nowrap">
            <span className="shrink-0">{dat ? "Đã đạt mục tiêu!" : "Bài hôm nay"}</span>
            {chuoi > 0 && (
              <span className="text-chu-mo min-w-0 truncate font-semibold">· {chuoi} ngày liền</span>
            )}
          </div>

          {/* Thanh tiến độ */}
          <div
            className="bg-nen-phu mt-1 h-1.5 w-full overflow-hidden rounded-[var(--bo-goc-tron)]"
            role="progressbar"
            aria-valuenow={soBuocXong}
            aria-valuemin={0}
            aria-valuemax={TONG_BUOC}
          >
            <div
              className="bg-nhan h-full rounded-[var(--bo-goc-tron)] transition-[width] duration-500"
              style={{ width: `${tiLe * 100}%` }}
            />
          </div>
        </div>

        <div className="text-chu-mo shrink-0 text-[length:var(--co-chu-latin-nho)] font-semibold tabular-nums">
          Bài {bai} · {soBuocXong}/{TONG_BUOC}
        </div>
      </button>
      <NutCaiDat moCaiDat={moCaiDat} />
    </div>
  );
}

/** Nút bánh răng mở màn hình Cài đặt. */
function NutCaiDat({ moCaiDat }) {
  return (
    <button
      type="button"
      onClick={moCaiDat}
      aria-label="Cài đặt"
      className="text-chu-mo flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl"
    >
      <BieuTuong ten="cai-dat" co={20} />
    </button>
  );
}
