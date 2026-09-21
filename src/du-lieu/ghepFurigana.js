/* =============================================================================
   GHÉP FURIGANA CHO MỘT TỪ
   =============================================================================

   Đổi (chữ Nhật, cách đọc) thành dạng có ngoặc vuông mà <ChuNhat> hiểu, đồng
   thời tách phần kana đuôi (okurigana) ra ngoài ngoặc:

       ghepFurigana("走る", "はしる")   →  "走[はし]る"
       ghepFurigana("手紙", "てがみ")   →  "手紙[てがみ]"
       ghepFurigana("ひと", "ひと")     →  "ひと"  (không có chữ Hán thì không cần)
   ============================================================================= */

const CO_HAN = /[一-鿿々]/;

// Đổi katakana sang hiragana để so sánh cách đọc không phân biệt hai bảng chữ
function sangHira(chuoi) {
  return Array.from(chuoi, (c) =>
    c >= "ァ" && c <= "ヶ" ? String.fromCharCode(c.charCodeAt(0) - 0x60) : c,
  ).join("");
}

export function ghepFurigana(chu, doc) {
  if (!CO_HAN.test(chu)) return chu;

  let goc = chu;
  let docGoc = doc;
  let duoi = "";
  // Cắt kana đuôi khi mặt chữ và cách đọc cùng kết thúc bằng kana đó
  while (
    goc.length > 1 &&
    docGoc.length > 1 &&
    !CO_HAN.test(goc.at(-1)) &&
    sangHira(docGoc).endsWith(sangHira(goc.at(-1)))
  ) {
    duoi = goc.at(-1) + duoi;
    goc = goc.slice(0, -1);
    docGoc = docGoc.slice(0, -1);
  }
  return `${goc}[${docGoc}]${duoi}`;
}
