/* =============================================================================
   NGƯỜI DÙNG: ĐĂNG NHẬP, CÀI ĐẶT, TIẾN ĐỘ
   =============================================================================

   Một nơi duy nhất giữ trạng thái người dùng cho cả app. Màn hình nào cần thì
   gọi:  const nd = useNguoiDung();

   HAI CHẾ ĐỘ (theo quy tắc dự án):
     - Khách        : học được, KHÔNG lưu tiến độ, không mục tiêu, không ôn tập.
                      Cài đặt (furigana, giao diện) vẫn đổi được, lưu trên máy.
     - Đã đăng nhập : lưu cài đặt, "đã học", kết quả tập viết, mục tiêu ngày,
                      nhật ký học (đúng/sai, số phút) lên Firestore.

   GHI THEO LÔ: mỗi thay đổi chỉ nằm trong bộ nhớ và hàng chờ, rồi được ghi lên
   Firestore MỘT LẦN khi:
     - người dùng rời/ẩn trang (chuyển app, khoá máy, đóng tab)
     - đăng xuất
     - hàng chờ đã có từ 20 thay đổi
     - hoặc 30 giây sau thay đổi đầu tiên
   Cách này tiết kiệm lượt ghi của gói Spark và vẫn không mất nhiều nếu app bị
   đóng đột ngột.

   ĐẾM PHÚT HỌC: chỉ đếm khi app đang hiện trên màn hình VÀ người dùng có chạm,
   bấm hoặc cuộn trong 2 phút gần nhất. Để app mở rồi bỏ đi thì không tính.
   Riêng thay đổi số phút được ghi chậm hơn (5 phút một lần), vì nó thay đổi
   liên tục.
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
import { docTenDaNho, nhoTen, quenTen } from "./nhoDangNhap.js";
import { kiemTraDaXacMinh, taoTaiKhoan } from "../firebase/taiKhoanEmail.js";
import { docTienDo, ghiLo } from "../firebase/luuTru.js";
import { taiLoTrinh } from "../du-lieu/taiDuLieu.js";
import {
  TONG_BUOC,
  chuyenNgay,
  datMucTieuCap,
  hocTruocBaiSau,
  mucCuaPhan,
  phanCuaBuoc,
  phanDaXong,
  taoMuc,
} from "../luyen-tap/baiHoc.js";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import {
  apDungCaiDat,
  chuanHoaCaiDat,
  docCaiDatMay,
  luuCaiDatMay,
} from "./caiDat.js";
import {
  LO_TRINH_BAN_DAU,
  NGAY_TRONG,
  XOA,
  chuanHoaLoTrinh,
  chuoiNgay,
  doDaiChuoi,
  ngayCanDon,
  noiChuoi,
} from "./nhatKy.js";

const SO_THAY_DOI_TOI_DA = 20;
const GIAY_CHO_TOI_DA = 30;
const GIAY_CHO_GHI_PHUT = 5 * 60;

// Đếm phút học
const NHIP_DEM_GIAY = 15; // cứ 15 giây kiểm tra một lần
const GIAY_COI_LA_DANG_HOC = 120; // có thao tác trong 2 phút gần nhất

const BoiCanhNguoiDung = createContext(null);

export function useNguoiDung() {
  return useContext(BoiCanhNguoiDung);
}

const HANG_CHO_TRONG = () => ({
  caiDat: null,
  daHoc: {},
  tapViet: {},
  loTrinh: null,
  chuoi: null,
  nhatKy: {},
});

/** Số thay đổi đang chờ ghi. */
function demThayDoi(lo) {
  return (
    Object.keys(lo.daHoc).length +
    Object.keys(lo.tapViet).length +
    Object.keys(lo.nhatKy).length +
    (lo.caiDat ? 1 : 0) +
    (lo.loTrinh ? 1 : 0) +
    (lo.chuoi ? 1 : 0)
  );
}

export function NguoiDungProvider({ children }) {
  const hienThongBao = useThongBao();

  // "dang-kiem-tra" chỉ có khi đã cấu hình Firebase và đang chờ biết đã đăng
  // nhập chưa. Chưa cấu hình thì vào thẳng chế độ khách.
  const [trangThai, setTrangThai] = useState(
    daCauHinhFirebase ? "dang-kiem-tra" : "khach",
  );
  const [nguoi, setNguoi] = useState(null);
  // Tên người đăng nhập lần trước trên máy (xem nhoDangNhap.js). Dùng để chào
  // ngay lúc mở app, trong khi Firebase còn đang kiểm tra phiên đăng nhập.
  const [tenDaNho] = useState(docTenDaNho);
  // Tên người vừa gõ ở màn tạo tài khoản. Firebase báo "đã đăng nhập" ngay khi
  // tạo xong, TRƯỚC khi kịp lưu tên hiển thị, nên giữ tạm tên ở đây để dùng.
  const tenVuaTao = useRef("");
  const [caiDat, setCaiDat] = useState(docCaiDatMay);
  const [daHoc, setDaHoc] = useState({});
  const [tapViet, setTapViet] = useState({});
  const [loTrinh, setLoTrinh] = useState(LO_TRINH_BAN_DAU);
  // Lộ trình bài học (lo-trinh.json) và ngày hôm nay (đổi khi qua nửa đêm)
  const [duongLoTrinh, setDuongLoTrinh] = useState(null);
  const [ngayHienTai, setNgayHienTai] = useState(chuoiNgay);
  const [nhatKy, setNhatKy] = useState({});
  const [chuoi, setChuoi] = useState(null);
  // Thông báo nhắc học đang bật hay tắt (quyết định 18.40)
  const [thongBaoBat, setThongBaoBat] = useState(false);
  // Tăng lên mỗi lần vừa đạt mục tiêu, để thanh trên chạy hiệu ứng mặt trời
  const [lanVuaDat, setLanVuaDat] = useState(0);

  // Bản sao trong ref để các hàm chạy sau (hẹn giờ, sự kiện) luôn thấy giá trị
  // mới nhất mà không phải tạo lại hàm
  const nguoiRef = useRef(null);
  const caiDatRef = useRef(caiDat);
  const tapVietRef = useRef(tapViet);
  const loTrinhRef = useRef(loTrinh);
  const nhatKyRef = useRef(nhatKy);
  const chuoiRef = useRef(chuoi);
  const choGhi = useRef(HANG_CHO_TRONG());
  const sanSangGhi = useRef(false); // chỉ true sau khi đã tải xong tiến độ cũ
  const henGio = useRef(null);
  const henGioLuc = useRef(0); // thời điểm hẹn giờ ghi sẽ chạy

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
    if (demThayDoi(lo) === 0) return;

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
        loTrinh: moi.loTrinh ?? lo.loTrinh,
        chuoi: moi.chuoi ?? lo.chuoi,
        // Mỗi ngày lưu cả bản ghi đầy đủ, nên bản mới hơn thay hẳn bản cũ
        nhatKy: { ...lo.nhatKy, ...moi.nhatKy },
      };
      hienThongBao("Chưa lưu được tiến độ. Ứng dụng sẽ thử lại sau.");
      henGhi(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hienThongBao]);

  const henGhi = useCallback(
    (chiHenGio = false, giayCho = GIAY_CHO_TOI_DA) => {
      if (!chiHenGio && demThayDoi(choGhi.current) >= SO_THAY_DOI_TOI_DA) {
        ghiLoNgay();
        return;
      }
      // Đã có hẹn giờ chạy sớm hơn thì giữ nguyên, muộn hơn thì hẹn lại sớm hơn
      const luc = Date.now() + giayCho * 1000;
      if (henGio.current && henGioLuc.current <= luc) return;
      clearTimeout(henGio.current);
      henGioLuc.current = luc;
      henGio.current = setTimeout(() => {
        henGio.current = null;
        ghiLoNgay();
      }, giayCho * 1000);
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

    return theoDoiDangNhap(async (n, khongKiemTraDuoc) => {
      if (!n) {
        // Chỉ quên tên khi Firebase báo đã đăng xuất thật, không quên khi lỗi mạng
        if (!khongKiemTraDuoc) quenTen();
        nguoiRef.current = null;
        sanSangGhi.current = false;
        choGhi.current = HANG_CHO_TRONG();
        setNguoi(null);
        setDaHoc({});
        setTapViet({});
        nhatKyRef.current = {};
        setNhatKy({});
        chuoiRef.current = null;
        setChuoi(null);
        setThongBaoBat(false);
        loTrinhRef.current = LO_TRINH_BAN_DAU;
        setLoTrinh(LO_TRINH_BAN_DAU);
        setTrangThai("khach");
        return;
      }

      if (!n.ten && tenVuaTao.current) n = { ...n, ten: tenVuaTao.current };
      nguoiRef.current = n;
      setNguoi(n);
      nhoTen(n.ten || n.email);
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

        const lt = chuanHoaLoTrinh(d.loTrinh);
        loTrinhRef.current = lt;
        setLoTrinh(lt);
        chuoiRef.current = d.chuoi;
        setChuoi(d.chuoi);
        setThongBaoBat(Boolean(d.thongBaoBat));

        // Dọn nhật ký quá cũ cho tài liệu khỏi phình
        const nk = { ...d.nhatKy };
        for (const ngay of ngayCanDon(nk, chuoiNgay())) {
          delete nk[ngay];
          choGhi.current.nhatKy[ngay] = XOA;
        }
        nhatKyRef.current = nk;
        setNhatKy(nk);

        sanSangGhi.current = true;
        if (demThayDoi(choGhi.current) > 0) henGhi(true);
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

  // --- Tài khoản email + mật khẩu (GĐ 10) ---
  const taoTaiKhoanEmail = useCallback(async (duLieu) => {
    tenVuaTao.current = duLieu.ten.trim();
    const kq = await taoTaiKhoan(duLieu);
    if (kq.thanhCong) {
      // Tên đã lưu lên Firebase: cập nhật người đang dùng cho chắc
      setNguoi((n) => (n ? { ...n, ten: kq.ten } : n));
      nhoTen(kq.ten);
    }
    tenVuaTao.current = kq.thanhCong ? kq.ten : "";
    return kq;
  }, []);

  /** Hỏi lại Firebase xem email đã được xác minh chưa, rồi cập nhật giao diện. */
  const xemLaiXacMinh = useCallback(async () => {
    const da = await kiemTraDaXacMinh();
    if (da) setNguoi((n) => (n ? { ...n, daXacMinh: true } : n));
    return da;
  }, []);

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

  /** Đánh dấu nhiều mục "đã học" một lần (khi xong một phần của bài hôm nay). */
  const danhDauNhieu = useCallback(
    (ids) => {
      if (!nguoiRef.current || ids.length === 0) return;
      setDaHoc((truoc) => ({ ...truoc, ...Object.fromEntries(ids.map((id) => [id, true])) }));
      if (sanSangGhi.current) {
        for (const id of ids) choGhi.current.daHoc[id] = true;
        henGhi(true, 10);
      }
    },
    [henGhi],
  );

  /**
   * Sửa bản ghi của hôm nay trong nhật ký, rồi kiểm tra đã đạt mục tiêu chưa.
   * `sua` nhận bản sao của ngày hôm nay và sửa trực tiếp vào đó.
   * `giayCho` = sau bao lâu thì ghi lên Firestore.
   */
  const suaHomNay = useCallback(
    (sua, giayCho = GIAY_CHO_TOI_DA) => {
      const homNay = chuoiNgay();
      const cu = nhatKyRef.current[homNay] ?? NGAY_TRONG();
      const ngay = { ...cu, dung: { ...cu.dung }, sai: { ...cu.sai } };
      sua(ngay);

      let cho = giayCho;
      // Mục tiêu ngày (GĐ 10): học xong ít nhất một bài trong ngày
      if (!ngay.dat && ngay.baiXong?.length > 0) {
        ngay.dat = true;
        const c = noiChuoi(chuoiRef.current, homNay);
        chuoiRef.current = c;
        setChuoi(c);
        if (sanSangGhi.current) choGhi.current.chuoi = c;
        setLanVuaDat((n) => n + 1);
        cho = GIAY_CHO_TOI_DA; // vừa đạt mục tiêu thì ghi sớm
      }

      nhatKyRef.current = { ...nhatKyRef.current, [homNay]: ngay };
      setNhatKy(nhatKyRef.current);
      if (sanSangGhi.current) {
        choGhi.current.nhatKy[homNay] = ngay;
        // Chỉ cộng phút học thì chỉ hẹn giờ, không tính vào ngưỡng 20 thay đổi
        henGhi(cho !== GIAY_CHO_TOI_DA, cho);
      }
    },
    [henGhi],
  );

  /**
   * Ghi nhận một câu trả lời trong phần luyện tập.
   * Chỉ trả lời ĐÚNG mới tính vào mục tiêu. Câu SAI được đếm để đưa vào Review.
   * Chế độ khách không lưu gì.
   */
  const ghiKetQua = useCallback(
    (id, dung) => {
      if (!nguoiRef.current) return;
      suaHomNay((ngay) => {
        const bang = dung ? ngay.dung : ngay.sai;
        bang[id] = (bang[id] ?? 0) + 1;
      });
    },
    [suaHomNay],
  );

  /** Đổi tiến độ bài học và hẹn ghi lên Firestore. */
  const datLoTrinh = useCallback(
    (moi) => {
      loTrinhRef.current = moi;
      setLoTrinh(moi);
      if (sanSangGhi.current) {
        choGhi.current.loTrinh = moi;
        henGhi(true, 10); // tiến độ bài học: ghi sớm cho khỏi mất
      }
    },
    [henGhi],
  );

  /**
   * Đánh dấu một bước của bài hôm nay là XONG (GĐ 10, quyết định 18.26).
   *  - Xong hết các bước của một PHẦN thì mọi mục của phần đó được đánh dấu
   *    "đã học" (tính vào % ở tab và viền nét đứt trong danh sách).
   *  - Xong hết 8 bước thì đạt mục tiêu ngày. Bài KHÔNG tự sang bài mới: bài
   *    mới đến khi sang ngày (xem chuyenNgay trong baiHoc.js), hoặc khi người
   *    dùng bấm "Học trước bài tiếp theo".
   */
  const hoanThanhBuoc = useCallback(
    (maBuoc) => {
      if (!nguoiRef.current) return;
      const lt = loTrinhRef.current;
      if (lt.buoc.includes(maBuoc)) return;
      const buoc = [...lt.buoc, maBuoc];
      const phan = phanCuaBuoc(maBuoc);
      if (phan && phanDaXong(phan, buoc)) danhDauNhieu(mucCuaPhan(lt.muc, phan.ma));
      if (buoc.length >= TONG_BUOC) {
        suaHomNay((ngay) => {
          ngay.baiXong = [...(ngay.baiXong ?? []), lt.bai];
        });
      }
      datLoTrinh({ ...lt, buoc });
    },
    [danhDauNhieu, datLoTrinh, suaHomNay],
  );

  /** Học trước bài tiếp theo, chỉ khi đã xong hết bài hôm nay. */
  const hocTruoc = useCallback(() => {
    const lt = loTrinhRef.current;
    if (!nguoiRef.current || !duongLoTrinh || lt.buoc.length < TONG_BUOC) return;
    datLoTrinh(hocTruocBaiSau(lt, duongLoTrinh));
  }, [datLoTrinh, duongLoTrinh]);

  /**
   * Đổi mục tiêu đang hướng đến sang cấp HSK khác (GĐ 12, quyết định 18.42):
   * nhảy lộ trình tới bài đầu tiên của cấp đó. Trả về true nếu đổi được, để
   * màn hình biết mà hiện thông báo phù hợp.
   */
  const datMucTieu = useCallback(
    (capHsk) => {
      if (!nguoiRef.current || !duongLoTrinh) return false;
      const lt = loTrinhRef.current;
      const moi = datMucTieuCap(lt, duongLoTrinh, capHsk);
      if (moi === lt) return false;
      datLoTrinh(moi);
      return true;
    },
    [datLoTrinh, duongLoTrinh],
  );

  // ---------------------------------------------------------------------------
  // LỘ TRÌNH BÀI HỌC VÀ LUẬT SANG NGÀY
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let conSong = true;
    taiLoTrinh()
      .then((d) => conSong && setDuongLoTrinh(d))
      .catch(() => {});
    return () => {
      conSong = false;
    };
  }, []);

  // Mở lại app hoặc để app mở qua nửa đêm: cập nhật "hôm nay"
  useEffect(() => {
    const kiemTra = () => setNgayHienTai(chuoiNgay());
    const hen = setInterval(kiemTra, 60 * 1000);
    document.addEventListener("visibilitychange", kiemTra);
    return () => {
      clearInterval(hen);
      document.removeEventListener("visibilitychange", kiemTra);
    };
  }, []);

  // Sang ngày mới (hoặc lần đầu có tiến độ): giao bài theo luật trong baiHoc.js
  useEffect(() => {
    if (trangThai !== "da-dang-nhap" || !duongLoTrinh) return;
    const lt = loTrinhRef.current;
    const moi = chuyenNgay(lt, duongLoTrinh, ngayHienTai);
    if (moi === lt) return;
    const { laDuLieuCu, ...luu } = moi;
    // Tiến độ dạng cũ: coi mọi mục của các bài trước là đã học
    if (laDuLieuCu && luu.bai > 1) {
      const ids = [];
      for (let b = 1; b < luu.bai; b += 1) {
        const m = taoMuc(duongLoTrinh, b);
        if (m) ids.push(...m.chu, ...m.tu, ...m.np);
      }
      danhDauNhieu([...new Set(ids)]);
    }
    datLoTrinh(luu);
  }, [trangThai, duongLoTrinh, ngayHienTai, loTrinh, datLoTrinh, danhDauNhieu]);

  // ---------------------------------------------------------------------------
  // ĐẾM PHÚT HỌC
  // ---------------------------------------------------------------------------
  const dangNhapRoi = trangThai === "da-dang-nhap";
  useEffect(() => {
    if (!dangNhapRoi) return undefined;

    let lanThaoTacCuoi = Date.now();
    const khiThaoTac = () => {
      lanThaoTacCuoi = Date.now();
    };
    const suKien = ["pointerdown", "keydown", "scroll", "touchstart"];
    for (const ten of suKien) {
      window.addEventListener(ten, khiThaoTac, { passive: true, capture: true });
    }

    const nhip = setInterval(() => {
      const dangHien = document.visibilityState === "visible";
      const conHoc = Date.now() - lanThaoTacCuoi < GIAY_COI_LA_DANG_HOC * 1000;
      if (!dangHien || !conHoc) return;
      suaHomNay((ngay) => {
        ngay.giay = (ngay.giay ?? 0) + NHIP_DEM_GIAY;
      }, GIAY_CHO_GHI_PHUT);
    }, NHIP_DEM_GIAY * 1000);

    return () => {
      clearInterval(nhip);
      for (const ten of suKien) {
        window.removeEventListener(ten, khiThaoTac, { capture: true });
      }
    };
  }, [dangNhapRoi, suaHomNay]);

  /**
   * Ghi nhận một lần tập viết hoàn thành. `bo` là "trung" hoặc "nhat".
   * Viết xong mà KHÔNG cần gợi ý thì tính là làm đúng chữ đó, cần gợi ý thì
   * tính là sai (để chữ đó hiện trong Review).
   */
  const ghiTapViet = useCallback(
    (id, bo, soSai, canGoiY = false) => {
      if (!nguoiRef.current) return;
      ghiKetQua(id, !canGoiY);
      const cu = tapVietRef.current[id]?.[bo] ?? { soLan: 0, tongSai: 0 };
      const moi = {
        soLan: cu.soLan + 1,
        tongSai: cu.tongSai + soSai,
        lanCuoiSai: soSai,
        lanCuoi: chuoiNgay(),
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
    [ghiKetQua, henGhi],
  );

  // Tiến độ hôm nay, dùng cho thanh trên và tab Mục tiêu
  const homNay = chuoiNgay();
  const ngayHomNay = nhatKy[homNay];
  const datHomNay = Boolean(ngayHomNay?.dat);
  const doDai = doDaiChuoi(chuoi, homNay);
  const tienDoHomNay = useMemo(
    () => ({
      bai: loTrinh.bai,
      soBuocXong: loTrinh.buoc.length,
      dat: datHomNay,
      chuoi: doDai,
    }),
    [loTrinh, datHomNay, doDai],
  );

  const giaTri = useMemo(
    () => ({
      trangThai,
      nguoi,
      daDangNhap: trangThai === "da-dang-nhap",
      thongBaoBat,
      // Bật/tắt đã ghi thẳng lên Firestore, đây chỉ cập nhật lại màn hình
      doiThongBao: setThongBaoBat,
      // Đang chờ Firebase kiểm tra, và máy này có người đăng nhập lần trước:
      // nhiều khả năng sắp vào lại được, nên KHÔNG hiện nút đăng nhập.
      dangKhoiPhuc: trangThai === "dang-kiem-tra" && Boolean(tenDaNho),
      tenDaNho,
      coTheDangNhap: daCauHinhFirebase,
      caiDat,
      daHoc,
      tapViet,
      dangNhap,
      dangXuat,
      taoTaiKhoanEmail,
      xemLaiXacMinh,
      doiCaiDat,
      danhDauDaHoc,
      ghiTapViet,
      ghiKetQua,
      loTrinh,
      hoanThanhBuoc,
      hocTruoc,
      datMucTieu,
      duongLoTrinh,
      // Mã các mục của hôm nay. Khách (chưa có tiến độ) thì là bài 1.
      mucHomNay:
        loTrinh.muc ?? (duongLoTrinh ? taoMuc(duongLoTrinh, loTrinh.bai) : null),
      nhatKy,
      tienDoHomNay,
      lanVuaDat,
      // Ghi ngay phần tiến độ đang chờ (dùng trước khi tải lại trang để cập nhật)
      ghiNgay: ghiLoNgay,
    }),
    [
      trangThai,
      nguoi,
      tenDaNho,
      thongBaoBat,
      caiDat,
      daHoc,
      tapViet,
      dangNhap,
      dangXuat,
      taoTaiKhoanEmail,
      xemLaiXacMinh,
      doiCaiDat,
      danhDauDaHoc,
      ghiTapViet,
      ghiKetQua,
      loTrinh,
      hoanThanhBuoc,
      hocTruoc,
      datMucTieu,
      duongLoTrinh,
      nhatKy,
      tienDoHomNay,
      lanVuaDat,
      ghiLoNgay,
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
