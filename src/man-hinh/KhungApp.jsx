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
import NutLoa from "../thanh-phan/NutLoa.jsx";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import { TAB } from "../thanh-phan/danhSachTab.jsx";
import KiemTraFont from "./KiemTraFont.jsx";
import TabChuHan from "./TabChuHan.jsx";
import TabDongTu from "./TabDongTu.jsx";
import TabNguPhap from "./TabNguPhap.jsx";
import TabTuVung from "./TabTuVung.jsx";
import TabMucTieu from "./TabMucTieu.jsx";
import TabReview from "./TabReview.jsx";

export default function KhungApp({ thoatKhoa }) {
  const [tabDangMo, setTabDangMo] = useState(TAB.CHU_HAN);

  // Cài đặt mở ngay trong khung này (không đổi màn hình) để không mất tab đang xem
  const [dangMoCaiDat, setDangMoCaiDat] = useState(false);
  const nd = useNguoiDung();

  if (dangMoCaiDat) {
    return <CaiDat quayLai={() => setDangMoCaiDat(false)} />;
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
        ) : tabDangMo === TAB.CHU_HAN ? (
          <TabChuHan />
        ) : tabDangMo === TAB.DONG_TU ? (
          <TabDongTu />
        ) : tabDangMo === TAB.TU_VUNG ? (
          <TabTuVung />
        ) : tabDangMo === TAB.NGU_PHAP ? (
          <TabNguPhap />
        ) : (
          <TabReview />
        )}

        {/* Ô kiểm tra font chỉ hiện ở tab đầu, là tiêu chí nghiệm thu GĐ 0 */}
        {tabDangMo === TAB.CHU_HAN && (
          <div className="mt-5 flex flex-col gap-5">
            <KiemTraFont />
            <ThuHienThi />
          </div>
        )}

        <button
          type="button"
          onClick={thoatKhoa}
          className="border-vien mt-6 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          Đổi khoá học
        </button>
      </main>

      <ThanhDuoi tabDangMo={tabDangMo} doiTab={setTabDangMo} />
    </div>
  );
}

/* -----------------------------------------------------------------------------
   THỬ HIỂN THỊ — kiểm tra pinyin ruby, furigana và nút loa có chạy đúng không
   Đây cũng là một phần của nghiệm thu GĐ 0. Sẽ gỡ khi bắt đầu GĐ 1.
   ----------------------------------------------------------------------------- */
function ThuHienThi() {
  return (
    <section className="border-vien bg-nen-noi rounded-[var(--bo-goc)] border p-4">
      <h2 className="m-0 mb-1 text-[length:var(--co-chu-latin)] font-bold">
        Thử hiển thị ba thứ tiếng
      </h2>
      <p className="text-chu-mo mt-0 mb-4 text-[length:var(--co-chu-latin-nho)]">
        Thứ tự bắt buộc: tiếng Trung → tiếng Nhật → tiếng Việt.
      </p>

      {/* 1. TIẾNG TRUNG — pinyin nằm trên từng chữ */}
      <div className="flex items-center justify-between gap-3">
        <ChuTrung
          amTiet={ghepAmTiet("我学习汉语", ["wǒ", "xué", "xí", "hàn", "yǔ"])}
        />
        <NutLoa noiDung="我学习汉语" />
      </div>

      {/* 2. TIẾNG NHẬT — furigana nằm trên chữ Hán, tắt được trong Cài đặt */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <ChuNhat noiDung="私[わたし]は中国語[ちゅうごくご]を勉強[べんきょう]します" />
        <NutLoa noiDung="私は中国語を勉強します" ngonNgu="ja-JP" />
      </div>

      {/* 3. TIẾNG VIỆT */}
      <p className="mt-2 mb-0 text-[length:var(--co-chu-latin)]">
        Tôi học tiếng Trung.
      </p>
    </section>
  );
}
