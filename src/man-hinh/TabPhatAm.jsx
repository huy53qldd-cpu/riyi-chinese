/* =============================================================================
   TAB PHÁT ÂM (GĐ 10, quyết định 18.28 – 18.30)
   =============================================================================

   Người biết tiếng Nhật đọc được chữ Hán nhưng KHÔNG biết đọc tiếng Trung.
   Tab này dạy cách phát âm, gồm 3 phần:
     1. Bảng pinyin (theo mẫu 18 bảng phiên âm của chủ dự án, gộp thành 5
        nhóm). Chạm một ô: nghe ngay thanh 1 và mở khung chọn 4 thanh.
        Dữ liệu bảng: public/du-lieu/bang-pinyin.json (npm run dung-bang-pinyin),
        chỉ gồm ô có file âm thanh thật.
     2. Thanh điệu: 4 thanh + thanh nhẹ.
     3. Mẹo cho người biết tiếng Nhật, kèm cặp âm để nghe so sánh.

   Âm thanh: giọng người thật, bộ audio-cmn (Chen Wang, CC BY-SA). Mọi lần phát
   đều đi qua hàm phatAm() duy nhất (src/am-thanh/phatAm.js).

   Phần 2 và 3 là BẢN NHÁP do Claude soạn, cần người biết tiếng Trung rà lại.
   ============================================================================= */

import { useEffect, useState } from "react";

import { danhDauThanh } from "../am-thanh/dauThanh.js";
import { NGON_NGU, phatAm } from "../am-thanh/phatAm.js";
import { taiBangPinyin } from "../du-lieu/taiDuLieu.js";
import { KhungNhiemVu, useBaiHomNay, useNhiemVu } from "../luyen-tap/NhiemVuHomNay.jsx";
import { kieu } from "../luyen-tap/tienIch.js";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import ChuTrung from "../thanh-phan/ChuTrung.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";

/* -----------------------------------------------------------------------------
   NỘI DUNG PHẦN 2 VÀ 3 (bản nháp)
   ----------------------------------------------------------------------------- */
const THANH_DIEU = [
  {
    thanh: 1,
    chu: "妈",
    nghia: "mẹ",
    moTa: "Cao và bằng, giữ nguyên độ cao từ đầu đến cuối (như hát một nốt cao).",
    gan: "Gần thanh ngang của tiếng Việt, nhưng cao hơn.",
  },
  {
    thanh: 2,
    chu: "麻",
    nghia: "tê; cây gai",
    moTa: "Đi lên, từ giữa lên cao (như khi hỏi lại “Hả?”).",
    gan: "Gần thanh sắc.",
  },
  {
    thanh: 3,
    chu: "马",
    nghia: "ngựa",
    moTa: "Xuống thấp rồi mới lên. Khi nói nhanh thường chỉ còn phần trầm thấp.",
    gan: "Gần thanh hỏi.",
  },
  {
    thanh: 4,
    chu: "骂",
    nghia: "mắng",
    moTa: "Rơi mạnh từ cao xuống thấp, ngắn và dứt khoát (như ra lệnh).",
    gan: "Gần giữa thanh huyền và thanh nặng, nhưng bắt đầu từ cao.",
  },
];

const MEO = [
  {
    tieuDe: "b / p, d / t, g / k: khác nhau ở BẬT HƠI, không phải hữu thanh",
    noiDung:
      "Tiếng Nhật phân biệt ば / ぱ bằng rung dây thanh. Tiếng Trung thì cả b và p đều KHÔNG rung dây thanh; p, t, k bật mạnh một luồng hơi ra (để tờ giấy trước miệng sẽ thấy giấy rung), còn b, d, g thì không bật hơi. Vì vậy b nghe gần ぱ nhẹ, không phải ば.",
    cap: [["ba1", "pa1"], ["da4", "ta4"], ["ge1", "ke1"]],
  },
  {
    tieuDe: "zh ch sh r · j q x · z c s: ba nhóm dễ lẫn",
    noiDung:
      "zh ch sh r: uốn đầu lưỡi lên vòm miệng. j q x: mặt lưỡi áp gần lợi dưới, môi dẹt, gần {ja|じ ち し} nhưng lưỡi dẹt hơn. z c s: đầu lưỡi đặt sau răng trên, gần {ja|ず つ す}.",
    cap: [["zhi1", "ji1", "zi1"], ["chi1", "qi1", "ci1"], ["shi4", "xi4", "si4"]],
  },
  {
    tieuDe: "Chữ “i” sau zh ch sh r z c s không đọc là “i”",
    noiDung:
      "Trong zhi chi shi ri zi ci si, chữ i chỉ là cách viết: không đọc là “i” mà giữ nguyên khẩu hình của phụ âm, nghe gần “ư”. So với ji qi xi (có “i” thật) sẽ thấy khác hẳn.",
    cap: [["zi4", "ji4"], ["shi2", "xi2"]],
  },
  {
    tieuDe: "Âm ü: tiếng Nhật không có",
    noiDung:
      "Đặt lưỡi như khi đọc “i” rồi tròn môi như khi đọc “u”. Sau j q x viết là u nhưng vẫn đọc ü (ju, qu, xu).",
    cap: [["nv3", "nu3"], ["lv4", "lu4"], ["ju4", "zhu4"]],
  },
  {
    tieuDe: "-n và -ng: tiếng Nhật đều là ん",
    noiDung:
      "-n: đầu lưỡi chạm lợi trên, giống “n” cuối của tiếng Việt. -ng: cuống lưỡi nâng lên, giống “ng” cuối của tiếng Việt. Nhầm là thành từ khác.",
    cap: [["fan4", "fang4"], ["jin1", "jing1"], ["shen1", "sheng1"]],
  },
  {
    tieuDe: "Chữ “e” không đọc như え",
    noiDung:
      "e đứng một mình hoặc sau phụ âm (ge, he, de) đọc gần “ưa” / “ơ” của tiếng Việt. Chỉ trong ie, üe, ei thì e mới gần “ê”.",
    cap: [["ge1", "gei3"], ["he2", "xie2"]],
  },
  {
    tieuDe: "r không phải hàng ら",
    noiDung:
      "r đọc với đầu lưỡi uốn lên như zh ch sh, có rung nhẹ, gần “r” nhẹ của tiếng Việt miền Nam. Không búng lưỡi như ら.",
    cap: [["ri4", "li4"], ["rou4", "lou4"]],
  },
];

const CANG_KIEM_TRA = [
  "Phần Thanh điệu và Mẹo cho người biết tiếng Nhật do Claude soạn từ kiến thức ngữ âm, chưa có người biết tiếng Trung rà lại. Các so sánh với tiếng Việt, tiếng Nhật chỉ là gần đúng.",
  "Bảng pinyin tự dựng từ danh sách file âm thanh của bộ audio-cmn: ô nào không có file thì để trống, nên có thể khác một chút so với bảng mẫu (ví dụ có thêm âm tiết hiếm).",
];

/** Âm tiết lưu dạng "nv3" → hiện "nǚ". */
function hienAmTiet(khoa) {
  const m = /^([a-z]+)([1-4])$/.exec(khoa);
  if (!m) return khoa;
  return danhDauThanh(m[1].replace("v", "ü"), Number(m[2]));
}

export default function TabPhatAm() {
  const hienThongBao = useThongBao();
  const { du, bai, noiDung } = useBaiHomNay();
  const { batDau, manHinh } = useNhiemVu(noiDung, du, bai?.so);
  const [bang, setBang] = useState(null);
  const [loi, setLoi] = useState(false);
  const [nhom, setNhom] = useState(0);
  const [oChon, setOChon] = useState(null); // {viet, khoa, thanh}

  useEffect(() => {
    let conSong = true;
    taiBangPinyin()
      .then((d) => conSong && setBang(d))
      .catch(() => conSong && setLoi(true));
    return () => {
      conSong = false;
    };
  }, []);

  async function nghe(noiDung, khiDoc) {
    const kq = await phatAm(noiDung, NGON_NGU.AM_TIET, khiDoc);
    if (!kq.thanhCong && kq.thongBao) hienThongBao(kq.thongBao);
  }

  function chamO(o) {
    if (!o) return;
    setOChon(o);
    nghe(`${o.khoa}${o.thanh[0]}`);
  }

  const n = bang?.nhom[nhom];
  if (manHinh) return manHinh;

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Phát âm</h1>
        <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          Biết chữ Hán chưa đủ: phải nghe được cách đọc tiếng Trung. Chạm vào một
          ô để nghe người bản xứ đọc, chọn thanh 1 đến 4 ở khung hiện ra.
        </p>
      </div>

      {/* === LUYỆN NGHE: một bước của bài hôm nay (quyết định 18.39) === */}
      {noiDung && noiDung.chu.length > 0 && (
        <div>
          <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Luyện nghe hôm nay</h2>
          <KhungNhiemVu
            maPhan="nghe"
            batDau={batDau}
            sanSang={Boolean(du)}
            ghiChu="Nghe người bản xứ đọc rồi chọn đúng âm và đúng thanh, lấy từ chính các chữ Hán của bài hôm nay. Sai thì hỏi lại đến khi đúng."
          />
        </div>
      )}

      {/* === 1. BẢNG PINYIN === */}
      <div className={kieu.khung}>
        <p className={kieu.nhanTieuDe}>Bảng pinyin</p>
        {loi && (
          <p className="text-sai m-0 text-[length:var(--co-chu-latin-nho)]">
            Không tải được bảng pinyin. Hãy kiểm tra mạng rồi mở lại.
          </p>
        )}
        {!bang && !loi && <p className={kieu.chuNho}>Đang tải bảng...</p>}
        {bang && (
          <>
            {/* Chọn nhóm vần */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn nhóm vần">
              {bang.nhom.map((g, i) => (
                <button
                  key={g.ma}
                  type="button"
                  onClick={() => setNhom(i)}
                  aria-pressed={nhom === i}
                  className={`rounded-[var(--bo-goc-tron)] border px-3 py-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors ${
                    nhom === i ? "border-nhan bg-nhan text-chu-tren-nhan" : "border-vien bg-transparent"
                  }`}
                >
                  {g.nhan}
                </button>
              ))}
            </div>
            <BangNhom nhom={n} chamO={chamO} oChon={oChon} />
            <p className={kieu.chuNho}>
              Ô cam: vần (hàng trên) và phụ âm đầu (cột trái), chạm để nghe cách đọc
              khi đứng một mình. Ô xám: không có âm tiết này. Bảng rộng thì kéo
              ngang để xem hết.
            </p>
          </>
        )}
      </div>

      {/* === 2. THANH ĐIỆU === */}
      <div className={`${kieu.khung} gap-3`}>
        <p className={kieu.nhanTieuDe}>Bốn thanh điệu</p>
        <p className="m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          Tiếng Nhật có cao độ theo từ, còn tiếng Trung thì MỖI âm tiết mang một
          thanh riêng: đọc sai thanh là thành từ khác.
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {THANH_DIEU.map((t) => (
            <li key={t.thanh} className="border-vien flex items-start gap-3 rounded-[var(--bo-goc-nho)] border p-3">
              <button
                type="button"
                onClick={() => nghe(`ma${t.thanh}`)}
                aria-label={`Nghe thanh ${t.thanh}`}
                className="bg-nhan text-chu-tren-nhan flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              >
                <BieuTuong ten="nghe" co={20} />
              </button>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-end gap-x-3">
                  <span className="text-[length:1.25rem] font-bold">
                    Thanh {t.thanh}: {danhDauThanh("ma", t.thanh)}
                  </span>
                  <ChuTrung amTiet={[{ chu: t.chu, pinyin: danhDauThanh("ma", t.thanh) }]} />
                  <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">{t.nghia}</span>
                </div>
                <p className="m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">{t.moTa}</p>
                <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">{t.gan}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className={kieu.chuNho}>
          Thanh nhẹ (không dấu, ví dụ ma trong 妈妈 māma) đọc ngắn và nhẹ, phụ thuộc
          âm đứng trước nên không có file riêng.
        </p>
        <button
          type="button"
          onClick={() => nghe("ma1 ma2 ma3 ma4")}
          className={`${kieu.nutPhu} self-start`}
        >
          <BieuTuong ten="nghe" co={16} />
          Nghe lần lượt mā má mǎ mà
        </button>
      </div>

      {/* === 3. MẸO CHO NGƯỜI BIẾT TIẾNG NHẬT === */}
      <div className={`${kieu.khung} gap-3`}>
        <p className={kieu.nhanTieuDe}>Mẹo cho người biết tiếng Nhật</p>
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {MEO.map((m) => (
            <li key={m.tieuDe} className="flex flex-col gap-1.5">
              <p className="m-0 text-[length:var(--co-chu-latin)] font-bold leading-snug">
                <VanBanPha noiDung={m.tieuDe} />
              </p>
              <p className="m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
                <VanBanPha noiDung={m.noiDung} />
              </p>
              <div className="flex flex-wrap gap-2">
                {m.cap.map((cap) => (
                  <div key={cap.join()} className="bg-nen-phu flex items-center gap-1 rounded-[var(--bo-goc-tron)] p-1">
                    {cap.map((am, i) => (
                      <span key={am} className="flex items-center gap-1">
                        {i > 0 && <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">/</span>}
                        <button
                          type="button"
                          onClick={() => nghe(am)}
                          className="bg-nen-noi inline-flex items-center gap-1 rounded-[var(--bo-goc-tron)] px-3 py-1.5 text-[length:var(--co-chu-latin)] font-bold"
                        >
                          <BieuTuong ten="nghe" co={14} />
                          {hienAmTiet(am)}
                        </button>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Ghi công âm thanh (audio-cmn, Chen Wang, CC BY-SA) nằm trong source:
          public/am-thanh/GIAY-PHEP.txt, không hiện trên màn hình (quyết định 18.33) */}
      <MucChuaKiemTra danhSach={CANG_KIEM_TRA} />

      {/* Khung chọn thanh cho ô vừa chạm */}
      {oChon && <KhungChonThanh o={oChon} nghe={nghe} dong={() => setOChon(null)} />}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   BẢNG MỘT NHÓM VẦN: cột phụ âm bên trái đứng yên khi kéo ngang
   ----------------------------------------------------------------------------- */
function BangNhom({ nhom, chamO, oChon }) {
  const soCot = nhom.cot.length;
  const luoi = { gridTemplateColumns: `2.75rem repeat(${soCot}, minmax(3.25rem, 1fr))` };
  const kieuO =
    "flex h-11 items-center justify-center rounded-[var(--bo-goc-nho)] text-[length:var(--co-chu-latin-nho)] font-semibold";

  const oBam = (o, nhan, laTieuDe = false) =>
    o ? (
      <button
        type="button"
        onClick={() => chamO(o)}
        aria-label={`Nghe ${o.viet}`}
        className={`${kieuO} ${laTieuDe ? "bg-nhan-nhat text-nhan-chu font-bold" : "bg-[var(--o-am-tiet)]"} ${
          oChon?.khoa === o.khoa ? "ring-nhan ring-2" : ""
        } active:opacity-70`}
      >
        {nhan}
      </button>
    ) : (
      <span className={`${kieuO} ${laTieuDe ? "bg-nhan-nhat text-nhan-chu font-bold" : "bg-nen-phu"}`} aria-hidden={!laTieuDe}>
        {laTieuDe ? nhan : ""}
      </span>
    );

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="grid w-max min-w-full gap-1" style={luoi}>
        {/* Hàng tiêu đề: ô góc + các vần */}
        <span className="bg-nen-noi sticky left-0 z-10 grid" />
        {nhom.cot.map((c) => (
          <span key={c.van} className="grid">{oBam(c.o, c.van, true)}</span>
        ))}
        {/* Các hàng phụ âm */}
        {nhom.hang.map((h) => (
          <div key={h.phuAm} className="contents">
            <span className="bg-nen-noi sticky left-0 z-10 grid">{oBam(h.o, h.phuAm, true)}</span>
            {h.cacO.map((o, i) => (
              <span key={nhom.cot[i].van} className="grid">{oBam(o, o?.viet)}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   KHUNG CHỌN THANH: nằm trên thanh tab dưới, 4 nút thanh + nghe cả 4
   ----------------------------------------------------------------------------- */
function KhungChonThanh({ o, nghe, dong }) {
  const coThanh = (t) => o.thanh.includes(t);
  // Thanh đang được đọc: nút đó hiện như đang bị ấn (cả khi bấm "Nghe cả 4 thanh")
  const [thanhDangDoc, setThanhDangDoc] = useState(null);
  const ngheCacThanh = (cacThanh) =>
    nghe(cacThanh.map((t) => `${o.khoa}${t}`).join(" "), (viTri) =>
      setThanhDangDoc(viTri === null ? null : cacThanh[viTri]),
    );
  return (
    <div
      role="dialog"
      aria-label={`Chọn thanh cho ${o.viet}`}
      className="border-vien bg-nen-noi fixed inset-x-0 z-40 mx-auto flex w-[calc(100%-1.5rem)] max-w-lg flex-col gap-3 rounded-[var(--bo-goc-lon)] border p-4 shadow-[0_4px_20px_var(--bong)]"
      style={{ bottom: "calc(var(--cao-thanh-duoi) + env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[length:1.5rem] font-extrabold">{o.viet}</p>
        <button
          type="button"
          onClick={dong}
          aria-label="Đóng"
          className="text-chu-mo flex h-10 w-10 items-center justify-center rounded-full"
        >
          <BieuTuong ten="chua-nho" co={20} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => ngheCacThanh([t])}
            disabled={!coThanh(t)}
            aria-pressed={thanhDangDoc === t}
            className={`flex flex-col items-center gap-0.5 rounded-[var(--bo-goc)] py-2.5 transition-[transform,background-color,color] duration-150 disabled:opacity-35 ${
              thanhDangDoc === t ? "bg-nhan text-chu-tren-nhan scale-95" : "bg-nhan-nhat"
            }`}
          >
            <span className="text-[length:1.25rem] font-bold">{danhDauThanh(o.viet, t)}</span>
            <span
              className={`text-[length:0.6875rem] font-semibold ${thanhDangDoc === t ? "" : "text-chu-mo"}`}
            >
              Thanh {t}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => ngheCacThanh(o.thanh)}
        className={`${kieu.nutChinh} w-full`}
      >
        <BieuTuong ten="nghe" />
        Nghe cả {o.thanh.length} thanh
      </button>
    </div>
  );
}
