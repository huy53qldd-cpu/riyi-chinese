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
