/* =============================================================================
   THI THỬ HSK — HIỂN THỊ CÁC DẠNG CÂU HỎI (quyết định 18.59)
   =============================================================================

   GIỮ ĐÚNG ĐỀ GỐC: chữ Hán, pinyin (đặt trên cả từ như đề in), tiêu đề tiếng
   Trung đều lấy nguyên từ de.json. Chỗ nào đề gốc không có pinyin (tiêu đề
   第一部分, lời thoại phần nghe) thì app cũng không thêm. Dòng hướng dẫn tiếng
   Việt nhỏ dưới tiêu đề là phần app thêm cho dễ hiểu, không phải của đề.

   Mỗi nhóm câu (一部分) có một `kieu`:
     dung-sai-hinh       Nghe, xem ảnh, chọn ✓ / ✗
     chon-hinh           Nghe, chọn 1 trong 3 ảnh A B C
     ghep-hinh           Chọn ảnh A–F cho từng câu (nghe hội thoại / đọc câu)
     chon-chu            Nghe, chọn A B C bằng chữ
     dung-sai-hinh-chu   Ảnh + từ, chọn ✓ / ✗
     ghep-cau            Chọn câu trả lời A–F cho từng câu hỏi
     dien-tu             Chọn từ A–F điền vào chỗ trống

   xemLai = true: chỉ xem, đánh dấu đúng/sai và hiện đáp án, lời thoại phần nghe.
   Đúng/sai luôn có cả chữ và dấu ✓ ✗, không chỉ dựa vào màu.
   ============================================================================= */

import ChuTrung from "../thanh-phan/ChuTrung.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { duongDan } from "./duLieuThiThu.js";

const HUONG_DAN = {
  "nghe:dung-sai-hinh": "Nghe, rồi chọn ✓ nếu đúng với ảnh, ✗ nếu không đúng.",
  "nghe:chon-hinh": "Nghe, rồi chọn ảnh đúng: A, B hoặc C.",
  "nghe:ghep-hinh": "Nghe hội thoại, chọn ảnh A–F hợp với từng câu.",
  "nghe:chon-chu": "Nghe câu và câu hỏi, chọn câu trả lời đúng.",
  "doc:dung-sai-hinh-chu": "Chọn ✓ nếu từ đúng với ảnh, ✗ nếu không đúng.",
  "doc:ghep-hinh": "Đọc câu, chọn ảnh A–F hợp với từng câu.",
  "doc:ghep-cau": "Chọn câu trả lời A–F hợp với từng câu hỏi.",
  "doc:dien-tu": "Chọn từ A–F điền vào chỗ trống.",
};

/** Đổi token [chữ, pinyin] của de.json sang dạng ChuTrung dùng. */
const sangAmTiet = (token) => token.map(([chu, pinyin]) => ({ chu, pinyin }));

/** Một dòng chữ của đề, chỗ trống "__" hiện thành ô ( ) có chữ cái đã chọn. */
function DongChu({ token, dien = "" }) {
  const doan = [[]];
  for (const t of token) {
    const cuoi = doan[doan.length - 1];
    const laDau = !t[1] && /^[，。？！、；：,.?!;:]$/.test(t[0]);
    if (t[0] === "__") doan.push({ trong: true, chu: t[1] || dien, sau: "" }, []);
    // Dấu câu ngay sau ô trống: dính vào ô để không bị rớt xuống dòng một mình
    else if (laDau && cuoi.length === 0 && doan.length > 1) doan[doan.length - 2].sau += t[0];
    else cuoi.push(t);
  }
  return (
    <div className="flex flex-wrap items-end gap-x-0.5">
      {doan.map((d, i) =>
        Array.isArray(d) ? (
          d.length > 0 && <ChuTrung key={i} amTiet={sangAmTiet(d)} />
        ) : (
          <span key={i} className="inline-flex items-end">
            <span className="mx-1 mb-1.5 inline-flex h-8 min-w-12 items-center justify-center rounded-[var(--bo-goc-nho)] border border-dashed border-[var(--vien-dam)] px-2 text-[length:var(--co-chu-latin)] font-bold">
              {d.chu || " "}
            </span>
            {d.sau && <ChuTrung amTiet={[{ chu: d.sau }]} />}
          </span>
        ),
      )}
    </div>
  );
}

/** Ảnh của đề. */
function Hinh({ maDe, ten, className = "" }) {
  return (
    <img
      src={duongDan(maDe, `hinh/${ten}`)}
      alt=""
      loading="lazy"
      className={`rounded-[var(--bo-goc-nho)] bg-white object-contain ${className}`}
    />
  );
}

/**
 * Nút một lựa chọn. Khi xem lại: đáp án đúng viền xanh + ✓, chọn sai viền
 * đỏ/tím + ✗ (màu --dung / --sai của từng theme).
 */
function NutChon({ dangChon, laDapAn, xemLai, onClick, nhanDoc, className = "", children }) {
  let vien = dangChon ? "border-nhan bg-nhan-nhat border-2" : "border-vien";
  if (xemLai && laDapAn) vien = "border-dung border-2";
  else if (xemLai && dangChon) vien = "border-sai border-2";
  return (
    <button
      type="button"
      onClick={xemLai ? undefined : onClick}
      aria-pressed={dangChon}
      aria-label={nhanDoc}
      disabled={xemLai}
      className={`bg-nen-noi relative rounded-[var(--bo-goc)] border transition-colors disabled:opacity-100 ${vien} ${className}`}
    >
      {children}
      {xemLai && (laDapAn || dangChon) && (
        <span
          className={`bg-nen-noi absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[length:0.8rem] leading-none font-bold ${laDapAn ? "border-dung text-dung" : "border-sai text-sai"}`}
          aria-label={laDapAn ? "đáp án đúng" : "bạn chọn sai"}
        >
          {laDapAn ? "✓" : "✗"}
        </span>
      )}
    </button>
  );
}

/** Dãy nút chữ cái A–F cho các dạng ghép. */
function DayChuCai({ cacMa, so, gt, dapAn, xemLai, chon }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Chọn đáp án câu ${so}`}>
      {cacMa.map((m) => (
        <NutChon
          key={m}
          dangChon={gt === m}
          laDapAn={m === dapAn}
          xemLai={xemLai}
          onClick={() => chon(so, m)}
          nhanDoc={`Câu ${so}: ${m}`}
          className="h-10 w-10 text-[length:var(--co-chu-latin)] font-bold"
        >
          {m}
        </NutChon>
      ))}
    </div>
  );
}

/** Hai nút ✓ / ✗. */
function DungSai({ so, gt, dapAn, xemLai, chon }) {
  return (
    <div className="flex gap-2" role="group" aria-label={`Chọn đúng hay sai, câu ${so}`}>
      {[
        ["dung", "✓", "Đúng"],
        ["sai", "✗", "Không đúng"],
      ].map(([ma, dau, nhan]) => (
        <NutChon
          key={ma}
          dangChon={gt === ma}
          laDapAn={ma === dapAn}
          xemLai={xemLai}
          onClick={() => chon(so, ma)}
          nhanDoc={`Câu ${so}: ${nhan}`}
          className="flex h-12 w-14 items-center justify-center text-[1.4rem] font-bold"
        >
          {dau}
        </NutChon>
      ))}
    </div>
  );
}

/** Số câu kiểu đề in: "1." */
function SoCau({ so }) {
  return (
    <span className="w-8 shrink-0 pt-1 text-[length:var(--co-chu-latin)] font-bold tabular-nums">
      {so}.
    </span>
  );
}

/** Kết quả một câu khi xem lại: đúng/sai, đáp án, lời thoại (phần nghe). */
function XemLaiCau({ cau, gt, loiNghe }) {
  const dung = gt === cau.dapAn;
  const hien = (g) => (g === "dung" ? "✓" : g === "sai" ? "✗" : g);
  return (
    <div className="mt-1 flex flex-col gap-1 pl-8 text-[length:var(--co-chu-latin-nho)]">
      <p className={`m-0 font-bold ${dung ? "text-dung" : "text-sai"}`}>
        {dung
          ? "✓ Đúng"
          : gt == null
            ? `✗ Bỏ trống · đáp án: ${hien(cau.dapAn)}`
            : `✗ Bạn chọn ${hien(gt)} · đáp án: ${hien(cau.dapAn)}`}
      </p>
      {loiNghe && (
        <div className="bg-nen-phu rounded-[var(--bo-goc-nho)] px-3 py-2">
          <p className="text-chu-mo m-0 mb-1 font-semibold">Lời thoại</p>
          {/* Lời thoại in trong đề gốc không có pinyin, nên ở đây cũng không có */}
          {loiNghe.map((dong, i) => (
            <ChuTrung key={i} amTiet={[{ chu: dong }]} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Khung "例如" (câu ví dụ có sẵn đáp án của đề, không làm). */
function ViDu({ children }) {
  return (
    <div className="border-vien bg-nen-phu flex flex-col gap-2 rounded-[var(--bo-goc)] border border-dashed p-3">
      <p className="m-0 flex items-center gap-2">
        <span className="font-bold">
          <VanBanPha noiDung="例如：" />
        </span>
        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">Ví dụ, đã có sẵn đáp án</span>
      </p>
      {children}
    </div>
  );
}

/* =============================================================================
   MỘT NHÓM CÂU (第一部分, 第二部分...)
   ============================================================================= */
export default function NhomCau({ maDe, phanMa, nhom, traLoi, chon, xemLai = false, loiNghe = {} }) {
  const cacSo = nhom.cau.map((c) => c.so);
  const cacMa = (nhom.luaChon ?? []).map((l) => l.ma);
  const chung = (cau) => ({ so: cau.so, gt: traLoi[cau.so], dapAn: cau.dapAn, xemLai, chon });
  const xemLaiCau = (cau) =>
    xemLai && <XemLaiCau cau={cau} gt={traLoi[cau.so]} loiNghe={phanMa === "nghe" ? loiNghe[cau.so] : null} />;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col items-center gap-0.5 text-center">
        <h3 className="m-0 text-[length:var(--co-chu-latin)] font-bold tracking-[0.3em]">
          <VanBanPha noiDung={nhom.tieuDe} />
        </h3>
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
          <VanBanPha noiDung={`第${cacSo[0]}-${cacSo[cacSo.length - 1]}题`} />
        </p>
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
          {HUONG_DAN[`${phanMa}:${nhom.kieu}`]}
        </p>
      </header>

      {/* Ảnh / câu A–F dùng chung cho cả nhóm */}
      {nhom.kieu === "ghep-hinh" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {nhom.luaChon.map((l) => (
            <figure key={l.ma} className="m-0 flex items-start gap-2">
              <span className="w-5 pt-1 font-bold">{l.ma}</span>
              <Hinh maDe={maDe} ten={l.hinh} className="h-28 w-full" />
            </figure>
          ))}
        </div>
      )}
      {(nhom.kieu === "ghep-cau" || nhom.kieu === "dien-tu") && (
        <div className={`border-vien bg-nen-noi rounded-[var(--bo-goc)] border p-3 ${nhom.kieu === "dien-tu" ? "flex flex-wrap gap-x-4 gap-y-1" : "flex flex-col gap-1"}`}>
          {nhom.luaChon.map((l) => (
            <div key={l.ma} className="flex items-end gap-2">
              <span className="pb-1.5 font-bold">{l.ma}</span>
              <DongChu token={l.chu} />
            </div>
          ))}
        </div>
      )}

      {/* Câu ví dụ của đề */}
      {nhom.viDu && <NoiDungViDu maDe={maDe} nhom={nhom} />}

      {/* Các câu */}
      <ol className="m-0 flex list-none flex-col gap-5 p-0">
        {nhom.cau.map((cau) => (
          <li key={cau.so} className="flex flex-col gap-2">
            {nhom.kieu === "dung-sai-hinh" && (
              <div className="flex items-center gap-3">
                <SoCau so={cau.so} />
                <Hinh maDe={maDe} ten={cau.hinh} className="h-24 w-28" />
                <div className="ml-auto">
                  <DungSai {...chung(cau)} />
                </div>
              </div>
            )}

            {nhom.kieu === "dung-sai-hinh-chu" && (
              <div className="flex items-center gap-3">
                <SoCau so={cau.so} />
                <Hinh maDe={maDe} ten={cau.hinh} className="h-24 w-24" />
                <DongChu token={cau.chu} />
                <div className="ml-auto">
                  <DungSai {...chung(cau)} />
                </div>
              </div>
            )}

            {nhom.kieu === "chon-hinh" && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {cau.hinh.map((h, i) => {
                    const m = "ABC"[i];
                    return (
                      <NutChon
                        key={m}
                        dangChon={traLoi[cau.so] === m}
                        laDapAn={cau.dapAn === m}
                        xemLai={xemLai}
                        onClick={() => chon(cau.so, m)}
                        nhanDoc={`Câu ${cau.so}: ảnh ${m}`}
                        className="flex flex-col items-center gap-1 p-1.5"
                      >
                        <Hinh maDe={maDe} ten={h} className="h-20 w-full" />
                        <span className="font-bold">{m}</span>
                      </NutChon>
                    );
                  })}
                </div>
              </div>
            )}

            {nhom.kieu === "chon-chu" && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="flex flex-1 flex-col gap-2">
                  {cau.luaChon.map((l) => (
                    <NutChon
                      key={l.ma}
                      dangChon={traLoi[cau.so] === l.ma}
                      laDapAn={cau.dapAn === l.ma}
                      xemLai={xemLai}
                      onClick={() => chon(cau.so, l.ma)}
                      nhanDoc={`Câu ${cau.so}: ${l.ma}`}
                      className="flex items-end gap-3 px-3 py-1.5 text-left"
                    >
                      <span className="pb-1.5 font-bold">{l.ma}</span>
                      <DongChu token={l.chu} />
                    </NutChon>
                  ))}
                </div>
              </div>
            )}

            {(nhom.kieu === "ghep-hinh" || nhom.kieu === "ghep-cau" || nhom.kieu === "dien-tu") && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="flex flex-1 flex-col gap-2">
                  {(cau.dong ?? []).map((d, i) => (
                    <DongChu key={i} token={d} dien={traLoi[cau.so]} />
                  ))}
                  <DayChuCai cacMa={cacMa} {...chung(cau)} />
                </div>
              </div>
            )}

            {xemLaiCau(cau)}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Nội dung câu ví dụ theo từng dạng. */
function NoiDungViDu({ maDe, nhom }) {
  const vd = nhom.viDu;
  if (Array.isArray(vd)) {
    // dung-sai-hinh / dung-sai-hinh-chu: 2 dòng ví dụ ✓ và ✗
    return (
      <ViDu>
        {vd.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            <Hinh maDe={maDe} ten={v.hinh} className="h-20 w-24" />
            {v.chu && <DongChu token={v.chu} />}
            <span className="ml-auto text-[1.4rem] font-bold" aria-label={v.dapAn === "dung" ? "đúng" : "không đúng"}>
              {v.dapAn === "dung" ? "✓" : "✗"}
            </span>
          </div>
        ))}
      </ViDu>
    );
  }
  return (
    <ViDu>
      {vd.hinh && (
        <div className="grid grid-cols-3 gap-2">
          {vd.hinh.map((h, i) => (
            <div key={h} className="flex flex-col items-center gap-1">
              <Hinh maDe={maDe} ten={h} className="h-20 w-full" />
              <span className="font-bold">
                {"ABC"[i]} {"ABC"[i] === vd.dapAn && "✓"}
              </span>
            </div>
          ))}
        </div>
      )}
      {(vd.dong ?? []).map((d, i) => (
        <DongChu key={i} token={d} />
      ))}
      {vd.luaChon && (
        <div className="flex flex-wrap gap-x-5">
          {vd.luaChon.map((l) => (
            <div key={l.ma} className="flex items-end gap-1.5">
              <span className="pb-1.5 font-bold">{l.ma}</span>
              <DongChu token={l.chu} />
              {l.ma === vd.dapAn && <span className="pb-1.5 font-bold">✓</span>}
            </div>
          ))}
        </div>
      )}
      {!vd.hinh && !vd.luaChon && !(vd.dong ?? []).some((d) => d.some((t) => t[0] === "__")) && (
        <p className="m-0 font-bold">
          Đáp án: <span className="border-vien rounded border px-2">{vd.dapAn}</span>
        </p>
      )}
    </ViDu>
  );
}
