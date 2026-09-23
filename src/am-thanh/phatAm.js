/* =============================================================================
   RIYI — PHÁT ÂM
   =============================================================================

   ĐÂY LÀ NƠI DUY NHẤT TRONG TOÀN APP XỬ LÝ VIỆC PHÁT ÂM.

   Mọi nút loa, mọi ô bảng pinyin đều gọi vào hàm phatAm() bên dưới. Muốn đổi
   nguồn âm thanh thì CHỈ SỬA FILE NÀY, không đụng vào màn hình nào.

   NGUỒN ÂM THANH (GĐ 10, quyết định 18.28 và 18.37):
     - Âm tiết pinyin: giọng người thật, bộ audio-cmn (Chen Wang, CC BY-SA),
       file public/am-thanh/am-tiet/<âm tiết, ü viết là v><thanh 1-4>.mp3,
       tải bằng npm run tai-am-thanh. Mỗi âm tiết đủ 4 thanh.
     - TỪ tiếng Trung: cũng bộ audio-cmn, file public/am-thanh/tu/<từ>.mp3,
       tải bằng npm run tai-am-tu. KHÔNG phải từ nào cũng có ghi âm: danh sách
       từ có tiếng nằm ở public/am-thanh/tu/danh-sach.json. Màn hình hỏi bằng
       coAmTu() để ẨN nút loa ở từ chưa có, không để người học bấm vào bị câm.
     - CÂU tiếng Trung và tiếng Nhật: CHƯA có nguồn, báo "đang được chuẩn bị".
   ============================================================================= */

/**
 * Các loại nội dung app có thể cần phát âm.
 * Dùng hằng số thay vì gõ chuỗi trực tiếp, để không gõ sai chính tả.
 */
export const NGON_NGU = {
  TRUNG: "zh-CN",
  NHAT: "ja-JP",
  // Âm tiết pinyin dạng "ma1", nhiều âm tiết cách nhau bằng dấu cách thì đọc lần lượt
  AM_TIET: "am-tiet",
};

// Dùng MỘT thẻ audio cho cả app: trên iPhone, thẻ đã được "mở khoá" bằng một
// lần chạm thì các lần phát tiếp theo (kể cả đọc lần lượt 4 thanh) không bị chặn.
let theAmThanh = null;
let dangPhat = false;
let luotHienTai = 0; // tăng mỗi lần phát mới, để lượt cũ đang đọc dở tự dừng
let baoLuotTruoc = null; // hàm khiDoc của lượt đang phát, để báo nó dừng khi bị chen

export function dangPhatAm() {
  return dangPhat;
}

/* -----------------------------------------------------------------------------
   DANH SÁCH TỪ CÓ GHI ÂM (public/am-thanh/tu/danh-sach.json)
   Tải một lần cho cả app. Tải hỏng thì coi như chưa từ nào có tiếng, nút loa
   ẩn đi chứ không báo lỗi giữa lúc đang học.
   ----------------------------------------------------------------------------- */
let tuCoAm = null; // Set các từ có file, null = chưa tải xong
let loiHuaTuCoAm = null;

export function taiDanhSachAmTu() {
  if (!loiHuaTuCoAm) {
    loiHuaTuCoAm = fetch("/am-thanh/tu/danh-sach.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("khong-tai-duoc"))))
      .then((d) => {
        tuCoAm = new Set(d.coFile ?? []);
        return tuCoAm;
      })
      .catch(() => {
        tuCoAm = new Set();
        return tuCoAm;
      });
  }
  return loiHuaTuCoAm;
}

/* Danh sách ÂM TIẾT có ghi âm (public/am-thanh/am-tiet/danh-sach.json), dùng
   cho bài luyện nghe: chỉ hỏi những âm tiết chắc chắn phát ra tiếng. */
let amTietCoAm = null; // Set dạng "hao3"
let loiHuaAmTiet = null;

export function taiDanhSachAmTiet() {
  if (!loiHuaAmTiet) {
    loiHuaAmTiet = fetch("/am-thanh/am-tiet/danh-sach.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("khong-tai-duoc"))))
      .then((d) => {
        amTietCoAm = new Set(d.coFile ?? []);
        return amTietCoAm;
      })
      .catch(() => {
        amTietCoAm = new Set();
        return amTietCoAm;
      });
  }
  return loiHuaAmTiet;
}

/** Âm tiết dạng "hao3" có file không? Chưa tải xong thì trả về null. */
export function coAmTiet(khoa) {
  if (!khoa) return false;
  if (!amTietCoAm) {
    taiDanhSachAmTiet();
    return null;
  }
  return amTietCoAm.has(khoa);
}

/** Từ này có ghi âm không? Chưa tải xong danh sách thì trả về null. */
export function coAmTu(tu) {
  if (!tu) return false;
  if (!tuCoAm) {
    taiDanhSachAmTu();
    return null;
  }
  return tuCoAm.has(String(tu).trim());
}

function layThe() {
  if (!theAmThanh) theAmThanh = new Audio();
  return theAmThanh;
}

/** Phát một file, chờ phát xong. Ném lỗi nếu không phát được. */
function phatMotFile(duongDan) {
  return new Promise((xong, loi) => {
    const the = layThe();
    const donDep = () => {
      the.onended = null;
      the.onerror = null;
    };
    the.onended = () => {
      donDep();
      xong();
    };
    the.onerror = () => {
      donDep();
      loi(new Error("khong-tai-duoc"));
    };
    the.src = duongDan;
    the.play().catch((e) => {
      donDep();
      loi(e);
    });
  });
}

/**
 * HÀM PHÁT ÂM DUY NHẤT CỦA APP.
 *
 * @param {string} noiDung   Âm tiết pinyin ("ma1", hoặc "ma1 ma2 ma3 ma4" để đọc
 *                           lần lượt), hoặc chữ cần đọc ("你好", "こんにちは").
 * @param {string} ngonNgu   NGON_NGU.AM_TIET, NGON_NGU.TRUNG hoặc NGON_NGU.NHAT.
 * @param {(viTri: number|null) => void} [khiDoc]  Không bắt buộc. Được gọi với vị trí
 *                           âm tiết (0, 1, 2…) lúc bắt đầu đọc âm đó, và với null khi
 *                           đọc xong hoặc bị lượt phát khác chen ngang. Dùng để làm
 *                           sáng nút đang được đọc.
 * @returns {Promise<{thanhCong: boolean, thongBao: string|null}>}
 *          thanhCong = false kèm thongBao tiếng Việt khi chưa phát được.
 *
 * Hàm LUÔN trả về kết quả chứ không ném lỗi ra ngoài, để một nút loa hỏng
 * không bao giờ làm sập cả màn hình đang học.
 */
export async function phatAm(noiDung, ngonNgu = NGON_NGU.TRUNG, khiDoc = null) {
  if (!noiDung || !String(noiDung).trim()) {
    return { thanhCong: false, thongBao: "Không có nội dung để phát âm." };
  }

  // Từ tiếng Trung: có file ghi âm thì phát, không có thì báo rõ là chưa có
  if (ngonNgu === NGON_NGU.TRUNG) {
    const tu = String(noiDung).trim();
    await taiDanhSachAmTu();
    if (!coAmTu(tu)) {
      return { thanhCong: false, thongBao: "Từ này chưa có ghi âm." };
    }
    const luotTu = ++luotHienTai;
    baoLuotTruoc?.(null);
    baoLuotTruoc = khiDoc;
    dangPhat = true;
    try {
      khiDoc?.(0);
      await phatMotFile(`/am-thanh/tu/${encodeURIComponent(tu)}.mp3`);
      return { thanhCong: true, thongBao: null };
    } catch {
      if (luotTu !== luotHienTai) return { thanhCong: true, thongBao: null };
      return {
        thanhCong: false,
        thongBao: "Không phát được âm thanh. Hãy kiểm tra mạng và âm lượng rồi thử lại.",
      };
    } finally {
      if (luotTu === luotHienTai) {
        dangPhat = false;
        baoLuotTruoc = null;
        khiDoc?.(null);
      }
    }
  }

  if (ngonNgu !== NGON_NGU.AM_TIET) {
    return { thanhCong: false, thongBao: "Chức năng phát âm câu và tiếng Nhật đang được chuẩn bị." };
  }

  const cacAmTiet = String(noiDung).trim().split(/\s+/);
  if (!cacAmTiet.every((a) => /^[a-zv]+[1-4]$/.test(a))) {
    return { thanhCong: false, thongBao: "Âm tiết không hợp lệ." };
  }

  const luot = ++luotHienTai;
  baoLuotTruoc?.(null); // lượt cũ bị chen: tắt nút đang sáng của nó
  baoLuotTruoc = khiDoc;
  dangPhat = true;
  try {
    for (const [viTri, am] of cacAmTiet.entries()) {
      if (luot !== luotHienTai) break; // đã có lượt phát mới chen vào
      khiDoc?.(viTri);
      await phatMotFile(`/am-thanh/am-tiet/${am}.mp3`);
      // Nghỉ một chút giữa các thanh cho dễ nghe
      if (cacAmTiet.length > 1) await new Promise((r) => setTimeout(r, 250));
    }
    return { thanhCong: true, thongBao: null };
  } catch {
    if (luot !== luotHienTai) return { thanhCong: true, thongBao: null };
    return {
      thanhCong: false,
      thongBao: "Không phát được âm thanh. Hãy kiểm tra mạng và âm lượng rồi thử lại.",
    };
  } finally {
    if (luot === luotHienTai) {
      dangPhat = false;
      baoLuotTruoc = null;
      khiDoc?.(null);
    }
  }
}
