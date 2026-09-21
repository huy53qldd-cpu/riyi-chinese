import { readFileSync } from "node:fs";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Phiên bản app = thời điểm đóng gói, theo giờ Việt Nam, ví dụ "2026-09-21 15:30".
// Hiện trong Cài đặt, và được đóng dấu vào service worker để trình duyệt biết
// có bản mới (xem src/pwa/sw.js).
const PHIEN_BAN_APP = new Date()
  .toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
  .slice(0, 16);

/**
 * Mỗi lần đóng gói, chép src/pwa/sw.js ra thành /sw.js và thay chữ
 * "__PHIEN_BAN__" bằng phiên bản app. Không để sw.js trong public/ vì như vậy
 * nội dung file không đổi giữa các bản, trình duyệt sẽ không nhận ra bản mới.
 */
function dongDauServiceWorker() {
  return {
    name: "dong-dau-service-worker",
    apply: "build",
    generateBundle() {
      const goc = readFileSync("src/pwa/sw.js", "utf-8");
      const dong = 'const PHIEN_BAN = "__PHIEN_BAN__";';
      if (!goc.includes(dong)) throw new Error(`src/pwa/sw.js phải có dòng: ${dong}`);
      const noiDung = goc.replace(dong, `const PHIEN_BAN = "${PHIEN_BAN_APP}";`);
      this.emitFile({ type: "asset", fileName: "sw.js", source: noiDung });
    },
  };
}

// Cấu hình Vite — công cụ chạy và đóng gói app.
export default defineConfig({
  plugins: [react(), tailwindcss(), dongDauServiceWorker()],

  // Cho code trong app đọc được phiên bản (dùng ở màn Cài đặt)
  define: {
    __PHIEN_BAN_APP__: JSON.stringify(PHIEN_BAN_APP),
  },

  server: {
    // host: true cho phép MỞ APP TỪ ĐIỆN THOẠI.
    // Khi chạy "npm run dev", máy tính sẽ in ra một địa chỉ dạng
    // http://192.168.x.x:5173 — gõ địa chỉ đó vào trình duyệt điện thoại
    // (điện thoại và máy tính phải dùng chung wifi).
    host: true,
    port: 5173,
  },
});
