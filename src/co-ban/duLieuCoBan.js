/* =============================================================================
   KHOÁ "TIẾNG TRUNG CƠ BẢN" (PHẦN 2) — DỮ LIỆU VÀ TIẾN ĐỘ (quyết định 18.64–18.70)
   =============================================================================

   Dữ liệu tĩnh do cong-cu/dung-bai-co-ban.py dựng:
     du-lieu/co-ban/hsk1/muc-luc.json     15 bài + Bài 0, chia 3 chặng
     du-lieu/co-ban/hsk1/bai-XX.json      nội dung một bài (6 buổi)
     du-lieu/co-ban/hsk1/am/<mã>.mp3      âm thanh sách (chỉ ở máy chủ dự án, 18.68)
     du-lieu/co-ban/hsk1/hinh/bai-XX/     ảnh minh hoạ
     du-lieu/han-viet.json                âm Hán Việt (CC BY 4.0, 18.66)

   Tiến độ: buổi nào đã xong của bài nào.
     - Đã đăng nhập: Firestore nguoiDung/{uid}.coBan = { "hsk1-01": [1, 2, 3] }
     - Khách: chỉ lưu trên máy này (localStorage), không đồng bộ.
   ============================================================================= */

import { layDichVu } from "../firebase/khoiTao.js";

const GOC = `${import.meta.env.BASE_URL}du-lieu/co-ban/hsk1/`;
const KHOA_MAY = "riyi-co-ban-tien-do";

/** 6 buổi của mỗi bài (quyết định 18.65). */
export const CAC_BUOI = [
  { so: 1, ten: "Hội thoại", moTa: "Nghe và đọc hội thoại của bài" },
  { so: 2, ten: "Phát âm", moTa: "Pinyin, thanh điệu, đọc theo" },
  { so: 3, ten: "Từ vựng", moTa: "Từ mới và từ bổ sung HSK 2025" },
  { so: 4, ten: "Chữ Hán & ngữ pháp", moTa: "Nét, chữ, tập viết, mẫu câu" },
  { so: 5, ten: "Luyện tập", moTa: "Bài tập nghe, đọc, phát âm" },
  { so: 6, ten: "Ôn tập", moTa: "Kiểm tra nhanh, vận dụng, văn hoá" },
];

export const duongDanCoBan = (tep) => `${GOC}${tep}`;
export const duongDanAm = (ma) => `${GOC}am/${ma}.mp3`;
export const duongDanHinh = (bai, ten) => `${GOC}hinh/bai-${String(bai).padStart(2, "0")}/${ten}.webp`;
/** Tiền tố thư mục cho phần hiển thị câu hỏi của Thi thử (xem duLieuThiThu.duongDan). */
export const THU_MUC_BAI_TAP = GOC;

const boDem = new Map();
async function taiJson(duong) {
  if (!boDem.has(duong)) {
    boDem.set(
      duong,
      fetch(duong, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error("khong-tai-duoc");
        return r.json();
      }),
    );
  }
  try {
    return await boDem.get(duong);
  } catch (e) {
    boDem.delete(duong); // lỗi mạng: lần sau tải lại
    throw e;
  }
}

export const taiMucLuc = () => taiJson(duongDanCoBan("muc-luc.json"));
export const taiBai = (so) => taiJson(duongDanCoBan(`bai-${String(so).padStart(2, "0")}.json`));

/** Âm Hán Việt: { "学": { am: "học", canKiemTra: true, meoNho } }. Lỗi thì trả rỗng. */
export async function taiHanViet() {
  try {
    return (await taiJson(`${import.meta.env.BASE_URL}du-lieu/han-viet.json`)).chu;
  } catch {
    return {};
  }
}

/** Âm Hán Việt của cả từ, ví dụ 学生 → "học sinh". Thiếu chữ nào thì bỏ trống cả từ. */
export function hanVietCuaTu(tu, bang) {
  const am = Array.from(tu).map((c) => bang[c]?.am);
  return am.every(Boolean) ? am.join(" ") : null;
}

/* ---------------------------------------------------------------------------
   TIẾN ĐỘ
   --------------------------------------------------------------------------- */
export const maBai = (so) => `hsk1-${String(so).padStart(2, "0")}`;

function docMay() {
  try {
    return JSON.parse(localStorage.getItem(KHOA_MAY) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

export async function docTienDo(uid) {
  if (!uid) return docMay();
  try {
    const [{ db }, { doc, getDoc }] = await Promise.all([layDichVu(), import("firebase/firestore")]);
    const anh = await getDoc(doc(db, "nguoiDung", uid));
    return anh.exists() ? (anh.data().coBan ?? {}) : {};
  } catch {
    return {};
  }
}

/**
 * Đánh dấu một buổi đã xong. Trả về tiến độ mới (luôn cập nhật được trên màn
 * hình; lưu lên tài khoản lỗi thì thôi, lần sau làm lại buổi đó sẽ lưu tiếp).
 */
export async function ghiXongBuoi(uid, tienDo, soBai, soBuoi) {
  const ma = maBai(soBai);
  const cu = tienDo[ma] ?? [];
  if (cu.includes(soBuoi)) return tienDo;
  const moi = { ...tienDo, [ma]: [...cu, soBuoi].sort((a, b) => a - b) };
  if (!uid) {
    try {
      localStorage.setItem(KHOA_MAY, JSON.stringify(moi));
    } catch {
      /* trình duyệt chặn lưu: vẫn hiện trên màn hình */
    }
    return moi;
  }
  try {
    const [{ db }, { doc, setDoc }] = await Promise.all([layDichVu(), import("firebase/firestore")]);
    await setDoc(doc(db, "nguoiDung", uid), { coBan: { [ma]: moi[ma] } }, { merge: true });
  } catch {
    /* mất mạng: bỏ qua */
  }
  return moi;
}
