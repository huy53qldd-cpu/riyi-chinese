/* =============================================================================
   GỬI THÔNG BÁO (GĐ 11 quyết định 18.40; cron-job.org quyết định 18.57)
   =============================================================================

   Chạy trên GitHub Actions (.github/workflows/thong-bao.yml). Lịch cron của
   GitHub hay trễ 3–5 tiếng, nên người "bấm nút" nay là cron-job.org: cứ 5 phút
   gọi GitHub chạy file này MỘT lần ở chế độ --tu-dong. Mỗi lần chạy:
     1. Gửi các thông báo QUẢN TRỊ đang chờ (collection thongBaoCho, do tài
        khoản quản trị soạn trong Cài đặt). Tới máy mọi người sau ~1–6 phút.
     2. Nếu vừa qua 7h / 14h / 21h (giờ VN) mà khung đó hôm nay chưa gửi thì gửi
        nhắc học. Khung đã gửi được ghi ở heThong/nhacHoc để không gửi lặp.
   Toàn bộ đều miễn phí (gói Firebase Spark, GitHub Actions kho công khai).

   CẦN GitHub Secret FIREBASE_SERVICE_ACCOUNT (nội dung file JSON của service
   account), xem tai-lieu/HUONG-DAN-THONG-BAO.md.

   CÁCH CHẠY:
     node gui.js --tu-dong          việc của cron-job.org (hàng chờ + nhắc học)
     node gui.js --tu-dong --thu    như trên nhưng CHỈ IN RA, không gửi
     node gui.js --khung 14h        gửi ngay nhắc học một khung (chạy tay)
     node gui.js --khung 14h --thu  chỉ in ra nội dung sẽ gửi

   Người nào TẮT thông báo hoặc chưa cho phép thì không có token, không gửi.
   Token hỏng (người dùng gỡ app, xoá quyền) thì tự xoá khỏi Firestore.
   ============================================================================= */

import { readFile } from "node:fs/promises";
import { argv, env, exit } from "node:process";

import { khungDenHan, ngayCuaKhung, soanCho } from "./soanThongBao.js";

const BANG_NGAY_DAC_BIET = new URL("../../public/du-lieu/ngay-dac-biet.json", import.meta.url);
const MOT_GIO = 3600;

function thamSo(ten) {
  const i = argv.indexOf(`--${ten}`);
  return i >= 0 ? argv[i + 1] : null;
}

const CHI_THU = argv.includes("--thu");
const TU_DONG = argv.includes("--tu-dong");

/** Nạp Firebase Admin bằng khoá service account. Chạy thử không cần khoá thì trả null. */
async function ketNoi() {
  const chungChi = env.FIREBASE_SERVICE_ACCOUNT;
  if (!chungChi) return null;
  // Nạp thư viện lúc này thôi, để chạy thử không cần cài gì
  const [{ cert, initializeApp }, { getFirestore, FieldPath, FieldValue }, { getMessaging }] =
    await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/firestore"),
      import("firebase-admin/messaging"),
    ]);
  initializeApp({ credential: cert(JSON.parse(chungChi)) });
  return { kho: getFirestore(), tin: getMessaging(), FieldPath, FieldValue };
}

/**
 * Gửi một thông báo tới MỌI người đã bật thông báo.
 * @param {object} fb  Kết quả của ketNoi()
 * @param {(du: object) => {tieuDe: string, than: string}} taoNoiDung  Soạn cho từng người
 * @param {number} ttl  Giữ tin tối đa bao nhiêu giây nếu máy đang mất mạng
 */
async function guiChoMoiNguoi(fb, taoNoiDung, ttl) {
  const { kho, tin, FieldPath, FieldValue } = fb;
  const cac = await kho.collection("nguoiDung").where("thongBao.bat", "==", true).get();
  const kq = { soNguoi: 0, daGui: 0, hong: 0, loi: 0 };

  for (const tep of cac.docs) {
    const du = tep.data();
    const token = Object.keys(du.thongBao?.token ?? {});
    const { tieuDe, than } = taoNoiDung(du);
    console.log(`  ${tep.id} | ${token.length} thiết bị | ${tieuDe} | ${than}`);
    if (CHI_THU || token.length === 0) continue;
    kq.soNguoi += 1;

    // Gửi dạng "data": service worker của Riyi tự vẽ thông báo (src/pwa/sw.js).
    // Urgency "high" để điện thoại đang ngủ (tiết kiệm pin) vẫn hiện ngay.
    const traLoi = await tin.sendEach(
      token.map((t) => ({
        token: t,
        data: { tieuDe, than, duongDan: "/" },
        webpush: { headers: { Urgency: "high", TTL: String(ttl) } },
      })),
    );
    for (const [i, r] of traLoi.responses.entries()) {
      if (r.success) {
        kq.daGui += 1;
        continue;
      }
      const ma = r.error?.code ?? "";
      // Token chết: xoá đi cho lần sau khỏi gửi lại
      if (ma.includes("registration-token-not-registered") || ma.includes("invalid-argument")) {
        await tep.ref.update(new FieldPath("thongBao", "token", token[i]), FieldValue.delete());
        kq.hong += 1;
      } else {
        kq.loi += 1;
        console.error(`  Lỗi gửi cho ${tep.id}:`, ma);
      }
    }
  }
  return kq;
}

/** Soạn nội dung nhắc học của khung `khung` ngày `ngay` cho từng người. */
async function taoNhacHoc(khung, ngay) {
  const bangNgay = JSON.parse(await readFile(BANG_NGAY_DAC_BIET, "utf8"));
  return (du) => soanCho(khung, { ngay, loTrinh: du.loTrinh, ngayDacBiet: bangNgay.danhSach });
}

/** Việc 1 của --tu-dong: gửi các thông báo quản trị đang chờ, cũ trước mới sau. */
async function guiHangCho(fb) {
  const { kho, FieldValue } = fb;
  // Không dùng orderBy để khỏi phải tạo chỉ mục (index) trên Firestore
  const cho = await kho.collection("thongBaoCho").where("trangThai", "==", "cho").get();
  const ds = cho.docs.sort((a, b) => (a.get("taoLuc")?.toMillis() ?? 0) - (b.get("taoLuc")?.toMillis() ?? 0));
  console.log(`Hàng chờ quản trị: ${ds.length} thông báo`);

  for (const tep of ds) {
    const { tieuDe, than } = tep.data();
    if (CHI_THU) {
      console.log(`  (chạy thử) ${tieuDe} | ${than}`);
      continue;
    }
    // Đánh dấu "đang gửi" TRƯỚC, để lỡ có hai lần chạy chồng nhau cũng không gửi đôi
    const nhan = await kho.runTransaction(async (gd) => {
      const moi = await gd.get(tep.ref);
      if (moi.get("trangThai") !== "cho") return false;
      gd.update(tep.ref, { trangThai: "dang-gui" });
      return true;
    });
    if (!nhan) continue;
    const kq = await guiChoMoiNguoi(fb, () => ({ tieuDe, than }), 24 * MOT_GIO);
    await tep.ref.update({ trangThai: "da-gui", guiLuc: FieldValue.serverTimestamp(), ketQua: kq });
    console.log(`  Đã gửi "${tieuDe}":`, kq);
  }
}

/** Việc 2 của --tu-dong: gửi nhắc học nếu có khung tới hạn mà chưa gửi. */
async function guiNhacHocDenHan(fb) {
  const { kho, FieldValue } = fb;
  const moc = kho.doc("heThong/nhacHoc");
  const daGui = (await moc.get()).get("daGui") ?? {};
  const denHan = khungDenHan(new Date(), daGui);
  if (!denHan) {
    console.log("Nhắc học: chưa tới khung nào (hoặc đã gửi rồi).");
    return;
  }
  const { khung, ngay, khoa } = denHan;
  console.log(`Nhắc học khung ${khung} ngày ${ngay}:`);
  const kq = await guiChoMoiNguoi(fb, await taoNhacHoc(khung, ngay), 3 * MOT_GIO);
  if (CHI_THU) return;
  // Ghi khung vừa gửi; giữ lại 9 khung gần nhất (3 ngày) cho gọn
  const giu = Object.keys(daGui).sort().slice(-8);
  const moi = Object.fromEntries(giu.map((k) => [k, daGui[k]]));
  moi[khoa] = { luc: FieldValue.serverTimestamp(), ...kq };
  await moc.set({ daGui: moi });
  console.log("  Kết quả:", kq);
}

async function main() {
  const fb = await ketNoi();

  if (TU_DONG) {
    if (!fb) {
      console.error("Thiếu FIREBASE_SERVICE_ACCOUNT. Xem tai-lieu/HUONG-DAN-THONG-BAO.md.");
      exit(1);
    }
    await guiHangCho(fb);
    await guiNhacHocDenHan(fb);
    return;
  }

  // Chạy tay một khung nhắc học
  const khung = thamSo("khung");
  if (!["7h", "14h", "21h"].includes(khung)) {
    console.error("Cần --tu-dong, hoặc --khung 7h / 14h / 21h.");
    exit(1);
  }
  const ngay = thamSo("ngay") ?? ngayCuaKhung(khung);
  const taoNoiDung = await taoNhacHoc(khung, ngay);

  // Chạy thử mà chưa có khoá: dùng vài người dùng GIẢ để xem nội dung sẽ gửi.
  // Nhờ vậy kiểm tra được câu chữ mà không cần đụng vào dữ liệu thật.
  if (!fb) {
    if (!CHI_THU) {
      console.error("Thiếu FIREBASE_SERVICE_ACCOUNT. Xem tai-lieu/HUONG-DAN-THONG-BAO.md.");
      exit(1);
    }
    const nguoiGia = [
      { id: "nguoi-mau-chua-hoc", loTrinh: { ngay, buoc: [] } },
      { id: "nguoi-mau-nua-chung", loTrinh: { ngay, buoc: ["chu-tap-viet", "chu-lat-the", "tu-the", "tu-trac-nghiem"] } },
      { id: "nguoi-mau-gan-xong", loTrinh: { ngay, buoc: Array.from({ length: 7 }, (_, i) => `b${i}`) } },
      { id: "nguoi-mau-xong-het", loTrinh: { ngay, buoc: Array.from({ length: 9 }, (_, i) => `b${i}`) } },
      { id: "nguoi-mau-bo-tu-hom-qua", loTrinh: { ngay: "2000-01-01", buoc: ["chu-tap-viet"] } },
    ];
    console.log(`Chạy thử (chưa có khoá), khung ${khung}, ngày ${ngay}:\n`);
    for (const n of nguoiGia) {
      const nd = taoNoiDung({ loTrinh: n.loTrinh });
      console.log(`  ${n.id}\n    ${nd.tieuDe}\n    ${nd.than}\n`);
    }
    return;
  }

  console.log(`Khung ${khung}, ngày ${ngay}:`);
  const kq = await guiChoMoiNguoi(fb, taoNoiDung, 3 * MOT_GIO);
  console.log(CHI_THU ? "Chạy thử, chưa gửi gì." : `Kết quả: ${JSON.stringify(kq)}`);
}

main().catch((loi) => {
  console.error(loi);
  exit(1);
});
