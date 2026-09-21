import VanBanPha from "./VanBanPha.jsx";

/* =============================================================================
   HIỂN THỊ TIẾNG TRUNG KÈM PINYIN
   =============================================================================

   Dùng ở MỌI chỗ có chữ Trung trong app. Không tự viết chữ Trung ở nơi khác.

   Hai việc bắt buộc mà thành phần này tự lo, không sợ quên:
     1. Gắn lang="zh-CN"  — thiếu cái này trình duyệt vẽ SAI tự dạng
     2. Dùng font Noto Sans SC, không dùng chung font với tiếng Nhật

   Pinyin hiển thị THANH ĐIỆU GỐC, không phải thanh sau biến điệu.
   Chỗ nào có biến điệu (不, 一, hai thanh 3 liền nhau) thì ghi chú riêng bằng
   prop ghiChuBienDieu, chứ KHÔNG sửa pinyin.
   ============================================================================= */

/**
 * @param {Array<{chu: string, pinyin?: string}>} amTiet
 *        Danh sách từng chữ kèm pinyin của chính chữ đó.
 *        Ví dụ: [{chu:"你", pinyin:"nǐ"}, {chu:"好", pinyin:"hǎo"}]
 *
 *        Phải tách theo TỪNG CHỮ thì pinyin mới nằm đúng trên đầu chữ của nó.
 *        Nếu lưu cả cụm "nǐ hǎo" thì pinyin sẽ trôi lệch, không khớp chữ nào.
 *
 *        Dấu câu (，。？) để pinyin trống là được.
 *
 * @param {boolean} hienPinyin  Cho ẩn pinyin khi làm bài kiểm tra. Mặc định hiện.
 * @param {string}  co          "the" = chữ rất to (thẻ chữ Hán đứng một mình),
 *                              "thuong" = cỡ chữ Hán trong câu.
 * @param {string}  ghiChuBienDieu  Dòng chú thích nhỏ phía dưới, ví dụ:
 *                              "不 ở đây đọc thành bú vì đứng trước thanh 4."
 */
export default function ChuTrung({
  amTiet = [],
  hienPinyin = true,
  co = "thuong",
  ghiChuBienDieu = null,
  className = "",
}) {
  const coChu =
    co === "the"
      ? "text-[length:var(--co-chu-han-the)] leading-[1.35]"
      : "text-[length:var(--co-chu-han)] leading-[1.9]";

  return (
    <div className={className}>
      {/*
        lang="zh-CN" là BẮT BUỘC.
        Đây là thứ quyết định trình duyệt vẽ 直 theo kiểu Trung hay kiểu Nhật.
      */}
      <p lang="zh-CN" className={`font-trung m-0 tracking-wide ${coChu}`}>
        {amTiet.map((muc, i) => {
          // Dấu câu và khoảng trắng: không bọc ruby, để không tạo khoảng hở lạ
          if (!muc.pinyin) {
            return <span key={i}>{muc.chu}</span>;
          }
          return (
            <ruby key={i}>
              {muc.chu}
              {/*
                rp = ký tự dự phòng cho trình duyệt quá cũ không hiểu ruby:
                khi đó pinyin sẽ hiện trong ngoặc đơn thay vì biến mất.
              */}
              <rp>(</rp>
              <rt style={hienPinyin ? undefined : { visibility: "hidden" }}>
                {muc.pinyin}
              </rt>
              <rp>)</rp>
            </ruby>
          );
        })}
      </p>

      {ghiChuBienDieu && (
        <p className="text-chu-mo m-0 mt-1 text-[length:var(--co-chu-latin-nho)] italic">
          <VanBanPha noiDung={ghiChuBienDieu} />
        </p>
      )}
    </div>
  );
}

/**
 * Tiện ích: đổi nhanh một chuỗi chữ Trung + danh sách pinyin thành dạng amTiet.
 * Dùng khi dữ liệu JSON lưu hai mảng song song.
 *
 * Ví dụ: ghepAmTiet("你好", ["nǐ", "hǎo"])
 *        → [{chu:"你", pinyin:"nǐ"}, {chu:"好", pinyin:"hǎo"}]
 */
export function ghepAmTiet(chuoiChu, danhSachPinyin = []) {
  return Array.from(chuoiChu).map((chu, i) => ({
    chu,
    pinyin: danhSachPinyin[i] || "",
  }));
}
