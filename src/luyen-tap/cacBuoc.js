/* =============================================================================
   KHAI BÁO CÁC PHẦN VÀ CÁC BƯỚC CỦA BÀI HÔM NAY
   =============================================================================

   File này CHỈ CÓ DỮ LIỆU, không nhập gì từ React. Nhờ vậy cả hai bên dùng
   chung được một nguồn duy nhất, không sợ lệch nhau:

     - App (src/luyen-tap/baiHoc.js)
     - Bộ gửi thông báo chạy trên GitHub Actions (cong-cu/thong-bao/), vì nó
       cần TONG_BUOC để tính % tiến độ hôm nay của từng người.

   Thêm hay bớt một bước thì % tiến độ của thông báo tự đổi theo.
   ============================================================================= */

export const CAC_PHAN = [
  {
    ma: "chu",
    nhan: "Chữ Hán",
    buoc: [
      { ma: "chu-tap-viet", nhan: "Tập viết", bieuTuong: "tap-viet" },
      { ma: "chu-lat-the", nhan: "Trò chơi lật thẻ", bieuTuong: "tro-choi", laGame: true },
    ],
  },
  {
    ma: "tu",
    nhan: "Từ vựng",
    buoc: [
      { ma: "tu-the", nhan: "Thẻ ghi nhớ", bieuTuong: "the-ghi-nho" },
      { ma: "tu-trac-nghiem", nhan: "Trắc nghiệm", bieuTuong: "trac-nghiem" },
      { ma: "tu-dien-tu", nhan: "Điền từ", bieuTuong: "dien-tu" },
      { ma: "tu-lat-the", nhan: "Trò chơi lật thẻ", bieuTuong: "tro-choi", laGame: true },
    ],
  },
  {
    ma: "nghe",
    nhan: "Luyện nghe",
    buoc: [{ ma: "nghe-chon-am", nhan: "Luyện nghe", bieuTuong: "nghe" }],
  },
  {
    ma: "np",
    nhan: "Ngữ pháp",
    buoc: [
      { ma: "np-sap-xep", nhan: "Sắp xếp câu", bieuTuong: "sap-xep" },
      { ma: "np-chon-cau", nhan: "Chọn câu đúng", bieuTuong: "chon-cau" },
    ],
  },
];

export const TONG_BUOC = CAC_PHAN.reduce((t, p) => t + p.buoc.length, 0);
export const TAT_CA_BUOC = CAC_PHAN.flatMap((p) => p.buoc);
