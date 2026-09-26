/* =============================================================================
   THI THỬ HSK — LƯU ĐIỂM LÊN TÀI KHOẢN (quyết định 18.59)
   =============================================================================

   nguoiDung/{uid}.thiThu.<MÃ ĐỀ> = {
     lanCuoi: { nghe, doc, tong, dat, luc },   lần nộp gần nhất
     cao:     { ... }                          lần có tổng điểm cao nhất
     soLan:   số lần đã nộp
   }
   Chế độ khách không lưu (không có tài khoản).
   ============================================================================= */

import { layDichVu } from "../firebase/khoiTao.js";

/** Điểm thi thử đã lưu của một người: { "<MÃ>": {lanCuoi, cao, soLan} }. */
export async function docKetQuaThiThu(uid) {
  if (!uid) return {};
  try {
    const [{ db }, { doc, getDoc }] = await Promise.all([layDichVu(), import("firebase/firestore")]);
    const anh = await getDoc(doc(db, "nguoiDung", uid));
    return anh.exists() ? (anh.data().thiThu ?? {}) : {};
  } catch {
    return {};
  }
}

/**
 * Lưu điểm một lần nộp. `cu` là kết quả đã lưu trước đó của đề này (nếu có),
 * để giữ lại lần cao nhất.
 * @returns {Promise<boolean>} lưu được hay không
 */
export async function ghiKetQuaThiThu(uid, ma, diem, cu) {
  if (!uid) return false;
  try {
    const [{ db }, { doc, increment, setDoc }] = await Promise.all([
      layDichVu(),
      import("firebase/firestore"),
    ]);
    const cao = !cu?.cao || diem.tong >= cu.cao.tong ? diem : cu.cao;
    await setDoc(
      doc(db, "nguoiDung", uid),
      { thiThu: { [ma]: { lanCuoi: diem, cao, soLan: increment(1) } } },
      { merge: true },
    );
    return true;
  } catch {
    return false;
  }
}
