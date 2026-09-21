/* =============================================================================
   LƯU TRỮ TIẾN ĐỘ TRÊN FIRESTORE
   =============================================================================

   Firestore CHỈ lưu tiến độ và cài đặt của người dùng. Bài học nằm trong file
   JSON tĩnh, không lưu ở đây.

   Mỗi người dùng có ĐÚNG MỘT tài liệu:  nguoiDung/{uid}

       {
         caiDat:  { furigana: "bat" | "tat", giaoDien: "sang" | "toi" },
         daHoc:   { "han-0001": true, "tu-0007": true, ... },
         tapViet: { "han-0001": { trung: { soLan, tongSai, lanCuoiSai, lanCuoi },
                                  nhat:  { ... } } },
         mucTieu: { loai: "chu-han" | "tu" | "phut", soLuong: 10 },
         nhatKy:  { "2026-09-21": { dung: {...}, sai: {...}, giay, dat } },
         chuoi:   { dai: 3, ngayCuoiDat: "2026-09-21" },
         capNhatLuc: <thời điểm máy chủ>
       }

   Cấu trúc nhatKy xem ở src/nguoi-dung/nhatKy.js.

   Chỉ ghi THEO LÔ (xem NguoiDung.jsx): gom nhiều thay đổi rồi ghi một lần, để
   tiết kiệm lượt ghi của gói miễn phí.

   Quy tắc bảo mật nằm ở firestore.rules: mỗi người chỉ đọc/ghi được tài liệu
   của chính mình.
   ============================================================================= */

import { layDichVu } from "./khoiTao.js";
import { XOA } from "../nguoi-dung/nhatKy.js";

const BO_SUU_TAP = "nguoiDung";

/**
 * Đọc tiến độ đã lưu. Người dùng mới chưa có tài liệu thì trả về giá trị rỗng.
 * Ném lỗi nếu không đọc được (người gọi sẽ báo bằng tiếng Việt).
 * @returns {Promise<{caiDat, daHoc, tapViet, mucTieu, nhatKy, chuoi}>}
 */
export async function docTienDo(uid) {
  const { db } = await layDichVu();
  const { doc, getDoc } = await import("firebase/firestore");
  const anh = await getDoc(doc(db, BO_SUU_TAP, uid));
  const d = anh.exists() ? anh.data() : {};
  return {
    caiDat: d.caiDat ?? null,
    daHoc: d.daHoc ?? {},
    tapViet: d.tapViet ?? {},
    mucTieu: d.mucTieu ?? null,
    nhatKy: d.nhatKy ?? {},
    chuoi: d.chuoi ?? null,
  };
}

/**
 * Ghi một lô thay đổi. Dùng merge nên chỉ đổi đúng những khoá có trong lô,
 * không xoá phần còn lại.
 * @param {string} uid
 * @param {{caiDat, daHoc, tapViet, mucTieu, chuoi, nhatKy}} lo
 *        Trong nhatKy, ngày nào mang giá trị XOA thì bị xoá khỏi tài liệu.
 */
export async function ghiLo(uid, lo) {
  const { db } = await layDichVu();
  const { deleteField, doc, setDoc, serverTimestamp } = await import(
    "firebase/firestore"
  );

  const noiDung = { capNhatLuc: serverTimestamp() };
  if (lo.caiDat) noiDung.caiDat = lo.caiDat;
  if (lo.daHoc && Object.keys(lo.daHoc).length > 0) noiDung.daHoc = lo.daHoc;
  if (lo.tapViet && Object.keys(lo.tapViet).length > 0) noiDung.tapViet = lo.tapViet;
  if (lo.mucTieu) noiDung.mucTieu = lo.mucTieu;
  if (lo.chuoi) noiDung.chuoi = lo.chuoi;
  if (lo.nhatKy && Object.keys(lo.nhatKy).length > 0) {
    noiDung.nhatKy = Object.fromEntries(
      Object.entries(lo.nhatKy).map(([ngay, gt]) => [
        ngay,
        gt === XOA ? deleteField() : gt,
      ]),
    );
  }

  await setDoc(doc(db, BO_SUU_TAP, uid), noiDung, { merge: true });
}
