/* =============================================================================
   NGƯỜI DÙNG: ĐĂNG NHẬP, CÀI ĐẶT, TIẾN ĐỘ
   =============================================================================

   Một nơi duy nhất giữ trạng thái người dùng cho cả app. Màn hình nào cần thì
   gọi:  const nd = useNguoiDung();

   HAI CHẾ ĐỘ (theo quy tắc dự án):
     - Khách        : học được, KHÔNG lưu tiến độ, không mục tiêu, không ôn tập.
                      Cài đặt (furigana, giao diện) vẫn đổi được, lưu trên máy.
     - Đã đăng nhập : lưu cài đặt, "đã học", kết quả tập viết lên Firestore.

   GHI THEO LÔ: mỗi thay đổi chỉ nằm trong bộ nhớ và hàng chờ, rồi được ghi lên
   Firestore MỘT LẦN khi:
     - người dùng rời/ẩn trang (chuyển app, khoá máy, đóng tab)
     - đăng xuất
     - hàng chờ đã có từ 20 thay đổi
     - hoặc 30 giây sau thay đổi đầu tiên
   Cách này tiết kiệm lượt ghi của gói Spark và vẫn không mất nhiều nếu app bị
   đóng đột ngột.
   ============================================================================= */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { daCauHinhFirebase } from "../firebase/khoiTao.js";
import {
  dangNhapGoogle,
  dangXuatGoogle,
  theoDoiDangNhap,
} from "../firebase/dangNhap.js";
import { docTienDo, ghiLo } from "../firebase/luuTru.js";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import {
  apDungCaiDat,
  chuanHoaCaiDat,
  docCaiDatMay,
  luuCaiDatMay,
} from "./caiDat.js";

const SO_THAY_DOI_TOI_DA = 20;
const GIAY_CHO_TOI_DA = 30;

const BoiCanhNguoiDung = createContext(null);

export function useNguoiDung() {
  return useContext(BoiCanhNguoiDung);
}

const HANG_CHO_TRONG = () => ({ caiDat: null, daHoc: {}, tapViet: {} });

function homNay() {
  return new Date().toISOString().slice(0, 10);
}

export function NguoiDungProvider({ children }) {
  const hienThongBao = useThongBao();

  // "dang-kiem-tra" chỉ có khi đã cấu hình Firebase và đang chờ biết đã đăng
  // nhập chưa. Chưa cấu hình thì vào thẳng chế độ khách.
  const [trangThai, setTrangThai] = useState(
    daCauHinhFirebase ? "dang-kiem-tra" : "khach",
  );
  const [nguoi, setNguoi] = useState(null);
  const [caiDat, setCaiDat] = useState(docCaiDatMay);
  const [daHoc, setDaHoc] = useState({});
  const [tapViet, setTapViet] = useState({});

  // Bản sao trong ref để các hàm chạy sau (hẹn giờ, sự kiện) luôn thấy giá trị
  // mới nhất mà không phải tạo lại hàm
  const nguoiRef = useRef(null);
  const caiDatRef = useRef(caiDat);
  const tapVietRef = useRef(tapViet);
  const choGhi = useRef(HANG_CHO_TRONG());
  const sanSangGhi = useRef(false); // chỉ true sau khi đã tải xong tiến độ cũ
  const henGio = useRef(null);

  useEffect(() => {
    caiDatRef.current = caiDat;
  }, [caiDat]);
  useEffect(() => {
    tapVietRef.current = tapViet;
  }, [tapViet]);

  // ---------------------------------------------------------------------------
  // GHI THEO LÔ
  // ---------------------------------------------------------------------------
  const ghiLoNgay = useCallback(async () => {
    const uid = nguoiRef.current?.uid;
    if (!uid || !sanSangGhi.current) return;

    const lo = choGhi.current;
    const coGi =
      lo.caiDat ||
      Object.keys(lo.daHoc).length > 0 ||
      Object.keys(lo.tapViet).length > 0;
    if (!coGi) return;

    // Lấy lô ra khỏi hàng chờ trước khi ghi, thay đổi mới sẽ vào lô kế tiếp
    choGhi.current = HANG_CHO_TRONG();
    clearTimeout(henGio.current);
    henGio.current = null;

    try {
      await ghiLo(uid, lo);
    } catch {
      // Ghi hỏng: trả lô về hàng chờ (giữ giá trị MỚI hơn nếu có) để thử lại
      const moi = choGhi.current;
      choGhi.current = {
        caiDat: moi.caiDat ?? lo.caiDat,
        daHoc: { ...lo.daHoc, ...moi.daHoc },
        tapViet: mergeTapViet(lo.tapViet, moi.tapViet),
      };
      hienThongBao("Chưa lưu được tiến độ. Ứng dụng sẽ thử lại sau.");
      henGhi(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hienThongBao]);

  const henGhi = useCallback(
    (chiHenGio = false) => {
      const lo = choGhi.current;
      const dem =
        Object.keys(lo.daHoc).length +
        Object.keys(lo.tapViet).length +
        (lo.caiDat ? 1 : 0);
      if (!chiHenGio && dem >= SO_THAY_DOI_TOI_DA) {
        ghiLoNgay();
        return;
      }
      if (!henGio.current) {
        henGio.current = setTimeout(() => {
          henGio.current = null;
          ghiLoNgay();
        }, GIAY_CHO_TOI_DA * 1000);
      }
    },
    [ghiLoNgay],
  );

  // Rời hoặc ẩn trang thì ghi ngay phần đang chờ
  useEffect(() => {
    const khiAn = () => {
      if (document.visibilityState === "hidden") ghiLoNgay();
    };
    document.addEventListener("visibilitychange", khiAn);
    window.addEventListener("pagehide", ghiLoNgay);
    return () => {
      document.removeEventListener("visibilitychange", khiAn);
      window.removeEventListener("pagehide", ghiLoNgay);
    };
  }, [ghiLoNgay]);

  // ---------------------------------------------------------------------------
  // THEO DÕI ĐĂNG NHẬP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!daCauHinhFirebase) return undefined;

    return theoDoiDangNhap(async (n) => {
      if (!n) {
        nguoiRef.current = null;
        sanSangGhi.current = false;
        choGhi.current = HANG_CHO_TRONG();
        setNguoi(null);
        setDaHoc({});
        setTapViet({});
        setTrangThai("khach");
        return;
      }

      nguoiRef.current = n;
      setNguoi(n);
      try {
        const d = await docTienDo(n.uid);
        if (d.caiDat) {
          // Đã có cài đặt trên tài khoản thì dùng cài đặt đó cho mọi máy
          const c = chuanHoaCaiDat(d.caiDat);
          setCaiDat(c);
          luuCaiDatMay(c);
          apDungCaiDat(c);
        } else {
          // Lần đầu: đẩy cài đặt đang dùng trên máy lên tài khoản
          choGhi.current.caiDat = caiDatRef.current;
        }
        setDaHoc(d.daHoc);
        setTapViet(d.tapViet);
        sanSangGhi.current = true;
        if (choGhi.current.caiDat) henGhi(true);
      } catch {
        // Không đọc được tiến độ cũ thì KHÔNG ghi gì lên, kẻo ghi đè nhầm
        sanSangGhi.current = false;
        hienThongBao(
          "Không tải được tiến độ đã lưu, nên lúc này tiến độ sẽ chưa được lưu.",
          4,
        );
      }
      setTrangThai("da-dang-nhap");
    });
  }, [henGhi, hienThongBao]);

  // ---------------------------------------------------------------------------
  // HÀNH ĐỘNG CHO GIAO DIỆN
  // ---------------------------------------------------------------------------
  const dangNhap = useCallback(async () => {
    const kq = await dangNhapGoogle();
    if (!kq.thanhCong) hienThongBao(kq.thongBao, 4);
  }, [hienThongBao]);

  const dangXuat = useCallback(async () => {
    await ghiLoNgay(); // ghi nốt phần đang chờ trước khi thoát
    const kq = await dangXuatGoogle();
    if (!kq.thanhCong) hienThongBao(kq.thongBao);
  }, [ghiLoNgay, hienThongBao]);

  const doiCaiDat = useCallback(
    (khoa, giaTri) => {
      const moi = chuanHoaCaiDat({ ...caiDatRef.current, [khoa]: giaTri });
      caiDatRef.current = moi;
      setCaiDat(moi);
      luuCaiDatMay(moi);
      apDungCaiDat(moi);
      if (nguoiRef.current && sanSangGhi.current) {
        choGhi.current.caiDat = moi;
        henGhi();
      }
    },
    [henGhi],
  );

  const danhDauDaHoc = useCallback(
    (id, daHocRoi) => {
      // Chế độ khách không lưu tiến độ
      if (!nguoiRef.current) return;
      setDaHoc((truoc) => ({ ...truoc, [id]: daHocRoi }));
      if (sanSangGhi.current) {
        choGhi.current.daHoc[id] = daHocRoi;
        henGhi();
      }
    },
    [henGhi],
  );

  /** Ghi nhận một lần tập viết hoàn thành. `bo` là "trung" hoặc "nhat". */
  const ghiTapViet = useCallback(
    (id, bo, soSai) => {
      if (!nguoiRef.current) return;
      const cu = tapVietRef.current[id]?.[bo] ?? { soLan: 0, tongSai: 0 };
      const moi = {
        soLan: cu.soLan + 1,
        tongSai: cu.tongSai + soSai,
        lanCuoiSai: soSai,
        lanCuoi: homNay(),
      };
      setTapViet((truoc) => ({
        ...truoc,
        [id]: { ...truoc[id], [bo]: moi },
      }));
      if (sanSangGhi.current) {
        choGhi.current.tapViet[id] = { ...choGhi.current.tapViet[id], [bo]: moi };
        henGhi();
      }
    },
    [henGhi],
  );

  const giaTri = useMemo(
    () => ({
      trangThai,
      nguoi,
      daDangNhap: trangThai === "da-dang-nhap",
      coTheDangNhap: daCauHinhFirebase,
      caiDat,
      daHoc,
      tapViet,
      dangNhap,
      dangXuat,
      doiCaiDat,
      danhDauDaHoc,
      ghiTapViet,
    }),
    [
      trangThai,
      nguoi,
      caiDat,
      daHoc,
      tapViet,
      dangNhap,
      dangXuat,
      doiCaiDat,
      danhDauDaHoc,
      ghiTapViet,
    ],
  );

  return (
    <BoiCanhNguoiDung.Provider value={giaTri}>
      {children}
    </BoiCanhNguoiDung.Provider>
  );
}

/** Gộp hai lô tập viết: cùng một chữ thì phần mới ghi đè phần cũ theo từng bộ. */
function mergeTapViet(cu, moi) {
  const ra = { ...cu };
  for (const [id, cacBo] of Object.entries(moi)) {
    ra[id] = { ...ra[id], ...cacBo };
  }
  return ra;
}
