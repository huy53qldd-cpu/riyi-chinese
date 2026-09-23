/* =============================================================================
   BÀI HÔM NAY: CÁC PHẦN, CÁC BƯỚC, VÀ LUẬT SANG NGÀY (GĐ 10)
   Quyết định 18.17 – 18.20 và 18.24 – 18.27 trong QUYET-DINH-DA-CHOT.md
   =============================================================================

   Mỗi ngày một bài mới: 5 chữ Hán + 10 từ vựng + 3 điểm ngữ pháp, theo lộ
   trình dễ → khó (public/du-lieu/lo-trinh.json). Mỗi phần có các bước:

     Chữ Hán   : Tập viết → Trò chơi lật thẻ
     Từ vựng   : Thẻ ghi nhớ → Trắc nghiệm → Điền từ → Trò chơi lật thẻ
     Luyện nghe: Nghe rồi chọn âm / chọn thanh (quyết định 18.39), dùng lại
                 chính chữ Hán hôm nay nên KHÔNG có phần cộng thêm hôm sau
     Ngữ pháp  : Sắp xếp câu → Chọn câu đúng

   Mọi bước của một phần dùng ĐÚNG CÙNG danh sách mục của hôm nay (10 từ ở cả 4
   bước từ vựng là cùng 10 từ). Trả lời sai thì hỏi lại tới khi đúng. Xong đủ
   các bước của cả 3 phần mới đạt mục tiêu ngày.

   SANG NGÀY MỚI thì luôn sang bài mới, phần hôm qua còn thiếu bị "cộng thêm":
     - Chữ Hán chưa TẬP VIẾT   → hôm nay viết thêm 1 chữ của hôm qua
     - Chữ Hán chưa CHƠI XONG  → trò chơi hôm nay thêm 1 cặp (2 thẻ) là chữ hôm qua
     - Từ vựng chưa xong       → từ hôm qua dồn sang hôm nay (tối đa 20 từ/ngày)
     - Ngữ pháp chưa xong      → điểm hôm qua dồn sang hôm nay (tối đa 6 điểm/ngày)
   Nghỉ nhiều ngày liền thì khi mở app chỉ sang MỘT bài, không nhảy cóc bài.

   Tiến độ lưu trên Firestore, trường `loTrinh`:
     {
       bai: 7,                     // số bài hôm nay (tăng mãi; hết lộ trình thì quay vòng)
       ngay: "2026-09-22",         // ngày giao bài này
       buoc: ["tu-the", ...],      // các bước ĐÃ XONG hôm nay
       muc: {                      // mã các mục của hôm nay (đã gồm phần cộng thêm)
         chu: [...5],              //   5 chữ mới của bài
         chuViet: [...5 hoặc 6],   //   chữ phải tập viết
         chuGame: [...5 hoặc 6],   //   chữ trong trò chơi
         tu: [...10–20], np: [...3–6]
       },
       them: { chuViet: [], chuGame: [], tu: [], np: [] }   // riêng phần cộng thêm
     }
   ============================================================================= */

import { vanChuHan, vanTuVung } from "./capLatThe.js";
import { cauHoiNgheChoChu } from "./cauHoiNghe.jsx";
import {
  cauHoiChonCauDung,
  cauHoiDienTu,
  cauHoiNghiaTu,
  cauHoiSapXep,
  cauHoiTapViet,
  theGhiNhoTu,
} from "./taoCauHoi.jsx";
import { tronNgauNhien } from "./tienIch.js";

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

// Trần cho phần dồn từ hôm qua, để bỏ nhiều ngày liền không bị dồn mãi
const TOI_DA_TU = 20;
const TOI_DA_NGU_PHAP = 6;

const THEM_RONG = () => ({ chuViet: [], chuGame: [], tu: [], np: [] });

/** Phần (chu / tu / np) chứa một bước. */
export function phanCuaBuoc(maBuoc) {
  return CAC_PHAN.find((p) => p.buoc.some((b) => b.ma === maBuoc));
}

/** Phần đã xong hết các bước chưa. */
export function phanDaXong(phan, buocXong) {
  return phan.buoc.every((b) => buocXong.includes(b.ma));
}

/**
 * Bài thứ `bai` (từ 1) trong lộ trình. Học hết thì quay vòng về bài 1 để ôn,
 * `vong` cho biết đang ở vòng thứ mấy.
 */
export function layBai(duongLoTrinh, bai) {
  const n = duongLoTrinh?.baiHoc?.length ?? 0;
  if (n === 0) return null;
  return { ...duongLoTrinh.baiHoc[(bai - 1) % n], vong: Math.floor((bai - 1) / n) + 1 };
}

/** Mã các mục của hôm nay: mục của bài cộng với phần cộng thêm. */
export function taoMuc(duongLoTrinh, bai, them = THEM_RONG()) {
  const b = layBai(duongLoTrinh, bai);
  if (!b) return null;
  const hop = (a, t) => [...a, ...t.filter((x) => !a.includes(x))];
  const nguPhap = Array.isArray(b.nguPhap) ? b.nguPhap : [b.nguPhap];
  return {
    chu: b.chu,
    chuViet: hop(b.chu, them.chuViet),
    chuGame: hop(b.chu, them.chuGame),
    tu: hop(b.tu, them.tu).slice(0, TOI_DA_TU),
    np: hop(nguPhap, them.np).slice(0, TOI_DA_NGU_PHAP),
  };
}

/**
 * Luật sang ngày. Trả về tiến độ MỚI nếu phải đổi (lần đầu, dữ liệu cũ, hoặc
 * đã sang ngày mới), còn không thì trả về đúng đối tượng cũ.
 */
export function chuyenNgay(lt, duongLoTrinh, homNay) {
  if (!duongLoTrinh?.baiHoc?.length) return lt;
  if (lt.ngay === homNay && lt.muc) return lt;

  // Lần đầu dùng, hoặc tiến độ dạng cũ (chưa có ngày/mục): giao bài hiện tại
  if (!lt.ngay || !lt.muc) {
    return {
      bai: lt.bai,
      ngay: homNay,
      buoc: lt.buoc ?? [],
      muc: taoMuc(duongLoTrinh, lt.bai),
      them: THEM_RONG(),
      laDuLieuCu: !lt.ngay,
    };
  }

  // Sang ngày mới: bài tiếp theo + cộng thêm phần hôm qua còn thiếu
  const xong = lt.buoc ?? [];
  const cu = lt.muc;
  const them = THEM_RONG();
  const phan = Object.fromEntries(CAC_PHAN.map((p) => [p.ma, p]));
  // Chữ để phạt: chữ đầu tiên của hôm qua (phần chữ mới, không phải chữ đã phạt từ trước)
  const chuPhat = cu.chu?.[0];
  if (chuPhat && !xong.includes("chu-tap-viet")) them.chuViet = [chuPhat];
  if (chuPhat && !xong.includes("chu-lat-the")) them.chuGame = [chuPhat];
  if (!phanDaXong(phan.tu, xong)) them.tu = cu.tu ?? [];
  if (!phanDaXong(phan.np, xong)) them.np = cu.np ?? [];

  const bai = lt.bai + 1;
  return { bai, ngay: homNay, buoc: [], muc: taoMuc(duongLoTrinh, bai, them), them };
}

/** Học trước bài sau (khi đã xong hết bài hôm nay): không cộng thêm gì. */
export function hocTruocBaiSau(lt, duongLoTrinh) {
  const bai = lt.bai + 1;
  return { bai, ngay: lt.ngay, buoc: [], muc: taoMuc(duongLoTrinh, bai), them: THEM_RONG() };
}

/** Mã các mục thuộc một phần (để đánh dấu "đã học" khi xong phần đó). */
export function mucCuaPhan(muc, maPhan) {
  if (!muc) return [];
  if (maPhan === "chu") return [...new Set([...muc.chuViet, ...muc.chuGame])];
  if (maPhan === "tu") return muc.tu;
  // Luyện nghe dùng lại chính chữ Hán hôm nay nên không đánh dấu học thêm gì
  if (maPhan === "nghe") return [];
  return muc.np;
}

/**
 * Đổi mã mục thành dữ liệu đầy đủ.
 * @param du { chuHan: Map, tuVung: {map: Map, danhSach}, nguPhap: Map }
 */
export function noiDungTuMuc(muc, du, them = THEM_RONG()) {
  if (!muc || !du) return null;
  const lay = (ids, bang) => ids.map((id) => bang.get(id)).filter(Boolean);
  return {
    chu: lay(muc.chu, du.chuHan),
    chuViet: lay(muc.chuViet, du.chuHan),
    chuGame: lay(muc.chuGame, du.chuHan),
    tu: lay(muc.tu, du.tuVung.map),
    np: lay(muc.np, du.nguPhap),
    // Mục nào là phần cộng thêm từ hôm qua (để hiện nhãn "ôn thêm")
    them: new Set([...them.chuViet, ...them.chuGame, ...them.tu, ...them.np]),
  };
}

/** Tạo câu hỏi kèm hàm tạo lại (để hỏi lại khi sai). Không tạo được thì null. */
function coTaoLai(tao) {
  const cau = tao();
  return cau ? { ...cau, taoLai: tao } : null;
}

/** Danh sách câu hỏi (đã xáo) cho một bước không phải trò chơi. */
export function cauHoiChoBuoc(maBuoc, nd, du) {
  const tatCaTu = du.tuVung.danhSach;
  let ds = [];
  switch (maBuoc) {
    case "chu-tap-viet":
      ds = nd.chuViet.map((c) => coTaoLai(() => cauHoiTapViet(c)));
      break;
    case "tu-the":
      ds = nd.tu.map((t) => coTaoLai(() => theGhiNhoTu(t)));
      break;
    case "tu-trac-nghiem":
      ds = nd.tu.map((t) => coTaoLai(() => cauHoiNghiaTu(t, tatCaTu)));
      break;
    case "tu-dien-tu":
      ds = nd.tu.map((t) => coTaoLai(() => cauHoiDienTu(t, tatCaTu)));
      break;
    case "nghe-chon-am":
      // Luyện nghe: chữ hôm nay, mỗi chữ một câu chọn âm và một câu chọn thanh
      ds = cauHoiNgheChoChu(nd.chu).map((c) => ({ ...c, taoLai: () => c }));
      break;
    case "np-sap-xep":
      ds = nd.np.flatMap((d) => d.viDu.map((vd) => coTaoLai(() => cauHoiSapXep(d, vd))));
      break;
    case "np-chon-cau":
      ds = nd.np.flatMap((d) => d.canhBaoLoi.map((cb) => coTaoLai(() => cauHoiChonCauDung(d, cb))));
      break;
    default:
      ds = [];
  }
  return tronNgauNhien(ds.filter(Boolean));
}

/** Các ván trò chơi lật thẻ cho bước trò chơi (mọi mục của hôm nay đều có mặt). */
export function cacVanChoBuoc(maBuoc, nd) {
  return maBuoc === "chu-lat-the" ? vanChuHan(nd.chuGame) : vanTuVung(nd.tu);
}
