/* =============================================================================
   GỬI THÔNG BÁO NHẮC HỌC (GĐ 11, quyết định 18.40)
   =============================================================================

   TỪ QUYẾT ĐỊNH 18.56: việc gửi hằng ngày do Cloud Functions làm, đúng giờ
   (functions/index.js). File này chỉ còn là CÔNG CỤ THỬ chạy tay trên máy hoặc
   qua nút "Run workflow" của GitHub Actions (đã bỏ lịch tự chạy). Nó đọc
   Firestore rồi gửi qua Firebase Cloud Messaging, cùng nội dung với máy chủ.

   CẦN HAI BÍ MẬT (GitHub Secrets), xem tai-lieu/HUONG-DAN-THONG-BAO.md:
     FIREBASE_SERVICE_ACCOUNT  nội dung file JSON của service account
     (VAPID key không cần ở đây, nó nằm trong .env của app)

   CÁCH CHẠY:
     node gui.js            gửi thật, khung giờ tự tính theo giờ Việt Nam
     node gui.js --thu      CHỈ IN RA, không gửi (dryRun)
     node gui.js --khung 14h --thu    thử một khung giờ bất kỳ

   Người nào TẮT thông báo hoặc chưa cho phép thì không có token, không gửi.
   Token hỏng (người dùng gỡ app, xoá quyền) thì tự xoá khỏi Firestore.
   ============================================================================= */

import { readFile } from "node:fs/promises";
import { argv, env, exit } from "node:process";

import { khungGio, ngayCuaKhung, soanCho } from "./soanThongBao.js";

const BANG_NGAY_DAC_BIET = new URL("../../public/du-lieu/ngay-dac-biet.json", import.meta.url);

function thamSo(ten) {
  const i = argv.indexOf(`--${ten}`);
  return i >= 0 ? argv[i + 1] : null;
}

const CHI_THU = argv.includes("--thu");

async function main() {
  const khung = thamSo("khung") ?? khungGio();
  if (!khung) {
    console.log("Không phải khung giờ 7h / 14h / 21h (giờ Việt Nam), không gửi gì.");
    return;
  }
  // Lần chạy có thể bị GitHub làm trễ: lấy đúng ngày của khung giờ, không lấy
  // ngày lúc đang chạy (quyết định 18.48)
  const ngay = thamSo("ngay") ?? ngayCuaKhung(khung);
  const bangNgay = JSON.parse(await readFile(BANG_NGAY_DAC_BIET, "utf8"));

  const chungChi = env.FIREBASE_SERVICE_ACCOUNT;

  // Chạy thử mà chưa có khoá: dùng vài người dùng GIẢ để xem nội dung sẽ gửi.
  // Nhờ vậy kiểm tra được câu chữ mà không cần đụng vào dữ liệu thật.
  if (CHI_THU && !chungChi) {
    const nguoiGia = [
      { id: "nguoi-mau-chua-hoc", loTrinh: { ngay, buoc: [] } },
      { id: "nguoi-mau-nua-chung", loTrinh: { ngay, buoc: ["chu-tap-viet", "chu-lat-the", "tu-the", "tu-trac-nghiem"] } },
      { id: "nguoi-mau-gan-xong", loTrinh: { ngay, buoc: Array.from({ length: 7 }, (_, i) => `b${i}`) } },
      { id: "nguoi-mau-xong-het", loTrinh: { ngay, buoc: Array.from({ length: 9 }, (_, i) => `b${i}`) } },
      { id: "nguoi-mau-bo-tu-hom-qua", loTrinh: { ngay: "2000-01-01", buoc: ["chu-tap-viet"] } },
    ];
    console.log(`Chạy thử (chưa có khoá), khung ${khung}, ngày ${ngay}:\n`);
    for (const n of nguoiGia) {
      const nd = soanCho(khung, { ngay, loTrinh: n.loTrinh, ngayDacBiet: bangNgay.danhSach });
      console.log(`  ${n.id}`);
      console.log(`    ${nd.tieuDe}`);
      console.log(`    ${nd.than}\n`);
    }
    return;
  }

  if (!chungChi) {
    console.error("Thiếu FIREBASE_SERVICE_ACCOUNT. Xem tai-lieu/HUONG-DAN-THONG-BAO.md.");
    exit(1);
  }
  // Nạp thư viện Firebase Admin lúc này thôi, để chạy thử không cần cài gì
  const [{ cert, initializeApp }, { getFirestore, FieldValue }, { getMessaging }] =
    await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/firestore"),
      import("firebase-admin/messaging"),
    ]);
  initializeApp({ credential: cert(JSON.parse(chungChi)) });
  const kho = getFirestore();
  const tin = getMessaging();

  // Chỉ lấy người đã BẬT thông báo (trường thongBao.bat = true)
  const cac = await kho.collection("nguoiDung").where("thongBao.bat", "==", true).get();
  console.log(`Khung ${khung}, ngày ${ngay}, ${cac.size} người đã bật thông báo`);

  let daGui = 0;
  let hong = 0;
  for (const tep of cac.docs) {
    const du = tep.data();
    const token = Object.keys(du.thongBao?.token ?? {});
    const noiDung = soanCho(khung, {
      ngay,
      loTrinh: du.loTrinh,
      ngayDacBiet: bangNgay.danhSach,
    });
    console.log(`  ${tep.id} | ${token.length} thiết bị | ${noiDung.tieuDe} | ${noiDung.than}`);
    if (CHI_THU || token.length === 0) continue;

    for (const t of token) {
      try {
        // Gửi dạng "data": service worker của Riyi tự vẽ thông báo, nhờ vậy
        // bấm vào là mở đúng màn hình học của hôm nay.
        await tin.send({
          token: t,
          data: { tieuDe: noiDung.tieuDe, than: noiDung.than, duongDan: "/" },
          webpush: { headers: { Urgency: "normal", TTL: "3600" } },
        });
        daGui += 1;
      } catch (loi) {
        const ma = loi?.errorInfo?.code ?? "";
        // Token chết: xoá đi cho lần sau khỏi gửi lại
        if (ma.includes("registration-token-not-registered") || ma.includes("invalid-argument")) {
          await tep.ref.update({ [`thongBao.token.${t}`]: FieldValue.delete() });
          hong += 1;
        } else {
          console.error(`  Lỗi gửi cho ${tep.id}:`, ma || loi);
        }
      }
    }
  }
  console.log(CHI_THU ? "Chạy thử, chưa gửi gì." : `Đã gửi ${daGui} thông báo, xoá ${hong} token hỏng.`);
}

main().catch((loi) => {
  console.error(loi);
  exit(1);
});
