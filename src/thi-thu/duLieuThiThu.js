/* =============================================================================
   THI THỬ HSK — DỮ LIỆU, BÀI LÀM DỞ, CHẤM ĐIỂM (quyết định 18.59)
   =============================================================================

   Đề nằm ở public/du-lieu/thi-thu/<MÃ>/ (de.json, hinh/, nghe.mp3), do công cụ
   cong-cu/dung-de-thi.py dựng từ PDF + MP3 gốc. Danh sách đề ở
   public/du-lieu/thi-thu/danh-sach.json.

   Bài đang làm dở lưu trên MÁY (localStorage), để tải lại trang hay thoát ra
   vẫn làm tiếp được: đáp án đã chọn, đang ở trang nào, đã nghe xong chưa, lúc
   bắt đầu phần Đọc (để tính giờ). Chưa nghe xong mà thoát ra thì lần sau nghe
   lại từ đầu (quyết định 18.60). Nộp xong mới lưu điểm lên
   tài khoản (ketQuaThiThu.js).
   ============================================================================= */

const GOC = `${import.meta.env.BASE_URL}du-lieu/thi-thu/`;

/** Đường dẫn một file của đề (ảnh, file nghe). */
export function duongDan(ma, tep) {
  return `${GOC}${ma}/${tep}`;
}

export async function taiDanhSachDe() {
  const r = await fetch(`${GOC}danh-sach.json`, { cache: "no-cache" });
  if (!r.ok) throw new Error("khong-tai-duoc");
  return (await r.json()).de;
}

export async function taiDe(ma, version) {
  const r = await fetch(`${GOC}${ma}/de.json?v=${version}`);
  if (!r.ok) throw new Error("khong-tai-duoc");
  return r.json();
}

/* -----------------------------------------------------------------------------
   Bài làm dở trên máy
   ----------------------------------------------------------------------------- */
const khoa = (ma) => `riyi-thi-thu-${ma}`;

/**
 * trang: 0 = Nghe, 1 = Đọc
 * nghe: { daBatDau, xong } (không lưu vị trí: mở lại thì nghe lại từ đầu)
 * docBatDau: thời điểm (ms) vào phần Đọc lần đầu, để đếm ngược
 * ketQua: có khi đã nộp
 */
export function baiLamMoi() {
  return {
    trang: 0,
    traLoi: {},
    nghe: { daBatDau: false, xong: false },
    docBatDau: null,
    ketQua: null,
  };
}

export function docBaiLam(ma) {
  try {
    const gt = JSON.parse(localStorage.getItem(khoa(ma)));
    return gt && typeof gt === "object" ? { ...baiLamMoi(), ...gt } : null;
  } catch {
    return null;
  }
}

export function ghiBaiLam(ma, bai) {
  try {
    localStorage.setItem(khoa(ma), JSON.stringify(bai));
  } catch {
    // Bộ nhớ bị chặn: vẫn làm bài được, chỉ là tải lại trang thì mất
  }
}

export function xoaBaiLam(ma) {
  try {
    localStorage.removeItem(khoa(ma));
  } catch {
    // bỏ qua
  }
}

/* -----------------------------------------------------------------------------
   Chấm điểm theo thang HSK: mỗi câu đúng được `diemMoiCau` (HSK 1: 5 điểm,
   mỗi phần 20 câu = 100 điểm, cả đề 200), đạt khi tổng ≥ `diemDat` (HSK 1: 120)
   ----------------------------------------------------------------------------- */
export function chamDiem(de, traLoi) {
  const ra = { phan: {}, tong: 0 };
  for (const phan of de.phan) {
    let dung = 0;
    let soCau = 0;
    for (const nhom of phan.nhom) {
      for (const cau of nhom.cau) {
        soCau += 1;
        if (traLoi[cau.so] === cau.dapAn) dung += 1;
      }
    }
    const diem = dung * de.diemMoiCau;
    ra.phan[phan.ma] = { dung, soCau, diem, diemToiDa: soCau * de.diemMoiCau };
    ra.tong += diem;
  }
  ra.tongToiDa = Object.values(ra.phan).reduce((t, p) => t + p.diemToiDa, 0);
  ra.dat = ra.tong >= de.diemDat;
  return ra;
}

/** Số câu chưa trả lời trong một phần. */
export function soCauBoTrong(phan, traLoi) {
  return phan.nhom.reduce((t, n) => t + n.cau.filter((c) => traLoi[c.so] == null).length, 0);
}
