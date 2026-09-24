/* =============================================================================
   TAB KHÁM PHÁ (GĐ 10, quyết định 18.31)
   =============================================================================

   Nơi gom các chức năng mở rộng, để thanh dưới chỉ còn 5 nút:
     - Đồng tự dị nghĩa (trước là một tab riêng)
     - Review cuối tuần (trước là một tab riêng)
     - Thi thử HSK (sắp có)
   Danh sách mục khai báo ở src/thanh-phan/danhSachTab.jsx (MUC_KHAM_PHA).
   ============================================================================= */

import { useState } from "react";

import { kieu } from "../luyen-tap/tienIch.js";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import { MUC_KHAM_PHA, TAB } from "../thanh-phan/danhSachTab.jsx";
import TabDongTu from "./TabDongTu.jsx";
import TabReview from "./TabReview.jsx";

export default function TabKhamPha() {
  const [dangMo, setDangMo] = useState(null);

  if (dangMo) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <button type="button" onClick={() => setDangMo(null)} className={kieu.nutPhu}>
            <BieuTuong ten="quay-lai" co={16} />
            Khám phá
          </button>
        </div>
        {dangMo === TAB.DONG_TU ? <TabDongTu /> : <TabReview />}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Khám phá</h1>
        <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          Các phần học thêm ngoài bài hằng ngày.
        </p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {MUC_KHAM_PHA.map((m) => (
          <li key={m.ma}>
            <button
              type="button"
              onClick={() => setDangMo(m.ma)}
              disabled={m.sapCo}
              className="border-vien bg-nen-noi active:bg-nhan-nhat flex w-full items-center gap-4 rounded-[var(--bo-goc)] border px-4 py-4 text-left shadow-[0_1px_3px_var(--bong)] transition-colors disabled:opacity-50 disabled:shadow-none"
            >
              <span className="bg-nhan-nhat text-nhan-chu flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--bo-goc)]">
                <m.Icon width="1.75rem" height="1.75rem" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-[length:var(--co-chu-latin)] font-bold">
                  {m.nhan}
                  {m.sapCo && (
                    <span className="bg-nen-phu text-chu-mo rounded-[var(--bo-goc-tron)] px-2 py-0.5 text-[length:0.6875rem] font-bold">
                      Sắp có
                    </span>
                  )}
                </span>
                <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] leading-snug">
                  {m.moTa}
                </span>
              </span>
              {!m.sapCo && <BieuTuong ten="sau" className="text-chu-mo" />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
