/* =============================================================================
   TAB C — TỪ VỰNG
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách (GĐ 10, quyết định 18.27):
        - Trên cùng: 10 từ hôm nay (theo bài hôm nay; có thể thêm từ "ôn thêm"
          dồn từ hôm qua) và NHIỆM VỤ HÔM NAY: Thẻ ghi nhớ → Trắc nghiệm →
          Điền từ → Trò chơi lật thẻ. Cả 4 bước dùng ĐÚNG CÙNG các từ hôm nay.
        - Ba nút HSK 1 / HSK 2 / HSK 3, mỗi nút có thanh % từ đã học.
        - Nút "Xem toàn bộ từ vựng HSK N" mở danh sách đủ (có lọc chủ đề); từ
          đã học có viền nét đứt và mờ hơn.
     2. Chi tiết một từ: từ loại, nghĩa, câu ví dụ

   Thứ tự nội dung luôn là TRUNG → NHẬT → VIỆT. Nhãn chủ đề nằm trong dữ liệu
   (danhMucChuDe), không viết cứng ở đây.
   ============================================================================= */

import { useMemo, useState } from "react";

import {
  KhungNhiemVu,
  NutCapHsk,
  tinhTienDoCap,
  useBaiHomNay,
  useNhiemVu,
} from "../luyen-tap/NhiemVuHomNay.jsx";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import NutDaHoc from "../thanh-phan/NutDaHoc.jsx";
import { NhanOnThem } from "./TabMucTieu.jsx";

// Danh sách dài (HSK 3 có 500 từ): mỗi lần chỉ vẽ một phần
const SO_THE_MOI_LAN = 40;

const nhanTieuDe =
  "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide";
const khungMuc =
  "border-vien bg-nen-noi flex flex-col gap-2 rounded-[var(--bo-goc)] border p-4";

export default function TabTuVung() {
  const nd = useNguoiDung();
  const { du, loi, bai, noiDung } = useBaiHomNay();
  const { batDau, manHinh } = useNhiemVu(noiDung, du, bai?.so);
  const [capChon, setCapChon] = useState(null); // null = cấp của bài hôm nay
  const [chuDe, setChuDe] = useState("tat-ca");
  const [moToanBo, setMoToanBo] = useState(false);
  const [soHien, setSoHien] = useState(SO_THE_MOI_LAN);
  const [tuDangMo, setTuDangMo] = useState(null);

  const danhSach = useMemo(() => du?.tuVung.danhSach ?? [], [du]);
  const tienDoCap = useMemo(() => tinhTienDoCap(danhSach, nd.daHoc), [danhSach, nd.daHoc]);

  if (manHinh) return manHinh;
  if (tuDangMo) {
    return (
      <ChiTietTu
        muc={tuDangMo}
        nhanChuDe={du?.danhMucChuDe[tuDangMo.chuDe]}
        quayLai={() => setTuDangMo(null)}
      />
    );
  }

  const cap = capChon ?? noiDung?.tu[0]?.capHsk ?? 1;
  const cuaCap = danhSach.filter((t) => t.capHsk === cap);
  // Chỉ liệt kê những chủ đề thật sự có từ ở cấp này, sắp theo nhãn tiếng Việt
  const cacChuDe = [...new Set(cuaCap.map((t) => t.chuDe))].sort((a, b) =>
    (du.danhMucChuDe[a] ?? a).localeCompare(du.danhMucChuDe[b] ?? b, "vi"),
  );
  const hienThi = cuaCap.filter((t) => chuDe === "tat-ca" || t.chuDe === chuDe);

  function chonCap(c) {
    setCapChon(c);
    setChuDe("tat-ca");
    setSoHien(SO_THE_MOI_LAN);
  }

  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Từ vựng</h1>

      {!du && !loi && (
        <p className="text-chu-mo mt-5 text-[length:var(--co-chu-latin-nho)]">
          Đang tải danh sách từ...
        </p>
      )}
      {loi && (
        <p className="text-sai mt-5 text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu từ vựng. Hãy kiểm tra mạng rồi mở lại tab này.
        </p>
      )}

      {/* --- Từ vựng hôm nay --- */}
      {noiDung && noiDung.tu.length > 0 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
              {noiDung.tu.length} từ vựng hôm nay
            </h2>
            {bai && (
              <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold">
                Bài {bai.so}
              </span>
            )}
          </div>
          <ul className="m-0 mt-2 flex list-none flex-col gap-3 p-0">
            {noiDung.tu.map((t) => (
              <li key={t.id}>
                <TheTu muc={t} onThem={noiDung.them.has(t.id)} moChiTiet={() => setTuDangMo(t)} />
              </li>
            ))}
          </ul>
          <KhungNhiemVu
            maPhan="tu"
            batDau={batDau}
            sanSang={Boolean(du)}
            ghiChu="Cả 4 bước dùng đúng các từ hôm nay ở trên. Xong cả 4 mới tính là hoàn thành phần từ vựng; chưa xong thì các từ này dồn sang ngày mai."
          />
        </div>
      )}

      {/* --- Ba nút cấp HSK, mỗi nút có thanh % đã học --- */}
      {du && <NutCapHsk capChon={cap} chon={chonCap} tienDo={tienDoCap} donVi="từ" />}

      {du && cuaCap.length > 0 && (
        <button
          type="button"
          onClick={() => setMoToanBo((m) => !m)}
          aria-expanded={moToanBo}
          className="border-vien mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten={moToanBo ? "thu-gon" : "xem-them"} co={16} />
          {moToanBo
            ? `Thu gọn danh sách HSK ${cap}`
            : `Xem toàn bộ từ vựng HSK ${cap} (${cuaCap.length} từ)`}
        </button>
      )}

      {du && moToanBo && (
        <>
          {/* Lọc chủ đề: danh sách thả xuống vì có nhiều chủ đề */}
          <label className="mt-3 flex items-center gap-2 text-[length:var(--co-chu-latin-nho)]">
            <span className="text-chu-mo font-semibold">Chủ đề</span>
            <select
              value={chuDe}
              onChange={(e) => {
                setChuDe(e.target.value);
                setSoHien(SO_THE_MOI_LAN);
              }}
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
          <p className="text-chu-mo mt-3 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            {hienThi.length} từ. Từ đã học (phần từ vựng đã hoàn thành hoặc bạn tự
            đánh dấu) có viền nét đứt và mờ hơn.
          </p>
          <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
            {hienThi.slice(0, soHien).map((t) => (
              <li key={t.id}>
                <TheTu muc={t} daHoc={Boolean(nd.daHoc[t.id])} moChiTiet={() => setTuDangMo(t)} />
              </li>
            ))}
          </ul>
          {hienThi.length > soHien && (
            <button
              type="button"
              onClick={() => setSoHien((n) => n + SO_THE_MOI_LAN)}
              className="border-vien mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
            >
              <BieuTuong ten="xem-them" co={16} />
              Xem thêm ({hienThi.length - soHien} từ nữa)
            </button>
          )}
        </>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   THẺ TRONG DANH SÁCH: Trung → Nhật → nghĩa Việt
   ----------------------------------------------------------------------------- */
function TheTu({ muc, moChiTiet, daHoc = false, onThem = false }) {
  return (
    <button
      type="button"
      onClick={moChiTiet}
      className={`border-vien bg-nen-noi active:bg-nhan-nhat flex w-full flex-col gap-1 rounded-[var(--bo-goc)] border px-4 py-3 text-left transition-colors ${
        daHoc ? "border-2 border-dashed opacity-55" : "shadow-[0_1px_3px_var(--bong)]"
      }`}
    >
      {onThem && (
        <span className="self-start">
          <NhanOnThem />
        </span>
      )}
      {/* TRUNG */}
      <ChuTrung amTiet={ghepAmTiet(muc.tu, muc.pinyin)} />
      {/* NHẬT: hàng riêng vì có chuỗi dài, xếp cạnh chữ Trung sẽ ngắt dòng xấu */}
      <ChuNhat noiDung={muc.nghiaNhat} />
      {/* VIỆT */}
      <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
        {muc.nghiaViet}
      </p>
      {daHoc && <span className="sr-only">(đã học)</span>}
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
          className="border-vien inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten="quay-lai" co={16} />
          Về danh sách
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
