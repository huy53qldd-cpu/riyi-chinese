/* =============================================================================
   NHỚ NGƯỜI ĐÃ ĐĂNG NHẬP TRÊN MÁY (GĐ 10)
   =============================================================================

   Firebase tự giữ phiên đăng nhập, nhưng lúc mở app phải chờ 1–2 giây để tải
   thư viện và kiểm tra. Trong lúc đó app chưa biết ai đang dùng, nên trước đây
   màn hình hiện nút "Đăng nhập bằng Google", trông như đã bị đăng xuất.

   Để tránh chuyện đó, app ghi TÊN người vừa đăng nhập vào máy. Lần mở sau, trong
   lúc chờ Firebase, app hiện luôn "Chào mừng bạn đã quay trở lại, [tên]". Nếu
   Firebase báo phiên đã hết thật thì mới hiện lại nút đăng nhập.

   Chỉ lưu tên hiển thị, không lưu gì bí mật (việc xác thực vẫn do Firebase lo).
   ============================================================================= */

const KHOA_MAY = "riyi-nguoi-da-dang-nhap";

/** Tên người đăng nhập lần trước trên máy này, hoặc null. */
export function docTenDaNho() {
  try {
    return JSON.parse(localStorage.getItem(KHOA_MAY))?.ten || null;
  } catch {
    return null;
  }
}

export function nhoTen(ten) {
  try {
    localStorage.setItem(KHOA_MAY, JSON.stringify({ ten }));
  } catch {
    // Không lưu được (chế độ riêng tư...) thì thôi, chỉ mất lời chào sớm
  }
}

export function quenTen() {
  try {
    localStorage.removeItem(KHOA_MAY);
  } catch {
    // Không xoá được thì thôi
  }
}
