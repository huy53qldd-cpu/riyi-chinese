/* =============================================================================
   TAB D — BÀI HÔM NAY (GĐ 10, thay cho "Mục tiêu hằng ngày" của GĐ 7)
   =============================================================================

   Mở bằng cách bấm thanh trên cùng.

   Mục tiêu ngày (quyết định 18.17 – 18.20): học xong "Bài hôm nay" gồm
   5 chữ Hán + 10 từ vựng + 1 điểm ngữ pháp, lấy theo lộ trình dễ → khó
   (public/du-lieu/lo-trinh.json). Mỗi phần làm lần lượt các bước (xem
   src/luyen-tap/baiHoc.js); trả lời sai thì được hỏi lại tới khi đúng. Xong
   hết các bước của cả 3 phần mới đạt mục tiêu ngày.

   Học xong bài thì bài tiếp theo mở ngay, muốn học trước thì học được. Nghỉ
   ngày nào thì hôm sau học tiếp bài đang dở, không bị dồn bài.

   Chỉ dùng được khi đã đăng nhập.
   ============================================================================= */

import { useEffect, useMemo, useState } from "react";

import { taiChuHan, taiLoTrinh, taiNguPhap, taiTuVung } from "../du-lieu/taiDuLieu.js";
import { CAC_PHAN, TONG_BUOC, cauHoiChoBuoc, layBai, noiDungBai } from "../luyen-tap/baiHoc.js";
import { capChuHan, capTuVung } from "../luyen-tap/capLatThe.js";
import PhienLuyenTap from "../luyen-tap/PhienLuyenTap.jsx";
import TroChoiLatThe from "../luyen-tap/TroChoiLatThe.jsx";
import { kieu } from "../luyen-tap/tienIch.js";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import { chuoiNgay, congNgay, docNgay } from "../nguoi-dung/nhatKy.js";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import MatTroi from "../thanh-phan/MatTroi.jsx";
import { NutDangNhap } from "./CaiDat.jsx";

const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function TabMucTieu({ quayLai }) {
  const nd = useNguoiDung();
  const [du, setDu] = useState(null); // dữ liệu lộ trình + nội dung
  const [loi, setLoi] = useState(false);
  const [dangLam, setDangLam] = useState(null); // mã bước đang làm

  useEffect(() => {
    let conSong = true;
    Promise.all([taiLoTrinh(), taiChuHan(), taiTuVung(), taiNguPhap()])
      .then(([loTrinh, chuHan, tuVung, nguPhap]) => {
        if (!conSong) return;
        setDu({
          loTrinh,
          chuHan: new Map(chuHan.map((c) => [c.id, c])),
          tuVung: { danhSach: tuVung.danhSach, map: new Map(tuVung.danhSach.map((t) => [t.id, t])) },
          nguPhap: new Map(nguPhap.map((d) => [d.id, d])),
        });
      })
      .catch(() => conSong && setLoi(true));
    return () => {
      conSong = false;
    };
  }, []);

  const baiSo = nd.loTrinh.bai;
  const bai = useMemo(() => (du ? layBai(du.loTrinh, baiSo) : null), [du, baiSo]);
  const noiDung = useMemo(() => (bai ? noiDungBai(bai, du) : null), [bai, du]);

  if (!nd.daDangNhap) {
    return <CanDangNhap tieuDe="Bài hôm nay" quayLai={quayLai} />;
  }

  // --- Đang làm một bước ---
  if (dangLam && noiDung) {
    const buoc = CAC_PHAN.flatMap((p) => p.buoc).find((b) => b.ma === dangLam);
    const xongBuoc = () => nd.hoanThanhBuoc(dangLam, TONG_BUOC);
    const veBai = () => setDangLam(null);
    if (buoc.laGame) {
      return (
        <TroChoiLatThe
          tieuDe={`Bài ${bai.so}: ${buoc.nhan}`}
          taoCap={() => (dangLam === "chu-lat-the" ? capChuHan(noiDung.chu) : capTuVung(noiDung.tu))}
          khoaKyLuc={dangLam === "chu-lat-the" ? "chu-han" : "tu-vung"}
          quayLai={veBai}
          khiXong={xongBuoc}
        />
      );
    }
    return (
      <PhienLuyenTap
        tieuDe={`Bài ${bai.so}: ${buoc.nhan}`}
        taoDanhSach={() => cauHoiChoBuoc(dangLam, noiDung, du)}
        quayLai={veBai}
        lamLaiKhiSai
        khiXong={xongBuoc}
      />
    );
  }

  const td = nd.tienDoHomNay;
  const homNay = chuoiNgay();
  const ngayHomNay = nd.nhatKy[homNay];
  const baiVuaXong = ngayHomNay?.baiXong?.includes(baiSo - 1) ? baiSo - 1 : null;
  const soBuocXong = nd.loTrinh.buoc.length;

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

      {baiVuaXong && (
        <div className="bg-nhan-nhat flex flex-col gap-1 rounded-[var(--bo-goc)] p-4">
          <p className="m-0 text-[length:var(--co-chu-latin)] font-bold">
            Bạn vừa học xong bài {((baiVuaXong - 1) % (du?.loTrinh.baiHoc.length || 1)) + 1}!
          </p>
          <p className="m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            Mục tiêu hôm nay đã đạt. Bài tiếp theo đã mở bên dưới: bạn có thể học
            trước, hoặc để dành cho ngày mai.
          </p>
        </div>
      )}

      {loi && (
        <p className="text-sai m-0 text-[length:var(--co-chu-latin-nho)]">
          Không tải được bài học. Hãy kiểm tra mạng rồi mở lại.
        </p>
      )}
      {!du && !loi && <p className={kieu.chuNho}>Đang tải bài học...</p>}

      {/* --- Ba phần của bài --- */}
      {noiDung &&
        CAC_PHAN.map((phan) => (
          <PhanBai
            key={phan.ma}
            phan={phan}
            bai={bai}
            noiDung={noiDung}
            buocXong={nd.loTrinh.buoc}
            batDau={setDangLam}
          />
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
        Mỗi ngày một bài: 5 chữ Hán, 10 từ vựng, 1 điểm ngữ pháp, xếp từ dễ đến
        khó. Làm đủ các bước của cả ba phần mới đạt mục tiêu ngày. Trả lời sai
        thì được hỏi lại cho tới khi đúng.
      </p>
    </section>
  );
}

/* -----------------------------------------------------------------------------
   MỘT PHẦN CỦA BÀI: xem trước nội dung, rồi các bước làm lần lượt
   ----------------------------------------------------------------------------- */
function PhanBai({ phan, bai, noiDung, buocXong, batDau }) {
  const soXong = phan.buoc.filter((b) => buocXong.includes(b.ma)).length;
  const onTap = (phan.ma === "tu" && bai.tuOnTap) || (phan.ma === "np" && bai.nguPhapOnTap);
  const tieuDe = {
    chu: `${noiDung.chu.length} chữ Hán`,
    tu: `${noiDung.tu.length} từ vựng`,
    np: "1 điểm ngữ pháp",
  }[phan.ma];

  return (
    <div className={`${kieu.khung} gap-3`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          {tieuDe}
          {onTap && (
            <span className="text-chu-mo ml-2 text-[length:var(--co-chu-latin-nho)] font-semibold">
              (ôn tập)
            </span>
          )}
        </h2>
        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold whitespace-nowrap">
          {soXong === phan.buoc.length ? "Đã xong" : `${soXong}/${phan.buoc.length} bước`}
        </span>
      </div>

      {/* Xem trước nội dung: Trung → Nhật → Việt */}
      {phan.ma === "chu" && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {noiDung.chu.map((c) => {
            const am = c.amDoc.pinyin.find((a) => a.chinh) ?? c.amDoc.pinyin[0];
            return <ChuTrung key={c.id} amTiet={[{ chu: c.gianThe, pinyin: am?.am ?? "" }]} />;
          })}
        </div>
      )}
      {phan.ma === "tu" && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {noiDung.tu.map((t) => (
            <ChuTrung key={t.id} amTiet={ghepAmTiet(t.tu, t.pinyin)} />
          ))}
        </div>
      )}
      {phan.ma === "np" && noiDung.nguPhap && (
        <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">{noiDung.nguPhap.ten}</p>
      )}

      {/* Các bước: làm lần lượt, bước sau mở khi xong bước trước */}
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {phan.buoc.map((b, i) => {
          const xong = buocXong.includes(b.ma);
          const mo = i === 0 || buocXong.includes(phan.buoc[i - 1].ma);
          return (
            <li key={b.ma}>
              <button
                type="button"
                onClick={() => batDau(b.ma)}
                disabled={!mo}
                className={`flex w-full items-center gap-3 rounded-[var(--bo-goc-nho)] border px-3 py-2.5 text-left text-[length:var(--co-chu-latin)] font-semibold transition-colors disabled:opacity-45 ${
                  xong ? "border-dung" : mo ? "border-nhan" : "border-vien"
                }`}
              >
                <BieuTuong ten={b.bieuTuong} />
                <span className="min-w-0 flex-1">{b.nhan}</span>
                <span
                  className={`text-[length:var(--co-chu-latin-nho)] font-bold whitespace-nowrap ${
                    xong ? "text-dung" : "text-chu-mo"
                  }`}
                >
                  {xong ? "✓ Xong" : mo ? "Bắt đầu" : "Chưa mở"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
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
