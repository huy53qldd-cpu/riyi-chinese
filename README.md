# Riyi — Học tiếng Trung cho người biết tiếng Nhật

App học tiếng Trung HSK cấp 1–3, dành cho người Việt đã có nền tảng tiếng Nhật
(N4–N1). Khai thác mối liên hệ Hán tự Trung – Nhật và âm Hán Việt để học nhanh hơn.

**Trạng thái: đã xong giai đoạn 9 (đủ nội dung HSK 1–3: 1000 từ vựng, 655 chữ Hán, 61 cặp đồng tự dị nghĩa, 70 điểm ngữ pháp). App đang chạy ở https://riyi-chinese.web.app. Toàn bộ nội dung là bản nháp, còn chờ chủ dự án rà (mục "Chưa kiểm tra" trong app).**

---

## Cài đặt trên một máy tính mới

Làm theo đúng thứ tự. Chỉ phải làm **một lần** cho mỗi máy.

### Bước 1 — Cài 3 phần mềm nền

Tải và cài, cứ bấm Next đến hết:

| Phần mềm | Tải ở đâu | Để làm gì |
| --- | --- | --- |
| **Node.js** (bản LTS) | nodejs.org | chạy app |
| **Python** (3.10 trở lên) | python.org | chạy các công cụ |
| **Git** | git-scm.com | tải code về, lưu lịch sử |

> Khi cài Python, nhớ **tích vào ô "Add Python to PATH"** ở màn hình đầu tiên.
> Bỏ qua ô này thì các lệnh công cụ sẽ báo không tìm thấy Python.

### Bước 2 — Tải code về

Mở Terminal (hoặc Command Prompt), gõ từng dòng:

```
cd Desktop
git clone https://github.com/huy53qldd-cpu/riyi-chinese.git
cd riyi-chinese
```

Lần đầu sẽ hiện cửa sổ đăng nhập GitHub, đăng nhập bình thường.

### Bước 3 — Cài thư viện

```
npm install
pip install -r cong-cu/thu-vien-python.txt
```

Bước này tải khá nhiều thứ, mất vài phút.

### Bước 4 — Khai báo tên để lưu lịch sử

```
git config user.name "huy53qldd-cpu"
git config user.email "huy53qldd@gmail.com"
git config --global pull.rebase true
```

> Dòng thứ ba làm cho lịch sử sửa đổi thẳng một hàng, dễ đọc. Nếu lúc cài Git
> anh đã chọn "Rebase" rồi thì gõ lại cũng không sao.

### Bước 5 — Chạy thử

```
npm run dev
```

Mở địa chỉ hiện ra là xong. App chạy được ngay, **không cần** tải font hay rút
lại dữ liệu, vì những thứ đó đã nằm sẵn trong kho.

### Bước 6 — Chỉ khi cần sửa font

Font **gốc** chưa cắt nặng 27 MB nên không lưu trong kho. Chỉ khi nào cần cắt
lại font (tức là sau khi thêm bài học mới) thì gõ:

```
npm run tai-font
npm run cat-font
```

---

## Làm việc trên hai máy

Để hai máy không giẫm chân nhau, giữ đúng thói quen này:

**Trước khi bắt đầu làm** — lấy về thay đổi mới nhất:
```
git pull
```

**Sau khi làm xong** — đẩy lên cho máy kia lấy được:
```
git add -A
git commit -m "mô tả ngắn việc vừa làm"
git push
```

> Nếu quên `git pull` trước khi làm, lúc `git push` sẽ bị báo lỗi. Khi đó chỉ
> cần gõ `git pull` rồi `git push` lại là xong. Cứ bình tĩnh, code không mất
> đi đâu cả.

### Bắt đầu trên một máy mới: cần tải thêm gì?

Sau khi làm Bước 1 đến 4 ở đầu file này (cài Node, Python, Git, tải code về, cài
thư viện), phần còn lại tuỳ việc định làm:

| Việc định làm | Cần làm thêm |
| --- | --- |
| Chạy app, xem, sửa giao diện | Không cần gì thêm. Dữ liệu bài học đã dựng sẵn trong kho |
| Đăng nhập Google, lưu tiến độ | Tạo file `.env` (xem mục "Kết nối Firebase"). File này **không** nằm trên GitHub, mỗi máy tự tạo |
| Dựng lại dữ liệu (`npm run dung-...`) | Chạy **`npm run tai-nguon-mo`** một lần. Lệnh này tải KANJIDIC2, JMdict, CC-CEDICT, Tatoeba, KanjiVG (khoảng 70 MB, nặng nên không lưu trên GitHub) |
| Cắt lại font | `npm run tai-font` rồi `npm run cat-font` |

Với Claude: mở phiên làm việc mới ở thư mục dự án và nói **"Đọc
`tai-lieu/QUYET-DINH-DA-CHOT.md` và `CLAUDE.md` trước khi làm gì."** File đó ghi
mọi quyết định đã chốt, đang làm tới giai đoạn nào, và đang chờ anh việc gì.

---

## Chạy app trên máy

Mở Terminal ở thư mục này rồi gõ:

```
npm install
npm run dev
```

Màn hình sẽ in ra hai địa chỉ:

```
Local:    http://localhost:5173/          <- mở trên chính máy tính này
Network:  http://192.168.x.x:5173/        <- gõ địa chỉ này vào điện thoại
```

**Để mở trên điện thoại:** điện thoại và máy tính phải dùng **chung một wifi**.
Gõ địa chỉ dòng `Network` vào trình duyệt điện thoại.

Dừng lại bằng cách bấm `Ctrl + C` trong Terminal.

---

## Cấu trúc thư mục

```
Riyi Chinese/
├── src/                      MÃ NGUỒN APP
│   ├── man-hinh/             các màn hình
│   ├── thanh-phan/           những mảnh dùng lại nhiều nơi
│   ├── am-thanh/phatAm.js    ★ toàn bộ việc phát âm nằm ở đúng file này
│   ├── styles/tokens.css     ★ toàn bộ MÀU SẮC nằm ở đúng file này
│   └── du-lieu/hsk-goc/      dữ liệu HSK thô rút từ PDF
│
├── public/                   FILE TĨNH, app tải trực tiếp
│   ├── du-lieu/              dữ liệu bài học (JSON)
│   │   ├── CAU-TRUC-DU-LIEU.md   ★ mô tả cấu trúc 4 loại dữ liệu
│   │   ├── manifest.json         bảng phiên bản dữ liệu
│   │   └── mau/                  file mẫu để xem cấu trúc
│   ├── fonts/                font đã cắt nhỏ
│   └── hinh/                 logo và icon
│
├── cong-cu/                  CÔNG CỤ, chạy khi cần
├── tai-lieu/                 PDF đại cương HSK chính thức
└── thuong-hieu/              file logo gốc
```

---

## Các lệnh có sẵn

| Lệnh | Việc nó làm |
| --- | --- |
| `npm install` | Cài thư viện Node (lần đầu trên máy mới) |
| `pip install -r cong-cu/thu-vien-python.txt` | Cài thư viện Python (lần đầu trên máy mới) |
| `npm run dev` | Chạy app để xem thử |
| `npm run build` | Đóng gói app để đưa lên mạng |
| `npm run tai-font` | Tải font gốc về (chỉ cần khi máy mới) |
| `npm run cat-font` | **Cắt nhỏ font theo chữ đang dùng** |
| `npm run rut-hsk` | Rút lại dữ liệu HSK từ file PDF |
| `npm run tach-logo` | Cắt lại logo và tạo icon (khi đổi file logo) |
| `npm run tao-splash` | Tạo lại ảnh màn hình chờ cho iPhone/iPad (sau khi chạy `tach-logo`) |
| `npm run so-sanh-tu-dang` | Đo xem chữ Trung và Nhật vẽ khác nhau bao nhiêu |
| `npm run tai-nguon-mo` | Tải các file nguồn mở, cần trước khi chạy các lệnh `dung-...` trên máy mới |
| `npm run dung-chu-han` | Dựng lại dữ liệu chữ Hán (Tab A) |
| `npm run dung-net-viet` | Dựng lại dữ liệu nét viết (tập viết) |
| `npm run dung-dong-tu` | Dựng lại dữ liệu đồng tự dị nghĩa (Tab B) |
| `npm run dung-tu-vung` | Dựng lại dữ liệu từ vựng (Tab C) |
| `npm run dung-ngu-phap` | Dựng lại dữ liệu ngữ pháp (Tab F) |
| `npm run trien-khai` | Đóng gói và **đưa app lên mạng** (Firebase Hosting) |

> **Quan trọng:** mỗi khi thêm bài học mới, nhớ chạy `npm run cat-font`.
> Công cụ tự đi quét dữ liệu và tự thêm chữ mới vào font, nên không cần khai báo tay.
> Nếu quên, chữ mới sẽ hiện ra ô vuông trống.

---

## Ba quy tắc quan trọng nhất khi sửa code

### 1. Màu sắc chỉ nằm ở một chỗ

Toàn bộ màu nằm trong `src/styles/tokens.css`. Muốn đổi màu cả app thì sửa
4 dòng màu gốc ở đầu file đó. Không viết mã màu trực tiếp vào màn hình nào cả.

4 màu lấy từ chính file logo:

| Màu | Mã | Dùng vào đâu |
| --- | --- | --- |
| Cam mặt trời | `#F0600F` | mặt trời, nút bấm, điểm nhấn |
| Nâu đậm | `#2A1F1A` | chữ, nền theme tối |
| Kem sáng | `#FFF6E5` | nền theme sáng |
| Be phụ | `#EADFCB` | nền thẻ, viền |

> Cam đặt trên nền kem chỉ đạt tương phản 3.06:1, **không đủ cho chữ nhỏ**.
> Chữ nhỏ luôn dùng màu nâu đậm (14.94:1).

### 2. Tiếng Trung và tiếng Nhật phải tách riêng

Cùng một mã Unicode nhưng hai ngôn ngữ vẽ nét khác nhau (直, 骨, 今, 言...).
Vì vậy:

- Viết chữ Trung: dùng `<ChuTrung>` — tự gắn `lang="zh-CN"` và font Noto Sans SC
- Viết chữ Nhật: dùng `<ChuNhat>` — tự gắn `lang="ja"` và font Noto Sans JP

Không tự viết chữ Hán trực tiếp ra màn hình, vì rất dễ quên thuộc tính `lang`,
mà thiếu nó thì trình duyệt vẽ sai tự dạng dù font đã đúng.

### 3. Phát âm chỉ nằm ở một hàm

Mọi nút loa đều gọi vào hàm `phatAm()` trong `src/am-thanh/phatAm.js`.
Khi nào chốt dùng giọng máy hay file thu sẵn, chỉ cần sửa nội dung hàm đó là
toàn app có tiếng, không phải đụng vào màn hình nào.

---

## Nguồn dữ liệu

Danh sách từ, chữ và ngữ pháp lấy từ **một nguồn chuẩn duy nhất**:

> 新版HSK考试大纲（词汇、汉字、语法）
> 中外语言交流合作中心 phát hành — công bố 2025-11, áp dụng 2026-07

Số liệu đã rút được (cấp 1–3, số thứ tự liên tục, không sót mục nào):

| | Cấp 1 | Cấp 2 | Cấp 3 | Tổng |
| --- | ---: | ---: | ---: | ---: |
| Từ vựng | 300 | 200 | 500 | **1000** |
| Chữ Hán (认读字) | 246 | 125 | 284 | **655** |

---

## Kết nối Firebase và đưa app lên mạng

App chạy được ngay cả khi CHƯA kết nối Firebase (ở chế độ khách, không lưu tiến
độ). Làm các bước dưới đây **một lần** để có đăng nhập Google, lưu tiến độ, và để
dùng được trên điện thoại từ bất cứ đâu. Tất cả đều nằm trong gói miễn phí (Spark).

> **Vì sao phải đưa lên mạng mới thử được đăng nhập trên điện thoại?** Google
> chỉ cho đăng nhập từ `localhost` hoặc một tên miền thật. Địa chỉ kiểu
> `192.168.x.x` (địa chỉ mạng nhà khi chạy `npm run dev`) bị Google từ chối. Học
> ở chế độ khách qua địa chỉ đó thì vẫn được.

### Bước A — Lấy 6 dòng cấu hình

1. Vào **console.firebase.google.com**, mở dự án của anh.
2. Bấm bánh răng cạnh "Project Overview" → **Project settings** (Cài đặt dự án).
3. Kéo xuống mục **Your apps**. Chưa có app nào thì bấm biểu tượng **`</>`** (Web),
   đặt tên bất kỳ (ví dụ "riyi"), **không** tích "Firebase Hosting" ở bước này,
   bấm Register.
4. Màn hình hiện một đoạn `firebaseConfig = { apiKey: "...", ... }`.
5. Trong thư mục `riyi-chinese`, **sao chép file `.env.example` thành `.env`**
   (giữ nguyên thư mục), mở `.env` bằng Notepad và điền 6 giá trị tương ứng, không
   có dấu ngoặc kép. Ví dụ: `VITE_FIREBASE_PROJECT_ID=ten-du-an-cua-anh`.

File `.env` **không** lên kho Git (đã chặn sẵn).

### Bước B — Bật đăng nhập Google

1. Trong Firebase Console: **Build → Authentication → Get started**.
2. Thẻ **Sign-in method** → chọn **Google** → bật **Enable**, chọn email hỗ trợ
   → **Save**.
3. Thẻ **Settings → Authorized domains**: có sẵn `localhost` và tên miền của dự án
   (dạng `ten-du-an.web.app`). Đủ dùng, không cần thêm gì.

### Bước C — Tạo cơ sở dữ liệu Firestore

1. **Build → Firestore Database → Create database**.
2. Chọn chế độ **Production mode** (bảo mật, quy tắc sẽ được đưa lên ở Bước D).
3. Chọn nơi đặt máy chủ gần Việt Nam (ví dụ `asia-southeast1` Singapore).
   **Không đổi lại được sau này.**

### Bước D — Đưa app lên mạng (làm một lần cài đặt, sau đó mỗi lần một lệnh)

Gõ từng dòng trong Terminal, đang đứng trong thư mục `riyi-chinese`:

```
npm install -g firebase-tools
firebase login
firebase use --add
```

- Lệnh 2 mở trình duyệt để đăng nhập tài khoản Google (dùng tài khoản của dự án).
- Lệnh 3: chọn dự án của anh trong danh sách, đặt tên viết tắt là `default`.

Rồi mỗi lần muốn cập nhật app lên mạng:

```
npm run trien-khai
```

Lệnh này đóng gói app và đưa lên cùng với quy tắc bảo mật Firestore. Xong sẽ in
ra địa chỉ (dạng `https://ten-du-an.web.app`). Mở địa chỉ đó trên điện thoại rồi
bấm **Đăng nhập bằng Google** để thử.

### Nếu gặp lỗi

| Hiện tượng | Nguyên nhân thường gặp |
| --- | --- |
| Nút đăng nhập báo "chưa được kết nối Firebase" | Chưa có file `.env`, hoặc chưa chạy lại `npm run dev` sau khi sửa `.env` |
| "Địa chỉ này chưa được phép đăng nhập" | Đang mở app bằng địa chỉ `192.168...`, hoặc tên miền chưa có trong Authorized domains |
| "Chưa lưu được tiến độ" | Chưa làm Bước C hoặc chưa đưa quy tắc bảo mật lên (`npm run trien-khai`) |

## Cài Riyi vào màn hình chính điện thoại

Mở **https://riyi-chinese.web.app** rồi:

- **iPhone (Safari):** bấm nút Chia sẻ (ô vuông có mũi tên lên) → **Thêm vào
  MH chính** → Thêm. Phải dùng Safari, Chrome trên iPhone không cài được.
- **Android (Chrome):** bấm dấu ⋮ góc trên → **Cài đặt ứng dụng** (hoặc
  "Thêm vào màn hình chính").

App mở toàn màn hình như ứng dụng thật, có màn hình chờ logo Riyi.

**Cập nhật:** mỗi lần chạy `npm run trien-khai`, người đang mở app sẽ thấy dải
"Đã có phiên bản mới của Riyi" kèm nút **Tải lại để cập nhật**. Không cần gỡ
app cài lại.

**Sửa dữ liệu bài học:** nhớ TĂNG `phienBan` của file vừa sửa và
`phienBanDuLieu` trong `public/du-lieu/manifest.json`. Không tăng thì điện
thoại có thể vẫn dùng bản cũ đã lưu.

**Mất mạng:** Riyi không học được khi mất mạng (theo yêu cầu). App hiện thông báo
"Cần kết nối mạng để sử dụng Riyi." và tự chạy tiếp khi có mạng lại.

---

## Nền tảng kỹ thuật

Vite + React + Tailwind CSS v4. Firebase: đăng nhập Google, Firestore, Hosting
(gói Spark miễn phí). App cần mạng, **không** chạy offline.

Dữ liệu tham khảo đã dùng, ghi nguồn một dòng: KANJIDIC2, JMdict (EDRDG, CC BY-SA),
Unihan (Unicode), CC-CEDICT (MDBG, CC BY-SA), KanjiVG (CC BY-SA 3.0), hanzi-writer-data
(Arphic), Tatoeba (CC BY 2.0 FR).

## Tiến độ theo giai đoạn

- [x] **GĐ 0** — Nền móng: cấu trúc JSON, khung app 6 tab, font đã cắt
- [x] GĐ 1 — Tab A phần tĩnh (10 thẻ chữ Hán)
- [x] GĐ 2 — Tab A phần viết tay (HanziWriter)
- [x] GĐ 3 — Tab B (20 cặp đồng tự dị nghĩa)
- [x] GĐ 4 — Tab C (100 từ HSK 1)
- [x] GĐ 5 — Tab F (15 điểm ngữ pháp)
- [x] GĐ 6 — Đăng nhập Google, Firestore, màn hình Cài đặt (đã kết nối Firebase)
- [x] GĐ 7 — Luyện tập ở Tab B, C, F; Tab D mục tiêu ngày; Tab E review tuần
- [x] GĐ 8 — Hoàn thiện PWA: cài vào màn hình chính, splash, báo bản mới, báo mất mạng, phiên bản dữ liệu
- [x] GĐ 9 — Bổ sung đầy đủ HSK 1–3: 1000 từ, 655 chữ (có nét viết Trung/Nhật), 61 cặp đồng tự, 70 điểm ngữ pháp
- [ ] GĐ 10 — Chức năng bổ sung
