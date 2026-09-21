/* =============================================================================
   TAB F — NGỮ PHÁP (GIAI ĐOẠN 5)
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách điểm ngữ pháp, lọc theo cấp HSK
     2. Chi tiết một điểm: công thức, giải thích, ví dụ, ĐỐI CHIẾU TIẾNG NHẬT,
        cảnh báo lỗi

   Quy tắc dự án: luôn đối chiếu với cấu trúc tiếng Nhật. Không có cấu trúc trùng
   khít thì hiện dạng gần tương đương kèm nhãn và nói rõ chỗ lệch. Nhãn và chỗ
   lệch đều lấy từ DỮ LIỆU, không viết cứng ở đây.

   Thứ tự nội dung: TRUNG → NHẬT → VIỆT.

   Luyện tập (GĐ 7): sắp xếp trật tự từ (mảnh câu chia sẵn trong dữ liệu, trường
   tachTu) và chọn câu đúng (lấy câu sai/đúng trong phần "Lỗi hay gặp").
   ============================================================================= */

import { useEffect, useState } from "react";

import { taiNguPhap } from "../du-lieu/taiDuLieu.js";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import NutDaHoc, { DauDaHoc } from "../thanh-phan/NutDaHoc.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import KhungChonLuyenTap from "../luyen-tap/KhungChonLuyenTap.jsx";
import PhienLuyenTap from "../luyen-tap/PhienLuyenTap.jsx";
import {
  cauHoiChonCauDung,
  cauHoiSapXep,
  taoLuot,
} from "../luyen-tap/taoCauHoi.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";

const CACH_LUYEN = [
  { ma: "sap-xep", nhan: "Sắp xếp câu" },
  { ma: "chon-cau", nhan: "Chọn câu đúng" },
];

const CAC_CAP = [
  { ma: 0, nhan: "Tất cả" },
  { ma: 1, nhan: "HSK 1" },
  { ma: 2, nhan: "HSK 2" },
  { ma: 3, nhan: "HSK 3" },
];

// Nhãn cho từng loại cảnh báo lỗi (khai báo trong dữ liệu bằng mã)
const LOAI_LOI = {
  "trat-tu-tu": "Sai trật tự từ",
  "nham-voi-tieng-nhat": "Dễ nhầm với tiếng Nhật",
  "thieu-thanh-phan": "Thiếu thành phần",
  "dung-sai-tu": "Dùng sai từ",
};

const nhanTieuDe =
  "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide";
const khungMuc =
  "border-vien bg-nen-noi flex flex-col gap-2 rounded-[var(--bo-goc)] border p-4";
const chip =
  "rounded-[var(--bo-goc-tron)] border px-3.5 py-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors";

export default function TabNguPhap() {
  const [trangThai, setTrangThai] = useState("dang-tai"); // dang-tai | xong | loi
  const [danhSach, setDanhSach] = useState([]);
  const [cap, setCap] = useState(0);
  const [diemDangMo, setDiemDangMo] = useState(null);
  const [cachLuyen, setCachLuyen] = useState(null);

  useEffect(() => {
    let conSong = true; // tránh cập nhật khi người dùng đã rời tab
    taiNguPhap()
      .then((ds) => {
        if (!conSong) return;
        setDanhSach(ds);
        setTrangThai("xong");
      })
      .catch(() => conSong && setTrangThai("loi"));
    return () => {
      conSong = false;
    };
  }, []);

  if (diemDangMo) {
    return (
      <ChiTietNguPhap diem={diemDangMo} quayLai={() => setDiemDangMo(null)} />
    );
  }

  const hienThi = danhSach.filter((d) => cap === 0 || d.capHsk === cap);

  if (cachLuyen) {
    // Mỗi câu ví dụ (hoặc mỗi cặp câu sai/đúng) là một câu hỏi
    const cacCau =
      cachLuyen === "sap-xep"
        ? hienThi.flatMap((d) => d.viDu.map((vd) => () => cauHoiSapXep(d, vd)))
        : hienThi.flatMap((d) =>
            d.canhBaoLoi.map((cb) => () => cauHoiChonCauDung(d, cb)),
          );
    return (
      <PhienLuyenTap
        tieuDe={CACH_LUYEN.find((c) => c.ma === cachLuyen).nhan}
        taoDanhSach={() => taoLuot(cacCau, (tao) => tao())}
        quayLai={() => setCachLuyen(null)}
      />
    );
  }

  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Ngữ pháp
      </h1>
      <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        Mỗi điểm ngữ pháp được đối chiếu với cấu trúc tiếng Nhật, kèm chỗ hai
        bên khác nhau.
      </p>

      {/* Bộ lọc cấp HSK */}
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Lọc theo cấp HSK"
      >
        {CAC_CAP.map((c) => (
          <button
            key={c.ma}
            type="button"
            onClick={() => setCap(c.ma)}
            aria-pressed={cap === c.ma}
            className={`${chip} ${
              cap === c.ma
                ? "border-nhan bg-nhan text-chu-tren-nhan"
                : "border-vien bg-transparent"
            }`}
          >
            {c.nhan}
          </button>
        ))}
      </div>

      {trangThai === "dang-tai" && (
        <p className="text-chu-mo mt-5 text-[length:var(--co-chu-latin-nho)]">
          Đang tải danh sách...
        </p>
      )}

      {trangThai === "loi" && (
        <p className="text-sai mt-5 text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu ngữ pháp. Hãy kiểm tra mạng rồi mở lại tab
          này.
        </p>
      )}

      {trangThai === "xong" && hienThi.length === 0 && (
        <div className="border-vien bg-nen-phu mt-4 rounded-[var(--bo-goc)] border border-dashed p-6 text-center">
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
            Chưa có điểm ngữ pháp nào ở cấp này.
          </p>
        </div>
      )}

      {trangThai === "xong" && hienThi.length > 0 && (
        <KhungChonLuyenTap
          cacCach={CACH_LUYEN}
          soMuc={hienThi.length}
          chon={setCachLuyen}
        />
      )}

      {trangThai === "xong" && hienThi.length > 0 && (
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {hienThi.map((d) => (
            <li key={d.id}>
              <TheNguPhap diem={d} moChiTiet={() => setDiemDangMo(d)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   THẺ TRONG DANH SÁCH
   ----------------------------------------------------------------------------- */
function TheNguPhap({ diem, moChiTiet }) {
  return (
    <button
      type="button"
      onClick={moChiTiet}
      className="border-vien bg-nen-noi active:bg-nhan-nhat flex w-full flex-col gap-1.5 rounded-[var(--bo-goc)] border px-4 py-3 text-left shadow-[0_1px_3px_var(--bong)] transition-colors"
    >
      <span className="bg-nhan-nhat self-start rounded-[var(--bo-goc-tron)] px-2.5 py-0.5 text-[length:var(--co-chu-latin-nho)] font-bold">
        HSK {diem.capHsk}
      </span>
      <p className="m-0 text-[length:var(--co-chu-latin)] leading-snug font-bold">
        <VanBanPha noiDung={diem.ten} />
      </p>
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-snug">
        <VanBanPha noiDung={diem.congThuc} />
      </p>
      <DauDaHoc id={diem.id} />
    </button>
  );
}

/* -----------------------------------------------------------------------------
   CHI TIẾT MỘT ĐIỂM NGỮ PHÁP
   ----------------------------------------------------------------------------- */
function ChiTietNguPhap({ diem, quayLai }) {
  const dc = diem.doiChieuNhat;

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={quayLai}
          className="border-vien inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten="quay-lai" co={16} />
          Về danh sách
        </button>
      </div>
      <NutDaHoc id={diem.id} />

      {/* Tên, công thức, giải thích */}
      <div className={khungMuc}>
        <span className="bg-nhan-nhat self-start rounded-[var(--bo-goc-tron)] px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-bold">
          HSK {diem.capHsk}
        </span>
        <h1 className="m-0 text-[length:var(--co-chu-latin)] leading-snug font-bold">
          <VanBanPha noiDung={diem.ten} />
        </h1>
        <p className="bg-nen-phu m-0 rounded-[var(--bo-goc-nho)] px-3 py-2 text-[length:var(--co-chu-latin)] font-semibold">
          <VanBanPha noiDung={diem.congThuc} />
        </p>
        <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
          <VanBanPha noiDung={diem.giaiThichViet} />
        </p>
      </div>

      {/* Ví dụ: Trung → Nhật → Việt */}
      <div className={khungMuc}>
        <p className={nhanTieuDe}>Ví dụ</p>
        {diem.viDu.map((vd) => (
          <div key={vd.trung} className="flex flex-col gap-1">
            <ChuTrung
              amTiet={ghepAmTiet(vd.trung, vd.pinyin)}
              ghiChuBienDieu={vd.ghiChuBienDieu}
            />
            <ChuNhat noiDung={vd.nhat} />
            <p className="m-0 text-[length:var(--co-chu-latin)]">{vd.viet}</p>
          </div>
        ))}
      </div>

      {/* ĐỐI CHIẾU TIẾNG NHẬT: phần quan trọng nhất của tab */}
      <div className={`${khungMuc} border-nhan`}>
        <p className={nhanTieuDe}>Đối chiếu tiếng Nhật</p>
        {/* Nhãn "gần tương đương, không trùng khít" lấy từ dữ liệu */}
        {!dc.coCauTrucTrungKhit && (
          <span className="border-canh-bao text-canh-bao self-start rounded-[var(--bo-goc-tron)] border px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-bold">
            {dc.nhan}
          </span>
        )}
        <div>
          <p className={nhanTieuDe}>Cấu trúc gần nhất</p>
          <ChuNhat noiDung={dc.cauTruc} />
        </div>
        <div className="bg-nhan-nhat rounded-[var(--bo-goc-nho)] p-3">
          <p className={nhanTieuDe}>Chỗ lệch</p>
          <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
            <VanBanPha noiDung={dc.choLech} />
          </p>
        </div>
      </div>

      {/* Cảnh báo lỗi hay gặp */}
      {diem.canhBaoLoi.length > 0 && (
        <div className={khungMuc}>
          <p className={nhanTieuDe}>Lỗi hay gặp</p>
          {diem.canhBaoLoi.map((cb) => (
            <div key={cb.noiDung} className="flex flex-col gap-2">
              <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
                {LOAI_LOI[cb.loai] ?? "Lỗi hay gặp"}
              </p>
              <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
                <VanBanPha noiDung={cb.noiDung} />
              </p>
              {cb.cauSai && (
                <CauSaiDung nhan="Sai" loai="sai" cau={cb.cauSai} />
              )}
              {cb.cauDung && (
                <CauSaiDung nhan="Đúng" loai="dung" cau={cb.cauDung} />
              )}
            </div>
          ))}
        </div>
      )}

      <MucChuaKiemTra danhSach={diem.cangKiemTra} />
    </section>
  );
}

/** Một câu sai hoặc đúng. Nhãn bằng CHỮ (không chỉ màu) để ai cũng phân biệt được. */
function CauSaiDung({ nhan, loai, cau }) {
  const mau = loai === "sai" ? "var(--sai)" : "var(--dung)";
  return (
    <div className="flex items-end gap-3">
      <span
        className="border-vien mb-2 shrink-0 rounded-[var(--bo-goc-nho)] border border-l-4 px-2 py-0.5 text-[length:var(--co-chu-latin-nho)] font-bold"
        style={{ borderLeftColor: mau }}
      >
        {loai === "sai" ? "✗" : "✓"} {nhan}
      </span>
      <ChuTrung amTiet={ghepAmTiet(cau.trung, cau.pinyin)} />
    </div>
  );
}
