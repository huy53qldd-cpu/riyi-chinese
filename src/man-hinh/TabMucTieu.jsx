/* =============================================================================
   TAB D — MỤC TIÊU HẰNG NGÀY (GIAI ĐOẠN 7)
   =============================================================================

   Mở bằng cách bấm thanh "Mục tiêu hôm nay" ở trên cùng.

   - Mặt trời lớn: chưa đạt thì xám mờ, đạt mục tiêu thì toả sáng.
   - Chuỗi ngày liên tiếp đạt mục tiêu (streak).
   - Đặt mục tiêu: chọn MỘT trong ba loại (chữ Hán / từ / phút) và số lượng.
   - Hôm nay đã làm được gì, và 7 ngày gần nhất có đạt không.

   Cách tính (đã chốt với chủ dự án, xem nhatKy.js):
     - Chữ Hán: số chữ tập viết xong mà không cần gợi ý
     - Từ     : số từ trả lời đúng trong luyện tập (Tab C và Tab B)
     - Phút   : thời gian app đang mở và có thao tác

   Chỉ dùng được khi đã đăng nhập.
   ============================================================================= */

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import {
  LOAI_MUC_TIEU,
  chuoiNgay,
  congNgay,
  daLamTrongNgay,
  docNgay,
} from "../nguoi-dung/nhatKy.js";
import MatTroi from "../thanh-phan/MatTroi.jsx";
import { kieu } from "../luyen-tap/tienIch.js";

const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function TabMucTieu({ quayLai }) {
  const nd = useNguoiDung();

  if (!nd.daDangNhap) {
    return <CanDangNhap tieuDe="Mục tiêu hôm nay" quayLai={quayLai} />;
  }

  const td = nd.tienDoHomNay;
  const loai = LOAI_MUC_TIEU[td.loai];
  const tiLe = Math.min(1, td.daLam / td.mucTieu);
  const homNay = chuoiNgay();
  const ngayHomNay = nd.nhatKy[homNay];

  function doiLoai(ma) {
    nd.doiMucTieu({ loai: ma, soLuong: LOAI_MUC_TIEU[ma].macDinh });
  }
  function doiSo(buoc) {
    nd.doiMucTieu({ ...nd.mucTieu, soLuong: nd.mucTieu.soLuong + buoc });
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={quayLai} className={kieu.nutPhu}>
          ← Quay lại
        </button>
      </div>

      {/* --- Mặt trời và tiến độ --- */}
      <div className={`${kieu.khung} items-center gap-3 py-6 text-center`}>
        <MatTroi dat={td.dat} lanVuaDat={nd.lanVuaDat} rong={136} />
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          {td.dat ? "Đã đạt mục tiêu hôm nay!" : "Mục tiêu hôm nay"}
        </h1>
        <p className="m-0 text-[2.25rem] leading-none font-extrabold tabular-nums">
          {td.daLam}
          <span className="text-chu-mo text-[length:var(--co-chu-latin)] font-semibold">
            {" "}/ {td.mucTieu} {loai.donVi}
          </span>
        </p>
        <div
          className="bg-nen-phu h-2 w-full max-w-xs overflow-hidden rounded-[var(--bo-goc-tron)]"
          role="progressbar"
          aria-valuenow={td.daLam}
          aria-valuemin={0}
          aria-valuemax={td.mucTieu}
          aria-label="Tiến độ mục tiêu hôm nay"
        >
          <div
            className="bg-nhan h-full rounded-[var(--bo-goc-tron)] transition-[width] duration-500"
            style={{ width: `${tiLe * 100}%` }}
          />
        </div>
        <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
          {td.chuoi > 0
            ? `Chuỗi ${td.chuoi} ngày liên tiếp đạt mục tiêu`
            : "Đạt mục tiêu hôm nay để bắt đầu chuỗi ngày"}
        </p>
      </div>

      {/* --- 7 ngày gần nhất --- */}
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>7 ngày gần nhất</p>
        <ol className="m-0 grid list-none grid-cols-7 gap-1 p-0">
          {Array.from({ length: 7 }, (_, i) => congNgay(homNay, i - 6)).map((ngay) => {
            const dat = Boolean(nd.nhatKy[ngay]?.dat);
            const d = docNgay(ngay);
            return (
              <li
                key={ngay}
                className="flex flex-col items-center gap-1"
                aria-label={`${THU[d.getDay()]} ngày ${d.getDate()}: ${dat ? "đã đạt" : "chưa đạt"}`}
              >
                <MatTroi dat={dat} rong={30} />
                <span
                  className={`text-[length:var(--co-chu-latin-nho)] ${
                    ngay === homNay ? "font-extrabold" : "text-chu-mo font-semibold"
                  }`}
                >
                  {ngay === homNay ? "Nay" : THU[d.getDay()]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* --- Hôm nay đã làm --- */}
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>Hôm nay bạn đã</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {Object.entries(LOAI_MUC_TIEU).map(([ma, l]) => (
            <div key={ma} className="bg-nen-phu rounded-[var(--bo-goc-nho)] px-2 py-3">
              <p className="m-0 text-[1.5rem] leading-none font-extrabold tabular-nums">
                {daLamTrongNgay(ngayHomNay, ma)}
              </p>
              <p className="text-chu-mo m-0 mt-1 text-[length:var(--co-chu-latin-nho)] font-semibold">
                {ma === "phut" ? "phút học" : ma === "tu" ? "từ đúng" : "chữ viết đạt"}
              </p>
              <span className="sr-only">{l.nhan}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- Đặt mục tiêu --- */}
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>Đặt mục tiêu mỗi ngày</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Loại mục tiêu">
          {Object.entries(LOAI_MUC_TIEU).map(([ma, l]) => (
            <button
              key={ma}
              type="button"
              onClick={() => doiLoai(ma)}
              aria-pressed={nd.mucTieu.loai === ma}
              className={`rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold ${
                nd.mucTieu.loai === ma
                  ? "border-nhan bg-nhan text-chu-tren-nhan"
                  : "border-vien bg-transparent"
              }`}
            >
              {l.nhan}
            </button>
          ))}
        </div>

        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => doiSo(-1)}
            disabled={nd.mucTieu.soLuong <= 1}
            aria-label="Giảm mục tiêu"
            className={`${kieu.nutPhu} h-11 w-11 p-0 text-xl`}
          >
            −
          </button>
          <p className="m-0 min-w-24 text-center text-[length:var(--co-chu-latin)] font-bold tabular-nums">
            {nd.mucTieu.soLuong} {loai.donVi}
          </p>
          <button
            type="button"
            onClick={() => doiSo(1)}
            disabled={nd.mucTieu.soLuong >= loai.toiDa}
            aria-label="Tăng mục tiêu"
            className={`${kieu.nutPhu} h-11 w-11 p-0 text-xl`}
          >
            +
          </button>
        </div>
        <p className={kieu.chuNho}>
          {nd.mucTieu.loai === "chu-han" &&
            "Tính mỗi chữ Hán tập viết xong mà không cần gợi ý (Tab Chữ Hán, trang chi tiết)."}
          {nd.mucTieu.loai === "tu" &&
            "Tính mỗi từ trả lời đúng trong phần Luyện tập của tab Từ vựng và tab Đồng tự."}
          {nd.mucTieu.loai === "phut" &&
            "Tính thời gian app đang mở và bạn có thao tác. Để app mở rồi bỏ đi thì không tính."}{" "}
          Một mục đúng nhiều lần trong ngày chỉ tính một lần.
        </p>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
   Màn hình nhắc đăng nhập (dùng chung cho tab Mục tiêu và tab Review)
   ----------------------------------------------------------------------------- */
export function CanDangNhap({ tieuDe, quayLai }) {
  const nd = useNguoiDung();
  return (
    <section className="flex flex-col gap-4">
      {quayLai && (
        <div>
          <button type="button" onClick={quayLai} className={kieu.nutPhu}>
            ← Quay lại
          </button>
        </div>
      )}
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">{tieuDe}</h1>
      <div className={`${kieu.khung} items-center text-center`}>
        <MatTroi dat={false} rong={96} />
        <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
          Phần này cần đăng nhập để lưu tiến độ học của bạn.
        </p>
        {nd.coTheDangNhap && (
          <button type="button" onClick={nd.dangNhap} className={kieu.nutChinh}>
            Đăng nhập bằng Google
          </button>
        )}
      </div>
    </section>
  );
}
