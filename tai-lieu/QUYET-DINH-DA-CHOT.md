# Nhật ký quyết định — dự án Riyi

File này ghi lại **mọi quyết định đã chốt** giữa chủ dự án và Claude, kèm lý do.

**Mục đích:** để bất kỳ phiên làm việc nào sau này — trên máy khác, hoặc sau
vài tháng quên hết — đều đọc được và làm tiếp ngay, không phải hỏi lại những
thứ đã quyết.

> Quy tắc dự án ghi rõ: *"Trước khi bắt đầu, liệt kê điểm chưa rõ và hỏi lại.
> Không tự quyết."* File này là bộ nhớ của quy tắc đó. Việc nào đã có trong
> đây thì **không hỏi lại nữa**.

Cập nhật lần cuối: 2026-09-21 — xong GĐ 8 (PWA).

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

### Đã chốt ngày 2026-09-20 (mở khoá GĐ 1)

1. **Cột phồn thể ở Tab A giữ Noto Sans SC**, không thêm font thứ ba. Chấp nhận
   vài nét theo chuẩn Đại lục thay vì Đài Loan, đổi lại không tốn thêm dung lượng.
2. **GĐ 0 đã được duyệt.** Bắt đầu GĐ 1.

### GĐ 1 — quyết định và kết quả (2026-09-20)

| # | Nội dung |
| --- | --- |
| 9.1 | 10 chữ: 人 学 今 好 车 书 见 东 爱 说 (đều HSK 1). Chủ dự án giao Claude đề xuất |
| 9.2 | Dữ liệu ngoài PDF lấy từ nguồn mở: KANJIDIC2 (âm On/Kun/Hán Việt) và Unihan (pinyin, phồn thể, số nét, bộ thủ). Dựng bằng `npm run dung-chu-han` |
| 9.3 | Nghĩa Trung/Nhật/Việt và từ ví dụ là **bản nháp Claude soạn**, còn nằm trong `cangKiemTra`. Chủ dự án (biết tiếng Nhật) rà lại từng chữ |
| 9.4 | Giấy phép: chủ dự án cho rằng dữ liệu công khai thì không cần ghi nguồn. Claude vẫn để **một dòng** trong trường `nguon` của file dữ liệu vì CC BY-SA yêu cầu ghi nguồn. Không hiện trong app |
| 9.5 | Chỉ 今 đánh dấu `khacNetVe` (đã đo và xem ảnh). 人 好 学 số đo lệch 9–28% nhưng nhìn bằng mắt là giống hệt |
| 9.6 | Bộ chức năng GĐ 1: danh sách thẻ, lọc cấp HSK, trang chi tiết. **Chưa làm** nút loa. Ô kiểm tra font tạm vẫn giữ |
| 9.7 | **Bỏ hẳn `nghia.trung`** khỏi dữ liệu chữ Hán (chủ dự án chốt 2026-09-20), vì chữ Trung bắt buộc có pinyin ruby mà câu giải nghĩa không có. Nghĩa chỉ còn Nhật → Việt |
| 9.8 | Ghi chú tiếng Việt có chèn chữ Hán/kana đi qua `VanBanPha`. Chữ Hán thuộc tiếng Nhật phải đánh dấu `{ja|言}` |

### GĐ 2 — quyết định và kết quả (2026-09-20)

| # | Nội dung |
| --- | --- |
| 10.1 | Luyện viết **chữ giản thể (Trung) và chữ Nhật**, hai nút chọn trong trang chi tiết. Không làm phồn thể |
| 10.2 | Chế độ: **Xem mẫu** (vẽ lại từng nét) và **Tập viết theo nét có gợi ý** (sai 3 lần thì gợi ý). Chưa lưu kết quả, đợi GĐ 6 |
| 10.3 | Nét chữ Trung: `hanzi-writer-data` (giấy phép Arphic). Nét chữ Nhật: **KanjiVG** (CC BY-SA 3.0), thư mục `kanji_kakijun/` chủ dự án tải. KanjiVG chỉ có đường tâm nên công cụ làm dày thành hình tô kín (không thon dần) |
| 10.4 | Nét được tải về kho (`public/du-lieu/net-viet/`, khoảng 200 KB cho 10 chữ), không gọi trang ngoài lúc chạy. Dựng bằng `npm run dung-net-viet` |
| 10.5 | `kanji_kakijun/` (273 MB) đã đưa vào `.gitignore`, chỉ nằm trên máy để công cụ đọc. **Không xoá** |
| 10.6 | Đã thử: 10/10 chữ có nét cả hai bên (kể cả 説). Mô phỏng vẽ đúng thì nhận đủ nét, vẽ sai thì báo và gợi ý. **Chưa thử bằng ngón tay trên điện thoại thật** |

### GĐ 3 — quyết định và kết quả (2026-09-20)

| # | Nội dung |
| --- | --- |
| 11.1 | 20 cặp: 手紙, 勉強, 大丈夫, 走る, 娘, 愛人, 老婆, 丈夫, 約束, 検討, 汽車, 工作, 経理, 大家, 新聞, 湯, 迷惑, 怪我, 切手, 麻雀. Chủ dự án giao Claude đề xuất |
| 11.2 | **Loại 先生** khỏi danh sách vì CC-CEDICT cho thấy tiếng Trung cũng có nghĩa "thầy giáo", không phải đồng tự dị nghĩa thật. Thay bằng 約束 |
| 11.3 | Đối chiếu bằng từ điển mở: CC-CEDICT (pinyin, nghĩa Trung), JMdict (cách đọc Nhật), KANJIDIC2 (Hán Việt). Kết quả: không cặp nào lệch. 怪我 và 切手 không có trong CC-CEDICT nên ghi `tonTaiTrongTiengTrung: false` |
| 11.4 | Câu ví dụ lấy từ **Tatoeba** (CC BY 2.0 FR), chọn tay từng câu theo mã. Tatoeba **không có** câu Trung cho 手纸, nên câu này do Claude tự soạn (ghi rõ trong `nguon` và `cangKiemTra`) |
| 11.5 | Pinyin câu Trung gắn bằng pypinyin, furigana câu Nhật gắn bằng fugashi. **Mọi câu đều còn `cangKiemTra`** vì máy gắn có thể sai ở chữ nhiều âm. pypinyin tự biến điệu 一/不 nên công cụ ép về thanh gốc (yī, bù) theo quy tắc 4.3 |
| 11.6 | Pinyin của chính từ đích lấy từ CC-CEDICT (có thanh nhẹ, ví dụ zhàngfu), không lấy của máy |
| 11.7 | Mức nguy hiểm (3 mức), nghĩa Việt, giải thích, "dễ nhầm", ghi chú biến điệu: **bản nháp Claude soạn**, chủ dự án rà lại. Cấp HSK tra tự động trong danh sách rút từ PDF (12/20 cặp ngoài HSK 1–3) |
| 11.8 | Giao diện: danh sách thẻ + lọc HSK (kể cả "Ngoài HSK 1–3") + trang chi tiết Trung → Nhật → Việt. Lưu ý đầu tab đọc từ dữ liệu. Từ không tồn tại trong tiếng Trung hiện thông báo thay vì cố ghép nghĩa |
| 11.9 | Nguồn tải về (~45 MB) nằm ở `cong-cu/nguon-mo/` (đã ignore). Dựng lại bằng `npm run dung-dong-tu` |

### GĐ 4 — quyết định và kết quả (2026-09-20)

| # | Nội dung |
| --- | --- |
| 12.1 | 100 từ đầu của HSK 1 theo số thứ tự 1–100 (爱 … 看病), không chọn tay. GĐ 9 làm tiếp từ 101 |
| 12.2 | **Rút thêm cột từ loại (词性) từ PDF** vào `tu-vung-goc.json` (trường `tuLoaiPDF`). Các trường cũ không đổi. Dịch sang tiếng Việt (danh từ, động từ...), phần trong ngoặc là dùng phụ |
| 12.3 | Từ Nhật tương đương, nghĩa Việt, chủ đề: **bản nháp Claude soạn**, còn `cangKiemTra`. Công cụ đối chiếu nghĩa tiếng Anh JMdict với CC-CEDICT: 4 từ báo không trùng (到, 好看, 好玩儿, 看病), ghi vào `cangKiemTra` để anh xem |
| 12.4 | Câu ví dụ: câu Trung + **bản dịch Nhật đi cặp trong Tatoeba** (không phải Claude tự dịch). Bản dịch Việt do Claude soạn nháp. **4 từ để trống câu ví dụ** vì Tatoeba không có câu phù hợp: 不客气, 分, 好听, 好玩儿 |
| 12.5 | Pinyin từ lấy từ PDF, tách theo từng chữ. **PDF ghi 不 đã biến điệu (bú kèqi, búyào)**, công cụ ép về thanh gốc bù theo quy tắc 4.3; biến điệu ghi trong `ghiChuBienDieu` |
| 12.6 | Ghi chú biến điệu của từ và câu ví dụ **do máy sinh theo quy tắc** (不, 一, thanh 3 liền nhau), khác với cách làm tay ở GĐ 3. Có ghi chú "cần kiểm tra" ở từng từ |
| 12.7 | Furigana câu Nhật máy gắn, **rà bằng mắt cả 96 câu** và sửa tay 4 chỗ sai (四月, 何時, 一箱, 明日) cùng lỗi 私 đọc わたくし thành わたし. Bản sửa nằm trong `tu-vung-nhap-tay.json`, mục `suaFurigana` |
| 12.8 | Sửa lỗi cũ của GĐ 3: câu Nhật có nhiều bản dịch Việt trong Tatoeba, code chọn theo thứ tự ngẫu nhiên nên mỗi lần chạy ra khác. Nay chọn theo mã nhỏ nhất, chạy nhiều lần cho cùng kết quả. Câu 麻雀 vì vậy đổi thành "Bạn biết chơi mạt chược không?" |
| 12.9 | Giao diện: danh sách + lọc cấp HSK + lọc chủ đề (nhãn chủ đề nằm trong dữ liệu) + trang chi tiết (từ loại, nghĩa Nhật → Việt, ví dụ Trung → Nhật → Việt). **Chưa làm** nút loa, thẻ ghi nhớ (GĐ 7) |
| 12.10 | Các hàm gắn pinyin/furigana dùng chung tách ra `cong-cu/ngon_ngu.py`. Đã kiểm tra dữ liệu GĐ 3 không đổi sau khi tách |

### GĐ 5 — quyết định và kết quả (2026-09-20)

| # | Nội dung |
| --- | --- |
| 13.1 | 15 điểm bám theo đại cương HSK (mục `nguonPDF` ghi căn cứ): **HSK 1 (11)** trật tự chủ–động–tân, 了 hoàn thành, 了 thay đổi, 有/没有, 不/没, câu hỏi 吗 và từ nghi vấn, 在/正在, lượng từ, 的, trạng ngữ thời gian–nơi chốn, năng nguyện; **HSK 2 (4)** 比, 得, 过, bổ ngữ kết quả |
| 13.2 | **Chưa làm** 把, 被, bổ ngữ khả năng vì thuộc HSK 3 trở lên (ngoài phạm vi). Cũng để GĐ 9: câu 是, 形容词 + 很, câu liên động, 因为…所以…, 是…的 |
| 13.3 | Mọi điểm đều `coCauTrucTrungKhit: false` với nhãn cố định "gần tương đương, không trùng khít" và có chỗ lệch. Nội dung đối chiếu **do Claude soạn từ kiến thức ngữ pháp, không có nguồn đối chứng ngoài**, mọi điểm đều còn `cangKiemTra` |
| 13.4 | Ví dụ: 2 câu Trung mỗi điểm + **bản dịch Nhật đi cặp trong Tatoeba**, bản dịch Việt Claude soạn nháp. Câu sai/đúng trong "Lỗi hay gặp" do Claude tự soạn (không nguồn nào có câu sai) |
| 13.5 | Cấu trúc dữ liệu: bỏ `doiChieuNhat.viDuNhat` (trùng với `viDu[].nhat`); thêm `viDu[].nhat` và `nguonPDF`; `cauSai`/`cauDung` là `{trung, pinyin}`; thêm loại lỗi `dung-sai-tu` |
| 13.6 | 得 và 过 làm trợ từ ngữ pháp đọc nhẹ (de, guo); máy đọc dé, guò nên công cụ ép qua trường `troTu` |
| 13.7 | Chữ Nhật trong phần giải thích đánh dấu `{ja|…}` (quy ước 9.8) |
| 13.8 | **Chủ dự án chốt: chữ Hán làm nhãn ngữ pháp (了, 比, 得… trong công thức và giải thích) KHÔNG cần pinyin**, vì gắn pinyin vào câu giải thích tiếng Việt rất rối. Quy tắc ruby chỉ áp dụng cho từ, câu ví dụ và chữ đứng riêng |

### GĐ 6 — quyết định và kết quả (2026-09-20)

| # | Nội dung |
| --- | --- |
| 14.1 | Chủ dự án **đã có sẵn dự án Firebase** (gói Spark). Claude không tạo được, nên viết code đọc cấu hình từ `.env` (mẫu `.env.example`) và hướng dẫn từng bước trong README |
| 14.2 | Lưu lên Firestore: **cài đặt** (furigana, sáng/tối), **đánh dấu "đã học"** cho chữ Hán, từ vựng, ngữ pháp, **kết quả tập viết** (số lần, tổng nét sai, lần cuối). Tab B chưa có nút "đã học" |
| 14.3 | Mỗi người **một tài liệu** `nguoiDung/{uid}` với 4 trường `caiDat`, `daHoc`, `tapViet`, `capNhatLuc`. Quy tắc bảo mật `firestore.rules`: chỉ chủ tài khoản đọc/ghi, chỉ 4 trường đó, tối đa 5000 mục mỗi bảng |
| 14.4 | **Ghi theo lô**: gom thay đổi trong bộ nhớ, ghi một lần khi ẩn/rời trang, đăng xuất, đủ 20 thay đổi, hoặc sau 30 giây. Ghi hỏng thì giữ lại thử lại. Không tải được tiến độ cũ thì **không ghi** để khỏi ghi đè nhầm |
| 14.5 | Đăng nhập chỉ Google. Thử cửa sổ nhỏ trước, bị chặn thì chuyển trang. Mọi lỗi báo bằng tiếng Việt, không hiện mã lỗi Firebase |
| 14.6 | **Chế độ khách**: học được, không lưu tiến độ, không có nút "đã học". Cài đặt vẫn đổi được và lưu **trên máy** (localStorage). Đăng nhập lần đầu thì đẩy cài đặt trên máy lên tài khoản; lần sau dùng cài đặt của tài khoản |
| 14.7 | Màn hình Cài đặt: tài khoản (đăng nhập/đăng xuất), bật tắt furigana, giao diện tối. Mở bằng biểu tượng bánh răng ở thanh trên (và ở màn chọn khoá). Trong khung app, Cài đặt mở tại chỗ nên không mất tab đang xem |
| 14.8 | Đã **gỡ khu vực tạm của GĐ 0** (công tắc giả lập đăng nhập). Thanh trên của người đã đăng nhập hiện 0/20, không còn số giả 12/20 (số thật làm ở GĐ 7). Nút "Đổi khoá học" giữ lại ở cuối trang |
| 14.9 | Hosting: `firebase.json` + lệnh `npm run trien-khai`. Đăng nhập Google **không chạy** qua địa chỉ `192.168.x.x`, nên thử đăng nhập trên điện thoại phải qua địa chỉ Hosting (dạng `ten-du-an.web.app`) |
| 14.10 | Sửa lỗi phát hiện khi thử giao diện tối: `--nhan-nhat` chưa có bản tối nên nhãn và ô lưu ý (12 chỗ) chữ sáng trên nền sáng. Đã thêm màu cam-nâu đậm cho theme tối |
| 14.11 | **Đã kết nối Firebase (2026-09-21).** Dự án `riyi-chinese`, app web tên `riyi`, Firestore đặt ở `asia-southeast1`, đã bật đăng nhập Google. Đã deploy: **https://riyi-chinese.web.app**. File `.firebaserc` (chọn dự án mặc định) nằm trong kho; file `.env` không lên kho, máy mới phải tạo lại theo README hoặc chép từ máy cũ |

### GĐ 7 — quyết định và kết quả (2026-09-21)

> **Lưu ý (GĐ 10):** luật mục tiêu tự chọn chữ Hán / từ / phút ở phần này đã được thay bằng "Bài hôm nay" (quyết định 18.17 – 18.20).

Chủ dự án trả lời 4 câu hỏi trước GĐ 7:

| # | Nội dung |
| --- | --- |
| 15.1 | **Làm trắc nghiệm ngay trong GĐ 7, trước Tab D và E** (các chế độ luyện tập ở Tab B, C, F chưa có từ các giai đoạn trước, mà Review cần tỉ lệ đúng và mục sai) |
| 15.2 | **Mục tiêu ngày chỉ tính khi trả lời ĐÚNG** (không tính nút "đã học") |
| 15.3 | **Có đếm số phút học** |
| 15.4 | **Tuần từ thứ Hai đến Chủ nhật; trang Review xem được bất cứ lúc nào**, cả tuần đang chạy lẫn các tuần trước |

Claude tự chọn khi làm (chủ dự án xem lại, muốn đổi thì báo):

| # | Nội dung |
| --- | --- |
| 15.5 | Luyện tập: **Tab B** chọn nghĩa tiếng Trung (đáp án nhiễu gồm nghĩa tiếng Nhật, chọn nhầm thì ghi "Đây là nghĩa trong tiếng Nhật"); **Tab C** thẻ ghi nhớ, trắc nghiệm nghĩa Việt, điền từ vào câu ví dụ (chọn từ trong 4 từ, không gõ); **Tab F** sắp xếp câu, chọn câu đúng (lấy cặp câu sai/đúng ở "Lỗi hay gặp"). Mỗi lượt 10 câu, lấy từ các mục đang hiện theo bộ lọc |
| 15.6 | 怪我, 切手 **không đưa vào trắc nghiệm Tab B** vì không có trong tiếng Trung nên không có pinyin (quy tắc: chữ Trung luôn có pinyin) |
| 15.7 | Thẻ ghi nhớ: bấm **"Đã nhớ" tính là đúng**, "Chưa nhớ" tính là sai |
| 15.8 | Chữ Hán: **tập viết xong mà không cần gợi ý thì tính là đúng**; phải nhờ gợi ý (sai 3 lần một nét) thì tính là sai và chữ đó vào Review |
| 15.9 | Ba loại mục tiêu, chọn MỘT: **chữ Hán** (mặc định 5), **từ** (mặc định 10, tính cả Tab C và Tab B), **phút** (mặc định 15). Ngữ pháp không có loại mục tiêu riêng, nhưng vẫn tính vào tỉ lệ đúng và Review. Một mục đúng nhiều lần trong ngày chỉ tính một |
| 15.10 | Đếm phút: chỉ khi app đang hiện trên màn hình VÀ có chạm/bấm/cuộn trong 2 phút gần nhất. Để app mở rồi bỏ đi thì dừng đếm sau 2 phút |
| 15.11 | Chuỗi ngày (streak) = số ngày liên tiếp **đạt mục tiêu**. Hôm nay chưa đạt thì vẫn giữ chuỗi của hôm qua; bỏ trọn một ngày thì về 0. Đạt mục tiêu rồi thì ngày đó vẫn tính là đạt kể cả khi sau đó nâng mục tiêu |
| 15.12 | Ngày tính theo **giờ trên máy người dùng**, không theo giờ quốc tế. Đã sửa lỗi cũ: "lần cuối tập viết" trước đây ghi theo giờ quốc tế, học trước 7 giờ sáng sẽ bị ghi sang hôm trước |
| 15.13 | Firestore: thêm 3 trường vào tài liệu `nguoiDung/{uid}`: `mucTieu`, `nhatKy` (theo ngày: đúng, sai, số giây, đã đạt), `chuoi`. Nhật ký **chỉ giữ 70 ngày** (Review xem lại được khoảng 9 tuần). Quy tắc bảo mật đã cập nhật, nhật ký tối đa 120 ngày. Số phút ghi lên chậm hơn (5 phút một lần) cho đỡ tốn lượt ghi |
| 15.14 | Review: 5 ô số (chữ Hán, từ, phút, tỉ lệ đúng, số ngày đạt) kèm chênh lệch với tuần trước; biểu đồ cột từng ngày theo **loại mục tiêu đang đặt**; 10 mục sai nhiều nhất + nút "Luyện lại" (từ → trắc nghiệm nghĩa, đồng tự → chọn nghĩa, ngữ pháp → sắp xếp hoặc chọn câu, chữ Hán → tập viết) |
| 15.15 | Màu biểu đồ: tuần này cam thương hiệu, tuần trước xanh `#2a86b0` (theme tối `#3d9fc4`). Đã chạy bộ kiểm tra màu: phân biệt được với người mù màu và đủ tương phản ở cả hai theme. Nằm trong `tokens.css` |
| 15.16 | Bài sắp xếp câu cần chia câu thành mảnh: **Claude chia tay** 30 câu ví dụ (trường `tachTu` trong `ngu-phap-nhap-tay.json`), công cụ kiểm tra ghép lại phải đúng câu. Chấp nhận thêm cách xếp khác ở 3 câu: 我喝水了, 每天我跑步, 我们吃完午餐了. Mọi điểm ngữ pháp có thêm một dòng `cangKiemTra` về việc này |
| 15.17 | Máy này không có nguồn Tatoeba nên chưa chạy lại `npm run dung-ngu-phap`: đã sửa công cụ để giữ `tachTu`, và thêm `tachTu` thẳng vào file dữ liệu. Khi chạy lại công cụ trên máy có nguồn, kết quả phải giống hệt |
| 15.18 | Đã thử bằng trình duyệt tự động (Firebase giả trong bộ nhớ, không đụng dữ liệu thật): mọi chế độ luyện tập, đạt mục tiêu (chuỗi 4 → 5), đếm phút, Review, theme tối, chế độ khách (không ghi gì). **Chưa thử với Firebase thật và điện thoại thật** |

### GĐ 8 — quyết định và kết quả (2026-09-21)

Chủ dự án chọn:

| # | Nội dung |
| --- | --- |
| 16.1 | **Service worker tự viết, loại nhỏ**: chỉ lưu sẵn ĐÚNG MỘT trang `mat-mang.html` để mở app lúc mất mạng thì hiện lời báo tiếng Việt thay trang lỗi của trình duyệt. Không lưu bài học, ảnh, font, mã app (đúng quy tắc không làm offline). Không dùng thư viện Workbox / vite-plugin-pwa |
| 16.2 | **Có ảnh splash riêng cho iPhone/iPad**: 17 cỡ màn hình, logo giữa nền kem, tổng 271 KB (máy chỉ tải khi cài vào màn hình chính). Tạo bằng `npm run tao-splash`, công cụ tự viết lại khối khai báo trong `index.html` |
| 16.3 | **Tên dưới biểu tượng app: "Riyi"** |

Claude làm theo bản yêu cầu và tự chọn chi tiết:

| # | Nội dung |
| --- | --- |
| 16.4 | `manifest.webmanifest`: tên đầy đủ "Riyi — Học tiếng Trung cho người biết tiếng Nhật", nền và thanh trạng thái màu kem, 3 icon (192, 512, 512 maskable). Không khoá xoay màn hình |
| 16.5 | **Phiên bản app = thời điểm đóng gói** (giờ Việt Nam, ví dụ "2026-09-21 15:18"), đóng dấu vào `sw.js` mỗi lần `npm run build`. Hiện trong Cài đặt → Ứng dụng |
| 16.6 | Có bản mới: trình duyệt kiểm tra khi mở app, khi quay lại app và mỗi giờ; tải ngầm rồi **chờ**, hiện dải "Đã có phiên bản mới của Riyi" + nút **"Tải lại để cập nhật"**. Không tự tải lại giữa lúc đang làm bài. Trước khi tải lại, app ghi nốt tiến độ đang chờ lên Firestore |
| 16.7 | Mất mạng khi đang dùng: màn che kín "Cần kết nối mạng để sử dụng Riyi.", có mạng lại thì tự biến mất, bài đang làm vẫn giữ nguyên |
| 16.8 | **Phiên bản dữ liệu**: `manifest.json` luôn tải mới; mỗi file bài học tải kèm `?v=<phienBan>`, nên tăng số là máy bỏ bản cũ. Quay lại app sau ≥ 30 phút thì kiểm tra lại, có nội dung mới thì báo "sẽ hiện khi bạn mở lại tab" (không tải lại giữa chừng để khỏi mất bài đang làm). `phienBanDuLieu` nâng lên **6** vì GĐ 7 đã sửa file ngữ pháp |
| 16.9 | Cài đặt có mục **Ứng dụng**: phiên bản app, phiên bản nội dung, nút **"Cập nhật nội dung"** |
| 16.10 | Firebase Hosting: trang chính `/`, `index.html`, `sw.js`, manifest, `du-lieu/manifest.json` luôn hỏi lại máy chủ (no-cache); mã đã đóng gói trong `assets/` lưu 1 năm (tên file đổi mỗi bản nên không bị kẹt) |
| 16.11 | Màu kem/cam/nâu buộc phải viết lại ở `index.html`, `manifest.webmanifest`, `mat-mang.html` và 2 công cụ Python vì những chỗ đó không đọc được `tokens.css`. Đã ghi danh sách này ở đầu `tokens.css` |
| 16.12 | Đã thử trên bản đóng gói bằng trình duyệt tự động: manifest không lỗi; mở app lúc mất mạng hiện trang báo; mất mạng khi đang dùng hiện màn che rồi tự tắt; đóng gói bản mới → hiện dải báo → bấm → lên bản mới; nút Cập nhật nội dung chạy. **Chưa thử cài thật trên iPhone/Android** (splash iPhone chỉ thấy được trên máy thật) |

### GĐ 9 — quyết định trước khi làm (2026-09-21)

| # | Nội dung |
| --- | --- |
| 17.1 | **Làm hết GĐ 9 trong một lượt** (từ vựng, chữ Hán, ngữ pháp, đồng tự), xong cả mới đưa lên cho chủ dự án rà |
| 17.2 | **Nghĩa tiếng Việt lấy từ CVDICT** (từ điển Trung–Việt mở, CC BY-SA 4.0, github.com/ph0ngp/CVDICT), Claude chọn nghĩa đúng cấp HSK và viết gọn. Lưu ý: CVDICT phần lớn do máy (GPT-4o) dịch từ CC-CEDICT, tác giả sửa tay những mục trông sai, nên vẫn ghi `cangKiemTra` |
| 17.3 | **Ngữ pháp phủ đủ đại cương HSK 1–3**, gộp các mục chỉ là danh sách từ thành điểm chung (ước tính 50–70 điểm), có đủ các điểm bắt buộc: 把, 被, bổ ngữ khả năng, 的/得/地 |
| 17.4 | **Tìm thêm cặp đồng tự dị nghĩa trong HSK 1–3**: máy so nghĩa tiếng Anh CC-CEDICT và JMdict, Claude lọc, **chủ dự án duyệt danh sách trước** khi soạn nội dung |
| 17.5 | **Chữ Hán HSK 1–3 đủ 655 chữ** (246 / 125 / 284), dựng từ `cong-cu/chu-han-nhap-tay.json`. Âm On/Kun, từ ví dụ tiếng Nhật chọn tự động trong JMdict (từ thông dụng), Claude rà và sửa tay; toàn bộ còn `cangKiemTra` |
| 17.6 | **75 chữ tiếng Nhật không dùng** (爸, 吗, 哪...): `tuDangNhat = null`, nhãn `khong-co-trong-tieng-nhat` ("Tiếng Nhật không dùng chữ này"). Cột chữ Nhật hiện dấu "—", ẩn âm On/Kun, tập viết chỉ có giản thể. Phần nghĩa tiếng Nhật vẫn ghi từ Nhật tương đương (爸 → 父) |
| 17.7 | **Âm Hán Việt dự phòng**: chữ không có trong bảng chính thì lấy qua chữ phồn thể, cuối cùng lấy âm đầu tiên của Unihan kVietnamese và ghi `cangKiemTra` (Unihan lẫn cả âm Nôm) |
| 17.8 | **Chữ chỉ gặp ở thanh nhẹ** trong từ HSK (候 trong 时候, 思 trong 意思...): vẫn lấy từ đó làm ví dụ cho âm chính và ghi chú rõ trong `cangKiemTra` |
| 17.9 | **Danh sách chữ Hán hiện 60 thẻ mỗi lần**, nút "Xem thêm" để hiện tiếp, cho máy yếu không bị chậm |
| 17.10 | **Chủ dự án duyệt thêm 41 cặp đồng tự dị nghĩa** (tổng 61). Nhóm A, dễ hiểu lầm nặng: 东西 先生 告诉 颜色 非常 多少 便宜 打算 意思 清楚 小心 结束 事情 生气 床 看病 不要 前年 节目 放心. Nhóm B, lệch nghĩa hoặc sắc thái: 医院 女儿 快乐 方便 故事 名人 难听 一定 马上 老师 时候 安静 后天 后年 明白 酒店 地方 妻子 作业 出来 所以. Loại: 了解 生日 走路 同事 一直 经常 说话 热情 过去 黄色 书 本 (nghĩa gần hoặc từ Nhật hiếm) |
| 17.11 | **Đồng tự: pinyin của từ lấy theo đại cương HSK** (file từ vựng đã dựng) nếu từ có trong HSK 1–3, chỉ dùng CC-CEDICT cho từ ngoài HSK. Tatoeba không có câu Nhật phù hợp thì Claude tự soạn (`tuSoan`, ghi `cangKiemTra`); chỗ máy gắn furigana sai thì nhập tay nguyên câu (`furigana`) |
| 17.12 | **Ngữ pháp 70 điểm** (HSK 1: 24, HSK 2: 23, HSK 3: 23): giữ nguyên 15 điểm cũ (id np-0001…0015 không đổi), thêm 55 điểm theo đại cương, gộp các mục chỉ là danh sách từ. Có đủ 把, 被, bổ ngữ khả năng, 的/得/地. Câu ví dụ lấy từ Tatoeba (ưu tiên câu chỉ dùng chữ HSK 1–3); 2 câu của điểm 先…再 Tatoeba chưa có bản dịch Nhật nên Claude dịch (`nhat`, ghi `cangKiemTra`). Điểm 没有…那么 chỉ có 1 câu ví dụ vì Tatoeba không có câu thứ hai phù hợp |
| 17.13 | **儿化 trong câu ngữ pháp ghi pinyin là "r"** (哪儿 = nǎ r), thống nhất với file từ vựng. Chữ nhiều âm máy gắn sai thì sửa bằng `troTu` của từng điểm (只 zhī, 长 cháng) |
| 17.14 | **Chữ Nhật chèn trong văn bản tiếng Việt phải đánh dấu `{ja|…}`** (VanBanPha coi chữ Hán trần là tiếng Trung). Đã soát và đánh dấu lại toàn bộ phần giải thích ngữ pháp và đồng tự, kể cả một chỗ sót ở điểm 的 của GĐ 5 |

### GĐ 10 (phần 1) — biểu tượng, theme hoa anh đào, nút đăng nhập (2026-09-21)

| # | Quyết định |
|---|---|
| 18.1 | **Biểu tượng đơn sắc cho nút**: gắn cho nút hành động (Luyện tập, Tập viết, Xem mẫu, Đánh dấu đã học, Quay lại...), các cách luyện tập và các mục trong Cài đặt. KHÔNG gắn cho nút lọc nhỏ (HSK 1/2/3, Tất cả, chủ đề). Dùng bộ Lucide (giấy phép ISC), nét mảnh, màu theo màu chữ của nút nên tự đổi theo theme. Toàn bộ bảng "nút nào dùng hình nào" nằm ở một file: `src/thanh-phan/BieuTuong.jsx` |
| 18.2 | **Theme thứ ba "Hoa anh đào"**, chỉ có bản sáng: nền trắng hồng, chữ nâu mận đậm, điểm nhấn hồng phấn. Chữ trên nút hồng là chữ ĐẬM (chữ sáng trên hồng không đủ tương phản). Cài đặt đổi từ công tắc Sáng/Tối thành 3 lựa chọn: Sáng, Tối, Hoa anh đào |
| 18.3 | **Biểu tượng ở theme hoa anh đào**: giữ hình, đổi sang tông hồng; thay riêng vài điểm nhấn: mặt trời mục tiêu thành bông hoa anh đào, dấu "đã học" thành cánh hoa, thêm vài cánh hoa trang trí mờ ở góc màn hình |
| 18.4 | **Biểu đồ tuần ở theme hoa anh đào**: "tuần này" hồng #d9658a, "tuần trước" tím #6a5acd (đã chạy bộ kiểm tra màu, phân biệt được cả với người mù màu; xanh dương cũ bị trùng với hồng khi mù màu đỏ) |
| 18.5 | **Nút đăng nhập căn giữa** ở cả 3 chỗ (màn chọn khoá học, Cài đặt, tab Mục tiêu), chữ "Đăng nhập bằng Google" (G viết hoa theo quy định thương hiệu của Google), kèm logo chữ G nhiều màu của Google (ngoại lệ duy nhất của quy tắc biểu tượng đơn sắc, vì Google yêu cầu logo đúng màu) |
| 18.6 | **Vẫn chỉ đăng nhập Google.** Đã tư vấn: Facebook làm được qua Firebase nhưng cần app Meta, trang chính sách, có thể phải duyệt; Zalo Firebase không hỗ trợ, phải có máy chủ riêng (Cloud Functions, cần gói trả tiền Blaze). Chưa làm |
| 18.7 | **Logo tông hồng cho theme hoa anh đào** (chủ dự án duyệt): `logo-anh-dao.png`, tô lại từ bản sáng, mặt trời hồng #E27493, chữ nâu mận #3A2229, hình dạng giữ nguyên. Tạo bằng `npm run tach-logo` |
| 18.8 | **Dòng tác giả** "Được xây dựng và phát triển bởi Yuhry Vũ": chữ nhỏ, màu nhạt, căn giữa, cuối màn chọn khoá học, luôn hiện |
| 18.9 | **Thanh kéo cỡ chữ** trong Cài đặt, 5 nấc (Nhỏ, Vừa mặc định, Lớn, Rất lớn, Lớn nhất), phóng TOÀN BỘ chữ cùng tỉ lệ (chữ Việt, chữ Hán, pinyin, furigana, biểu tượng, khoảng cách), nên chữ Hán vẫn luôn to hơn chữ Latin. Nấc lớn nhất đo thử trên màn hình điện thoại hẹp để nút và bố cục không vỡ. Lưu như các cài đặt khác (trên máy, và theo tài khoản nếu đã đăng nhập) |
| 18.10 | **Không phải đăng nhập lại khi tắt app** (lỗi chủ dự án gặp trên iPhone, mở app từ màn hình chính). App nhớ tên người đã đăng nhập trên máy để lúc mở lại hiện ngay "Chào mừng bạn đã quay trở lại, [tên]" thay vì nút đăng nhập trong lúc chờ Firebase kiểm tra. Trang đăng nhập Google chuyển về cùng địa chỉ với app (`authDomain` = riyi-chinese.web.app, theo khuyến nghị của Google cho Safari/iPhone), và trong app cài ở màn hình chính thì đăng nhập bằng cách chuyển trang thay vì cửa sổ nhỏ. **Đã làm xong (2026-09-21):** chủ dự án đã thêm `https://riyi-chinese.web.app/__/auth/handler` vào Google Cloud, `.env` đã đổi `VITE_FIREBASE_AUTH_DOMAIN=riyi-chinese.web.app` và đã deploy. Máy khác khi tạo `.env` cũng phải dùng giá trị này. Còn chờ chủ dự án thử trên iPhone thật |
| 18.11 | **Màn chọn khoá học khi đã đăng nhập** chỉ còn một dòng: "Chào mừng bạn đã quay trở lại, [tên]" |
| 18.12 | **Thêm cách đăng nhập thứ hai: tài khoản email + mật khẩu** (thay quy tắc cũ "chỉ Google", đã sửa CLAUDE.md). Tạo tài khoản gồm: tên hiển thị, email, mật khẩu, nhập lại mật khẩu. Đăng nhập bằng EMAIL + mật khẩu (không dùng tên đăng nhập, vì muốn vậy phải để công khai bảng tra tên → email, lộ email người dùng). **Chủ dự án đã bật Email/Password trong Firebase (2026-09-22).** Còn chờ thử tạo tài khoản, email xác minh, quên mật khẩu trên máy thật |
| 18.13 | **Quên mật khẩu gửi link đặt mật khẩu mới** qua email, email bằng tiếng Việt. Không gửi lại mật khẩu cũ được (Firebase chỉ lưu dạng mã hoá một chiều). Để không lộ email nào đã có tài khoản, app luôn báo "nếu email có tài khoản thì đã gửi link" |
| 18.14 | **Xác minh email**: tạo xong dùng ngay, app gửi email xác minh; Cài đặt nhắc và có nút gửi lại nếu chưa xác minh |
| 18.15 | **Mật khẩu tối thiểu 8 ký tự**, không bắt buộc chữ hoa hay ký tự đặc biệt. **Đổi mật khẩu** trong Cài đặt: nhập mật khẩu hiện tại, mật khẩu mới, nhập lại; chỉ hiện với tài khoản email. Email đã dùng cho đăng nhập Google thì không tạo tài khoản mật khẩu trùng được, app báo bằng tiếng Việt |
| 18.16 | **Trò chơi lật thẻ** (matching game) ở phần Luyện tập của tab **Từ vựng** và **Chữ Hán**: 10 mục = 20 thẻ, 4 cột × 5 hàng; thẻ Trung (chữ + pinyin) ghép với thẻ nghĩa (nghĩa Nhật + nghĩa Việt, chỉ lấy nghĩa đầu tiên). Đầu ván mở hết thẻ 3 giây rồi úp lại. Không cho hai mục trùng nghĩa vào cùng ván. Mỗi cặp tìm được = 1 câu đúng cho mục tiêu hôm nay; lật nhầm KHÔNG vào Review. Hết ván báo thời gian, số lượt lật, kỷ lục (lưu trên máy, riêng từng tab). Chữ trên thẻ tự co theo bề ngang thẻ nên không tràn ở mọi cỡ chữ |
| 18.17 | **Luật mục tiêu mới cho cả app (thay mục tiêu tự chọn chữ Hán / từ / phút của GĐ 7):** mỗi ngày học một "Bài hôm nay" gồm **5 chữ Hán + 10 từ vựng + 1 điểm ngữ pháp**. Chỉ khi làm đủ các bước của cả 3 phần mới đạt mục tiêu ngày (và mới nối chuỗi ngày). Luyện tự do ở các tab vẫn ghi nhật ký và Review, nhưng không tính mục tiêu |
| 18.18 | **Các bước của bài**, làm lần lượt trong từng phần (bước sau mở khi xong bước trước): Chữ Hán: Tập viết → Trò chơi lật thẻ; Từ vựng: Thẻ ghi nhớ → Trắc nghiệm → Điền từ → Trò chơi lật thẻ; Ngữ pháp: Sắp xếp câu → Chọn câu đúng (tổng 8 bước). Mỗi bước chỉ dùng mục của bài. **Trả lời sai thì mục đó được hỏi lại ở cuối lượt cho tới khi đúng**; mục sai vẫn vào Review. Bước nào bài không có câu hỏi phù hợp (ví dụ điểm np-0007 không có cặp câu sai/đúng) thì tính là xong luôn để bài không bị kẹt |
| 18.19 | **Lộ trình dễ → khó** (`cong-cu/dung-lo-trinh.py` → `public/du-lieu/lo-trinh.json`, 131 bài): từ HSK 1 trước, trong mỗi cấp từ thông dụng trước (tần suất từ điển jieba, MIT); 10 từ/bài, không để hai từ viết giống nhau chung bài. 5 chữ Hán/bài lấy trong các từ ĐÃ HỌC, chữ HSK thấp và thông dụng trước. Ngữ pháp theo cấp, ưu tiên điểm có câu ví dụ dùng nhiều từ đã học. 1000 từ = 100 bài, 655 chữ = 131 bài: từ bài 101 phần từ vựng là ôn lại từ chứa chữ của bài; 70 điểm ngữ pháp: từ bài 71 là ôn lại. Học hết 131 bài thì quay vòng từ bài 1 để ôn |
| 18.20 | **Tiến độ bài**: xong bài thì bài sau mở ngay (học trước được); nghỉ ngày nào thì hôm sau học tiếp bài đang dở, không dồn bài. Lưu trên Firestore ở trường mới `loTrinh` `{bai, buoc}` (đã thêm vào firestore.rules); ngày học xong bài ghi `baiXong` trong nhật ký. Tab Review: biểu đồ đổi thành "số từ trả lời đúng mỗi ngày" |
| 18.21 | **Tab Chữ Hán gọn lại**: trên cùng chỉ hiện **5 chữ Hán hôm nay** (theo bài đang học). Bỏ nút "Tất cả", chỉ còn HSK 1 / HSK 2 / HSK 3; mỗi nút có **thanh % chữ đã học** của cấp đó. Danh sách đủ của cấp đang chọn nằm sau nút **"Xem toàn bộ chữ Hán HSK N"**. Chữ **đã học** = thuộc bài đã học xong + chữ tự bấm "Đánh dấu đã học"; trong danh sách đủ, chữ đã học có **viền nét đứt và mờ hơn** |
| 18.22 | **Trang chi tiết chữ Hán theo bản vẽ của chủ dự án**, 3 khung: (1) Giản thể có pinyin · Kanji · Phồn thể + nhãn so sánh tự dạng; (2) hai cột Pinyin \| Tiếng Nhật (âm On, Kun kèm từ ví dụ), bên dưới Âm Hán Việt, Nghĩa, Số nét, Bộ thủ; (3) Tập viết. Không bỏ thông tin nào |
| 18.23 | **Các bước trong Bài hôm nay** dùng cùng kiểu và cỡ với nút luyện tập ở tab Từ vựng (nút cam bo tròn): bước đang tới lượt màu cam, bước đã xong viền xanh có dấu ✓, bước chưa mở mờ đi |
| 18.24 | **Mỗi bài 3 điểm ngữ pháp** (thay cho 1): mỗi ngày 5 chữ Hán + 10 từ vựng + 3 ngữ pháp. Lộ trình dựng lại: 70 điểm hết ở bài 24, từ bài 25 phần ngữ pháp là ôn lại 3 điểm/bài. Lưu ý: tới bài 24 ngữ pháp đã sang HSK 3 trong khi từ vựng mới ở HSK 1 |
| 18.25 | **Điều kiện hoàn thành từng phần**: Chữ Hán = viết xong VÀ chơi xong trò chơi; Từ vựng = xong cả 4 bước (Thẻ ghi nhớ, Trắc nghiệm, Điền từ, Trò chơi) trên ĐÚNG CÙNG các từ hôm nay; trò chơi có đủ mọi từ của hôm nay (nhiều hơn 10 từ thì chơi thành nhiều ván); Ngữ pháp = xong Sắp xếp câu và Chọn câu đúng trên các điểm hôm nay |
| 18.26 | **Mỗi ngày một bài mới, phần thiếu hôm qua cộng vào hôm nay** (thay luật "xong bài mới sang bài" của 18.20): chưa tập viết → hôm nay viết thêm 1 chữ của hôm qua; chưa chơi xong → trò chơi hôm nay thêm 1 cặp (10 → 12 thẻ) là chữ hôm qua; từ vựng / ngữ pháp chưa xong → dồn sang hôm nay (trần 20 từ, 6 điểm/ngày để không dồn mãi). Nghỉ nhiều ngày thì khi mở app chỉ sang MỘT bài. Xong bài rồi vẫn "Học trước bài tiếp theo" được. Nút luyện tập ở tab Chữ Hán / Từ vựng / Ngữ pháp CHÍNH LÀ các bước của bài hôm nay (tính chung tiến độ); bỏ luyện tự do ngẫu nhiên ở 3 tab này (tab Đồng tự giữ nguyên) |
| 18.27 | **Ba tab Chữ Hán / Từ vựng / Ngữ pháp cùng một kiểu**: trên cùng là mục hôm nay + Nhiệm vụ hôm nay; bỏ nút "Tất cả", chỉ HSK 1/2/3 có thanh %; danh sách đủ ẩn sau nút "Xem toàn bộ". "Đã học" = mục thuộc PHẦN đã hoàn thành (tự đánh dấu khi xong phần) + mục tự bấm "Đánh dấu đã học"; mục đã học có viền nét đứt, mờ hơn. Tiến độ Firestore `loTrinh` thêm `ngay`, `muc`, `them` |
| 18.28 | **Nguồn âm thanh: giọng người thật**, bộ audio-cmn (github.com/hugolpz/audio-cmn, giọng Chen Wang, CC BY-SA): 1.707 file âm tiết đủ 4 thanh, bản 64 kbps (~16 MB), lưu trên Hosting ở `public/am-thanh/am-tiet/` (tên file: âm tiết không dấu, ü viết là v, + số thanh). Tải bằng `npm run tai-am-thanh`. Mọi lần phát đi qua hàm `phatAm()` duy nhất (`src/am-thanh/phatAm.js`). Phát âm từ và câu (bộ này có sẵn 5.596 từ HSK) để làm sau |
| 18.29 | **Tab Phát âm** (đứng trước tab Chữ Hán): (1) Bảng pinyin theo mẫu 18 bảng của chủ dự án, gộp 5 nhóm vần (a o e i u ü · ai… · ia… · ua… · üe üan ün), chọn nhóm bằng nút; bảng rộng kéo ngang, cột phụ âm đứng yên. Chỉ hiện ô có file âm thanh thật (dựng bằng `npm run dung-bang-pinyin`). (2) Bốn thanh điệu, có nghe mẫu. (3) Mẹo cho người biết tiếng Nhật (bật hơi, zh/j/z, "i" sau zh/z, ü, -n/-ng, e, r) kèm cặp âm nghe so sánh. Phần (2), (3) là bản nháp, còn `cangKiemTra` |
| 18.30 | **Chạm một ô**: phát ngay thanh 1 và mở khung 4 thanh (mā má mǎ mà, chỉ bật thanh có file) + nút "Nghe cả 4 thanh". Ô tiêu đề cũng bấm được: vần đứng một mình (a, ai, yi, wu, yu, ya…) và phụ âm đọc theo cách dạy (bo po mo fo, de te ne le, ge ke he, ji qi xi, zhi chi shi ri, zi ci si) |
| 18.31 | **Thanh dưới 5 nút**: Phát âm · Chữ Hán · Từ vựng · Ngữ pháp · Khám phá. Tab "Đồng tự" đổi thành **Khám phá**, trong đó có: Đồng tự dị nghĩa (màn cũ), Review cuối tuần (chuyển vào từ thanh dưới), Thi thử HSK (hiện "Sắp có") |
| 18.32 | **Quy tắc ô bảng pinyin**: j q x không ghép với u thường (ô để trống; ju/qu/xu là j q x + ü, nằm ở cột ü). Tên file âm thanh sau j q x y viết u (ju4.mp3, không phải jv4). Bảng hiện 380 ô có âm thanh thật. Cột phụ âm đứng yên khi kéo ngang bảng |
| 18.33 | **Bỏ dòng ghi công âm thanh trên màn hình Phát âm**. Ghi công audio-cmn (Chen Wang, Hugo Lopez, CC BY-SA) chỉ nằm trong source: public/am-thanh/GIAY-PHEP.txt và cong-cu/tai-am-thanh.py |
| 18.34 | **Hiệu ứng ấn nút thanh**: khi bấm "Nghe cả 4 thanh" (hoặc bấm một thanh), nút thanh đang được đọc sáng màu nhấn và thu nhỏ nhẹ như đang bị ấn, lần lượt theo tiếng đọc. phatAm() nhận thêm tham số khiDoc(viTri) để báo âm đang đọc |
| 18.35 | **Gỡ hai ô nghiệm thu GĐ 0** khỏi tab Chữ Hán: "Kiểm tra tự dạng Trung – Nhật" (KiemTraFont.jsx, đã xoá) và "Thử hiển thị ba thứ tiếng". Tab Chữ Hán chỉ còn: 5 chữ hôm nay, Nhiệm vụ hôm nay, nút HSK 1/2/3. Muốn đo lại tự dạng thì chạy python cong-cu/so-sanh-tu-dang.py |
| 18.36 | **"N chữ Hán hôm nay" chỉ hiện ô vuông có chữ Hán**, một hàng 5 ô: KHÔNG pinyin, không chữ Nhật, không nghĩa (ngoại lệ có chủ ý của quy tắc "chữ Trung luôn có pinyin", do chủ dự án chốt). Bấm vào ô mới mở chi tiết (giải thích, tập viết). Chữ đã học: ô mờ đi, viền nét đứt |
| 18.37 | **Từ vựng có tiếng đọc**: tải 898 từ HSK 1–3 từ bộ audio-cmn (64k/hsk, giọng Chen Wang, CC BY-SA) vào public/am-thanh/tu/<từ>.mp3 bằng `npm run tai-am-tu`, 8,6 MB. 90 từ bộ âm thanh KHÔNG có (你好, 手机, 打电话…) thì **ẩn nút loa**, không ghép từng chữ, không để nút câm. Danh sách từ có tiếng: public/am-thanh/tu/danh-sach.json. Nút loa hiện ở chi tiết từ và mặt sau thẻ ghi nhớ |
| 18.38 | **Tab Từ vựng và Ngữ pháp gọn như tab Chữ Hán**. Từ vựng: mỗi từ một ô chỉ có chữ Trung (từ dài thì ô rộng ra), cho cả danh sách hôm nay lẫn "Xem toàn bộ". Ngữ pháp: mỗi điểm một ô kéo hết chiều ngang, mẫu câu ở trên, tên tiếng Việt ở dưới. Bấm vào mới mở chi tiết. Danh sách "Xem toàn bộ chữ Hán HSK N" cũng đổi sang ô vuông |
| 18.39 | **Luyện nghe là một bước của bài hôm nay** (bài ngày giờ có 9 bước). Lấy chính chữ Hán hôm nay: mỗi chữ một câu "nghe rồi chọn âm" (4 pinyin) và một câu "nghe rồi chọn thanh" (thanh 1–4). Chữ thanh nhẹ hoặc không có file âm tiết thì bỏ qua. Nút vào bước nằm ở tab Phát âm và màn Bài hôm nay. Bước này KHÔNG cộng dồn sang hôm sau (khác chữ Hán, từ vựng, ngữ pháp) vì dùng lại nội dung đã có |
| 18.40 | **Thông báo nhắc học 3 khung giờ** (7h, 14h, 21h giờ Việt Nam), chỉ cho người ĐÃ ĐĂNG NHẬP, bật/tắt trong Cài đặt, mặc định TẮT. Gói Spark không có Cloud Functions nên người gửi là **GitHub Actions** chạy cron, gửi qua FCM dạng data, service worker của app tự vẽ thông báo. 7h: 10 câu chào quay vòng theo công thức (số ngày từ 2026-01-01) % 10; hôm nào là ngày lễ Việt – Trung – Nhật thì báo ngày lễ, trùng ngày thì ưu tiên Việt Nam → Trung Quốc → Nhật Bản. 14h và 21h: tiêu đề "Riyi – Tiến độ hôm nay: N%" (N = số bước đã xong / 9, làm tròn xuống, chỉ tính bài đúng ngày hôm nay) kèm câu theo mốc 0 / 1–49 / 50–69 / 70–99 / 100%. Bảng ngày lễ: public/du-lieu/ngay-dac-biet.json (npm run dung-ngay-dac-biet), năm 2026–2027, âm lịch VN theo UTC+7 và TQ theo UTC+8, CẦN CHỦ DỰ ÁN RÀ LẠI. Hướng dẫn cài đặt: tai-lieu/HUONG-DAN-THONG-BAO.md |
| 18.41 | **Theme thứ tư: Đèn lồng đỏ 🏮**. Khung, thẻ và nút màu đỏ đèn lồng #c8102e, viền vàng kim #f2c14e, nền trang kem #fff6ec (chủ dự án chọn nền kem thay vì đỏ đậm để chữ Hán nhỏ và pinyin dễ đọc). Chữ trong thẻ đỏ là kem, chữ phụ #ffe0c8, màu nhấn trong thẻ đổi sang vàng sáng — mọi cặp màu đều đạt WCAG AA, đo bằng máy trên mọi màn hình. **Báo sai đổi sang TÍM #6b21a8** (không dùng đỏ vì cả app đang đỏ) kèm dấu ✗ và rung nhẹ. Đổi hình: mặt trời → đèn lồng, cánh hoa "đã học" → hoa mai, trang trí góc màn hình → 2 đèn lồng treo; GIỮ NGUYÊN toàn bộ icon chức năng và 5 icon thanh dưới. **Pháo hoa khi bấm**: chùm nhỏ 14 hạt 0,6 giây tại đúng chỗ chạm mọi nút và ô bấm được (trừ ô nhập chữ, thanh kéo, vùng tập viết), chùm lớn khi xong 100% mục tiêu ngày; vẽ trên một canvas phủ, không chặn thao tác; tự tắt khi máy bật "Giảm chuyển động"; công tắc riêng trong Cài đặt (mặc định BẬT, chỉ hiện khi đang dùng theme này) |
| 18.42 | **GĐ 12 (đợt 1/2 — chỉ tab Chữ Hán, các tab khác để đợt sau, chủ dự án chọn "làm xong từng phần")**: (A) logic tổng cho cả app — bỏ nút "Đổi khoá học" khỏi dưới mỗi tab, chuyển vào Cài đặt (chỉ hiện khi mở Cài đặt từ trong một khoá học); làm bước nào trước cũng được, bỏ khoá thứ tự bước (`NutNhiemVu`); thêm `nd.datMucTieu(capHsk)` — bấm nút HSK khác cấp đang học sẽ hỏi lại rồi NHẢY lộ trình sang bài đầu tiên của cấp đó (bài 1/31/51), học tuần tự tiếp, giữ nguyên chữ đã học; `KhungNhiemVu` đổi cách hiện tiến độ từ "x/N bước" sang "x/N mục đã học" khi truyền `idsHomNay` (tự tăng N khi có "ôn thêm"), các tab chưa truyền prop này thì vẫn hiện theo bước như cũ. (B) Tab Chữ Hán: thêm ô tìm kiếm (Hán tự/pinyin/nghĩa, tìm trên mọi cấp); chữ hôm nay có pinyin phía trên (không có nghĩa); nhãn "Đã học" (xanh)/"Chưa học" (đỏ) thay hẳn cho mờ+viền nét đứt — ô hôm nay hiện chữ đầy đủ, ô "Xem toàn bộ"/tìm kiếm dùng chấm màu góc cho gọn; nút "Bắt đầu học ngay" CỐ ĐỊNH trên thanh tab dưới, bấm hoặc quẹt phải (≥48px) đều mở bước "chu" chưa xong, tự ẩn khi đã xong; ba nút HSK chuyển xuống CUỐI trang; rời trang chi tiết mà chữ hôm nay chưa xong hết thì hỏi lại bằng hộp thoại mới `HopThoaiXacNhan` (liệt kê đúng tên các chữ chưa xong), bỏ dòng ghi chú luật chơi tĩnh cũ. (C) Chi tiết chữ: nút loa cạnh pinyin giản thể (dùng lại âm tiết đã tải từ Phát âm, ẩn khi không có file), pinyin giản thể và nghĩa Việt tô màu nhấn, thêm TÊN BỘ THỦ Hán Việt tô màu nhấn và khung MẸO NHỚ (mẫu câu ghép từ số nét + tên bộ thủ + nghĩa, không suy diễn hình dạng nét). Tên bộ thủ tra theo bảng 156 bộ thủ Khang Hy thực dùng trong dữ liệu (`src/du-lieu/tenBoThu.js`) do Claude soạn — **CHƯA CÓ NGƯỜI BIẾT TIẾNG TRUNG XÁC MINH**, gắn nhãn "Chưa kiểm tra" ở từng chữ. Cả 4 tab dùng chung `nd.datMucTieu`, `HopThoaiXacNhan`, cách đếm tiến độ mới — đợt sau chỉ cần nhân rộng giao diện thẻ/chi tiết sang Từ vựng, Ngữ pháp, Phát âm |
| 18.43 | **Sửa 2 chi tiết theo ảnh mẫu của chủ dự án** (đợt 1 tab Chữ Hán): (1) Nhãn "Đã học"/"Chưa học" đổi thành nhãn NỔI Ở GÓC TRÊN-PHẢI, đè lên viền ô như nhãn dán (position absolute, -top-2.5), không còn nằm trong dòng chảy phía trên pinyin. (2) Nút "Bắt đầu học ngay" đổi thành kiểu TRƯỢT như nút nhận cuộc gọi iPhone: đường ray + núm tròn có mũi tên ở đầu trái, kéo núm qua 78% đường ray mới vào bài, buông giữa chừng thì núm tự bật về đầu; bấm thẳng vào núm (gần như không kéo, dưới 8px) cũng vào bài, để còn bấm được bằng bàn phím/trình đọc màn hình. Phải tự phân biệt "bấm" và "kéo dở dang" vì trình duyệt luôn bắn sự kiện click sau khi buông tay dù đó là kéo hay bấm |
| 18.44 | **Sửa tiếp nhãn Đã học/Chưa học theo ảnh mẫu**: nhãn trước đó tuy đã nổi ở góc nhưng do rộng gần bằng ô nhỏ nên trông như nằm giữa, không rõ dạt sang phải. Đổi: nhãn tràn HẲN RA NGOÀI mép phải ô (-right-2, không còn inset vào trong), thu nhỏ chữ/đệm cho gọn; ô "chữ hôm nay" rộng thêm (4.75rem → 5.25rem) và khoảng cách ngang giữa các ô tăng (gap-x-2.5 → gap-x-3.5) để nhãn không đè sang ô bên cạnh |
| 18.45 | **Bỏ nút "Bắt đầu học ngay" kiểu trượt (18.43), chủ dự án chê xấu.** Đổi lại thành nút bấm bình thường, lệch về bên phải, vẫn cố định phía trên thanh tab dưới |
| 18.46 | **GĐ 12 đợt 2/2: nhân rộng khuôn mẫu tab Chữ Hán sang Từ vựng và Ngữ pháp** (Phát âm không cần đổi, không có danh sách/chi tiết theo cấp). Cả hai tab đều có: ô tìm kiếm (Từ vựng: chữ Trung/pinyin/nghĩa; Ngữ pháp: tên điểm/mẫu câu, bỏ dấu markup {ja\|...} trước khi so khớp); nhãn "Đã học"/"Chưa học" nổi ở góc ô thay opacity+viền nét đứt (ô hôm nay dùng nhãn chữ, ô "Xem toàn bộ"/tìm kiếm dùng chấm màu — Ngữ pháp là ô kéo hết chiều ngang nên chỉ có một kiểu nhãn); "Bắt đầu học ngay" nút bấm thường lệch phải cố định trên thanh tab dưới; ba nút HSK chuyển xuống CUỐI trang, bấm cấp khác cấp đang học thì hỏi lại rồi gọi `nd.datMucTieu`; rời trang chi tiết mà mục hôm nay chưa xong hết thì hỏi lại bằng `HopThoaiXacNhan`, liệt kê đúng tên các mục còn thiếu; `KhungNhiemVu` dùng `idsHomNay` để đếm tiến độ theo số mục đã học thay vì số bước; bỏ ghi chú luật chơi tĩnh cũ. Nghĩa tiếng Việt trong chi tiết Từ vựng tô màu nhấn (giống Chữ Hán); Ngữ pháp không có trường nghĩa Việt tương đương nên không đổi thêm |
| 18.47 | **Tìm kiếm pinyin không phân biệt dấu thanh**: gõ "cong" (không dấu) vẫn tìm ra chữ/từ có pinyin "cóng". Dùng lại hàm `tachThanh` có sẵn (src/am-thanh/dauThanh.js) để bỏ dấu thanh khỏi cả pinyin lưu trong dữ liệu lẫn từ khoá gõ vào rồi mới so khớp, áp dụng ở tab Chữ Hán và Từ vựng (Ngữ pháp không tìm theo pinyin nên không cần) |
| 18.48 | **Sửa lỗi thông báo không gửi**: GitHub Actions chạy cron TRỄ vài tiếng (thực tế 10h51, 19h32, 1h18 giờ VN thay vì 7h/14h/21h), mà bộ gửi lại đoán khung giờ theo giờ hiện tại nên bỏ qua mọi lần chạy. Nay workflow lấy khung giờ theo CHÍNH lịch cron đã kích hoạt (`github.event.schedule`), và ngày tính theo ngày của khung đó (`ngayCuaKhung`: khung 21h trễ sang sau nửa đêm vẫn là ngày hôm trước). Thông báo có thể đến muộn so với giờ hẹn — đó là giới hạn của GitHub miễn phí. Ngoài ra lúc kiểm tra, `.env` CHƯA có `VITE_VAPID_KEY` nên chưa ai bật được thông báo trong Cài đặt — chủ dự án cần làm bước 1 trong tai-lieu/HUONG-DAN-THONG-BAO.md |
| 18.49 | **Theme Hoa Đăng Dạ Nguyệt thay cho theme Đèn lồng đỏ nền kem (18.41)**; vẫn dùng mã `den-long` để cài đặt đã lưu không mất; tên trong Cài đặt đổi thành "Hoa Đăng Dạ Nguyệt 🏮". Ba theme Sáng, Tối, Hoa anh đào giữ nguyên. Nền trang là bầu trời đêm ám đỏ (gradient #2b0a0a → #1a0505) có 3 vầng ánh trăng vàng cam hắt từ góc trên (vẽ bằng gradient toả tròn, KHÔNG dùng filter blur vì nặng với điện thoại yếu); thẻ là gradient chéo #4a1414 → #2e0a0a có lớp sáng mờ góc trên trái, viền vàng mờ 15%; chữ chính trắng ngà #f5e6d3 (không dùng trắng thuần, trừ nền logo Google), chữ phụ #c9a385; màu nhấn chung là vàng trăng #f5c563 (pinyin, số liệu, thanh tiến độ), riêng NÚT (`bg-nhan text-chu-tren-nhan`) là đỏ gradient #c41e1e → #8b0000 viền vàng, mũi tên cuối nút nhích sang phải khi rê chuột; báo sai vẫn là tím (bản sáng #d9b8ff). Mặt trời mục tiêu → vầng trăng rằm có hào quang nhiều lớp (chưa đạt thì mờ, không hào quang). Hai đèn lồng nhỏ treo dưới thanh trên ở khoảng trống hai bên cột nội dung (không che thẻ, không bắt bấm), lắc lệch nhịp, đốm nến sáng tối; ô chữ Hán/ô từ (lớp `o-hoc`) bo 18px, có HẠT CƯỜM vàng phía trên mỗi ô, chạm/rê thì phóng 1.03 và viền vàng sáng. Giảm chuyển động thì đèn đứng yên, ô không phóng. Ô chữ Hán GIỮ như 18.36/18.42 (không thêm nghĩa, giữ nhãn Đã học/Chưa học). Không thêm các thành phần mới trong ảnh mẫu (thẻ Thu thập Hoa Đăng, banner Thắp sáng đèn lồng, badge Trung thu/Rằm) — chỉ đổi giao diện cái đã có. Tiêu đề tiếng Việt dùng font có chân Noto Serif (88 KB, cắt theo chữ thực dùng bằng `npm run cat-font`, chỉ tải khi dùng theme này). Mọi màu nằm trong tokens.css với tên `--lantern-*`, nối vào Tailwind thành `bg-lantern-gold`, `text-lantern-text`... Đã đo tương phản: chữ chính 12.2:1, chữ phụ 6.5:1, vàng 9.3:1, chữ trên nút đỏ 4.8:1 |
| 18.50 | **Bỏ chữ "Đã học/Chưa học" trên ô chữ Hán, ô từ, thẻ ngữ pháp, thay bằng ĐÈN trạng thái** (chấm tròn 10px ở mép trên giữa ô, có đốm phản chiếu và quầng sáng lan ra xung quanh để trông như đèn đang sáng; thay luôn hạt cườm của 18.49). Màu theo theme: Sáng và Tối, chưa học là đèn ĐỎ, đã học là đèn XANH LÁ; Hoa anh đào, chưa học là hồng sáng, đã học là hồng tối; Hoa Đăng, chưa học là vàng sáng, đã học là vàng nâu tối, quầng yếu. Chữ "đã học/chưa học" vẫn nằm trong nhãn đọc màn hình (aria-label). Lưu ý: đèn chỉ báo bằng màu, người mù màu đỏ–xanh khó phân biệt ở theme Sáng/Tối; độ sáng khác nhau giúp được phần nào. Cùng lúc sửa tương phản: chữ cam nhỏ tách thành màu riêng `--nhan-chu` (Sáng #a63e07, Tối #ff9a5e, Hoa anh đào #a8355a, Hoa Đăng vàng trăng), mọi chữ `text-nhan` đổi thành `text-nhan-chu`; nền nút tách thành `--nen-nut` (Sáng/Tối #c2410c, chữ trên nút 4.8:1); màu cảnh báo theme Sáng đậm lên #8a5a00. Máy quét tương phản 4 theme ở 375px và 360px, cỡ chữ lớn nhất: không còn chỗ nào dưới 4.5:1 |
| 18.51 | **Theme Hoa Đăng làm lại theo ảnh mẫu và bảng phối màu Stitch "Imperial Crimson Lantern"** chủ dự án gửi: Primary đỏ son #DC2626 (nút, thân đèn lồng, ô chữ Hán), Secondary hổ phách #F59E0B (chữ nhấn, pinyin, số liệu, trăng), Tertiary #D97706 (viền trăng, tua đèn), Neutral #1C0A0A (nền đêm). Chữ chính #fbe9e1, chữ phụ #d4aaa2. (1) Ô chữ Hán / ô từ thành những chiếc ĐÈN LỒNG ĐỎ: gradient đỏ son xuống đỏ thẫm, đốm lửa nến cam mờ sau chữ, quầng đỏ toả quanh ô; chữ Hán trắng ngà sáng có quầng sáng (glow) quanh nét; pinyin vàng nhạt #ffe7a0 (đỉnh ô lùi về #c81e1e để pinyin đạt 4.7:1; đỏ son #DC2626 nguyên bản chỉ cho chữ gần trắng đạt chuẩn). Đèn trạng thái 18.50 ở mép trên nay trông như chóp vàng của đèn lồng. (2) Vầng trăng vẽ như ảnh mẫu: đĩa hổ phách sáng dần vào tâm, lưỡi liềm và chữ "RẰM" màu tối ở giữa, hào quang vàng lan ra đỏ. Trăng to hơn: thanh trên 39px (trước 23px), trang Mục tiêu 102px. Chưa đạt mục tiêu thì trăng dịu đi một chút, không xám hẳn như mặt trời. (3) Hai đèn lồng treo to gần gấp đôi (rộng 1.25rem, vừa khít khoảng trống cạnh cột nội dung nên không đè chữ), thân sáng dần vào lõi nến, có quầng đỏ nhấp nháy theo nến, tua hổ phách. (4) Nút hành động đỏ son → #991B1B, chữ #fff8f0 (4.6:1). Font chữ thường (Be Vietnam Pro trong bảng Stitch) CHƯA đổi, vẫn Nunito, chờ chủ dự án quyết. Ô chữ Hán vẫn KHÔNG ghi nghĩa (ảnh mẫu có nghĩa dưới chữ, nhưng 18.42/18.49 đã chốt chỉ hiện chữ). Máy quét tương phản theme Hoa Đăng ở 375px và 360px chữ lớn nhất: không còn chỗ nào dưới chuẩn |
| 18.52 | **Sửa 2 lỗi theme Hoa Đăng.** (1) Tập viết: khung chữ mờ để tô theo lấy màu viền thẻ, mà viền ở theme này chỉ đậm 16% nên gần như vô hình. Tách thành màu riêng --net-goi-y (mặc định = màu viền như cũ; Hoa Đăng là nâu đỏ đặc #7a4436, thấy rõ mà vẫn nhạt hơn nét viết). Hàm đọc màu cho bộ tập viết nay giải hết biến lồng nhau ra màu rgb cụ thể. (2) Màn chọn khoá học: theme Hoa Đăng lỡ dùng logo chữ đen của theme Sáng nên chữ Riyi biến mất trên nền đêm; nay dùng logo chữ kem như theme Tối |
| 18.53 | **Slogan dưới logo ở màn chọn khoá học** đổi từ "Học tiếng Trung bằng vốn Hán tự tiếng Nhật bạn đã có" thành **"Mỗi ngày một bình minh mới."** (chủ dự án chọn trong 45 phương án; câu gắn với mặt trời trong logo Riyi, tạo động lực học đều mỗi ngày). Mô tả khoá học, mô tả trang web (index.html) và manifest vẫn giữ câu giới thiệu vốn Hán tự tiếng Nhật vì đó là phần giải thích app dành cho ai, không phải slogan |
| 18.54 | **Tập viết: vào là viết được ngay.** Mở khung tập viết (bước Tập viết của Bài hôm nay, Review, và trang chi tiết chữ Hán) là chữ đã hiện mờ để tô theo, không phải bấm nút "Tập viết" nữa. "Xem mẫu" vẽ xong thì tự quay về chế độ viết; nút "Tập viết" cũ đổi thành nút phụ "Viết lại". Trong bước Tập viết (và Review), nút chính là **"Chuyển chữ tiếp theo"** CỐ ĐỊNH phía trên thanh tab dưới, lệch phải như nút "Bắt đầu học ngay"; chữ cuối cùng thì nút thành **"Hoàn thành"** màu khác (Sáng, Tối, Hoa anh đào: xanh lá #15803d chữ kem 4.8:1; Hoa Đăng: vàng trăng gradient chữ nâu đêm). Viết xong chữ hiện tại nút mới bấm được (mờ đi khi chưa viết), để bước vẫn tính đúng từng chữ; chữ phải nhờ gợi ý được hỏi lại ở cuối như cũ nên nút tự đổi lại thành "Chuyển chữ tiếp theo". Để thanh cố định không che nút nào trên màn hình thấp, Xem mẫu và Viết lại thu thành 2 nút tròn chỉ có biểu tượng (mắt, mũi tên xoay), nằm bên trái cùng thanh. Bỏ dòng "✓ Chính xác!" dưới khung vì trùng với thông báo ngay dưới khung chữ |
| 18.55 | **Trang chi tiết chữ Hán cũng có nút "Chuyển chữ tiếp theo" / "Hoàn thành"** (cùng thanh cố định như 18.54, dùng chung `NutChuyenChu.jsx`). Chủ dự án chốt: (1) "chữ tiếp theo" đi theo DANH SÁCH đã mở chữ đó — mở từ chữ hôm nay thì đi trong chữ hôm nay, từ "Xem toàn bộ" thì theo thứ tự danh sách HSK của cấp, từ kết quả tìm kiếm thì trong kết quả tìm kiếm; (2) phải viết xong chữ đang xem (giản thể hay Kanji đều được) thì nút mới bấm được; (3) "Hoàn thành" ở chữ cuối chỉ đưa về danh sách, KHÔNG đánh dấu đã học (đã học vẫn tính như cũ: xong Tập viết và Trò chơi lật thẻ trong Bài hôm nay), và không hỏi lại "Chưa hoàn thành" vì người học vừa đi hết lượt. Chuyển chữ thì trang cuộn về đầu |
| 18.56 | **Nâng Firebase lên gói Blaze, dùng Cloud Functions** (chủ dự án chọn, thay cho cron-job.org hay Cloudflare Worker; CLAUDE.md đã sửa mục nền tảng). Lý do: GitHub Actions chạy lịch trễ 3–5 tiếng (khung 21h tới lúc 1 giờ sáng). (1) **Quản trị gửi thông báo tức thì**: DUY NHẤT tài khoản Google của chủ dự án, ghi bằng UID `NGEhCGlJnwXQTJpgDH5bMPNPgwT2` trong `src/thong-bao/quanTri.js` (không ghi email vì code công khai). Cài đặt có khung "Gửi thông báo cho mọi người" (tiêu đề ≤ 60 ký tự, bỏ trống thì là "Riyi"; nội dung ≤ 300 ký tự), chỉ hiện với tài khoản này; bấm Gửi thì hỏi lại một lần rồi gọi hàm `guiThongBaoToanBo` (vùng asia-southeast1). MÁY CHỦ tự kiểm tra lại UID người gọi, người khác sửa app cũng không gửi được. Gửi tới mọi người đã bật thông báo (người chưa cho phép thông báo trên máy thì trình duyệt không cho gửi); mỗi lần gửi ghi vào collection `thongBaoQuanTri` (app không đọc được). (2) **Nhắc học 7h/14h/21h** chuyển sang Cloud Scheduler (`nhacHoc7h/14h/21h`, múi giờ Asia/Ho_Chi_Minh), cùng nội dung `soanThongBao.js`; lịch tự chạy của GitHub Actions bỏ đi (chỉ giữ nút chạy tay để thử) NHƯNG chỉ đẩy lên GitHub sau khi hàm máy chủ đã chạy, để không có ngày nào mất nhắc học. (3) Gửi với Urgency "high" để điện thoại đang ngủ vẫn hiện ngay; giữ tin 3 tiếng (nhắc học) / 24 tiếng (quản trị) nếu máy mất mạng. (4) Sửa lỗi thông báo trỏ tới biểu tượng không có thật (`bieu-tuong-192.png` → `icon-192.png`). Lệnh: `npm run trien-khai` nay chỉ đưa hosting + firestore; hàm máy chủ đưa bằng `npm run trien-khai-ham` (tự chép file dùng chung vào `functions/chung/` trước) |
| 18.57 | **THAY 18.56: không nâng Blaze** (chủ dự án không có thẻ tín dụng; Apple Pay không dùng được cho Google Cloud) → **ở lại gói Spark, dùng cron-job.org + GitHub Actions**. Đã gỡ Cloud Functions (`functions/`, mục functions trong firebase.json, lệnh `trien-khai-ham`; code còn trong commit 68b264b nếu sau này có thẻ). CLAUDE.md trả lại "Gói Spark". Giữ nguyên từ 18.56: khung "Gửi thông báo cho mọi người" trong Cài đặt chỉ cho UID quản trị, giới hạn 60/300 ký tự, hỏi lại trước khi gửi, Urgency "high", sửa icon thông báo. Cách chạy mới: (1) Nút Gửi cất tin vào hàng chờ Firestore `thongBaoCho` (`tieuDe`, `than`, `taoLuc`, `trangThai: "cho"`); **firestore.rules** chỉ cho UID quản trị đọc/tạo, đúng 4 trường, độ dài giới hạn, không ai sửa/xoá từ app — đây là chỗ kiểm tra quyền thật (UID phải trùng `src/thong-bao/quanTri.js`). (2) cron-job.org gọi GitHub API `workflow_dispatch` **5 phút một lần** (một việc hẹn giờ duy nhất, body `{"ref":"main"}`), `gui.js --tu-dong` gửi hàng chờ (đánh dấu "dang-gui" bằng transaction trước khi gửi, xong ghi "da-gui" + số người/thiết bị), rồi gửi nhắc học nếu khung 7h/14h/21h vừa tới mà chưa gửi (`khungDenHan`, ghi khung đã gửi ở `heThong/nhacHoc`); quá 2 tiếng sau giờ khung thì bỏ, không nhắc sai giờ. Tin quản trị tới máy sau ~1–6 phút; Cài đặt hiện 5 tin gần nhất, "Đang chờ gửi" tự đổi thành "Đã gửi tới N thiết bị của M người". (3) Workflow có `concurrency` để không chạy chồng, cache npm cho nhanh; giữ lịch GitHub **dự phòng** `3,23,43 * * * *` cùng việc tu-dong (không gửi trùng nhờ bước ghi lại). (4) Mã GitHub cho cron-job.org: fine-grained token, chỉ kho riyi-chinese, chỉ quyền Actions read/write, chủ dự án tự dán vào cron-job.org, KHÔNG gửi qua chat. Hướng dẫn: `tai-lieu/HUONG-DAN-THONG-BAO.md` mục "Cài cron-job.org" |

### Đang chờ chủ dự án

1. Rà lại dữ liệu 10 chữ (mở từng chữ, bấm mục "Chưa kiểm tra").
2. Thử tập viết trên điện thoại thật (GĐ 2).
3. Rà dữ liệu Tab B: 20 cặp, mục "Chưa kiểm tra" của từng cặp. Đặc biệt 3 chỗ Claude chưa chắc: (a) nghĩa Trung "mẹ" của 娘 chỉ là khẩu ngữ một số vùng, (b) từ gợi ý thay thế như 结实, 约定 (c) bản dịch Việt của các câu.
4. Rà dữ liệu Tab C: 100 từ, mục "Chưa kiểm tra" của từng từ, đặc biệt nghĩa Nhật/Việt và bản dịch Việt của câu.
5. Rà nội dung ngữ pháp Tab F: 15 điểm, đặc biệt phần "Chỗ lệch" và "Lỗi hay gặp" (Claude soạn, không có nguồn kiểm).
6. ~~Kết nối Firebase và deploy~~ **Đã xong 2026-09-21** (xem 14.11). Còn lại: thử đăng nhập, đánh dấu "đã học", tập viết trên điện thoại thật. Nội dung cũ: kết nối Firebase và deploy theo README, mục "Kết nối Firebase": điền `.env`, bật đăng nhập Google, tạo Firestore, chạy `firebase login` và `npm run trien-khai`. Rồi thử đăng nhập, đánh dấu "đã học", tập viết trên điện thoại (chưa được kiểm thử với Firebase thật).
7. ~~Duyệt GĐ 3–6 để sang GĐ 7~~ Chủ dự án trả lời câu hỏi GĐ 7 và cho làm tiếp (2026-09-21). Dữ liệu GĐ 1–5 vẫn chờ rà (mục 1, 3, 4, 5).
8. **Thử GĐ 7 trên điện thoại** với tài khoản thật: làm vài lượt luyện tập, xem thanh mục tiêu, đạt mục tiêu, mở Review. Xem lại các lựa chọn 15.5–15.16.
9. Rà cách chia câu cho bài sắp xếp (15.16).
10. ~~Duyệt GĐ 7~~ Chủ dự án cho sang GĐ 8 (2026-09-21).
11. **Thử GĐ 8 trên điện thoại thật**: cài Riyi vào màn hình chính (hướng dẫn trong README), xem màn hình chờ, bật chế độ máy bay rồi mở app, và xem dải "Đã có phiên bản mới" sau lần triển khai tiếp theo.
12. Duyệt GĐ 8 để sang GĐ 9 (bổ sung đầy đủ nội dung HSK 1–3).

### Còn nợ kỹ thuật, xử lý ở giai đoạn sau

| Việc | Xử lý ở |
| --- | --- |
| ~~Gỡ ô "Khu vực tạm thời của giai đoạn 0" (công tắc giả lập đăng nhập)~~ | Đã xong ở GĐ 6 |
| Gỡ ô kiểm tra tự dạng và ô "Thử hiển thị ba thứ tiếng" | GĐ cuối |
| Gắn nguồn âm thanh thật vào `phatAm.js` | Chờ chủ dự án chốt giọng máy hay file thu sẵn |
| ~~Nút bật/tắt furigana trong Cài đặt~~ | Đã xong ở GĐ 6 |
| Nghĩa tiếng Nhật, âm On, âm Hán Việt, câu ví dụ — **PDF không có**, phải nhập thêm | GĐ 1–5 |

### Các giai đoạn còn lại

- [x] GĐ 1 — Tab A phần tĩnh (10 thẻ chữ Hán). **Đã làm xong, chờ chủ dự án rà dữ liệu và duyệt.**
- [x] GĐ 2 — Tab A phần viết tay (HanziWriter). **Đã làm xong, chờ chủ dự án thử trên điện thoại và duyệt.**
- [x] GĐ 3 — Tab B (20 cặp đồng tự dị nghĩa). **Đã làm xong, chờ chủ dự án rà dữ liệu và duyệt.**
- [x] GĐ 4 — Tab C (từ vựng, 100 từ HSK 1). **Đã làm xong, chờ chủ dự án rà dữ liệu và duyệt.**
- [x] GĐ 5 — Tab F (ngữ pháp, 15 điểm HSK 1–2). **Đã làm xong, chờ chủ dự án rà dữ liệu và duyệt.**
- [x] GĐ 6 — Đăng nhập Google, Firestore, Cài đặt. **Code xong, chờ chủ dự án kết nối Firebase và deploy để thử trên điện thoại.**
- [x] GĐ 7 — Luyện tập (Tab B, C, F), Tab D mục tiêu ngày, Tab E review tuần. **Đã làm xong, chờ chủ dự án thử trên điện thoại và duyệt.**
- [x] GĐ 8 — Hoàn thiện PWA. **Đã làm xong, chờ chủ dự án thử cài trên điện thoại và duyệt.**
- [x] GĐ 9 — Bổ sung đầy đủ HSK 1–3 (1000 từ, 655 chữ, 61 cặp đồng tự, 70 điểm ngữ pháp; toàn bộ còn `cangKiemTra` chờ chủ dự án rà)
- [ ] GĐ 10 — Chức năng bổ sung

---

## 10. Cách dùng file này

**Khi mở phiên làm việc mới với Claude trên máy bất kỳ**, nói:

> Đọc `tai-lieu/QUYET-DINH-DA-CHOT.md` và `CLAUDE.md` trước khi làm gì.

Claude sẽ nắm được toàn bộ bối cảnh mà không cần hỏi lại từ đầu.

**Mỗi khi chốt thêm quyết định mới**, ghi vào đây rồi commit. Đừng để quyết định
chỉ nằm trong cửa sổ trò chuyện, vì cửa sổ đó không đi theo sang máy khác.
