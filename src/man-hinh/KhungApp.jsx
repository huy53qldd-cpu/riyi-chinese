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

   GIAI ĐOẠN 0: nội dung các tab còn TRỐNG, chỉ có tên tab và mô tả.
   Nội dung thật làm lần lượt ở GĐ 1 đến GĐ 7.
   ============================================================================= */

import { useState } from "react";

import ThanhTren from "../thanh-phan/ThanhTren.jsx";
import ThanhDuoi from "../thanh-phan/ThanhDuoi.jsx";
import NutLoa from "../thanh-phan/NutLoa.jsx";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import { TAB, timTab } from "../thanh-phan/danhSachTab.jsx";
import KiemTraFont from "./KiemTraFont.jsx";

export default function KhungApp({ thoatKhoa }) {
  const [tabDangMo, setTabDangMo] = useState(TAB.CHU_HAN);

  // TẠM THỜI cho GĐ 0: công tắc giả lập đăng nhập, để xem được thanh trên ở
  // cả hai trạng thái. Sẽ gỡ bỏ khi làm xong GĐ 6.
  const [gialapDangNhap, setGialapDangNhap] = useState(true);

  const tab = timTab(tabDangMo);

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
        daDangNhap={gialapDangNhap}
        daLam={12}
        mucTieu={20}
        moMucTieu={() => setTabDangMo(TAB.MUC_TIEU)}
      />

      <main className="px-5 pt-5">
        {tabDangMo === TAB.MUC_TIEU ? (
          <NoiDungMucTieu quayLai={() => setTabDangMo(TAB.CHU_HAN)} />
        ) : (
          <NoiDungTabTrong tab={tab} />
        )}

        {/* Ô kiểm tra font chỉ hiện ở tab đầu, là tiêu chí nghiệm thu GĐ 0 */}
        {tabDangMo === TAB.CHU_HAN && (
          <div className="mt-5 flex flex-col gap-5">
            <KiemTraFont />
            <ThuHienThi />
          </div>
        )}

        {/* --- Khu vực tạm thời của GĐ 0, sẽ gỡ sau --- */}
        <section className="border-vien mt-6 rounded-[var(--bo-goc)] border border-dashed p-4">
          <h2 className="text-chu-mo m-0 mb-3 text-[length:var(--co-chu-latin-nho)] font-bold">
            Khu vực tạm thời của giai đoạn 0
          </h2>

          <label className="flex cursor-pointer items-center gap-2.5 text-[length:var(--co-chu-latin-nho)]">
            <input
              type="checkbox"
              checked={gialapDangNhap}
              onChange={(e) => setGialapDangNhap(e.target.checked)}
              className="accent-nhan h-4 w-4"
            />
            Giả lập đã đăng nhập (để xem thanh "Mục tiêu hôm nay")
          </label>

          <button
            type="button"
            onClick={thoatKhoa}
            className="border-vien mt-3 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
          >
            Về màn hình chọn khoá học
          </button>
        </section>
      </main>

      <ThanhDuoi tabDangMo={tabDangMo} doiTab={setTabDangMo} />
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Nội dung tạm của một tab chưa làm
   ----------------------------------------------------------------------------- */
function NoiDungTabTrong({ tab }) {
  if (!tab) return null;

  const thuTuGiaiDoan = {
    [TAB.CHU_HAN]: "giai đoạn 1 và 2",
    [TAB.DONG_TU]: "giai đoạn 3",
    [TAB.TU_VUNG]: "giai đoạn 4",
    [TAB.NGU_PHAP]: "giai đoạn 5",
    [TAB.REVIEW]: "giai đoạn 7",
  };

  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        {tab.nhanDay}
      </h1>
      <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        {tab.moTa}
      </p>

      <div className="border-vien bg-nen-phu mt-4 rounded-[var(--bo-goc)] border border-dashed p-6 text-center">
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
          Nội dung tab này sẽ được làm ở {thuTuGiaiDoan[tab.ma]}.
        </p>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
   Nội dung tạm của tab Mục tiêu hôm nay
   ----------------------------------------------------------------------------- */
function NoiDungMucTieu({ quayLai }) {
  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Mục tiêu hôm nay
      </h1>
      <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        Đặt mục tiêu mỗi ngày theo số chữ Hán, số từ hoặc số phút. Đạt mục tiêu
        thì mặt trời Riyi sẽ toả sáng.
      </p>

      <div className="border-vien bg-nen-phu mt-4 rounded-[var(--bo-goc)] border border-dashed p-6 text-center">
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
          Nội dung tab này sẽ được làm ở giai đoạn 7.
        </p>
      </div>

      <button
        type="button"
        onClick={quayLai}
        className="border-vien mt-4 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
      >
        Quay lại
      </button>
    </section>
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
