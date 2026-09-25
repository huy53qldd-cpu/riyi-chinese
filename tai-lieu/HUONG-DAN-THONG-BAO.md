# Hướng dẫn bật thông báo nhắc học

Tài liệu này dành cho chủ dự án (không cần biết lập trình). Làm theo đúng thứ
tự, mỗi bước chỉ mất vài phút. Làm xong một lần là chạy mãi.

Sau khi làm xong, mỗi ngày app sẽ gửi 3 thông báo theo giờ Việt Nam:

| Giờ | Nội dung |
|-----|----------|
| 7h  | Chào ngày mới (10 câu quay vòng), hôm nào là ngày lễ Việt – Trung – Nhật thì báo ngày lễ |
| 14h | "Riyi – Tiến độ hôm nay: ...%" kèm câu động viên theo mức % |
| 21h | Như 14h nhưng theo chủ đề "điều học trước khi ngủ sẽ theo bạn vào giấc mơ" |

> **CẬP NHẬT (quyết định 18.56).** GitHub Actions hay chạy trễ 3–5 tiếng nên
> thông báo tới sai giờ (có hôm 1 giờ sáng). Chủ dự án đã chọn nâng Firebase lên
> **gói Blaze** để dùng **Cloud Functions**: gửi ĐÚNG giờ 7h / 14h / 21h, và tài
> khoản quản trị gửi được thông báo tự soạn bất kỳ lúc nào (Cài đặt → "Gửi
> thông báo cho mọi người"). Lịch tự chạy trên GitHub đã bỏ; bước 2–3 bên dưới
> (service account, GitHub Secret) nay chỉ cần cho công cụ chạy thử bằng tay.
> Xem mục **"Nâng gói Blaze và đưa hàm lên máy chủ"** ở cuối tài liệu.

**Vì sao phải làm mấy bước này?** (Viết lúc còn gói Spark.) Firebase gói Spark
(miễn phí) không chạy được Cloud Functions, nên người "bấm nút gửi" đúng giờ là
GitHub Actions. Nó cần chìa khoá để thay mặt app gửi thông báo — chìa khoá đó
chính là hai thứ ta lấy ở bước 1 và bước 2.

---

## Bước 1. Lấy khoá thông báo (VAPID key) cho app

1. Mở https://console.firebase.google.com → chọn dự án **riyi-chinese**.
2. Bấm bánh răng ⚙ cạnh "Project Overview" → **Project settings**.
3. Sang thẻ **Cloud Messaging**.
4. Kéo xuống mục **Web configuration** → **Web Push certificates**.
5. Bấm **Generate key pair**. Màn hình hiện một chuỗi dài (khoảng 87 ký tự),
   bắt đầu bằng chữ `B`.
6. Bấm biểu tượng sao chép chuỗi đó.
7. Trên máy, mở file `.env` trong thư mục `Riyi Chinese` bằng Notepad, thêm
   một dòng ở cuối:

   ```
   VITE_VAPID_KEY=dán_chuỗi_vừa_chép_vào_đây
   ```

   Lưu file. (File `.env` không bao giờ được đưa lên GitHub, đã chặn sẵn.)

8. Báo Claude để chạy `npm run trien-khai` lại — app mới có khoá này.

---

## Bước 2. Tạo "tài khoản máy" để GitHub gửi thay

1. Vẫn ở **Project settings**, sang thẻ **Service accounts**.
2. Bấm **Generate new private key** → **Generate key**.
3. Máy tải về một file `.json` (tên kiểu `riyi-chinese-firebase-adminsdk-xxxxx.json`).

   ⚠️ File này là CHÌA KHOÁ TOÀN QUYỀN của dự án. Không gửi cho ai, không đưa
   lên GitHub dưới dạng file. Chỉ dán nội dung vào chỗ Secret ở bước 3.

---

## Bước 3. Dán chìa khoá vào GitHub

1. Mở https://github.com/huy53qldd-cpu/riyi-chinese
2. Bấm thẻ **Settings** (thanh trên cùng của kho, không phải Settings tài khoản).
3. Cột trái: **Secrets and variables** → **Actions**.
4. Bấm **New repository secret**.
5. Điền:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Secret**: mở file `.json` vừa tải ở bước 2 bằng Notepad, chọn hết
     (Ctrl+A), chép (Ctrl+C), rồi dán toàn bộ vào ô này.
6. Bấm **Add secret**.
7. Xoá file `.json` trên máy đi cho an toàn (nếu cần lại thì tạo khoá mới).

---

## Bước 4. Bật chạy tự động

1. Vẫn ở kho GitHub, bấm thẻ **Actions**.
2. Nếu GitHub hỏi "Workflows aren't being run on this forked repository" hoặc
   hiện nút **I understand my workflows, go ahead and enable them** thì bấm nút đó.
3. Cột trái chọn **Thông báo nhắc học**.
4. Bấm **Run workflow** để thử ngay:
   - **Khung giờ muốn thử**: `7h`
   - **Chỉ chạy thử, không gửi thật**: để nguyên `true`
   - Bấm **Run workflow**.
5. Đợi khoảng 1 phút, bấm vào lần chạy vừa hiện ra → xem mục **Gửi**. Ở đó in
   ra ai sẽ nhận và nội dung gì. Chưa gửi thật, chỉ in ra xem trước.
6. Muốn gửi thật thì chạy lại, bỏ dấu tick ở ô "Chỉ chạy thử".

Từ đó trở đi GitHub tự chạy mỗi ngày 3 lần, không cần làm gì thêm.
Giờ chạy thật là 7h, 14h, 21h giờ Việt Nam; GitHub có thể trễ vài phút, đó là
chuyện bình thường của dịch vụ miễn phí.

---

## Bước 5. Bật nhận thông báo trên điện thoại

1. Mở https://riyi-chinese.web.app, đăng nhập.
2. Vào **Cài đặt** → mục **Thông báo nhắc học** → gạt **Nhắc học mỗi ngày**.
3. Trình duyệt hỏi quyền → chọn **Cho phép**.

**Riêng iPhone:** iOS chỉ cho phép thông báo khi app đã được **cài vào màn hình
chính**. Mở Safari → bấm nút Chia sẻ → **Thêm vào MH chính** → mở Riyi từ biểu
tượng đó rồi mới bật thông báo.

Tắt lúc nào cũng được bằng chính công tắc đó.

---

## Kiểm tra bảng ngày lễ

Bảng ngày đặc biệt nằm ở `public/du-lieu/ngay-dac-biet.json`, hiện có năm 2026
và 2027. Ngày âm lịch (Tết, Trung thu, Vu Lan…) và tiết khí (Thanh Minh, Xuân
phân, Thu phân) do máy quy đổi bằng thuật toán, **cần anh rà lại**. Muốn xem
bảng dạng dễ đọc thì bảo Claude chạy:

```
npm run dung-ngay-dac-biet
```

Muốn thêm năm 2028 trở đi: sửa dòng `NAM = [2026, 2027]` trong
`cong-cu/dung-ngay-dac-biet.py` rồi chạy lại lệnh trên.

---

## Khi có trục trặc

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Cài đặt báo "App chưa được cấu hình khoá thông báo" | Chưa có `VITE_VAPID_KEY` trong `.env`, hoặc có rồi nhưng chưa deploy lại |
| Bật công tắc thì báo đã từ chối quyền | Trước đó đã bấm "Chặn" trong trình duyệt; phải vào cài đặt trình duyệt cho phép lại |
| iPhone không nhận được gì | Chưa cài app vào màn hình chính |
| GitHub Actions báo "Thiếu FIREBASE_SERVICE_ACCOUNT" | Secret ở bước 3 chưa tạo hoặc gõ sai tên |
| Chạy đúng nhưng không ai nhận | Chưa có ai bật công tắc trong Cài đặt (mục "0 người đã bật thông báo") |

Thông báo đã gửi mà người dùng gỡ app hoặc chặn quyền thì mã thiết bị hỏng;
bộ gửi tự xoá mã đó, không cần làm gì.

---

## Nâng gói Blaze và đưa hàm lên máy chủ (quyết định 18.56)

Chỉ làm MỘT lần.

1. Mở https://console.firebase.google.com/project/riyi-chinese/usage/details
2. Bấm **Modify plan** (hoặc "Upgrade") → chọn **Blaze (Pay as you go)**.
3. Chọn hoặc tạo tài khoản thanh toán Google Cloud, nhập thẻ.
4. Khi Firebase hỏi **ngân sách (budget)**, đặt mức thấp, ví dụ **1 USD** hoặc
   **25.000 đ**: vượt mức là Google gửi email cảnh báo. (Cảnh báo chứ không
   tự dừng, nhưng với số người dùng hiện tại gần như không tốn gì: Cloud
   Functions và Cloud Scheduler đều có phần miễn phí hằng tháng lớn hơn nhiều
   so với nhu cầu của Riyi.)
5. Báo Claude. Claude chạy `npm run trien-khai-ham` để đưa 4 hàm lên máy chủ
   (vùng Singapore, gần Việt Nam nhất):

| Hàm | Việc |
|-----|------|
| `nhacHoc7h`, `nhacHoc14h`, `nhacHoc21h` | Gửi nhắc học đúng giờ Việt Nam |
| `guiThongBaoToanBo` | Nút "Gửi cho mọi người" trong Cài đặt (chỉ tài khoản quản trị) |

Lần deploy đầu, Firebase tự bật các dịch vụ Google Cloud cần thiết (Cloud
Functions, Cloud Build, Artifact Registry, Cloud Run, Cloud Scheduler), có thể mất
vài phút.

**Ai là quản trị?** Chỉ tài khoản Google của chủ dự án, ghi trong code
bằng mã tài khoản (UID) ở `src/thong-bao/quanTri.js`. Máy chủ tự kiểm tra lại
mã này mỗi lần gửi, nên người khác có sửa app cũng không gửi được.

**Ai nhận được?** Mọi người ĐÃ BẬT "Nhắc học mỗi ngày" trong Cài đặt. Người chưa
bật (chưa cho phép thông báo trên máy) thì trình duyệt không cho gửi tới họ.
