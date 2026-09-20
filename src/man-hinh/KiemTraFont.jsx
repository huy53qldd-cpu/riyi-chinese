/* =============================================================================
   Ô KIỂM TRA TỰ DẠNG TRUNG – NHẬT
   =============================================================================

   ĐÂY LÀ TIÊU CHÍ NGHIỆM THU CHÍNH CỦA GIAI ĐOẠN 0.

   Cùng một mã Unicode, nhưng tiếng Trung và tiếng Nhật vẽ nét khác nhau.
   Ví dụ chữ 直: phần dưới bên trái tiếng Nhật kéo nét dọc xuống, tiếng Trung
   thì không. Nếu hai cột dưới đây trông GIỐNG HỆT nhau thì có nghĩa là:

       - hoặc font chưa tải được
       - hoặc thiếu thuộc tính lang="zh-CN" / lang="ja"
       - hoặc hai ngôn ngữ đang dùng chung một font

   Cả ba đều là lỗi phải sửa ngay, vì sau này người học sẽ nhìn nhầm nét bút.

   Danh sách chữ bên dưới KHÔNG phải chọn theo cảm tính: đã đối chiếu bằng máy,
   so sánh trực tiếp hình vẽ (outline) của từng chữ trong hai file font, chỉ
   giữ lại những chữ máy xác nhận là vẽ khác nhau thật.
   ============================================================================= */

// 6 chữ dưới đây đã được máy kiểm chứng: vẽ thật ra ảnh bằng cả hai font rồi
// đếm điểm ảnh khác nhau. Cột "lệch" là kết quả đo được.
// Chạy lại phép đo bằng lệnh: python cong-cu/so-sanh-tu-dang.py
const CHU_KIEM_TRA = [
  { chu: "今", ghiChu: "nét dưới", lech: 48 },
  { chu: "言", ghiChu: "nét trên", lech: 48 },
  { chu: "空", ghiChu: "bộ 穴", lech: 47 },
  { chu: "直", ghiChu: "nét bên trái", lech: 43 },
  { chu: "次", ghiChu: "hai nét trái", lech: 29 },
  { chu: "骨", ghiChu: "ô vuông trên", lech: 18 },
];

export default function KiemTraFont() {
  return (
    <section className="border-vien bg-nen-noi rounded-[var(--bo-goc)] border p-4">
      <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Kiểm tra tự dạng Trung – Nhật
      </h2>
      <p className="text-chu-mo mt-1 mb-4 text-[length:var(--co-chu-latin-nho)]">
        Hai cột dưới đây phải trông <strong>khác nhau</strong>. Nếu giống hệt
        nhau là font hoặc thuộc tính ngôn ngữ đang bị sai.
      </p>

      {/* Hàng tiêu đề của bảng */}
      <div className="text-chu-mo border-vien grid grid-cols-[1fr_1fr_5.5rem] items-end gap-2 border-b pb-2 text-[length:var(--co-chu-latin-nho)] font-bold">
        <div>Tiếng Trung</div>
        <div>Tiếng Nhật</div>
        <div className="text-right">Khác ở đâu</div>
      </div>

      <ul className="m-0 list-none p-0">
        {CHU_KIEM_TRA.map(({ chu, ghiChu, lech }) => (
          <li
            key={chu}
            className="border-vien grid grid-cols-[1fr_1fr_5.5rem] items-center gap-2 border-b py-2 last:border-b-0"
          >
            {/* Cột tiếng Trung — BẮT BUỘC có lang="zh-CN" */}
            <span lang="zh-CN" className="font-trung text-[52px] leading-none">
              {chu}
            </span>

            {/* Cột tiếng Nhật — BẮT BUỘC có lang="ja" */}
            <span lang="ja" className="font-nhat text-[52px] leading-none">
              {chu}
            </span>

            <span className="text-right text-[length:var(--co-chu-latin-nho)] leading-snug">
              <span className="text-chu-mo block">{ghiChu}</span>
              <span className="text-nhan block font-bold tabular-nums">
                lệch {lech}%
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-chu-mo mt-4 mb-0 text-[length:var(--co-chu-latin-nho)] italic">
        Ô kiểm tra này chỉ dùng trong lúc dựng app, sẽ gỡ bỏ ở giai đoạn cuối.
      </p>
    </section>
  );
}
