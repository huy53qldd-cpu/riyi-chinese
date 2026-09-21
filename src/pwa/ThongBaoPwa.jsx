/* =============================================================================
   CÁC THÔNG BÁO CỦA PWA (GĐ 8)
   =============================================================================

   <DaiBanMoi />   dải nhỏ phía dưới: "Đã có phiên bản mới" + nút tải lại.
                   Cũng tự kiểm tra NỘI DUNG bài học mới khi người dùng quay
                   lại app sau một lúc.
   <ManMatMang />  phủ kín màn hình khi mất mạng: "Cần kết nối mạng để sử dụng
                   Riyi." Có mạng lại thì tự biến mất.

   Cả hai đặt một lần ở App.jsx, hiện trên mọi màn hình.
   ============================================================================= */

import { useEffect, useRef, useState } from "react";

import { kiemTraNoiDungMoi } from "../du-lieu/taiDuLieu.js";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import MatTroi from "../thanh-phan/MatTroi.jsx";
import { chuyenSangBanMoi, theoDoiBanMoi } from "./capNhatApp.js";

// Quay lại app sau ít nhất chừng này thì kiểm tra nội dung bài học mới
const PHUT_GIUA_HAI_LAN_KIEM_TRA = 30;

/* -----------------------------------------------------------------------------
   DẢI BÁO BẢN MỚI
   ----------------------------------------------------------------------------- */
export function DaiBanMoi() {
  const nd = useNguoiDung();
  const hienThongBao = useThongBao();
  const [coBanMoi, setCoBanMoi] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const lanKiemTraCuoi = useRef(Date.now());

  useEffect(() => theoDoiBanMoi(setCoBanMoi), []);

  // Quay lại app sau một lúc: xem có nội dung bài học mới không
  useEffect(() => {
    const khiHien = async () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lanKiemTraCuoi.current < PHUT_GIUA_HAI_LAN_KIEM_TRA * 60000) return;
      lanKiemTraCuoi.current = Date.now();
      try {
        if (await kiemTraNoiDungMoi()) {
          hienThongBao("Có nội dung bài học mới, sẽ hiện khi bạn mở lại tab.", 4);
        }
      } catch {
        // Mất mạng hoặc lỗi tạm thời: lần sau kiểm tra lại, không cần báo
      }
    };
    document.addEventListener("visibilitychange", khiHien);
    return () => document.removeEventListener("visibilitychange", khiHien);
  }, [hienThongBao]);

  if (!coBanMoi) return null;

  async function taiLai() {
    setDangTai(true);
    // Ghi nốt tiến độ đang chờ trước khi tải lại trang, kẻo mất
    await nd.ghiNgay();
    chuyenSangBanMoi();
  }

  return (
    <div
      role="status"
      className="border-vien bg-nen-noi fixed inset-x-3 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-[var(--bo-goc)] border px-4 py-3 shadow-[0_4px_16px_var(--bong)]"
      style={{
        // Nằm ngay trên thanh điều hướng dưới, không che nút
        bottom: "calc(var(--cao-thanh-duoi) + env(safe-area-inset-bottom) + 12px)",
      }}
    >
      <p className="m-0 min-w-0 flex-1 text-[length:var(--co-chu-latin-nho)] leading-snug font-semibold">
        Đã có phiên bản mới của Riyi.
      </p>
      <button
        type="button"
        onClick={taiLai}
        disabled={dangTai}
        className="border-nhan bg-nhan text-chu-tren-nhan shrink-0 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-bold disabled:opacity-60"
      >
        {dangTai ? "Đang tải lại..." : "Tải lại để cập nhật"}
      </button>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   MÀN HÌNH MẤT MẠNG
   Quy tắc dự án: app cần mạng, không làm chức năng học offline. Mất mạng thì
   báo rõ bằng tiếng Việt. Mọi thứ đang làm vẫn giữ nguyên bên dưới, có mạng lại
   thì màn này tự biến mất và học tiếp được ngay.
   ----------------------------------------------------------------------------- */
export function ManMatMang() {
  const [matMang, setMatMang] = useState(() => !navigator.onLine);

  useEffect(() => {
    const khiMat = () => setMatMang(true);
    const khiCo = () => setMatMang(false);
    window.addEventListener("offline", khiMat);
    window.addEventListener("online", khiCo);
    return () => {
      window.removeEventListener("offline", khiMat);
      window.removeEventListener("online", khiCo);
    };
  }, []);

  if (!matMang) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="tieu-de-mat-mang"
      className="bg-nen fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <MatTroi dat={false} rong={120} />
      <h1 id="tieu-de-mat-mang" className="m-0 text-[1.25rem] font-bold">
        Cần kết nối mạng để sử dụng Riyi.
      </h1>
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
        Hãy bật wifi hoặc dữ liệu di động. Có mạng trở lại thì bạn học tiếp
        được ngay, không mất bài đang làm.
      </p>
    </div>
  );
}
