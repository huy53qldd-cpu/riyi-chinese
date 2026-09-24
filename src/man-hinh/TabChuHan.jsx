/* =============================================================================
   TAB A — CHỮ HÁN (GĐ 12, quyết định 18.42 — làm mẫu để nhân rộng sang các
   tab khác ở đợt sau)
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách:
        - Ô tìm kiếm (chữ Hán / pinyin / nghĩa Việt), tìm trên TẤT CẢ các cấp.
        - 5-6 chữ Hán hôm nay: có pinyin phía trên, ĐÈN trạng thái ở mép trên ô (18.50).
        - Nhiệm vụ hôm nay: hai bước (Tập viết, Trò chơi) làm thứ tự nào cũng
          được — xong cả hai thì chữ mới tính là đã học.
        - Nút "Bắt đầu học ngay" CỐ ĐỊNH phía trên thanh tab dưới, bấm hoặc
          quẹt phải để vào thẳng bước chưa xong.
        - "Xem toàn bộ chữ Hán HSK N" của cấp đang là MỤC TIÊU hiện tại.
        - Ba nút HSK 1/2/3 ở CUỐI trang: bấm cấp khác cấp đang học sẽ hỏi lại
          rồi đổi mục tiêu — nhảy lộ trình sang bài đầu tiên của cấp đó.
     2. Chi tiết một chữ (bấm vào ô để mở):
          Khung 1: Giản thể (pinyin + nút nghe) · Kanji · Phồn thể
          Khung 2: Pinyin | Tiếng Nhật, rồi Hán Việt, nghĩa (màu cam), số nét,
                   bộ thủ kèm tên Hán Việt (màu cam)
          Khung 3: Mẹo nhớ (bản nháp, dựa vào bộ thủ — CHƯA kiểm tra)
          Khung 4: Tập viết
        Rời trang mà chữ hôm nay CHƯA xong thì hỏi lại trước khi quay lại.

   Thứ tự nội dung luôn là TRUNG → NHẬT → VIỆT. Mọi chữ Trung đi qua <ChuTrung>,
   mọi chữ Nhật đi qua <ChuNhat>, không viết chữ Hán trực tiếp ra màn hình.
   ============================================================================= */

import { useEffect, useMemo, useState } from "react";

import { tachThanh } from "../am-thanh/dauThanh.js";
import { coAmTiet, NGON_NGU, phatAm, taiDanhSachAmTiet } from "../am-thanh/phatAm.js";
import { tenBoThu } from "../du-lieu/tenBoThu.js";
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
import KhungTapViet from "../thanh-phan/KhungTapViet.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import NutDaHoc from "../thanh-phan/NutDaHoc.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import DenTrangThai from "../thanh-phan/DenTrangThai.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { NhanOnThem } from "./TabMucTieu.jsx";

// Nhãn so sánh tự dạng. Nhãn do người nhập liệu quyết định, không do code đoán.
const NHAN_TU_DANG = {
  "giong-het": "Giống hệt",
  "khac-mot-chut": "Khác một chút",
  "khac-hoan-toan": "Khác hoàn toàn",
  "khong-co-trong-tieng-nhat": "Tiếng Nhật không dùng chữ này",
};

// Danh sách dài (HSK 3 có 284 chữ): mỗi lần chỉ vẽ một phần, bấm "Xem thêm" để hiện tiếp
const SO_THE_MOI_LAN = 60;
const SO_KET_QUA_TIM_TOI_DA = 60;

const PHAN_CHU = CAC_PHAN.find((p) => p.ma === "chu");

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

const nhanTieuDe =
  "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide";

/** Lấy âm chính (âm hiển thị to) trong một danh sách âm đọc. */
function amChinh(danhSach = []) {
  return danhSach.find((a) => a.chinh) ?? danhSach[0] ?? null;
}

/** Bỏ dấu thanh khỏi một chuỗi pinyin (dùng tachThanh có sẵn), để tìm kiếm
 * không bắt gõ đúng dấu (quyết định 18.47): gõ "cong" vẫn ra "cóng". */
function boDauThanhPinyin(s) {
  return tachThanh(s).am;
}

/** Một chữ có khớp từ khoá tìm không: theo giản thể, phồn thể, pinyin (không
 * phân biệt dấu thanh) hoặc nghĩa Việt. */
function khopTimKiem(muc, tuKhoa) {
  const q = tuKhoa.trim().toLowerCase();
  if (!q) return true;
  if (muc.gianThe.includes(tuKhoa) || muc.phonThe.includes(tuKhoa)) return true;
  if (muc.nghia.viet.toLowerCase().includes(q)) return true;
  const qKhongDau = boDauThanhPinyin(q);
  return muc.amDoc.pinyin.some((a) => boDauThanhPinyin(a.am.toLowerCase()).includes(qKhongDau));
}

export default function TabChuHan() {
  const nd = useNguoiDung();
  const hienThongBao = useThongBao();
  const { du, loi, bai, noiDung } = useBaiHomNay();
  const { batDau, manHinh } = useNhiemVu(noiDung, du, bai?.so);
  const [moToanBo, setMoToanBo] = useState(false);
  const [chuDangMo, setChuDangMo] = useState(null);
  const [soHien, setSoHien] = useState(SO_THE_MOI_LAN);
  const [timKiem, setTimKiem] = useState("");
  // Đang chờ xác nhận đổi mục tiêu sang cấp này (null = không hỏi gì)
  const [capMuonDoi, setCapMuonDoi] = useState(null);

  const danhSach = useMemo(() => du?.danhSachChu ?? [], [du]);
  const tienDoCap = useMemo(() => tinhTienDoCap(danhSach, nd.daHoc), [danhSach, nd.daHoc]);

  if (manHinh) return manHinh;

  // Chữ hôm nay: chữ phải tập viết + chữ trong trò chơi (gồm chữ "ôn thêm")
  const chuHomNay = noiDung
    ? [...noiDung.chuViet, ...noiDung.chuGame.filter((c) => !noiDung.chuViet.includes(c))]
    : [];
  const chuaXongHomNay = chuHomNay.filter((c) => !nd.daHoc[c.id]);

  if (chuDangMo) {
    return (
      <ChiTietChuHan
        muc={chuDangMo}
        chuaXongHomNay={chuaXongHomNay}
        quayLai={() => setChuDangMo(null)}
      />
    );
  }

  // Cấp đang là MỤC TIÊU hiện tại (theo bài đang học trong lộ trình), không
  // còn tách riêng "cấp đang lọc xem" như trước (quyết định 18.42)
  const capHienTai = bai?.capHsk ?? 1;
  const hienThi = danhSach.filter((m) => m.capHsk === capHienTai);
  const ketQuaTim = timKiem.trim() ? danhSach.filter((m) => khopTimKiem(m, timKiem)) : null;

  // Bước "chu" chưa xong hôm nay, để nút "Bắt đầu học ngay" biết mở bước nào
  const buocKeTiep = PHAN_CHU.buoc.find((b) => !nd.loTrinh.buoc.includes(b.ma));
  const hienNutBatDau = Boolean(du && buocKeTiep && chuHomNay.length > 0);

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
      setSoHien(SO_THE_MOI_LAN);
      hienThongBao(`Đã đổi mục tiêu sang HSK ${cap}.`);
    } else {
      hienThongBao("Chưa đổi được mục tiêu. Hãy kiểm tra mạng rồi thử lại.");
    }
  }

  return (
    <section className="flex flex-col gap-5" style={hienNutBatDau ? { paddingBottom: "8.5rem" } : undefined}>
      <div>
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Luyện chữ Hán</h1>

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
            placeholder="Tìm kiếm Hán tự, Pinyin, nghĩa..."
            aria-label="Tìm kiếm chữ Hán"
            className="border-vien bg-nen-noi w-full rounded-[var(--bo-goc-tron)] border py-2.5 pr-4 pl-10 text-[length:var(--co-chu-latin)]"
          />
        </div>
      </div>

      {!du && !loi && (
        <p className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">Đang tải danh sách chữ Hán...</p>
      )}
      {loi && (
        <p className="text-sai text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu chữ Hán. Hãy kiểm tra mạng rồi mở lại tab này.
        </p>
      )}

      {/* === TÌM KIẾM ĐANG BẬT: chỉ hiện kết quả, ẩn các mục còn lại === */}
      {du && ketQuaTim && (
        <div>
          <p className="text-chu-mo m-0 mb-2 text-[length:var(--co-chu-latin-nho)]">
            {ketQuaTim.length === 0
              ? "Không tìm thấy chữ nào khớp."
              : `${ketQuaTim.length} chữ khớp với "${timKiem.trim()}"`}
          </p>
          <ul className="m-0 grid list-none grid-cols-5 gap-2 p-0">
            {ketQuaTim.slice(0, SO_KET_QUA_TIM_TOI_DA).map((muc) => (
              <li key={muc.id}>
                <OChuHan
                  muc={muc}
                  daHoc={Boolean(nd.daHoc[muc.id])}
                  gonGang
                  moChiTiet={() => setChuDangMo(muc)}
                />
              </li>
            ))}
          </ul>
          {ketQuaTim.length > SO_KET_QUA_TIM_TOI_DA && (
            <p className="text-chu-mo mt-2 mb-0 text-[length:var(--co-chu-latin-nho)]">
              Còn {ketQuaTim.length - SO_KET_QUA_TIM_TOI_DA} chữ khác, gõ thêm để thu hẹp tìm kiếm.
            </p>
          )}
        </div>
      )}

      {/* === KHÔNG TÌM KIẾM: bố cục thường === */}
      {du && !ketQuaTim && (
        <>
          {/* --- Chữ Hán hôm nay --- */}
          {chuHomNay.length > 0 && (
            <div>
              <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
                {noiDung.chu.length} chữ Hán hôm nay
              </h2>
              {/* mt/gap-y rộng hơn bình thường để chừa chỗ cho nhãn Đã học/Chưa
                  học nổi lên trên mép ô (quyết định 18.43), không bị đè lên
                  tiêu đề hay hàng ô phía trên */}
              <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-3.5 gap-y-4 p-0">
                {chuHomNay.map((muc) => (
                  <li key={muc.id} className="w-[5.25rem]">
                    <OChuHan
                      muc={muc}
                      daHoc={Boolean(nd.daHoc[muc.id])}
                      onThem={noiDung.them.has(muc.id)}
                      hienPinyin
                      moChiTiet={() => setChuDangMo(muc)}
                    />
                  </li>
                ))}
              </ul>
              <KhungNhiemVu
                maPhan="chu"
                batDau={batDau}
                sanSang={Boolean(du)}
                idsHomNay={chuHomNay.map((c) => c.id)}
              />
            </div>
          )}

          {/* --- Xem toàn bộ chữ Hán của cấp đang là mục tiêu --- */}
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
                : `Xem toàn bộ chữ Hán HSK ${capHienTai} (${hienThi.length} chữ)`}
            </button>
          )}

          {moToanBo && (
            <div>
              <p className="text-chu-mo m-0 mb-3 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
                Bấm vào một chữ để xem chi tiết.
              </p>
              <ul className="m-0 grid list-none grid-cols-5 gap-2 p-0">
                {hienThi.slice(0, soHien).map((muc) => (
                  <li key={muc.id}>
                    <OChuHan
                      muc={muc}
                      daHoc={Boolean(nd.daHoc[muc.id])}
                      gonGang
                      moChiTiet={() => setChuDangMo(muc)}
                    />
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
                  Xem thêm ({hienThi.length - soHien} chữ nữa)
                </button>
              )}
            </div>
          )}

          {/* --- Ba nút cấp HSK: đặt ở CUỐI trang (quyết định 18.42). Bấm cấp
              đang là mục tiêu thì chỉ mở/đóng "Xem toàn bộ"; bấm cấp khác thì
              hỏi lại rồi đổi mục tiêu (nhảy lộ trình sang cấp đó). --- */}
          <NutCapHsk capChon={capHienTai} chon={chonCap} tienDo={tienDoCap} donVi="chữ" />
        </>
      )}

      {hienNutBatDau && (
        <NutBatDauNgay batDau={batDau} maBuoc={buocKeTiep.ma} />
      )}

      {capMuonDoi && (
        <HopThoaiXacNhan
          tieuDe={`Đổi mục tiêu sang HSK ${capMuonDoi}?`}
          noiDung={
            <p className="m-0">
              Bài học hôm nay sẽ đổi sang chữ Hán, từ vựng và ngữ pháp của HSK {capMuonDoi}, bắt
              đầu lại từ bài đầu tiên của cấp này. Chữ đã học trước đó vẫn được giữ nguyên.
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
   bên phải, cố định phía trên thanh tab dưới. Bản trượt kiểu iPhone (18.43)
   bị chủ dự án chê xấu, bỏ đi.
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
   Ô CHỮ HÁN (quyết định 18.42, 18.50): một ngọn ĐÈN ở giữa mép trên ô cho biết
   đã học hay chưa (xem DenTrangThai.jsx), thay cho nhãn chữ Đã học/Chưa học.
   `hienPinyin` chỉ dùng cho ô cỡ lớn (chữ hôm nay); ô dày đặc (Xem toàn bộ,
   tìm kiếm) dùng `gonGang`: ô vuông gọn, không có pinyin.
   ----------------------------------------------------------------------------- */
function OChuHan({ muc, moChiTiet, daHoc = false, onThem = false, hienPinyin = false, gonGang = false }) {
  const moTa = [muc.nghia.viet, onThem && "ôn thêm", daHoc ? "đã học" : "chưa học"]
    .filter(Boolean)
    .join(", ");
  const pinyinChinh = hienPinyin ? (amChinh(muc.amDoc.pinyin)?.am ?? "") : "";
  return (
    <button
      type="button"
      onClick={moChiTiet}
      aria-label={`${muc.gianThe}: ${moTa}`}
      className={`o-hoc border-vien bg-nen-noi active:bg-nhan-nhat relative flex w-full flex-col items-center justify-center gap-0.5 rounded-[var(--bo-goc)] border shadow-[0_1px_3px_var(--bong)] transition-colors ${
        gonGang ? "aspect-square" : "px-1.5 py-2.5"
      }`}
    >
      <DenTrangThai daHoc={daHoc} />
      {hienPinyin && pinyinChinh && (
        <span className="text-nhan-chu text-[length:0.6875rem] leading-none font-bold">{pinyinChinh}</span>
      )}
      <ChuTrung amTiet={[{ chu: muc.gianThe }]} hienPinyin={false} coRieng="1.75rem" />
      {onThem && <NhanOnThem />}
    </button>
  );
}

/* -----------------------------------------------------------------------------
   NÚT NGHE PHÁT ÂM (GĐ 12): dùng lại bộ âm tiết pinyin đã có sẵn từ tab Phát
   âm (public/am-thanh/am-tiet/). Chỉ hiện khi âm tiết + thanh này CÓ file
   thật, không bao giờ để người học bấm vào một nút câm.
   ----------------------------------------------------------------------------- */
function NutNghePinyin({ pinyin, co = 32 }) {
  const hienThongBao = useThongBao();
  const { am, thanh } = tachThanh(pinyin);
  const khoa = thanh >= 1 && thanh <= 4 ? `${am}${thanh}` : null;
  const [coAm, setCoAm] = useState(() => Boolean(khoa && coAmTiet(khoa)));

  useEffect(() => {
    if (!khoa) return undefined;
    let conSong = true;
    taiDanhSachAmTiet().then(() => conSong && setCoAm(Boolean(coAmTiet(khoa))));
    return () => {
      conSong = false;
    };
  }, [khoa]);

  if (!khoa || !coAm) return null;

  async function khiBam() {
    const kq = await phatAm(khoa, NGON_NGU.AM_TIET);
    if (!kq.thanhCong && kq.thongBao) hienThongBao(kq.thongBao);
  }

  return (
    <button
      type="button"
      onClick={khiBam}
      aria-label="Nghe phát âm"
      title="Nghe phát âm"
      className="border-vien text-nhan-chu hover:bg-nhan-nhat active:bg-nhan-nhat inline-flex shrink-0 items-center justify-center rounded-full border bg-transparent transition-colors"
      style={{ width: co, height: co }}
    >
      <BieuTuong ten="nghe" co={Math.round(co * 0.5)} />
    </button>
  );
}

/* -----------------------------------------------------------------------------
   CHI TIẾT MỘT CHỮ (GĐ 12, quyết định 18.42)
     Khung 1: Giản thể (pinyin màu cam + nút nghe) · Kanji · Phồn thể
     Khung 2: Pinyin | Tiếng Nhật, rồi Hán Việt, nghĩa (cam), số nét, bộ thủ
              kèm tên Hán Việt (cam)
     Khung 3: Mẹo nhớ (bản nháp)
     Khung 4: Tập viết
   Rời trang mà chữ hôm nay CHƯA xong thì hỏi lại (canhBaoDong).
   ----------------------------------------------------------------------------- */
const kieuKhung = "border-vien bg-nen-noi rounded-[var(--bo-goc-lon)] border p-4";

function ChiTietChuHan({ muc, quayLai, chuaXongHomNay = [] }) {
  const { amDoc, soSanhTuDang: ss } = muc;
  const pinyinChinh = amChinh(amDoc.pinyin)?.am ?? "";
  // Tập viết chữ giản thể (Trung) hay chữ Nhật: hai bộ nét có thứ tự khác nhau
  const [boViet, setBoViet] = useState("trung");
  const [canhBaoDong, setCanhBaoDong] = useState(false);
  const coTiengNhat = amDoc.amOn.length > 0 || amDoc.amKun.length > 0;
  const tenBo = tenBoThu(muc.boThu);

  function yeuCauVeDanhSach() {
    if (chuaXongHomNay.length > 0) setCanhBaoDong(true);
    else quayLai();
  }

  const meoNhoCangKiemTra = tenBo
    ? [
        ...muc.cangKiemTra,
        "Tên bộ thủ và mẹo nhớ của chữ này do Claude tự soạn từ bảng bộ thủ Khang Hy, chưa có người biết tiếng Trung xác minh.",
      ]
    : muc.cangKiemTra;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={yeuCauVeDanhSach}
          className="border-vien inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten="quay-lai" co={16} />
          Về danh sách
        </button>
        <NutDaHoc id={muc.id} />
      </div>

      {/* === KHUNG 1: Giản thể · Kanji · Phồn thể === */}
      <div className={kieuKhung}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <p className={nhanTieuDe}>Giản thể</p>
          <p className={nhanTieuDe}>Kanji</p>
          <p className={nhanTieuDe}>Phồn thể</p>
        </div>
        <div className="grid grid-cols-3 items-end gap-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-nhan-chu text-[length:1.15rem] font-bold">{pinyinChinh}</span>
              <NutNghePinyin pinyin={pinyinChinh} co={26} />
            </div>
            <ChuTrung co="the" amTiet={[{ chu: muc.gianThe }]} hienPinyin={false} />
          </div>
          <div>
            {muc.tuDangNhat ? (
              <ChuNhat co="the" noiDung={muc.tuDangNhat} />
            ) : (
              <KhongCoChuNhat co="the" />
            )}
          </div>
          {/* Cột phồn thể dùng font Noto Sans SC theo quyết định đã chốt */}
          <ChuTrung co="the" amTiet={[{ chu: muc.phonThe, pinyin: "" }]} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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
          <p className="text-chu-mo mt-2 mb-0 text-center text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            <VanBanPha noiDung={ss.ghiChu} />
          </p>
        )}
      </div>

      {/* === KHUNG 2: Pinyin | Tiếng Nhật, rồi Hán Việt, nghĩa, số nét, bộ thủ === */}
      <div className={`${kieuKhung} flex flex-col gap-4`}>
        <div className="grid grid-cols-2 gap-4">
          {/* TRUNG */}
          <div className="flex min-w-0 flex-col gap-3">
            <p className={nhanTieuDe}>Pinyin</p>
            {amDoc.pinyin.map((a) => (
              <div key={a.am} className="min-w-0">
                <AmChinhPhu am={a.am} chinh={a.chinh} />
                <ViDuTrung viDu={a} />
              </div>
            ))}
          </div>
          {/* NHẬT */}
          <div className="border-vien flex min-w-0 flex-col gap-3 border-l pl-4">
            <p className={nhanTieuDe}>Tiếng Nhật</p>
            {!coTiengNhat && (
              <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
                Tiếng Nhật không dùng chữ này.
              </p>
            )}
            {amDoc.amOn.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">Âm On</p>
                {amDoc.amOn.map((a) => (
                  <ViDuNhatCoAm key={a.am} a={a} />
                ))}
              </div>
            )}
            {amDoc.amKun.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">Âm Kun</p>
                {amDoc.amKun.map((a) => (
                  <ViDuNhatCoAm key={a.am} a={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VIỆT và thông tin chung */}
        <div className="border-vien flex flex-col gap-3 border-t pt-3">
          <div>
            <p className={nhanTieuDe}>Âm Hán Việt</p>
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
          </div>
          {/* Nghĩa: Nhật → Việt. Nghĩa tiếng Việt tô màu cam (quyết định 18.42).
              Nghĩa tiếng Trung có trong dữ liệu nhưng CHƯA hiện, vì chưa có
              pinyin từng chữ cho câu giải nghĩa. */}
          <div>
            <p className={nhanTieuDe}>Nghĩa</p>
            <ChuNhat noiDung={muc.nghia.nhat} />
            <p className="text-nhan-chu mt-1 mb-0 text-[length:var(--co-chu-latin)] font-bold">
              {muc.nghia.viet}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className={nhanTieuDe}>Số nét</p>
              <p className="m-0 text-[length:var(--co-chu-latin)] font-bold">{muc.soNet}</p>
            </div>
            <div>
              <p className={nhanTieuDe}>Bộ thủ</p>
              <div className="flex items-center gap-2">
                <ChuTrung amTiet={[{ chu: muc.boThu, pinyin: muc.boThuPinyin?.[0] ?? "" }]} />
                {tenBo && (
                  <span className="text-nhan-chu text-[length:var(--co-chu-latin)] font-bold">
                    ({tenBo})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === KHUNG 3: Mẹo nhớ (GĐ 12, bản nháp — xem MucChuaKiemTra bên dưới) === */}
      {tenBo && (
        <div className={kieuKhung}>
          <p className={nhanTieuDe}>Mẹo nhớ</p>
          <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
            Chữ <VanBanPha noiDung={muc.gianThe} /> có {muc.soNet} nét, thuộc bộ{" "}
            <VanBanPha noiDung={muc.boThu} /> (<span className="text-nhan-chu font-bold">{tenBo}</span>).
            Hãy liên tưởng bộ <span className="text-nhan-chu font-bold">{tenBo}</span> với nghĩa{" "}
            <span className="text-nhan-chu font-bold">&ldquo;{muc.nghia.viet}&rdquo;</span> để nhớ chữ
            này dễ hơn.
          </p>
        </div>
      )}

      {/* === KHUNG 4: Tập viết (giản thể hoặc chữ Nhật) === */}
      <div className={`${kieuKhung} flex flex-col items-center gap-3`}>
        <h2 className="m-0 self-start text-[length:var(--co-chu-latin)] font-bold">Tập viết</h2>
        <div className="flex gap-2" role="group" aria-label="Chọn chữ để tập viết">
          {[
            { ma: "trung", nhan: "Giản thể (Trung)", chu: muc.gianThe },
            { ma: "nhat", nhan: "Kanji (Nhật)", chu: muc.tuDangNhat },
          ]
            .filter((b) => b.chu)
            .map((b) => (
              <button
                key={b.ma}
                type="button"
                onClick={() => setBoViet(b.ma)}
                aria-pressed={boViet === b.ma}
                className={`rounded-[var(--bo-goc-tron)] border px-3.5 py-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors ${
                  boViet === b.ma ? "border-nhan bg-nhan text-chu-tren-nhan" : "border-vien bg-transparent"
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
      <MucChuaKiemTra danhSach={meoNhoCangKiemTra} />

      {/* --- Cảnh báo rời trang khi chữ hôm nay chưa xong (quyết định 18.42) --- */}
      {canhBaoDong && (
        <HopThoaiXacNhan
          tieuDe="Chưa hoàn thành"
          noiDung={
            <>
              <p className="m-0 mb-2">
                Bạn chưa hoàn thành đối với chữ{" "}
                {chuaXongHomNay.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && ", "}
                    <VanBanPha noiDung={c.gianThe} />
                  </span>
                ))}
                .
              </p>
              <p className="m-0">
                Chữ Hán được tính là đã học khi bạn hoàn thành toàn bộ nhiệm vụ liên quan (
                {PHAN_CHU.buoc.map((b) => b.nhan).join(" và ")}).
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

/* -----------------------------------------------------------------------------
   Các mảnh nhỏ dùng trong trang chi tiết
   ----------------------------------------------------------------------------- */

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

/** Từ ví dụ tiếng Trung: có pinyin trên từng chữ, kèm nghĩa Việt (xuống dòng khi hẹp). */
function ViDuTrung({ viDu }) {
  if (!viDu.viDuTu) return null;
  return (
    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
      <ChuTrung
        amTiet={ghepAmTiet(viDu.viDuTu, viDu.viDuPinyin)}
        ghiChuBienDieu={viDu.ghiChuBienDieu ?? null}
      />
      <span className="text-[length:var(--co-chu-latin)] break-words">{viDu.viDuNghia}</span>
    </div>
  );
}

/** Âm On/Kun của chữ Nhật: âm (font Nhật) + từ ví dụ có furigana + nghĩa Việt. */
function ViDuNhatCoAm({ a }) {
  return (
    <div className="min-w-0">
      <ChuNhat
        noiDung={a.am}
        co={a.chinh ? "thuong" : "nho"}
        className={a.chinh ? "font-bold" : "text-chu-mo font-semibold"}
      />
      <div className="flex flex-wrap items-baseline gap-x-3">
        <ChuNhat noiDung={a.viDuTu} />
        <span className="text-[length:var(--co-chu-latin)] break-words">{a.viDuNghia}</span>
      </div>
    </div>
  );
}
