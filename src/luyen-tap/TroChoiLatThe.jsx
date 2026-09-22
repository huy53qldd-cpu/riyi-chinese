/* =============================================================================
   TRÒ CHƠI LẬT THẺ (GĐ 10, quyết định 18.16)
   =============================================================================

   10 cặp = 20 thẻ, xếp 4 cột × 5 hàng.
     - Đầu ván: mở hết 20 thẻ trong 3 giây cho nhìn qua, rồi úp lại.
     - Lật hai thẻ: một thẻ Trung (chữ + pinyin) và đúng thẻ nghĩa của nó
       (tiếng Nhật + tiếng Việt) thì hai thẻ ở lại mặt ngửa. Sai thì úp lại.
     - Lật hết 20 thẻ là xong: báo thời gian, số lượt lật, kỷ lục trên máy.

   Mỗi cặp tìm được ghi là 1 câu đúng vào nhật ký (nd.ghiKetQua). Là bước của
   Bài hôm nay thì chơi xong mới tính bước đó xong (khiXong).
   Lật nhầm KHÔNG đưa vào Review, vì nhầm vị trí không có nghĩa là không thuộc từ.

   Chữ trên thẻ tự co cho vừa bề ngang thẻ (đơn vị cqw = % bề ngang thẻ), nên
   thanh kéo cỡ chữ to mấy cũng không tràn ra ngoài.
   ============================================================================= */

import { useCallback, useEffect, useRef, useState } from "react";

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BieuTuong, { HoaAnhDao } from "../thanh-phan/BieuTuong.jsx";
import ChuNhat, { tachFurigana } from "../thanh-phan/ChuNhat.jsx";
import ChuTrung from "../thanh-phan/ChuTrung.jsx";
import { kieu, tronNgauNhien } from "./tienIch.js";

const GIAY_XEM_TRUOC = 3;
const MS_UP_LAI = 900; // lật nhầm: để nhìn một chút rồi mới úp lại

/** Tạo 20 thẻ đã xáo từ danh sách cặp. */
function taoBoThe(cacCap) {
  return tronNgauNhien(
    cacCap.flatMap((c) => [
      { khoa: `${c.id}-trung`, id: c.id, loai: "trung", cap: c },
      { khoa: `${c.id}-nghia`, id: c.id, loai: "nghia", cap: c },
    ]),
  );
}

/** "1 phút 12 giây" / "45 giây" */
function ghiThoiGian(giay) {
  const p = Math.floor(giay / 60);
  const g = giay % 60;
  return p > 0 ? `${p} phút ${g} giây` : `${g} giây`;
}

/* --- Kỷ lục lưu trên máy (per-tab). localStorage có thể bị chặn nên bọc try. --- */
function docKyLuc(khoa) {
  try {
    return JSON.parse(localStorage.getItem(`riyi-ky-luc-lat-the-${khoa}`));
  } catch {
    return null;
  }
}
function luuKyLuc(khoa, kyLuc) {
  try {
    localStorage.setItem(`riyi-ky-luc-lat-the-${khoa}`, JSON.stringify(kyLuc));
  } catch {
    // Không lưu được thì thôi
  }
}

/**
 * @param {string}   tieuDe      Tên hiện ở đầu màn chơi
 * @param {Function} taoCap      Trả về danh sách cặp mới cho mỗi ván
 * @param {string}   khoaKyLuc   Tên để lưu kỷ lục riêng ("tu-vung", "chu-han")
 * @param {Function} quayLai
 * @param {Function} khiXong     Gọi khi lật hết thẻ. Có hàm này nghĩa là game đang
 *                               là một bước của Bài hôm nay: hết ván thì mời về bài.
 */
export default function TroChoiLatThe({ tieuDe, taoCap, khoaKyLuc, quayLai, khiXong = null }) {
  const nd = useNguoiDung();
  const [boThe, setBoThe] = useState(() => taoBoThe(taoCap()));
  const [giaiDoan, setGiaiDoan] = useState("xem-truoc"); // xem-truoc | choi | xong
  const [demXemTruoc, setDemXemTruoc] = useState(GIAY_XEM_TRUOC);
  const [dangMo, setDangMo] = useState([]); // vị trí 1–2 thẻ đang lật chưa ghép
  const [daGhep, setDaGhep] = useState(() => new Set()); // id các cặp đã ghép
  const [soLuot, setSoLuot] = useState(0);
  const [soGiay, setSoGiay] = useState(0);
  const [ketQua, setKetQua] = useState(null); // {kyLucCu, laKyLucMoi}
  const henUpLai = useRef(null);

  const tongCap = boThe.length / 2;

  // Đếm ngược xem trước, rồi úp hết thẻ và bắt đầu tính giờ
  useEffect(() => {
    if (giaiDoan !== "xem-truoc") return undefined;
    const hen = setTimeout(() => {
      if (demXemTruoc <= 1) setGiaiDoan("choi");
      else setDemXemTruoc(demXemTruoc - 1);
    }, 1000);
    return () => clearTimeout(hen);
  }, [giaiDoan, demXemTruoc]);

  // Đồng hồ trong lúc chơi
  useEffect(() => {
    if (giaiDoan !== "choi") return undefined;
    const hen = setInterval(() => setSoGiay((g) => g + 1), 1000);
    return () => clearInterval(hen);
  }, [giaiDoan]);

  useEffect(() => () => clearTimeout(henUpLai.current), []);

  // Vào game thì cuộn lên đầu trang, để thấy đủ nút Thoát và cả bàn thẻ
  // (danh sách vừa rồi có thể đang cuộn xuống dưới)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const ketThuc = useCallback(
    (luot, giay) => {
      const cu = docKyLuc(khoaKyLuc);
      const tot =
        !cu || giay < cu.soGiay || (giay === cu.soGiay && luot < cu.soLuot);
      if (tot) luuKyLuc(khoaKyLuc, { soGiay: giay, soLuot: luot });
      setKetQua({ kyLucCu: cu, laKyLucMoi: tot });
      setGiaiDoan("xong");
      khiXong?.();
    },
    [khoaKyLuc, khiXong],
  );

  function bamThe(viTri) {
    if (giaiDoan !== "choi") return;
    const the = boThe[viTri];
    if (daGhep.has(the.id) || dangMo.includes(viTri) || dangMo.length >= 2) return;

    const moi = [...dangMo, viTri];
    setDangMo(moi);
    if (moi.length < 2) return;

    const luot = soLuot + 1;
    setSoLuot(luot);
    const [a, b] = moi.map((v) => boThe[v]);
    if (a.id === b.id && a.loai !== b.loai) {
      // Đúng cặp: giữ mặt ngửa, ghi 1 câu đúng vào nhật ký
      const ghep = new Set(daGhep).add(a.id);
      setDaGhep(ghep);
      setDangMo([]);
      nd.ghiKetQua(a.id, true);
      if (ghep.size === tongCap) ketThuc(luot, soGiay);
    } else {
      henUpLai.current = setTimeout(() => setDangMo([]), MS_UP_LAI);
    }
  }

  function vanMoi() {
    clearTimeout(henUpLai.current);
    setBoThe(taoBoThe(taoCap()));
    setDangMo([]);
    setDaGhep(new Set());
    setSoLuot(0);
    setSoGiay(0);
    setKetQua(null);
    setDemXemTruoc(GIAY_XEM_TRUOC);
    setGiaiDoan("xem-truoc");
  }

  if (tongCap < 2) {
    return (
      <section className="flex flex-col gap-4">
        <p className={kieu.chuNho}>
          Cần ít nhất 2 mục khác nghĩa nhau để chơi. Hãy chọn bộ lọc rộng hơn.
        </p>
        <button type="button" onClick={quayLai} className={`${kieu.nutPhu} self-start`}>
          <BieuTuong ten="quay-lai" co={16} />
          Quay lại
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      {/* Đầu màn: thoát, tên, lượt lật, đồng hồ */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={quayLai} className={kieu.nutPhu}>
          <BieuTuong ten="quay-lai" co={16} />
          Thoát
        </button>
        <h1 className="m-0 min-w-0 flex-1 truncate text-[length:var(--co-chu-latin)] font-bold">
          {tieuDe}
        </h1>
        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold tabular-nums whitespace-nowrap">
          {soLuot} lượt · {Math.floor(soGiay / 60)}:{String(soGiay % 60).padStart(2, "0")}
        </span>
      </div>

      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]" aria-live="polite">
        {giaiDoan === "xem-truoc"
          ? `Ghi nhớ vị trí các thẻ… ${demXemTruoc}`
          : giaiDoan === "choi"
            ? `Tìm cặp: chữ Trung với nghĩa của nó. Đã ghép ${daGhep.size}/${tongCap}.`
            : `Hoàn thành ${tongCap}/${tongCap} cặp!`}
      </p>

      {giaiDoan === "xong" && ketQua && (
        <div className={`${kieu.khung} items-center text-center`}>
          <p className="m-0 text-[length:var(--co-chu-latin)] font-bold">
            {ketQua.laKyLucMoi ? "Kỷ lục mới!" : "Hoàn thành!"}
          </p>
          <p className="m-0 text-[length:var(--co-chu-latin)]">
            Xong trong {ghiThoiGian(soGiay)}, {soLuot} lượt lật.
          </p>
          {ketQua.kyLucCu && !ketQua.laKyLucMoi && (
            <p className={kieu.chuNho}>
              Kỷ lục trên máy này: {ghiThoiGian(ketQua.kyLucCu.soGiay)}, {ketQua.kyLucCu.soLuot} lượt lật.
            </p>
          )}
          <p className={kieu.chuNho}>
            {nd.daDangNhap
              ? khiXong
                ? "Đã xong bước này của Bài hôm nay."
                : `Đã ghi lại ${tongCap} cặp bạn tìm được.`
              : "Bạn đang ở chế độ khách nên kết quả không được lưu."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {khiXong ? (
              <button type="button" onClick={quayLai} className={kieu.nutChinh}>
                <BieuTuong ten="quay-lai" />
                Về bài hôm nay
              </button>
            ) : (
              <>
                <button type="button" onClick={vanMoi} className={kieu.nutChinh}>
                  <BieuTuong ten="lam-lai" />
                  Chơi ván mới
                </button>
                <button type="button" onClick={quayLai} className={kieu.nutPhu}>
                  <BieuTuong ten="quay-lai" co={16} />
                  Quay lại
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <ul className="m-0 grid list-none grid-cols-4 gap-1.5 p-0">
        {boThe.map((the, viTri) => {
          const ghepRoi = daGhep.has(the.id);
          const ngua = giaiDoan !== "choi" || ghepRoi || dangMo.includes(viTri);
          return (
            <li key={the.khoa}>
              <TheBai
                the={the}
                ngua={ngua}
                ghepRoi={ghepRoi && giaiDoan === "choi"}
                bam={() => bamThe(viTri)}
                soThuTu={viTri + 1}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Cỡ chữ Trung vừa bề ngang thẻ. Mỗi chữ chiếm ít nhất 1em; pinyin dài
 * (zhuāng...) nằm trên đầu chữ cỡ 0.5em có thể rộng hơn chữ, nên tính cả nó.
 */
function coChuTrung(amTiet) {
  const tongEm = amTiet.reduce((t, a) => t + Math.max(1, (a.pinyin?.length ?? 0) * 0.3), 0);
  return `min(1.5rem, ${(86 / tongEm).toFixed(1)}cqw)`;
}

/** Cỡ chữ Nhật vừa bề ngang thẻ, tính cả furigana (cỡ 0.5em) trên đầu chữ Hán. */
function coChuNhat(noiDung) {
  const tongEm = tachFurigana(noiDung).reduce(
    (t, m) => t + Math.max(Array.from(m.chu).length, m.doc ? m.doc.length * 0.5 : 0),
    0,
  );
  return `min(1.125rem, ${(86 / Math.max(1, tongEm)).toFixed(1)}cqw)`;
}

/** Một thẻ: mặt úp có hình mặt trời (hoặc hoa anh đào), mặt ngửa là nội dung. */
function TheBai({ the, ngua, ghepRoi, bam, soThuTu }) {
  const nhan = ngua
    ? the.loai === "trung"
      ? `Thẻ chữ Trung: ${the.cap.trung.map((a) => a.chu).join("")}`
      : `Thẻ nghĩa: ${the.cap.viet}`
    : `Thẻ úp số ${soThuTu}`;
  return (
    <button
      type="button"
      onClick={bam}
      aria-label={nhan}
      data-cap={the.id}
      className="the-lat block aspect-[4/5] w-full bg-transparent p-0"
    >
      <span className={`the-lat-trong ${ngua ? "dang-ngua" : ""}`}>
        {/* Mặt úp */}
        <span className="mat-the mat-up bg-nhan-nhat border-vien text-nhan flex items-center justify-center rounded-[var(--bo-goc-nho)] border">
          <img src="/hinh/mat-troi.png" alt="" className="tru-anh-dao w-1/2 opacity-80" />
          <span className="chi-anh-dao">
            <HoaAnhDao co={28} />
          </span>
        </span>
        {/* Mặt ngửa */}
        <span
          className={`mat-the mat-ngua bg-nen-noi flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[var(--bo-goc-nho)] border-2 px-1 [container-type:inline-size] ${
            ghepRoi ? "border-dung" : "border-vien"
          }`}
        >
          {the.loai === "trung" ? (
            <ChuTrung amTiet={the.cap.trung} coRieng={coChuTrung(the.cap.trung)} />
          ) : (
            <>
              <ChuNhat noiDung={the.cap.nhat} coRieng={coChuNhat(the.cap.nhat)} />
              <span className="line-clamp-2 w-full text-center text-[length:min(var(--co-chu-latin-nho),17cqw)] leading-tight font-semibold break-words">
                {the.cap.viet}
              </span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}
