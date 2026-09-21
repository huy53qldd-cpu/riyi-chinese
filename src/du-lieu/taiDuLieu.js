/* =============================================================================
   TẢI DỮ LIỆU BÀI HỌC
   =============================================================================

   Dữ liệu bài học là file JSON tĩnh trong public/du-lieu/. App đọc
   manifest.json trước để biết file nào đã sẵn sàng, rồi mới tải file đó.
   Nhờ vậy thêm file mới (ví dụ chữ Hán HSK 2) chỉ cần bật "sanSang" trong
   manifest, không phải sửa code.

   PHIÊN BẢN DỮ LIỆU (GĐ 8):
     - manifest.json luôn tải mới từ mạng, không dùng bản trình duyệt lưu sẵn.
     - Mỗi file bài học được tải kèm số phiên bản của nó (?v=2). Sửa dữ liệu thì
       TĂNG phienBan của file đó trong manifest.json (và phienBanDuLieu), trình
       duyệt sẽ coi đó là địa chỉ mới và bỏ bản cũ đã lưu.
     - Khi người dùng quay lại app sau một lúc, app kiểm tra lại manifest; có bản
       mới thì bỏ dữ liệu cũ trong bộ nhớ (kiemTraNoiDungMoi).
     - Nút "Cập nhật nội dung" trong Cài đặt gọi capNhatNoiDung().
   ============================================================================= */

// Đường dẫn gốc của app. Dùng BASE_URL để sau này đổi nơi đặt app vẫn chạy.
const GOC = `${import.meta.env.BASE_URL}du-lieu/`;

// Nhớ kết quả đã tải để chuyển tab qua lại không tải lại
const boNho = new Map();

/** Tải thẳng manifest.json từ mạng, bỏ qua mọi bản lưu sẵn. */
function taiManifestMoi() {
  return fetch(GOC + "manifest.json", { cache: "no-store" }).then((phanHoi) => {
    if (!phanHoi.ok) throw new Error("khong-tai-duoc");
    return phanHoi.json();
  });
}

/**
 * @param {string} tenFile
 * @param {number} [phienBan]  Số phiên bản của file, gắn vào địa chỉ tải
 */
async function taiJson(tenFile, phienBan) {
  if (!boNho.has(tenFile)) {
    // Lưu cả lời hứa (promise) chứ không chỉ kết quả, để hai nơi cùng xin một
    // file trong lúc đang tải thì chỉ tải một lần
    boNho.set(
      tenFile,
      tenFile === "manifest.json"
        ? taiManifestMoi()
        : fetch(`${GOC}${tenFile}?v=${phienBan ?? 0}`).then((phanHoi) => {
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
    cacFile.map(([, tep]) => taiJson(tep.duongDan, tep.phienBan)),
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
  return taiJson(tep.duongDan, tep.phienBan);
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
    cacFile.map(([, tep]) => taiJson(tep.duongDan, tep.phienBan)),
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
    cacFile.map(([, tep]) => taiJson(tep.duongDan, tep.phienBan)),
  );
  return ketQua.flatMap((tep) => tep.danhSach);
}

/* -----------------------------------------------------------------------------
   KIỂM TRA VÀ CẬP NHẬT NỘI DUNG
   ----------------------------------------------------------------------------- */

/** Phiên bản dữ liệu đang dùng (null nếu chưa tải manifest). */
export async function phienBanNoiDung() {
  try {
    return (await taiJson("manifest.json")).phienBanDuLieu;
  } catch {
    return null;
  }
}

/**
 * Hỏi lại manifest trên mạng. Có phiên bản dữ liệu mới hơn thì bỏ hết dữ liệu
 * cũ trong bộ nhớ, để các tab tải bản mới ở lần mở tiếp theo.
 * @returns {Promise<boolean>} true nếu có nội dung mới
 */
export async function kiemTraNoiDungMoi() {
  const cu = boNho.has("manifest.json") ? await phienBanNoiDung() : null;
  const moi = await taiManifestMoi();
  if (cu !== null && moi.phienBanDuLieu <= cu) return false;
  boNho.clear();
  boNho.set("manifest.json", Promise.resolve(moi));
  return cu !== null;
}

/**
 * Nút "Cập nhật nội dung" trong Cài đặt: bỏ hết dữ liệu trong bộ nhớ và tải
 * lại manifest mới nhất.
 * @returns {Promise<number>} phiên bản dữ liệu sau khi cập nhật
 */
export async function capNhatNoiDung() {
  boNho.clear();
  return (await taiJson("manifest.json")).phienBanDuLieu;
}
