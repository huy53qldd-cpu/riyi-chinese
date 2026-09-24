/* =============================================================================
   KHUNG APP — 6 TAB
   =============================================================================

   Bố cục đã chốt:

       ┌─────────────────────────────┐
       │  ☀ Mục tiêu hôm nay   12/20 │  ← thanh trên (tab thứ 6)
       ├─────────────────────────────┤
       │                             │
       │      nội dung tab            │
       │                             │
       ├─────────────────────────────┤
       │  5 mục điều hướng            │  ← thanh dưới
       └─────────────────────────────┘

   Đã có đủ 6 tab: Tab A chữ Hán (GĐ 1-2), Tab B đồng tự dị nghĩa (GĐ 3),
   Tab C từ vựng (GĐ 4), Tab F ngữ pháp (GĐ 5), Tab D mục tiêu và Tab E review
   (GĐ 7).
   ============================================================================= */

import { useState } from "react";

import CaiDat from "./CaiDat.jsx";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import ThanhTren from "../thanh-phan/ThanhTren.jsx";
import ThanhDuoi from "../thanh-phan/ThanhDuoi.jsx";
import DenLongTreo from "../thanh-phan/DenLongTreo.jsx";
import { TAB } from "../thanh-phan/danhSachTab.jsx";
import TabChuHan from "./TabChuHan.jsx";
import TabNguPhap from "./TabNguPhap.jsx";
import TabTuVung from "./TabTuVung.jsx";
import TabMucTieu from "./TabMucTieu.jsx";
import TabKhamPha from "./TabKhamPha.jsx";
import TabPhatAm from "./TabPhatAm.jsx";

export default function KhungApp({ thoatKhoa }) {
  const [tabDangMo, setTabDangMo] = useState(TAB.CHU_HAN);

  // Cài đặt mở ngay trong khung này (không đổi màn hình) để không mất tab đang xem
  const [dangMoCaiDat, setDangMoCaiDat] = useState(false);
  const nd = useNguoiDung();

  if (dangMoCaiDat) {
    // "Đổi khoá học" chuyển vào đây (quyết định 18.42), không còn ở dưới mỗi tab
    return <CaiDat quayLai={() => setDangMoCaiDat(false)} thoatKhoa={thoatKhoa} />;
  }

  return (
    <div
      className="mx-auto w-full max-w-xl"
      style={{
        // Chừa chỗ cho hai thanh cố định, để nội dung không bị che
        paddingTop: "calc(var(--cao-thanh-tren) + env(safe-area-inset-top))",
        paddingBottom:
          "calc(var(--cao-thanh-duoi) + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      <ThanhTren
        daDangNhap={nd.daDangNhap}
        tienDo={nd.tienDoHomNay}
        lanVuaDat={nd.lanVuaDat}
        moMucTieu={() => setTabDangMo(TAB.MUC_TIEU)}
        moCaiDat={() => setDangMoCaiDat(true)}
      />

      <main className="px-5 pt-5">
        {tabDangMo === TAB.MUC_TIEU ? (
          <TabMucTieu quayLai={() => setTabDangMo(TAB.CHU_HAN)} />
        ) : tabDangMo === TAB.PHAT_AM ? (
          <TabPhatAm />
        ) : tabDangMo === TAB.CHU_HAN ? (
          <TabChuHan />
        ) : tabDangMo === TAB.TU_VUNG ? (
          <TabTuVung />
        ) : tabDangMo === TAB.NGU_PHAP ? (
          <TabNguPhap />
        ) : (
          <TabKhamPha />
        )}
      </main>

      {/* Đèn lồng treo lắc lư dưới thanh trên, chỉ hiện ở theme Hoa Đăng Dạ Nguyệt */}
      <DenLongTreo />

      <ThanhDuoi tabDangMo={tabDangMo} doiTab={setTabDangMo} />
    </div>
  );
}
