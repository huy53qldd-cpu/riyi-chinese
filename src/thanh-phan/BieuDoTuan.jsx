/* =============================================================================
   BIỂU ĐỒ CỘT: TUẦN NÀY SO VỚI TUẦN TRƯỚC (tab Review)
   =============================================================================

   Mỗi ngày (T2 → CN) có hai cột đứng cạnh nhau: tuần trước và tuần đang xem.
   Chạm hoặc rê chuột vào một ngày để xem số cụ thể. Dưới biểu đồ có bảng số
   liệu cho ai cần đọc số (và cho trình đọc màn hình).

   Màu hai cột lấy từ tokens.css (--bieu-do-tuan-nay, --bieu-do-tuan-truoc), đã
   kiểm tra phân biệt được với người mù màu ở cả theme sáng và tối. Chữ không
   bao giờ mang màu cột, luôn dùng màu chữ chính/phụ.
   ============================================================================= */

import { useState } from "react";

const THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// Kích thước trong hệ toạ độ SVG (co giãn theo chiều rộng màn hình)
const RONG = 340;
const CAO = 170;
const LE_TRAI = 28;
const LE_DUOI = 22;
const LE_TREN = 10;
const CAO_VE = CAO - LE_DUOI - LE_TREN;
const RONG_NHOM = (RONG - LE_TRAI) / 7;
const RONG_COT = 12;
const KHE = 2; // khe hở giữa hai cột cạnh nhau

/** Chọn các mốc trục tròn số: 0, bước, 2 bước... */
function mocTruc(lonNhat) {
  if (lonNhat <= 4) return [0, 2, 4];
  const buocTho = lonNhat / 3;
  const muoi = 10 ** Math.floor(Math.log10(buocTho));
  const buoc = [1, 2, 5, 10].map((x) => x * muoi).find((x) => x >= buocTho);
  const ra = [];
  for (let v = 0; v <= lonNhat + buoc - 1; v += buoc) ra.push(v);
  return ra;
}

/** Đường dẫn cột có 4px bo tròn ở đầu trên, đáy vuông. */
function duongCot(x, y, rong, cao) {
  if (cao <= 0) return "";
  const r = Math.min(4, cao, rong / 2);
  return `M${x},${y + cao}V${y + r}Q${x},${y} ${x + r},${y}H${x + rong - r}Q${x + rong},${y} ${x + rong},${y + r}V${y + cao}Z`;
}

/**
 * @param {number[]} tuanNay    7 giá trị, T2 → CN
 * @param {number[]} tuanTruoc  7 giá trị, T2 → CN
 * @param {string}   donVi      ví dụ "từ", "phút"
 * @param {number}   soNgayDaQua  số ngày của tuần đang xem đã tới (tuần hiện tại
 *                   thì các ngày sau hôm nay chưa tới, không vẽ cột)
 */
export default function BieuDoTuan({ tuanNay, tuanTruoc, donVi, soNgayDaQua = 7 }) {
  const [dangXem, setDangXem] = useState(null); // chỉ số ngày đang chạm

  const lonNhat = Math.max(1, ...tuanNay, ...tuanTruoc);
  const moc = mocTruc(lonNhat);
  const dinh = moc.at(-1);
  const yCua = (v) => LE_TREN + CAO_VE - (v / dinh) * CAO_VE;

  return (
    <figure className="m-0 flex flex-col gap-2">
      {/* Chú giải: luôn có vì có hai chuỗi số liệu */}
      <figcaption className="flex flex-wrap gap-4 text-[length:var(--co-chu-latin-nho)] font-semibold">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--bieu-do-tuan-truoc)" }} />
          Tuần trước
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--bieu-do-tuan-nay)" }} />
          Tuần này
        </span>
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${RONG} ${CAO}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Biểu đồ số ${donVi} mỗi ngày, tuần này so với tuần trước. Số liệu chi tiết ở bảng bên dưới.`}
          onPointerLeave={() => setDangXem(null)}
        >
          {/* Lưới ngang mảnh, màu nhạt */}
          {moc.map((v) => (
            <g key={v}>
              <line
                x1={LE_TRAI}
                x2={RONG}
                y1={yCua(v)}
                y2={yCua(v)}
                stroke="var(--vien)"
                strokeWidth="1"
              />
              <text
                x={LE_TRAI - 6}
                y={yCua(v) + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--chu-mo)"
              >
                {v}
              </text>
            </g>
          ))}

          {THU.map((thu, i) => {
            const giua = LE_TRAI + RONG_NHOM * i + RONG_NHOM / 2;
            const xTruoc = giua - RONG_COT - KHE / 2;
            const xNay = giua + KHE / 2;
            const chuaToi = i >= soNgayDaQua;
            return (
              <g key={thu}>
                {/* Nền mờ khi đang chạm vào ngày này */}
                {dangXem === i && (
                  <rect
                    x={giua - RONG_NHOM / 2 + 2}
                    y={LE_TREN}
                    width={RONG_NHOM - 4}
                    height={CAO_VE}
                    rx="4"
                    fill="var(--nen-phu)"
                  />
                )}
                <path
                  d={duongCot(xTruoc, yCua(tuanTruoc[i]), RONG_COT, CAO_VE + LE_TREN - yCua(tuanTruoc[i]))}
                  fill="var(--bieu-do-tuan-truoc)"
                />
                {!chuaToi && (
                  <path
                    d={duongCot(xNay, yCua(tuanNay[i]), RONG_COT, CAO_VE + LE_TREN - yCua(tuanNay[i]))}
                    fill="var(--bieu-do-tuan-nay)"
                  />
                )}
                <text
                  x={giua}
                  y={CAO - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={dangXem === i ? 800 : 600}
                  fill={dangXem === i ? "var(--chu)" : "var(--chu-mo)"}
                >
                  {thu}
                </text>
                {/* Vùng chạm rộng bằng cả cột ngày, lớn hơn nhiều so với cột */}
                <rect
                  x={giua - RONG_NHOM / 2}
                  y={0}
                  width={RONG_NHOM}
                  height={CAO}
                  fill="transparent"
                  onPointerEnter={() => setDangXem(i)}
                  onPointerDown={() => setDangXem(i)}
                />
              </g>
            );
          })}
          {/* Đường đáy */}
          <line
            x1={LE_TRAI}
            x2={RONG}
            y1={LE_TREN + CAO_VE}
            y2={LE_TREN + CAO_VE}
            stroke="var(--vien-dam)"
            strokeWidth="1"
          />
        </svg>

        {/* Ô số liệu khi chạm vào một ngày */}
        {dangXem !== null && (
          <div
            role="status"
            className="border-vien bg-nen-noi pointer-events-none absolute top-0 rounded-[var(--bo-goc-nho)] border px-3 py-1.5 text-[length:var(--co-chu-latin-nho)] shadow-[0_2px_8px_var(--bong)]"
            style={{
              left: `${((LE_TRAI + RONG_NHOM * dangXem + RONG_NHOM / 2) / RONG) * 100}%`,
              transform: `translateX(${dangXem < 2 ? "-10%" : dangXem > 4 ? "-90%" : "-50%"})`,
            }}
          >
            <p className="m-0 font-bold">{THU[dangXem]}</p>
            <p className="m-0 flex items-center gap-1.5 tabular-nums">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--bieu-do-tuan-nay)" }} />
              Tuần này: {dangXem < soNgayDaQua ? `${tuanNay[dangXem]} ${donVi}` : "chưa tới"}
            </p>
            <p className="m-0 flex items-center gap-1.5 tabular-nums">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--bieu-do-tuan-truoc)" }} />
              Tuần trước: {tuanTruoc[dangXem]} {donVi}
            </p>
          </div>
        )}
      </div>

      {/* Bảng số liệu: cùng nội dung với biểu đồ, cho ai cần đọc số */}
      <details className="text-[length:var(--co-chu-latin-nho)]">
        <summary className="text-chu-mo cursor-pointer font-semibold">Xem dạng bảng</summary>
        <table className="mt-2 w-full border-collapse text-center tabular-nums">
          <thead>
            <tr className="text-chu-mo">
              <th className="py-1 text-left font-semibold">Ngày</th>
              {THU.map((t) => (
                <th key={t} className="py-1 font-semibold">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-vien border-t">
              <th className="py-1 text-left font-semibold">Tuần này</th>
              {tuanNay.map((v, i) => (
                <td key={i} className="py-1">{i < soNgayDaQua ? v : "–"}</td>
              ))}
            </tr>
            <tr className="border-vien border-t">
              <th className="py-1 text-left font-semibold">Tuần trước</th>
              {tuanTruoc.map((v, i) => (
                <td key={i} className="py-1">{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </details>
    </figure>
  );
}
