/* =============================================================================
   ĐĂNG KÝ SERVICE WORKER VÀ PHÁT HIỆN BẢN APP MỚI
   =============================================================================

   Luồng cập nhật:
     1. Mỗi lần đưa app lên mạng (npm run trien-khai), sw.js có phiên bản mới.
     2. Trình duyệt kiểm tra sw.js khi mở app, khi quay lại app, và mỗi giờ.
        Thấy bản mới thì cài ngầm, rồi CHỜ (không tự đổi giữa chừng).
     3. App hiện dải "Đã có phiên bản mới" kèm nút "Tải lại để cập nhật".
     4. Bấm nút: service worker mới chạy, trang tự tải lại, người dùng có bản mới.

   Nhờ vậy người dùng không bị kẹt ở bản cũ, mà cũng không bị tải lại đột ngột
   khi đang làm bài.

   Chỉ chạy trên bản đã đóng gói (npm run build). Lúc "npm run dev" không đăng
   ký service worker, để không làm rối việc sửa code.
   ============================================================================= */

const GIO_KIEM_TRA_LAI = 60 * 60 * 1000; // 1 giờ

let banDangCho = null; // service worker mới đang chờ
let nguoiDungDaBam = false; // đã bấm "Tải lại để cập nhật" chưa
let daTaiLai = false;
const cacNguoiNghe = new Set();

function baoBanMoi(sw) {
  banDangCho = sw;
  for (const nghe of cacNguoiNghe) nghe(true);
}

/** Đăng ký nhận tin "có bản mới". Trả về hàm huỷ đăng ký. */
export function theoDoiBanMoi(nghe) {
  cacNguoiNghe.add(nghe);
  if (banDangCho) nghe(true);
  return () => cacNguoiNghe.delete(nghe);
}

/** Chuyển sang bản mới: bảo service worker mới chạy, rồi trang tự tải lại. */
export function chuyenSangBanMoi() {
  nguoiDungDaBam = true;
  if (!banDangCho) {
    location.reload();
    return;
  }
  banDangCho.postMessage("bo-qua-cho");
}

/** Gọi một lần lúc app khởi động (main.jsx). */
export function dangKyServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  // Service worker mới đã chạy thì tải lại trang, nhưng CHỈ KHI người dùng đã
  // bấm cập nhật. Lần cài đầu tiên service worker cũng giành quyền điều khiển,
  // lúc đó không được tải lại trang.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!nguoiDungDaBam || daTaiLai) return;
    daTaiLai = true;
    location.reload();
  });

  window.addEventListener("load", async () => {
    let dangKy;
    try {
      dangKy = await navigator.serviceWorker.register("/sw.js");
    } catch {
      // Không đăng ký được (trình duyệt chặn...) thì app vẫn chạy bình thường,
      // chỉ không cài được vào màn hình chính và không báo bản mới
      return;
    }

    // Đã có bản mới chờ sẵn từ lần mở trước
    if (dangKy.waiting && navigator.serviceWorker.controller) {
      baoBanMoi(dangKy.waiting);
    }

    dangKy.addEventListener("updatefound", () => {
      const moi = dangKy.installing;
      moi?.addEventListener("statechange", () => {
        // Có controller nghĩa là đây là bản CẬP NHẬT, không phải lần cài đầu
        if (moi.state === "installed" && navigator.serviceWorker.controller) {
          baoBanMoi(moi);
        }
      });
    });

    const kiemTra = () => dangKy.update().catch(() => {});
    setInterval(kiemTra, GIO_KIEM_TRA_LAI);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") kiemTra();
    });
  });
}
