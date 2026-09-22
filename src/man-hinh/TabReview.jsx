/* =============================================================================
   TAB E — REVIEW CUỐI TUẦN (GIAI ĐOẠN 7)
   =============================================================================

   Tổng hợp một tuần học (thứ Hai → Chủ nhật), xem được bất cứ lúc nào: tuần
   đang chạy và các tuần trước (tối đa khoảng 10 tuần, vì nhật ký chỉ giữ 70
   ngày gần nhất).

     - Số chữ Hán, số từ, số phút, tỉ lệ đúng, số ngày đạt mục tiêu,
       mỗi số có so sánh với tuần trước
     - Biểu đồ cột từng ngày, tuần này so với tuần trước
     - Các mục sai nhiều nhất (gồm cả đồng tự dị nghĩa), luyện lại ngay tại đây

   Chỉ dùng được khi đã đăng nhập.
   ============================================================================= */

import { useEffect, useState } from "react";

import {
  taiChuHan,
  taiDongTuDiNghia,
  taiNguPhap,
  taiTuVung,
} from "../du-lieu/taiDuLieu.js";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import {
  SO_NGAY_GIU,
  chuoiNgay,
  congNgay,
  dauTuan,
  docNgay,
  loaiMuc,
  tongKetTuan,
} from "../nguoi-dung/nhatKy.js";
import PhienLuyenTap from "../luyen-tap/PhienLuyenTap.jsx";
import {
  cauHoiDongTu,
  cauHoiNghiaTu,
  cauHoiNguPhap,
  cauHoiTapViet,
} from "../luyen-tap/taoCauHoi.jsx";
import { kieu, tronNgauNhien } from "../luyen-tap/tienIch.js";
import BieuDoTuan from "../thanh-phan/BieuDoTuan.jsx";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { ghepFurigana } from "../du-lieu/ghepFurigana.js";
import { CanDangNhap } from "./TabMucTieu.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";

const SO_MUC_SAI_HIEN = 10;
const SO_TUAN_XEM_LAI = Math.floor(SO_NGAY_GIU / 7) - 1;

const NHAN_LOAI = {
  "chu-han": "Chữ Hán",
  tu: "Từ vựng",
  "dong-tu": "Đồng tự",
  "ngu-phap": "Ngữ pháp",
};

/** "15/9" */
function ngayNgan(chuoi) {
  const d = docNgay(chuoi);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Tải mọi dữ liệu bài học, gom thành bảng tra theo mã mục. */
function useBangMuc() {
  const [bang, setBang] = useState(null); // null = đang tải, false = lỗi
  useEffect(() => {
    let conSong = true;
    Promise.all([taiChuHan(), taiDongTuDiNghia(), taiTuVung(), taiNguPhap()])
      .then(([chuHan, dongTu, tuVung, nguPhap]) => {
        if (!conSong) return;
        const theoMa = {};
        for (const m of [...chuHan, ...dongTu.danhSach, ...tuVung.danhSach, ...nguPhap]) {
          theoMa[m.id] = m;
        }
        setBang({ theoMa, dongTu: dongTu.danhSach, tuVung: tuVung.danhSach });
      })
      .catch(() => conSong && setBang(false));
    return () => {
      conSong = false;
    };
  }, []);
  return bang;
}

/** Một câu hỏi để luyện lại một mục đã làm sai. */
function cauHoiLuyenLai(id, bang) {
  const muc = bang.theoMa[id];
  if (!muc) return null;
  switch (loaiMuc(id)) {
    case "tu":
      return cauHoiNghiaTu(muc, bang.tuVung);
    case "dong-tu":
      return cauHoiDongTu(muc, bang.dongTu);
    case "chu-han":
      return cauHoiTapViet(muc);
    case "ngu-phap":
      return tronNgauNhien(cauHoiNguPhap(muc))[0] ?? null;
    default:
      return null;
  }
}

export default function TabReview() {
  const nd = useNguoiDung();
  const bang = useBangMuc();
  const homNay = chuoiNgay();
  const tuanHienTai = dauTuan(homNay);
  const [ngayDau, setNgayDau] = useState(tuanHienTai);
  const [dangLuyen, setDangLuyen] = useState(null); // danh sách mã mục cần luyện

  if (!nd.daDangNhap) return <CanDangNhap tieuDe="Review cuối tuần" />;

  if (dangLuyen && bang) {
    return (
      <PhienLuyenTap
        tieuDe="Luyện lại mục sai"
        taoDanhSach={() =>
          dangLuyen.map((id) => cauHoiLuyenLai(id, bang)).filter(Boolean)
        }
        quayLai={() => setDangLuyen(null)}
      />
    );
  }

  const tuan = tongKetTuan(nd.nhatKy, ngayDau);
  const truoc = tongKetTuan(nd.nhatKy, congNgay(ngayDau, -7));
  const laTuanNay = ngayDau === tuanHienTai;
  const soNgayDaQua = laTuanNay
    ? Math.round((docNgay(homNay) - docNgay(ngayDau)) / 86400000) + 1
    : 7;
  const tuanCuNhat = congNgay(tuanHienTai, -7 * SO_TUAN_XEM_LAI);

  const saiHien = tuan.saiNhieuNhat.slice(0, SO_MUC_SAI_HIEN);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Review cuối tuần</h1>
        <p className={`${kieu.chuNho} mt-1`}>
          Tổng kết từ thứ Hai đến Chủ nhật, so với tuần trước.
        </p>
      </div>

      {/* --- Chọn tuần --- */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setNgayDau(congNgay(ngayDau, -7))}
          disabled={ngayDau <= tuanCuNhat}
          aria-label="Tuần trước đó"
          className={`${kieu.nutPhu} h-10 w-10 p-0 text-lg`}
        >
          <BieuTuong ten="truoc" co={20} />
        </button>
        <p className="m-0 text-center text-[length:var(--co-chu-latin)] font-bold">
          {laTuanNay ? "Tuần này" : "Tuần"} · {ngayNgan(ngayDau)} – {ngayNgan(congNgay(ngayDau, 6))}
        </p>
        <button
          type="button"
          onClick={() => setNgayDau(congNgay(ngayDau, 7))}
          disabled={laTuanNay}
          aria-label="Tuần sau đó"
          className={`${kieu.nutPhu} h-10 w-10 p-0 text-lg`}
        >
          <BieuTuong ten="sau" co={20} />
        </button>
      </div>

      {/* --- Các con số --- */}
      <div className="grid grid-cols-2 gap-2">
        <OSo nhan="Chữ Hán viết đạt" giaTri={tuan.chuHan} truoc={truoc.chuHan} />
        <OSo nhan="Từ trả lời đúng" giaTri={tuan.tu} truoc={truoc.tu} />
        <OSo nhan="Phút học" giaTri={tuan.phut} truoc={truoc.phut} />
        <OSo
          nhan="Tỉ lệ đúng"
          giaTri={tuan.tiLeDung}
          truoc={truoc.tiLeDung}
          dinhDang={(v) => (v === null ? "–" : `${Math.round(v * 100)}%`)}
          dinhDangChenh={(c) => `${Math.round(c * 100)} điểm %`}
        />
        <OSo
          nhan="Ngày đạt mục tiêu"
          giaTri={tuan.soNgayDat}
          truoc={truoc.soNgayDat}
          dinhDang={(v) => `${v}/7`}
          className="col-span-2"
        />
      </div>

      {/* --- Biểu đồ --- */}
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>
          Số từ trả lời đúng mỗi ngày
        </p>
        <BieuDoTuan
          tuanNay={tuan.cacNgay.map((d) => d.tu)}
          tuanTruoc={truoc.cacNgay.map((d) => d.tu)}
          donVi="từ"
          soNgayDaQua={soNgayDaQua}
        />
        <p className={kieu.chuNho}>
          Số từ khác nhau trả lời đúng trong ngày (Bài hôm nay và luyện tập
          tự do). Số ngày đạt mục tiêu = số ngày học xong Bài hôm nay.
        </p>
      </div>

      {/* --- Sai nhiều nhất --- */}
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>Sai nhiều nhất trong tuần</p>
        {saiHien.length === 0 ? (
          <p className={kieu.chuNho}>
            Tuần này chưa có câu nào sai. Làm phần Luyện tập ở các tab để có số
            liệu.
          </p>
        ) : (
          <>
            {bang === null && <p className={kieu.chuNho}>Đang tải...</p>}
            {bang === false && (
              <p className="text-sai m-0 text-[length:var(--co-chu-latin-nho)]">
                Không tải được dữ liệu bài học. Hãy kiểm tra mạng rồi mở lại tab này.
              </p>
            )}
            {bang && (
              <>
                <ul className="m-0 flex list-none flex-col p-0">
                  {saiHien.map(({ id, soLan }) => (
                    <li
                      key={id}
                      className="border-vien flex items-center gap-3 border-b py-2 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <TenMuc muc={bang.theoMa[id]} id={id} />
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
                          {NHAN_LOAI[loaiMuc(id)] ?? ""}
                        </p>
                        <p className="m-0 text-[length:var(--co-chu-latin-nho)] font-bold tabular-nums">
                          sai {soLan} lần
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setDangLuyen(saiHien.map((m) => m.id))}
                  className={`${kieu.nutChinh} self-stretch`}
                >
                  <BieuTuong ten="luyen-lai" />
                  Luyện lại {saiHien.length} mục này
                </button>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
   Ô một con số, kèm chênh lệch so với tuần trước
   Chênh lệch ghi bằng CHỮ và dấu +/−, không chỉ dựa vào màu.
   ----------------------------------------------------------------------------- */
function OSo({
  nhan,
  giaTri,
  truoc,
  dinhDang = (v) => `${v}`,
  dinhDangChenh = (c) => `${c}`,
  className = "",
}) {
  let chenh = null;
  if (giaTri !== null && truoc !== null) {
    const c = giaTri - truoc;
    chenh =
      c === 0
        ? "bằng tuần trước"
        : `${c > 0 ? "+" : "−"}${dinhDangChenh(Math.abs(c))} so với tuần trước`;
  }
  return (
    <div className={`${kieu.khung} gap-1 ${className}`}>
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">{nhan}</p>
      <p className="m-0 text-[1.75rem] leading-none font-extrabold tabular-nums">
        {dinhDang(giaTri)}
      </p>
      {chenh && <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">{chenh}</p>}
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Tên hiển thị của một mục (chữ Trung luôn kèm pinyin)
   ----------------------------------------------------------------------------- */
function TenMuc({ muc, id }) {
  if (!muc) {
    return <p className={kieu.chuNho}>Mục {id} không còn trong dữ liệu.</p>;
  }
  switch (loaiMuc(id)) {
    case "chu-han": {
      const p = muc.amDoc.pinyin.find((a) => a.chinh) ?? muc.amDoc.pinyin[0];
      return (
        <div className="flex items-end gap-3">
          <ChuTrung amTiet={[{ chu: muc.gianThe, pinyin: p?.am ?? "" }]} />
          <p className="m-0 mb-1.5 text-[length:var(--co-chu-latin)]">{muc.nghia.viet}</p>
        </div>
      );
    }
    case "tu":
      return (
        <div className="flex flex-wrap items-end gap-x-3">
          <ChuTrung amTiet={ghepAmTiet(muc.tu, muc.pinyin)} />
          <p className="m-0 mb-1.5 text-[length:var(--co-chu-latin)]">{muc.nghiaViet}</p>
        </div>
      );
    case "dong-tu":
      return muc.trung.pinyin ? (
        <div className="flex flex-wrap items-end gap-x-3">
          <ChuTrung amTiet={ghepAmTiet(muc.chuTrungGianThe, muc.trung.pinyin)} />
          <p className="m-0 mb-1.5 text-[length:var(--co-chu-latin)]">{muc.trung.nghia}</p>
        </div>
      ) : (
        <ChuNhat noiDung={ghepFurigana(muc.chuNhat, muc.nhat.cachDoc)} />
      );
    case "ngu-phap":
      return (
        <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold leading-snug">
          <VanBanPha noiDung={muc.ten} />
        </p>
      );
    default:
      return null;
  }
}
