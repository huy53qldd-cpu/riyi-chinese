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
    phu: {}, // trạng thái phụ từng câu (HSK 6 缩写: lúc bắt đầu đọc, đã ẩn bài)
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
   CHẤM ĐIỂM (quyết định 18.59, 18.61)
   - Mỗi phần Nghe / Đọc quy về thang 100 theo tỉ lệ câu đúng (HSK 1: 20 câu
     → mỗi câu 5 điểm, y như trước).
   - TỔNG ĐIỂM CHỈ TÍNH NGHE + ĐỌC (thang 200), đạt khi ≥ 120 (60%). Phần Viết
     (HSK 3–6) chấm riêng những câu chấm được (sắp xếp câu, điền chữ), KHÔNG
     cộng vào tổng; câu viết tự do không chấm.
   ----------------------------------------------------------------------------- */
const BO_DAU = /[\s，。？！、；：,.?!;:“”"'‘’…—《》（）()]/g;

/** Câu này có chấm tự động được không (viết tự do thì không). */
export function coCham(nhom, cau) {
  return cau.dapAn != null && !["viet-hinh", "viet-van", "viet-tom-tat"].includes(nhom.kieu);
}

/** Câu sắp xếp từ: các mảnh đã bấm ghép thành câu. */
export function cauDaXep(cau, gt) {
  return Array.isArray(gt) ? gt.map((i) => cau.manh[i]).join("") : "";
}

/** Câu trả lời có đúng không. */
export function traLoiDung(nhom, cau, gt) {
  if (gt == null || gt === "" || (Array.isArray(gt) && gt.length === 0)) return false;
  if (nhom.kieu === "sap-xep-tu") {
    if (gt.length !== cau.manh.length) return false;
    const xep = cauDaXep(cau, gt).replace(BO_DAU, "");
    return cau.dapAn.some((d) => d.replace(BO_DAU, "") === xep);
  }
  if (nhom.kieu === "dien-chu") return String(gt).trim() === cau.dapAn;
  return gt === cau.dapAn;
}

export function chamDiem(de, traLoi) {
  const ra = { phan: {}, tong: 0, tongToiDa: 0 };
  for (const phan of de.phan) {
    let dung = 0;
    let soCau = 0;
    let khongCham = 0;
    for (const nhom of phan.nhom) {
      for (const cau of nhom.cau) {
        if (!coCham(nhom, cau)) {
          khongCham += 1;
          continue;
        }
        soCau += 1;
        if (traLoiDung(nhom, cau, traLoi[cau.so])) dung += 1;
      }
    }
    const diem = soCau ? Math.round((dung / soCau) * 100) : 0;
    ra.phan[phan.ma] = { dung, soCau, khongCham, diem, diemToiDa: 100 };
    if (phan.ma === "nghe" || phan.ma === "doc") {
      ra.tong += diem;
      ra.tongToiDa += 100;
    }
  }
  ra.dat = ra.tong >= (de.diemDat ?? 120);
  return ra;
}

/** Số câu chưa làm trong một phần (kể cả câu viết). */
export function soCauBoTrong(phan, traLoi) {
  const trong = (gt) => gt == null || gt === "" || (Array.isArray(gt) && gt.length === 0);
  return phan.nhom.reduce((t, n) => t + n.cau.filter((c) => trong(traLoi[c.so])).length, 0);
}
