# Riyi — Học tiếng Trung cho người biết tiếng Nhật

App học tiếng Trung HSK cấp 1–3, dành cho người Việt đã có nền tảng tiếng Nhật
(N4–N1). Khai thác mối liên hệ Hán tự Trung – Nhật và âm Hán Việt để học nhanh hơn.

**Trạng thái: đã xong giai đoạn 0 (nền móng).**

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
| `npm run dev` | Chạy app để xem thử |
| `npm run build` | Đóng gói app để đưa lên mạng |
| `npm run tai-font` | Tải font gốc về (chỉ cần khi máy mới) |
| `npm run cat-font` | **Cắt nhỏ font theo chữ đang dùng** |
| `npm run rut-hsk` | Rút lại dữ liệu HSK từ file PDF |
| `npm run tach-logo` | Cắt lại logo và tạo icon (khi đổi file logo) |
| `npm run so-sanh-tu-dang` | Đo xem chữ Trung và Nhật vẽ khác nhau bao nhiêu |

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

## Nền tảng kỹ thuật

Vite + React + Tailwind CSS v4. Sau này thêm Firebase (chỉ Google Sign-In,
Firestore, Hosting — gói Spark miễn phí). App cần mạng, **không** chạy offline.

## Tiến độ theo giai đoạn

- [x] **GĐ 0** — Nền móng: cấu trúc JSON, khung app 6 tab, font đã cắt
- [ ] GĐ 1 — Tab A phần tĩnh (10 thẻ chữ Hán)
- [ ] GĐ 2 — Tab A phần viết tay (HanziWriter)
- [ ] GĐ 3 — Tab B (20 cặp đồng tự dị nghĩa)
- [ ] GĐ 4 — Tab C (từ vựng)
- [ ] GĐ 5 — Tab F (ngữ pháp)
- [ ] GĐ 6 — Đăng nhập Google, Firestore
- [ ] GĐ 7 — Tab D và Tab E (mục tiêu, review)
- [ ] GĐ 8 — Hoàn thiện PWA
- [ ] GĐ 9 — Bổ sung đầy đủ HSK 1–3
- [ ] GĐ 10 — Chức năng bổ sung
