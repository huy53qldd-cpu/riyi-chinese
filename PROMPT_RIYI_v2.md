# YÊU CẦU XÂY DỰNG APP HỌC TIẾNG TRUNG "RIYI" (bản v2)

## 0. Về tên và nhận diện

- Tên app: Riyi (日一 / 日意). Ý nghĩa: luôn vui tươi tỏa sáng như ánh mặt trời.
- Logo: tôi cung cấp file logo kèm theo. Toàn bộ thiết kế giao diện phải xoay
  quanh logo này: lấy màu chủ đạo, hình khối và tinh thần từ logo để làm bảng
  màu, icon, màn hình splash, favicon và icon PWA.
- Hình tượng MẶT TRỜI xuyên suốt app, đặc biệt ở phần mục tiêu hằng ngày.
- Toàn bộ màu sắc phải gom vào MỘT file cấu hình màu duy nhất (design tokens),
  không rải màu trực tiếp trong từng màn hình, để sau này đổi màu chỉ sửa
  một chỗ.

## 1. Mục tiêu và đối tượng

App học tiếng Trung dành cho NGƯỜI VIỆT ĐÃ BIẾT TIẾNG NHẬT, khai thác mối
liên hệ Hán tự Trung - Nhật và âm Hán Việt để học nhanh hơn.

- Trình độ tiếng Nhật giả định của người học: N4 đến N1.
- Phạm vi nội dung: HSK 3.0 (chuẩn 2021), cấp 1 đến cấp 3.
- Quy mô: dùng trong một cộng đồng nhỏ, không phải sản phẩm thương mại.
- Chỉ dùng công cụ, thư viện, dịch vụ MIỄN PHÍ.

## 2. Nền tảng kỹ thuật (đã chốt, không được tự ý đổi)

- Vite + React + Tailwind CSS.
- Firebase: Authentication (chỉ Google), Firestore, Hosting. Gói Spark miễn phí.
- Web app responsive, chạy tốt trên cả điện thoại và PC.
- PWA: cài được vào màn hình chính điện thoại, có manifest.json, service worker,
  icon nhiều kích cỡ lấy từ logo, màn hình splash.
- KHÔNG yêu cầu chạy offline. App cần có mạng để hoạt động. Khi mất mạng,
  hiện màn hình thông báo rõ ràng bằng tiếng Việt: "Cần kết nối mạng để sử dụng
  Riyi." Không cố gắng làm chức năng học offline.

## 3. Nguyên tắc hiển thị (bắt buộc, áp dụng toàn app)

- Mọi nội dung học luôn theo thứ tự: TIẾNG TRUNG → TIẾNG NHẬT → TIẾNG VIỆT.
- Chữ Hán tiếng Trung luôn có pinyin phía trên (ruby), cơ chế giống furigana.
- Chữ Hán tiếng Nhật có furigana phía trên, kèm NÚT BẬT/TẮT FURIGANA trong
  phần Cài đặt. Mặc định là BẬT.
- Pinyin hiển thị THANH ĐIỆU GỐC, không hiển thị thanh sau biến điệu.
  Riêng các trường hợp 不, 一 và hai thanh 3 liền nhau thì thêm một dòng ghi chú
  nhỏ giải thích cách đọc thực tế.
- Font riêng cho từng ngôn ngữ: Noto Sans SC cho tiếng Trung, Noto Sans JP cho
  tiếng Nhật. KHÔNG dùng chung một font, vì tự dạng (glyph) của cùng một mã
  Unicode khác nhau giữa 2 ngôn ngữ (ví dụ 直, 骨, 今).
- BẮT BUỘC gắn thuộc tính lang="zh-CN" cho mọi đoạn tiếng Trung và lang="ja"
  cho mọi đoạn tiếng Nhật. Thiếu thuộc tính này thì trình duyệt sẽ vẽ sai tự
  dạng dù đã chọn đúng font.
- Font phải được CẮT NHỎ (subset) chỉ chứa các ký tự thực sự xuất hiện trong
  dữ liệu bài học, để giảm dung lượng tải. Không tải font CJK bản đầy đủ.
- Cỡ chữ Hán lớn hơn chữ Latin để nhìn rõ nét bút.

## 4. Đăng nhập

CHỈ CÓ MỘT PHƯƠNG THỨC ĐĂNG NHẬP DUY NHẤT: Google Sign-In qua Firebase
Authentication.

- Màn hình đăng nhập chỉ có MỘT nút: "Đăng nhập bằng Google".
- KHÔNG làm chức năng tạo tài khoản, KHÔNG có đăng nhập bằng email và mật khẩu,
  KHÔNG có quên mật khẩu, KHÔNG có liên kết tài khoản.
- Tên hiển thị và ảnh đại diện lấy tự động từ tài khoản Google
  (displayName, photoURL).
- Trong màn hình Cài đặt / Hồ sơ: cho phép đổi tên hiển thị và ảnh đại diện.
  Tên hiển thị chỉ là nhãn trên giao diện, được phép trùng nhau giữa các người
  dùng. Ghi chú rõ trên màn hình: "Đổi tên hiển thị không làm thay đổi tài khoản
  Google đăng nhập của bạn."
- Ghi nhớ đăng nhập, đăng xuất, xoá tài khoản.
- Tiến độ học lưu theo tài khoản trên Firestore, đồng bộ giữa điện thoại và PC.

### 4.1 Chế độ học khách (không đăng nhập)

- Ngoài nút đăng nhập, màn hình đầu tiên có thêm lối vào "Học thử không cần
  tài khoản".
- Chế độ khách dùng được đầy đủ nội dung học, nhưng KHÔNG lưu tiến độ, KHÔNG có
  mục tiêu hằng ngày, KHÔNG có review cuối tuần, KHÔNG có streak.
- Hiện một dải nhắc nhỏ, không gây khó chịu, ở đầu màn hình: "Bạn đang học ở
  chế độ khách, tiến độ sẽ không được lưu."
- Chế độ khách vẫn cần mạng.

### 4.2 Hướng dẫn cấu hình

Hãy hướng dẫn tôi cấu hình Firebase từng bước một, có ảnh chụp màn hình mô tả
bằng lời, vì tôi không biết lập trình. Mỗi bước chỉ làm một việc.

## 5. Chọn khóa học (sau khi vào app)

1. Tiếng Trung cho người đã có nền tảng tiếng Nhật  → hoạt động đầy đủ
2. Tiếng Trung cơ bản (cho người mới)              → CHƯA LÀM
3. Tiếng Nhật                                      → CHƯA LÀM

Khi bấm mục 2 hoặc 3: hiện màn hình thông báo "Hệ thống đang nâng cấp, xin hãy
chờ đợi thêm nhé." kèm nút quay lại.

Thiết kế code dễ mở rộng để sau này bổ sung khóa 2 và 3 mà không phải viết lại
cấu trúc.

## 6. Các tab chính (khóa số 1)

### Tab A. Luyện chữ Hán  ★ QUAN TRỌNG NHẤT

Phần lõi, tạo cầu nối Trung - Nhật. Mỗi thẻ chữ Hán gồm:

- Tự dạng so sánh 3 cột: Giản thể (TQ) | Tự dạng Nhật (新字体) | Phồn thể.
  Đánh dấu rõ: giống hệt / khác một chút / khác hoàn toàn.
- Âm đọc hiển thị song song: pinyin kèm thanh điệu | âm On tiếng Nhật |
  âm Hán Việt.
- TUYỆT ĐỐI KHÔNG đưa ra bất kỳ "quy luật tương ứng âm đọc" nào giữa tiếng Nhật
  và tiếng Trung. Chỉ hiển thị âm đọc thực tế của từng chữ, không suy diễn,
  không tổng quát hóa thành quy tắc.
- Nghĩa: Trung → Nhật → Việt.
- Thứ tự nét: animation viết từng nét, kèm ô canvas cho người dùng viết tay bằng
  ngón tay hoặc chuột và tự chấm đúng sai. Dùng thư viện miễn phí HanziWriter.
- Nút nghe phát âm (xem mục 6.1 về xử lý âm thanh).

### Tab B. Đồng tự dị nghĩa (同形異義語)  ★ MỤC ĐẶC TRƯNG CỦA APP

Chữ và từ viết GIỐNG NHAU giữa tiếng Trung và tiếng Nhật nhưng NGHĨA KHÁC NHAU.
Đây là lỗi sai phổ biến nhất của người biết tiếng Nhật khi học tiếng Trung, và
là điểm khác biệt lớn nhất của app so với các app tiếng Trung thông thường.

Mỗi thẻ gồm:

- Chữ viết, hiển thị cả dạng giản thể Trung và dạng chữ Nhật.
- Cột TRUNG: pinyin + nghĩa tiếng Trung + câu ví dụ tiếng Trung.
- Cột NHẬT: cách đọc + nghĩa tiếng Nhật + câu ví dụ tiếng Nhật.
- Cột VIỆT: giải thích ngắn sự khác biệt, nhấn mạnh chỗ dễ nhầm.
- Nhãn phân loại mức độ nguy hiểm:
  [Nghĩa lệch nhẹ] / [Nghĩa khác hẳn] / [Dễ gây hiểu lầm nghiêm trọng]

LƯU Ý BẮT BUỘC HIỂN THỊ TRONG TAB NÀY (đặt ở đầu tab, và có thể thu gọn lại
sau khi người dùng đọc lần đầu):

"Nhiều cặp từ dưới đây khi viết ra trông hơi khác nhau giữa tiếng Trung và
tiếng Nhật, ví dụ 検討 và 检讨, hay 質問 và 质问. Đây CHỈ là khác biệt giữa chữ
giản thể và chữ phồn thể / tự dạng Nhật, hoàn toàn không phải hai chữ khác
nhau. Âm Hán Việt và ý nghĩa gốc của chữ là GIỐNG NHAU HOÀN TOÀN. Điểm khác
nhau cần chú ý nằm ở NGHĨA CỦA TỪ khi dùng trong tiếng Trung và tiếng Nhật
hiện đại, chứ không nằm ở cách viết."

Không tạo thêm trường phân loại "đồng hình tuyệt đối" hay "đồng hình sau quy
đổi". Chỉ cần lưu ý trên là đủ.

Danh sách cần có: 手紙, 娘, 勉強, 汽車, 愛人, 大家, 走, 丈夫, 検討, 質問, 新聞,
先生, 工作, 経理, 切手, 湯, 床, 告訴, 可憐, 東西.

Chức năng:

- Lọc theo mức độ nguy hiểm và theo cấp HSK.
- Chế độ trắc nghiệm "chọn nghĩa đúng trong tiếng Trung", với đáp án nhiễu
  chính là nghĩa tiếng Nhật, đánh trúng thói quen sai.
- Những thẻ trả lời sai tự động được đưa vào phần ôn tập cuối tuần.

### Tab C. Từ vựng

- Thẻ từ: chữ Trung (có pinyin ruby) → tiếng Nhật (có furigana) → tiếng Việt.
- Phân loại theo cấp HSK 3.0 mức 1 / 2 / 3 và theo chủ đề.
- Câu ví dụ kèm bản dịch Nhật - Việt và nút nghe.
- Chế độ flashcard, trắc nghiệm, điền từ.

### Tab D. Mục tiêu hằng ngày

- Người dùng tự đặt mục tiêu mỗi ngày: số chữ Hán, số từ, hoặc số phút.
- Hiển thị tiến độ bằng hình MẶT TRỜI lấy từ logo Riyi: chưa đạt thì mờ xám,
  đạt mục tiêu thì mặt trời tỏa sáng rực rỡ kèm hiệu ứng động.
- Đếm chuỗi ngày liên tiếp (streak).
- Chỉ hoạt động khi đã đăng nhập.

### Tab E. Review cuối tuần

- Cuối tuần tự động tổng hợp toàn bộ quá trình học trong tuần: số chữ Hán,
  số từ, tỉ lệ đúng, số ngày đạt mục tiêu.
- Liệt kê các mục sai nhiều nhất, gồm cả đồng tự dị nghĩa, và cho luyện lại
  ngay tại màn hình review.
- Biểu đồ đơn giản so sánh với tuần trước.
- Chỉ hoạt động khi đã đăng nhập.

### Tab F. Ngữ pháp Trung - Nhật  ★ MỚI

Dạy ngữ pháp tiếng Trung bằng cách đối chiếu với cấu trúc tiếng Nhật mà người
học đã quen. Phạm vi: ngữ pháp HSK 3.0 cấp 1 đến cấp 3.

Mỗi thẻ ngữ pháp gồm:

1. Tên điểm ngữ pháp tiếng Trung và công thức.
2. Câu ví dụ tiếng Trung (có pinyin ruby).
3. CẤU TRÚC TIẾNG NHẬT TƯƠNG ĐƯƠNG. Nếu không có cấu trúc tương đương chính xác
   thì đưa về dạng GẦN TƯƠNG ĐƯƠNG và ghi rõ nhãn "gần tương đương, không trùng
   khít", kèm một câu nói rõ chỗ lệch.
4. Giải thích tiếng Việt ngắn gọn.
5. Cảnh báo lỗi thường gặp của người biết tiếng Nhật, đặc biệt là lỗi do khác
   trật tự từ: tiếng Trung là chủ - động - tân, tiếng Nhật là chủ - tân - động.

Những điểm bắt buộc phải có cảnh báo riêng vì tiếng Nhật không có cấu trúc trùng
khít:

- 了 (phân biệt rõ với た của tiếng Nhật, không được coi là tương đương)
- 把
- 被
- 比 và các dạng so sánh
- Bổ ngữ kết quả và bổ ngữ khả năng (结果补语, 可能补语)
- 的 / 得 / 地
- Lượng từ (量词) đối chiếu với 助数詞
- Trật tự trạng ngữ thời gian và nơi chốn

Chức năng: trắc nghiệm sắp xếp trật tự từ, và bài tập chọn cấu trúc đúng.

### 6.1 Xử lý âm thanh (TẠM THỜI ĐỂ TRỐNG)

- Giao diện có sẵn nút loa ở mọi chỗ cần phát âm.
- TẠM THỜI CHƯA GẮN NGUỒN ÂM THANH. Bấm nút thì hiện thông báo "Chức năng phát
  âm đang được chuẩn bị."
- Bắt buộc tách phần phát âm thành MỘT hàm duy nhất trong một file riêng, để sau
  này tôi chỉ cần thay nội dung hàm đó là toàn app có tiếng, không phải sửa
  giao diện.
- Tôi sẽ xác nhận sau về việc dùng giọng máy hay dùng file âm thanh sẵn.

## 7. Chức năng bổ sung (làm sau, ở giai đoạn cuối)

- Lặp lại ngắt quãng (SRS) kiểu Anki.
- Test phân loại trình độ đầu vào, cả tiếng Trung lẫn tiếng Nhật, để quyết định
  mức độ hỗ trợ tiếng Nhật nhiều hay ít.
- Luyện thanh điệu: nghe phân biệt 4 thanh và ghi âm giọng mình để so sánh.
- Tra cứu: nhập chữ Hán bất kỳ để xem đối chiếu Trung - Nhật - Việt.
- Thông báo nhắc học hằng ngày. Lưu ý: trên iPhone chỉ hoạt động khi app đã được
  thêm vào màn hình chính, nên đây là chức năng ưu tiên thấp.
- Dark mode, chỉnh cỡ chữ.
- Trang thống kê tổng: tổng số chữ đã thuộc, biểu đồ theo tháng.
- Đa ngôn ngữ giao diện.

## 8. Yêu cầu kỹ thuật

### 8.1 Dữ liệu

- Toàn bộ dữ liệu bài học nằm trong các file JSON tĩnh đặt cùng app, KHÔNG
  hard-code trong giao diện và KHÔNG lưu trên Firestore.
- Firestore CHỈ lưu tiến độ và cài đặt của người dùng, để tiết kiệm hạn mức
  miễn phí.
- Ghi Firestore theo lô, gộp lại cuối mỗi phiên học, không ghi từng thẻ một.
- Mỗi file JSON có trường version. App kiểm tra version khi mở, nếu có bản mới
  thì tải lại dữ liệu và xoá cache cũ.
- Trong Cài đặt có nút "Cập nhật nội dung" để tải lại dữ liệu thủ công.
- Service worker phải có cơ chế thông báo khi có phiên bản app mới, kèm nút
  "Tải lại để cập nhật". Không để người dùng bị kẹt ở bản cũ.

### 8.2 Code

- Giao diện đơn giản, ít chữ thừa, thao tác được bằng một tay trên điện thoại.
- Code có chú thích tiếng Việt, vì tôi không biết lập trình.
- Mọi thông báo lỗi hiện cho người dùng đều bằng tiếng Việt, ngắn gọn, không
  hiện mã lỗi tiếng Anh của Firebase.

## 9. Cách làm việc theo giai đoạn

Làm lần lượt, mỗi giai đoạn chạy được và tôi duyệt xong mới sang giai đoạn sau.
Mỗi giai đoạn phải nêu rõ TIÊU CHÍ NGHIỆM THU để tôi tự kiểm tra.

- **GĐ 0 – Nền móng.** Chốt cấu trúc file JSON cho 4 loại dữ liệu: chữ Hán,
  đồng tự dị nghĩa, từ vựng, ngữ pháp. Dựng khung dự án Vite + React + Tailwind
  chạy được, có menu 6 tab nhưng nội dung còn trống. Cài font đã cắt nhỏ và
  kiểm tra tự dạng Trung - Nhật hiển thị khác nhau đúng.
  Nghiệm thu: mở trên điện thoại thấy khung app, chữ 直 và 骨 hiển thị khác nhau
  giữa cột Trung và cột Nhật.

- **GĐ 1 – Tab A phần tĩnh.** 10 thẻ chữ Hán mẫu, đủ 3 cột tự dạng, pinyin ruby,
  âm On, âm Hán Việt, nghĩa 3 thứ tiếng. Chưa có animation nét.

- **GĐ 2 – Tab A phần viết tay.** Gắn HanziWriter: animation thứ tự nét và ô
  canvas viết tay chấm điểm.

- **GĐ 3 – Tab B.** 20 cặp đồng tự dị nghĩa theo danh sách, có lưu ý bắt buộc,
  bộ lọc và chế độ trắc nghiệm.

- **GĐ 4 – Tab C.** Từ vựng với flashcard, trắc nghiệm, điền từ. Dữ liệu mẫu
  khoảng 100 từ HSK 1.

- **GĐ 5 – Tab F.** Ngữ pháp đối chiếu, khoảng 15 điểm ngữ pháp HSK 1 và 2.

- **GĐ 6 – Đăng nhập.** Firebase Google Sign-In, chế độ khách, lưu tiến độ lên
  Firestore, đồng bộ giữa hai thiết bị.

- **GĐ 7 – Tab D và Tab E.** Mục tiêu hằng ngày với hiệu ứng mặt trời, streak,
  review cuối tuần và biểu đồ.

- **GĐ 8 – Hoàn thiện PWA.** manifest, icon đủ kích cỡ, splash, cơ chế cập nhật
  phiên bản, màn hình báo mất mạng.

- **GĐ 9 – Mở rộng nội dung.** Bổ sung đầy đủ HSK 3.0 cấp 1 đến cấp 3.

- **GĐ 10 – Chức năng bổ sung ở mục 7.**

## 10. Quy tắc bắt buộc khi làm việc với tôi

- Trước khi bắt đầu mỗi giai đoạn, hãy liệt kê những điểm còn chưa rõ và hỏi lại
  tôi. Không tự quyết.
- Nếu không chắc chắn về thông tin gì, đặc biệt là âm đọc, nghĩa chữ Hán, cặp
  đồng tự dị nghĩa, hay cấu trúc ngữ pháp tương đương, PHẢI NÓI RÕ LÀ CHƯA CHẮC
  CHẮN. Tuyệt đối không đoán.
- Không tự ý đổi nền tảng kỹ thuật đã chốt ở mục 2.
- Không tự ý thêm chức năng ngoài phạm vi giai đoạn đang làm.
