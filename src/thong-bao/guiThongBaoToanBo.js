/* =============================================================================
   QUẢN TRỊ GỬI THÔNG BÁO CHO MỌI NGƯỜI (quyết định 18.56, 18.57)
   =============================================================================

   App KHÔNG tự gửi được, vì gửi thông báo cần khoá bí mật chỉ nằm trên GitHub.
   Nên app chỉ CẤT thông báo vào hàng chờ Firestore: thongBaoCho/{tự sinh} =
   { tieuDe, than, taoLuc, trangThai: "cho" }. Cứ 5 phút cron-job.org gọi
   GitHub chạy cong-cu/thong-bao/gui.js, file đó gửi đi rồi đổi trangThai
   thành "da-gui" kèm kết quả. Vì vậy tin tới máy mọi người sau khoảng 1–6 phút.

   Chỉ tài khoản quản trị ghi / đọc được hàng chờ: firestore.rules chặn mọi
   tài khoản khác, dù ai sửa app cho hiện khung gửi cũng vô ích.
   ============================================================================= */

import { layDichVu } from "../firebase/khoiTao.js";

const HANG_CHO = "thongBaoCho";

/**
 * Cất một thông báo vào hàng chờ.
 * @returns {Promise<{thanhCong: boolean, thongBao?: string}>}
 */
export async function guiThongBaoToanBo(tieuDe, than) {
  try {
    const [{ db }, { addDoc, collection, serverTimestamp }] = await Promise.all([
      layDichVu(),
      import("firebase/firestore"),
    ]);
    await addDoc(collection(db, HANG_CHO), {
      tieuDe,
      than,
      taoLuc: serverTimestamp(),
      trangThai: "cho",
    });
    return { thanhCong: true };
  } catch (loi) {
    if (String(loi?.code ?? "").endsWith("permission-denied")) {
      return { thanhCong: false, thongBao: "Chỉ tài khoản quản trị mới được gửi thông báo." };
    }
    return { thanhCong: false, thongBao: "Chưa gửi được. Hãy kiểm tra mạng rồi thử lại." };
  }
}

/**
 * Theo dõi 5 thông báo quản trị gần nhất (đang chờ hay đã gửi, gửi tới bao
 * nhiêu thiết bị). Trả về hàm huỷ theo dõi.
 * @param {(ds: Array<{id: string, tieuDe: string, than: string, trangThai: string, taoLuc: Date|null, ketQua?: object}>) => void} khiDoi
 */
export function theoDoiThongBaoGanDay(khiDoi) {
  let huy = () => {};
  let daHuy = false;
  (async () => {
    try {
      const [{ db }, { collection, limit, onSnapshot, orderBy, query }] = await Promise.all([
        layDichVu(),
        import("firebase/firestore"),
      ]);
      if (daHuy) return;
      huy = onSnapshot(
        query(collection(db, HANG_CHO), orderBy("taoLuc", "desc"), limit(5)),
        (anh) =>
          khiDoi(
            anh.docs.map((d) => ({
              id: d.id,
              ...d.data(),
              taoLuc: d.get("taoLuc")?.toDate?.() ?? null,
            })),
          ),
        () => khiDoi([]),
      );
    } catch {
      khiDoi([]);
    }
  })();
  return () => {
    daHuy = true;
    huy();
  };
}
