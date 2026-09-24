/* =============================================================================
   ĐÈN TRẠNG THÁI TRÊN Ô (quyết định 18.50)
   =============================================================================

   Thay cho nhãn chữ "Đã học" / "Chưa học" cũ: một ngọn đèn tròn nhỏ ngay giữa
   mép trên của ô (ô chữ Hán, ô từ, ô ngữ pháp), có quầng sáng xung quanh để
   trông như đang bật. Màu theo theme, nằm trong tokens.css:

     Sáng, Tối        : chưa học = đèn ĐỎ,        đã học = đèn XANH
     Hoa anh đào      : chưa học = đèn hồng sáng,  đã học = đèn hồng tối
     Hoa Đăng Dạ Nguyệt: chưa học = đèn vàng sáng, đã học = đèn tối đi

   Đèn chỉ để nhìn: chữ "đã học"/"chưa học" vẫn nằm trong aria-label của ô, nên
   trình đọc màn hình vẫn đọc được. Ô chứa đèn phải có position: relative.
   ============================================================================= */

export default function DenTrangThai({ daHoc }) {
  return <span aria-hidden="true" className={`den-trang-thai ${daHoc ? "da-hoc" : "chua-hoc"}`} />;
}
