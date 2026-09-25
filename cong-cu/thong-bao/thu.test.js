/* =============================================================================
   KIỂM THỬ LOGIC THÔNG BÁO
   =============================================================================
   CÁCH CHẠY:  npm run thu-thong-bao
   Không cần mạng, không cần Firebase: chỉ kiểm tra phần soạn nội dung.
   ============================================================================= */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { TONG_BUOC } from "../../src/luyen-tap/cacBuoc.js";
import {
  CAU_CHAO,
  cauChaoTheoNgay,
  cauTheoMuc,
  CAU_14H,
  CAU_21H,
  khungDenHan,
  khungGio,
  ngayCuaKhung,
  ngayVietNam,
  phanTramTienDo,
  soanCho,
  thongBao7h,
} from "./soanThongBao.js";

const bang = JSON.parse(
  await readFile(new URL("../../public/du-lieu/ngay-dac-biet.json", import.meta.url), "utf8"),
);

test("quay vòng 10 câu chào theo ngày", () => {
  assert.equal(cauChaoTheoNgay("2026-01-01"), CAU_CHAO[0]);
  assert.equal(cauChaoTheoNgay("2026-01-02"), CAU_CHAO[1]);
  assert.equal(cauChaoTheoNgay("2026-01-10"), CAU_CHAO[9]);
  assert.equal(cauChaoTheoNgay("2026-01-11"), CAU_CHAO[0], "ngày thứ 11 quay lại câu 1");
  // Sang năm mới KHÔNG reset về câu 1
  assert.equal(cauChaoTheoNgay("2027-01-01"), CAU_CHAO[365 % 10]);
  // Ngày trước mốc vẫn ra câu hợp lệ (không âm)
  assert.ok(CAU_CHAO.includes(cauChaoTheoNgay("2025-12-25")));
});

test("ngày đặc biệt thay cho câu chào", () => {
  const tet = thongBao7h("2026-02-17", bang.danhSach);
  assert.equal(tet.dip.ten, "Tết Nguyên đán");
  assert.equal(
    tet.than,
    "Bạn có biết hôm nay là Tết Nguyên đán (Việt Nam) không? Hãy mở Riyi để có một ngày Tết hoàn hảo nhé!",
  );
  const thuong = thongBao7h("2026-02-18", bang.danhSach);
  assert.equal(thuong.dip, null);
  assert.ok(CAU_CHAO.includes(thuong.than));
});

test("một ngày chỉ có một dịp, ưu tiên Việt Nam → Trung Quốc → Nhật Bản", () => {
  const dem = {};
  for (const m of bang.danhSach) dem[m.ngay] = (dem[m.ngay] ?? 0) + 1;
  assert.ok(Object.values(dem).every((n) => n === 1), "không được có 2 dịp cùng ngày");
  // 1/1 là cả Tết Dương lịch (VN) và 元日 (Nhật): giữ Việt Nam
  assert.equal(thongBao7h("2026-01-01", bang.danhSach).dip.quocGia, "Việt Nam");
  // 17/2/2026 là Tết ta và 春节: giữ Việt Nam
  assert.equal(thongBao7h("2026-02-17", bang.danhSach).dip.quocGia, "Việt Nam");
});

test("phần trăm tiến độ theo lộ trình", () => {
  assert.equal(phanTramTienDo(null, "2026-03-05"), 0);
  assert.equal(phanTramTienDo({ ngay: "2026-03-05", buoc: [] }, "2026-03-05"), 0);
  // Bài của hôm qua thì không tính là tiến độ hôm nay
  assert.equal(phanTramTienDo({ ngay: "2026-03-04", buoc: ["tu-the"] }, "2026-03-05"), 0);
  const nua = Math.floor((Math.floor(TONG_BUOC / 2) / TONG_BUOC) * 100);
  const buocNua = Array.from({ length: Math.floor(TONG_BUOC / 2) }, (_, i) => `b${i}`);
  assert.equal(phanTramTienDo({ ngay: "2026-03-05", buoc: buocNua }, "2026-03-05"), nua);
  const duBuoc = Array.from({ length: TONG_BUOC }, (_, i) => `b${i}`);
  assert.equal(phanTramTienDo({ ngay: "2026-03-05", buoc: duBuoc }, "2026-03-05"), 100);
  // Học trước bài sau: nhiều bước hơn tổng vẫn chỉ 100%
  assert.equal(
    phanTramTienDo({ ngay: "2026-03-05", buoc: [...duBuoc, "them"] }, "2026-03-05"),
    100,
  );
});

test("chọn câu theo mốc phần trăm", () => {
  assert.equal(cauTheoMuc(CAU_14H, 0), CAU_14H[0].cau);
  assert.equal(cauTheoMuc(CAU_14H, 1), CAU_14H[1].cau);
  assert.equal(cauTheoMuc(CAU_14H, 49), CAU_14H[1].cau);
  assert.equal(cauTheoMuc(CAU_14H, 50), CAU_14H[2].cau);
  assert.equal(cauTheoMuc(CAU_14H, 69), CAU_14H[2].cau);
  assert.equal(cauTheoMuc(CAU_14H, 70), CAU_14H[3].cau);
  assert.equal(cauTheoMuc(CAU_14H, 99), CAU_14H[3].cau);
  assert.equal(cauTheoMuc(CAU_14H, 100), CAU_14H[4].cau);
  assert.equal(cauTheoMuc(CAU_21H, 100), CAU_21H[4].cau);
  assert.ok(CAU_21H[0].cau.includes("giấc mơ"), "câu 21h nói về giấc mơ");
});

test("tiêu đề có đúng phần trăm", () => {
  const duBuoc = Array.from({ length: TONG_BUOC }, (_, i) => `b${i}`);
  const kq = soanCho("14h", {
    ngay: "2026-03-05",
    loTrinh: { ngay: "2026-03-05", buoc: duBuoc },
    ngayDacBiet: bang.danhSach,
  });
  assert.equal(kq.tieuDe, "Riyi – Tiến độ hôm nay: 100%");
});

test("ranh giới ngày theo giờ Việt Nam", () => {
  // 23:59 ngày 5/3 giờ VN = 16:59 UTC cùng ngày
  assert.equal(ngayVietNam(new Date("2026-03-05T16:59:00Z")), "2026-03-05");
  // 00:01 ngày 6/3 giờ VN = 17:01 UTC ngày 5/3
  assert.equal(ngayVietNam(new Date("2026-03-05T17:01:00Z")), "2026-03-06");
});

test("GitHub chạy trễ vẫn lấy đúng ngày của khung giờ", () => {
  // Khung 21h ngày 5/3 bị trễ tới 1h18 sáng 6/3 giờ VN (18:18 UTC ngày 5/3)
  assert.equal(ngayCuaKhung("21h", new Date("2026-03-05T18:18:00Z")), "2026-03-05");
  // Khung 7h trễ tới 10h51 cùng ngày: vẫn là ngày đó
  assert.equal(ngayCuaKhung("7h", new Date("2026-03-06T03:51:00Z")), "2026-03-06");
  // Khung 14h trễ tới 19h32: vẫn là ngày đó
  assert.equal(ngayCuaKhung("14h", new Date("2026-03-06T12:32:00Z")), "2026-03-06");
});

test("khung giờ tính theo giờ Việt Nam", () => {
  assert.equal(khungGio(new Date("2026-03-05T00:05:00Z")), "7h"); // 7h05 VN
  assert.equal(khungGio(new Date("2026-03-05T07:05:00Z")), "14h"); // 14h05 VN
  assert.equal(khungGio(new Date("2026-03-05T14:05:00Z")), "21h"); // 21h05 VN
  assert.equal(khungGio(new Date("2026-03-05T03:00:00Z")), null); // 10h VN
});

test("cron-job.org gọi 5 phút một lần: gửi đúng một lần mỗi khung", () => {
  // 7h03 VN (00:03 UTC), chưa gửi gì: tới hạn khung 7h
  assert.deepEqual(khungDenHan(new Date("2026-03-05T00:03:00Z"), {}), {
    khung: "7h",
    ngay: "2026-03-05",
    khoa: "2026-03-05-7h",
  });
  // Lần gọi 5 phút sau thấy đã gửi rồi thì bỏ qua
  assert.equal(khungDenHan(new Date("2026-03-05T00:08:00Z"), { "2026-03-05-7h": true }), null);
  // 6h58 VN: chưa tới 7h
  assert.equal(khungDenHan(new Date("2026-03-04T23:58:00Z"), {}), null);
  // 14h01 và 21h00 VN
  assert.equal(khungDenHan(new Date("2026-03-05T07:01:00Z"), {}).khung, "14h");
  assert.equal(khungDenHan(new Date("2026-03-05T14:00:00Z"), {}).khung, "21h");
  // 21h ngày hôm qua đã gửi KHÔNG làm 21h hôm nay bị bỏ qua
  assert.equal(khungDenHan(new Date("2026-03-05T14:00:00Z"), { "2026-03-04-21h": true }).khung, "21h");
});

test("hẹn giờ ngừng lâu thì không gửi nhắc học trễ quá 2 tiếng", () => {
  // 8h59 VN vẫn còn trong cửa sổ của 7h
  assert.equal(khungDenHan(new Date("2026-03-05T01:59:00Z"), {}).khung, "7h");
  // 9h00 VN: quá 2 tiếng, bỏ khung 7h
  assert.equal(khungDenHan(new Date("2026-03-05T02:00:00Z"), {}), null);
  // 23h30 VN: quá cửa sổ 21h
  assert.equal(khungDenHan(new Date("2026-03-05T16:30:00Z"), {}), null);
});
