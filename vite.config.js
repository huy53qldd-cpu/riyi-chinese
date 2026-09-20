import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Cấu hình Vite — công cụ chạy và đóng gói app.
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // host: true cho phép MỞ APP TỪ ĐIỆN THOẠI.
    // Khi chạy "npm run dev", máy tính sẽ in ra một địa chỉ dạng
    // http://192.168.x.x:5173 — gõ địa chỉ đó vào trình duyệt điện thoại
    // (điện thoại và máy tính phải dùng chung wifi).
    host: true,
    port: 5173,
  },
});
