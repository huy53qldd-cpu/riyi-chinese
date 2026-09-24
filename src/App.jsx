/* =============================================================================
   RIYI — THÀNH PHẦN GỐC
   =============================================================================

   Quyết định đang hiển thị màn hình nào.

   Các màn hình:
       chon-khoa-hoc  →  khung-app       (bấm khoá 1)
       chon-khoa-hoc  →  dang-nang-cap   (bấm khoá 2 hoặc 3)
       chon-khoa-hoc  →  cai-dat         (bấm biểu tượng bánh răng)
   (Trong khung-app, Cài đặt mở ngay bên trong để không mất tab đang xem.)

   Chưa dùng thư viện điều hướng (router) vì mới có 3 màn hình, thêm thư viện
   lúc này là thừa. Khi số màn hình nhiều lên thì sẽ cân nhắc lại.
   ============================================================================= */

import { useState } from "react";

import ChonKhoaHoc from "./man-hinh/ChonKhoaHoc.jsx";
import DangNangCap from "./man-hinh/DangNangCap.jsx";
import CaiDat from "./man-hinh/CaiDat.jsx";
import KhungApp from "./man-hinh/KhungApp.jsx";
import { NguoiDungProvider } from "./nguoi-dung/NguoiDung.jsx";
import { KhoThongBao } from "./thanh-phan/ThongBao.jsx";
import PhaoHoa from "./thanh-phan/PhaoHoa.jsx";
import { DaiBanMoi, ManMatMang } from "./pwa/ThongBaoPwa.jsx";

const MAN_HINH = {
  CHON_KHOA: "chon-khoa-hoc",
  KHUNG_APP: "khung-app",
  NANG_CAP: "dang-nang-cap",
  CAI_DAT: "cai-dat",
};

export default function App() {
  const [manHinh, setManHinh] = useState(MAN_HINH.CHON_KHOA);
  const veChonKhoa = () => setManHinh(MAN_HINH.CHON_KHOA);

  return (
    // KhoThongBao bọc ngoài cùng để màn hình nào cũng hiện thông báo được.
    // NguoiDungProvider nằm trong nó vì cần hiện thông báo lỗi đăng nhập/lưu.
    <KhoThongBao>
      <NguoiDungProvider>
        {manHinh === MAN_HINH.CHON_KHOA && (
          <ChonKhoaHoc
            chonKhoa={() => setManHinh(MAN_HINH.KHUNG_APP)}
            moNangCap={() => setManHinh(MAN_HINH.NANG_CAP)}
            moCaiDat={() => setManHinh(MAN_HINH.CAI_DAT)}
          />
        )}

        {manHinh === MAN_HINH.KHUNG_APP && <KhungApp thoatKhoa={veChonKhoa} />}

        {manHinh === MAN_HINH.NANG_CAP && <DangNangCap quayLai={veChonKhoa} />}

        {manHinh === MAN_HINH.CAI_DAT && <CaiDat quayLai={veChonKhoa} />}

        {/* Hiện trên mọi màn hình: pháo hoa (theme Hoa Đăng Dạ Nguyệt), báo bản mới, mất mạng */}
        <PhaoHoa />
        <DaiBanMoi />
        <ManMatMang />
      </NguoiDungProvider>
    </KhoThongBao>
  );
}
