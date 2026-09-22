/* =============================================================================
   TAB A — CHỮ HÁN (GIAI ĐOẠN 1: PHẦN TĨNH)
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách thẻ, lọc theo cấp HSK
     2. Chi tiết một chữ (bấm vào thẻ để mở)

   Thứ tự nội dung luôn là TRUNG → NHẬT → VIỆT. Mọi chữ Trung đi qua <ChuTrung>,
   mọi chữ Nhật đi qua <ChuNhat>, không viết chữ Hán trực tiếp ra màn hình.

   Chưa làm ở giai đoạn này: nút loa (chưa chốt nguồn âm thanh), lưu tiến độ
   và kết quả tập viết (GĐ 6).
   ============================================================================= */

import { useEffect, useState } from "react";

import { taiChuHan } from "../du-lieu/taiDuLieu.js";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import NutDaHoc, { DauDaHoc } from "../thanh-phan/NutDaHoc.jsx";
import KhungTapViet from "../thanh-phan/KhungTapViet.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import KhungChonLuyenTap from "../luyen-tap/KhungChonLuyenTap.jsx";
import TroChoiLatThe from "../luyen-tap/TroChoiLatThe.jsx";
import { capChuHan } from "../luyen-tap/capLatThe.js";

// Nhãn so sánh tự dạng. Nhãn do người nhập liệu quyết định, không do code đoán.
const NHAN_TU_DANG = {
  "giong-het": "Giống hệt",
  "khac-mot-chut": "Khác một chút",
  "khac-hoan-toan": "Khác hoàn toàn",
  "khong-co-trong-tieng-nhat": "Tiếng Nhật không dùng chữ này",
};

// Danh sách dài (HSK 1-3 có 655 chữ): mỗi lần chỉ vẽ một phần, bấm "Xem thêm" để hiện tiếp
const SO_THE_MOI_LAN = 60;

/** Ô thay cho chữ Nhật khi tiếng Nhật không dùng chữ này. */
function KhongCoChuNhat({ co }) {
  return (
    <span
      className={`text-chu-mo ${co === "the" ? "text-[length:2.5rem]" : "text-[length:1.75rem]"} leading-none`}
      aria-label="Tiếng Nhật không dùng chữ này"
    >
      —
    </span>
  );
}

const CAC_CAP = [
  { ma: 0, nhan: "Tất cả" },
  { ma: 1, nhan: "HSK 1" },
  { ma: 2, nhan: "HSK 2" },
  { ma: 3, nhan: "HSK 3" },
];

const nhanTieuDe =
  "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide";

/** Lấy âm chính (âm hiển thị to) trong một danh sách âm đọc. */
function amChinh(danhSach = []) {
  return danhSach.find((a) => a.chinh) ?? danhSach[0] ?? null;
}

export default function TabChuHan() {
  const [trangThai, setTrangThai] = useState("dang-tai"); // dang-tai | xong | loi
  const [danhSach, setDanhSach] = useState([]);
  const [cap, setCap] = useState(0);
  const [chuDangMo, setChuDangMo] = useState(null);
  const [soHien, setSoHien] = useState(SO_THE_MOI_LAN);
  const [dangChoi, setDangChoi] = useState(false); // trò chơi lật thẻ

  useEffect(() => {
    let conSong = true; // tránh cập nhật khi người dùng đã rời tab
    taiChuHan()
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

  if (chuDangMo) {
    return (
      <ChiTietChuHan muc={chuDangMo} quayLai={() => setChuDangMo(null)} />
    );
  }

  const hienThi = danhSach.filter((m) => cap === 0 || m.capHsk === cap);

  if (dangChoi) {
    return (
      <TroChoiLatThe
        tieuDe="Trò chơi lật thẻ"
        taoCap={() => capChuHan(hienThi)}
        khoaKyLuc="chu-han"
        quayLai={() => setDangChoi(false)}
      />
    );
  }

  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Luyện chữ Hán
      </h1>
      <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        Mỗi thẻ đặt chữ giản thể (Trung) cạnh chữ Nhật đang dùng. Bấm vào thẻ để
        xem âm đọc và ví dụ.
      </p>

      {/* Bộ lọc cấp HSK */}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Lọc theo cấp HSK">
        {CAC_CAP.map((c) => (
          <button
            key={c.ma}
            type="button"
            onClick={() => {
              setCap(c.ma);
              setSoHien(SO_THE_MOI_LAN);
            }}
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
          Đang tải danh sách chữ Hán...
        </p>
      )}

      {trangThai === "loi" && (
        <p className="text-sai mt-5 text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu chữ Hán. Hãy kiểm tra mạng rồi mở lại tab này.
        </p>
      )}

      {trangThai === "xong" && hienThi.length === 0 && (
        <div className="border-vien bg-nen-phu mt-4 rounded-[var(--bo-goc)] border border-dashed p-6 text-center">
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
            Chưa có chữ nào ở cấp này.
          </p>
        </div>
      )}

      {trangThai === "xong" && hienThi.length > 0 && (
        <KhungChonLuyenTap
          cacCach={[{ ma: "lat-the", nhan: "Trò chơi lật thẻ" }]}
          soMuc={hienThi.length}
          chon={() => setDangChoi(true)}
          ghiChu={`Mỗi ván 10 chữ (20 thẻ), lấy từ ${hienThi.length} chữ đang hiện theo bộ lọc: ghép chữ Hán với nghĩa tiếng Nhật và tiếng Việt của nó. Mục tiêu ngày chỉ tính khi học xong Bài hôm nay (bấm thanh trên cùng).`}
        />
      )}

      {trangThai === "xong" && hienThi.length > 0 && (
        <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0">
          {hienThi.slice(0, soHien).map((muc) => (
            <li key={muc.id}>
              <TheChuHan muc={muc} moChiTiet={() => setChuDangMo(muc)} />
            </li>
          ))}
        </ul>
      )}

      {trangThai === "xong" && hienThi.length > soHien && (
        <button
          type="button"
          onClick={() => setSoHien((n) => n + SO_THE_MOI_LAN)}
          className="border-vien mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten="xem-them" co={16} />
          Xem thêm ({hienThi.length - soHien} chữ nữa)
        </button>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   THẺ TRONG DANH SÁCH: chữ Trung + chữ Nhật cạnh nhau, nghĩa Việt phía dưới
   ----------------------------------------------------------------------------- */
function TheChuHan({ muc, moChiTiet }) {
  const pinyinChinh = amChinh(muc.amDoc.pinyin)?.am ?? "";

  return (
    <button
      type="button"
      onClick={moChiTiet}
      className="border-vien bg-nen-noi active:bg-nhan-nhat flex w-full flex-col items-center gap-1 rounded-[var(--bo-goc)] border px-2 py-3 text-center shadow-[0_1px_3px_var(--bong)] transition-colors"
    >
      <div className="flex items-end justify-center gap-4">
        {/* TRUNG: giản thể kèm pinyin chính */}
        <ChuTrung amTiet={[{ chu: muc.gianThe, pinyin: pinyinChinh }]} />
        {/* NHẬT (có chữ Tiếng Nhật không dùng, ví dụ 爸, 吗) */}
        {muc.tuDangNhat ? (
          <ChuNhat noiDung={muc.tuDangNhat} />
        ) : (
          <KhongCoChuNhat />
        )}
      </div>
      {/* VIỆT */}
      <span className="text-[length:var(--co-chu-latin)] font-semibold">
        {muc.nghia.viet}
      </span>
      <DauDaHoc id={muc.id} />
    </button>
  );
}

/* -----------------------------------------------------------------------------
   CHI TIẾT MỘT CHỮ
   ----------------------------------------------------------------------------- */
function ChiTietChuHan({ muc, quayLai }) {
  const { amDoc, soSanhTuDang: ss } = muc;
  const pinyinChinh = amChinh(amDoc.pinyin)?.am ?? "";
  // Tập viết chữ giản thể (Trung) hay chữ Nhật: hai bộ nét có thứ tự khác nhau
  const [boViet, setBoViet] = useState("trung");

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
      <NutDaHoc id={muc.id} />

      {/* --- Ba cột tự dạng: giản thể, chữ Nhật, phồn thể --- */}
      <div className="border-vien bg-nen-noi rounded-[var(--bo-goc)] border p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className={nhanTieuDe}>Giản thể</p>
            <ChuTrung
              co="the"
              amTiet={[{ chu: muc.gianThe, pinyin: pinyinChinh }]}
            />
          </div>
          <div>
            <p className={nhanTieuDe}>Chữ Nhật</p>
            {muc.tuDangNhat ? (
              <ChuNhat co="the" noiDung={muc.tuDangNhat} />
            ) : (
              <KhongCoChuNhat co="the" />
            )}
          </div>
          <div>
            <p className={nhanTieuDe}>Phồn thể</p>
            {/* Cột phồn thể dùng font Noto Sans SC theo quyết định đã chốt */}
            <ChuTrung co="the" amTiet={[{ chu: muc.phonThe, pinyin: "" }]} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="bg-nhan-nhat rounded-[var(--bo-goc-tron)] px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-bold">
            Trung so với Nhật: {NHAN_TU_DANG[ss.trungVsNhat]}
          </span>
          {ss.khacNetVe && (
            <span className="border-vien rounded-[var(--bo-goc-tron)] border px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-semibold">
              Cùng mã chữ nhưng nét vẽ khác
            </span>
          )}
        </div>
        {ss.ghiChu && (
          <p className="text-chu-mo mt-2 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            <VanBanPha noiDung={ss.ghiChu} />
          </p>
        )}
      </div>

      {/* --- Âm đọc: Trung → Nhật → Việt --- */}
      <div className="border-vien bg-nen-noi flex flex-col gap-4 rounded-[var(--bo-goc)] border p-4">
        <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          Âm đọc
        </h2>

        <NhomAm nhan="Pinyin (tiếng Trung)">
          {amDoc.pinyin.map((a) => (
            <div key={a.am}>
              <AmChinhPhu am={a.am} chinh={a.chinh} />
              <ViDuTrung viDu={a} />
            </div>
          ))}
        </NhomAm>

        {amDoc.amOn.length > 0 && (
          <NhomAm nhan="Âm On (tiếng Nhật)">
            {amDoc.amOn.map((a) => (
              <ViDuNhatCoAm key={a.am} a={a} />
            ))}
          </NhomAm>
        )}

        {amDoc.amKun.length > 0 && (
          <NhomAm nhan="Âm Kun (tiếng Nhật)">
            {amDoc.amKun.map((a) => (
              <ViDuNhatCoAm key={a.am} a={a} />
            ))}
          </NhomAm>
        )}

        <NhomAm nhan="Âm Hán Việt">
          <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {amDoc.amHanViet.map((a) => (
              <span
                key={a.am}
                className={
                  a.chinh
                    ? "text-[length:1.5rem] font-bold"
                    : "text-chu-mo text-[length:var(--co-chu-latin)]"
                }
              >
                {a.am}
              </span>
            ))}
          </p>
        </NhomAm>
      </div>

      {/* --- Nghĩa: Nhật → Việt.
            Nghĩa tiếng Trung có trong dữ liệu nhưng CHƯA hiện, vì chưa có pinyin
            từng chữ cho câu giải nghĩa, mà chữ Trung bắt buộc phải có ruby. --- */}
      <div className="border-vien bg-nen-noi rounded-[var(--bo-goc)] border p-4">
        <h2 className="m-0 mb-2 text-[length:var(--co-chu-latin)] font-bold">
          Nghĩa
        </h2>
        <ChuNhat noiDung={muc.nghia.nhat} />
        <p className="mt-1 mb-0 text-[length:var(--co-chu-latin)]">
          {muc.nghia.viet}
        </p>
      </div>

      {/* --- Số nét và bộ thủ (theo chữ giản thể) --- */}
      <div className="border-vien bg-nen-noi flex items-end gap-6 rounded-[var(--bo-goc)] border p-4">
        <div>
          <p className={nhanTieuDe}>Số nét</p>
          <p className="m-0 text-[length:var(--co-chu-latin)] font-bold">
            {muc.soNet}
          </p>
        </div>
        <div>
          <p className={nhanTieuDe}>Bộ thủ</p>
          <ChuTrung
            amTiet={[{ chu: muc.boThu, pinyin: muc.boThuPinyin?.[0] ?? "" }]}
          />
        </div>
      </div>

      {/* --- Tập viết: chọn chữ giản thể (Trung) hoặc chữ Nhật --- */}
      <div className="border-vien bg-nen-noi flex flex-col items-center gap-3 rounded-[var(--bo-goc)] border p-4">
        <h2 className="m-0 self-start text-[length:var(--co-chu-latin)] font-bold">
          Tập viết
        </h2>
        <div className="flex gap-2" role="group" aria-label="Chọn chữ để tập viết">
          {[
            { ma: "trung", nhan: "Giản thể (Trung)", chu: muc.gianThe },
            { ma: "nhat", nhan: "Chữ Nhật", chu: muc.tuDangNhat },
          ]
            .filter((b) => b.chu)
            .map((b) => (
            <button
              key={b.ma}
              type="button"
              onClick={() => setBoViet(b.ma)}
              aria-pressed={boViet === b.ma}
              className={`rounded-[var(--bo-goc-tron)] border px-3.5 py-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors ${
                boViet === b.ma
                  ? "border-nhan bg-nhan text-chu-tren-nhan"
                  : "border-vien bg-transparent"
              }`}
            >
              {b.nhan}
            </button>
          ))}
        </div>
        <KhungTapViet
          idChu={muc.id}
          chu={boViet === "trung" ? muc.gianThe : muc.tuDangNhat}
          ngonNgu={boViet}
        />
      </div>

      {/* --- Mục chưa được người kiểm tra, hiện ra để chủ dự án rà lại --- */}
      <MucChuaKiemTra danhSach={muc.cangKiemTra} />
    </section>
  );
}

/* -----------------------------------------------------------------------------
   Các mảnh nhỏ dùng trong trang chi tiết
   ----------------------------------------------------------------------------- */

/** Một nhóm âm đọc có tiêu đề nhỏ phía trên. */
function NhomAm({ nhan, children }) {
  return (
    <div>
      <p className={nhanTieuDe}>{nhan}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

/** Âm chính hiện to, âm phụ hiện nhỏ hơn (quyết định 4.6). */
function AmChinhPhu({ am, chinh }) {
  return (
    <p
      className={`m-0 ${
        chinh
          ? "text-[length:1.5rem] font-bold"
          : "text-chu-mo text-[length:var(--co-chu-latin)] font-semibold"
      }`}
    >
      {am}
    </p>
  );
}

/** Từ ví dụ tiếng Trung: có pinyin trên từng chữ, kèm nghĩa Việt. */
function ViDuTrung({ viDu }) {
  if (!viDu.viDuTu) return null;
  return (
    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
      <ChuTrung
        amTiet={ghepAmTiet(viDu.viDuTu, viDu.viDuPinyin)}
        ghiChuBienDieu={viDu.ghiChuBienDieu ?? null}
      />
      <span className="text-[length:var(--co-chu-latin)]">
        {viDu.viDuNghia}
      </span>
    </div>
  );
}

/** Âm On/Kun của chữ Nhật: âm (font Nhật) + từ ví dụ có furigana + nghĩa Việt. */
function ViDuNhatCoAm({ a }) {
  return (
    <div>
      <ChuNhat
        noiDung={a.am}
        co={a.chinh ? "thuong" : "nho"}
        className={a.chinh ? "font-bold" : "text-chu-mo font-semibold"}
      />
      <div className="flex flex-wrap items-baseline gap-x-3">
        <ChuNhat noiDung={a.viDuTu} />
        <span className="text-[length:var(--co-chu-latin)]">{a.viDuNghia}</span>
      </div>
    </div>
  );
}
