/* =============================================================================
   THÔNG BÁO NGẮN (hiện lên rồi tự tắt)
   =============================================================================

   Dùng cho mọi lời nhắn ngắn gửi người dùng: "Chức năng phát âm đang được
   chuẩn bị.", "Đã lưu tiến độ.", "Cần kết nối mạng."...

   QUY TẮC: mọi thông báo đều bằng TIẾNG VIỆT, ngắn gọn, KHÔNG hiện mã lỗi
   tiếng Anh của Firebase hay của trình duyệt.

   Cách dùng trong màn hình bất kỳ:
       const hienThongBao = useThongBao();
       hienThongBao("Đã lưu tiến độ.");
   ============================================================================= */

import { createContext, useContext, useState, useCallback, useRef } from "react";

const BoiCanhThongBao = createContext(() => {});

/** Lấy hàm hiện thông báo. Gọi trong bất kỳ thành phần nào nằm trong app. */
export function useThongBao() {
  return useContext(BoiCanhThongBao);
}

export function KhoThongBao({ children }) {
  const [loiNhan, setLoiNhan] = useState(null);
  const dongHo = useRef(null);

  const hienThongBao = useCallback((noiDung, giay = 2.5) => {
    // Nếu đang có thông báo cũ thì huỷ hẹn giờ của nó, tránh tắt sớm cái mới
    if (dongHo.current) clearTimeout(dongHo.current);
    setLoiNhan(noiDung);
    dongHo.current = setTimeout(() => setLoiNhan(null), giay * 1000);
  }, []);

  return (
    <BoiCanhThongBao.Provider value={hienThongBao}>
      {children}

      {loiNhan && (
        <div
          // role="status" để trình đọc màn hình đọc lên cho người khiếm thị
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
          style={{ bottom: "calc(var(--cao-thanh-duoi) + 16px)" }}
        >
          <div className="bg-chu text-nen max-w-full rounded-[var(--bo-goc-tron)] px-5 py-2.5 text-center text-[length:var(--co-chu-latin)] shadow-lg">
            {loiNhan}
          </div>
        </div>
      )}
    </BoiCanhThongBao.Provider>
  );
}
