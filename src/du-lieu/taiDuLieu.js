/* =============================================================================
   TẢI DỮ LIỆU BÀI HỌC
   =============================================================================

   Dữ liệu bài học là file JSON tĩnh trong public/du-lieu/. App đọc
   manifest.json trước để biết file nào đã sẵn sàng, rồi mới tải file đó.
   Nhờ vậy thêm file mới (ví dụ chữ Hán HSK 2) chỉ cần bật "sanSang" trong
   manifest, không phải sửa code.
   ============================================================================= */

// Đường dẫn gốc của app. Dùng BASE_URL để sau này đổi nơi đặt app vẫn chạy.
const GOC = `${import.meta.env.BASE_URL}du-lieu/`;

// Nhớ kết quả đã tải để chuyển tab qua lại không tải lại
const boNho = new Map();

async function taiJson(tenFile) {
  if (!boNho.has(tenFile)) {
    // Lưu cả lời hứa (promise) chứ không chỉ kết quả, để hai nơi cùng xin một
    // file trong lúc đang tải thì chỉ tải một lần
    boNho.set(
      tenFile,
      fetch(GOC + tenFile).then((phanHoi) => {
        if (!phanHoi.ok) throw new Error("khong-tai-duoc");
        return phanHoi.json();
      }),
    );
  }
  try {
    return await boNho.get(tenFile);
  } catch (loi) {
    // Tải hỏng thì bỏ khỏi bộ nhớ để lần sau thử lại được
    boNho.delete(tenFile);
    throw loi;
  }
}

/**
 * Tải toàn bộ chữ Hán của những cấp đã có dữ liệu.
 * @returns {Promise<Array>} danh sách chữ Hán, gộp mọi cấp
 */
export async function taiChuHan() {
  const manifest = await taiJson("manifest.json");
  const cacFile = Object.entries(manifest.tep).filter(
    ([ten, tep]) => ten.startsWith("chu-han-hsk") && tep.sanSang,
  );
  const ketQua = await Promise.all(
    cacFile.map(([, tep]) => taiJson(tep.duongDan)),
  );
  return ketQua.flatMap((tep) => tep.danhSach);
}

/**
 * Tải dữ liệu đồng tự dị nghĩa (Tab B).
 * @returns {Promise<{luuYDauTab: string, danhSach: Array}>}
 */
export async function taiDongTuDiNghia() {
  const manifest = await taiJson("manifest.json");
  const tep = manifest.tep["dong-tu-di-nghia"];
  if (!tep?.sanSang) return { luuYDauTab: "", danhSach: [] };
  return taiJson(tep.duongDan);
}

/**
 * Tải từ vựng của mọi cấp đã có dữ liệu (Tab C).
 * @returns {Promise<{danhMucChuDe: Object, danhSach: Array}>}
 */
export async function taiTuVung() {
  const manifest = await taiJson("manifest.json");
  const cacFile = Object.entries(manifest.tep).filter(
    ([ten, tep]) => ten.startsWith("tu-vung-hsk") && tep.sanSang,
  );
  const ketQua = await Promise.all(
    cacFile.map(([, tep]) => taiJson(tep.duongDan)),
  );
  return {
    // Nhãn chủ đề nằm trong dữ liệu, các cấp dùng chung một bộ nhãn
    danhMucChuDe: Object.assign({}, ...ketQua.map((t) => t.danhMucChuDe)),
    danhSach: ketQua.flatMap((t) => t.danhSach),
  };
}

/**
 * Tải các điểm ngữ pháp của mọi cấp đã có dữ liệu (Tab F).
 * @returns {Promise<Array>} danh sách điểm ngữ pháp, gộp mọi cấp
 */
export async function taiNguPhap() {
  const manifest = await taiJson("manifest.json");
  const cacFile = Object.entries(manifest.tep).filter(
    ([ten, tep]) => ten.startsWith("ngu-phap-hsk") && tep.sanSang,
  );
  const ketQua = await Promise.all(
    cacFile.map(([, tep]) => taiJson(tep.duongDan)),
  );
  return ketQua.flatMap((tep) => tep.danhSach);
}
