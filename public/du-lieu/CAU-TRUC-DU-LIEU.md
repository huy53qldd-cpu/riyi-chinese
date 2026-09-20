# Cấu trúc dữ liệu bài học Riyi

Tài liệu này chốt cấu trúc 4 loại file JSON của app. Đây là kết quả của
**giai đoạn 0**. Nội dung thật sẽ được nhập dần ở giai đoạn 1 đến 5.

---

## Nguyên tắc chung

1. **Toàn bộ dữ liệu bài học nằm trong file JSON tĩnh ở thư mục này.**
   Không hard-code trong giao diện, không lưu trên Firestore.
   Firestore chỉ giữ tiến độ và cài đặt của người dùng.

2. **Chia file theo cấp HSK** để app tải dần cho nhẹ, không bắt tải hết một lúc.

3. **Mỗi file có trường `phienBan`.** App so sánh với `manifest.json` khi mở,
   thấy số lớn hơn thì tải lại và xoá cache cũ.

4. **Thứ tự nội dung luôn là: TIẾNG TRUNG → TIẾNG NHẬT → TIẾNG VIỆT.**
   Thứ tự các trường trong JSON cũng viết theo đúng thứ tự đó cho dễ đọc.

5. **Không bịa.** Trường nào chưa xác minh được thì để `null` và ghi vào
   `cangKiemTra`, tuyệt đối không đoán. Đặc biệt với âm đọc, nghĩa chữ Hán
   và cấu trúc ngữ pháp tương đương.

---

## Hai quy ước gõ chữ dùng chung mọi nơi

### Quy ước 1 — Pinyin phải tách theo TỪNG CHỮ

Pinyin hiển thị nhỏ phía trên từng chữ Hán (ruby). Muốn pinyin nằm đúng trên
đầu chữ của nó thì phải lưu tách rời, dùng hai mảng song song:

```json
"trung": "我学习汉语",
"pinyin": ["wǒ", "xué", "xí", "hàn", "yǔ"]
```

Số phần tử của `pinyin` phải **bằng đúng** số chữ trong `trung`.
Dấu câu thì để chuỗi rỗng `""`.

> Không được lưu gộp thành `"wǒ xué xí hàn yǔ"`. Lưu gộp thì pinyin sẽ trôi
> lệch, không khớp với chữ nào cả.

**Pinyin ghi THANH ĐIỆU GỐC**, không ghi thanh sau biến điệu. Chỗ nào có biến
điệu thì ghi riêng vào `ghiChuBienDieu`, ví dụ với 不, 一, và hai thanh 3 liền
nhau. Xem mục "Ghi chú biến điệu" bên dưới.

### Quy ước 2 — Furigana viết bằng ngoặc vuông

Furigana đặt ngay sau cụm chữ Hán, trong ngoặc vuông:

```json
"nhat": "私[わたし]は中国語[ちゅうごくご]を勉強[べんきょう]します"
```

App tự tách và vẽ thành chữ nhỏ phía trên. Người dùng tắt furigana được trong
Cài đặt, mặc định bật.

---

## Ghi chú biến điệu

Trường `ghiChuBienDieu` là một dòng chữ ngắn bằng tiếng Việt, hoặc `null` nếu
không có gì đặc biệt. Ghi sẵn vào dữ liệu, **không để app tự phát hiện** vì
tự phát hiện rất dễ sai, nhất là với 一.

Ba trường hợp cần ghi:

| Trường hợp | Ví dụ nội dung ghi chú |
| --- | --- |
| 不 trước thanh 4 | `"不 ở đây đọc thành bú vì đứng trước thanh 4."` |
| 一 đổi thanh | `"一 ở đây đọc thành yí vì đứng trước thanh 4."` |
| Hai thanh 3 liền nhau | `"你好: chữ 你 đọc thành thanh 2 khi đứng trước thanh 3."` |

---

## 1. Chữ Hán — Tab A

**Tên file:** `chu-han-hsk1.json`, `chu-han-hsk2.json`, `chu-han-hsk3.json`

```jsonc
{
  "loai": "chu-han",
  "cap": 1,
  "phienBan": 1,
  "capNhatLuc": "2026-09-20",
  "danhSach": [
    {
      "id": "han-0001",              // mã cố định, không đổi dù sắp xếp lại
      "capHsk": 1,

      // --- Ba cột tự dạng, đúng thứ tự hiển thị trên màn hình ---
      "gianThe": "学",               // Trung Quốc dùng
      "tuDangNhat": "学",            // 新字体 Nhật dùng
      "phonThe": "學",               // phồn thể

      "soSanhTuDang": {
        // So sánh CỘT TRUNG với CỘT NHẬT, vì đó là thứ người học quan tâm nhất.
        // Chỉ nhận 1 trong 3 giá trị:
        //   "giong-het"        cùng một mã Unicode
        //   "khac-mot-chut"    nhận ra ngay là cùng chữ, chỉ khác vài nét
        //   "khac-hoan-toan"   chưa học thì không đoán ra được
        "trungVsNhat": "giong-het",

        // Có những chữ CÙNG MÃ UNICODE nhưng nét vẽ vẫn khác nhau, ví dụ 直, 骨,
        // 今. Đây chính là điều app muốn dạy, nên phải đánh dấu riêng.
        "khacNetVe": false,
        "ghiChu": null
      },

      // --- Âm đọc ---
      // Mỗi âm đọc đều PHẢI có từ ví dụ, để người học biết âm đó dùng ở đâu.
      // Âm nào "chinh": true thì hiển thị to, các âm còn lại hiện nhỏ bên dưới.
      "amDoc": {
        "pinyin": [
          { "am": "xué", "chinh": true, "viDuTu": "学习", "viDuNghia": "học tập" }
        ],
        "amOn": [
          { "am": "ガク", "chinh": true, "viDuTu": "学生[がくせい]", "viDuNghia": "học sinh" }
        ],
        "amKun": [
          { "am": "まな-ぶ", "chinh": true, "viDuTu": "学[まな]ぶ", "viDuNghia": "học" }
        ],
        "amHanViet": [
          { "am": "học", "chinh": true }
        ]
      },

      // --- Nghĩa, đúng thứ tự Trung → Nhật → Việt ---
      "nghia": {
        "trung": "学习、模仿",
        "nhat": "学[まな]ぶ、勉強[べんきょう]する",
        "viet": "học, học tập"
      },

      "soNet": 8,
      "boThu": "子",

      // Danh sách trường chưa xác minh được, để người kiểm tra biết đường rà lại.
      // Mảng rỗng nghĩa là đã kiểm tra hết.
      "cangKiemTra": []
    }
  ]
}
```

> **Lưu ý về `soSanhTuDang`:** nhãn này do người nhập liệu quyết định, KHÔNG để
> code tự so sánh. Code so tự động rất dễ sai vì nhiều chữ cùng mã Unicode
> nhưng vẫn vẽ khác nhau.

---

## 2. Đồng tự dị nghĩa — Tab B

**Tên file:** `dong-tu-di-nghia.json` (một file duy nhất, không chia theo cấp)

```jsonc
{
  "loai": "dong-tu-di-nghia",
  "phienBan": 1,
  "capNhatLuc": "2026-09-20",

  // Lưu ý bắt buộc hiển thị ở đầu tab. Để trong dữ liệu chứ không viết trong
  // giao diện, để sửa câu chữ không phải sửa code.
  "luuYDauTab": "Nhiều cặp từ dưới đây khi viết ra trông hơi khác nhau ...",

  "danhSach": [
    {
      "id": "dtdn-0001",

      "chuNhat": "手紙",             // dạng chữ Nhật
      "chuTrungGianThe": "手纸",     // dạng giản thể tương ứng
      "amHanViet": "thủ chỉ",

      // Có những từ Nhật KHÔNG tồn tại như một từ trong tiếng Trung hiện đại
      // (ví dụ 切手). Khi đó để false, và app sẽ ghi rõ thay vì cố ghép nghĩa.
      "tonTaiTrongTiengTrung": true,

      // Chỉ nhận 1 trong 3 giá trị:
      //   "nghia-lech-nhe" | "nghia-khac-han" | "de-hieu-lam-nghiem-trong"
      "mucNguyHiem": "de-hieu-lam-nghiem-trong",

      "capHsk": 3,                   // hoặc null nếu nằm ngoài HSK 1–3

      // --- Cột TRUNG ---
      "trung": {
        "pinyin": ["shǒu", "zhǐ"],
        "nghia": "giấy vệ sinh",
        "viDu": {
          "trung": "请给我手纸。",
          "pinyin": ["qǐng", "gěi", "wǒ", "shǒu", "zhǐ", ""],
          "nghiaViet": "Làm ơn đưa tôi giấy vệ sinh.",
          "ghiChuBienDieu": null
        }
      },

      // --- Cột NHẬT ---
      "nhat": {
        "cachDoc": "てがみ",
        "nghia": "lá thư",
        "viDu": {
          "nhat": "手紙[てがみ]を書[か]きます。",
          "nghiaViet": "Tôi viết thư."
        }
      },

      // --- Cột VIỆT: giải thích ngắn sự khác biệt ---
      "viet": {
        "giaiThich": "Cùng viết là 手紙 nhưng nghĩa khác hẳn ...",
        "choDeNham": "Nói 手纸 ở Trung Quốc khi muốn nói 'lá thư' sẽ thành ..."
      },

      "cangKiemTra": []
    }
  ]
}
```

---

## 3. Từ vựng — Tab C

**Tên file:** `tu-vung-hsk1.json`, `tu-vung-hsk2.json`, `tu-vung-hsk3.json`

```jsonc
{
  "loai": "tu-vung",
  "cap": 1,
  "phienBan": 1,
  "capNhatLuc": "2026-09-20",
  "danhSach": [
    {
      "id": "tu-0001",
      "capHsk": 1,
      "soThuTuHsk": 1,          // số thứ tự trong đại cương HSK chính thức

      "tu": "爱",
      "pinyin": ["ài"],
      "tuLoai": "động từ",       // dịch từ cột 词性 của đại cương
      "chuDe": "cam-xuc",        // để lọc theo chủ đề

      "nghiaNhat": "愛[あい]する、好[す]きだ",
      "nghiaViet": "yêu, yêu thích",

      "ghiChuBienDieu": null,

      // Từ này còn một nghĩa khác thuộc cấp cao hơn. App chỉ dạy nghĩa của
      // cấp chính. Mảng rỗng là bình thường.
      "capPhu": [],

      // Với vài từ, phần trong ngoặc ở đại cương nói cũng được bỏ cũng được,
      // ví dụ 没（有）. Khi đó ghi dạng ngắn vào đây, không thì để null.
      "dangRutGon": null,

      "viDu": [
        {
          "trung": "我爱我的家。",
          "pinyin": ["wǒ", "ài", "wǒ", "de", "jiā", ""],
          "nhat": "私[わたし]は家族[かぞく]を愛[あい]しています。",
          "viet": "Tôi yêu gia đình tôi.",
          "ghiChuBienDieu": null
        }
      ],

      "cangKiemTra": []
    }
  ]
}
```

---

## 4. Ngữ pháp — Tab F

**Tên file:** `ngu-phap-hsk1.json`, `ngu-phap-hsk2.json`, `ngu-phap-hsk3.json`

```jsonc
{
  "loai": "ngu-phap",
  "cap": 1,
  "phienBan": 1,
  "capNhatLuc": "2026-09-20",
  "danhSach": [
    {
      "id": "np-0001",
      "capHsk": 1,

      "ten": "了 chỉ sự hoàn thành của hành động",
      "congThuc": "Chủ ngữ + Động từ + 了 + Tân ngữ",

      "viDu": [
        {
          "trung": "我吃了饭。",
          "pinyin": ["wǒ", "chī", "le", "fàn", ""],
          "viet": "Tôi ăn cơm rồi.",
          "ghiChuBienDieu": null
        }
      ],

      // --- Đối chiếu tiếng Nhật: phần quan trọng nhất của tab này ---
      "doiChieuNhat": {
        // false = tiếng Nhật KHÔNG có cấu trúc trùng khít.
        // Khi đó BẮT BUỘC phải có nhãn và phải nói rõ chỗ lệch.
        "coCauTrucTrungKhit": false,

        "cauTruc": "～た",
        "nhan": "gần tương đương, không trùng khít",
        "choLech": "了 đánh dấu hành động ĐÃ HOÀN THÀNH, còn た là THÌ QUÁ KHỨ. Hai thứ này không trùng nhau ...",

        "viDuNhat": "ご飯[はん]を食[た]べました。"
      },

      "giaiThichViet": "...",

      // Cảnh báo lỗi mà người biết tiếng Nhật hay mắc
      "canhBaoLoi": [
        {
          "loai": "trat-tu-tu",     // hoặc "nham-voi-tieng-nhat", "thieu-thanh-phan"
          "noiDung": "Tiếng Trung là chủ – động – tân, tiếng Nhật là chủ – tân – động ...",
          "cauSai": "我饭吃了。",
          "cauDung": "我吃饭了。"
        }
      ],

      "cangKiemTra": []
    }
  ]
}
```

### Điểm ngữ pháp bắt buộc phải có cảnh báo riêng

Vì tiếng Nhật không có cấu trúc trùng khít, những điểm sau bắt buộc
`coCauTrucTrungKhit: false` và phải có `choLech` nói rõ:

- 了 (phân biệt rõ với た, không được coi là tương đương)
- 把
- 被
- 比 và các dạng so sánh
- Bổ ngữ kết quả và bổ ngữ khả năng (结果补语, 可能补语)
- 的 / 得 / 地
- Lượng từ (量词) đối chiếu với 助数詞
- Trật tự trạng ngữ thời gian và nơi chốn

---

## 5. File manifest

**Tên file:** `manifest.json`

App đọc file này đầu tiên khi mở, để biết có bản dữ liệu mới hay không.

```jsonc
{
  "phienBanDuLieu": 1,           // tăng lên khi BẤT KỲ file nào thay đổi
  "capNhatLuc": "2026-09-20",
  "tep": {
    "chu-han-hsk1":      { "duongDan": "chu-han-hsk1.json",     "phienBan": 1, "soMuc": 0 },
    "tu-vung-hsk1":      { "duongDan": "tu-vung-hsk1.json",     "phienBan": 1, "soMuc": 0 },
    "dong-tu-di-nghia":  { "duongDan": "dong-tu-di-nghia.json", "phienBan": 1, "soMuc": 0 },
    "ngu-phap-hsk1":     { "duongDan": "ngu-phap-hsk1.json",    "phienBan": 1, "soMuc": 0 }
  }
}
```

---

## Nguồn dữ liệu

Danh sách từ, chữ và ngữ pháp lấy từ **một nguồn chuẩn duy nhất**:

> 新版HSK考试大纲（词汇、汉字、语法）
> 中外语言交流合作中心 phát hành, công bố 2025-11, áp dụng 2026-07.
> File gốc: `tai-lieu/新版HSK考试大纲（词汇、汉字、语法）.pdf`

Dữ liệu thô rút tự động từ PDF nằm ở `src/du-lieu/hsk-goc/`.
Chạy lại bằng lệnh `npm run rut-hsk`.

Số liệu đã rút được (cấp 1–3):

| | Cấp 1 | Cấp 2 | Cấp 3 | Tổng |
| --- | ---: | ---: | ---: | ---: |
| Từ vựng | 300 | 200 | 500 | **1000** |
| Chữ Hán (认读字) | 246 | 125 | 284 | **655** |

Phần **nghĩa tiếng Nhật, nghĩa tiếng Việt, âm On, âm Hán Việt và câu ví dụ**
KHÔNG có trong PDF, phải nhập thêm ở các giai đoạn sau.
