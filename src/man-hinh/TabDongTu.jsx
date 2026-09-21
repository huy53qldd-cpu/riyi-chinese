/* =============================================================================
   TAB B — ĐỒNG TỰ DỊ NGHĨA (GIAI ĐOẠN 3)
   =============================================================================

   "Đồng tự dị nghĩa" = từ viết giống nhau giữa tiếng Trung và tiếng Nhật nhưng
   nghĩa khác nhau (ví dụ 手纸 là giấy vệ sinh, còn 手紙 là lá thư).

   Hai màn hình nhỏ trong một tab:
     1. Danh sách thẻ, lọc theo cấp HSK
     2. Chi tiết một cặp từ, theo đúng thứ tự TRUNG → NHẬT → VIỆT

   Lưu ý đầu tab nằm trong DỮ LIỆU (luuYDauTab), không viết cứng ở đây, để sửa
   câu chữ không phải sửa code.
   ============================================================================= */

import { useEffect, useState } from "react";

import { taiDongTuDiNghia } from "../du-lieu/taiDuLieu.js";
import { ghepFurigana } from "../du-lieu/ghepFurigana.js";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";

// Ba mức nguy hiểm. Màu lấy từ tokens.css (--nguy-hiem-*). Các màu này không đủ
// tương phản để làm chữ nhỏ, nên chỉ dùng làm chấm màu, chữ vẫn là màu chính.
const MUC_NGUY_HIEM = {
  "nghia-lech-nhe": { nhan: "Nghĩa lệch nhẹ", mau: "var(--nguy-hiem-nhe)" },
  "nghia-khac-han": { nhan: "Nghĩa khác hẳn", mau: "var(--nguy-hiem-vua)" },
  "de-hieu-lam-nghiem-trong": {
    nhan: "Dễ hiểu lầm nghiêm trọng",
    mau: "var(--nguy-hiem-nang)",
  },
};

// Bộ lọc cấp HSK. "ngoai" = từ không thuộc HSK 1–3 (capHsk là null).
const CAC_CAP = [
  { ma: "tat-ca", nhan: "Tất cả" },
  { ma: 1, nhan: "HSK 1" },
  { ma: 2, nhan: "HSK 2" },
  { ma: 3, nhan: "HSK 3" },
  { ma: "ngoai", nhan: "Ngoài HSK 1–3" },
];

const nhanTieuDe =
  "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide";
const khungMuc =
  "border-vien bg-nen-noi flex flex-col gap-2 rounded-[var(--bo-goc)] border p-4";

function khopBoLoc(muc, cap) {
  if (cap === "tat-ca") return true;
  if (cap === "ngoai") return muc.capHsk === null;
  return muc.capHsk === cap;
}

export default function TabDongTu() {
  const [trangThai, setTrangThai] = useState("dang-tai"); // dang-tai | xong | loi
  const [du, setDu] = useState({ luuYDauTab: "", danhSach: [] });
  const [cap, setCap] = useState("tat-ca");
  const [cangMo, setCangMo] = useState(null);

  useEffect(() => {
    let conSong = true; // tránh cập nhật khi người dùng đã rời tab
    taiDongTuDiNghia()
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

  if (cangMo) {
    return <ChiTietDongTu muc={cangMo} quayLai={() => setCangMo(null)} />;
  }

  const hienThi = du.danhSach.filter((m) => khopBoLoc(m, cap));

  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Đồng tự dị nghĩa
      </h1>

      {du.luuYDauTab && (
        <p className="bg-nhan-nhat mt-2 mb-0 rounded-[var(--bo-goc)] p-3 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          {/* Lưu ý có chữ Hán xen giữa câu Việt nên đi qua VanBanPha */}
          <VanBanPha noiDung={du.luuYDauTab} />
        </p>
      )}

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
            className={`rounded-[var(--bo-goc-tron)] border px-3.5 py-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors ${
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
          Đang tải danh sách từ...
        </p>
      )}

      {trangThai === "loi" && (
        <p className="text-sai mt-5 text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu đồng tự dị nghĩa. Hãy kiểm tra mạng rồi mở lại
          tab này.
        </p>
      )}

      {trangThai === "xong" && hienThi.length === 0 && (
        <div className="border-vien bg-nen-phu mt-4 rounded-[var(--bo-goc)] border border-dashed p-6 text-center">
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
            Chưa có cặp từ nào ở mục này.
          </p>
        </div>
      )}

      {trangThai === "xong" && hienThi.length > 0 && (
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {hienThi.map((muc) => (
            <li key={muc.id}>
              <TheDongTu muc={muc} moChiTiet={() => setCangMo(muc)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   Mảnh nhỏ dùng chung
   ----------------------------------------------------------------------------- */

/** Nhãn mức nguy hiểm: chấm màu + chữ màu chính. */
function NhanNguyHiem({ ma }) {
  const muc = MUC_NGUY_HIEM[ma];
  if (!muc) return null;
  return (
    <span className="border-vien inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-semibold">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: muc.mau }}
      />
      {muc.nhan}
    </span>
  );
}

/** Từ tiếng Trung kèm pinyin, hoặc thông báo nếu từ không tồn tại. */
function TuTrung({ muc }) {
  if (!muc.tonTaiTrongTiengTrung || !muc.trung.pinyin) {
    return (
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] italic">
        Không có từ này trong tiếng Trung
      </p>
    );
  }
  return <ChuTrung amTiet={ghepAmTiet(muc.chuTrungGianThe, muc.trung.pinyin)} />;
}

/* -----------------------------------------------------------------------------
   THẺ TRONG DANH SÁCH: Trung → Nhật → nghĩa Việt của cả hai bên
   ----------------------------------------------------------------------------- */
function TheDongTu({ muc, moChiTiet }) {
  return (
    <button
      type="button"
      onClick={moChiTiet}
      className="border-vien bg-nen-noi active:bg-nhan-nhat flex w-full flex-col gap-2 rounded-[var(--bo-goc)] border px-4 py-3 text-left shadow-[0_1px_3px_var(--bong)] transition-colors"
    >
      <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
        {/* TRUNG */}
        <TuTrung muc={muc} />
        {/* NHẬT */}
        <ChuNhat noiDung={ghepFurigana(muc.chuNhat, muc.nhat.cachDoc)} />
      </div>

      {/* VIỆT: nghĩa hai bên */}
      <p className="m-0 text-[length:var(--co-chu-latin)] leading-snug">
        <span className="text-chu-mo">Trung: </span>
        <span className="font-semibold">{muc.trung.nghia ?? "không có"}</span>
        <span className="text-chu-mo"> · Nhật: </span>
        <span className="font-semibold">{muc.nhat.nghia}</span>
      </p>

      <div>
        <NhanNguyHiem ma={muc.mucNguyHiem} />
      </div>
    </button>
  );
}

/* -----------------------------------------------------------------------------
   CHI TIẾT MỘT CẶP TỪ
   ----------------------------------------------------------------------------- */
function ChiTietDongTu({ muc, quayLai }) {
  const { trung, nhat, viet } = muc;
  const viDuTrung = trung.viDu;

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

      <div className="flex flex-wrap items-center gap-2">
        <NhanNguyHiem ma={muc.mucNguyHiem} />
        <span className="border-vien rounded-[var(--bo-goc-tron)] border px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-semibold">
          {muc.capHsk ? `HSK ${muc.capHsk}` : "Ngoài HSK 1–3"}
        </span>
      </div>

      {/* --- 1. TIẾNG TRUNG --- */}
      <div className={khungMuc}>
        <p className={nhanTieuDe}>Tiếng Trung</p>
        <TuTrung muc={muc} />
        {trung.nghia && (
          <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
            {trung.nghia}
          </p>
        )}
        {viDuTrung && (
          <div className="border-vien mt-1 border-t pt-2">
            <ChuTrung
              amTiet={ghepAmTiet(viDuTrung.trung, viDuTrung.pinyin)}
              ghiChuBienDieu={viDuTrung.ghiChuBienDieu}
            />
            <p className="mt-1 mb-0 text-[length:var(--co-chu-latin)]">
              {viDuTrung.nghiaViet}
            </p>
          </div>
        )}
      </div>

      {/* --- 2. TIẾNG NHẬT --- */}
      <div className={khungMuc}>
        <p className={nhanTieuDe}>Tiếng Nhật</p>
        <ChuNhat noiDung={ghepFurigana(muc.chuNhat, nhat.cachDoc)} />
        <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
          {nhat.nghia}
        </p>
        <div className="border-vien mt-1 border-t pt-2">
          <ChuNhat noiDung={nhat.viDu.nhat} />
          <p className="mt-1 mb-0 text-[length:var(--co-chu-latin)]">
            {nhat.viDu.nghiaViet}
          </p>
        </div>
      </div>

      {/* --- 3. TIẾNG VIỆT: âm Hán Việt, giải thích, chỗ dễ nhầm --- */}
      <div className={khungMuc}>
        <p className={nhanTieuDe}>Tiếng Việt</p>
        <p className="m-0 text-[length:var(--co-chu-latin)]">
          <span className="text-chu-mo">Âm Hán Việt: </span>
          <span className="font-bold">{muc.amHanViet}</span>
        </p>
        <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
          <VanBanPha noiDung={viet.giaiThich} />
        </p>
        <div className="bg-nhan-nhat mt-1 rounded-[var(--bo-goc-nho)] p-3">
          <p className={nhanTieuDe}>Dễ nhầm</p>
          <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
            <VanBanPha noiDung={viet.choDeNham} />
          </p>
        </div>
      </div>

      <MucChuaKiemTra danhSach={muc.cangKiemTra} />
    </section>
  );
}
