/* =============================================================================
   KHOÁ "TIẾNG TRUNG CƠ BẢN" — BÀI 0: THANH ĐIỆU VÀ CÁCH HỌC (quyết định 18.71)
   =============================================================================

   Bài 0 không có trong giáo trình, nội dung do Claude soạn (bai-00.json).
     Buổi 1  Thanh điệu: đồ thị độ cao từng thanh đặt cạnh dấu tiếng Việt gần
             giống nhất (ghi rõ chỗ khác), nghe mẫu mā má mǎ mà, trò chơi nghe
             chọn thanh.
     Buổi 2  Pinyin: cấu tạo âm tiết, các âm người Việt hay đọc sai, cách học.
   Mọi âm thanh đi qua phatAm() (bộ âm tiết audio-cmn).
   ============================================================================= */

import { useEffect, useMemo, useState } from "react";

import ChuTrung from "../thanh-phan/ChuTrung.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { coAmTiet, NGON_NGU, phatAm, taiDanhSachAmTiet } from "../am-thanh/phatAm.js";
import { danhDauThanh } from "../am-thanh/dauThanh.js";
import { tronNgauNhien } from "../luyen-tap/tienIch.js";

/** "nv3" → "nǚ", "ma1" → "mā" để hiện chữ trên nút nghe. */
const hienAm = (khoa) => danhDauThanh(khoa.slice(0, -1).replace("v", "ü"), Number(khoa.slice(-1)));

function Muc({ tieuDe, children }) {
  return (
    <section className="border-vien bg-nen-noi flex flex-col gap-3 rounded-[var(--bo-goc)] border p-4">
      {tieuDe && (
        <h3 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          <VanBanPha noiDung={tieuDe} />
        </h3>
      )}
      {children}
    </section>
  );
}

function NutNghe({ khoa, nhan = null }) {
  return (
    <button
      type="button"
      onClick={() => phatAm(khoa, NGON_NGU.AM_TIET)}
      className="border-vien bg-nen-noi hover:border-nhan rounded-[var(--bo-goc-nho)] border px-3 py-1.5 text-[length:1.1rem]"
    >
      {nhan ?? hienAm(khoa)} <span className="text-nhan-chu text-[length:0.8rem]">▶</span>
    </button>
  );
}

/**
 * Đồ thị độ cao (thang 5 bậc, 5 = cao nhất). Đường liền: tiếng Trung,
 * đường đứt: dấu tiếng Việt gần giống. Màu lấy từ bảng màu (tokens.css).
 */
function DoThi({ trung, viet }) {
  const R = 150;
  const C = 96;
  const y = (bac) => 12 + (5 - bac) * 18;
  const duong = (ds) => {
    if (ds.length === 1) return `M 20 ${y(ds[0])} L ${R - 50} ${y(ds[0])}`; // thanh nhẹ: một chấm ngắn
    return ds.map((b, i) => `${i ? "L" : "M"} ${20 + (i * (R - 40)) / (ds.length - 1)} ${y(b)}`).join(" ");
  };
  return (
    <svg viewBox={`0 0 ${R} ${C}`} className="h-24 w-36 shrink-0" role="img" aria-label="Đồ thị độ cao thanh điệu">
      {[1, 2, 3, 4, 5].map((b) => (
        <g key={b}>
          <line x1="16" x2={R - 6} y1={y(b)} y2={y(b)} stroke="var(--vien)" strokeWidth="1" />
          <text x="2" y={y(b) + 4} fontSize="9" fill="var(--chu-mo)">
            {b}
          </text>
        </g>
      ))}
      <path d={duong(viet)} fill="none" stroke="var(--chu-mo)" strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" />
      <path d={duong(trung)} fill="none" stroke="var(--nhan)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Trò chơi nghe chọn thanh
   --------------------------------------------------------------------------- */
function TroChoiThanh({ tc }) {
  const [cauHoi, setCauHoi] = useState(null);
  const [viTri, setViTri] = useState(0);
  const [chon, setChon] = useState(null);
  const [dung, setDung] = useState(0);

  const tao = async () => {
    await taiDanhSachAmTiet();
    const kho = [...new Set(tc.amTiet)].flatMap((a) => [1, 2, 3, 4].map((t) => ({ am: a, thanh: t })));
    const ds = tronNgauNhien(kho.filter((x) => coAmTiet(`${x.am}${x.thanh}`))).slice(0, tc.soCau);
    setCauHoi(ds);
    setViTri(0);
    setChon(null);
    setDung(0);
    phatAm(`${ds[0].am}${ds[0].thanh}`, NGON_NGU.AM_TIET);
  };

  if (!cauHoi) {
    return (
      <div className="flex flex-col gap-2">
        <p className="m-0">{tc.huongDan}</p>
        <button type="button" onClick={tao} className="bg-nhan text-chu-tren-nhan self-start rounded-[var(--bo-goc-tron)] px-5 py-2 font-bold">
          Bắt đầu ({tc.soCau} câu)
        </button>
      </div>
    );
  }

  if (viTri >= cauHoi.length) {
    return (
      <div className="flex flex-col gap-2">
        <p className="m-0 text-[length:1.2rem] font-bold">
          Đúng {dung}/{cauHoi.length}
        </p>
        <p className="text-chu-mo m-0">
          {dung >= cauHoi.length * 0.8 ? "Rất tốt! Tai bạn đã phân biệt được thanh điệu." : "Nghe lại mẫu mā má mǎ mà ở trên rồi chơi thêm lượt nữa nhé."}
        </p>
        <button type="button" onClick={tao} className="border-vien self-start rounded-[var(--bo-goc-tron)] border px-4 py-2">
          Chơi lại
        </button>
      </div>
    );
  }

  const c = cauHoi[viTri];
  const khoa = `${c.am}${c.thanh}`;
  const tiep = () => {
    const sau = viTri + 1;
    setViTri(sau);
    setChon(null);
    if (sau < cauHoi.length) phatAm(`${cauHoi[sau].am}${cauHoi[sau].thanh}`, NGON_NGU.AM_TIET);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
        Câu {viTri + 1}/{cauHoi.length} · đúng {dung}
      </p>
      <button
        type="button"
        onClick={() => phatAm(khoa, NGON_NGU.AM_TIET)}
        className="border-nhan text-nhan-chu self-start rounded-[var(--bo-goc-tron)] border-2 px-5 py-2 font-bold"
      >
        ▶ Nghe lại
      </button>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((t) => {
          const vien =
            chon == null ? "border-vien" : t === c.thanh ? "border-dung border-2" : t === chon ? "border-sai border-2" : "border-vien";
          return (
            <button
              key={t}
              type="button"
              disabled={chon != null}
              onClick={() => {
                setChon(t);
                if (t === c.thanh) setDung((d) => d + 1);
              }}
              className={`bg-nen-noi rounded-[var(--bo-goc)] border py-3 text-center disabled:opacity-100 ${vien}`}
            >
              <span className="block text-[length:1.3rem] font-bold">{danhDauThanh("a", t)}</span>
              <span className="text-chu-mo text-[length:0.8rem]">Thanh {t}</span>
            </button>
          );
        })}
      </div>
      {chon != null && (
        <div className="flex items-center gap-3">
          <p className={`m-0 font-bold ${chon === c.thanh ? "text-dung" : "text-sai"}`}>
            {chon === c.thanh ? "✓ Đúng" : "✗ Chưa đúng"}: {danhDauThanh(c.am, c.thanh)} (thanh {c.thanh})
          </p>
          <button type="button" onClick={tiep} className="bg-nhan text-chu-tren-nhan ml-auto rounded-[var(--bo-goc-tron)] px-4 py-2 font-bold">
            Tiếp
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BUỔI 1 · THANH ĐIỆU
   --------------------------------------------------------------------------- */
function BuoiThanhDieu({ b }) {
  return (
    <div className="flex flex-col gap-4">
      <Muc>
        <p className="m-0 leading-relaxed">
          <VanBanPha noiDung={b.gioiThieu} />
        </p>
        <div className="flex flex-wrap gap-2">
          {b.amNghe.map((k) => (
            <NutNghe key={k} khoa={k} />
          ))}
          <NutNghe khoa={b.amNghe.join(" ")} nhan="Nghe cả 4" />
        </div>
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">{b.luuYChung}</p>
        <p className="text-chu-mo m-0 flex items-center gap-4 text-[length:var(--co-chu-latin-nho)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-nhan inline-block h-1 w-6 rounded" /> tiếng Trung
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-dashed border-[var(--chu-mo)]" /> dấu tiếng Việt gần giống
          </span>
        </p>
      </Muc>

      {b.thanh.map((t) => (
        <Muc key={t.so} tieuDe={t.so > 0 ? `${t.ten} (dấu ${t.dau})` : `${t.ten} (không ghi dấu)`}>
          <div className="flex items-center gap-4">
            <DoThi trung={t.doCao} viet={t.gan.doCao} />
            <div className="flex flex-col gap-1">
              <ChuTrung amTiet={[{ chu: t.viDu.trung, pinyin: t.viDu.pinyin[0] }]} co="the" />
              <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">{t.viDu.viet}</span>
              {t.so > 0 && <NutNghe khoa={`ma${t.so}`} />}
            </div>
          </div>
          <p className="m-0">
            <b>Gần giống:</b> dấu {t.gan.dau} (“{t.gan.viDu}”) · <span className="text-chu-mo">gần giống, không trùng khít</span>
          </p>
          <p className="m-0 leading-relaxed">{t.giong}</p>
          <p className="m-0 leading-relaxed">
            <b>Khác ở chỗ:</b> <VanBanPha noiDung={t.khac} />
          </p>
        </Muc>
      ))}

      <Muc tieuDe="Không có trong tiếng Trung">
        <p className="m-0 leading-relaxed">{b.thanhKhongCo}</p>
      </Muc>

      <Muc tieuDe="Trò chơi: nghe chọn thanh">
        <TroChoiThanh tc={b.troChoi} />
      </Muc>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BUỔI 2 · PINYIN VÀ CÁCH HỌC
   --------------------------------------------------------------------------- */
function BuoiPinyin({ b }) {
  return (
    <div className="flex flex-col gap-4">
      <Muc>
        <p className="m-0 leading-relaxed">{b.gioiThieu}</p>
      </Muc>

      <Muc tieuDe="Một âm tiết gồm 3 phần">
        <p className="m-0">{b.amTiet.moTa}</p>
        <div className="flex flex-wrap gap-2">
          {b.amTiet.viDu.map(([chu, py, dau, van, thanh]) => (
            <div key={chu} className="border-vien rounded-[var(--bo-goc-nho)] border px-3 py-2 text-center">
              <ChuTrung amTiet={[{ chu, pinyin: py }]} />
              <p className="text-chu-mo m-0 text-[length:0.8rem]">
                {dau || "(không có)"} + {van} + thanh {thanh}
              </p>
            </div>
          ))}
        </div>
      </Muc>

      <Muc tieuDe="Những âm người Việt hay đọc sai">
        {b.amDeSai.map((a) => (
          <div key={a.chu} className="border-vien flex flex-col gap-1.5 border-t pt-3 first:border-t-0 first:pt-0">
            <p className="m-0 text-[length:1.15rem] font-bold">{a.chu}</p>
            <p className="m-0 leading-relaxed">{a.cachDoc}</p>
            <p className="text-sai m-0 text-[length:var(--co-chu-latin-nho)]">Lỗi hay gặp: {a.loi}</p>
            <div className="flex flex-wrap gap-2">
              {a.viDu.map((k) => (
                <NutNghe key={k} khoa={k} />
              ))}
            </div>
          </div>
        ))}
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
          Các so sánh với tiếng Việt là gần đúng, giúp dễ bắt đầu. Hãy nghe kỹ âm mẫu và đọc theo.
        </p>
      </Muc>

      <Muc tieuDe="Cách học với Riyi">
        <ul className="m-0 flex flex-col gap-1.5 pl-5 leading-relaxed">
          {b.cachHoc.map((c) => (
            <li key={c}>
              <VanBanPha noiDung={c} />
            </li>
          ))}
        </ul>
      </Muc>
    </div>
  );
}

export default function BaiKhong({ bai, buoi }) {
  const b = useMemo(() => bai.buoi.find((x) => x.so === buoi), [bai, buoi]);
  // Tải sẵn danh sách âm tiết để nút nghe đầu tiên phát ngay
  useEffect(() => {
    taiDanhSachAmTiet();
  }, []);
  if (!b) return null;
  return buoi === 1 ? <BuoiThanhDieu b={b} /> : <BuoiPinyin b={b} />;
}
