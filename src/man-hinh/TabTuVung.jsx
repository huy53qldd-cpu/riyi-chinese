/* =============================================================================
   TAB C — TỪ VỰNG (GĐ 12 đợt 2, quyết định 18.46 — nhân rộng khuôn mẫu tab
   Chữ Hán sang đây, xem quyết định 18.42/18.45)
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách:
        - Ô tìm kiếm (chữ Trung / pinyin / nghĩa Việt), tìm trên TẤT CẢ các cấp.
        - 10-20 từ hôm nay: có pinyin phía trên, ĐÈN trạng thái (18.50) nổi
          ở góc ô (như chữ Hán).
        - Nhiệm vụ hôm nay: 4 bước làm thứ tự nào cũng được.
        - Nút "Bắt đầu học ngay" cố định phía trên thanh tab dưới.
        - "Xem toàn bộ từ vựng HSK N" (có lọc chủ đề) của cấp đang là mục tiêu.
        - Ba nút HSK 1/2/3 ở CUỐI trang: bấm cấp khác sẽ hỏi lại rồi đổi mục
          tiêu (nhảy lộ trình sang bài đầu tiên của cấp đó).
     2. Chi tiết một từ: từ loại, nghĩa (màu nhấn), câu ví dụ. Rời trang mà từ
        hôm nay CHƯA xong hết thì hỏi lại trước.

   Thứ tự nội dung luôn là TRUNG → NHẬT → VIỆT. Nhãn chủ đề nằm trong dữ liệu
   (danhMucChuDe), không viết cứng ở đây.
   ============================================================================= */

import { useMemo, useState } from "react";

import { tachThanh } from "../am-thanh/dauThanh.js";
import { CAC_PHAN } from "../luyen-tap/cacBuoc.js";
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
import HopThoaiXacNhan from "../thanh-phan/HopThoaiXacNhan.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import NutDaHoc from "../thanh-phan/NutDaHoc.jsx";
import NutLoa from "../thanh-phan/NutLoa.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import DenTrangThai from "../thanh-phan/DenTrangThai.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";

// Danh sách dài (HSK 3 có 500 từ): mỗi lần chỉ vẽ một phần
const SO_THE_MOI_LAN = 40;
const SO_KET_QUA_TIM_TOI_DA = 60;

const nhanTieuDe =
  "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide";
const khungMuc =
  "border-vien bg-nen-noi flex flex-col gap-2 rounded-[var(--bo-goc)] border p-4";

const PHAN_TU = CAC_PHAN.find((p) => p.ma === "tu");

/** Bỏ dấu thanh khỏi một chuỗi pinyin (dùng tachThanh có sẵn), để tìm kiếm
 * không bắt gõ đúng dấu (quyết định 18.47): gõ "cong" vẫn ra "cóng". */
function boDauThanhPinyin(s) {
  return tachThanh(s).am;
}

/** Một từ có khớp từ khoá tìm không: theo chữ Trung, pinyin (không phân biệt
 * dấu thanh) hoặc nghĩa Việt. */
function khopTimKiem(muc, tuKhoa) {
  const q = tuKhoa.trim().toLowerCase();
  if (!q) return true;
  if (muc.tu.includes(tuKhoa)) return true;
  if (muc.nghiaViet.toLowerCase().includes(q)) return true;
  const qKhongDau = boDauThanhPinyin(q);
  return muc.pinyin.some((p) => boDauThanhPinyin(p.toLowerCase()).includes(qKhongDau));
}

export default function TabTuVung() {
  const nd = useNguoiDung();
  const hienThongBao = useThongBao();
  const { du, loi, bai, noiDung } = useBaiHomNay();
  const { batDau, manHinh } = useNhiemVu(noiDung, du, bai?.so);
  const [chuDe, setChuDe] = useState("tat-ca");
  const [moToanBo, setMoToanBo] = useState(false);
  const [soHien, setSoHien] = useState(SO_THE_MOI_LAN);
  const [tuDangMo, setTuDangMo] = useState(null);
  const [timKiem, setTimKiem] = useState("");
  const [capMuonDoi, setCapMuonDoi] = useState(null);

  const danhSach = useMemo(() => du?.tuVung.danhSach ?? [], [du]);
  const tienDoCap = useMemo(() => tinhTienDoCap(danhSach, nd.daHoc), [danhSach, nd.daHoc]);

  if (manHinh) return manHinh;

  const tuHomNay = noiDung?.tu ?? [];
  const chuaXongHomNay = tuHomNay.filter((t) => !nd.daHoc[t.id]);

  if (tuDangMo) {
    return (
      <ChiTietTu
        muc={tuDangMo}
        nhanChuDe={du?.danhMucChuDe[tuDangMo.chuDe]}
        chuaXongHomNay={chuaXongHomNay}
        quayLai={() => setTuDangMo(null)}
      />
    );
  }

  const capHienTai = bai?.capHsk ?? 1;
  const cuaCap = danhSach.filter((t) => t.capHsk === capHienTai);
  // Chỉ liệt kê những chủ đề thật sự có từ ở cấp này, sắp theo nhãn tiếng Việt
  const cacChuDe = du
    ? [...new Set(cuaCap.map((t) => t.chuDe))].sort((a, b) =>
        (du.danhMucChuDe[a] ?? a).localeCompare(du.danhMucChuDe[b] ?? b, "vi"),
      )
    : [];
  const hienThi = cuaCap.filter((t) => chuDe === "tat-ca" || t.chuDe === chuDe);
  const ketQuaTim = timKiem.trim() ? danhSach.filter((t) => khopTimKiem(t, timKiem)) : null;

  const buocKeTiep = PHAN_TU.buoc.find((b) => !nd.loTrinh.buoc.includes(b.ma));
  const hienNutBatDau = Boolean(du && buocKeTiep && tuHomNay.length > 0);

  function chonCap(c) {
    if (c === capHienTai) {
      setMoToanBo((m) => !m);
      return;
    }
    if (!nd.daDangNhap) {
      hienThongBao("Đăng nhập để đổi mục tiêu trình độ.");
      return;
    }
    setCapMuonDoi(c);
  }

  function xacNhanDoiCap() {
    const cap = capMuonDoi;
    setCapMuonDoi(null);
    const ok = nd.datMucTieu(cap);
    if (ok) {
      setMoToanBo(false);
      setChuDe("tat-ca");
      setSoHien(SO_THE_MOI_LAN);
      hienThongBao(`Đã đổi mục tiêu sang HSK ${cap}.`);
    } else {
      hienThongBao("Chưa đổi được mục tiêu. Hãy kiểm tra mạng rồi thử lại.");
    }
  }

  return (
    <section className="flex flex-col gap-5" style={hienNutBatDau ? { paddingBottom: "5.5rem" } : undefined}>
      <div>
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Từ vựng</h1>

        {/* --- Ô tìm kiếm (GĐ 12) --- */}
        <div className="relative mt-3">
          <BieuTuong
            ten="tim-kiem"
            co={18}
            className="text-chu-mo pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
          />
          <input
            type="search"
            value={timKiem}
            onChange={(e) => setTimKiem(e.target.value)}
            placeholder="Tìm kiếm từ, Pinyin, nghĩa..."
            aria-label="Tìm kiếm từ vựng"
            className="border-vien bg-nen-noi w-full rounded-[var(--bo-goc-tron)] border py-2.5 pr-4 pl-10 text-[length:var(--co-chu-latin)]"
          />
        </div>
      </div>

      {!du && !loi && (
        <p className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">Đang tải danh sách từ...</p>
      )}
      {loi && (
        <p className="text-sai text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu từ vựng. Hãy kiểm tra mạng rồi mở lại tab này.
        </p>
      )}

      {/* === TÌM KIẾM ĐANG BẬT === */}
      {du && ketQuaTim && (
        <div>
          <p className="text-chu-mo m-0 mb-2 text-[length:var(--co-chu-latin-nho)]">
            {ketQuaTim.length === 0
              ? "Không tìm thấy từ nào khớp."
              : `${ketQuaTim.length} từ khớp với "${timKiem.trim()}"`}
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {ketQuaTim.slice(0, SO_KET_QUA_TIM_TOI_DA).map((t) => (
              <li key={t.id}>
                <OTu muc={t} daHoc={Boolean(nd.daHoc[t.id])} gonGang moChiTiet={() => setTuDangMo(t)} />
              </li>
            ))}
          </ul>
          {ketQuaTim.length > SO_KET_QUA_TIM_TOI_DA && (
            <p className="text-chu-mo mt-2 mb-0 text-[length:var(--co-chu-latin-nho)]">
              Còn {ketQuaTim.length - SO_KET_QUA_TIM_TOI_DA} từ khác, gõ thêm để thu hẹp tìm kiếm.
            </p>
          )}
        </div>
      )}

      {/* === KHÔNG TÌM KIẾM: bố cục thường === */}
      {du && !ketQuaTim && (
        <>
          {/* --- Từ vựng hôm nay --- */}
          {tuHomNay.length > 0 && (
            <div>
              <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
                {tuHomNay.length} từ vựng hôm nay
              </h2>
              <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-3.5 gap-y-4 p-0">
                {tuHomNay.map((t) => (
                  <li key={t.id}>
                    <OTu
                      muc={t}
                      daHoc={Boolean(nd.daHoc[t.id])}
                      onThem={noiDung.them.has(t.id)}
                      hienPinyin
                      moChiTiet={() => setTuDangMo(t)}
                    />
                  </li>
                ))}
              </ul>
              <KhungNhiemVu
                maPhan="tu"
                batDau={batDau}
                sanSang={Boolean(du)}
                idsHomNay={tuHomNay.map((t) => t.id)}
              />
            </div>
          )}

          {/* --- Xem toàn bộ từ vựng của cấp đang là mục tiêu --- */}
          {cuaCap.length > 0 && (
            <button
              type="button"
              onClick={() => setMoToanBo((m) => !m)}
              aria-expanded={moToanBo}
              className="border-vien inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
            >
              <BieuTuong ten={moToanBo ? "thu-gon" : "xem-them"} co={16} />
              {moToanBo
                ? `Thu gọn danh sách HSK ${capHienTai}`
                : `Xem toàn bộ từ vựng HSK ${capHienTai} (${cuaCap.length} từ)`}
            </button>
          )}

          {moToanBo && (
            <div>
              {/* Lọc chủ đề: danh sách thả xuống vì có nhiều chủ đề */}
              <label className="mb-3 flex items-center gap-2 text-[length:var(--co-chu-latin-nho)]">
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
              <p className="text-chu-mo m-0 mb-3 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
                {hienThi.length} từ. Bấm vào một từ để xem chi tiết.
              </p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {hienThi.slice(0, soHien).map((t) => (
                  <li key={t.id}>
                    <OTu muc={t} daHoc={Boolean(nd.daHoc[t.id])} gonGang moChiTiet={() => setTuDangMo(t)} />
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
            </div>
          )}

          {/* --- Ba nút cấp HSK: đặt ở CUỐI trang --- */}
          <NutCapHsk capChon={capHienTai} chon={chonCap} tienDo={tienDoCap} donVi="từ" />
        </>
      )}

      {hienNutBatDau && <NutBatDauNgay batDau={batDau} maBuoc={buocKeTiep.ma} />}

      {capMuonDoi && (
        <HopThoaiXacNhan
          tieuDe={`Đổi mục tiêu sang HSK ${capMuonDoi}?`}
          noiDung={
            <p className="m-0">
              Bài học hôm nay sẽ đổi sang chữ Hán, từ vựng và ngữ pháp của HSK {capMuonDoi}, bắt
              đầu lại từ bài đầu tiên của cấp này. Từ đã học trước đó vẫn được giữ nguyên.
            </p>
          }
          nutXacNhan="Đổi mục tiêu"
          nutHuy="Thôi"
          khiXacNhan={xacNhanDoiCap}
          khiHuy={() => setCapMuonDoi(null)}
        />
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   NÚT "BẮT ĐẦU HỌC NGAY" (quyết định 18.45): nút bấm bình thường, lệch về
   bên phải, cố định phía trên thanh tab dưới.
   ----------------------------------------------------------------------------- */
function NutBatDauNgay({ batDau, maBuoc }) {
  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-end px-4"
      style={{ bottom: "calc(var(--cao-thanh-duoi) + env(safe-area-inset-bottom) + 0.625rem)" }}
    >
      <button
        type="button"
        onClick={() => batDau(maBuoc)}
        className="border-nhan bg-nhan text-chu-tren-nhan inline-flex items-center gap-2 rounded-[var(--bo-goc-tron)] border py-3 pr-4 pl-5 text-[length:var(--co-chu-latin)] font-bold shadow-[0_4px_16px_var(--bong)]"
      >
        Bắt đầu học ngay
        <BieuTuong ten="sau" co={18} />
      </button>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Ô TỪ (quyết định 18.42/18.46/18.50): ĐÈN trạng thái ở giữa mép trên ô (xem
   DenTrangThai.jsx) cho biết đã học hay chưa. `hienPinyin` dùng cho ô cỡ lớn
   (từ hôm nay); ô dày đặc (Xem toàn bộ, tìm kiếm) dùng `gonGang`, không có
   pinyin. Từ dài thì ô rộng ra, không cắt chữ.
   ----------------------------------------------------------------------------- */
function OTu({ muc, moChiTiet, daHoc = false, onThem = false, hienPinyin = false, gonGang = false }) {
  const moTa = [muc.nghiaViet, onThem && "ôn thêm", daHoc ? "đã học" : "chưa học"]
    .filter(Boolean)
    .join(", ");
  return (
    <button
      type="button"
      onClick={moChiTiet}
      aria-label={`${muc.tu}: ${moTa}`}
      className={`o-hoc border-vien bg-nen-noi active:bg-nhan-nhat relative flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-[var(--bo-goc)] border px-3 py-2.5 shadow-[0_1px_3px_var(--bong)] transition-colors`}
    >
      <DenTrangThai daHoc={daHoc} />
      {hienPinyin && (
        <span className="text-nhan-chu text-[length:0.6875rem] leading-none font-bold">
          {muc.pinyin.join(" ")}
        </span>
      )}
      <ChuTrung amTiet={[{ chu: muc.tu }]} hienPinyin={false} coRieng="1.75rem" />
    </button>
  );
}

/* -----------------------------------------------------------------------------
   CHI TIẾT MỘT TỪ
   ----------------------------------------------------------------------------- */
function ChiTietTu({ muc, nhanChuDe, quayLai, chuaXongHomNay = [] }) {
  const [canhBaoDong, setCanhBaoDong] = useState(false);

  function yeuCauVeDanhSach() {
    if (chuaXongHomNay.length > 0) setCanhBaoDong(true);
    else quayLai();
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={yeuCauVeDanhSach}
          className="border-vien inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten="quay-lai" co={16} />
          Về danh sách
        </button>
      </div>
      <NutDaHoc id={muc.id} />

      {/* Từ chính, cỡ lớn. Ghi chú biến điệu của từ hiện ngay dưới chữ.
          Nút loa chỉ hiện khi từ này có ghi âm thật (quyết định 18.37). */}
      <div className={khungMuc}>
        <div className="flex items-center justify-between gap-3">
          <ChuTrung
            co="the"
            amTiet={ghepAmTiet(muc.tu, muc.pinyin)}
            ghiChuBienDieu={muc.ghiChuBienDieu}
          />
          <NutLoa noiDung={muc.tu} anKhiChuaCoAm />
        </div>
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

      {/* Nghĩa: Nhật → Việt. Nghĩa tiếng Việt tô màu nhấn (quyết định 18.42/18.46) */}
      <div className={khungMuc}>
        <p className={nhanTieuDe}>Nghĩa</p>
        <ChuNhat noiDung={muc.nghiaNhat} />
        <p className="text-nhan-chu m-0 text-[length:var(--co-chu-latin)] font-bold">
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

      {/* --- Cảnh báo rời trang khi từ hôm nay chưa xong (quyết định 18.42/18.46) --- */}
      {canhBaoDong && (
        <HopThoaiXacNhan
          tieuDe="Chưa hoàn thành"
          noiDung={
            <>
              <p className="m-0 mb-2">
                Bạn chưa hoàn thành đối với từ{" "}
                {chuaXongHomNay.map((t, i) => (
                  <span key={t.id}>
                    {i > 0 && ", "}
                    <VanBanPha noiDung={t.tu} />
                  </span>
                ))}
                .
              </p>
              <p className="m-0">
                Từ vựng được tính là đã học khi bạn hoàn thành toàn bộ nhiệm vụ liên quan (
                {PHAN_TU.buoc.map((b) => b.nhan).join(", ")}).
              </p>
            </>
          }
          nutXacNhan="Quay lại danh sách"
          nutHuy="Ở lại học tiếp"
          khiXacNhan={() => {
            setCanhBaoDong(false);
            quayLai();
          }}
          khiHuy={() => setCanhBaoDong(false)}
        />
      )}
    </section>
  );
}
