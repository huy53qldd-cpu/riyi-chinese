/* =============================================================================
   TAB F — NGỮ PHÁP (GĐ 12 đợt 2, quyết định 18.46 — nhân rộng khuôn mẫu tab
   Chữ Hán sang đây, xem quyết định 18.42/18.45)
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách:
        - Ô tìm kiếm (tên điểm / mẫu câu), tìm trên TẤT CẢ các cấp.
        - 3-6 điểm ngữ pháp hôm nay: ĐÈN trạng thái ở giữa mép trên ô (18.50).
        - Nhiệm vụ hôm nay: 2 bước làm thứ tự nào cũng được.
        - Nút "Bắt đầu học ngay" cố định phía trên thanh tab dưới.
        - "Xem toàn bộ ngữ pháp HSK N" của cấp đang là mục tiêu.
        - Ba nút HSK 1/2/3 ở CUỐI trang: bấm cấp khác sẽ hỏi lại rồi đổi mục
          tiêu (nhảy lộ trình sang bài đầu tiên của cấp đó).
     2. Chi tiết một điểm: công thức, giải thích, ví dụ, ĐỐI CHIẾU TIẾNG NHẬT,
        cảnh báo lỗi. Rời trang mà điểm hôm nay CHƯA xong hết thì hỏi lại trước.

   Quy tắc dự án: luôn đối chiếu với cấu trúc tiếng Nhật. Không có cấu trúc trùng
   khít thì hiện dạng gần tương đương kèm nhãn và nói rõ chỗ lệch. Nhãn và chỗ
   lệch đều lấy từ DỮ LIỆU, không viết cứng ở đây.

   Thứ tự nội dung: TRUNG → NHẬT → VIỆT.
   ============================================================================= */

import { useMemo, useState } from "react";

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
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import DenTrangThai from "../thanh-phan/DenTrangThai.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";

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
const SO_KET_QUA_TIM_TOI_DA = 60;

const PHAN_NP = CAC_PHAN.find((p) => p.ma === "np");

/** Một điểm ngữ pháp có khớp từ khoá tìm không: theo tên hoặc mẫu câu (bỏ dấu markup {ja|...}). */
function khopTimKiem(diem, tuKhoa) {
  const q = tuKhoa.trim().toLowerCase();
  if (!q) return true;
  const bo = (s) => s.replace(/\{(zh|ja)\|([^}]+)\}/g, "$2").toLowerCase();
  return bo(diem.ten).includes(q) || bo(diem.congThuc).includes(q);
}

export default function TabNguPhap() {
  const nd = useNguoiDung();
  const hienThongBao = useThongBao();
  const { du, loi, bai, noiDung } = useBaiHomNay();
  const { batDau, manHinh } = useNhiemVu(noiDung, du, bai?.so);
  const [moToanBo, setMoToanBo] = useState(false);
  const [diemDangMo, setDiemDangMo] = useState(null);
  const [timKiem, setTimKiem] = useState("");
  const [capMuonDoi, setCapMuonDoi] = useState(null);

  const danhSach = useMemo(() => du?.danhSachNguPhap ?? [], [du]);
  const tienDoCap = useMemo(() => tinhTienDoCap(danhSach, nd.daHoc), [danhSach, nd.daHoc]);

  if (manHinh) return manHinh;

  const npHomNay = noiDung?.np ?? [];
  const chuaXongHomNay = npHomNay.filter((d) => !nd.daHoc[d.id]);

  if (diemDangMo) {
    return (
      <ChiTietNguPhap
        diem={diemDangMo}
        chuaXongHomNay={chuaXongHomNay}
        quayLai={() => setDiemDangMo(null)}
      />
    );
  }

  const capHienTai = bai?.capHsk ?? 1;
  const hienThi = danhSach.filter((d) => d.capHsk === capHienTai);
  const ketQuaTim = timKiem.trim() ? danhSach.filter((d) => khopTimKiem(d, timKiem)) : null;

  const buocKeTiep = PHAN_NP.buoc.find((b) => !nd.loTrinh.buoc.includes(b.ma));
  const hienNutBatDau = Boolean(du && buocKeTiep && npHomNay.length > 0);

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
      hienThongBao(`Đã đổi mục tiêu sang HSK ${cap}.`);
    } else {
      hienThongBao("Chưa đổi được mục tiêu. Hãy kiểm tra mạng rồi thử lại.");
    }
  }

  return (
    <section className="flex flex-col gap-5" style={hienNutBatDau ? { paddingBottom: "5.5rem" } : undefined}>
      <div>
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Ngữ pháp</h1>
        <p className="text-chu-mo mt-1.5 mb-3 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          Mỗi điểm ngữ pháp được đối chiếu với cấu trúc tiếng Nhật, kèm chỗ hai
          bên khác nhau.
        </p>

        {/* --- Ô tìm kiếm (GĐ 12) --- */}
        <div className="relative">
          <BieuTuong
            ten="tim-kiem"
            co={18}
            className="text-chu-mo pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
          />
          <input
            type="search"
            value={timKiem}
            onChange={(e) => setTimKiem(e.target.value)}
            placeholder="Tìm kiếm tên điểm, mẫu câu..."
            aria-label="Tìm kiếm ngữ pháp"
            className="border-vien bg-nen-noi w-full rounded-[var(--bo-goc-tron)] border py-2.5 pr-4 pl-10 text-[length:var(--co-chu-latin)]"
          />
        </div>
      </div>

      {!du && !loi && (
        <p className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">Đang tải danh sách...</p>
      )}
      {loi && (
        <p className="text-sai text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu ngữ pháp. Hãy kiểm tra mạng rồi mở lại tab này.
        </p>
      )}

      {/* === TÌM KIẾM ĐANG BẬT === */}
      {du && ketQuaTim && (
        <div>
          <p className="text-chu-mo m-0 mb-2 text-[length:var(--co-chu-latin-nho)]">
            {ketQuaTim.length === 0
              ? "Không tìm thấy điểm nào khớp."
              : `${ketQuaTim.length} điểm khớp với "${timKiem.trim()}"`}
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {ketQuaTim.slice(0, SO_KET_QUA_TIM_TOI_DA).map((d) => (
              <li key={d.id}>
                <ONguPhap diem={d} daHoc={Boolean(nd.daHoc[d.id])} moChiTiet={() => setDiemDangMo(d)} />
              </li>
            ))}
          </ul>
          {ketQuaTim.length > SO_KET_QUA_TIM_TOI_DA && (
            <p className="text-chu-mo mt-2 mb-0 text-[length:var(--co-chu-latin-nho)]">
              Còn {ketQuaTim.length - SO_KET_QUA_TIM_TOI_DA} điểm khác, gõ thêm để thu hẹp tìm kiếm.
            </p>
          )}
        </div>
      )}

      {/* === KHÔNG TÌM KIẾM: bố cục thường === */}
      {du && !ketQuaTim && (
        <>
          {/* --- Ngữ pháp hôm nay --- */}
          {npHomNay.length > 0 && (
            <div>
              <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
                {npHomNay.length} điểm ngữ pháp hôm nay
              </h2>
              <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
                {npHomNay.map((d) => (
                  <li key={d.id}>
                    <ONguPhap
                      diem={d}
                      daHoc={Boolean(nd.daHoc[d.id])}
                      onThem={noiDung.them.has(d.id)}
                      moChiTiet={() => setDiemDangMo(d)}
                    />
                  </li>
                ))}
              </ul>
              <KhungNhiemVu
                maPhan="np"
                batDau={batDau}
                sanSang={Boolean(du)}
                idsHomNay={npHomNay.map((d) => d.id)}
              />
            </div>
          )}

          {/* --- Xem toàn bộ ngữ pháp của cấp đang là mục tiêu --- */}
          {hienThi.length > 0 && (
            <button
              type="button"
              onClick={() => setMoToanBo((m) => !m)}
              aria-expanded={moToanBo}
              className="border-vien inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
            >
              <BieuTuong ten={moToanBo ? "thu-gon" : "xem-them"} co={16} />
              {moToanBo
                ? `Thu gọn danh sách HSK ${capHienTai}`
                : `Xem toàn bộ ngữ pháp HSK ${capHienTai} (${hienThi.length} điểm)`}
            </button>
          )}

          {moToanBo && (
            <div>
              <p className="text-chu-mo m-0 mb-3 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
                Bấm vào một điểm để xem giải thích và đối chiếu tiếng Nhật.
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {hienThi.map((d) => (
                  <li key={d.id}>
                    <ONguPhap
                      diem={d}
                      daHoc={Boolean(nd.daHoc[d.id])}
                      moChiTiet={() => setDiemDangMo(d)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* --- Ba nút cấp HSK: đặt ở CUỐI trang --- */}
          <NutCapHsk capChon={capHienTai} chon={chonCap} tienDo={tienDoCap} donVi="điểm ngữ pháp" />
        </>
      )}

      {hienNutBatDau && <NutBatDauNgay batDau={batDau} maBuoc={buocKeTiep.ma} />}

      {capMuonDoi && (
        <HopThoaiXacNhan
          tieuDe={`Đổi mục tiêu sang HSK ${capMuonDoi}?`}
          noiDung={
            <p className="m-0">
              Bài học hôm nay sẽ đổi sang chữ Hán, từ vựng và ngữ pháp của HSK {capMuonDoi}, bắt
              đầu lại từ bài đầu tiên của cấp này. Điểm đã học trước đó vẫn được giữ nguyên.
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
   Ô NGỮ PHÁP (quyết định 18.42/18.46): mỗi điểm một ô kéo hết chiều ngang,
   mẫu câu ở trên và tên tiếng Việt ở dưới. ĐÈN trạng thái ở giữa mép trên ô
   cho biết đã học hay chưa (quyết định 18.50, xem DenTrangThai.jsx).
   ----------------------------------------------------------------------------- */
function ONguPhap({ diem, moChiTiet, daHoc = false, onThem = false }) {
  const moTa = [diem.ten, onThem && "ôn thêm", daHoc ? "đã học" : "chưa học"]
    .filter(Boolean)
    .join(", ");
  return (
    <button
      type="button"
      onClick={moChiTiet}
      aria-label={moTa}
      className="border-vien bg-nen-noi active:bg-nhan-nhat relative flex w-full flex-col gap-1 rounded-[var(--bo-goc)] border px-4 pt-4 pb-3 text-left shadow-[0_1px_3px_var(--bong)] transition-colors"
    >
      <DenTrangThai daHoc={daHoc} />
      <p className="m-0 text-[length:var(--co-chu-latin)] leading-snug font-bold">
        <VanBanPha noiDung={diem.congThuc} />
      </p>
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-snug">
        <VanBanPha noiDung={diem.ten} />
      </p>
    </button>
  );
}

/* -----------------------------------------------------------------------------
   CHI TIẾT MỘT ĐIỂM NGỮ PHÁP
   ----------------------------------------------------------------------------- */
function ChiTietNguPhap({ diem, quayLai, chuaXongHomNay = [] }) {
  const dc = diem.doiChieuNhat;
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

      {/* --- Cảnh báo rời trang khi điểm ngữ pháp hôm nay chưa xong --- */}
      {canhBaoDong && (
        <HopThoaiXacNhan
          tieuDe="Chưa hoàn thành"
          noiDung={
            <>
              <p className="m-0 mb-2">
                Bạn chưa hoàn thành đối với điểm{" "}
                {chuaXongHomNay.map((d, i) => (
                  <span key={d.id}>
                    {i > 0 && ", "}
                    <VanBanPha noiDung={d.ten} />
                  </span>
                ))}
                .
              </p>
              <p className="m-0">
                Điểm ngữ pháp được tính là đã học khi bạn hoàn thành toàn bộ nhiệm vụ liên quan (
                {PHAN_NP.buoc.map((b) => b.nhan).join(" và ")}).
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
