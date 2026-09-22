/* =============================================================================
   DANH SÁCH TAB CỦA KHOÁ 1
   =============================================================================

   Khai báo tab ở ĐÚNG MỘT CHỖ này. Thanh dưới, thanh trên và phần nội dung
   đều đọc từ đây, nên thêm/bớt/đổi tên tab chỉ sửa file này.

   Bố cục đã chốt:
     - "Bài hôm nay" nằm ở THANH TRÊN, chỉ hiện khi đã đăng nhập.
     - THANH DƯỚI (GĐ 10, quyết định 18.31): Phát âm · Chữ Hán · Từ vựng ·
       Ngữ pháp · Khám phá. Đồng tự dị nghĩa và Review cuối tuần nằm TRONG
       Khám phá (sau này thêm Thi thử HSK).
   ============================================================================= */

// Mã tab. Dùng hằng số thay vì gõ chuỗi để không gõ sai chính tả.
export const TAB = {
  PHAT_AM: "phat-am",
  KHAM_PHA: "kham-pha",
  CHU_HAN: "chu-han",
  DONG_TU: "dong-tu",
  TU_VUNG: "tu-vung",
  NGU_PHAP: "ngu-phap",
  REVIEW: "review",
  MUC_TIEU: "muc-tieu",
};

/* -----------------------------------------------------------------------------
   BIỂU TƯỢNG
   Vẽ bằng SVG nét, không dùng ảnh, để đổi màu theo theme và phóng to không vỡ.
   Tất cả dùng stroke="currentColor" nên tự ăn theo màu chữ của nút.
   ----------------------------------------------------------------------------- */

const thuocTinhChung = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

// Phát âm: cái loa và hai vòng sóng âm
function IconPhatAm(props) {
  return (
    <svg {...thuocTinhChung} {...props}>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
      <path d="M18.5 6.5a8 8 0 0 1 0 11" />
    </svg>
  );
}

// Khám phá: la bàn
function IconKhamPha(props) {
  return (
    <svg {...thuocTinhChung} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13.4 13.4 8.5 15.5 10.6 10.6z" />
    </svg>
  );
}

// Tab A — Luyện chữ Hán: ô vuông kẻ ô như giấy tập viết chữ Hán (田字格)
function IconChuHan(props) {
  return (
    <svg {...thuocTinhChung} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M12 3v18M3 12h18" strokeDasharray="2.5 2.5" strokeWidth="1.2" />
    </svg>
  );
}

// Tab B — Đồng tự dị nghĩa: hai hình chồng nhau kèm dấu chấm than cảnh báo
function IconDongTu(props) {
  return (
    <svg {...thuocTinhChung} {...props}>
      <rect x="3" y="6" width="11" height="11" rx="2" />
      <path d="M17 6h4v11h-4" />
      <path d="M8.5 10v2.5M8.5 15v.01" />
    </svg>
  );
}

// Tab C — Từ vựng: chồng thẻ flashcard
function IconTuVung(props) {
  return (
    <svg {...thuocTinhChung} {...props}>
      <rect x="2.5" y="7" width="15" height="12" rx="2" />
      <path d="M6.5 4h12a2 2 0 0 1 2 2v10" />
      <path d="M6 12h8M6 15.5h5" strokeWidth="1.4" />
    </svg>
  );
}

// Tab F — Ngữ pháp: các khối xếp theo trật tự từ trong câu
function IconNguPhap(props) {
  return (
    <svg {...thuocTinhChung} {...props}>
      <rect x="2.5" y="5" width="6" height="5" rx="1.5" />
      <rect x="11" y="5" width="10.5" height="5" rx="1.5" />
      <rect x="2.5" y="14" width="10.5" height="5" rx="1.5" />
      <rect x="15.5" y="14" width="6" height="5" rx="1.5" />
    </svg>
  );
}

// Tab E — Review cuối tuần: biểu đồ cột
function IconReview(props) {
  return (
    <svg {...thuocTinhChung} {...props}>
      <path d="M3 21h18" />
      <rect x="5" y="12" width="3.5" height="6" rx="1" />
      <rect x="10.25" y="7" width="3.5" height="11" rx="1" />
      <rect x="15.5" y="14" width="3.5" height="4" rx="1" />
    </svg>
  );
}

/* -----------------------------------------------------------------------------
   5 TAB Ở THANH DƯỚI
   nhan     : chữ hiện dưới biểu tượng, phải NGẮN vì màn hình điện thoại hẹp
   nhanDay  : tên đầy đủ, dùng cho tiêu đề màn hình và cho trình đọc màn hình
   ----------------------------------------------------------------------------- */
export const TAB_THANH_DUOI = [
  {
    ma: TAB.PHAT_AM,
    nhan: "Phát âm",
    nhanDay: "Phát âm tiếng Trung",
    Icon: IconPhatAm,
    moTa: "Bảng pinyin: chạm vào ô để nghe người bản xứ đọc đủ 4 thanh.",
  },
  {
    ma: TAB.CHU_HAN,
    nhan: "Chữ Hán",
    nhanDay: "Luyện chữ Hán",
    Icon: IconChuHan,
    moTa: "So sánh tự dạng Trung – Nhật – Phồn thể, âm đọc và thứ tự nét.",
  },
  {
    ma: TAB.TU_VUNG,
    nhan: "Từ vựng",
    nhanDay: "Từ vựng",
    Icon: IconTuVung,
    moTa: "Thẻ từ HSK 1–3 kèm câu ví dụ, flashcard và trắc nghiệm.",
  },
  {
    ma: TAB.NGU_PHAP,
    nhan: "Ngữ pháp",
    nhanDay: "Ngữ pháp Trung – Nhật",
    Icon: IconNguPhap,
    moTa: "Ngữ pháp tiếng Trung đối chiếu với cấu trúc tiếng Nhật đã quen.",
  },
  {
    ma: TAB.KHAM_PHA,
    nhan: "Khám phá",
    nhanDay: "Khám phá",
    Icon: IconKhamPha,
    moTa: "Đồng tự dị nghĩa, Review cuối tuần, và các chức năng mở rộng.",
  },
];

/**
 * Các mục bên trong Khám phá. Mục chưa có (sapCo) hiện mờ, không bấm được.
 * IconDongTu, IconReview dùng lại biểu tượng cũ của hai tab này.
 */
export const MUC_KHAM_PHA = [
  {
    ma: TAB.DONG_TU,
    nhan: "Đồng tự dị nghĩa",
    Icon: IconDongTu,
    moTa: "Từ viết giống nhau giữa tiếng Trung và tiếng Nhật nhưng nghĩa khác.",
  },
  {
    ma: TAB.REVIEW,
    nhan: "Review cuối tuần",
    Icon: IconReview,
    moTa: "Tổng kết tuần, các mục sai nhiều nhất và biểu đồ so với tuần trước.",
  },
  {
    ma: "thi-thu",
    nhan: "Thi thử HSK",
    Icon: IconNguPhap,
    moTa: "Làm bài thi thử theo dạng đề HSK.",
    sapCo: true,
  },
];

/** Tra cứu nhanh thông tin một tab theo mã. */
export function timTab(ma) {
  return TAB_THANH_DUOI.find((t) => t.ma === ma) || null;
}
