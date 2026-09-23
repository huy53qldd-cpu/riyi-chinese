/* =============================================================================
   BIỂU TƯỢNG TRÊN NÚT BẤM
   =============================================================================

   Đây là NƠI DUY NHẤT quyết định nút nào dùng hình nào. Muốn đổi hình của một
   loại nút thì sửa bảng HINH bên dưới, không sửa ở từng màn hình.

   Hình lấy từ bộ Lucide (lucide.dev, giấy phép ISC): nét mảnh, một màu. Màu của
   hình là màu chữ của nút (currentColor), nên đổi theme là hình tự đổi màu.

   Chỉ gắn hình cho nút hành động, cách luyện tập và mục Cài đặt. KHÔNG gắn cho
   nút lọc nhỏ (HSK 1/2/3, Tất cả, chủ đề) để màn hình không rối.

   Ở theme hoa anh đào, vài điểm nhấn đổi hình (xem HoaAnhDao, CanhHoa bên dưới
   và các lớp .chi-anh-dao / .tru-anh-dao trong index.css).
   ============================================================================= */

import {
  ALargeSmall,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  Eye,
  EyeOff,
  Flag,
  GalleryVerticalEnd,
  Gamepad2,
  Info,
  KeyRound,
  Languages,
  ListChecks,
  ListOrdered,
  LogIn,
  LogOut,
  Mail,
  MailCheck,
  Minus,
  Moon,
  NotebookPen,
  Palette,
  PencilLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Sun,
  SquarePen,
  Type,
  Volume2,
  UserPlus,
  X,
  Bell,
} from "lucide-react";

const HINH = {
  // Luyện tập: quyển vở
  "luyen-tap": NotebookPen,
  "luyen-lai": NotebookPen,
  // Các cách luyện tập
  "the-ghi-nho": GalleryVerticalEnd,
  "trac-nghiem": ListChecks,
  "dien-tu": SquarePen,
  "sap-xep": ListOrdered,
  "chon-cau": CircleCheck,
  "chon-nghia": Languages,
  "tro-choi": Gamepad2,
  // Nghe phát âm (tab Phát âm)
  "nghe": Volume2,
  // Thông báo nhắc học (Cài đặt)
  "nhac-hoc": Bell,
  // Hiệu ứng pháo hoa (theme Đèn lồng đỏ)
  "phao-hoa": Sparkles,
  // Ô tìm kiếm (GĐ 12)
  "tim-kiem": Search,
  // Tập viết chữ Hán: cây bút
  "tap-viet": PencilLine,
  "xem-mau": Eye,
  // Trong một phiên luyện tập
  "kiem-tra": Check,
  "lat-the": RefreshCw,
  "da-nho": Check,
  "chua-nho": X,
  "tiep-theo": ArrowRight,
  "ket-qua": Flag,
  "lam-lai": RotateCcw,
  // Điều hướng
  "quay-lai": ArrowLeft,
  "xem-them": ChevronDown,
  "thu-gon": ChevronUp,
  "truoc": ChevronLeft,
  "sau": ChevronRight,
  "doi-khoa": ArrowLeftRight,
  "giam": Minus,
  "tang": Plus,
  // Đánh dấu đã học
  "da-hoc": BookmarkCheck,
  // Cài đặt và tài khoản
  "cai-dat": Settings,
  "furigana": Type,
  "co-chu": ALargeSmall,
  "giao-dien": Palette,
  "theme-sang": Sun,
  "theme-toi": Moon,
  "ung-dung": Info,
  "cap-nhat": RefreshCw,
  "dang-xuat": LogOut,
  // Tài khoản email + mật khẩu (GĐ 10)
  "dang-nhap": LogIn,
  "email": Mail,
  "tao-tai-khoan": UserPlus,
  "mat-khau": KeyRound,
  "hien-mat-khau": Eye,
  "an-mat-khau": EyeOff,
  "xac-minh": MailCheck,
};

/** Đổi cỡ px (tính ở cỡ chữ Vừa) ra rem, để hình to nhỏ theo thanh kéo cỡ chữ. */
const rem = (px) => `${px / 16}rem`;

/**
 * Một biểu tượng đơn sắc, cỡ theo chữ của nút.
 * @param {string} ten  Khoá trong bảng HINH
 * @param {number} co   Cỡ (px), mặc định 18
 */
export default function BieuTuong({ ten, co = 18, className = "" }) {
  const Hinh = HINH[ten];
  if (!Hinh) return null;
  return (
    <Hinh
      size={rem(co)}
      strokeWidth={1.8}
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    />
  );
}

/**
 * Bông hoa anh đào 5 cánh, một màu (currentColor). Dùng ở theme hoa anh đào
 * thay cho mặt trời mục tiêu.
 */
export function HoaAnhDao({ co = 24, className = "" }) {
  // Mỗi cánh là một hình giọt nước có khía ở đầu, xoay đều 72 độ quanh tâm
  const canh =
    "M12 12 C9.2 9.6 8.6 5.8 10.4 3.4 L12 4.6 L13.6 3.4 C15.4 5.8 14.8 9.6 12 12 Z";
  return (
    <svg
      viewBox="0 0 24 24"
      width={rem(co)}
      height={rem(co)}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {[0, 72, 144, 216, 288].map((goc) => (
        <path key={goc} d={canh} fill="currentColor" transform={`rotate(${goc} 12 12)`} />
      ))}
      {/* Nhuỵ hoa: chấm nhỏ màu nền cho nổi bông hoa */}
      <circle cx="12" cy="12" r="1.6" fill="var(--nen-noi)" />
    </svg>
  );
}

/**
 * Đèn lồng đỏ (theme Đèn lồng đỏ, quyết định 18.41): thay cho mặt trời mục tiêu
 * và dùng làm hình trang trí. Vẽ bằng currentColor như mọi biểu tượng khác.
 */
export function DenLong({ co = 24, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={rem(co)}
      height={rem(co)}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Quai treo phía trên và tua rua phía dưới */}
      <path
        d="M12 1.5 V3.2 M12 19.6 V22.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Nắp trên và đáy dưới */}
      <rect x="8.2" y="3" width="7.6" height="1.8" rx="0.9" fill="currentColor" />
      <rect x="8.2" y="18.2" width="7.6" height="1.8" rx="0.9" fill="currentColor" />
      {/* Thân đèn hình bầu */}
      <path
        d="M12 4.6 C17.2 4.6 19.4 7.6 19.4 11.5 C19.4 15.4 17.2 18.4 12 18.4 C6.8 18.4 4.6 15.4 4.6 11.5 C4.6 7.6 6.8 4.6 12 4.6 Z"
        fill="currentColor"
      />
      {/* Hai múi dọc bằng màu nền, cho ra dáng đèn lồng giấy */}
      <path
        d="M9.1 5.3 C7.6 7 7.1 9.2 7.1 11.5 C7.1 13.8 7.6 16 9.1 17.7 M14.9 5.3 C16.4 7 16.9 9.2 16.9 11.5 C16.9 13.8 16.4 16 14.9 17.7"
        stroke="var(--nen-noi)"
        strokeWidth="1"
        fill="none"
        opacity="0.75"
      />
    </svg>
  );
}

/** Hoa mai 5 cánh: dấu "đã học" ở theme Đèn lồng đỏ. */
export function HoaMai({ co = 16, className = "" }) {
  const canh = "M8 8 C6.2 6.3 5.9 3.6 7.3 2 C8.7 3.6 8.4 6.3 8 8 Z";
  return (
    <svg
      viewBox="0 0 16 16"
      width={rem(co)}
      height={rem(co)}
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {[0, 72, 144, 216, 288].map((goc) => (
        <path key={goc} d={canh} fill="currentColor" transform={`rotate(${goc} 8 8)`} />
      ))}
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** Một cánh hoa anh đào đơn, dùng cho dấu "đã học" ở theme hoa anh đào. */
export function CanhHoa({ co = 16, className = "" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={rem(co)}
      height={rem(co)}
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M8 15 C4 12.6 2.6 7.4 4.6 3.4 L6.4 4.8 L8 1.6 L9.6 4.8 L11.4 3.4 C13.4 7.4 12 12.6 8 15 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Logo chữ G của Google, ĐÚNG MÀU theo quy định thương hiệu của Google.
 * Đây là ngoại lệ duy nhất của quy tắc biểu tượng một màu (xem quyết định 18.5),
 * nên 4 mã màu dưới đây là màu của Google, không đưa vào tokens.css.
 */
export function LogoGoogle({ co = 18 }) {
  return (
    <svg viewBox="0 0 48 48" width={rem(co)} height={rem(co)} aria-hidden="true" focusable="false" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
