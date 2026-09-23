/* =============================================================================
   NHIỆM VỤ HÔM NAY: phần dùng chung cho màn Bài hôm nay và 3 tab
   Chữ Hán / Từ vựng / Ngữ pháp (GĐ 10, quyết định 18.26)
   =============================================================================

   Nút luyện tập ở mỗi tab CHÍNH LÀ các bước của bài hôm nay: làm ở tab hay ở
   màn Bài hôm nay đều tính chung một tiến độ (nd.loTrinh.buoc).

     useBaiHomNay()         dữ liệu đầy đủ của các mục hôm nay
     useNhiemVu(...)        mở một bước (lượt luyện tập hoặc trò chơi)
     <NutNhiemVu phan=... /> các nút bước của một phần, có trạng thái
   ============================================================================= */

import { useEffect, useMemo, useState } from "react";

import { taiDanhSachAmTiet } from "../am-thanh/phatAm.js";
import { taiChuHan, taiNguPhap, taiTuVung } from "../du-lieu/taiDuLieu.js";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import {
  CAC_PHAN,
  TAT_CA_BUOC,
  cacVanChoBuoc,
  cauHoiChoBuoc,
  layBai,
  noiDungTuMuc,
} from "./baiHoc.js";
import PhienLuyenTap from "./PhienLuyenTap.jsx";
import { kieu } from "./tienIch.js";
import TroChoiLatThe from "./TroChoiLatThe.jsx";

// Tải một lần cho cả app (các tab dùng chung), lỗi thì cho tải lại lần sau
let loiHua = null;
function taiDuLieuBai() {
  if (!loiHua) {
    loiHua = Promise.all([taiChuHan(), taiTuVung(), taiNguPhap()]).then(([ch, tv, np]) => ({
      chuHan: new Map(ch.map((c) => [c.id, c])),
      danhSachChu: ch,
      tuVung: { danhSach: tv.danhSach, map: new Map(tv.danhSach.map((t) => [t.id, t])) },
      danhMucChuDe: tv.danhMucChuDe,
      nguPhap: new Map(np.map((d) => [d.id, d])),
      danhSachNguPhap: np,
    }));
    loiHua.catch(() => {
      loiHua = null;
    });
  }
  return loiHua;
}

/**
 * Dữ liệu của bài hôm nay.
 * @returns {{ du, loi, bai, noiDung }} noiDung = {chu, chuViet, chuGame, tu, np, them}
 */
export function useBaiHomNay() {
  const nd = useNguoiDung();
  const [du, setDu] = useState(null);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    let conSong = true;
    taiDuLieuBai()
      .then((d) => conSong && setDu(d))
      .catch(() => conSong && setLoi(true));
    return () => {
      conSong = false;
    };
  }, []);

  const them = nd.loTrinh.them;
  const noiDung = useMemo(() => noiDungTuMuc(nd.mucHomNay, du, them), [nd.mucHomNay, du, them]);
  const bai = nd.duongLoTrinh ? layBai(nd.duongLoTrinh, nd.loTrinh.bai) : null;
  return { du, loi, bai, noiDung };
}

/**
 * Mở một bước của bài hôm nay.
 * @returns {{ batDau: Function, manHinh: JSX|null }} manHinh khác null thì tab
 *          phải hiện nó thay cho nội dung thường (đang làm bước đó).
 */
export function useNhiemVu(noiDung, du, soBai) {
  const nd = useNguoiDung();
  const [dangLam, setDangLam] = useState(null);

  // Bước luyện nghe cần biết âm tiết nào có file tiếng trước khi ra câu hỏi,
  // nên chờ tải xong danh sách rồi mới mở màn hình luyện tập.
  async function batDau(maBuoc) {
    if (maBuoc === "nghe-chon-am") await taiDanhSachAmTiet();
    setDangLam(maBuoc);
  }

  let manHinh = null;
  if (dangLam && noiDung && du) {
    const buoc = TAT_CA_BUOC.find((b) => b.ma === dangLam);
    const tieuDe = soBai ? `Bài ${soBai}: ${buoc.nhan}` : buoc.nhan;
    const xong = () => nd.hoanThanhBuoc(dangLam);
    const veLai = () => setDangLam(null);
    manHinh = buoc.laGame ? (
      <TroChoiLatThe
        key={dangLam}
        tieuDe={tieuDe}
        cacVan={cacVanChoBuoc(dangLam, noiDung)}
        khoaKyLuc={dangLam === "chu-lat-the" ? "chu-han" : "tu-vung"}
        quayLai={veLai}
        khiXong={xong}
      />
    ) : (
      <PhienLuyenTap
        key={dangLam}
        tieuDe={tieuDe}
        taoDanhSach={() => cauHoiChoBuoc(dangLam, noiDung, du)}
        quayLai={veLai}
        lamLaiKhiSai
        khiXong={xong}
      />
    );
  }
  return { batDau, manHinh };
}

/**
 * Các nút bước của một phần. Bước sau mở khi xong bước trước. Cùng kiểu và cỡ
 * với nút luyện tập cũ ở tab Từ vựng (quyết định 18.23).
 */
export function NutNhiemVu({ maPhan, batDau, sanSang = true }) {
  const nd = useNguoiDung();
  const phan = CAC_PHAN.find((p) => p.ma === maPhan);
  const buocXong = nd.loTrinh.buoc;
  return (
    <div className="flex flex-wrap gap-2">
      {phan.buoc.map((b, i) => {
        const xong = buocXong.includes(b.ma);
        const mo = sanSang && (i === 0 || buocXong.includes(phan.buoc[i - 1].ma));
        return (
          <button
            key={b.ma}
            type="button"
            onClick={() => batDau(b.ma)}
            disabled={!mo}
            aria-label={`${b.nhan}${xong ? ", đã xong" : mo ? "" : ", chưa mở"}`}
            className={xong ? kieu.nutDaXong : kieu.nutChinh}
          >
            <BieuTuong ten={xong ? "kiem-tra" : b.bieuTuong} />
            {b.nhan}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Khung "Nhiệm vụ hôm nay" của một tab: tiêu đề, các nút bước, dòng ghi chú.
 */
export function KhungNhiemVu({ maPhan, batDau, ghiChu, sanSang = true }) {
  const nd = useNguoiDung();
  const phan = CAC_PHAN.find((p) => p.ma === maPhan);
  const soXong = phan.buoc.filter((b) => nd.loTrinh.buoc.includes(b.ma)).length;
  return (
    <div className={`${kieu.khung} mt-4`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`${kieu.nhanTieuDe} flex items-center gap-1.5`}>
          <BieuTuong ten="luyen-tap" co={16} />
          Nhiệm vụ hôm nay
        </p>
        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold whitespace-nowrap">
          {soXong === phan.buoc.length ? "Đã xong" : `${soXong}/${phan.buoc.length} bước`}
        </span>
      </div>
      <NutNhiemVu maPhan={maPhan} batDau={batDau} sanSang={sanSang} />
      {ghiChu && <p className={kieu.chuNho}>{ghiChu}</p>}
      {!nd.daDangNhap && (
        <p className={kieu.chuNho}>Bạn đang ở chế độ khách: làm được nhưng không lưu tiến độ.</p>
      )}
    </div>
  );
}

/**
 * Ba nút HSK 1 / HSK 2 / HSK 3, mỗi nút có thanh % đã học (dùng chung cho
 * tab Chữ Hán, Từ vựng, Ngữ pháp). `tienDo[cap] = {tong, da, phanTram}`.
 */
export function NutCapHsk({ capChon, chon, tienDo, donVi }) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2" role="group" aria-label="Chọn cấp HSK">
      {[1, 2, 3].map((c) => {
        const td = tienDo[c] ?? { tong: 0, da: 0, phanTram: 0 };
        const chon1 = capChon === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => chon(c)}
            aria-pressed={chon1}
            aria-label={`HSK ${c}, đã học ${td.da} trên ${td.tong} ${donVi}, ${td.phanTram} phần trăm`}
            className={`flex flex-col items-stretch gap-1.5 rounded-[var(--bo-goc)] border-2 px-2.5 pt-2 pb-2.5 text-center transition-colors ${
              chon1 ? "border-nhan bg-nhan-nhat" : "border-vien bg-nen-noi"
            }`}
          >
            <span className="text-[length:var(--co-chu-latin)] font-bold">HSK {c}</span>
            <span className="bg-nen-phu h-1.5 w-full overflow-hidden rounded-[var(--bo-goc-tron)]">
              <span
                className="bg-nhan block h-full rounded-[var(--bo-goc-tron)]"
                style={{ width: `${td.phanTram}%` }}
              />
            </span>
            <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold tabular-nums">
              {td.phanTram}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** % đã học theo cấp HSK của một danh sách mục (mục có trường capHsk). */
export function tinhTienDoCap(danhSach, daHoc) {
  const ra = {};
  for (const cap of [1, 2, 3]) {
    const cua = danhSach.filter((m) => m.capHsk === cap);
    const da = cua.filter((m) => daHoc[m.id]).length;
    ra[cap] = { tong: cua.length, da, phanTram: cua.length ? Math.round((da / cua.length) * 100) : 0 };
  }
  return ra;
}
