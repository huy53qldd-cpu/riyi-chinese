/* =============================================================================
   CLOUD FUNCTIONS CỦA RIYI (gói Blaze, quyết định 18.56)
   =============================================================================

   1. nhacHoc7h, nhacHoc14h, nhacHoc21h: gửi thông báo nhắc học ĐÚNG GIỜ Việt
      Nam (Cloud Scheduler). Thay cho GitHub Actions, vốn hay chạy trễ vài tiếng.
   2. guiThongBaoToanBo: CHỈ tài khoản quản trị gọi được (kiểm tra ở ĐÂY, trên
      máy chủ, không tin vào app). Gửi ngay một thông báo tự soạn tới mọi người
      đã bật thông báo. Mỗi lần gửi được ghi lại ở collection thongBaoQuanTri
      (app không đọc được collection này, xem firestore.rules).

   Người chưa bật thông báo (chưa cho phép trên máy) thì không có mã thiết bị,
   nên không thể nhận, đây là giới hạn của trình duyệt chứ không phải của app.

   Đưa lên máy chủ:  npm run trien-khai-ham   (ở thư mục gốc dự án)
   ============================================================================= */

import { readFileSync } from "node:fs";

import { initializeApp } from "firebase-admin/app";
import { FieldPath, FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger, setGlobalOptions } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { ngayVietNam, soanCho } from "./chung/cong-cu/thong-bao/soanThongBao.js";
import { laQuanTri, GIOI_HAN_THONG_BAO } from "./chung/src/thong-bao/quanTri.js";

// Singapore: gần Việt Nam nhất. App gọi hàm cũng phải dùng đúng vùng này.
setGlobalOptions({ region: "asia-southeast1", maxInstances: 2 });
initializeApp();

const MOT_GIO = 3600;

/**
 * Gửi một thông báo tới MỌI người đã bật thông báo.
 * @param {(du: object) => {tieuDe: string, than: string}} taoNoiDung
 *        Soạn nội dung cho từng người (dữ liệu nguoiDung/{uid} của người đó)
 * @param {number} ttl  Giữ tin tối đa bao nhiêu giây nếu máy đang tắt mạng
 * @returns {Promise<{soNguoi: number, daGui: number, hong: number, loi: number}>}
 */
async function guiChoMoiNguoi(taoNoiDung, ttl) {
  const kho = getFirestore();
  const tin = getMessaging();
  const cac = await kho.collection("nguoiDung").where("thongBao.bat", "==", true).get();

  const kq = { soNguoi: 0, daGui: 0, hong: 0, loi: 0 };
  for (const tep of cac.docs) {
    const du = tep.data();
    const token = Object.keys(du.thongBao?.token ?? {});
    if (token.length === 0) continue;
    kq.soNguoi += 1;

    const { tieuDe, than } = taoNoiDung(du);
    // Gửi dạng "data": service worker của Riyi tự vẽ thông báo (src/pwa/sw.js).
    // Urgency "high" để điện thoại đang ngủ (chế độ tiết kiệm pin) vẫn hiện ngay.
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
      // Mã thiết bị chết (gỡ app, xoá quyền): xoá đi cho lần sau khỏi gửi lại
      if (ma.includes("registration-token-not-registered") || ma.includes("invalid-argument")) {
        await tep.ref.update(new FieldPath("thongBao", "token", token[i]), FieldValue.delete());
        kq.hong += 1;
      } else {
        kq.loi += 1;
        logger.warn("Lỗi gửi thông báo", { nguoi: tep.id, ma });
      }
    }
  }
  return kq;
}

/** Tạo một hàm hẹn giờ nhắc học cho khung giờ `khung`, chạy lúc `gio` giờ Việt Nam. */
function lichNhacHoc(khung, gio) {
  return onSchedule(
    { schedule: `0 ${gio} * * *`, timeZone: "Asia/Ho_Chi_Minh", retryCount: 0 },
    async () => {
      const ngay = ngayVietNam();
      const bang = JSON.parse(
        readFileSync(new URL("./chung/public/du-lieu/ngay-dac-biet.json", import.meta.url), "utf8"),
      );
      const kq = await guiChoMoiNguoi(
        (du) => soanCho(khung, { ngay, loTrinh: du.loTrinh, ngayDacBiet: bang.danhSach }),
        3 * MOT_GIO,
      );
      logger.info(`Nhắc học ${khung} ngày ${ngay}`, kq);
    },
  );
}

export const nhacHoc7h = lichNhacHoc("7h", 7);
export const nhacHoc14h = lichNhacHoc("14h", 14);
export const nhacHoc21h = lichNhacHoc("21h", 21);

/** Quản trị gửi thông báo tự soạn tới mọi người, ngay lập tức. */
export const guiThongBaoToanBo = onCall(async (yeuCau) => {
  if (!laQuanTri(yeuCau.auth?.uid)) {
    throw new HttpsError("permission-denied", "Chỉ tài khoản quản trị mới được gửi thông báo.");
  }
  const tieuDe = String(yeuCau.data?.tieuDe ?? "").trim() || "Riyi";
  const than = String(yeuCau.data?.than ?? "").trim();
  if (!than) {
    throw new HttpsError("invalid-argument", "Nội dung thông báo đang trống.");
  }
  if (tieuDe.length > GIOI_HAN_THONG_BAO.tieuDe || than.length > GIOI_HAN_THONG_BAO.than) {
    throw new HttpsError("invalid-argument", "Thông báo dài quá giới hạn.");
  }

  const kq = await guiChoMoiNguoi(() => ({ tieuDe, than }), 24 * MOT_GIO);
  await getFirestore()
    .collection("thongBaoQuanTri")
    .add({ tieuDe, than, luc: FieldValue.serverTimestamp(), ...kq });
  logger.info("Quản trị gửi thông báo", { tieuDe, ...kq });
  return kq;
});
