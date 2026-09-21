/* =============================================================================
   THANH ĐIỀU HƯỚNG DƯỚI — 5 TAB
   =============================================================================

   Đặt ở đáy màn hình, ngón cái với tới được khi cầm điện thoại một tay.
   Danh sách tab lấy từ danhSachTab.jsx, không khai báo lại ở đây.
   ============================================================================= */

import { TAB_THANH_DUOI } from "./danhSachTab.jsx";

export default function ThanhDuoi({ tabDangMo, doiTab }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="bg-nen-noi border-vien fixed inset-x-0 bottom-0 z-40 border-t"
      style={{
        // padding-bottom cộng thêm vùng an toàn của iPhone có thanh gạt dưới,
        // nếu không nút sẽ bị thanh đó che mất.
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="m-0 flex list-none items-stretch p-0">
        {TAB_THANH_DUOI.map((tab) => {
          const dangMo = tab.ma === tabDangMo;
          return (
            <li key={tab.ma} className="flex-1">
              <button
                type="button"
                onClick={() => doiTab(tab.ma)}
                // aria-current cho trình đọc màn hình biết đang ở tab nào
                aria-current={dangMo ? "page" : undefined}
                className={`flex w-full flex-col items-center justify-center gap-1 bg-transparent px-1 pt-2 pb-1.5 transition-colors ${
                  dangMo ? "text-nhan" : "text-chu-mo"
                }`}
                style={{ minHeight: "var(--cao-thanh-duoi)" }}
              >
                <tab.Icon width="1.5rem" height="1.5rem" />
                <span className="text-[0.6875rem] leading-tight font-semibold">
                  {tab.nhan}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
