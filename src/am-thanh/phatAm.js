/* =============================================================================
   RIYI — PHÁT ÂM
   =============================================================================

   ĐÂY LÀ NƠI DUY NHẤT TRONG TOÀN APP XỬ LÝ VIỆC PHÁT ÂM.

   Mọi nút loa ở mọi màn hình đều gọi vào hàm phatAm() bên dưới. Khi nào quyết
   định xong dùng giọng máy hay dùng file âm thanh thu sẵn, CHỈ CẦN SỬA NỘI DUNG
   HÀM NÀY là toàn bộ app có tiếng. Không phải đụng vào bất kỳ màn hình nào.

   Hiện tại: CHƯA GẮN NGUỒN ÂM THANH (theo đúng yêu cầu mục 6.1).
   Bấm nút loa sẽ hiện thông báo "Chức năng phát âm đang được chuẩn bị."
   ============================================================================= */

/**
 * Các ngôn ngữ mà app có thể cần phát âm.
 * Dùng hằng số thay vì gõ chuỗi trực tiếp, để không gõ sai chính tả.
 */
export const NGON_NGU = {
  TRUNG: "zh-CN",
  NHAT: "ja-JP",
};

/**
 * Trạng thái phát âm, để giao diện biết mà hiện nút loa đang chạy hay không.
 * Hiện chưa dùng tới, nhưng để sẵn cho lúc gắn âm thanh thật.
 */
let dangPhat = false;

export function dangPhatAm() {
  return dangPhat;
}

/**
 * HÀM PHÁT ÂM DUY NHẤT CỦA APP.
 *
 * @param {string} noiDung   Chữ cần đọc. Ví dụ "你好" hoặc "こんにちは".
 * @param {string} ngonNgu   NGON_NGU.TRUNG hoặc NGON_NGU.NHAT.
 * @returns {Promise<{thanhCong: boolean, thongBao: string|null}>}
 *          thanhCong = false kèm thongBao tiếng Việt khi chưa phát được.
 *
 * Hàm LUÔN trả về kết quả chứ không ném lỗi ra ngoài, để một nút loa hỏng
 * không bao giờ làm sập cả màn hình đang học.
 */
export async function phatAm(noiDung, ngonNgu = NGON_NGU.TRUNG) {
  // Chặn trường hợp gọi nhầm với nội dung rỗng
  if (!noiDung || !String(noiDung).trim()) {
    return { thanhCong: false, thongBao: "Không có nội dung để phát âm." };
  }

  // ---------------------------------------------------------------------------
  // GIAI ĐOẠN HIỆN TẠI — CHƯA CÓ NGUỒN ÂM THANH
  //
  // Khi nào chốt phương án, thay toàn bộ khối này bằng một trong hai cách:
  //
  //   CÁCH 1 — Giọng máy sẵn có của điện thoại (miễn phí, không cần tải file,
  //            nhưng giọng máy đọc tiếng Trung trên một số máy nghe khá tệ):
  //
  //     const loi = new SpeechSynthesisUtterance(noiDung);
  //     loi.lang = ngonNgu;
  //     loi.rate = 0.9;
  //     window.speechSynthesis.cancel();
  //     window.speechSynthesis.speak(loi);
  //     return { thanhCong: true, thongBao: null };
  //
  //   CÁCH 2 — File âm thanh thu sẵn đặt trong public/am-thanh/
  //            (chất lượng tốt hơn hẳn, nhưng phải chuẩn bị file cho từng mục):
  //
  //     const duongDan = `/am-thanh/${ngonNgu}/${noiDung}.mp3`;
  //     const tieng = new Audio(duongDan);
  //     await tieng.play();
  //     return { thanhCong: true, thongBao: null };
  //
  // ---------------------------------------------------------------------------

  // Dùng biến để tránh cảnh báo "tham số khai báo nhưng không dùng"
  void ngonNgu;
  void dangPhat;

  return {
    thanhCong: false,
    thongBao: "Chức năng phát âm đang được chuẩn bị.",
  };
}
