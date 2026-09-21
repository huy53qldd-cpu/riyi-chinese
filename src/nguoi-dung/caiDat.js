/* =============================================================================
   CÀI ĐẶT NGƯỜI DÙNG
   =============================================================================

   Hai cài đặt:
     furigana : "bat" (mặc định) hoặc "tat"  — hiện/ẩn chữ nhỏ trên chữ Hán Nhật
     giaoDien : "sang" (mặc định), "toi" hoặc "anh-dao" (hoa anh đào, GĐ 10)
     coChu    : 5 nấc cỡ chữ, "vua" là mặc định (GĐ 10, xem CAC_CO_CHU)

   Cài đặt luôn được lưu TRÊN MÁY (localStorage), kể cả ở chế độ khách. Người đã
   đăng nhập thì cài đặt còn được đồng bộ lên tài khoản (xem NguoiDung.jsx).

   Áp dụng cài đặt bằng cách đặt data-furigana và data-theme lên thẻ <html>,
   phần CSS đã sẵn ở index.css và tokens.css.
   ============================================================================= */

const KHOA_MAY = "riyi-cai-dat";

export const CAI_DAT_MAC_DINH = { furigana: "bat", giaoDien: "sang", coChu: "vua" };

/**
 * 5 nấc cỡ chữ, từ nhỏ đến lớn. `tiLe` là cỡ chữ gốc của cả trang (thẻ <html>);
 * mọi cỡ chữ, khoảng cách, biểu tượng trong app tính theo rem nên phóng cùng tỉ lệ.
 * Nấc lớn nhất (125%) đã đo thử trên màn hình điện thoại hẹp 360px và 390px ở
 * mọi tab, lượt luyện tập, Mục tiêu và Cài đặt: không tràn ngang, không nút nào
 * vỡ. Từ khoảng 128% trở lên, nhãn "Ngữ pháp" ở thanh tab dưới bị xuống dòng
 * trên máy 360px (quyết định 18.9). Muốn đổi thì sửa ở đây, CSS tự theo.
 */
export const CAC_CO_CHU = [
  { ma: "nho", nhan: "Nhỏ", tiLe: 0.875 },
  { ma: "vua", nhan: "Vừa", tiLe: 1 },
  { ma: "lon", nhan: "Lớn", tiLe: 1.08 },
  { ma: "rat-lon", nhan: "Rất lớn", tiLe: 1.17 },
  { ma: "lon-nhat", nhan: "Lớn nhất", tiLe: 1.25 },
];

const GIA_TRI_HOP_LE = {
  furigana: ["bat", "tat"],
  giaoDien: ["sang", "toi", "anh-dao"],
  coChu: CAC_CO_CHU.map((c) => c.ma),
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
  const co = CAC_CO_CHU.find((c) => c.ma === caiDat.coChu) ?? CAC_CO_CHU[1];
  goc.style.fontSize = `${co.tiLe * 100}%`;

  // Màu thanh trạng thái điện thoại theo theme CỦA APP. index.html đặt sẵn hai
  // thẻ theo sáng/tối của máy; khi app đã chạy thì cả hai lấy đúng màu nền của
  // theme đang chọn (đọc từ tokens.css, không ghi mã màu ở đây).
  const mauNen = getComputedStyle(goc).getPropertyValue("--nen").trim();
  if (mauNen) {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((the) => the.setAttribute("content", mauNen));
  }
}
