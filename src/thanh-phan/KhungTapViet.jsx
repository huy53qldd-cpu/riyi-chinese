/* =============================================================================
   KHUNG TẬP VIẾT CHỮ HÁN
   =============================================================================

   Dùng thư viện HanziWriter để:
     - Tập viết: VÀO LÀ VIẾT ĐƯỢC NGAY (quyết định 18.54), chữ hiện mờ sẵn trong
       khung để tô theo, không phải bấm nút "Tập viết" nữa. Người dùng vẽ từng
       nét bằng ngón tay, viết sai nhiều lần thì thư viện gợi ý nét đúng
     - Xem mẫu: chữ tự vẽ lại từng nét theo đúng thứ tự, vẽ xong thì tự quay
       về chế độ viết
     - Viết lại: xoá nét đã viết, viết lại từ đầu

   Dữ liệu nét nằm trong public/du-lieu/net-viet/ (do npm run dung-net-viet tạo):
     trung/<chữ>.json  nét của chữ giản thể
     nhat/<chữ>.json   nét của chữ Nhật (thứ tự nét chuẩn Nhật)

   Khi hoàn thành một lần tập viết, kết quả (số lần, số nét sai) được ghi nhận cho
   người đã đăng nhập; chế độ khách không lưu. Viết xong mà không phải nhờ gợi ý
   thì tính là làm ĐÚNG chữ đó (ghi vào nhật ký; dùng cho bước Tập viết của
   Bài hôm nay và cho Review).
   ============================================================================= */

import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BieuTuong from "./BieuTuong.jsx";

const GOC_NET = `${import.meta.env.BASE_URL}du-lieu/net-viet/`;
const CO_KHUNG = 280; // cạnh khung vuông, tính theo pixel

/** Đọc một màu từ bảng màu (tokens.css) để không viết màu trực tiếp ở đây. */
function docMau(ten) {
  // Đọc qua một thẻ tạm để trình duyệt tự giải các biến lồng nhau
  // (ví dụ --vien: var(--lantern-vien)) ra một màu rgb()/rgba() cụ thể mà
  // HanziWriter đọc được.
  const tam = document.createElement("span");
  tam.style.color = `var(${ten})`;
  document.body.appendChild(tam);
  const mau = getComputedStyle(tam).color;
  tam.remove();
  return mau;
}

/**
 * @param {string} idChu     Mã chữ trong dữ liệu (ví dụ "han-0001"), để lưu kết quả
 * @param {string} chu       Chữ cần tập viết
 * @param {string} ngonNgu   "trung" hoặc "nhat", quyết định dùng bộ nét nào
 * @param {Function} [khiXong]  Gọi khi viết xong, nhận true nếu KHÔNG cần gợi ý
 * @param {ReactNode} [nutChuyen] Nút chuyển chữ của bước Tập viết (quyết định
 *   18.54). Có nút này thì Xem mẫu / Viết lại thu thành 2 nút tròn chỉ có biểu
 *   tượng, cùng nút chuyển nằm trên một thanh CỐ ĐỊNH phía trên thanh tab dưới
 *   (nút chuyển bên phải), để không nút nào che nút nào trên màn hình thấp.
 */
export default function KhungTapViet({ idChu, chu, ngonNgu, khiXong, nutChuyen = null }) {
  const nd = useNguoiDung();
  const oVe = useRef(null);
  const nguoiViet = useRef(null);
  const daCanGoiY = useRef(false); // có nét nào sai tới mức hiện gợi ý chưa
  // Trạng thái: cho-du-lieu | dang-xem | dang-tap | xong | khong-co
  const [trangThai, setTrangThai] = useState("cho-du-lieu");
  const [thongBao, setThongBao] = useState("");
  // Hàm tapViet của lần vẽ mới nhất, để khi tải xong nét (xảy ra sau) thì gọi
  // đúng bản đang dùng props mới nhất
  const tapVietMoiNhat = useRef(null);
  useEffect(() => {
    tapVietMoiNhat.current = tapViet;
  });

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
      // Tải xong nét thì vào chế độ viết luôn
      onLoadCharDataSuccess: () => conSong && tapVietMoiNhat.current?.(),
      onLoadCharDataError: () => conSong && setTrangThai("khong-co"),
      showCharacter: false, // không hiện chữ đậm lúc mở, chỉ hiện khung mờ
      showOutline: true, // khung mờ của chữ, là "gợi ý" nền để tô theo
      showHintAfterMisses: 3, // viết sai 3 lần một nét thì gợi ý nét đúng
      strokeAnimationSpeed: 1.2,
      delayBetweenStrokes: 250,
      strokeColor: docMau("--chu"),
      outlineColor: docMau("--net-goi-y"), // khung mờ của chữ (tokens.css)
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
      // Vẽ mẫu xong thì tự quay về chế độ viết
      onComplete: () => nguoiViet.current && tapVietMoiNhat.current?.(),
    });
  }

  function tapViet() {
    const nguoi = nguoiViet.current;
    if (!nguoi) return;
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
  // Nút tròn chỉ có biểu tượng, trên thanh cố định (có nền để nổi trên nội dung)
  const nutTron =
    "border-vien bg-nen-noi inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-[0_4px_16px_var(--bong)] disabled:opacity-40";
  const tat = rangBuoc || trangThai === "dang-xem";

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

      {nutChuyen ? (
        <>
          {/* Thanh cố định. Trang cha tự chừa chỗ ở CUỐI trang (khoảng h-16)
              để thanh này không che nội dung khi cuộn xuống hết. */}
          <div
            className="fixed inset-x-0 z-40 flex items-center justify-between gap-2 px-4"
            style={{ bottom: "calc(var(--cao-thanh-duoi) + env(safe-area-inset-bottom) + 0.625rem)" }}
          >
            <div className="flex gap-2">
              <button type="button" onClick={xemMau} disabled={tat} aria-label="Xem mẫu" title="Xem mẫu" className={nutTron}>
                <BieuTuong ten="xem-mau" co={20} />
              </button>
              <button type="button" onClick={tapViet} disabled={tat} aria-label="Viết lại" title="Viết lại" className={nutTron}>
                <BieuTuong ten="lam-lai" co={20} />
              </button>
            </div>
            {nutChuyen}
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={xemMau} disabled={tat} className={`border-vien ${nutChung}`}>
            <BieuTuong ten="xem-mau" co={16} />
            Xem mẫu
          </button>
          {/* Nút phụ (viền): vào là viết được ngay, nút này chỉ để viết lại */}
          <button type="button" onClick={tapViet} disabled={tat} className={`border-vien ${nutChung}`}>
            <BieuTuong ten="lam-lai" co={16} />
            Viết lại
          </button>
        </div>
      )}
    </div>
  );
}
