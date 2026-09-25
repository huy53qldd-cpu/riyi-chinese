/* =============================================================================
   SERVICE WORKER CỦA RIYI
   =============================================================================

   Service worker là một đoạn mã trình duyệt chạy ngầm cho trang web. Riyi chỉ
   dùng nó cho ĐÚNG HAI việc:

     1. Cho phép cài app vào màn hình chính (trình duyệt đòi phải có).
     2. Khi mở app lúc KHÔNG có mạng: hiện trang mat-mang.html bằng tiếng Việt
        thay cho trang lỗi của trình duyệt.

   Quy tắc dự án: KHÔNG làm chức năng chạy offline. Vì vậy file này KHÔNG lưu
   bài học, ảnh, font hay mã của app. Chỉ lưu đúng một trang mat-mang.html.

   PHIÊN BẢN: dòng "__PHIEN_BAN__" bên dưới được thay bằng thời điểm đóng gói
   mỗi lần chạy "npm run build" (xem vite.config.js). Nhờ vậy mỗi bản app mới có
   một service worker mới, trình duyệt nhận ra và app hiện nút "Tải lại để cập
   nhật" (xem src/pwa/capNhatApp.js).
   ============================================================================= */

const PHIEN_BAN = "__PHIEN_BAN__";
const TEN_KHO = `riyi-${PHIEN_BAN}`;
const TRANG_MAT_MANG = "/mat-mang.html";

// Cài đặt: lưu sẵn trang báo mất mạng. KHÔNG tự thay bản cũ ngay, mà chờ người
// dùng bấm "Tải lại để cập nhật" (tin nhắn "bo-qua-cho" bên dưới).
self.addEventListener("install", (suKien) => {
  suKien.waitUntil(
    caches
      .open(TEN_KHO)
      .then((kho) => kho.add(new Request(TRANG_MAT_MANG, { cache: "reload" }))),
  );
});

// Bắt đầu chạy: xoá kho của các phiên bản cũ, bật tải trước trang để mở app
// không bị chậm vì phải đi qua service worker.
self.addEventListener("activate", (suKien) => {
  suKien.waitUntil(
    (async () => {
      const cacKho = await caches.keys();
      await Promise.all(
        cacKho
          .filter((ten) => ten.startsWith("riyi-") && ten !== TEN_KHO)
          .map((ten) => caches.delete(ten)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

// App gửi "bo-qua-cho" khi người dùng bấm "Tải lại để cập nhật"
self.addEventListener("message", (suKien) => {
  if (suKien.data === "bo-qua-cho") self.skipWaiting();
});

/* -----------------------------------------------------------------------------
   THÔNG BÁO NHẮC HỌC (GĐ 11, quyết định 18.40)

   Người gửi là GitHub Actions, 3 lần mỗi ngày (7h, 14h, 21h giờ Việt Nam).
   Tin nhắn gửi dạng "data" (không phải "notification") nên chính service
   worker này vẽ thông báo, và bấm vào thì mở đúng màn hình học hôm nay.
   ----------------------------------------------------------------------------- */
self.addEventListener("push", (suKien) => {
  let tin = {};
  try {
    const goi = suKien.data?.json() ?? {};
    tin = goi.data ?? goi;
  } catch {
    tin = { than: suKien.data?.text() ?? "" };
  }
  if (!tin.than && !tin.tieuDe) return;

  suKien.waitUntil(
    self.registration.showNotification(tin.tieuDe || "Riyi", {
      body: tin.than || "",
      // Biểu tượng app (trước đây trỏ nhầm file bieu-tuong-192.png không có thật)
      icon: "/hinh/icon-192.png",
      badge: "/hinh/icon-192.png",
      lang: "vi",
      tag: "riyi-nhac-hoc", // thông báo mới thay thông báo cũ, không dồn đống
      data: { duongDan: tin.duongDan || "/" },
    }),
  );
});

// Bấm vào thông báo: đang mở app thì chuyển sang tab đó, chưa mở thì mở app
self.addEventListener("notificationclick", (suKien) => {
  suKien.notification.close();
  const duongDan = suKien.notification.data?.duongDan || "/";
  suKien.waitUntil(
    (async () => {
      const cacTab = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const tab of cacTab) {
        if (new URL(tab.url).origin === self.location.origin) {
          await tab.focus();
          if ("navigate" in tab) await tab.navigate(duongDan).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(duongDan);
    })(),
  );
});

// Chỉ can thiệp khi MỞ TRANG (không đụng tới dữ liệu, ảnh, font...).
// Có mạng thì tải bình thường từ mạng; mất mạng thì trả trang báo mất mạng.
self.addEventListener("fetch", (suKien) => {
  if (suKien.request.mode !== "navigate") return;
  // Trang riêng của Firebase (trang đăng nhập Google /__/auth/...): để yên hoàn toàn
  if (new URL(suKien.request.url).pathname.startsWith("/__/")) return;
  suKien.respondWith(
    (async () => {
      try {
        const taiTruoc = await suKien.preloadResponse;
        if (taiTruoc) return taiTruoc;
        return await fetch(suKien.request);
      } catch {
        return (await caches.match(TRANG_MAT_MANG)) ?? Response.error();
      }
    })(),
  );
});
