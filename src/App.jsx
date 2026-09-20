/* =============================================================================
   RIYI — THÀNH PHẦN GỐC
   =============================================================================

   Quyết định đang hiển thị màn hình nào.

   GIAI ĐOẠN 0 chỉ có 3 màn hình:
       chon-khoa-hoc  →  khung-app       (bấm khoá 1)
       chon-khoa-hoc  →  dang-nang-cap   (bấm khoá 2 hoặc 3)

   Chưa dùng thư viện điều hướng (router) vì mới có 3 màn hình, thêm thư viện
   lúc này là thừa. Khi số màn hình nhiều lên thì sẽ cân nhắc lại.
   ============================================================================= */

import { useState } from "react";

import ChonKhoaHoc from "./man-hinh/ChonKhoaHoc.jsx";
import DangNangCap from "./man-hinh/DangNangCap.jsx";
import KhungApp from "./man-hinh/KhungApp.jsx";
import { KhoThongBao } from "./thanh-phan/ThongBao.jsx";

const MAN_HINH = {
  CHON_KHOA: "chon-khoa-hoc",
  KHUNG_APP: "khung-app",
  NANG_CAP: "dang-nang-cap",
};

export default function App() {
  const [manHinh, setManHinh] = useState(MAN_HINH.CHON_KHOA);

  return (
    // KhoThongBao bọc ngoài cùng để màn hình nào cũng hiện thông báo được
    <KhoThongBao>
      {manHinh === MAN_HINH.CHON_KHOA && (
        <ChonKhoaHoc
          chonKhoa={() => setManHinh(MAN_HINH.KHUNG_APP)}
          moNangCap={() => setManHinh(MAN_HINH.NANG_CAP)}
        />
      )}

      {manHinh === MAN_HINH.KHUNG_APP && (
        <KhungApp thoatKhoa={() => setManHinh(MAN_HINH.CHON_KHOA)} />
      )}

      {manHinh === MAN_HINH.NANG_CAP && (
        <DangNangCap quayLai={() => setManHinh(MAN_HINH.CHON_KHOA)} />
      )}
    </KhoThongBao>
  );
}
