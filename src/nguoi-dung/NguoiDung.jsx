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
import { docTienDo, ghiLo } from "../firebase/luuTru.js";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import {
  apDungCaiDat,
  chuanHoaCaiDat,
  docCaiDatMay,
  luuCaiDatMay,
} from "./caiDat.js";
import {
  NGAY_TRONG,
  XOA,
  chuanHoaMucTieu,
  chuoiNgay,
  daLamTrongNgay,
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
  mucTieu: null,
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
    (lo.mucTieu ? 1 : 0) +
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
  const [caiDat, setCaiDat] = useState(docCaiDatMay);
  const [daHoc, setDaHoc] = useState({});
  const [tapViet, setTapViet] = useState({});
  const [mucTieu, setMucTieu] = useState(() => chuanHoaMucTieu(null));
  const [nhatKy, setNhatKy] = useState({});
  const [chuoi, setChuoi] = useState(null);
  // Tăng lên mỗi lần vừa đạt mục tiêu, để thanh trên chạy hiệu ứng mặt trời
  const [lanVuaDat, setLanVuaDat] = useState(0);

  // Bản sao trong ref để các hàm chạy sau (hẹn giờ, sự kiện) luôn thấy giá trị
  // mới nhất mà không phải tạo lại hàm
  const nguoiRef = useRef(null);
  const caiDatRef = useRef(caiDat);
  const tapVietRef = useRef(tapViet);
  const mucTieuRef = useRef(mucTieu);
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
        mucTieu: moi.mucTieu ?? lo.mucTieu,
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

    return theoDoiDangNhap(async (n) => {
      if (!n) {
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

        const mt = chuanHoaMucTieu(d.mucTieu);
        mucTieuRef.current = mt;
        setMucTieu(mt);
        chuoiRef.current = d.chuoi;
        setChuoi(d.chuoi);

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

      const mt = mucTieuRef.current;
      let cho = giayCho;
      if (!ngay.dat && daLamTrongNgay(ngay, mt.loai) >= mt.soLuong) {
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

  /** Đổi mục tiêu ngày. Đổi xong mà đã đủ số thì tính là đạt luôn. */
  const doiMucTieu = useCallback(
    (moi) => {
      if (!nguoiRef.current) return;
      const mt = chuanHoaMucTieu(moi);
      mucTieuRef.current = mt;
      setMucTieu(mt);
      if (sanSangGhi.current) {
        choGhi.current.mucTieu = mt;
        henGhi();
      }
      suaHomNay(() => {});
    },
    [henGhi, suaHomNay],
  );

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
  const daLam = daLamTrongNgay(ngayHomNay, mucTieu.loai);
  const datHomNay = Boolean(ngayHomNay?.dat);
  const doDai = doDaiChuoi(chuoi, homNay);
  const tienDoHomNay = useMemo(
    () => ({
      loai: mucTieu.loai,
      mucTieu: mucTieu.soLuong,
      daLam,
      dat: datHomNay,
      chuoi: doDai,
    }),
    [mucTieu, daLam, datHomNay, doDai],
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
      ghiKetQua,
      mucTieu,
      doiMucTieu,
      nhatKy,
      tienDoHomNay,
      lanVuaDat,
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
      ghiKetQua,
      mucTieu,
      doiMucTieu,
      nhatKy,
      tienDoHomNay,
      lanVuaDat,
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
