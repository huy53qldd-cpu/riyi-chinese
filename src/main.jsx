/* =============================================================================
   RIYI — ĐIỂM KHỞI ĐỘNG
   =============================================================================
   File này chỉ làm một việc: gắn app vào trang web.
   Không viết logic gì ở đây.
   ============================================================================= */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";
import App from "./App.jsx";
import { apDungCaiDat, docCaiDatMay } from "./nguoi-dung/caiDat.js";
import { dangKyServiceWorker } from "./pwa/capNhatApp.js";

// Áp cài đặt đã lưu (furigana, sáng/tối) ngay từ đầu, trước khi vẽ giao diện
apDungCaiDat(docCaiDatMay());

// Service worker: cho cài app vào màn hình chính và báo khi có bản mới
dangKyServiceWorker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
