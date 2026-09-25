# Hướng dẫn bật thông báo nhắc học

Tài liệu này dành cho chủ dự án (không cần biết lập trình). Làm theo đúng thứ
tự, mỗi bước chỉ mất vài phút. Làm xong một lần là chạy mãi.

Sau khi làm xong, mỗi ngày app sẽ gửi 3 thông báo theo giờ Việt Nam:

| Giờ | Nội dung |
|-----|----------|
| 7h  | Chào ngày mới (10 câu quay vòng), hôm nào là ngày lễ Việt – Trung – Nhật thì báo ngày lễ |
| 14h | "Riyi – Tiến độ hôm nay: ...%" kèm câu động viên theo mức % |
| 21h | Như 14h nhưng theo chủ đề "điều học trước khi ngủ sẽ theo bạn vào giấc mơ" |

> **CẬP NHẬT (quyết định 18.57).** Lịch cron của GitHub hay chạy trễ 3–5 tiếng
> (có hôm nhắc 21h tới lúc 1 giờ sáng). Nay dịch vụ miễn phí **cron-job.org** cứ
> 5 phút "gọi" GitHub chạy một lần, nên nhắc học tới đúng giờ (trễ tối đa ~5
> phút), và tài khoản quản trị gửi được thông báo tự soạn (Cài đặt → "Gửi thông
> báo cho mọi người"), tới máy mọi người sau khoảng 1–6 phút. Vẫn gói Spark,
> không cần thẻ. Làm bước 1–3 bên dưới (nếu chưa làm), rồi làm mục
> **"Cài cron-job.org"** ở cuối tài liệu.

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
4. Bấm **Run workflow** để thử ngay một khung nhắc học:
   - ô đầu (**tu-dong = việc của cron-job.org...**): gõ `khung`
   - **Khi viec = khung**: `7h`
   - **Chỉ chạy thử, không gửi thật**: TICK vào ô này
   - Bấm **Run workflow**.
5. Đợi khoảng 1 phút, bấm vào lần chạy vừa hiện ra → xem mục **Gửi**. Ở đó in
   ra ai sẽ nhận và nội dung gì. Chưa gửi thật, chỉ in ra xem trước.
6. Muốn gửi thật thì chạy lại, bỏ dấu tick ở ô "Chỉ chạy thử".

Để nhắc học tự chạy ĐÚNG GIỜ mỗi ngày, làm tiếp mục **"Cài cron-job.org"** ở
cuối tài liệu (quyết định 18.57).

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

## Cài cron-job.org (quyết định 18.57)

Chỉ làm MỘT lần, khoảng 10 phút. Gồm 2 phần: tạo "mã cho phép" trên GitHub, rồi
dán mã đó vào cron-job.org.

### Phần A. Tạo mã GitHub (chỉ được phép bấm chạy workflow của Riyi)

1. Mở https://github.com/settings/personal-access-tokens/new (đăng nhập GitHub).
2. **Token name**: `riyi-cron`.
3. **Expiration**: chọn thời hạn DÀI NHẤT có trong danh sách. Hết hạn thì
   thông báo ngừng chạy; khi đó tạo mã mới và dán lại vào cron-job.org.
4. **Repository access** → chọn **Only select repositories** → chọn
   **riyi-chinese**.
5. **Permissions** → **Repository permissions** → dòng **Actions** → chọn
   **Read and write**. (Dòng Metadata tự thành Read-only, để nguyên.)
   Không cấp thêm quyền nào khác.
6. Bấm **Generate token**, rồi bấm sao chép mã (bắt đầu bằng `github_pat_`).
   Mã chỉ hiện MỘT lần. **Không gửi mã này cho ai, kể cả dán vào khung chat.**

### Phần B. Tạo việc hẹn giờ trên cron-job.org

1. Mở https://console.cron-job.org/signup, đăng ký miễn phí, bấm link xác nhận
   trong email.
2. Bấm **CREATE CRONJOB**. Thẻ **COMMON**:
   - **Title**: `Riyi thông báo`
   - **URL**:
     ```
     https://api.github.com/repos/huy53qldd-cpu/riyi-chinese/actions/workflows/thong-bao.yml/dispatches
     ```
   - **Execution schedule**: chọn **Every 5 minutes**.
3. Thẻ **ADVANCED**:
   - **Request method**: `POST`
   - **Headers**: bấm **ADD** để thêm lần lượt 4 dòng (cột trái là Key, cột
     phải là Value):

     | Key | Value |
     |-----|-------|
     | `Accept` | `application/vnd.github+json` |
     | `Authorization` | `Bearer ` + mã vừa sao chép ở Phần A (có một dấu cách sau chữ Bearer) |
     | `X-GitHub-Api-Version` | `2022-11-28` |
     | `User-Agent` | `riyi-cron` |

   - **Request body**:
     ```
     {"ref":"main"}
     ```
4. Bấm **TEST RUN** → **START TEST RUN**. Đúng thì kết quả là
   **204 No Content**. Nếu ra 401 hoặc 403: mã ở Phần A sai hoặc thiếu quyền
   Actions; 404: URL gõ sai; 422: phần Request body sai.
5. Bấm **CREATE** để lưu.
6. Kiểm tra: mở https://github.com/huy53qldd-cpu/riyi-chinese/actions, cứ 5 phút
   có thêm một lần chạy "Thông báo nhắc học" màu xanh.

### Chạy thế nào

| Việc | Khi nào tới máy |
|------|-----------------|
| Nhắc học 7h / 14h / 21h | Lần chạy đầu tiên sau giờ đó, trễ tối đa ~5 phút. Nếu cả hệ thống ngừng quá 2 tiếng sau giờ của khung thì bỏ qua khung đó, không nhắc sai giờ |
| Quản trị bấm "Gửi cho mọi người" | Khoảng 1–6 phút. Trong Cài đặt, dòng "Đang chờ gửi" tự đổi thành "Đã gửi tới … thiết bị" |

GitHub vẫn có một lịch DỰ PHÒNG 20 phút một lần (hay trễ, nhưng không gửi trùng
vì mỗi khung đã gửi đều được ghi lại ở Firestore `heThong/nhacHoc`).

**Ai là quản trị?** Chỉ tài khoản Google của chủ dự án, ghi bằng mã tài khoản
(UID) ở `src/thong-bao/quanTri.js` và ở `firestore.rules` (hai chỗ phải
trùng nhau). Firestore chặn mọi tài khoản khác ghi vào hàng chờ, nên người khác
có sửa app cũng không gửi được.

**Ai nhận được?** Mọi người ĐÃ BẬT "Nhắc học mỗi ngày" trong Cài đặt. Người chưa
bật (chưa cho phép thông báo trên máy) thì trình duyệt không cho gửi tới họ.
