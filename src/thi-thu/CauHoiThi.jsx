/* =============================================================================
   THI THỬ HSK — HIỂN THỊ CÁC DẠNG CÂU HỎI (quyết định 18.59, 18.61)
   =============================================================================

   GIỮ ĐÚNG ĐỀ GỐC: chữ Hán, pinyin (HSK 1–2 đặt trên cả từ như đề in), tiêu đề
   tiếng Trung đều lấy nguyên từ de.json. Chỗ nào đề gốc không có pinyin (HSK
   3–6, tiêu đề 第一部分, lời thoại) thì app cũng không thêm. Dòng hướng dẫn
   tiếng Việt nhỏ dưới tiêu đề là phần app thêm cho dễ hiểu, không phải của đề.

   Mỗi nhóm câu có một `kieu`:
     dung-sai-hinh       Nghe, xem ảnh, chọn ✓ / ✗                     (HSK 1–2)
     chon-hinh           Nghe, chọn 1 trong 3 ảnh A B C                (HSK 1)
     ghep-hinh           Chọn ảnh A–F cho từng câu                     (HSK 1–3)
     chon-chu, chon      Chọn A B C (D) bằng chữ; có thể kèm đoạn văn  (mọi cấp)
     dung-sai-hinh-chu   Ảnh + từ, chọn ✓ / ✗                          (HSK 1)
     dung-sai-cau        Câu ★, chọn ✓ / ✗ (có thể kèm đoạn văn)       (HSK 2–4)
     ghep-cau            Chọn câu A–F cho từng câu                     (HSK 1–3)
     dien-tu             Chọn từ A–F điền vào chỗ trống                (HSK 1–4)
     sap-xep-doan        Xếp 3 câu A B C đúng thứ tự                   (HSK 4)
     dien-cau            Chọn câu A–E điền vào ô trong bài              (HSK 6)
     sap-xep-tu          Bấm các mảnh từ thành câu (Viết, chấm)        (HSK 3–5)
     dien-chu            Viết chữ Hán theo pinyin (Viết, chấm)         (HSK 3)
     viet-hinh           Nhìn ảnh, dùng từ đặt câu (Viết, KHÔNG chấm)  (HSK 4)
     viet-van            Viết đoạn văn 80 chữ (Viết, KHÔNG chấm)       (HSK 5)
     viet-tom-tat        Đọc 10 phút rồi viết tóm tắt (KHÔNG chấm)     (HSK 6)

   xemLai = true: chỉ xem, đánh dấu đúng/sai, hiện đáp án, lời thoại phần nghe.
   Đúng/sai luôn có cả chữ và dấu ✓ ✗, không chỉ dựa vào màu.
   ============================================================================= */

import { useEffect, useState } from "react";

import ChuTrung from "../thanh-phan/ChuTrung.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { cauDaXep, coCham, duongDan, traLoiDung } from "./duLieuThiThu.js";

const HUONG_DAN = {
  "nghe:dung-sai-hinh": "Nghe, rồi chọn ✓ nếu đúng với ảnh, ✗ nếu không đúng.",
  "nghe:chon-hinh": "Nghe, rồi chọn ảnh đúng: A, B hoặc C.",
  "nghe:ghep-hinh": "Nghe hội thoại, chọn ảnh hợp với từng câu.",
  "nghe:chon-chu": "Nghe, rồi chọn câu trả lời đúng.",
  "nghe:chon": "Nghe, rồi chọn câu trả lời đúng.",
  "nghe:dung-sai-cau": "Nghe, rồi chọn ✓ nếu câu ★ đúng, ✗ nếu không đúng.",
  "doc:dung-sai-hinh-chu": "Chọn ✓ nếu từ đúng với ảnh, ✗ nếu không đúng.",
  "doc:dung-sai-cau": "Đọc, rồi chọn ✓ nếu câu ★ đúng, ✗ nếu không đúng.",
  "doc:ghep-hinh": "Đọc câu, chọn ảnh hợp với từng câu.",
  "doc:ghep-cau": "Chọn câu A–F hợp với từng câu.",
  "doc:dien-tu": "Chọn từ A–F điền vào chỗ trống.",
  "doc:chon": "Đọc, rồi chọn câu trả lời đúng.",
  "doc:sap-xep-doan": "Bấm lần lượt A, B, C theo đúng thứ tự của đoạn văn.",
  "doc:dien-cau": "Chọn câu A–E điền vào từng ô trong bài.",
  "viet:sap-xep-tu": "Bấm lần lượt các mảnh để ghép thành câu đúng. Bấm vào câu đã ghép để bỏ mảnh.",
  "viet:dien-chu": "Gõ chữ Hán đúng với pinyin (cần bật bàn phím tiếng Trung trên máy).",
  "viet:viet-hinh": "Nhìn ảnh, dùng từ cho sẵn đặt một câu. Phần này không chấm điểm.",
  "viet:viet-van": "Viết đoạn văn khoảng 80 chữ. Phần này không chấm điểm.",
  "viet:viet-tom-tat": "Đọc bài 10 phút, bài sẽ ẩn đi, rồi viết tóm tắt khoảng 400 chữ. Không chấm điểm.",
};

/** Đổi token [chữ, pinyin] của de.json sang dạng ChuTrung dùng. */
const sangAmTiet = (token) => token.map(([chu, pinyin]) => ({ chu, pinyin }));

/** Ô trống trong câu: chữ cái / chữ đã điền, hoặc số câu (完形填空). */
function OTrong({ noiDung, sau }) {
  return (
    <span className="inline-flex items-end">
      <span className="mx-1 inline-flex h-8 min-w-12 items-center justify-center rounded-[var(--bo-goc-nho)] border border-dashed border-[var(--vien-dam)] px-2 align-middle text-[length:var(--co-chu-latin)] font-bold">
        {noiDung || " "}
      </span>
      {sau}
    </span>
  );
}

/**
 * Một dòng / một đoạn chữ của đề. Có pinyin (HSK 1–2) thì dùng ChuTrung cho
 * pinyin nằm trên từng từ; không có pinyin (HSK 3–6) thì hiện như đoạn văn
 * thường để tự xuống dòng. Chỗ trống "__" hiện thành ô có nhãn / chữ đã điền.
 */
function DongChu({ token, dien = "" }) {
  const coPinyin = token.some((t) => t[1] && t[0] !== "__");
  if (!coPinyin) {
    return (
      <p className="m-0 text-[length:1.15rem] leading-relaxed">
        {token.map((t, i) =>
          t[0] === "__" ? (
            <OTrong key={i} noiDung={t[1] || dien} />
          ) : (
            <VanBanPha key={i} noiDung={t[0]} />
          ),
        )}
      </p>
    );
  }
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
          <span key={i} className="mb-1.5">
            <OTrong noiDung={d.chu} sau={d.sau && <ChuTrung amTiet={[{ chu: d.sau }]} />} />
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

/** Đoạn văn dùng chung cho vài câu (đọc hiểu, 完形填空, 选句填空). */
function DoanVan({ maDe, doan }) {
  return (
    <div className="border-vien bg-nen-noi flex flex-col gap-2 rounded-[var(--bo-goc)] border p-3">
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">
        Đoạn văn cho câu {doan.tu}–{doan.den}
      </p>
      {doan.dong.map((d, i) => (
        <DongChu key={i} token={d} />
      ))}
      {(doan.hinh ?? []).map((h) => (
        <Hinh key={h} maDe={maDe} ten={h} className="max-h-40 self-center" />
      ))}
      {doan.luaChon && (
        <div className="border-vien mt-1 flex flex-col gap-1 border-t pt-2">
          {doan.luaChon.map((l) => (
            <div key={l.ma} className="flex items-start gap-2">
              <span className="pt-0.5 font-bold">{l.ma}</span>
              <DongChu token={l.chu} />
            </div>
          ))}
        </div>
      )}
    </div>
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
    <span className="w-9 shrink-0 pt-1 text-[length:var(--co-chu-latin)] font-bold tabular-nums">
      {so}.
    </span>
  );
}

/** Mảnh từ / câu dạng nút bấm (sắp xếp). */
function NutManh({ onClick, disabled, children, nhanDoc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={nhanDoc}
      className="border-vien bg-nen-noi rounded-[var(--bo-goc-nho)] border px-3 py-1.5 text-[length:1.1rem] shadow-[0_1px_3px_var(--bong)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/* -----------------------------------------------------------------------------
   Các dạng câu Viết và sắp xếp
   ----------------------------------------------------------------------------- */

/** Bấm các mảnh từ theo thứ tự thành câu. traLoi = mảng chỉ số các mảnh. */
function SapXepTu({ cau, gt = [], xemLai, chon }) {
  const daDung = new Set(gt);
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex min-h-12 flex-wrap items-center gap-1.5 rounded-[var(--bo-goc)] border-2 border-dashed p-2 ${
          xemLai ? (traLoiDung({ kieu: "sap-xep-tu" }, cau, gt) ? "border-dung" : "border-sai") : "border-vien"
        }`}
        aria-label={`Câu đang ghép, câu ${cau.so}`}
      >
        {gt.length === 0 && <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">Bấm các mảnh bên dưới theo thứ tự.</span>}
        {gt.map((i, vt) => (
          <NutManh
            key={`${i}-${vt}`}
            disabled={xemLai}
            onClick={() => chon(cau.so, gt.filter((_, k) => k !== vt))}
            nhanDoc={`Bỏ mảnh ${cau.manh[i]}`}
          >
            <VanBanPha noiDung={cau.manh[i]} />
          </NutManh>
        ))}
      </div>
      {!xemLai && (
        <div className="flex flex-wrap gap-1.5">
          {cau.manh.map((m, i) => (
            <NutManh key={i} disabled={daDung.has(i)} onClick={() => chon(cau.so, [...gt, i])} nhanDoc={`Thêm mảnh ${m}`}>
              <VanBanPha noiDung={m} />
            </NutManh>
          ))}
        </div>
      )}
    </div>
  );
}

/** Xếp 3 câu A B C đúng thứ tự. traLoi = chuỗi "BAC" (có thể chưa đủ). */
function SapXepDoan({ cau, gt = "", xemLai, chon }) {
  return (
    <div className="flex flex-col gap-2">
      {cau.luaChon.map((l) => (
        <div key={l.ma} className="flex items-start gap-2">
          <span className="pt-0.5 font-bold">{l.ma}</span>
          <DongChu token={l.chu} />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">Thứ tự:</span>
        <span className="min-w-20 font-bold tracking-[0.4em]">{gt ? gt.split("").join(" → ") : "…"}</span>
        {!xemLai &&
          cau.luaChon.map((l) => (
            <NutManh key={l.ma} disabled={gt.includes(l.ma)} onClick={() => chon(cau.so, gt + l.ma)} nhanDoc={`Câu ${cau.so}: thêm ${l.ma}`}>
              {l.ma}
            </NutManh>
          ))}
        {!xemLai && gt && (
          <button type="button" onClick={() => chon(cau.so, "")} className="text-chu-mo text-[length:var(--co-chu-latin-nho)] underline">
            Xếp lại
          </button>
        )}
      </div>
    </div>
  );
}

/** Ô gõ chữ Hán theo pinyin (HSK 3). */
function DienChu({ cau, gt = "", xemLai, chon }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-1">
        {cau.dong[0].map((t, i) =>
          t[0] === "__" ? (
            <span key={i} className="inline-flex flex-col items-center">
              <span className="text-nhan-chu text-[length:var(--co-chu-latin-nho)] font-semibold">{cau.goiY}</span>
              <OTrong noiDung={gt} />
            </span>
          ) : (
            <span key={i} className="text-[length:1.15rem]">
              <VanBanPha noiDung={t[0]} />
            </span>
          ),
        )}
      </div>
      {!xemLai && (
        <label className="flex items-center gap-2 text-[length:var(--co-chu-latin-nho)]">
          Chữ cho “{cau.goiY}”:
          <input
            lang="zh-CN"
            value={gt}
            maxLength={2}
            onChange={(e) => chon(cau.so, e.target.value.trim())}
            className="border-vien bg-nen font-trung w-16 rounded-[var(--bo-goc-nho)] border px-2 py-1 text-center text-[length:1.3rem]"
          />
        </label>
      )}
    </div>
  );
}

/** Ô viết tự do, đếm số chữ Hán. */
function OViet({ so, gt = "", xemLai, chon, goiY }) {
  const soChu = (gt.match(/[㐀-鿿]/g) ?? []).length;
  if (xemLai) {
    return (
      <div className="bg-nen-phu rounded-[var(--bo-goc-nho)] px-3 py-2">
        <p className="text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-semibold">Bài bạn viết ({soChu} chữ)</p>
        {gt ? <DongChu token={[[gt, ""]]} /> : <p className="text-chu-mo m-0">(bỏ trống)</p>}
      </div>
    );
  }
  return (
    <label className="flex flex-col gap-1">
      <textarea
        lang="zh-CN"
        value={gt}
        onChange={(e) => chon(so, e.target.value)}
        rows={goiY === "dai" ? 10 : 3}
        className="border-vien bg-nen font-trung w-full resize-y rounded-[var(--bo-goc-nho)] border px-3 py-2 text-[length:1.1rem]"
        aria-label={`Bài viết câu ${so}`}
      />
      <span className="text-chu-mo self-end text-[length:var(--co-chu-latin-nho)] tabular-nums">{soChu} chữ Hán</span>
    </label>
  );
}

/**
 * HSK 6 缩写: bấm "Bắt đầu đọc" → bài hiện 10 phút (đếm ngược), hết giờ hoặc bấm
 * "Đọc xong" thì bài ẨN HẲN, lúc đó mới hiện ô viết. Trạng thái lưu ở `phu`.
 */
function TomTat({ cau, gt, xemLai, chon, phu = {}, capNhatPhu }) {
  const [bayGio, setBayGio] = useState(() => Date.now());
  const conLai = phu.batDauDoc
    ? Math.min(cau.phutDoc * 60, cau.phutDoc * 60 - (bayGio - phu.batDauDoc) / 1000)
    : cau.phutDoc * 60;
  const daAn = phu.daAn || (phu.batDauDoc && conLai <= 0);

  useEffect(() => {
    if (!phu.batDauDoc || phu.daAn) return undefined;
    const hen = setInterval(() => setBayGio(Date.now()), 1000);
    return () => clearInterval(hen);
  }, [phu.batDauDoc, phu.daAn]);

  const baiDoc = (
    <div className="border-vien bg-nen-noi flex flex-col gap-2 rounded-[var(--bo-goc)] border p-3">
      {cau.baiDoc.map((p, i) => (
        <DongChu key={i} token={[[p, ""]]} />
      ))}
    </div>
  );
  if (xemLai) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">Bài đọc</p>
        {baiDoc}
        <OViet so={cau.so} gt={gt} xemLai chon={chon} />
      </div>
    );
  }
  if (!phu.batDauDoc) {
    return (
      <button
        type="button"
        onClick={() => capNhatPhu(cau.so, { batDauDoc: Date.now() })}
        className="border-nhan bg-nhan text-chu-tren-nhan self-start rounded-[var(--bo-goc-tron)] border px-5 py-2.5 font-bold"
      >
        Bắt đầu đọc bài ({cau.phutDoc} phút)
      </button>
    );
  }
  if (!daAn) {
    const g = Math.max(0, Math.round(conLai));
    return (
      <div className="flex flex-col gap-2">
        <p className="m-0 font-bold tabular-nums">
          Còn {String(Math.floor(g / 60)).padStart(2, "0")}:{String(g % 60).padStart(2, "0")} để đọc. Không được chép lại.
        </p>
        {baiDoc}
        <button
          type="button"
          onClick={() => capNhatPhu(cau.so, { daAn: true })}
          className="border-vien self-start rounded-[var(--bo-goc-tron)] border px-4 py-2 font-semibold"
        >
          Đọc xong, ẩn bài và bắt đầu viết
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">Bài đọc đã ẩn. Hãy viết tóm tắt (tự đặt tiêu đề, khoảng 400 chữ).</p>
      <OViet so={cau.so} gt={gt} chon={chon} goiY="dai" />
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Xem lại một câu
   ----------------------------------------------------------------------------- */
function XemLaiCau({ nhom, cau, gt, loiNghe }) {
  const hien = (g) => (g === "dung" ? "✓" : g === "sai" ? "✗" : g);
  let ketQua;
  if (!coCham(nhom, cau)) {
    ketQua = <p className="text-chu-mo m-0 font-semibold">Phần viết tự do: không chấm điểm.</p>;
  } else {
    const dung = traLoiDung(nhom, cau, gt);
    const bo = gt == null || gt === "" || (Array.isArray(gt) && gt.length === 0);
    const cuaBan = nhom.kieu === "sap-xep-tu" ? cauDaXep(cau, gt) : hien(gt);
    const dapAn = Array.isArray(cau.dapAn) ? cau.dapAn.join(" / ") : hien(cau.dapAn);
    ketQua = (
      <p className={`m-0 font-bold ${dung ? "text-dung" : "text-sai"}`}>
        {dung ? "✓ Đúng" : bo ? "✗ Bỏ trống · đáp án: " : `✗ Bạn chọn ${cuaBan} · đáp án: `}
        {!dung && (Array.isArray(cau.dapAn) || nhom.kieu === "dien-chu" ? <VanBanPha noiDung={dapAn} /> : dapAn)}
      </p>
    );
  }
  return (
    <div className="mt-1 flex flex-col gap-1 pl-9 text-[length:var(--co-chu-latin-nho)]">
      {ketQua}
      {cau.thamKhao?.length > 0 && (
        <p className="m-0">
          Câu tham khảo của đề: <VanBanPha noiDung={cau.thamKhao.join(" / ")} />
        </p>
      )}
      {loiNghe && (
        <div className="bg-nen-phu rounded-[var(--bo-goc-nho)] px-3 py-2">
          <p className="text-chu-mo m-0 mb-1 font-semibold">Lời thoại</p>
          {/* Lời thoại in trong đề gốc không có pinyin, nên ở đây cũng không có */}
          {loiNghe.map((dong, i) => (
            <DongChu key={i} token={[[dong, ""]]} />
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
export default function NhomCau({
  maDe,
  phanMa,
  nhom,
  traLoi,
  chon,
  xemLai = false,
  loiNghe = {},
  phu = {},
  capNhatPhu = () => {},
}) {
  const cacSo = nhom.cau.map((c) => c.so);
  const cacMa = (nhom.luaChon ?? []).map((l) => l.ma);
  const chung = (cau) => ({ so: cau.so, gt: traLoi[cau.so], dapAn: cau.dapAn, xemLai, chon });
  const doanTruoc = (so) => (nhom.doanVan ?? []).find((d) => d.tu === so);
  const doanCua = (so) => (nhom.doanVan ?? []).find((d) => d.tu <= so && so <= d.den);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col items-center gap-0.5 text-center">
        <h3 className="m-0 text-[length:var(--co-chu-latin)] font-bold tracking-[0.3em]">
          <VanBanPha noiDung={nhom.tieuDe} />
        </h3>
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
          <VanBanPha
            noiDung={`第${cacSo[0]}${cacSo.length > 1 ? `-${cacSo[cacSo.length - 1]}` : ""}题${nhom.huongDan ? `：${nhom.huongDan}` : ""}`}
          />
        </p>
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">{HUONG_DAN[`${phanMa}:${nhom.kieu}`]}</p>
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
        <div
          className={`border-vien bg-nen-noi rounded-[var(--bo-goc)] border p-3 ${nhom.kieu === "dien-tu" ? "flex flex-wrap gap-x-4 gap-y-1" : "flex flex-col gap-1"}`}
        >
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
            {/* Đoạn văn chung hiện trước câu đầu tiên của nó */}
            {doanTruoc(cau.so) && <DoanVan maDe={maDe} doan={doanTruoc(cau.so)} />}

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

            {nhom.kieu === "dung-sai-cau" && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {cau.dong.map((d, i) => (
                    <DongChu key={i} token={d} />
                  ))}
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

            {(nhom.kieu === "chon-chu" || nhom.kieu === "chon") && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {(cau.dong ?? []).map((d, i) => (
                    <DongChu key={i} token={d} />
                  ))}
                  {(cau.hinh ?? []).map((h) => (
                    <Hinh key={h} maDe={maDe} ten={h} className="max-h-40 self-start" />
                  ))}
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
                      <span className="pb-1 font-bold">{l.ma}</span>
                      <DongChu token={l.chu} />
                    </NutChon>
                  ))}
                </div>
              </div>
            )}

            {(nhom.kieu === "ghep-hinh" || nhom.kieu === "ghep-cau" || nhom.kieu === "dien-tu") && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {(cau.dong ?? []).map((d, i) => (
                    <DongChu key={i} token={d} dien={traLoi[cau.so]} />
                  ))}
                  <DayChuCai cacMa={cacMa} {...chung(cau)} />
                </div>
              </div>
            )}

            {nhom.kieu === "dien-cau" && (
              <div className="flex items-center gap-2">
                <SoCau so={cau.so} />
                <DayChuCai cacMa={(doanCua(cau.so)?.luaChon ?? []).map((l) => l.ma)} {...chung(cau)} />
              </div>
            )}

            {nhom.kieu === "sap-xep-doan" && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="min-w-0 flex-1">
                  <SapXepDoan cau={cau} gt={traLoi[cau.so]} xemLai={xemLai} chon={chon} />
                </div>
              </div>
            )}

            {nhom.kieu === "sap-xep-tu" && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="min-w-0 flex-1">
                  <SapXepTu cau={cau} gt={traLoi[cau.so]} xemLai={xemLai} chon={chon} />
                </div>
              </div>
            )}

            {nhom.kieu === "dien-chu" && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="min-w-0 flex-1">
                  <DienChu cau={cau} gt={traLoi[cau.so]} xemLai={xemLai} chon={chon} />
                </div>
              </div>
            )}

            {(nhom.kieu === "viet-hinh" || nhom.kieu === "viet-van") && (
              <div className="flex gap-2">
                <SoCau so={cau.so} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {(cau.dong ?? []).map((d, i) => (
                    <DongChu key={i} token={d} />
                  ))}
                  {cau.hinh && [].concat(cau.hinh).map((h) => <Hinh key={h} maDe={maDe} ten={h} className="max-h-36 self-start" />)}
                  {cau.tuGoiY && (
                    <p className="m-0">
                      Từ phải dùng: <span className="font-bold"><VanBanPha noiDung={cau.tuGoiY} /></span>
                    </p>
                  )}
                  <OViet so={cau.so} gt={traLoi[cau.so]} xemLai={xemLai} chon={chon} goiY={nhom.kieu === "viet-van" ? "dai" : ""} />
                </div>
              </div>
            )}

            {nhom.kieu === "viet-tom-tat" && (
              <div className="flex flex-col gap-2">
                {cau.dong.map((d, i) => (
                  <DongChu key={i} token={d} />
                ))}
                <TomTat
                  cau={cau}
                  gt={traLoi[cau.so]}
                  xemLai={xemLai}
                  chon={chon}
                  phu={phu[cau.so]}
                  capNhatPhu={capNhatPhu}
                />
              </div>
            )}

            {xemLai && !(nhom.kieu === "viet-tom-tat") && (
              <XemLaiCau nhom={nhom} cau={cau} gt={traLoi[cau.so]} loiNghe={phanMa === "nghe" ? loiNghe[cau.so] : null} />
            )}
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
    // dung-sai-hinh / dung-sai-hinh-chu / dung-sai-cau: các ví dụ ✓ và ✗
    return (
      <ViDu>
        {vd.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            {v.hinh && <Hinh maDe={maDe} ten={v.hinh} className="h-20 w-24" />}
            {v.chu && <DongChu token={v.chu} />}
            {v.dong && (
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {v.dong.map((d, k) => (
                  <DongChu key={k} token={d} />
                ))}
              </div>
            )}
            <span className="ml-auto text-[1.4rem] font-bold" aria-label={v.dapAn === "dung" ? "đúng" : "không đúng"}>
              {v.dapAn === "dung" ? "✓" : "✗"}
            </span>
          </div>
        ))}
      </ViDu>
    );
  }
  if (nhom.kieu === "sap-xep-tu") {
    return (
      <ViDu>
        <div className="flex flex-wrap gap-1.5">
          {vd.manh.map((m, i) => (
            <span key={i} className="border-vien rounded-[var(--bo-goc-nho)] border px-2 py-1">
              <VanBanPha noiDung={m} />
            </span>
          ))}
        </div>
        <p className="m-0 font-bold">
          → <VanBanPha noiDung={vd.dapAn.join(" / ")} />
        </p>
      </ViDu>
    );
  }
  if (nhom.kieu === "viet-hinh") {
    return (
      <ViDu>
        <div className="flex items-center gap-3">
          <Hinh maDe={maDe} ten={vd.hinh} className="h-24 w-28" />
          <div className="flex flex-col gap-1">
            <span className="font-bold"><VanBanPha noiDung={vd.tuGoiY} /></span>
            <VanBanPha noiDung={vd.thamKhao.join(" / ")} />
          </div>
        </div>
      </ViDu>
    );
  }
  if (nhom.kieu === "dien-chu") {
    return (
      <ViDu>
        <DienChu cau={{ ...vd, so: 0 }} gt={vd.dapAn} xemLai chon={() => {}} />
      </ViDu>
    );
  }
  const coTrong = (vd.dong ?? []).some((d) => d.some((t) => t[0] === "__"));
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
      {vd.luaChon?.length > 0 && (
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
      {!vd.hinh && !(vd.luaChon?.length > 0 && vd.dapAn?.length === 1) && !coTrong && vd.dapAn && (
        <p className="m-0 font-bold">
          Đáp án: <span className="border-vien rounded border px-2 tracking-[0.3em]">{vd.dapAn}</span>
        </p>
      )}
    </ViDu>
  );
}
