/* =============================================================================
   TẠO CÂU HỎI LUYỆN TẬP
   =============================================================================

   Mỗi hàm ở đây nhận MỘT mục dữ liệu (một từ, một cặp đồng tự, một điểm ngữ
   pháp, một chữ Hán) và trả về một câu hỏi. Câu hỏi luôn có:

       id    mã mục, để ghi đúng/sai vào nhật ký (mục tiêu ngày, Review)
       kieu  "chon"     chọn một đáp án
             "sap-xep"  sắp xếp các mảnh thành câu
             "the"      thẻ ghi nhớ, tự đánh giá nhớ hay chưa
             "tap-viet" tập viết chữ Hán (tự ghi kết quả qua KhungTapViet)

   Trả về null nếu mục đó không đủ dữ liệu để tạo câu hỏi.

   Toàn bộ nội dung câu hỏi lấy từ DỮ LIỆU, không viết cứng ở đây. Thứ tự hiển
   thị vẫn giữ TRUNG → NHẬT → VIỆT.
   ============================================================================= */

import { ghepFurigana } from "../du-lieu/ghepFurigana.js";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import NutLoa from "../thanh-phan/NutLoa.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { chonKhacNhau, kieu, tronNgauNhien } from "./tienIch.js";

const SO_LUA_CHON = 4;

/** Tạo một lượt luyện: xáo danh sách, tạo câu hỏi, bỏ mục không đủ dữ liệu. */
export function taoLuot(danhSach, tao, soCau = 10) {
  const ra = [];
  for (const muc of tronNgauNhien(danhSach)) {
    if (ra.length >= soCau) break;
    const cau = tao(muc);
    if (cau) ra.push(cau);
  }
  return ra;
}

/** Ghép các lựa chọn dạng chữ (đáp án + nhiễu) thành mảng đã xáo. */
function luaChonChu(dung, nhieu, ghiChu = {}) {
  return tronNgauNhien([dung, ...nhieu]).map((chu) => ({
    khoa: chu,
    noiDung: <span>{chu}</span>,
    ghiChu: ghiChu[chu] ?? null,
  }));
}

/* -----------------------------------------------------------------------------
   TAB B — ĐỒNG TỰ DỊ NGHĨA: chọn nghĩa đúng trong tiếng Trung
   Đáp án nhiễu CHÍNH LÀ nghĩa tiếng Nhật, để đánh trúng thói quen sai.
   Từ không tồn tại trong tiếng Trung (怪我, 切手) không có pinyin nên không đưa
   vào câu hỏi (quy tắc: chữ Trung luôn phải có pinyin).
   ----------------------------------------------------------------------------- */
export function cauHoiDongTu(muc, tatCa) {
  if (!muc.tonTaiTrongTiengTrung || !muc.trung.pinyin || !muc.trung.nghia) {
    return null;
  }
  const dung = muc.trung.nghia;
  const bay = muc.nhat.nghia; // bẫy: nghĩa tiếng Nhật
  const khac = chonKhacNhau(
    tatCa.filter((m) => m.id !== muc.id).map((m) => m.trung.nghia),
    SO_LUA_CHON - 2,
    [dung, bay],
  );

  return {
    id: muc.id,
    kieu: "chon",
    cauHoi: "Trong tiếng TRUNG, từ này nghĩa là gì?",
    deBai: (
      <ChuTrung co="the" amTiet={ghepAmTiet(muc.chuTrungGianThe, muc.trung.pinyin)} />
    ),
    luaChon: luaChonChu(dung, [bay, ...khac], {
      [bay]: "Đây là nghĩa trong tiếng Nhật",
    }),
    dapAn: dung,
    giaiThich: (
      <>
        <ChuNhat noiDung={ghepFurigana(muc.chuNhat, muc.nhat.cachDoc)} />
        <p className="m-0 text-[length:var(--co-chu-latin)]">
          Tiếng Nhật: <span className="font-semibold">{bay}</span>
        </p>
        <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
          <VanBanPha noiDung={muc.viet.choDeNham} />
        </p>
      </>
    ),
  };
}

/* -----------------------------------------------------------------------------
   TAB C — TỪ VỰNG
   ----------------------------------------------------------------------------- */

/** Phần giải thích sau khi trả lời một câu về từ vựng. */
function giaiThichTu(muc) {
  return (
    <>
      <ChuTrung amTiet={ghepAmTiet(muc.tu, muc.pinyin)} />
      <ChuNhat noiDung={muc.nghiaNhat} />
      <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
        {muc.nghiaViet}
      </p>
    </>
  );
}

/** Trắc nghiệm: nhìn từ tiếng Trung, chọn nghĩa tiếng Việt. */
export function cauHoiNghiaTu(muc, tatCa) {
  const khac = chonKhacNhau(
    tatCa.filter((t) => t.id !== muc.id).map((t) => t.nghiaViet),
    SO_LUA_CHON - 1,
    [muc.nghiaViet],
  );
  return {
    id: muc.id,
    kieu: "chon",
    cauHoi: "Từ này nghĩa là gì?",
    deBai: <ChuTrung co="the" amTiet={ghepAmTiet(muc.tu, muc.pinyin)} />,
    luaChon: luaChonChu(muc.nghiaViet, khac),
    dapAn: muc.nghiaViet,
    giaiThich: giaiThichTu(muc),
  };
}

// Dấu cách không ngắt dòng. Viết bằng mã số cho dễ nhìn, vì nó trông y hệt dấu
// cách thường nhưng không bị trình duyệt bỏ đi.
const CACH_KHONG_NGAT = String.fromCharCode(160);

/** Ô trống trong câu điền từ. */
function OTrong() {
  return (
    <span
      aria-label="chỗ trống"
      className="border-chu mx-0.5 inline-block w-[1em] border-b-2 align-baseline"
    >
      {CACH_KHONG_NGAT}
    </span>
  );
}

/**
 * Điền từ: câu ví dụ bị khoét mất từ cần học, chọn từ đúng điền vào.
 * Có bản dịch Nhật và Việt làm gợi ý. Từ không có câu ví dụ thì bỏ qua.
 */
export function cauHoiDienTu(muc, tatCa) {
  const vd = muc.viDu.find((v) => v.trung.includes(muc.tu));
  if (!vd) return null;

  const batDau = Array.from(vd.trung).findIndex((_, i) =>
    Array.from(vd.trung).slice(i, i + Array.from(muc.tu).length).join("") === muc.tu,
  );
  const doDai = Array.from(muc.tu).length;
  const amTiet = ghepAmTiet(vd.trung, vd.pinyin).map((a, i) =>
    // Pinyin là dấu cách (không phải rỗng) để ô trống vẫn có dòng pinyin phía
    // trên như các chữ khác, nhờ vậy thẳng hàng với cả câu
    i >= batDau && i < batDau + doDai ? { chu: <OTrong />, pinyin: CACH_KHONG_NGAT } : a,
  );

  // Ưu tiên từ nhiễu cùng số chữ để không đoán được qua độ dài ô trống
  const cungDoDai = tatCa.filter(
    (t) => t.id !== muc.id && Array.from(t.tu).length === doDai && !vd.trung.includes(t.tu),
  );
  let nhieu = chonKhacNhau(cungDoDai, SO_LUA_CHON - 1);
  if (nhieu.length < SO_LUA_CHON - 1) {
    const conLai = tatCa.filter(
      (t) => t.id !== muc.id && !nhieu.includes(t) && !vd.trung.includes(t.tu),
    );
    nhieu = [...nhieu, ...chonKhacNhau(conLai, SO_LUA_CHON - 1 - nhieu.length)];
  }

  return {
    id: muc.id,
    kieu: "chon",
    cauHoi: "Chọn từ điền vào chỗ trống.",
    deBai: (
      <div className="flex flex-col gap-1">
        <ChuTrung amTiet={amTiet} />
        <ChuNhat noiDung={vd.nhat} />
        <p className="m-0 text-[length:var(--co-chu-latin)]">{vd.viet}</p>
      </div>
    ),
    luaChon: tronNgauNhien([muc, ...nhieu]).map((t) => ({
      khoa: t.id,
      noiDung: <ChuTrung amTiet={ghepAmTiet(t.tu, t.pinyin)} />,
      ghiChu: null,
    })),
    dapAn: muc.id,
    giaiThich: (
      <>
        <ChuTrung amTiet={ghepAmTiet(vd.trung, vd.pinyin)} ghiChuBienDieu={vd.ghiChuBienDieu} />
        {giaiThichTu(muc)}
      </>
    ),
  };
}

/** Thẻ ghi nhớ: mặt trước chữ Trung, lật ra nghĩa Nhật, Việt và câu ví dụ. */
export function theGhiNhoTu(muc) {
  const vd = muc.viDu[0];
  return {
    id: muc.id,
    kieu: "the",
    matTruoc: <ChuTrung co="the" amTiet={ghepAmTiet(muc.tu, muc.pinyin)} />,
    matSau: (
      <>
        {/* Nút loa chỉ hiện khi từ có ghi âm thật (quyết định 18.37) */}
        <div className="flex items-center justify-between gap-3">
          <ChuTrung amTiet={ghepAmTiet(muc.tu, muc.pinyin)} ghiChuBienDieu={muc.ghiChuBienDieu} />
          <NutLoa noiDung={muc.tu} anKhiChuaCoAm />
        </div>
        <ChuNhat noiDung={muc.nghiaNhat} />
        <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold">
          {muc.nghiaViet}
        </p>
        {vd && (
          <div className="border-vien mt-2 flex flex-col gap-1 border-t pt-2">
            <ChuTrung amTiet={ghepAmTiet(vd.trung, vd.pinyin)} />
            <ChuNhat noiDung={vd.nhat} />
            <p className="m-0 text-[length:var(--co-chu-latin)]">{vd.viet}</p>
          </div>
        )}
      </>
    ),
  };
}

/* -----------------------------------------------------------------------------
   TAB F — NGỮ PHÁP
   ----------------------------------------------------------------------------- */

const DAU_CAU = /[。！？，]+$/;

/** Sắp xếp các mảnh thành câu đúng. Gợi ý là bản dịch Nhật và Việt. */
export function cauHoiSapXep(diem, vd) {
  if (!vd?.tachTu?.length) return null;

  // Gắn pinyin cho từng mảnh theo vị trí chữ trong câu
  let viTri = 0;
  const manh = vd.tachTu.map((chu, i) => {
    const soChu = Array.from(chu).length;
    const pinyin = vd.pinyin.slice(viTri, viTri + soChu);
    viTri += soChu;
    return { khoa: `${i}`, chu, pinyin };
  });

  // Xáo cho tới khi khác thứ tự đúng (câu 3 mảnh vẫn có thể xáo trùng)
  let tron = tronNgauNhien(manh);
  for (let lan = 0; lan < 5 && tron.every((m, i) => m.khoa === `${i}`); lan += 1) {
    tron = tronNgauNhien(manh);
  }

  return {
    id: diem.id,
    kieu: "sap-xep",
    cauHoi: "Xếp các mảnh thành câu tiếng Trung đúng.",
    goiY: (
      <div className="flex flex-col gap-1">
        <ChuNhat noiDung={vd.nhat} />
        <p className="m-0 text-[length:var(--co-chu-latin)]">{vd.viet}</p>
      </div>
    ),
    manh: tron,
    cacDapAn: [vd.tachTu, ...(vd.cachXepKhac ?? [])].map((d) => d.join("")),
    dauCau: vd.trung.match(DAU_CAU)?.[0] ?? "",
    cauGoc: vd,
    giaiThich: (
      <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
        <VanBanPha noiDung={diem.ten} />:{" "}
        <VanBanPha noiDung={diem.congThuc} />
      </p>
    ),
  };
}

/** Chọn câu đúng giữa câu sai và câu đúng trong phần "Lỗi hay gặp". */
export function cauHoiChonCauDung(diem, cb) {
  if (!cb?.cauSai || !cb?.cauDung) return null;
  const cau = { sai: cb.cauSai, dung: cb.cauDung };
  return {
    id: diem.id,
    kieu: "chon",
    cauHoi: "Câu nào đúng?",
    deBai: (
      <p className="m-0 text-[length:var(--co-chu-latin)] font-semibold leading-snug">
        <VanBanPha noiDung={diem.ten} />
      </p>
    ),
    luaChon: tronNgauNhien(["dung", "sai"]).map((khoa) => ({
      khoa,
      noiDung: <ChuTrung amTiet={ghepAmTiet(cau[khoa].trung, cau[khoa].pinyin)} />,
      ghiChu: null,
    })),
    dapAn: "dung",
    giaiThich: (
      <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
        <VanBanPha noiDung={cb.noiDung} />
      </p>
    ),
  };
}

/** Mọi câu hỏi tạo được từ một điểm ngữ pháp (dùng cho Review). */
export function cauHoiNguPhap(diem) {
  const chon = diem.canhBaoLoi.map((cb) => cauHoiChonCauDung(diem, cb));
  const sapXep = diem.viDu.map((vd) => cauHoiSapXep(diem, vd));
  return [...chon, ...sapXep].filter(Boolean);
}

/* -----------------------------------------------------------------------------
   TAB A — CHỮ HÁN: tập viết (dùng trong Review)
   ----------------------------------------------------------------------------- */
export function cauHoiTapViet(chu) {
  const pinyinChinh = chu.amDoc.pinyin.find((a) => a.chinh) ?? chu.amDoc.pinyin[0];
  return {
    id: chu.id,
    kieu: "tap-viet",
    // KhungTapViet tự ghi kết quả, phiên luyện tập không ghi thêm lần nữa
    tuGhiKetQua: true,
    chu: chu.gianThe,
    deBai: (
      <div className="flex flex-col items-center gap-1">
        <ChuTrung amTiet={[{ chu: chu.gianThe, pinyin: pinyinChinh?.am ?? "" }]} />
        <ChuNhat noiDung={chu.nghia.nhat} />
        <p className={kieu.chuNho}>{chu.nghia.viet}</p>
      </div>
    ),
  };
}
