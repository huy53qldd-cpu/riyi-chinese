/* =============================================================================
   MÀN HÌNH CÀI ĐẶT
   =============================================================================

   Gồm: tài khoản (đăng nhập / đăng xuất), bật tắt furigana, giao diện sáng/tối,
   và mục Ứng dụng (phiên bản, nút "Cập nhật nội dung").

   Chế độ khách vẫn đổi được furigana và giao diện, nhưng chỉ lưu trên máy này.
   Người đã đăng nhập thì các cài đặt này đi theo tài khoản sang máy khác.
   ============================================================================= */

import { useEffect, useState } from "react";

import { capNhatNoiDung, phienBanNoiDung } from "../du-lieu/taiDuLieu.js";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import {
  batThongBao,
  daCauHinhThongBao,
  tatThongBao,
  trinhDuyetHoTro,
} from "../thong-bao/dangKyThongBao.js";
import BieuTuong, { HoaAnhDao, LogoGoogle } from "../thanh-phan/BieuTuong.jsx";
import ChuTrung from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import { CAC_CO_CHU } from "../nguoi-dung/caiDat.js";
import ManTaiKhoanEmail, { ONhapMatKhau } from "./ManTaiKhoanEmail.jsx";
import { doiMatKhau, guiLaiEmailXacMinh } from "../firebase/taiKhoanEmail.js";

// Ba giao diện. Hình minh hoạ đi kèm để dễ nhận ra, màu thật nằm ở tokens.css.
const CAC_GIAO_DIEN = [
  { ma: "sang", nhan: "Sáng" },
  { ma: "toi", nhan: "Tối" },
  { ma: "anh-dao", nhan: "Hoa anh đào" },
];

const kieuNutVien =
  "border-vien inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold";

export default function CaiDat({ quayLai }) {
  const nd = useNguoiDung();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-5 py-6">
      <div>
        <button type="button" onClick={quayLai} className={kieuNutVien}>
          <BieuTuong ten="quay-lai" co={16} />
          Quay lại
        </button>
      </div>

      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Cài đặt
      </h1>

      {/* --- Tài khoản --- */}
      <section className="border-vien bg-nen-noi flex flex-col gap-3 rounded-[var(--bo-goc)] border p-4">
        <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          Tài khoản
        </h2>

        {nd.daDangNhap ? (
          <>
            <p className="m-0 text-[length:var(--co-chu-latin)]">
              Đang đăng nhập:{" "}
              <span className="font-bold">
                {nd.nguoi?.ten || nd.nguoi?.email}
              </span>
            </p>
            <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
              Tiến độ học và cài đặt của bạn được lưu theo tài khoản này.
            </p>
            {nd.nguoi?.phuongThuc === "password" && <MucTaiKhoanEmail nd={nd} />}
            <button
              type="button"
              onClick={nd.dangXuat}
              className={`${kieuNutVien} self-start`}
            >
              <BieuTuong ten="dang-xuat" co={16} />
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            {!nd.dangKhoiPhuc && (
              <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
                Bạn đang học ở chế độ khách, tiến độ sẽ không được lưu. Đăng nhập
                để lưu tiến độ và dùng được trên nhiều máy.
              </p>
            )}
            <NutDangNhap nd={nd} />
          </>
        )}
      </section>

      {/* --- Hiển thị --- */}
      <section className="border-vien bg-nen-noi flex flex-col gap-4 rounded-[var(--bo-goc)] border p-4">
        <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          Hiển thị
        </h2>

        <CongTat
          bieuTuong="furigana"
          nhan="Furigana"
          moTa="Chữ nhỏ ghi cách đọc phía trên chữ Hán tiếng Nhật."
          bat={nd.caiDat.furigana === "bat"}
          doi={(bat) => nd.doiCaiDat("furigana", bat ? "bat" : "tat")}
        />

        <ThanhKeoCoChu
          dangChon={nd.caiDat.coChu}
          chon={(ma) => nd.doiCaiDat("coChu", ma)}
        />

        <ChonGiaoDien
          dangChon={nd.caiDat.giaoDien}
          chon={(ma) => nd.doiCaiDat("giaoDien", ma)}
        />

        {!nd.daDangNhap && (
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
            Ở chế độ khách, cài đặt chỉ được lưu trên máy này.
          </p>
        )}
      </section>

      <MucThongBao nd={nd} />

      <MucUngDung />
    </main>
  );
}

/* -----------------------------------------------------------------------------
   THÔNG BÁO NHẮC HỌC (GĐ 11, quyết định 18.40)
   Mặc định TẮT. Bật thì trình duyệt hỏi quyền, rồi mỗi ngày nhắc 3 lần:
   7h sáng chào ngày mới, 14h và 21h báo tiến độ hôm nay.
   ----------------------------------------------------------------------------- */
function MucThongBao({ nd }) {
  const hienThongBao = useThongBao();
  const [bat, setBat] = useState(false);
  const [dangDoi, setDangDoi] = useState(false);

  // Đọc trạng thái đã lưu trên Firestore của chính người đang đăng nhập
  useEffect(() => {
    setBat(Boolean(nd.thongBaoBat));
  }, [nd.thongBaoBat]);

  const hoTro = trinhDuyetHoTro() && daCauHinhThongBao();

  async function doi(muonBat) {
    setDangDoi(true);
    const kq = muonBat ? await batThongBao(nd.nguoi?.uid) : await tatThongBao(nd.nguoi?.uid);
    setDangDoi(false);
    if (kq.thanhCong) {
      setBat(muonBat);
      nd.doiThongBao(muonBat);
      hienThongBao(muonBat ? "Đã bật thông báo nhắc học." : "Đã tắt thông báo nhắc học.");
    } else if (kq.thongBao) {
      hienThongBao(kq.thongBao);
    }
  }

  return (
    <section className="border-vien bg-nen-noi flex flex-col gap-4 rounded-[var(--bo-goc)] border p-4">
      <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Thông báo nhắc học</h2>

      {!nd.daDangNhap ? (
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          Hãy đăng nhập để nhận thông báo nhắc học.
        </p>
      ) : !trinhDuyetHoTro() ? (
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          Trình duyệt này chưa hỗ trợ thông báo nhắc học.
        </p>
      ) : !hoTro ? (
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          App chưa được cấu hình khoá thông báo. Xem tai-lieu/HUONG-DAN-THONG-BAO.md.
        </p>
      ) : (
        <>
          <CongTat
            bieuTuong="nhac-hoc"
            nhan="Nhắc học mỗi ngày"
            moTa="7h sáng chào ngày mới, 14h và 21h nhắc tiến độ hôm nay."
            bat={bat}
            doi={dangDoi ? () => {} : doi}
          />
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            Trên iPhone, phải cài Riyi vào màn hình chính thì mới nhận được thông báo.
          </p>
        </>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   MỤC ỨNG DỤNG: phiên bản app, phiên bản nội dung, nút cập nhật nội dung
   ----------------------------------------------------------------------------- */
function MucUngDung() {
  const hienThongBao = useThongBao();
  const [banNoiDung, setBanNoiDung] = useState(null);
  const [dangCapNhat, setDangCapNhat] = useState(false);

  useEffect(() => {
    let conSong = true;
    phienBanNoiDung().then((b) => conSong && setBanNoiDung(b));
    return () => {
      conSong = false;
    };
  }, []);

  async function capNhat() {
    setDangCapNhat(true);
    try {
      const cu = banNoiDung;
      const moi = await capNhatNoiDung();
      setBanNoiDung(moi);
      hienThongBao(
        cu !== null && moi > cu
          ? `Đã tải nội dung mới (phiên bản ${moi}).`
          : "Nội dung bài học đã là bản mới nhất.",
      );
    } catch {
      hienThongBao("Không cập nhật được. Hãy kiểm tra mạng rồi thử lại.");
    }
    setDangCapNhat(false);
  }

  return (
    <section className="border-vien bg-nen-noi flex flex-col gap-3 rounded-[var(--bo-goc)] border p-4">
      <h2 className="m-0 flex items-center gap-2 text-[length:var(--co-chu-latin)] font-bold">
        <BieuTuong ten="ung-dung" />
        Ứng dụng
      </h2>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[length:var(--co-chu-latin-nho)]">
        <dt className="text-chu-mo">Phiên bản app</dt>
        <dd className="m-0 font-semibold tabular-nums">{__PHIEN_BAN_APP__}</dd>
        <dt className="text-chu-mo">Nội dung bài học</dt>
        <dd className="m-0 font-semibold tabular-nums">
          {banNoiDung === null ? "…" : `phiên bản ${banNoiDung}`}
        </dd>
      </dl>
      <button
        type="button"
        onClick={capNhat}
        disabled={dangCapNhat}
        className={`${kieuNutVien} self-start disabled:opacity-50`}
      >
        <BieuTuong ten="cap-nhat" co={16} className={dangCapNhat ? "animate-spin" : ""} />
        {dangCapNhat ? "Đang cập nhật..." : "Cập nhật nội dung"}
      </button>
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        App tự lấy nội dung mới khi mở. Bấm nút này nếu muốn lấy ngay mà không
        cần mở lại app.
      </p>
    </section>
  );
}

/**
 * Nút đăng nhập Google, dùng ở màn Cài đặt, màn chọn khoá học và tab Mục tiêu.
 * Luôn căn giữa. Logo chữ G của Google đặt trên nền tròn màu thẻ, đúng màu theo
 * quy định của Google (quyết định 18.5).
 */
export function NutDangNhap({ nd }) {
  const sanSang = nd.coTheDangNhap && nd.trangThai !== "dang-kiem-tra";
  // Mở màn tài khoản email (đăng nhập, tạo tài khoản, quên mật khẩu)
  const [moEmail, setMoEmail] = useState(false);
  // Đang vào lại tài khoản của lần trước thì không hiện nút, tránh trông như
  // đã bị đăng xuất (quyết định 18.10)
  if (nd.dangKhoiPhuc) {
    return (
      <p className="text-chu-mo m-0 text-center text-[length:var(--co-chu-latin-nho)]">
        Đang vào lại tài khoản của bạn...
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={nd.dangNhap}
        disabled={!sanSang}
        className="bg-nhan text-chu-tren-nhan inline-flex items-center gap-2.5 rounded-[var(--bo-goc-tron)] py-2 pr-5 pl-2 text-[length:var(--co-chu-latin)] font-bold disabled:opacity-50"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--nen-logo-google)]">
          <LogoGoogle co={18} />
        </span>
        Đăng nhập bằng Google
      </button>
      <button
        type="button"
        onClick={() => setMoEmail(true)}
        disabled={!sanSang}
        className="border-vien bg-nen-noi inline-flex items-center gap-2 rounded-[var(--bo-goc-tron)] border px-5 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold disabled:opacity-50"
      >
        <BieuTuong ten="email" co={16} />
        Đăng nhập hoặc tạo tài khoản bằng email
      </button>
      {moEmail && <ManTaiKhoanEmail dong={() => setMoEmail(false)} />}
      {!nd.coTheDangNhap && (
        <p className="text-chu-mo m-0 text-center text-[length:var(--co-chu-latin-nho)]">
          Đăng nhập chưa sẵn sàng vì ứng dụng chưa được kết nối Firebase.
        </p>
      )}
    </div>
  );
}

/**
 * Phần riêng của tài khoản email + mật khẩu trong Cài đặt (quyết định 18.14,
 * 18.15): nhắc xác minh email, và đổi mật khẩu.
 */
function MucTaiKhoanEmail({ nd }) {
  const hienThongBao = useThongBao();
  const [moDoi, setMoDoi] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(null);
  const [o, setO] = useState({ matKhauCu: "", matKhauMoi: "", nhapLai: "" });
  const doi = (khoa) => (e) => setO((cu) => ({ ...cu, [khoa]: e.target.value }));

  async function guiDoi(e) {
    e.preventDefault();
    setDangGui(true);
    setLoi(null);
    const kq = await doiMatKhau(o);
    setDangGui(false);
    if (kq.thanhCong) {
      hienThongBao(kq.thongBao);
      setO({ matKhauCu: "", matKhauMoi: "", nhapLai: "" });
      setMoDoi(false);
    } else {
      setLoi(kq.thongBao);
    }
  }

  async function guiLaiXacMinh() {
    const kq = await guiLaiEmailXacMinh();
    hienThongBao(kq.thongBao, 5);
  }

  async function daXacMinhRoi() {
    const da = await nd.xemLaiXacMinh();
    hienThongBao(
      da
        ? "Email đã được xác minh. Cảm ơn bạn!"
        : "Email chưa được xác minh. Hãy bấm vào link trong email rồi thử lại.",
      4,
    );
  }

  return (
    <div className="border-vien flex flex-col gap-3 border-t pt-3">
      <p className="m-0 flex items-center gap-2 text-[length:var(--co-chu-latin-nho)]">
        <BieuTuong ten="email" co={16} />
        <span className="min-w-0 break-all">{nd.nguoi.email}</span>
      </p>

      {!nd.nguoi.daXacMinh && (
        <div className="bg-nhan-nhat flex flex-col gap-2 rounded-[var(--bo-goc-nho)] p-3">
          <p className="m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            Email của bạn <strong>chưa được xác minh</strong>. Hãy mở email từ Riyi
            và bấm vào link. Nếu gõ nhầm email, bạn sẽ không lấy lại được mật khẩu
            khi quên.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={guiLaiXacMinh} className={`${kieuNutVien} bg-nen-noi`}>
              <BieuTuong ten="xac-minh" co={16} />
              Gửi lại email xác minh
            </button>
            <button type="button" onClick={daXacMinhRoi} className={`${kieuNutVien} bg-nen-noi`}>
              <BieuTuong ten="kiem-tra" co={16} />
              Tôi đã xác minh
            </button>
          </div>
        </div>
      )}

      {!moDoi ? (
        <button type="button" onClick={() => setMoDoi(true)} className={`${kieuNutVien} self-start`}>
          <BieuTuong ten="mat-khau" co={16} />
          Đổi mật khẩu
        </button>
      ) : (
        <form onSubmit={guiDoi} className="flex flex-col gap-3" noValidate>
          <ONhapMatKhau
            nhan="Mật khẩu hiện tại"
            value={o.matKhauCu}
            onChange={doi("matKhauCu")}
            autoComplete="current-password"
          />
          <ONhapMatKhau
            nhan="Mật khẩu mới"
            value={o.matKhauMoi}
            onChange={doi("matKhauMoi")}
            autoComplete="new-password"
            goiY="Ít nhất 8 ký tự."
          />
          <ONhapMatKhau
            nhan="Nhập lại mật khẩu mới"
            value={o.nhapLai}
            onChange={doi("nhapLai")}
            autoComplete="new-password"
          />
          {loi && (
            <p role="alert" className="text-sai m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">
              {loi}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={dangGui}
              className="bg-nhan text-chu-tren-nhan inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-bold disabled:opacity-50"
            >
              <BieuTuong ten="mat-khau" co={16} />
              {dangGui ? "Đang đổi..." : "Lưu mật khẩu mới"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMoDoi(false);
                setLoi(null);
              }}
              className={kieuNutVien}
            >
              Huỷ
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * Thanh kéo cỡ chữ theo 5 nấc (quyết định 18.9). Kéo tới đâu cả app đổi cỡ
 * ngay tới đó, kèm một dòng xem trước có đủ tiếng Việt, tiếng Trung, tiếng Nhật.
 */
function ThanhKeoCoChu({ dangChon, chon }) {
  const viTri = Math.max(0, CAC_CO_CHU.findIndex((c) => c.ma === dangChon));
  const nac = CAC_CO_CHU[viTri];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor="thanh-keo-co-chu"
          className="flex items-center gap-2 text-[length:var(--co-chu-latin)] font-semibold"
        >
          <BieuTuong ten="co-chu" />
          Cỡ chữ
        </label>
        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold">
          {nac.nhan}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-[length:var(--co-chu-latin-nho)] font-bold">
          A
        </span>
        <input
          id="thanh-keo-co-chu"
          type="range"
          min={0}
          max={CAC_CO_CHU.length - 1}
          step={1}
          value={viTri}
          aria-valuetext={nac.nhan}
          onChange={(e) => chon(CAC_CO_CHU[Number(e.target.value)].ma)}
          className="h-8 min-w-0 flex-1 cursor-pointer accent-[var(--nhan)]"
        />
        <span aria-hidden="true" className="text-[length:1.375rem] font-bold">
          A
        </span>
      </div>
      {/* Xem trước: Trung → Nhật → Việt */}
      <div className="border-vien flex flex-wrap items-end gap-x-4 gap-y-1 rounded-[var(--bo-goc-nho)] border border-dashed px-3 py-2">
        <ChuTrung amTiet={[{ chu: "汉", pinyin: "hàn" }, { chu: "字", pinyin: "zì" }]} />
        <ChuNhat noiDung="漢字[かんじ]" />
        <span className="text-[length:var(--co-chu-latin)]">chữ Hán</span>
      </div>
    </div>
  );
}

/**
 * Chọn một trong ba giao diện: Sáng, Tối, Hoa anh đào.
 * Dùng nhóm nút radio để trình đọc màn hình đọc đúng "đang chọn".
 */
function ChonGiaoDien({ dangChon, chon }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="flex items-center gap-2 text-[length:var(--co-chu-latin)] font-semibold">
          <BieuTuong ten="giao-dien" />
          Giao diện
        </div>
        <div className="text-chu-mo text-[length:var(--co-chu-latin-nho)] leading-snug">
          Màu nền và màu điểm nhấn của toàn bộ app.
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Giao diện">
        {CAC_GIAO_DIEN.map((g) => {
          const chonRoi = dangChon === g.ma;
          return (
            <button
              key={g.ma}
              type="button"
              role="radio"
              aria-checked={chonRoi}
              onClick={() => chon(g.ma)}
              className={`flex flex-col items-center gap-1 rounded-[var(--bo-goc)] border-2 px-1 py-2.5 text-center text-[length:var(--co-chu-latin-nho)] leading-tight font-semibold transition-colors ${
                chonRoi ? "border-nhan bg-nhan-nhat" : "border-vien bg-transparent"
              }`}
            >
              {g.ma === "anh-dao" ? (
                <HoaAnhDao co={22} />
              ) : (
                <BieuTuong ten={`theme-${g.ma}`} co={22} />
              )}
              {g.nhan}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Công tắc bật/tắt. Có chữ mô tả và role="switch" cho trình đọc màn hình. */
function CongTat({ bieuTuong, nhan, moTa, bat, doi }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[length:var(--co-chu-latin)] font-semibold">
          {bieuTuong && <BieuTuong ten={bieuTuong} />}
          {nhan}
        </div>
        <div className="text-chu-mo text-[length:var(--co-chu-latin-nho)] leading-snug">
          {moTa}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={bat}
        aria-label={nhan}
        onClick={() => doi(!bat)}
        className={`relative h-7 w-12 shrink-0 rounded-[var(--bo-goc-tron)] transition-colors ${
          bat ? "bg-nhan" : "bg-vien"
        }`}
      >
        <span
          className="bg-nen-noi absolute top-0.5 h-6 w-6 rounded-full shadow transition-all"
          style={{ left: bat ? "1.375rem" : "0.125rem" }}
        />
      </button>
    </div>
  );
}
