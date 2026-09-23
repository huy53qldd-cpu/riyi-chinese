/* =============================================================================
   ĐẶT DẤU THANH CHO PINYIN (GĐ 10, tab Phát âm)
   =============================================================================

   danhDauThanh("zhuang", 4) → "zhuàng" ; danhDauThanh("nü", 3) → "nǚ"

   Quy tắc đặt dấu thanh của pinyin:
     1. Có a hoặc e thì dấu đặt trên a / e
     2. Có "ou" thì dấu đặt trên o
     3. Còn lại dấu đặt trên nguyên âm CUỐI (iu → u, ui → i)
   ============================================================================= */

const DAU = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

/**
 * Ngược lại của danhDauThanh: "hǎo" → { am: "hao", thanh: 3 }, "nǚ" → { am: "nv", thanh: 3 }.
 * `am` viết đúng như TÊN FILE âm thanh (ü viết là v). Không có dấu thanh
 * (thanh nhẹ) thì thanh = 0.
 */
export function tachThanh(pinyin) {
  let thanh = 0;
  const am = Array.from(String(pinyin).trim().toLowerCase())
    .map((c) => {
      for (const [goc, dau] of Object.entries(DAU)) {
        const i = dau.indexOf(c);
        if (i >= 0) {
          thanh = i + 1;
          return goc;
        }
      }
      return c;
    })
    .join("")
    .replace("ü", "v");
  return { am, thanh };
}

export function danhDauThanh(amTiet, thanh) {
  if (!(thanh >= 1 && thanh <= 4)) return amTiet;
  const ky = Array.from(amTiet);
  let viTri = ky.findIndex((c) => c === "a" || c === "e");
  if (viTri < 0 && amTiet.includes("ou")) viTri = amTiet.indexOf("o");
  if (viTri < 0) {
    for (let i = ky.length - 1; i >= 0; i -= 1) {
      if (DAU[ky[i]]) {
        viTri = i;
        break;
      }
    }
  }
  if (viTri < 0) return amTiet;
  ky[viTri] = DAU[ky[viTri]][thanh - 1];
  return ky.join("");
}
