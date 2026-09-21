/* =============================================================================
   KHỞI TẠO FIREBASE
   =============================================================================

   Đọc cấu hình từ file .env (xem .env.example) và tạo kết nối tới Firebase.

   Hai điều đáng biết:

   1. NẾU CHƯA CÓ CẤU HÌNH thì app vẫn chạy bình thường ở chế độ khách, chỉ là
      nút đăng nhập báo "chưa sẵn sàng". Nhờ vậy làm việc trên máy chưa có
      Firebase vẫn không bị vỡ app.

   2. Thư viện Firebase khá nặng, nên chỉ nạp khi thật sự cần (dùng import()
      động). Người dùng ở chế độ khách không phải tải nó.

   Gói Spark (miễn phí). Chỉ dùng: Authentication (Google), Firestore, Hosting.
   ============================================================================= */

const cauHinh = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** true khi đã điền đủ các giá trị bắt buộc trong .env */
export const daCauHinhFirebase = Boolean(
  cauHinh.apiKey && cauHinh.authDomain && cauHinh.projectId && cauHinh.appId,
);

// Lưu lời hứa (promise) để nhiều nơi cùng xin thì chỉ khởi tạo một lần
let loiHua = null;

/**
 * Lấy các dịch vụ Firebase đã khởi tạo.
 * @returns {Promise<{auth: import("firebase/auth").Auth, db: import("firebase/firestore").Firestore}>}
 */
export function layDichVu() {
  if (!daCauHinhFirebase) {
    return Promise.reject(new Error("chua-cau-hinh"));
  }
  if (!loiHua) {
    loiHua = (async () => {
      const [{ initializeApp }, { getAuth }, { getFirestore }] =
        await Promise.all([
          import("firebase/app"),
          import("firebase/auth"),
          import("firebase/firestore"),
        ]);
      const app = initializeApp(cauHinh);
      return { auth: getAuth(app), db: getFirestore(app) };
    })();
    // Khởi tạo hỏng thì bỏ đi để lần sau thử lại được
    loiHua.catch(() => {
      loiHua = null;
    });
  }
  return loiHua;
}
