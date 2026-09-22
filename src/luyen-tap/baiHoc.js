/* =============================================================================
   BÀI HÔM NAY: CÁC PHẦN VÀ CÁC BƯỚC (GĐ 10, quyết định 18.17 – 18.20)
   =============================================================================

   Mỗi bài gồm 3 phần; mỗi phần làm lần lượt các bước. Xong hết 8 bước của cả
   3 phần thì bài được tính là học xong (đạt mục tiêu ngày).

     Chữ Hán  : Tập viết → Trò chơi lật thẻ
     Từ vựng  : Thẻ ghi nhớ → Trắc nghiệm → Điền từ → Trò chơi lật thẻ
     Ngữ pháp : Sắp xếp câu → Chọn câu đúng

   Mỗi bước chỉ dùng các mục của bài hôm nay. Trả lời sai thì mục đó được hỏi
   lại ở cuối lượt cho tới khi đúng (câu hỏi mang hàm `taoLai`, xem
   PhienLuyenTap.jsx). Nội dung bài lấy từ public/du-lieu/lo-trinh.json.
   ============================================================================= */

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
    ma: "np",
    nhan: "Ngữ pháp",
    buoc: [
      { ma: "np-sap-xep", nhan: "Sắp xếp câu", bieuTuong: "sap-xep" },
      { ma: "np-chon-cau", nhan: "Chọn câu đúng", bieuTuong: "chon-cau" },
    ],
  },
];

export const TONG_BUOC = CAC_PHAN.reduce((t, p) => t + p.buoc.length, 0);

/** Tạo câu hỏi kèm hàm tạo lại (để hỏi lại khi sai). Không tạo được thì null. */
function coTaoLai(tao) {
  const cau = tao();
  return cau ? { ...cau, taoLai: tao } : null;
}

/**
 * Bài thứ `bai` (bắt đầu từ 1) trong lộ trình. Học hết lộ trình thì quay vòng
 * lại bài 1 để ôn, `vong` cho biết đang ở vòng thứ mấy.
 */
export function layBai(loTrinh, bai) {
  const n = loTrinh.baiHoc.length;
  if (n === 0) return null;
  const chiSo = (bai - 1) % n;
  return { ...loTrinh.baiHoc[chiSo], vong: Math.floor((bai - 1) / n) + 1 };
}

/**
 * Nội dung đầy đủ của một bài: các mục chữ Hán, từ, điểm ngữ pháp.
 * @param du {chuHan: Map, tuVung: {map: Map, danhSach: Array}, nguPhap: Map}
 */
export function noiDungBai(bai, du) {
  return {
    chu: bai.chu.map((id) => du.chuHan.get(id)).filter(Boolean),
    tu: bai.tu.map((id) => du.tuVung.map.get(id)).filter(Boolean),
    nguPhap: du.nguPhap.get(bai.nguPhap) ?? null,
  };
}

/** Danh sách câu hỏi (đã xáo) cho một bước không phải trò chơi. */
export function cauHoiChoBuoc(maBuoc, nd, du) {
  const tatCaTu = du.tuVung.danhSach;
  let ds = [];
  switch (maBuoc) {
    case "chu-tap-viet":
      ds = nd.chu.map((c) => coTaoLai(() => cauHoiTapViet(c)));
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
    case "np-sap-xep":
      ds = (nd.nguPhap?.viDu ?? []).map((vd) => coTaoLai(() => cauHoiSapXep(nd.nguPhap, vd)));
      break;
    case "np-chon-cau":
      ds = (nd.nguPhap?.canhBaoLoi ?? []).map((cb) =>
        coTaoLai(() => cauHoiChonCauDung(nd.nguPhap, cb)),
      );
      break;
    default:
      ds = [];
  }
  return tronNgauNhien(ds.filter(Boolean));
}
