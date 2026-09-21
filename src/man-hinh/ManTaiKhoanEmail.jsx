/* =============================================================================
   MÀN TÀI KHOẢN EMAIL (GĐ 10, quyết định 18.12 – 18.15)
   =============================================================================

   Mở phủ lên toàn màn hình từ nút "Đăng nhập bằng email" (cạnh nút Google).
   Ba phần:
     - Đăng nhập      : email + mật khẩu
     - Tạo tài khoản  : tên hiển thị, email, mật khẩu, nhập lại mật khẩu
     - Quên mật khẩu  : nhập email, nhận link đặt mật khẩu mới

   Đăng nhập hay tạo tài khoản xong thì tự đóng; phần còn lại (tải tiến độ,
   lời chào) do NguoiDung.jsx lo như với đăng nhập Google.
   ============================================================================= */

import { useEffect, useId, useState } from "react";

import {
  DO_DAI_MAT_KHAU_TOI_THIEU,
  dangNhapEmail,
  guiEmailDatLaiMatKhau,
} from "../firebase/taiKhoanEmail.js";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";

const CAC_PHAN = [
  { ma: "dang-nhap", nhan: "Đăng nhập" },
  { ma: "tao", nhan: "Tạo tài khoản" },
];

const kieuNutChinh =
  "bg-nhan text-chu-tren-nhan inline-flex w-full items-center justify-center gap-2 rounded-[var(--bo-goc-tron)] px-5 py-3 text-[length:var(--co-chu-latin)] font-bold disabled:opacity-50";
const kieuNutChu =
  "text-chu self-center bg-transparent px-2 py-1 text-[length:var(--co-chu-latin-nho)] font-semibold underline underline-offset-4";

export default function ManTaiKhoanEmail({ dong }) {
  const nd = useNguoiDung();
  const hienThongBao = useThongBao();
  const [phan, setPhanGoc] = useState("dang-nhap"); // dang-nhap | tao | quen
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(null);
  const [baoQuen, setBaoQuen] = useState(null);
  const [o, setO] = useState({ ten: "", email: "", matKhau: "", nhapLai: "" });

  // Đổi phần thì xoá thông báo lỗi cũ, giữ lại email đã gõ
  function setPhan(moi) {
    setPhanGoc(moi);
    setLoi(null);
    setBaoQuen(null);
  }

  // Đăng nhập thành công (kể cả qua tạo tài khoản) thì đóng màn này
  useEffect(() => {
    if (nd.daDangNhap) dong();
  }, [nd.daDangNhap, dong]);

  const doi = (khoa) => (e) => setO((cu) => ({ ...cu, [khoa]: e.target.value }));

  async function gui(e) {
    e.preventDefault();
    setDangGui(true);
    setLoi(null);
    if (phan === "dang-nhap") {
      const kq = await dangNhapEmail({ email: o.email, matKhau: o.matKhau });
      if (!kq.thanhCong) setLoi(kq.thongBao);
    } else if (phan === "tao") {
      const kq = await nd.taoTaiKhoanEmail(o);
      if (kq.thanhCong) {
        hienThongBao("Đã tạo tài khoản. Hãy mở email để xác minh địa chỉ email.", 5);
      } else {
        setLoi(kq.thongBao);
      }
    } else {
      const kq = await guiEmailDatLaiMatKhau(o.email);
      if (kq.thanhCong) setBaoQuen(kq.thongBao);
      else setLoi(kq.thongBao);
    }
    setDangGui(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tài khoản email"
      className="bg-nen fixed inset-0 z-50 overflow-y-auto"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-6">
        <div>
          <button
            type="button"
            onClick={phan === "quen" ? () => setPhan("dang-nhap") : dong}
            className="border-vien inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
          >
            <BieuTuong ten="quay-lai" co={16} />
            Quay lại
          </button>
        </div>

        <h1 className="m-0 flex items-center gap-2 text-[length:var(--co-chu-latin)] font-bold">
          <BieuTuong ten={phan === "quen" ? "mat-khau" : "email"} />
          {phan === "quen" ? "Quên mật khẩu" : "Tài khoản email"}
        </h1>

        {/* Chọn Đăng nhập / Tạo tài khoản */}
        {phan !== "quen" && (
          <div className="bg-nen-phu grid grid-cols-2 gap-1 rounded-[var(--bo-goc-tron)] p-1" role="tablist">
            {CAC_PHAN.map((p) => (
              <button
                key={p.ma}
                type="button"
                role="tab"
                aria-selected={phan === p.ma}
                onClick={() => setPhan(p.ma)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] px-3 py-2 text-[length:var(--co-chu-latin-nho)] font-bold transition-colors ${
                  phan === p.ma ? "bg-nen-noi shadow-[0_1px_3px_var(--bong)]" : "text-chu-mo bg-transparent"
                }`}
              >
                <BieuTuong ten={p.ma === "tao" ? "tao-tai-khoan" : "dang-nhap"} co={16} />
                {p.nhan}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={gui} className="border-vien bg-nen-noi flex flex-col gap-4 rounded-[var(--bo-goc)] border p-4" noValidate>
          {phan === "quen" && (
            <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
              Nhập email bạn đã dùng để tạo tài khoản. Chúng tôi sẽ gửi một đường
              link để bạn đặt mật khẩu mới. (Vì an toàn, không ai xem được mật khẩu
              cũ, kể cả người làm app.)
            </p>
          )}

          {phan === "tao" && (
            <ONhap
              nhan="Tên hiển thị"
              value={o.ten}
              onChange={doi("ten")}
              autoComplete="nickname"
              maxLength={40}
              goiY="Tên này hiện trong lời chào của app."
            />
          )}

          <ONhap
            nhan="Email"
            type="email"
            inputMode="email"
            value={o.email}
            onChange={doi("email")}
            autoComplete={phan === "tao" ? "email" : "username"}
            goiY={phan === "tao" ? "Dùng để lấy lại mật khẩu nếu bạn quên." : null}
          />

          {phan !== "quen" && (
            <ONhapMatKhau
              nhan="Mật khẩu"
              value={o.matKhau}
              onChange={doi("matKhau")}
              autoComplete={phan === "tao" ? "new-password" : "current-password"}
              goiY={phan === "tao" ? `Ít nhất ${DO_DAI_MAT_KHAU_TOI_THIEU} ký tự.` : null}
            />
          )}

          {phan === "tao" && (
            <ONhapMatKhau
              nhan="Nhập lại mật khẩu"
              value={o.nhapLai}
              onChange={doi("nhapLai")}
              autoComplete="new-password"
            />
          )}

          {loi && (
            <p role="alert" className="text-sai m-0 text-[length:var(--co-chu-latin-nho)] font-semibold leading-relaxed">
              {loi}
            </p>
          )}
          {baoQuen && (
            <p role="status" className="text-dung m-0 text-[length:var(--co-chu-latin-nho)] font-semibold leading-relaxed">
              {baoQuen}
            </p>
          )}

          <button type="submit" disabled={dangGui} className={kieuNutChinh}>
            <BieuTuong
              ten={phan === "tao" ? "tao-tai-khoan" : phan === "quen" ? "email" : "dang-nhap"}
            />
            {dangGui
              ? "Đang xử lý..."
              : phan === "tao"
                ? "Tạo tài khoản"
                : phan === "quen"
                  ? "Gửi link đặt mật khẩu mới"
                  : "Đăng nhập"}
          </button>

          {phan === "dang-nhap" && (
            <button type="button" onClick={() => setPhan("quen")} className={kieuNutChu}>
              Quên mật khẩu?
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

/** Kiểu chung của ô nhập. Cỡ chữ tối thiểu 16px để iPhone không tự phóng to trang. */
const kieuONhap =
  "border-vien bg-nen text-chu w-full rounded-[var(--bo-goc-nho)] border px-3 py-2.5 text-[length:max(16px,var(--co-chu-latin))] outline-none focus:border-[var(--nhan)] focus:ring-2 focus:ring-[var(--nhan-nhat)]";

/** Một ô nhập có nhãn và dòng gợi ý. */
export function ONhap({ nhan, goiY, ...thuocTinh }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[length:var(--co-chu-latin-nho)] font-bold">
        {nhan}
      </label>
      <input id={id} className={kieuONhap} {...thuocTinh} />
      {goiY && (
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">{goiY}</p>
      )}
    </div>
  );
}

/** Ô nhập mật khẩu có nút con mắt để xem/ẩn chữ đang gõ. */
export function ONhapMatKhau({ nhan, goiY, ...thuocTinh }) {
  const id = useId();
  const [hien, setHien] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[length:var(--co-chu-latin-nho)] font-bold">
        {nhan}
      </label>
      <div className="relative">
        <input
          id={id}
          type={hien ? "text" : "password"}
          className={`${kieuONhap} pr-12`}
          {...thuocTinh}
        />
        <button
          type="button"
          onClick={() => setHien((h) => !h)}
          aria-label={hien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={hien}
          className="text-chu-mo absolute inset-y-0 right-0 flex w-12 items-center justify-center bg-transparent"
        >
          <BieuTuong ten={hien ? "an-mat-khau" : "hien-mat-khau"} />
        </button>
      </div>
      {goiY && (
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">{goiY}</p>
      )}
    </div>
  );
}
