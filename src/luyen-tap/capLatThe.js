/* =============================================================================
   CHỌN CẶP THẺ CHO TRÒ CHƠI LẬT THẺ (GĐ 10, quyết định 18.16)
   =============================================================================

   Mỗi cặp gồm:
     - thẻ Trung : chữ Hán + pinyin
     - thẻ nghĩa : nghĩa tiếng Nhật tương đương + nghĩa tiếng Việt
   Thẻ nhỏ nên chỉ lấy NGHĨA ĐẦU TIÊN (trước dấu phẩy / dấu 、).

   Không cho hai mục trùng nghĩa (ví dụ 二 và 两 đều là "hai") vào cùng một ván,
   vì khi đó người chơi ghép "sai" mà thật ra đúng nghĩa.
   ============================================================================= */

import { tronNgauNhien } from "./tienIch.js";

export const SO_CAP_MOI_VAN = 10;

/** Nghĩa tiếng Việt đầu tiên: "ban ngày, trời sáng" → "ban ngày". */
function nghiaVietDau(chuoi = "") {
  return chuoi.split(/[,;]/)[0].trim();
}

/** Nghĩa tiếng Nhật đầu tiên: "昼間[ひるま]、日中[にっちゅう]" → "昼間[ひるま]". */
function nghiaNhatDau(chuoi = "") {
  return chuoi.split(/[、；;,]/)[0].trim();
}

/** Bỏ furigana và viết thường, để so hai nghĩa có trùng nhau không. */
function khoaSoSanh(chuoi) {
  return chuoi.replace(/\[[^\]]*\]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Chọn tối đa SO_CAP_MOI_VAN mục ngẫu nhiên, không trùng nghĩa Việt hay nghĩa Nhật.
 * `doiMuc` đổi một mục dữ liệu thành {id, trung, nhat, viet}.
 */
function chonCap(danhSach, doiMuc) {
  const daCoViet = new Set();
  const daCoNhat = new Set();
  const daCoTrung = new Set(); // hai mục viết giống nhau (过 guò / guo) cũng không cho chung ván
  const ra = [];
  for (const muc of tronNgauNhien(danhSach)) {
    if (ra.length >= SO_CAP_MOI_VAN) break;
    const cap = doiMuc(muc);
    if (!cap.viet || !cap.nhat) continue;
    const kv = khoaSoSanh(cap.viet);
    const kn = khoaSoSanh(cap.nhat);
    const kt = cap.trung.map((a) => a.chu).join("");
    if (daCoViet.has(kv) || daCoNhat.has(kn) || daCoTrung.has(kt)) continue;
    daCoViet.add(kv);
    daCoNhat.add(kn);
    daCoTrung.add(kt);
    ra.push(cap);
  }
  return ra;
}

/** Cặp thẻ từ danh sách từ vựng (Tab Từ vựng). */
export function capTuVung(danhSach) {
  return chonCap(danhSach, (t) => ({
    id: t.id,
    trung: Array.from(t.tu).map((chu, i) => ({ chu, pinyin: t.pinyin?.[i] ?? "" })),
    nhat: nghiaNhatDau(t.nghiaNhat),
    viet: nghiaVietDau(t.nghiaViet),
  }));
}

/** Cặp thẻ từ danh sách chữ Hán (Tab Chữ Hán): chữ giản thể + pinyin âm chính. */
export function capChuHan(danhSach) {
  return chonCap(danhSach, (c) => {
    const am = c.amDoc?.pinyin?.find((a) => a.chinh) ?? c.amDoc?.pinyin?.[0];
    return {
      id: c.id,
      trung: [{ chu: c.gianThe, pinyin: am?.am ?? "" }],
      nhat: nghiaNhatDau(c.nghia?.nhat),
      viet: nghiaVietDau(c.nghia?.viet),
    };
  });
}
