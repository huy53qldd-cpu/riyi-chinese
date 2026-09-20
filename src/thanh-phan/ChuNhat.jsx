/* =============================================================================
   HIỂN THỊ TIẾNG NHẬT KÈM FURIGANA
   =============================================================================

   Dùng ở MỌI chỗ có chữ Nhật trong app. Không tự viết chữ Nhật ở nơi khác.

   Hai việc bắt buộc mà thành phần này tự lo:
     1. Gắn lang="ja"  — thiếu cái này thì 直, 骨, 今 sẽ bị vẽ theo kiểu Trung
     2. Dùng font Noto Sans JP, tách hẳn khỏi font tiếng Trung

   Furigana có nút BẬT/TẮT trong Cài đặt, mặc định BẬT.
   Khi tắt, chữ nhỏ bị ẩn nhưng VẪN GIỮ CHỖ, để dòng chữ không nhảy lên xuống.
   Việc ẩn này do CSS lo (xem :root[data-furigana="tat"] trong index.css).
   ============================================================================= */

/**
 * Cách ghi furigana trong file dữ liệu JSON: dùng ngoặc vuông ngay sau chữ Hán.
 *
 *     "漢字[かんじ]を勉強[べんきょう]する"
 *
 * Chọn cách này vì gõ tay dễ, đọc bằng mắt cũng hiểu ngay, và không phải
 * tách dữ liệu thành mảng lồng nhau rắc rối.
 *
 * Hàm dưới đây tách chuỗi đó thành các mảnh để vẽ ra màn hình.
 *
 * @param {string} chuoi
 * @returns {Array<{chu: string, doc: string|null}>}
 */
export function tachFurigana(chuoi) {
  const manh = [];
  // Bắt cặp: một cụm chữ bất kỳ không chứa ngoặc, theo sau là [cách đọc]
  const mau = /([^[\]]+?)\[([^[\]]+)\]|([^[\]]+)/g;
  let khop;

  while ((khop = mau.exec(chuoi)) !== null) {
    if (khop[2]) {
      // Có furigana. Nhưng phần khớp được có thể dính cả chữ kana đứng trước,
      // ví dụ "を勉強" trong "を勉強[べんきょう]". Chỉ chữ Hán mới cần furigana,
      // nên tách phần kana/dấu câu ra khỏi phần chữ Hán.
      const truoc = khop[1];
      const viTriHan = truoc.search(/[一-鿿々]/);

      if (viTriHan > 0) {
        manh.push({ chu: truoc.slice(0, viTriHan), doc: null });
        manh.push({ chu: truoc.slice(viTriHan), doc: khop[2] });
      } else {
        manh.push({ chu: truoc, doc: khop[2] });
      }
    } else if (khop[3]) {
      manh.push({ chu: khop[3], doc: null });
    }
  }
  return manh;
}

/**
 * @param {string}  noiDung  Chuỗi tiếng Nhật, có thể kèm furigana kiểu 漢字[かんじ]
 * @param {string}  co       "the" = rất to, "thuong" = cỡ chữ Hán trong câu,
 *                           "nho" = cỡ chữ Latin (dùng cho nghĩa, chú thích)
 */
export default function ChuNhat({
  noiDung = "",
  co = "thuong",
  className = "",
}) {
  const manh = tachFurigana(noiDung);

  const coChu = {
    the: "text-[length:var(--co-chu-han-the)] leading-[1.35]",
    thuong: "text-[length:var(--co-chu-han)] leading-[1.9]",
    nho: "text-[length:var(--co-chu-latin)] leading-[1.9]",
  }[co];

  return (
    // lang="ja" là BẮT BUỘC — quyết định trình duyệt vẽ tự dạng Nhật hay Trung
    <p lang="ja" className={`font-nhat m-0 ${coChu} ${className}`}>
      {manh.map((m, i) =>
        m.doc ? (
          <ruby key={i}>
            {m.chu}
            <rp>(</rp>
            <rt>{m.doc}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{m.chu}</span>
        ),
      )}
    </p>
  );
}
