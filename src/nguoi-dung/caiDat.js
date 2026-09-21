/* =============================================================================
   CÀI ĐẶT NGƯỜI DÙNG
   =============================================================================

   Hai cài đặt:
     furigana : "bat" (mặc định) hoặc "tat"  — hiện/ẩn chữ nhỏ trên chữ Hán Nhật
     giaoDien : "sang" (mặc định) hoặc "toi"

   Cài đặt luôn được lưu TRÊN MÁY (localStorage), kể cả ở chế độ khách. Người đã
   đăng nhập thì cài đặt còn được đồng bộ lên tài khoản (xem NguoiDung.jsx).

   Áp dụng cài đặt bằng cách đặt data-furigana và data-theme lên thẻ <html>,
   phần CSS đã sẵn ở index.css và tokens.css.
   ============================================================================= */

const KHOA_MAY = "riyi-cai-dat";

export const CAI_DAT_MAC_DINH = { furigana: "bat", giaoDien: "sang" };

const GIA_TRI_HOP_LE = {
  furigana: ["bat", "tat"],
  giaoDien: ["sang", "toi"],
};

/** Giữ lại các cài đặt hợp lệ, chỗ nào sai hoặc thiếu thì dùng mặc định. */
export function chuanHoaCaiDat(thu) {
  const ra = { ...CAI_DAT_MAC_DINH };
  for (const khoa of Object.keys(GIA_TRI_HOP_LE)) {
    if (GIA_TRI_HOP_LE[khoa].includes(thu?.[khoa])) ra[khoa] = thu[khoa];
  }
  return ra;
}

/** Đọc cài đặt đã lưu trên máy. localStorage có thể bị chặn nên phải bọc try. */
export function docCaiDatMay() {
  try {
    return chuanHoaCaiDat(JSON.parse(localStorage.getItem(KHOA_MAY)));
  } catch {
    return { ...CAI_DAT_MAC_DINH };
  }
}

export function luuCaiDatMay(caiDat) {
  try {
    localStorage.setItem(KHOA_MAY, JSON.stringify(caiDat));
  } catch {
    // Không lưu được (chế độ riêng tư...) thì thôi, cài đặt vẫn có hiệu lực
    // trong lần mở này
  }
}

/** Áp cài đặt lên giao diện. */
export function apDungCaiDat(caiDat) {
  const goc = document.documentElement;
  goc.dataset.furigana = caiDat.furigana;
  goc.dataset.theme = caiDat.giaoDien;
}
