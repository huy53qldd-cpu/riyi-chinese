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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
