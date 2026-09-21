/* =============================================================================
   VĂN BẢN TIẾNG VIỆT CÓ CHÈN CHỮ HÁN / KANA
   =============================================================================

   Dùng cho ghi chú, giải thích bằng tiếng Việt mà giữa câu có chữ Trung hoặc
   chữ Nhật (ví dụ: "Chữ Nhật giữ 言 còn tiếng Trung dùng 讠").

   Vì sao cần: chữ Hán chèn thẳng vào câu Việt sẽ KHÔNG có lang, nên trình duyệt
   vẽ sai tự dạng và dùng sai font. Thành phần này bọc từng đoạn chữ Hán/kana
   vào <span> có đúng lang và đúng font.

   Quy tắc chọn ngôn ngữ cho từng đoạn:
     - Có đánh dấu rõ:  {ja|言}  hoặc  {zh|讠}   → theo dấu
     - Kana (ひらがな, カタカナ)                    → tiếng Nhật
     - Chữ Hán không đánh dấu                     → tiếng Trung
   Chữ Hán nào thuộc về tiếng Nhật thì PHẢI đánh dấu {ja|...}.
   ============================================================================= */

const LANG = { zh: "zh-CN", ja: "ja" };
const LOP_FONT = { zh: "font-trung", ja: "font-nhat" };

function doanDanhDau(chuoi) {
  // Tách theo cả dấu {xx|...} lẫn đoạn Hán/kana trần
  const mau = /\{(zh|ja)\|([^}]+)\}|([一-鿿㐀-䶿぀-ヿ々]+(?:[ー-][一-鿿㐀-䶿぀-ヿ々]+)*)|([^{一-鿿㐀-䶿぀-ヿ々]+|\{)/g;
  const cacDoan = [];
  let khop;
  while ((khop = mau.exec(chuoi)) !== null) {
    if (khop[1]) {
      cacDoan.push({ ngonNgu: khop[1], chu: khop[2] });
    } else if (khop[3]) {
      // Chỉ có kana thì là tiếng Nhật, còn lại là tiếng Trung
      const chiKana = !/[一-鿿㐀-䶿々]/.test(khop[3]);
      cacDoan.push({ ngonNgu: chiKana ? "ja" : "zh", chu: khop[3] });
    } else {
      cacDoan.push({ ngonNgu: null, chu: khop[4] });
    }
  }
  return cacDoan;
}

export default function VanBanPha({ noiDung = "" }) {
  return (
    <>
      {doanDanhDau(noiDung).map((d, i) =>
        d.ngonNgu ? (
          <span key={i} lang={LANG[d.ngonNgu]} className={LOP_FONT[d.ngonNgu]}>
            {d.chu}
          </span>
        ) : (
          <span key={i}>{d.chu}</span>
        ),
      )}
    </>
  );
}
