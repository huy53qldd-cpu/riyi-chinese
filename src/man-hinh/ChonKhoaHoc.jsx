/* =============================================================================
   MÀN HÌNH CHỌN KHOÁ HỌC
   =============================================================================

   Màn hình đầu tiên sau khi vào app.

   Ba khoá học, nhưng ở giai đoạn này chỉ khoá 1 hoạt động. Bấm khoá 2 hoặc 3
   sẽ hiện màn hình "Hệ thống đang nâng cấp".

   Cấu trúc để sẵn cho dễ mở rộng: thêm khoá mới chỉ cần thêm một mục vào mảng
   DANH_SACH_KHOA bên dưới, không phải sửa giao diện.

   Cuối màn hình có khối tài khoản: nút "Đăng nhập bằng Google" (chế độ khách)
   hoặc lời chào (đã đăng nhập). Chế độ khách vẫn vào học bình thường.
   ============================================================================= */

import Logo from "../thanh-phan/Logo.jsx";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import { NutDangNhap } from "./CaiDat.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";

const DANH_SACH_KHOA = [
  {
    ma: "trung-cho-nguoi-biet-nhat",
    ten: "Tiếng Trung cho người đã có nền tảng tiếng Nhật",
    moTa: "Học tiếng Trung bằng vốn Hán tự tiếng Nhật sẵn có. HSK cấp 1 đến 3.",
    hoatDong: true,
  },
  {
    ma: "trung-co-ban",
    ten: "Tiếng Trung cơ bản",
    moTa: "Dành cho người mới, chưa biết tiếng Nhật.",
    hoatDong: false,
  },
  {
    ma: "tieng-nhat",
    ten: "Tiếng Nhật",
    moTa: "Khoá tiếng Nhật riêng.",
    hoatDong: false,
  },
];

export default function ChonKhoaHoc({ chonKhoa, moNangCap, moCaiDat }) {
  const nd = useNguoiDung();

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-8">
      <button
        type="button"
        onClick={moCaiDat}
        aria-label="Cài đặt"
        className="border-vien text-chu-mo absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border text-xl"
      >
        <BieuTuong ten="cai-dat" co={20} />
      </button>

      {/* ---------------------------------------------------------------------
          LOGO
          Dùng hai file ảnh khác nhau cho theme sáng và theme tối. Ảnh nền trong
          suốt nên đặt lên nền nào cũng vừa.
          --------------------------------------------------------------------- */}
      <header className="flex flex-col items-center pt-6 pb-10">
        <Logo rong={150} />

        <p className="text-chu-mo mt-4 mb-0 max-w-xs text-center text-[length:var(--co-chu-latin-nho)]">
          Học tiếng Trung bằng vốn Hán tự tiếng Nhật bạn đã có
        </p>
      </header>

      {/* ---------------------------------------------------------------------
          DANH SÁCH KHOÁ HỌC
          --------------------------------------------------------------------- */}
      <h1 className="m-0 mb-3 text-[length:var(--co-chu-latin)] font-bold">
        Chọn khoá học
      </h1>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {DANH_SACH_KHOA.map((khoa) => (
          <li key={khoa.ma}>
            <button
              type="button"
              onClick={() =>
                khoa.hoatDong ? chonKhoa(khoa.ma) : moNangCap()
              }
              className={`border-vien bg-nen-noi w-full rounded-[var(--bo-goc)] border p-4 text-left transition-colors ${
                khoa.hoatDong
                  ? "hover:border-nhan active:border-nhan"
                  : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[length:var(--co-chu-latin)] leading-snug font-bold">
                    {khoa.ten}
                  </div>
                  <div className="text-chu-mo mt-1 text-[length:var(--co-chu-latin-nho)] leading-snug">
                    {khoa.moTa}
                  </div>
                </div>

                {/* Nhãn trạng thái bên phải */}
                {khoa.hoatDong ? (
                  <span
                    className="text-nhan-chu shrink-0 text-2xl leading-none"
                    aria-hidden="true"
                  >
                    →
                  </span>
                ) : (
                  <span className="bg-nen-phu text-chu-mo shrink-0 rounded-[var(--bo-goc-tron)] px-2.5 py-1 text-[0.6875rem] font-bold whitespace-nowrap">
                    Chưa mở
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* ---------------------------------------------------------------------
          TÀI KHOẢN
          --------------------------------------------------------------------- */}
      <section className="border-vien mt-auto flex flex-col gap-2 border-t pt-5">
        {nd.daDangNhap || nd.dangKhoiPhuc ? (
          // Đã đăng nhập, hoặc đang vào lại tài khoản của lần trước: chỉ một
          // dòng chào (quyết định 18.11). Máy chưa từng nhớ tên nghĩa là vừa
          // đăng nhập lần đầu, nên chào "Chào mừng bạn" thay vì "quay trở lại".
          <p className="text-chu-mo m-0 text-center text-[length:var(--co-chu-latin)]">
            {nd.tenDaNho ? "Chào mừng bạn đã quay trở lại, " : "Chào mừng bạn, "}
            <span className="text-chu font-bold">
              {nd.nguoi?.ten || nd.nguoi?.email || nd.tenDaNho}
            </span>
          </p>
        ) : (
          <>
            <p className="text-chu-mo m-0 text-center text-[length:var(--co-chu-latin-nho)] leading-relaxed">
              Bạn có thể học ngay ở chế độ khách. Đăng nhập để lưu tiến độ.
            </p>
            <NutDangNhap nd={nd} />
          </>
        )}
      </section>

      {/* Dòng tác giả, luôn hiện (quyết định 18.8) */}
      <p className="text-chu-mo m-0 mt-6 text-center text-[length:var(--co-chu-latin-nho)] opacity-80">
        Được xây dựng và phát triển bởi Yuhry Vũ
      </p>
    </main>
  );
}
