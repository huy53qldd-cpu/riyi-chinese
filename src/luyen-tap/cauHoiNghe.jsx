/* =============================================================================
   CÂU HỎI LUYỆN NGHE (GĐ 10, quyết định 18.39)
   =============================================================================

   Bước "Luyện nghe" của bài hôm nay: nghe tiếng người bản xứ đọc rồi chọn.
   Hai dạng câu hỏi, lấy từ ĐÚNG các chữ Hán của bài hôm nay:

     1. Nghe rồi chọn ÂM: 4 pinyin khác nhau, chọn cái vừa nghe.
     2. Nghe rồi chọn THANH: cùng một âm tiết, chọn đúng thanh 1-4.

   Âm thanh là file âm tiết có sẵn (public/am-thanh/am-tiet/, xem phatAm.js).
   Chữ nào không có file âm tiết thì BỎ QUA, không bao giờ hỏi một âm câm.
   ============================================================================= */

import { useEffect } from "react";

import { danhDauThanh, tachThanh } from "../am-thanh/dauThanh.js";
import { coAmTiet, NGON_NGU, phatAm } from "../am-thanh/phatAm.js";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import { chonKhacNhau, tronNgauNhien } from "./tienIch.js";

const SO_LUA_CHON = 4;

/** Âm tiết của một chữ Hán, dạng { am: "hao", thanh: 3 } — chưa có file thì null. */
function amCuaChu(chu) {
  const pinyin = chu?.amDoc?.pinyin?.find((a) => a.chinh) ?? chu?.amDoc?.pinyin?.[0];
  if (!pinyin?.am) return null;
  const { am, thanh } = tachThanh(pinyin.am);
  if (!(thanh >= 1 && thanh <= 4)) return null; // thanh nhẹ: không có file riêng
  const khoa = `${am}${thanh}`;
  return coAmTiet(khoa) ? { am, thanh, khoa, viet: pinyin.am } : null;
}

/**
 * Nút nghe của câu hỏi: tự đọc một lần khi câu hỏi hiện ra, bấm để nghe lại.
 * Nút to để dễ bấm bằng ngón tay, và là thứ duy nhất trong đề bài.
 */
export function NutNgheDeBai({ khoa }) {
  useEffect(() => {
    phatAm(khoa, NGON_NGU.AM_TIET);
  }, [khoa]);

  return (
    <button
      type="button"
      onClick={() => phatAm(khoa, NGON_NGU.AM_TIET)}
      aria-label="Nghe lại"
      className="border-nhan bg-nhan text-chu-tren-nhan mx-auto flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-full border"
    >
      <BieuTuong ten="nghe" co={32} />
      <span className="text-[length:var(--co-chu-latin-nho)] font-bold">Nghe lại</span>
    </button>
  );
}

/** Nghe rồi chọn pinyin đúng trong 4 lựa chọn. */
export function cauHoiNgheAm(chu, tatCaChu) {
  const am = amCuaChu(chu);
  if (!am) return null;

  // Nhiễu: âm tiết KHÁC HẲN (khác phần chữ cái), để không lẫn với câu hỏi thanh
  const khac = chonKhacNhau(
    tatCaChu
      .map((c) => amCuaChu(c))
      .filter((a) => a && a.am !== am.am)
      .map((a) => a.viet),
    SO_LUA_CHON - 1,
    [am.viet],
  );
  if (khac.length === 0) return null;

  return {
    id: chu.id,
    kieu: "chon",
    cauHoi: "Bạn vừa nghe âm nào?",
    deBai: <NutNgheDeBai khoa={am.khoa} />,
    luaChon: tronNgauNhien([am.viet, ...khac]).map((v) => ({
      khoa: v,
      noiDung: <span className="text-[length:1.25rem] font-bold">{v}</span>,
      ghiChu: null,
    })),
    dapAn: am.viet,
    giaiThich: <GiaiThichAm chu={chu} am={am} />,
  };
}

/** Nghe rồi chọn đúng thanh (cùng một âm tiết, 4 thanh). */
export function cauHoiNgheThanh(chu) {
  const am = amCuaChu(chu);
  if (!am) return null;

  return {
    id: chu.id,
    kieu: "chon",
    cauHoi: "Âm vừa nghe là thanh mấy?",
    deBai: <NutNgheDeBai khoa={am.khoa} />,
    luaChon: [1, 2, 3, 4].map((t) => ({
      khoa: `${t}`,
      noiDung: (
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-[length:1.25rem] font-bold">
            {danhDauThanh(am.am.replace("v", "ü"), t)}
          </span>
          <span className="text-[length:var(--co-chu-latin-nho)] font-semibold">Thanh {t}</span>
        </span>
      ),
      ghiChu: null,
    })),
    dapAn: `${am.thanh}`,
    giaiThich: <GiaiThichAm chu={chu} am={am} />,
  };
}

/** Sau khi trả lời: chữ Hán, pinyin và nghĩa tiếng Việt của âm vừa nghe. */
function GiaiThichAm({ chu, am }) {
  return (
    <p className="m-0 text-[length:var(--co-chu-latin)] leading-relaxed">
      <span lang="zh-CN" className="font-trung text-[length:1.5rem]">
        {chu.gianThe}
      </span>{" "}
      <span className="font-bold">{am.viet}</span> — {chu.nghia.viet}
    </p>
  );
}

/** Tất cả câu hỏi nghe của bài hôm nay: mỗi chữ một câu chọn âm, một câu chọn thanh. */
export function cauHoiNgheChoChu(cacChu) {
  return [
    ...cacChu.map((c) => cauHoiNgheAm(c, cacChu)),
    ...cacChu.map((c) => cauHoiNgheThanh(c)),
  ].filter(Boolean);
}
