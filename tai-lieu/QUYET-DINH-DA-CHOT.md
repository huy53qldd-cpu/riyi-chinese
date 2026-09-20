# Nhật ký quyết định — dự án Riyi

File này ghi lại **mọi quyết định đã chốt** giữa chủ dự án và Claude, kèm lý do.

**Mục đích:** để bất kỳ phiên làm việc nào sau này — trên máy khác, hoặc sau
vài tháng quên hết — đều đọc được và làm tiếp ngay, không phải hỏi lại những
thứ đã quyết.

> Quy tắc dự án ghi rõ: *"Trước khi bắt đầu, liệt kê điểm chưa rõ và hỏi lại.
> Không tự quyết."* File này là bộ nhớ của quy tắc đó. Việc nào đã có trong
> đây thì **không hỏi lại nữa**.

Cập nhật lần cuối: 2026-09-20 — sau khi xong giai đoạn 0.

---

## 1. Nhận diện và giao diện

| # | Quyết định | Ghi chú |
| --- | --- | --- |
| 1.1 | Tên chữ Hán của app là **日怡** | Không phải 日一 hay 日意 như bản yêu cầu ghi |
| 1.2 | Logo gốc là **một file** chứa 3 biến thể ghép chung | `thuong-hieu/Riyi Chinese.png`, đã tự cắt ra bằng `cong-cu/tach-logo.py` |
| 1.3 | Bảng màu lấy **trực tiếp từ file logo**, đúng 4 màu | Xem bảng bên dưới |
| 1.4 | Toàn bộ màu gom vào **một file duy nhất** | `src/styles/tokens.css` |

### Bốn màu thương hiệu

| Màu | Mã | Dùng vào đâu |
| --- | --- | --- |
| Cam mặt trời | `#F0600F` | mặt trời, nút bấm, điểm nhấn |
| Nâu đậm | `#2A1F1A` | chữ, nền theme tối |
| Kem sáng | `#FFF6E5` | nền theme sáng |
| Be phụ | `#EADFCB` | nền thẻ, viền |

> **Ràng buộc đã đo:** cam trên nền kem chỉ đạt tương phản **3.06:1**, không đủ
> cho chữ nhỏ (chuẩn cần 4.5:1). Cam chỉ dùng cho nút, viền, biểu tượng và
> tiêu đề to. Chữ nhỏ luôn dùng nâu đậm (14.94:1).

---

## 2. Bố cục 6 tab

Chốt tại câu hỏi A11.

```
┌─────────────────────────────┐
│  ☀ Mục tiêu hôm nay   12/20 │  ← thanh TRÊN, chỉ hiện khi đã đăng nhập
├─────────────────────────────┤
│        nội dung tab          │
├─────────────────────────────┤
│ Chữ Hán · Đồng tự · Từ vựng  │  ← thanh DƯỚI, 5 mục
│      · Ngữ pháp · Review     │
└─────────────────────────────┘
```

- **Mục tiêu hôm nay** đặt riêng ở thanh trên, vì với người học đây là thứ
  quan trọng nhất, phải thấy ngay không cần bấm tìm.
- Chế độ khách: ẩn hẳn thanh trên, thay bằng dải nhắc "Bạn đang học ở chế độ
  khách, tiến độ sẽ không được lưu."

---

## 3. Nguồn dữ liệu HSK

| # | Quyết định |
| --- | --- |
| 3.1 | Dùng **một nguồn chuẩn duy nhất**: file PDF chủ dự án cung cấp |
| 3.2 | Nguồn: 新版HSK考试大纲（词汇、汉字、语法）, 中外语言交流合作中心, công bố 2025-11, áp dụng 2026-07 |
| 3.3 | Mọi danh sách từ, chữ, pinyin **rút tự động từ PDF**, không gõ tay, không lấy từ trí nhớ |

### Số liệu đã rút được (cấp 1–3)

| | Cấp 1 | Cấp 2 | Cấp 3 | Tổng |
| --- | ---: | ---: | ---: | ---: |
| Từ vựng | 300 | 200 | 500 | **1000** |
| Chữ Hán (认读字) | 246 | 125 | 284 | **655** |

Số thứ tự từ vựng liên tục 1–1000, đã kiểm tra không sót mục nào.

> ⚠️ **Khác với bản HSK 3.0 năm 2021** (bản cũ có 500/772/973 từ và 300/300/300
> chữ). Bản 2025-11 này là bản mới hơn. Đã báo và chủ dự án xác nhận dùng bản mới.

### Hai ký hiệu đặc biệt trong PDF

| Ký hiệu | Nghĩa | Cách xử lý |
| --- | --- | --- |
| `1（4） 半` | Từ cấp 1, có thêm một nghĩa khác ở cấp 4 | Lưu `cap: 1`, `capPhu: [4]`. App chỉ dạy nghĩa cấp chính |
| `本1`, `点1` | Chữ số phân biệt từ đồng tự khác nghĩa | Tách thành mục riêng, giữ số phân biệt |
| `没（有）` | Ngoặc đơn = phần nói cũng được, bỏ cũng được | Lưu cả dạng đầy đủ và `dangRutGon` |

---

## 4. Quy ước hiển thị

| # | Quyết định | Lý do |
| --- | --- | --- |
| 4.1 | Pinyin lưu **tách theo từng chữ**, hai mảng song song | Lưu gộp thì pinyin trôi lệch, không khớp chữ nào |
| 4.2 | Furigana viết bằng **ngoặc vuông**: `漢字[かんじ]` | Gõ tay dễ, đọc bằng mắt cũng hiểu |
| 4.3 | Pinyin ghi **thanh điệu gốc**, biến điệu ghi riêng vào `ghiChuBienDieu` | Theo yêu cầu gốc |
| 4.4 | Ghi chú biến điệu **ghi sẵn trong dữ liệu**, không để code tự phát hiện | Tự phát hiện rất dễ sai, nhất là với 一 |
| 4.5 | Từ vựng và câu ví dụ: chỉ hiện **âm đọc đúng trong hoàn cảnh đó** | Chốt tại A8 |
| 4.6 | Thẻ chữ Hán đứng một mình (Tab A): hiện âm phổ biến nhất **to**, các âm khác nhỏ bên dưới, **mỗi âm đều kèm từ ví dụ** | Chốt tại A8 |

---

## 5. Tự dạng Trung – Nhật

| # | Quyết định |
| --- | --- |
| 5.1 | Hai ngôn ngữ dùng **hai font riêng**: Noto Sans SC và Noto Sans JP |
| 5.2 | Bắt buộc gắn `lang="zh-CN"` và `lang="ja"` — thiếu là vẽ sai tự dạng |
| 5.3 | Không viết chữ Hán trực tiếp ra màn hình, luôn dùng `<ChuTrung>` / `<ChuNhat>` |

### Tiêu chí nhãn so sánh tự dạng (chốt tại A9)

| Nhãn | Nghĩa |
| --- | --- |
| `giong-het` | Cùng một mã Unicode (ví dụ 人, 山) |
| `khac-mot-chut` | Nhận ra ngay là cùng chữ, chỉ khác vài nét |
| `khac-hoan-toan` | Chưa học thì không đoán ra được (门/門, 车/車) |

Nhãn này **do người nhập liệu quyết định**, không để code tự so sánh.

### ⚠️ Phát hiện quan trọng bổ sung cho tiêu chí trên

Tiêu chí "giống hệt = cùng mã Unicode" **chưa đủ**. Đã đo bằng máy (vẽ thật ra
ảnh rồi đếm điểm ảnh khác nhau) và phát hiện:

| Chữ | Cùng mã Unicode | Nhưng nét vẽ lệch |
| --- | --- | ---: |
| 今 | có | 48% |
| 言 | có | 48% |
| 空 | có | 47% |
| 直 | có | 43% |
| 次 | có | 29% |
| 骨 | có | 18% |

Còn 草, 雪, 半, 者, 番, 歩, 雨, 決, 毎 thì vẽ **giống hệt nhau thật** — không
dùng được để kiểm tra font.

→ Đã thêm trường riêng `khacNetVe` vào cấu trúc dữ liệu chữ Hán để đánh dấu.
→ Công cụ đo: `npm run so-sanh-tu-dang`

---

## 6. Đồng tự dị nghĩa (Tab B)

| # | Quyết định |
| --- | --- |
| 6.1 | Có trường `tonTaiTrongTiengTrung` | Vì vài từ Nhật (như 切手) **không tồn tại** như một từ trong tiếng Trung hiện đại. Khi đó app ghi rõ thay vì cố ghép nghĩa |
| 6.2 | Có lọc theo cấp HSK, cho phép giá trị `null` = ngoài HSK 1–3 |
| 6.3 | Lưu ý bắt buộc đầu tab để trong **dữ liệu**, không viết trong giao diện | Sửa câu chữ không phải sửa code |

---

## 7. Kỹ thuật

| # | Quyết định | Lý do |
| --- | --- | --- |
| 7.1 | **Tailwind CSS v4** | Cấu hình gọn hơn v3 |
| 7.2 | Chia file JSON **theo cấp HSK**, kèm `manifest.json` | Tải dần cho nhẹ |
| 7.3 | `phienBan` dùng **số tăng dần** (1, 2, 3), kèm `capNhatLuc` | Dễ hiểu |
| 7.4 | Font **cắt nhỏ theo ký tự thực dùng** — 26 MB còn 1,1 MB | Không bắt điện thoại tải font CJK đầy đủ |
| 7.5 | Công cụ cắt font **tự quét dữ liệu và mã nguồn** | Thêm bài mới chỉ cần chạy lại, không khai báo tay |
| 7.6 | Font **gốc** không lưu trong kho Git (27 MB) | Tải lại bằng `npm run tai-font` |
| 7.7 | Chưa dùng thư viện điều hướng (router) | Mới có 3 màn hình, thêm vào lúc này là thừa |
| 7.8 | Toàn bộ phát âm nằm trong **một hàm duy nhất** | `src/am-thanh/phatAm.js`. Chưa gắn nguồn âm thanh |

---

## 8. Kho code và cách làm việc

| # | Quyết định |
| --- | --- |
| 8.1 | Kho: `github.com/huy53qldd-cpu/riyi-chinese`, để **công khai** |
| 8.2 | File PDF đại cương **được lưu trong kho** — chủ dự án xác nhận tài liệu này tải công khai, tác giả chia sẻ miễn phí |
| 8.3 | Git dùng `pull.rebase true` để lịch sử thẳng hàng |
| 8.4 | Có `.gitattributes` khoá quy ước xuống dòng, để hai máy không sinh thay đổi giả |

### ⚠️ Không đưa vào kho công khai

- File lịch sử trò chuyện của Claude Code (`~/.claude/projects/.../*.jsonl`) —
  có chứa nội dung liệt kê thư mục máy công ty.
- Sau này: file cấu hình Firebase có khoá riêng (`.env`), đã chặn sẵn trong
  `.gitignore`.

---

## 9. Đang ở đâu, làm gì tiếp

### Đã xong

- [x] **GĐ 0 — Nền móng.** Cấu trúc 4 loại JSON, khung app 6 tab, font đã cắt,
      logo và icon, bảng màu, ô kiểm tra tự dạng.

### Đang chờ chủ dự án trả lời — **chặn GĐ 1**

1. **Cột phồn thể ở Tab A nên dùng font gì?**
   Bản yêu cầu chỉ chốt 2 font (SC và JP). Cột phồn thể hiện vẽ bằng Noto Sans
   SC — chữ hiện đúng, nhưng vài nét theo quy chuẩn Đại lục chứ không theo
   quy chuẩn Đài Loan. Muốn chuẩn hơn thì thêm font thứ ba **Noto Sans TC**
   (khoảng +500 KB). Đây là quyết định về nền tảng nên **không được tự quyết**.

2. **Duyệt GĐ 0** để bắt đầu GĐ 1.

### Còn nợ kỹ thuật, xử lý ở giai đoạn sau

| Việc | Xử lý ở |
| --- | --- |
| Gỡ ô "Khu vực tạm thời của giai đoạn 0" (công tắc giả lập đăng nhập) | GĐ 6 |
| Gỡ ô kiểm tra tự dạng và ô "Thử hiển thị ba thứ tiếng" | GĐ cuối |
| Gắn nguồn âm thanh thật vào `phatAm.js` | Chờ chủ dự án chốt giọng máy hay file thu sẵn |
| Nút bật/tắt furigana trong Cài đặt (CSS đã sẵn sàng, chưa có màn hình Cài đặt) | GĐ 6 |
| Nghĩa tiếng Nhật, âm On, âm Hán Việt, câu ví dụ — **PDF không có**, phải nhập thêm | GĐ 1–5 |

### Các giai đoạn còn lại

- [ ] GĐ 1 — Tab A phần tĩnh (10 thẻ chữ Hán)
- [ ] GĐ 2 — Tab A phần viết tay (HanziWriter)
- [ ] GĐ 3 — Tab B (20 cặp đồng tự dị nghĩa)
- [ ] GĐ 4 — Tab C (từ vựng, ~100 từ HSK 1)
- [ ] GĐ 5 — Tab F (ngữ pháp, ~15 điểm HSK 1–2)
- [ ] GĐ 6 — Đăng nhập Google, Firestore
- [ ] GĐ 7 — Tab D và Tab E (mục tiêu, review)
- [ ] GĐ 8 — Hoàn thiện PWA
- [ ] GĐ 9 — Bổ sung đầy đủ HSK 1–3
- [ ] GĐ 10 — Chức năng bổ sung

---

## 10. Cách dùng file này

**Khi mở phiên làm việc mới với Claude trên máy bất kỳ**, nói:

> Đọc `tai-lieu/QUYET-DINH-DA-CHOT.md` và `CLAUDE.md` trước khi làm gì.

Claude sẽ nắm được toàn bộ bối cảnh mà không cần hỏi lại từ đầu.

**Mỗi khi chốt thêm quyết định mới**, ghi vào đây rồi commit. Đừng để quyết định
chỉ nằm trong cửa sổ trò chuyện, vì cửa sổ đó không đi theo sang máy khác.
