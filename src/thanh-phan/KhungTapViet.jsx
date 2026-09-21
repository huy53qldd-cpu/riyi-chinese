/* =============================================================================
   KHUNG TẬP VIẾT CHỮ HÁN
   =============================================================================

   Dùng thư viện HanziWriter để:
     - Xem mẫu: chữ tự vẽ lại từng nét theo đúng thứ tự
     - Tập viết: người dùng vẽ từng nét bằng ngón tay, viết sai nhiều lần thì
       thư viện gợi ý nét đúng

   Dữ liệu nét nằm trong public/du-lieu/net-viet/ (do npm run dung-net-viet tạo):
     trung/<chữ>.json  nét của chữ giản thể
     nhat/<chữ>.json   nét của chữ Nhật (thứ tự nét chuẩn Nhật)

   Khi hoàn thành một lần tập viết, kết quả (số lần, số nét sai) được ghi nhận cho
   người đã đăng nhập; chế độ khách không lưu. Viết xong mà không phải nhờ gợi ý
   thì tính là làm ĐÚNG chữ đó (dùng cho mục tiêu ngày và Review).
   ============================================================================= */

import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BieuTuong from "./BieuTuong.jsx";

const GOC_NET = `${import.meta.env.BASE_URL}du-lieu/net-viet/`;
const CO_KHUNG = 280; // cạnh khung vuông, tính theo pixel

/** Đọc một màu từ bảng màu (tokens.css) để không viết màu trực tiếp ở đây. */
function docMau(ten) {
  return getComputedStyle(document.documentElement).getPropertyValue(ten).trim();
}

/**
 * @param {string} idChu     Mã chữ trong dữ liệu (ví dụ "han-0001"), để lưu kết quả
 * @param {string} chu       Chữ cần tập viết
 * @param {string} ngonNgu   "trung" hoặc "nhat", quyết định dùng bộ nét nào
 * @param {Function} [khiXong]  Gọi khi viết xong, nhận true nếu KHÔNG cần gợi ý
 */
export default function KhungTapViet({ idChu, chu, ngonNgu, khiXong }) {
  const nd = useNguoiDung();
  const oVe = useRef(null);
  const nguoiViet = useRef(null);
  const daCanGoiY = useRef(false); // có nét nào sai tới mức hiện gợi ý chưa
  // Trạng thái: cho-du-lieu | san-sang | dang-xem | dang-tap | xong | khong-co
  const [trangThai, setTrangThai] = useState("cho-du-lieu");
  const [thongBao, setThongBao] = useState("");

  useEffect(() => {
    const oChua = oVe.current;
    let conSong = true;

    const nguoi = HanziWriter.create(oChua, chu, {
      width: CO_KHUNG,
      height: CO_KHUNG,
      padding: 12,
      // Tự tải nét từ file của app thay vì từ trang ngoài
      charDataLoader: (c, khiXong, khiLoi) => {
        fetch(`${GOC_NET}${ngonNgu}/${encodeURIComponent(c)}.json`)
          .then((r) => {
            if (!r.ok) throw new Error("khong-co");
            return r.json();
          })
          .then(khiXong)
          .catch(khiLoi);
      },
      onLoadCharDataSuccess: () => conSong && setTrangThai("san-sang"),
      onLoadCharDataError: () => conSong && setTrangThai("khong-co"),
      showOutline: true, // khung mờ của chữ, là "gợi ý" nền
      showHintAfterMisses: 3, // viết sai 3 lần một nét thì gợi ý nét đúng
      strokeAnimationSpeed: 1.2,
      delayBetweenStrokes: 250,
      strokeColor: docMau("--chu"),
      outlineColor: docMau("--vien"),
      drawingColor: docMau("--nhan"),
      highlightColor: docMau("--nhan"),
    });
    nguoiViet.current = nguoi;

    return () => {
      conSong = false;
      nguoi.cancelQuiz();
      // HanziWriter không có hàm huỷ, nên tự dọn khung vẽ
      oChua.innerHTML = "";
      nguoiViet.current = null;
    };
  }, [chu, ngonNgu]);

  function xemMau() {
    const nguoi = nguoiViet.current;
    nguoi.cancelQuiz();
    setTrangThai("dang-xem");
    setThongBao("Đang vẽ mẫu, nhìn thứ tự và hướng từng nét.");
    nguoi.animateCharacter({
      onComplete: () => {
        setTrangThai("san-sang");
        setThongBao("");
      },
    });
  }

  function tapViet() {
    const nguoi = nguoiViet.current;
    setTrangThai("dang-tap");
    setThongBao("Dùng ngón tay viết nét đầu tiên.");
    daCanGoiY.current = false;
    nguoi.quiz({
      onCorrectStroke: (d) =>
        setThongBao(
          d.strokesRemaining > 0
            ? `Đúng rồi. Còn ${d.strokesRemaining} nét.`
            : "",
        ),
      onMistake: (d) => {
        // Sai 3 lần một nét thì thư viện hiện gợi ý (showHintAfterMisses)
        if (d.mistakesOnStroke >= 3) daCanGoiY.current = true;
        setThongBao(
          d.mistakesOnStroke >= 3
            ? "Nét này chưa đúng. Hãy làm theo nét gợi ý."
            : "Chưa đúng, thử lại nét này.",
        );
      },
      onComplete: (d) => {
        nd.ghiTapViet(idChu, ngonNgu, d.totalMistakes, daCanGoiY.current);
        khiXong?.(!daCanGoiY.current);
        setTrangThai("xong");
        setThongBao(
          d.totalMistakes === 0
            ? "Hoàn thành, không sai nét nào."
            : daCanGoiY.current
              ? `Hoàn thành nhờ gợi ý, sai ${d.totalMistakes} lần. Chữ này sẽ vào mục ôn tập.`
              : `Hoàn thành, sai ${d.totalMistakes} lần.`,
        );
      },
    });
  }

  const khongCo = trangThai === "khong-co";
  const rangBuoc = trangThai === "cho-du-lieu" || khongCo;
  const nutChung =
    "inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold disabled:opacity-40";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="border-vien bg-nen-noi relative rounded-[var(--bo-goc)] border"
        style={{ width: CO_KHUNG, height: CO_KHUNG, touchAction: "none" }}
      >
        {/* Đường kẻ ô như giấy tập viết (điền tự cách) */}
        <svg
          className="text-vien pointer-events-none absolute inset-0"
          width={CO_KHUNG}
          height={CO_KHUNG}
          aria-hidden="true"
        >
          <g stroke="currentColor" strokeDasharray="5 5" strokeWidth="1">
            <line x1="0" y1={CO_KHUNG / 2} x2={CO_KHUNG} y2={CO_KHUNG / 2} />
            <line x1={CO_KHUNG / 2} y1="0" x2={CO_KHUNG / 2} y2={CO_KHUNG} />
          </g>
        </svg>
        {/* HanziWriter vẽ vào khung này */}
        <div ref={oVe} className="absolute inset-0" />
      </div>

      {khongCo ? (
        <p className="text-chu-mo m-0 text-center text-[length:var(--co-chu-latin-nho)]">
          Chưa có dữ liệu nét cho chữ này.
        </p>
      ) : (
        <p
          className="text-chu-mo m-0 min-h-5 text-center text-[length:var(--co-chu-latin-nho)]"
          aria-live="polite"
        >
          {thongBao}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={xemMau}
          disabled={rangBuoc || trangThai === "dang-xem"}
          className={`border-vien ${nutChung}`}
        >
          <BieuTuong ten="xem-mau" co={16} />
          Xem mẫu
        </button>
        <button
          type="button"
          onClick={tapViet}
          disabled={rangBuoc || trangThai === "dang-xem"}
          className={`border-nhan bg-nhan text-chu-tren-nhan ${nutChung}`}
        >
          <BieuTuong ten="tap-viet" co={16} />
          {trangThai === "dang-tap" || trangThai === "xong"
            ? "Viết lại"
            : "Tập viết"}
        </button>
      </div>
    </div>
  );
}
