# Dự án Riyi - Quy tắc cố định

## ĐỌC TRƯỚC KHI LÀM BẤT CỨ VIỆC GÌ

Mở `tai-lieu/QUYET-DINH-DA-CHOT.md` trước. File đó ghi mọi quyết định đã chốt
giữa chủ dự án và Claude, đang làm tới đâu, và đang chờ trả lời câu hỏi nào.

Việc nào đã có trong file đó thì KHÔNG hỏi lại. Chốt thêm quyết định mới thì
ghi bổ sung vào đó rồi commit, đừng để quyết định chỉ nằm trong cửa sổ trò
chuyện vì cửa sổ đó không đi theo sang máy khác.

App học tiếng Trung (HSK 3.0, cấp 1-3) dành cho người Việt đã biết tiếng Nhật
(trình độ N4-N1). Chủ dự án KHÔNG BIẾT LẬP TRÌNH.

## Nền tảng (không được đổi)

- Vite + React + Tailwind CSS
- Firebase: Authentication (CHỈ Google Sign-In), Firestore, Hosting. Gói Spark.
- PWA cài được vào màn hình chính. KHÔNG làm chức năng chạy offline.

## Nguyên tắc hiển thị (bắt buộc, mọi màn hình)

- Thứ tự nội dung luôn là: TIẾNG TRUNG → TIẾNG NHẬT → TIẾNG VIỆT.
- Chữ Hán tiếng Trung luôn có pinyin ruby phía trên.
- Chữ Hán tiếng Nhật có furigana, có nút bật/tắt trong Cài đặt, mặc định BẬT.
- Pinyin hiển thị thanh điệu GỐC, không hiển thị thanh sau biến điệu.
- Font: Noto Sans SC cho tiếng Trung, Noto Sans JP cho tiếng Nhật. Không dùng
  chung một font.
- BẮT BUỘC gắn lang="zh-CN" cho đoạn tiếng Trung, lang="ja" cho đoạn tiếng Nhật.
- Font phải subset theo ký tự thực dùng, không tải font CJK bản đầy đủ.
- Cỡ chữ Hán lớn hơn chữ Latin.

## Đăng nhập

- CHỈ có một nút duy nhất: Đăng nhập bằng Google.
- KHÔNG tạo tài khoản, KHÔNG email/mật khẩu, KHÔNG quên mật khẩu, KHÔNG liên kết
  tài khoản.
- Có chế độ khách: học được nhưng không lưu tiến độ, không mục tiêu, không review.

## Dữ liệu

- Bài học nằm trong file JSON tĩnh, có trường version. Không hard-code trong
  giao diện, không lưu trên Firestore.
- Firestore chỉ lưu tiến độ và cài đặt người dùng. Ghi theo lô cuối phiên học.

## Nội dung học

- KHÔNG đưa ra bất kỳ "quy luật tương ứng âm đọc" nào giữa tiếng Nhật và tiếng
  Trung. Chỉ hiển thị âm đọc thực tế của từng chữ.
- Tab ngữ pháp: luôn đối chiếu với cấu trúc tiếng Nhật. Nếu không có cấu trúc
  trùng khít thì đưa dạng gần tương đương kèm nhãn "gần tương đương, không trùng
  khít" và nói rõ chỗ lệch.
- Phát âm: nút loa đã có nhưng CHƯA gắn nguồn âm thanh. Toàn bộ logic phát âm
  phải nằm trong một hàm duy nhất ở một file riêng.

## Cách viết code

- Chú thích bằng tiếng Việt.
- Mọi thông báo lỗi cho người dùng bằng tiếng Việt, ngắn gọn, không hiện mã lỗi
  tiếng Anh của Firebase.
- Màu sắc gom vào một file design tokens duy nhất.

## Cách làm việc

- Làm đúng một giai đoạn mỗi lần, không làm trước phần của giai đoạn sau.
- Trước khi bắt đầu, liệt kê điểm chưa rõ và hỏi lại. Không tự quyết.
- Không chắc chắn thì phải nói rõ là chưa chắc chắn. Tuyệt đối không đoán,
  đặc biệt với âm đọc, nghĩa chữ Hán và cấu trúc ngữ pháp.
