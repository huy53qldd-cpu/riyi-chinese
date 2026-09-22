/* =============================================================================
   TAB D — BÀI HÔM NAY (GĐ 10, thay cho "Mục tiêu hằng ngày" của GĐ 7)
   =============================================================================

   Mở bằng cách bấm thanh trên cùng.

   Mục tiêu ngày (quyết định 18.17 – 18.20, 18.24 – 18.27): học xong "Bài hôm
   nay" gồm 5 chữ Hán + 10 từ vựng + 3 điểm ngữ pháp, lấy theo lộ trình dễ → khó
   (public/du-lieu/lo-trinh.json). Mỗi phần làm lần lượt các bước (xem
   src/luyen-tap/baiHoc.js); trả lời sai thì được hỏi lại tới khi đúng. Xong
   hết các bước của cả 3 phần mới đạt mục tiêu ngày.

   Mỗi ngày một bài mới. Phần hôm qua còn thiếu được cộng thêm vào hôm nay
   (luật trong baiHoc.js, hàm chuyenNgay). Xong bài rồi thì học trước được.

   Chỉ dùng được khi đã đăng nhập.
   ============================================================================= */

import { CAC_PHAN, TONG_BUOC } from "../luyen-tap/baiHoc.js";
import { NutNhiemVu, useBaiHomNay, useNhiemVu } from "../luyen-tap/NhiemVuHomNay.jsx";
import { kieu } from "../luyen-tap/tienIch.js";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import { chuoiNgay, congNgay, docNgay } from "../nguoi-dung/nhatKy.js";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import MatTroi from "../thanh-phan/MatTroi.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { NutDangNhap } from "./CaiDat.jsx";

const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function TabMucTieu({ quayLai }) {
  const nd = useNguoiDung();
  const { loi, bai, noiDung, du } = useBaiHomNay();
  const { batDau, manHinh } = useNhiemVu(noiDung, du, bai?.so);

  if (!nd.daDangNhap) {
    return <CanDangNhap tieuDe="Bài hôm nay" quayLai={quayLai} />;
  }
  if (manHinh) return manHinh;

  const td = nd.tienDoHomNay;
  const homNay = chuoiNgay();
  const soBuocXong = nd.loTrinh.buoc.length;
  const xongHet = soBuocXong >= TONG_BUOC;
  const coThem = Boolean(noiDung && noiDung.them.size > 0);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={quayLai} className={kieu.nutPhu}>
          <BieuTuong ten="quay-lai" co={16} />
          Quay lại
        </button>
      </div>

      {/* --- Mặt trời và tiến độ --- */}
      <div className={`${kieu.khung} items-center gap-3 py-6 text-center`}>
        <MatTroi dat={td.dat} lanVuaDat={nd.lanVuaDat} rong={136} />
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          {td.dat ? "Đã đạt mục tiêu hôm nay!" : "Bài hôm nay"}
        </h1>
        {bai && (
          <p className="m-0 text-[2rem] leading-none font-extrabold tabular-nums">
            Bài {bai.so}
            <span className="text-chu-mo text-[length:var(--co-chu-latin)] font-semibold">
              {" "}· HSK {bai.capHsk}
              {bai.vong > 1 ? ` · ôn vòng ${bai.vong}` : ""}
            </span>
          </p>
        )}
        <div
          className="bg-nen-phu h-2 w-full max-w-xs overflow-hidden rounded-[var(--bo-goc-tron)]"
          role="progressbar"
          aria-valuenow={soBuocXong}
          aria-valuemin={0}
          aria-valuemax={TONG_BUOC}
          aria-label="Số bước đã xong của bài"
        >
          <div
            className="bg-nhan h-full rounded-[var(--bo-goc-tron)] transition-[width] duration-500"
            style={{ width: `${(soBuocXong / TONG_BUOC) * 100}%` }}
          />
        </div>
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">
          Đã xong {soBuocXong}/{TONG_BUOC} bước
        </p>
        <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
          {td.chuoi > 0
            ? `Chuỗi ${td.chuoi} ngày liên tiếp đạt mục tiêu`
            : "Học xong bài hôm nay để bắt đầu chuỗi ngày"}
        </p>
      </div>

      {coThem && (
        <div className="bg-nhan-nhat flex flex-col gap-1 rounded-[var(--bo-goc)] p-4">
          <p className="m-0 text-[length:var(--co-chu-latin)] font-bold">Hôm nay có phần ôn thêm</p>
          <p className="m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            Hôm qua còn phần chưa xong nên hôm nay được cộng thêm (có nhãn “ôn
            thêm” bên dưới): chưa tập viết thì viết thêm 1 chữ, chưa chơi xong
            thì trò chơi thêm 1 cặp thẻ, từ vựng và ngữ pháp chưa xong thì dồn
            sang hôm nay.
          </p>
        </div>
      )}

      {xongHet && (
        <div className="bg-nhan-nhat flex flex-col gap-2 rounded-[var(--bo-goc)] p-4">
          <p className="m-0 text-[length:var(--co-chu-latin)] font-bold">
            Bạn đã học xong bài hôm nay!
          </p>
          <p className="m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            Ngày mai bài mới sẽ tự mở. Muốn học trước thì bấm nút dưới đây.
          </p>
          <button type="button" onClick={nd.hocTruoc} className={`${kieu.nutChinh} self-start`}>
            <BieuTuong ten="tiep-theo" />
            Học trước bài tiếp theo
          </button>
        </div>
      )}

      {loi && (
        <p className="text-sai m-0 text-[length:var(--co-chu-latin-nho)]">
          Không tải được bài học. Hãy kiểm tra mạng rồi mở lại.
        </p>
      )}
      {!noiDung && !loi && <p className={kieu.chuNho}>Đang tải bài học...</p>}

      {/* --- Ba phần của bài --- */}
      {noiDung &&
        CAC_PHAN.map((phan) => (
          <PhanBai key={phan.ma} phan={phan} noiDung={noiDung} batDau={batDau} />
        ))}

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

      <p className={kieu.chuNho}>
        Mỗi ngày một bài mới: 5 chữ Hán, 10 từ vựng, 3 điểm ngữ pháp, xếp từ dễ
        đến khó. Làm đủ các bước của cả ba phần mới đạt mục tiêu ngày. Trả lời
        sai thì được hỏi lại cho tới khi đúng. Các nút luyện tập trong tab Chữ
        Hán, Từ vựng, Ngữ pháp cũng chính là các bước này.
      </p>
    </section>
  );
}

/** Nhãn nhỏ "ôn thêm" cho mục cộng thêm từ hôm qua. */
export function NhanOnThem() {
  return (
    <span className="bg-nhan-nhat text-chu rounded-[var(--bo-goc-tron)] px-2 py-0.5 text-[length:0.6875rem] font-bold whitespace-nowrap">
      ôn thêm
    </span>
  );
}

/* -----------------------------------------------------------------------------
   MỘT PHẦN CỦA BÀI: xem trước nội dung, rồi các bước làm lần lượt
   ----------------------------------------------------------------------------- */
function PhanBai({ phan, noiDung, batDau }) {
  const nd = useNguoiDung();
  const buocXong = nd.loTrinh.buoc;
  const soXong = phan.buoc.filter((b) => buocXong.includes(b.ma)).length;
  const cacChu = [
    ...noiDung.chuViet,
    ...noiDung.chuGame.filter((c) => !noiDung.chuViet.includes(c)),
  ];
  const tieuDe = {
    chu: `${noiDung.chu.length} chữ Hán`,
    tu: `${noiDung.tu.length} từ vựng`,
    np: `${noiDung.np.length} điểm ngữ pháp`,
  }[phan.ma];

  return (
    <div className={`${kieu.khung} gap-3`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">{tieuDe}</h2>
        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold whitespace-nowrap">
          {soXong === phan.buoc.length ? "Đã xong" : `${soXong}/${phan.buoc.length} bước`}
        </span>
      </div>

      {/* Xem trước nội dung: Trung → Nhật → Việt */}
      {phan.ma === "chu" && (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          {cacChu.map((c) => {
            const am = c.amDoc.pinyin.find((a) => a.chinh) ?? c.amDoc.pinyin[0];
            return (
              <span key={c.id} className="inline-flex flex-col items-center">
                <ChuTrung amTiet={[{ chu: c.gianThe, pinyin: am?.am ?? "" }]} />
                {noiDung.them.has(c.id) && <NhanOnThem />}
              </span>
            );
          })}
        </div>
      )}
      {phan.ma === "tu" && (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          {noiDung.tu.map((t) => (
            <span key={t.id} className="inline-flex flex-col items-center">
              <ChuTrung amTiet={ghepAmTiet(t.tu, t.pinyin)} />
              {noiDung.them.has(t.id) && <NhanOnThem />}
            </span>
          ))}
        </div>
      )}
      {phan.ma === "np" && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {noiDung.np.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-2 text-[length:var(--co-chu-latin)] font-semibold"
            >
              <VanBanPha noiDung={d.ten} />
              {noiDung.them.has(d.id) && <NhanOnThem />}
            </li>
          ))}
        </ul>
      )}

      <NutNhiemVu maPhan={phan.ma} batDau={batDau} />
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Màn hình nhắc đăng nhập (dùng chung cho tab Bài hôm nay và tab Review)
   ----------------------------------------------------------------------------- */
export function CanDangNhap({ tieuDe, quayLai }) {
  const nd = useNguoiDung();
  return (
    <section className="flex flex-col gap-4">
      {quayLai && (
        <div>
          <button type="button" onClick={quayLai} className={kieu.nutPhu}>
            <BieuTuong ten="quay-lai" co={16} />
            Quay lại
          </button>
        </div>
      )}
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">{tieuDe}</h1>
      <div className={`${kieu.khung} items-center text-center`}>
        <MatTroi dat={false} rong={96} />
        <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
          Phần này cần đăng nhập để lưu tiến độ học của bạn.
        </p>
        {nd.coTheDangNhap && <NutDangNhap nd={nd} />}
      </div>
    </section>
  );
}
