/* =============================================================================
   CHUẨN BỊ TRƯỚC KHI ĐƯA HÀM LÊN MÁY CHỦ (quyết định 18.56)
   =============================================================================

   Firebase chỉ tải thư mục functions/ lên máy chủ, nhưng phần soạn nội dung
   thông báo và mã tài khoản quản trị đang nằm ở chỗ khác trong dự án (để app
   và công cụ chạy thử cùng dùng). File này CHÉP các file đó vào functions/chung/
   theo đúng cấu trúc thư mục gốc, nhờ vậy các dòng import bên trong vẫn đúng.

   Tự chạy trước mỗi lần deploy (firebase.json → functions.predeploy).
   Không sửa file trong functions/chung/: nó bị ghi đè mỗi lần deploy.
   ============================================================================= */

import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THU_MUC_HAM = dirname(fileURLToPath(import.meta.url));
const GOC = join(THU_MUC_HAM, "..");
const DICH = join(THU_MUC_HAM, "chung");

const CAC_FILE = [
  "cong-cu/thong-bao/soanThongBao.js", // soạn nội dung 7h / 14h / 21h
  "src/luyen-tap/cacBuoc.js", // số bước mỗi bài (soanThongBao.js cần)
  "src/thong-bao/quanTri.js", // mã tài khoản quản trị
  "public/du-lieu/ngay-dac-biet.json", // ngày đặc biệt cho câu chào 7h
];

rmSync(DICH, { recursive: true, force: true });
for (const tep of CAC_FILE) {
  mkdirSync(dirname(join(DICH, tep)), { recursive: true });
  cpSync(join(GOC, tep), join(DICH, tep));
}
console.log(`Đã chép ${CAC_FILE.length} file dùng chung vào functions/chung/`);
