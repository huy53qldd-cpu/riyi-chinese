/* =============================================================================
   PHÁO HOA KHI BẤM (GĐ 11, quyết định 18.41)
   =============================================================================

   Chỉ chạy ở theme "Hoa Đăng Dạ Nguyệt" (mã den-long). Bấm vào nút hay ô bấm được thì một chùm pháo
   hoa nhỏ bung ra ĐÚNG chỗ ngón tay chạm; xong mục tiêu ngày thì bắn một chùm
   lớn ở giữa màn hình.

   Ba điều quan trọng về cách làm:

     1. KHÔNG làm chậm thao tác. Thành phần này chỉ NGHE sự kiện ở lớp ngoài
        cùng (pointerdown, giai đoạn "bắt"), không bọc quanh nút nào, không
        chặn sự kiện. Nút vẫn chạy ngay như thường, pháo hoa vẽ song song.

     2. NHẸ cho máy yếu. Vẽ trên MỘT thẻ canvas duy nhất, mỗi chùm tối đa 14
        hạt, tự dừng vòng vẽ khi hết hạt. Không tạo thẻ HTML mới cho mỗi lần
        bấm. Đang có quá nhiều hạt thì bỏ qua lần bấm mới.

     3. TÔN TRỌNG người dùng. Máy bật "Giảm chuyển động" (prefers-reduced-motion)
        hoặc người dùng tắt công tắc trong Cài đặt thì không vẽ gì cả.

   Không bắn pháo hoa ở ô nhập chữ, thanh kéo và vùng tập viết, để không vướng
   lúc đang viết chữ Hán.
   ============================================================================= */

import { useEffect, useRef } from "react";

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";

const MAU = ["--phao-hoa-1", "--phao-hoa-2", "--phao-hoa-3"];
const SO_HAT_NHO = 14;
const SO_HAT_LON = 46;
const TOI_DA_HAT = 120; // trần an toàn cho máy yếu
const SONG = 800; // hạt sống tối đa 0,8 giây

/** Chỗ vừa bấm có đáng bắn pháo hoa không. */
function dangBan(dich) {
  if (!(dich instanceof Element)) return false;
  // Ô nhập chữ, thanh kéo, vùng tập viết: để yên cho người dùng thao tác
  if (dich.closest("input, textarea, select, canvas, [data-khong-phao-hoa]")) return false;
  return Boolean(dich.closest('button, a, [role="button"], [role="radio"], summary'));
}

export default function PhaoHoa() {
  const nd = useNguoiDung();
  const canvasRef = useRef(null);
  const hatRef = useRef([]);
  const khungRef = useRef(0);
  const batRef = useRef(false);

  // Bật khi: đang dùng theme đèn lồng đỏ, công tắc đang bật, máy không giảm chuyển động
  const giamChuyenDong =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const bat =
    nd.caiDat.giaoDien === "den-long" && nd.caiDat.phaoHoa !== "tat" && !giamChuyenDong;
  batRef.current = bat;

  useEffect(() => {
    if (!bat) {
      hatRef.current = [];
      return undefined;
    }

    const canvas = canvasRef.current;
    const ve = canvas.getContext("2d");
    let tiLe = Math.min(window.devicePixelRatio || 1, 2);

    function doLaiCo() {
      tiLe = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * tiLe);
      canvas.height = Math.floor(window.innerHeight * tiLe);
    }
    doLaiCo();

    const mau = () => {
      const kieu = getComputedStyle(document.documentElement);
      return MAU.map((ten) => kieu.getPropertyValue(ten).trim() || "#ffd24a");
    };
    let bangMau = mau();

    function chay() {
      const bayGio = performance.now();
      ve.clearRect(0, 0, canvas.width, canvas.height);
      const conLai = [];
      for (const h of hatRef.current) {
        const tuoi = bayGio - h.batDau;
        if (tuoi >= h.song) continue;
        const t = tuoi / 1000;
        const x = (h.x + h.vx * t) * tiLe;
        const y = (h.y + h.vy * t + 520 * t * t) * tiLe; // rơi xuống do trọng lực
        const mo = 1 - tuoi / h.song;
        ve.globalAlpha = mo;
        ve.fillStyle = h.mau;
        ve.beginPath();
        ve.arc(x, y, h.co * tiLe * mo, 0, Math.PI * 2);
        ve.fill();
        conLai.push(h);
      }
      ve.globalAlpha = 1;
      hatRef.current = conLai;
      // Hết hạt thì dừng hẳn vòng vẽ, không chiếm CPU khi không có gì để vẽ
      khungRef.current = conLai.length ? requestAnimationFrame(chay) : 0;
    }

    function ban(x, y, soHat, toDan = 1) {
      if (!batRef.current) return;
      if (hatRef.current.length > TOI_DA_HAT) return;
      const bayGio = performance.now();
      for (let i = 0; i < soHat; i += 1) {
        const goc = (Math.PI * 2 * i) / soHat + Math.random() * 0.4;
        const toc = (70 + Math.random() * 90) * toDan;
        hatRef.current.push({
          x,
          y,
          vx: Math.cos(goc) * toc,
          vy: Math.sin(goc) * toc - 40 * toDan,
          co: (1.8 + Math.random() * 1.6) * toDan,
          mau: bangMau[i % bangMau.length],
          batDau: bayGio,
          song: (soHat > SO_HAT_NHO ? SONG : 600) + Math.random() * 120,
        });
      }
      if (!khungRef.current) khungRef.current = requestAnimationFrame(chay);
    }

    function khiCham(su) {
      if (!dangBan(su.target)) return;
      bangMau = mau();
      ban(su.clientX, su.clientY, SO_HAT_NHO);
    }

    function khiXongMucTieu() {
      bangMau = mau();
      // Chùm lớn: hai đợt lệch nhau một chút cho giống pháo hoa thật
      ban(window.innerWidth / 2, window.innerHeight * 0.38, SO_HAT_LON, 1.6);
      setTimeout(() => ban(window.innerWidth * 0.35, window.innerHeight * 0.3, 24, 1.3), 180);
      setTimeout(() => ban(window.innerWidth * 0.68, window.innerHeight * 0.32, 24, 1.3), 320);
    }

    // Giai đoạn "bắt" (true) để luôn nhận được sự kiện, kể cả khi nút tự xử lý
    document.addEventListener("pointerdown", khiCham, true);
    window.addEventListener("resize", doLaiCo);
    window.addEventListener("riyi-phao-hoa-lon", khiXongMucTieu);

    return () => {
      document.removeEventListener("pointerdown", khiCham, true);
      window.removeEventListener("resize", doLaiCo);
      window.removeEventListener("riyi-phao-hoa-lon", khiXongMucTieu);
      if (khungRef.current) cancelAnimationFrame(khungRef.current);
      khungRef.current = 0;
      hatRef.current = [];
    };
  }, [bat]);

  // Vừa đạt mục tiêu ngày (9/9 bước): bắn một chùm lớn, một lần
  const lanDat = nd.lanVuaDat ?? 0;
  useEffect(() => {
    if (bat && lanDat > 0) banPhaoHoaLon();
  }, [bat, lanDat]);

  if (!bat) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
}

/** Bắn chùm pháo hoa lớn (dùng khi vừa xong 100% mục tiêu ngày). */
export function banPhaoHoaLon() {
  window.dispatchEvent(new Event("riyi-phao-hoa-lon"));
}
