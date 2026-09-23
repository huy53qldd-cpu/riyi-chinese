/* =============================================================================
   TAB F — NGỮ PHÁP
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách (GĐ 10, quyết định 18.27):
        - Trên cùng: 3 điểm ngữ pháp hôm nay (theo bài hôm nay; có thể thêm
          điểm "ôn thêm" dồn từ hôm qua) và NHIỆM VỤ HÔM NAY: Sắp xếp câu →
          Chọn câu đúng, dùng đúng các điểm hôm nay.
        - Ba nút HSK 1 / HSK 2 / HSK 3, mỗi nút có thanh % điểm đã học.
        - Nút "Xem toàn bộ ngữ pháp HSK N" mở danh sách đủ; điểm đã học có
          viền nét đứt và mờ hơn.
     2. Chi tiết một điểm: công thức, giải thích, ví dụ, ĐỐI CHIẾU TIẾNG NHẬT,
        cảnh báo lỗi

   Quy tắc dự án: luôn đối chiếu với cấu trúc tiếng Nhật. Không có cấu trúc trùng
   khít thì hiện dạng gần tương đương kèm nhãn và nói rõ chỗ lệch. Nhãn và chỗ
   lệch đều lấy từ DỮ LIỆU, không viết cứng ở đây.

   Thứ tự nội dung: TRUNG → NHẬT → VIỆT.
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
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { NhanOnThem } from "./TabMucTieu.jsx";

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

export default function TabNguPhap() {
  const nd = useNguoiDung();
  const { du, loi, bai, noiDung } = useBaiHomNay();
  const { batDau, manHinh } = useNhiemVu(noiDung, du, bai?.so);
  const [capChon, setCapChon] = useState(null); // null = cấp của điểm đầu tiên hôm nay
  const [moToanBo, setMoToanBo] = useState(false);
  const [diemDangMo, setDiemDangMo] = useState(null);

  const danhSach = useMemo(() => du?.danhSachNguPhap ?? [], [du]);
  const tienDoCap = useMemo(() => tinhTienDoCap(danhSach, nd.daHoc), [danhSach, nd.daHoc]);

  if (manHinh) return manHinh;
  if (diemDangMo) {
    return <ChiTietNguPhap diem={diemDangMo} quayLai={() => setDiemDangMo(null)} />;
  }

  const cap = capChon ?? noiDung?.np[0]?.capHsk ?? 1;
  const hienThi = danhSach.filter((d) => d.capHsk === cap);

  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Ngữ pháp</h1>
      <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        Mỗi điểm ngữ pháp được đối chiếu với cấu trúc tiếng Nhật, kèm chỗ hai
        bên khác nhau.
      </p>

      {!du && !loi && (
        <p className="text-chu-mo mt-5 text-[length:var(--co-chu-latin-nho)]">
          Đang tải danh sách...
        </p>
      )}
      {loi && (
        <p className="text-sai mt-5 text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu ngữ pháp. Hãy kiểm tra mạng rồi mở lại tab này.
        </p>
      )}

      {/* --- Ngữ pháp hôm nay --- */}
      {noiDung && noiDung.np.length > 0 && (
        <div className="mt-4">
          <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
            {noiDung.np.length} điểm ngữ pháp hôm nay
          </h2>
          <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
            {noiDung.np.map((d) => (
              <li key={d.id}>
                <ONguPhap
                  diem={d}
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
            ghiChu="Hai bước dùng đúng các điểm ngữ pháp hôm nay ở trên. Xong cả hai mới tính là hoàn thành phần ngữ pháp; chưa xong thì các điểm này dồn sang ngày mai."
          />
        </div>
      )}

      {/* --- Ba nút cấp HSK, mỗi nút có thanh % đã học --- */}
      {du && (
        <NutCapHsk capChon={cap} chon={setCapChon} tienDo={tienDoCap} donVi="điểm ngữ pháp" />
      )}

      {du && hienThi.length > 0 && (
        <button
          type="button"
          onClick={() => setMoToanBo((m) => !m)}
          aria-expanded={moToanBo}
          className="border-vien mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten={moToanBo ? "thu-gon" : "xem-them"} co={16} />
          {moToanBo
            ? `Thu gọn danh sách HSK ${cap}`
            : `Xem toàn bộ ngữ pháp HSK ${cap} (${hienThi.length} điểm)`}
        </button>
      )}

      {du && moToanBo && (
        <>
          <p className="text-chu-mo mt-3 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            Bấm vào một điểm để xem giải thích và đối chiếu tiếng Nhật. Điểm đã
            học (phần ngữ pháp đã hoàn thành hoặc bạn tự đánh dấu) có viền nét
            đứt và mờ hơn.
          </p>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
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
        </>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   Ô NGỮ PHÁP (quyết định 18.38): mỗi điểm một ô kéo hết chiều ngang, chỉ có
   mẫu câu ở trên và phần tiếng Việt ở dưới. Bấm vào mới hiện giải thích và
   đối chiếu tiếng Nhật. Điểm đã học: viền nét đứt, mờ hơn.
   ----------------------------------------------------------------------------- */
function ONguPhap({ diem, moChiTiet, daHoc = false, onThem = false }) {
  const moTa = [diem.ten, onThem && "ôn thêm", daHoc && "đã học"].filter(Boolean).join(", ");
  return (
    <button
      type="button"
      onClick={moChiTiet}
      aria-label={moTa}
      className={`border-vien bg-nen-noi active:bg-nhan-nhat flex w-full flex-col gap-1 rounded-[var(--bo-goc)] px-4 py-3 text-left transition-colors ${
        daHoc ? "border-2 border-dashed opacity-55" : "border shadow-[0_1px_3px_var(--bong)]"
      }`}
    >
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
