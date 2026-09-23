/* =============================================================================
   MỘT LƯỢT LUYỆN TẬP
   =============================================================================

   Chạy lần lượt một danh sách câu hỏi (tạo bởi taoCauHoi.jsx), mỗi câu trả lời
   xong mới sang câu sau, cuối lượt hiện kết quả.

   Mỗi câu trả lời được ghi vào nhật ký qua nd.ghiKetQua:
     - ĐÚNG/SAI đều ghi vào nhật ký; mục tiêu ngày tính theo Bài hôm nay (GĐ 10)
     - SAI thì mục đó sẽ hiện trong Review cuối tuần
   Chế độ khách vẫn luyện được nhưng không ghi gì.

   Chế độ "hỏi lại đến khi đúng" (bước của Bài hôm nay, GĐ 10): câu nào sai thì
   một câu MỚI cho cùng mục đó được thêm vào cuối lượt (câu hỏi phải có hàm
   `taoLai`). Tới cuối lượt nghĩa là mọi mục đều đã đúng, khi đó gọi `khiXong`.
   ============================================================================= */

import { useEffect, useRef, useState } from "react";

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import KhungTapViet from "../thanh-phan/KhungTapViet.jsx";
import { kieu } from "./tienIch.js";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";

/**
 * @param {string}   tieuDe      Tên lượt luyện, ví dụ "Trắc nghiệm từ vựng"
 * @param {Function} taoDanhSach Hàm tạo danh sách câu hỏi (gọi lại khi làm lượt mới)
 * @param {Function} quayLai     Thoát khỏi lượt luyện
 * @param {boolean}  lamLaiKhiSai Sai thì hỏi lại mục đó ở cuối lượt, đến khi đúng
 * @param {Function} khiXong      Gọi MỘT lần khi làm xong lượt (dùng cho bước của bài học)
 */
export default function PhienLuyenTap({
  tieuDe,
  taoDanhSach,
  quayLai,
  lamLaiKhiSai = false,
  khiXong = null,
}) {
  const nd = useNguoiDung();
  const [danhSach, setDanhSach] = useState(taoDanhSach);
  const [viTri, setViTri] = useState(0);
  const [ketQua, setKetQua] = useState([]); // true/false theo từng câu
  const daBaoXong = useRef(false);

  const cau = danhSach[viTri];
  const daTraLoi = ketQua.length > viTri;
  const xong = viTri >= danhSach.length;

  // Báo xong đúng một lần. Ở bước của bài học, nếu bài không có câu hỏi phù hợp
  // cho bước này (ví dụ điểm ngữ pháp không có cặp câu sai/đúng) thì tính là
  // xong luôn, để bài không bị kẹt mãi.
  useEffect(() => {
    const coTheBao = danhSach.length > 0 || lamLaiKhiSai;
    if (xong && coTheBao && khiXong && !daBaoXong.current) {
      daBaoXong.current = true;
      khiXong();
    }
  }, [xong, danhSach.length, khiXong, lamLaiKhiSai]);

  function traLoi(dung) {
    if (daTraLoi) return;
    if (!cau.tuGhiKetQua) nd.ghiKetQua(cau.id, dung);
    setKetQua((kq) => [...kq, dung]);
    if (!dung && lamLaiKhiSai && cau.taoLai) {
      const lai = cau.taoLai();
      if (lai) setDanhSach((ds) => [...ds, { ...lai, taoLai: cau.taoLai, laHoiLai: true }]);
    }
  }

  function lamLuotMoi() {
    setDanhSach(taoDanhSach());
    setViTri(0);
    setKetQua([]);
  }

  if (danhSach.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <ThanhDauPhien tieuDe={tieuDe} quayLai={quayLai} />
        <p className={kieu.chuNho}>
          {lamLaiKhiSai
            ? "Bài này chưa có câu hỏi phù hợp cho bước này, nên bước được tính là xong."
            : "Chưa đủ dữ liệu để tạo câu hỏi cho mục này."}
        </p>
        {lamLaiKhiSai && (
          <button type="button" onClick={quayLai} className={`${kieu.nutChinh} self-start`}>
            <BieuTuong ten="quay-lai" />
            Về bài hôm nay
          </button>
        )}
      </section>
    );
  }

  if (xong && lamLaiKhiSai) {
    const soSai = ketQua.filter((k) => !k).length;
    return (
      <section className="flex flex-col gap-4">
        <ThanhDauPhien tieuDe={tieuDe} quayLai={quayLai} />
        <div className={`${kieu.khung} items-center text-center`}>
          <p className="m-0 text-[length:var(--co-chu-latin)] font-bold">Hoàn thành bước này!</p>
          <p className={kieu.chuNho}>
            {soSai === 0
              ? "Đúng hết ngay lần đầu. Tuyệt vời!"
              : `Có ${soSai} lần trả lời sai, đã được hỏi lại cho tới khi đúng. Các mục sai cũng đã vào mục Review.`}
          </p>
        </div>
        <button type="button" onClick={quayLai} className={`${kieu.nutChinh} self-start`}>
          <BieuTuong ten="quay-lai" />
          Về bài hôm nay
        </button>
      </section>
    );
  }

  if (xong) {
    const soDung = ketQua.filter(Boolean).length;
    return (
      <section className="flex flex-col gap-4">
        <ThanhDauPhien tieuDe={tieuDe} quayLai={quayLai} />
        <div className={`${kieu.khung} items-center text-center`}>
          <p className={kieu.nhanTieuDe}>Kết quả</p>
          <p className="m-0 text-[2.5rem] leading-none font-extrabold tabular-nums">
            {soDung}/{danhSach.length}
          </p>
          <p className="m-0 text-[length:var(--co-chu-latin)]">câu trả lời đúng</p>
          <p className={kieu.chuNho}>
            {nd.daDangNhap
              ? soDung < danhSach.length
                ? "Những câu sai đã được đưa vào mục Review để luyện lại."
                : "Làm đúng hết. Tuyệt vời!"
              : "Bạn đang ở chế độ khách nên kết quả không được lưu."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={lamLuotMoi} className={kieu.nutChinh}>
            <BieuTuong ten="lam-lai" />
            Làm lượt mới
          </button>
          <button type="button" onClick={quayLai} className={kieu.nutPhu}>
            <BieuTuong ten="quay-lai" co={16} />
            Quay lại
          </button>
        </div>
      </section>
    );
  }

  const conCau = viTri + 1 < danhSach.length;

  return (
    <section className="flex flex-col gap-4">
      <ThanhDauPhien
        tieuDe={tieuDe}
        quayLai={quayLai}
        viTri={viTri}
        tong={danhSach.length}
      />

      {cau.laHoiLai && (
        <p className="text-chu-mo m-0 flex items-center gap-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold">
          <BieuTuong ten="lam-lai" co={14} />
          Hỏi lại mục bạn vừa trả lời sai
        </p>
      )}
      {/* key theo vị trí: sang câu mới thì mọi trạng thái của câu cũ bị xoá */}
      {cau.kieu === "chon" && <CauHoiChon key={viTri} cau={cau} traLoi={traLoi} />}
      {cau.kieu === "sap-xep" && <CauHoiSapXep key={viTri} cau={cau} traLoi={traLoi} />}
      {cau.kieu === "the" && <TheGhiNho key={viTri} cau={cau} traLoi={traLoi} />}
      {cau.kieu === "tap-viet" && <CauTapViet key={viTri} cau={cau} traLoi={traLoi} />}

      {daTraLoi && (
        <button
          type="button"
          onClick={() => setViTri((v) => v + 1)}
          className={`${kieu.nutChinh} self-stretch`}
        >
          {conCau ? "Câu tiếp theo" : "Xem kết quả"}
          <BieuTuong ten={conCau ? "tiep-theo" : "ket-qua"} />
        </button>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   Thanh đầu lượt: nút thoát, tên lượt, số câu và thanh tiến độ
   ----------------------------------------------------------------------------- */
function ThanhDauPhien({ tieuDe, quayLai, viTri, tong }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button type="button" onClick={quayLai} className={kieu.nutPhu}>
          <BieuTuong ten="quay-lai" co={16} />
          Thoát
        </button>
        <h1 className="m-0 min-w-0 flex-1 truncate text-[length:var(--co-chu-latin)] font-bold">
          {tieuDe}
        </h1>
        {tong > 0 && (
          <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold tabular-nums">
            {viTri + 1}/{tong}
          </span>
        )}
      </div>
      {tong > 0 && (
        <div
          className="bg-nen-phu h-1.5 w-full overflow-hidden rounded-[var(--bo-goc-tron)]"
          role="progressbar"
          aria-valuenow={viTri + 1}
          aria-valuemin={1}
          aria-valuemax={tong}
        >
          <div
            className="bg-nhan h-full rounded-[var(--bo-goc-tron)] transition-[width] duration-300"
            style={{ width: `${((viTri + 1) / tong) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

/** Dòng báo đúng/sai. Có chữ và biểu tượng, không chỉ dựa vào màu. */
function BaoKetQua({ dung, chuSai = "Chưa đúng." }) {
  return (
    <p
      role="status"
      className={`m-0 text-[length:var(--co-chu-latin)] font-bold ${dung ? "text-dung" : "text-sai"}`}
    >
      {dung ? "✓ Chính xác!" : `✗ ${chuSai}`}
    </p>
  );
}

/* -----------------------------------------------------------------------------
   CÂU HỎI CHỌN ĐÁP ÁN
   ----------------------------------------------------------------------------- */
function CauHoiChon({ cau, traLoi }) {
  const [daChon, setDaChon] = useState(null);

  function chon(khoa) {
    if (daChon !== null) return;
    setDaChon(khoa);
    traLoi(khoa === cau.dapAn);
  }

  return (
    <>
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>{cau.cauHoi}</p>
        {cau.deBai}
      </div>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {cau.luaChon.map((lc) => {
          const laDapAn = lc.khoa === cau.dapAn;
          const laChon = lc.khoa === daChon;
          let vien = "border-vien";
          if (daChon !== null && laDapAn) vien = "border-dung border-2";
          // Chọn sai: viền + dấu ✗ + rung nhẹ một lần, không chỉ dựa vào màu
          else if (laChon) vien = "border-sai border-2 rung-bao-sai";
          return (
            <li key={lc.khoa}>
              <button
                type="button"
                onClick={() => chon(lc.khoa)}
                disabled={daChon !== null}
                className={`bg-nen-noi flex w-full items-center gap-3 rounded-[var(--bo-goc)] border px-4 py-3 text-left text-[length:var(--co-chu-latin)] font-semibold ${vien}`}
              >
                <span className="min-w-0 flex-1">
                  {lc.noiDung}
                  {daChon !== null && lc.ghiChu && (
                    <span className="text-chu-mo mt-0.5 block text-[length:var(--co-chu-latin-nho)] font-normal">
                      {lc.ghiChu}
                    </span>
                  )}
                </span>
                {daChon !== null && laDapAn && (
                  <span className="text-dung font-bold" aria-label="đáp án đúng">✓</span>
                )}
                {laChon && !laDapAn && (
                  <span className="text-sai font-bold" aria-label="bạn chọn sai">✗</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {daChon !== null && (
        <div className={kieu.khung}>
          <BaoKetQua dung={daChon === cau.dapAn} />
          {cau.giaiThich}
        </div>
      )}
    </>
  );
}

/* -----------------------------------------------------------------------------
   CÂU HỎI SẮP XẾP: bấm mảnh bên dưới để đưa lên câu, bấm mảnh trên câu để bỏ
   ----------------------------------------------------------------------------- */
function CauHoiSapXep({ cau, traLoi }) {
  const [daXep, setDaXep] = useState([]); // danh sách khoa theo thứ tự đã xếp
  const [ketQua, setKetQua] = useState(null); // null | true | false

  const theoKhoa = Object.fromEntries(cau.manh.map((m) => [m.khoa, m]));
  const conLai = cau.manh.filter((m) => !daXep.includes(m.khoa));

  function kiemTra() {
    const cauXep = daXep.map((k) => theoKhoa[k].chu).join("");
    const dung = cau.cacDapAn.includes(cauXep);
    setKetQua(dung);
    traLoi(dung);
  }

  const lopManh =
    "bg-nen-noi rounded-[var(--bo-goc-nho)] border px-3 py-1 disabled:opacity-100";

  return (
    <>
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>{cau.cauHoi}</p>
        {cau.goiY}
      </div>

      {/* Dòng câu đang xếp */}
      <div
        className={`bg-nen-phu flex min-h-[4.5rem] flex-wrap items-end gap-2 rounded-[var(--bo-goc)] border-2 border-dashed p-3 ${
          ketQua === null ? "border-vien" : ketQua ? "border-dung" : "border-sai"
        }`}
        aria-label="Câu đang xếp"
      >
        {daXep.length === 0 && (
          <span className={kieu.chuNho}>Bấm các mảnh bên dưới theo đúng thứ tự.</span>
        )}
        {daXep.map((k) => (
          <button
            key={k}
            type="button"
            disabled={ketQua !== null}
            onClick={() => setDaXep((ds) => ds.filter((x) => x !== k))}
            className={`${lopManh} border-nhan`}
          >
            <ChuTrung amTiet={ghepAmTiet(theoKhoa[k].chu, theoKhoa[k].pinyin)} />
          </button>
        ))}
      </div>

      {/* Các mảnh chưa dùng */}
      {ketQua === null && (
        <div className="flex flex-wrap gap-2">
          {conLai.map((m) => (
            <button
              key={m.khoa}
              type="button"
              onClick={() => setDaXep((ds) => [...ds, m.khoa])}
              className={`${lopManh} border-vien shadow-[0_1px_3px_var(--bong)]`}
            >
              <ChuTrung amTiet={ghepAmTiet(m.chu, m.pinyin)} />
            </button>
          ))}
        </div>
      )}

      {ketQua === null && (
        <button
          type="button"
          onClick={kiemTra}
          disabled={conLai.length > 0}
          className={`${kieu.nutChinh} self-stretch`}
        >
          <BieuTuong ten="kiem-tra" />
          Kiểm tra
        </button>
      )}

      {ketQua !== null && (
        <div className={kieu.khung}>
          <BaoKetQua dung={ketQua} />
          {!ketQua && <p className={kieu.chuNho}>Câu đúng là:</p>}
          <ChuTrung amTiet={ghepAmTiet(cau.cauGoc.trung, cau.cauGoc.pinyin)} />
          {cau.giaiThich}
        </div>
      )}
    </>
  );
}

/* -----------------------------------------------------------------------------
   THẺ GHI NHỚ: lật thẻ, rồi tự đánh giá đã nhớ hay chưa
   "Đã nhớ" tính là trả lời đúng, "Chưa nhớ" tính là sai (để vào Review).
   ----------------------------------------------------------------------------- */
function TheGhiNho({ cau, traLoi }) {
  const [daLat, setDaLat] = useState(false);
  const [danhGia, setDanhGia] = useState(null);

  function chon(nho) {
    setDanhGia(nho);
    traLoi(nho);
  }

  return (
    <>
      <div className={`${kieu.khung} min-h-48 items-center justify-center text-center`}>
        {daLat ? cau.matSau : cau.matTruoc}
      </div>

      {!daLat && (
        <button
          type="button"
          onClick={() => setDaLat(true)}
          className={`${kieu.nutChinh} self-stretch`}
        >
          <BieuTuong ten="lat-the" />
          Lật thẻ
        </button>
      )}

      {daLat && danhGia === null && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => chon(false)} className={`${kieu.nutPhu} py-3`}>
            <BieuTuong ten="chua-nho" co={16} />
            Chưa nhớ
          </button>
          <button type="button" onClick={() => chon(true)} className={`${kieu.nutChinh} py-3`}>
            <BieuTuong ten="da-nho" />
            Đã nhớ
          </button>
        </div>
      )}
    </>
  );
}

/* -----------------------------------------------------------------------------
   TẬP VIẾT (dùng trong Review)
   ----------------------------------------------------------------------------- */
function CauTapViet({ cau, traLoi }) {
  const [ketQua, setKetQua] = useState(null);
  return (
    <>
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>Tập viết chữ này</p>
        {cau.deBai}
      </div>
      <KhungTapViet
        idChu={cau.id}
        chu={cau.chu}
        ngonNgu="trung"
        khiXong={(dung) => {
          if (ketQua !== null) return;
          setKetQua(dung);
          traLoi(dung);
        }}
      />
      {ketQua !== null && (
        <BaoKetQua dung={ketQua} chuSai="Viết xong nhưng còn phải nhờ gợi ý." />
      )}
    </>
  );
}
