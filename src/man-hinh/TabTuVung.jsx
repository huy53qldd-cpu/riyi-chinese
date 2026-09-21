/* =============================================================================
   TAB C — TỪ VỰNG (GIAI ĐOẠN 4)
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách từ, lọc theo cấp HSK và theo chủ đề
     2. Chi tiết một từ: từ loại, nghĩa, câu ví dụ

   Thứ tự nội dung luôn là TRUNG → NHẬT → VIỆT. Nhãn chủ đề nằm trong dữ liệu
   (danhMucChuDe), không viết cứng ở đây.

   Luyện tập (GĐ 7): thẻ ghi nhớ, trắc nghiệm nghĩa, điền từ vào câu ví dụ.
   Luyện trên đúng những từ đang hiện theo bộ lọc.

   Chưa làm: nút loa (chưa chốt nguồn âm thanh).
   ============================================================================= */

import { useEffect, useState } from "react";

import { taiTuVung } from "../du-lieu/taiDuLieu.js";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import NutDaHoc, { DauDaHoc } from "../thanh-phan/NutDaHoc.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import KhungChonLuyenTap from "../luyen-tap/KhungChonLuyenTap.jsx";
import PhienLuyenTap from "../luyen-tap/PhienLuyenTap.jsx";
import {
  cauHoiDienTu,
  cauHoiNghiaTu,
  taoLuot,
  theGhiNhoTu,
} from "../luyen-tap/taoCauHoi.jsx";

// Ba cách luyện từ vựng
const CACH_LUYEN = [
  { ma: "the", nhan: "Thẻ ghi nhớ" },
  { ma: "trac-nghiem", nhan: "Trắc nghiệm" },
  { ma: "dien-tu", nhan: "Điền từ" },
];

const CAC_CAP = [
  { ma: 0, nhan: "Tất cả" },
  { ma: 1, nhan: "HSK 1" },
  { ma: 2, nhan: "HSK 2" },
  { ma: 3, nhan: "HSK 3" },
];

const nhanTieuDe =
  "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide";
const khungMuc =
  "border-vien bg-nen-noi flex flex-col gap-2 rounded-[var(--bo-goc)] border p-4";
const chip =
  "rounded-[var(--bo-goc-tron)] border px-3.5 py-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors";

export default function TabTuVung() {
  const [trangThai, setTrangThai] = useState("dang-tai"); // dang-tai | xong | loi
  const [du, setDu] = useState({ danhMucChuDe: {}, danhSach: [] });
  const [cap, setCap] = useState(0);
  const [chuDe, setChuDe] = useState("tat-ca");
  const [tuDangMo, setTuDangMo] = useState(null);
  const [cachLuyen, setCachLuyen] = useState(null);

  useEffect(() => {
    let conSong = true; // tránh cập nhật khi người dùng đã rời tab
    taiTuVung()
      .then((d) => {
        if (!conSong) return;
        setDu(d);
        setTrangThai("xong");
      })
      .catch(() => conSong && setTrangThai("loi"));
    return () => {
      conSong = false;
    };
  }, []);

  if (tuDangMo) {
    return (
      <ChiTietTu
        muc={tuDangMo}
        nhanChuDe={du.danhMucChuDe[tuDangMo.chuDe]}
        quayLai={() => setTuDangMo(null)}
      />
    );
  }

  // Chỉ liệt kê những chủ đề thật sự có từ, sắp theo nhãn tiếng Việt
  const cacChuDe = [...new Set(du.danhSach.map((t) => t.chuDe))].sort((a, b) =>
    (du.danhMucChuDe[a] ?? a).localeCompare(du.danhMucChuDe[b] ?? b, "vi"),
  );
  const hienThi = du.danhSach.filter(
    (t) =>
      (cap === 0 || t.capHsk === cap) &&
      (chuDe === "tat-ca" || t.chuDe === chuDe),
  );

  if (cachLuyen) {
    // Đáp án nhiễu lấy từ TOÀN BỘ danh sách, để lọc hẹp vẫn đủ 4 lựa chọn
    const tao = {
      the: (t) => theGhiNhoTu(t),
      "trac-nghiem": (t) => cauHoiNghiaTu(t, du.danhSach),
      "dien-tu": (t) => cauHoiDienTu(t, du.danhSach),
    }[cachLuyen];
    return (
      <PhienLuyenTap
        tieuDe={CACH_LUYEN.find((c) => c.ma === cachLuyen).nhan}
        taoDanhSach={() => taoLuot(hienThi, tao)}
        quayLai={() => setCachLuyen(null)}
      />
    );
  }

  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Từ vựng
      </h1>
      <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        Từ vựng HSK theo đại cương chính thức. Mỗi từ có từ Nhật tương đương và
        câu ví dụ.
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

      {/* Bộ lọc chủ đề: danh sách thả xuống vì có nhiều chủ đề */}
      <label className="mt-3 flex items-center gap-2 text-[length:var(--co-chu-latin-nho)]">
        <span className="text-chu-mo font-semibold">Chủ đề</span>
        <select
          value={chuDe}
          onChange={(e) => setChuDe(e.target.value)}
          className="border-vien bg-nen-noi rounded-[var(--bo-goc-nho)] border px-3 py-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <option value="tat-ca">Tất cả chủ đề</option>
          {cacChuDe.map((ma) => (
            <option key={ma} value={ma}>
              {du.danhMucChuDe[ma] ?? ma}
            </option>
          ))}
        </select>
      </label>

      {trangThai === "dang-tai" && (
        <p className="text-chu-mo mt-5 text-[length:var(--co-chu-latin-nho)]">
          Đang tải danh sách từ...
        </p>
      )}

      {trangThai === "loi" && (
        <p className="text-sai mt-5 text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu từ vựng. Hãy kiểm tra mạng rồi mở lại tab này.
        </p>
      )}

      {trangThai === "xong" && hienThi.length === 0 && (
        <div className="border-vien bg-nen-phu mt-4 rounded-[var(--bo-goc)] border border-dashed p-6 text-center">
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
            Chưa có từ nào ở mục này.
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
        <>
          <p className="text-chu-mo mt-4 mb-0 text-[length:var(--co-chu-latin-nho)]">
            {hienThi.length} từ
          </p>
          <ul className="m-0 mt-2 flex list-none flex-col gap-3 p-0">
            {hienThi.map((t) => (
              <li key={t.id}>
                <TheTu muc={t} moChiTiet={() => setTuDangMo(t)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   THẺ TRONG DANH SÁCH: Trung → Nhật → nghĩa Việt
   ----------------------------------------------------------------------------- */
function TheTu({ muc, moChiTiet }) {
  return (
    <button
      type="button"
      onClick={moChiTiet}
      className="border-vien bg-nen-noi active:bg-nhan-nhat flex w-full flex-col gap-1 rounded-[var(--bo-goc)] border px-4 py-3 text-left shadow-[0_1px_3px_var(--bong)] transition-colors"
    >
      {/* TRUNG */}
      <ChuTrung amTiet={ghepAmTiet(muc.tu, muc.pinyin)} />
      {/* NHẬT: hàng riêng vì có chuỗi dài, xếp cạnh chữ Trung sẽ ngắt dòng xấu */}
      <ChuNhat noiDung={muc.nghiaNhat} />
      {/* VIỆT */}
      <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
        {muc.nghiaViet}
      </p>
      <DauDaHoc id={muc.id} />
    </button>
  );
}

/* -----------------------------------------------------------------------------
   CHI TIẾT MỘT TỪ
   ----------------------------------------------------------------------------- */
function ChiTietTu({ muc, nhanChuDe, quayLai }) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={quayLai}
          className="border-vien rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          ← Về danh sách
        </button>
      </div>
      <NutDaHoc id={muc.id} />

      {/* Từ chính, cỡ lớn. Ghi chú biến điệu của từ hiện ngay dưới chữ. */}
      <div className={khungMuc}>
        <ChuTrung
          co="the"
          amTiet={ghepAmTiet(muc.tu, muc.pinyin)}
          ghiChuBienDieu={muc.ghiChuBienDieu}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-nhan-nhat rounded-[var(--bo-goc-tron)] px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-bold">
            HSK {muc.capHsk}
          </span>
          {muc.tuLoai && (
            <span className="border-vien rounded-[var(--bo-goc-tron)] border px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-semibold">
              {muc.tuLoai}
            </span>
          )}
          {nhanChuDe && (
            <span className="border-vien rounded-[var(--bo-goc-tron)] border px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-semibold">
              {nhanChuDe}
            </span>
          )}
        </div>
      </div>

      {/* Nghĩa: Nhật → Việt */}
      <div className={khungMuc}>
        <p className={nhanTieuDe}>Nghĩa</p>
        <ChuNhat noiDung={muc.nghiaNhat} />
        <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
          {muc.nghiaViet}
        </p>
        {muc.capPhu.length > 0 && (
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            Từ này còn nghĩa khác ở HSK {muc.capPhu.join(", ")}, chưa dạy ở đây.
          </p>
        )}
      </div>

      {/* Câu ví dụ: Trung → Nhật → Việt */}
      <div className={khungMuc}>
        <p className={nhanTieuDe}>Ví dụ</p>
        {muc.viDu.length === 0 && (
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
            Chưa có câu ví dụ cho từ này.
          </p>
        )}
        {muc.viDu.map((vd) => (
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

      <MucChuaKiemTra danhSach={muc.cangKiemTra} />
    </section>
  );
}
