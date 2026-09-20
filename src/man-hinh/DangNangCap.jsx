/* =============================================================================
   MÀN HÌNH "ĐANG NÂNG CẤP"
   =============================================================================

   Hiện khi người dùng bấm vào khoá học chưa làm (khoá 2 và khoá 3).
   Nội dung câu chữ lấy đúng theo yêu cầu, không tự đổi.
   ============================================================================= */

export default function DangNangCap({ quayLai }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      {/* Mặt trời mờ đi, ngụ ý "chưa tới lúc" */}
      <img
        src="/hinh/mat-troi.png"
        alt=""
        width="92"
        height="49"
        className="mb-7 h-auto w-[92px]"
        style={{ filter: "grayscale(1) opacity(0.4)" }}
      />

      <h1 className="m-0 text-[length:var(--co-chu-latin)] leading-snug font-bold">
        Hệ thống đang nâng cấp, xin hãy chờ đợi thêm nhé.
      </h1>

      <button
        type="button"
        onClick={quayLai}
        className="bg-nhan text-chu-tren-nhan active:bg-nhan-dam mt-8 rounded-[var(--bo-goc-tron)] px-8 py-3 text-[length:var(--co-chu-latin)] font-bold transition-colors"
      >
        Quay lại
      </button>
    </main>
  );
}
