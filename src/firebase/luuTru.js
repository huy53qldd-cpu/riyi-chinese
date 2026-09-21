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
         capNhatLuc: <thời điểm máy chủ>
       }

   Chỉ ghi THEO LÔ (xem NguoiDung.jsx): gom nhiều thay đổi rồi ghi một lần, để
   tiết kiệm lượt ghi của gói miễn phí.

   Quy tắc bảo mật nằm ở firestore.rules: mỗi người chỉ đọc/ghi được tài liệu
   của chính mình.
   ============================================================================= */

import { layDichVu } from "./khoiTao.js";

const BO_SUU_TAP = "nguoiDung";

/**
 * Đọc tiến độ đã lưu. Người dùng mới chưa có tài liệu thì trả về giá trị rỗng.
 * Ném lỗi nếu không đọc được (người gọi sẽ báo bằng tiếng Việt).
 * @returns {Promise<{caiDat: Object|null, daHoc: Object, tapViet: Object}>}
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
  };
}

/**
 * Ghi một lô thay đổi. Dùng merge nên chỉ đổi đúng những khoá có trong lô,
 * không xoá phần còn lại.
 * @param {string} uid
 * @param {{caiDat?: Object|null, daHoc?: Object, tapViet?: Object}} lo
 */
export async function ghiLo(uid, lo) {
  const { db } = await layDichVu();
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");

  const noiDung = { capNhatLuc: serverTimestamp() };
  if (lo.caiDat) noiDung.caiDat = lo.caiDat;
  if (lo.daHoc && Object.keys(lo.daHoc).length > 0) noiDung.daHoc = lo.daHoc;
  if (lo.tapViet && Object.keys(lo.tapViet).length > 0) noiDung.tapViet = lo.tapViet;

  await setDoc(doc(db, BO_SUU_TAP, uid), noiDung, { merge: true });
}
