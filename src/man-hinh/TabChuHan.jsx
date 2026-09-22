/* =============================================================================
   TAB A — CHỮ HÁN
   =============================================================================

   Hai màn hình nhỏ trong một tab:
     1. Danh sách (GĐ 10, quyết định 18.21):
        - Trên cùng: 5 chữ Hán hôm nay, theo bài đang học (lo-trinh.json)
        - Ba nút HSK 1 / HSK 2 / HSK 3, mỗi nút có thanh % chữ đã học của cấp đó
        - Nút "Xem toàn bộ chữ Hán HSK N" mở danh sách đủ của cấp đang chọn.
          Chữ ĐÃ HỌC (thuộc bài đã học xong, hoặc tự đánh dấu "Đã học") có
          viền nét đứt và mờ hơn chữ chưa học.
     2. Chi tiết một chữ (bấm vào thẻ để mở): 3 khung
          Khung 1: Giản thể (pinyin) · Kanji · Phồn thể
          Khung 2: Pinyin | Tiếng Nhật, rồi Hán Việt, nghĩa, số nét, bộ thủ
          Khung 3: Tập viết

   Thứ tự nội dung luôn là TRUNG → NHẬT → VIỆT. Mọi chữ Trung đi qua <ChuTrung>,
   mọi chữ Nhật đi qua <ChuNhat>, không viết chữ Hán trực tiếp ra màn hình.
   ============================================================================= */

import { useEffect, useMemo, useState } from "react";

import { taiChuHan, taiLoTrinh } from "../du-lieu/taiDuLieu.js";
import { layBai } from "../luyen-tap/baiHoc.js";
import { capChuHan } from "../luyen-tap/capLatThe.js";
import KhungChonLuyenTap from "../luyen-tap/KhungChonLuyenTap.jsx";
import TroChoiLatThe from "../luyen-tap/TroChoiLatThe.jsx";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import ChuNhat from "../thanh-phan/ChuNhat.jsx";
import ChuTrung, { ghepAmTiet } from "../thanh-phan/ChuTrung.jsx";
import KhungTapViet from "../thanh-phan/KhungTapViet.jsx";
import MucChuaKiemTra from "../thanh-phan/MucChuaKiemTra.jsx";
import NutDaHoc from "../thanh-phan/NutDaHoc.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";

// Nhãn so sánh tự dạng. Nhãn do người nhập liệu quyết định, không do code đoán.
const NHAN_TU_DANG = {
  "giong-het": "Giống hệt",
  "khac-mot-chut": "Khác một chút",
  "khac-hoan-toan": "Khác hoàn toàn",
  "khong-co-trong-tieng-nhat": "Tiếng Nhật không dùng chữ này",
};

// Danh sách dài (HSK 3 có 284 chữ): mỗi lần chỉ vẽ một phần, bấm "Xem thêm" để hiện tiếp
const SO_THE_MOI_LAN = 60;

const CAC_CAP = [1, 2, 3];

/** Ô thay cho chữ Nhật khi tiếng Nhật không dùng chữ này. */
function KhongCoChuNhat({ co }) {
  return (
    <span
      className={`text-chu-mo ${co === "the" ? "text-[length:2.5rem]" : "text-[length:1.75rem]"} leading-none`}
      aria-label="Tiếng Nhật không dùng chữ này"
    >
      —
    </span>
  );
}

const nhanTieuDe =
  "text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-bold uppercase tracking-wide";

/** Lấy âm chính (âm hiển thị to) trong một danh sách âm đọc. */
function amChinh(danhSach = []) {
  return danhSach.find((a) => a.chinh) ?? danhSach[0] ?? null;
}

export default function TabChuHan() {
  const nd = useNguoiDung();
  const [trangThai, setTrangThai] = useState("dang-tai"); // dang-tai | xong | loi
  const [danhSach, setDanhSach] = useState([]);
  const [loTrinh, setLoTrinh] = useState(null);
  const [capChon, setCapChon] = useState(null); // null = cấp của bài hôm nay
  const [moToanBo, setMoToanBo] = useState(false);
  const [chuDangMo, setChuDangMo] = useState(null);
  const [soHien, setSoHien] = useState(SO_THE_MOI_LAN);
  const [dangChoi, setDangChoi] = useState(false); // trò chơi lật thẻ

  useEffect(() => {
    let conSong = true; // tránh cập nhật khi người dùng đã rời tab
    Promise.all([taiChuHan(), taiLoTrinh()])
      .then(([ds, lt]) => {
        if (!conSong) return;
        setDanhSach(ds);
        setLoTrinh(lt);
        setTrangThai("xong");
      })
      .catch(() => conSong && setTrangThai("loi"));
    return () => {
      conSong = false;
    };
  }, []);

  const theoId = useMemo(() => new Map(danhSach.map((c) => [c.id, c])), [danhSach]);

  // 5 chữ của bài đang học
  const baiHomNay = loTrinh ? layBai(loTrinh, nd.loTrinh.bai) : null;
  const chuHomNay = baiHomNay ? baiHomNay.chu.map((id) => theoId.get(id)).filter(Boolean) : [];

  // Chữ đã học: thuộc các bài đã học xong, hoặc tự đánh dấu "Đã học"
  const daHoc = useMemo(() => {
    const ra = new Set(Object.keys(nd.daHoc).filter((id) => nd.daHoc[id] && id.startsWith("han-")));
    const bai = loTrinh?.baiHoc ?? [];
    const soBaiXong = Math.min(nd.loTrinh.bai - 1, bai.length);
    for (const b of bai.slice(0, soBaiXong)) for (const id of b.chu) ra.add(id);
    return ra;
  }, [nd.daHoc, nd.loTrinh.bai, loTrinh]);

  // % chữ đã học của từng cấp
  const tienDoCap = useMemo(() => {
    const ra = {};
    for (const cap of CAC_CAP) {
      const cua = danhSach.filter((c) => c.capHsk === cap);
      const da = cua.filter((c) => daHoc.has(c.id)).length;
      ra[cap] = { tong: cua.length, da, phanTram: cua.length ? Math.round((da / cua.length) * 100) : 0 };
    }
    return ra;
  }, [danhSach, daHoc]);

  if (chuDangMo) {
    return <ChiTietChuHan muc={chuDangMo} quayLai={() => setChuDangMo(null)} />;
  }

  const cap = capChon ?? chuHomNay[0]?.capHsk ?? 1;
  const hienThi = danhSach.filter((m) => m.capHsk === cap);

  if (dangChoi) {
    return (
      <TroChoiLatThe
        tieuDe="Trò chơi lật thẻ"
        taoCap={() => capChuHan(hienThi)}
        khoaKyLuc="chu-han"
        quayLai={() => setDangChoi(false)}
      />
    );
  }

  function chonCap(c) {
    setCapChon(c);
    setSoHien(SO_THE_MOI_LAN);
  }

  return (
    <section>
      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Luyện chữ Hán</h1>

      {trangThai === "dang-tai" && (
        <p className="text-chu-mo mt-5 text-[length:var(--co-chu-latin-nho)]">
          Đang tải danh sách chữ Hán...
        </p>
      )}
      {trangThai === "loi" && (
        <p className="text-sai mt-5 text-[length:var(--co-chu-latin-nho)]">
          Không tải được dữ liệu chữ Hán. Hãy kiểm tra mạng rồi mở lại tab này.
        </p>
      )}

      {/* --- 5 chữ Hán hôm nay --- */}
      {trangThai === "xong" && chuHomNay.length > 0 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
              {chuHomNay.length} chữ Hán hôm nay
            </h2>
            <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold">
              Bài {baiHomNay.so}
            </span>
          </div>
          <ul className="m-0 mt-2 grid list-none grid-cols-2 gap-3 p-0">
            {chuHomNay.map((muc) => (
              <li key={muc.id}>
                <TheChuHan muc={muc} moChiTiet={() => setChuDangMo(muc)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Ba nút cấp HSK, mỗi nút có thanh % đã học --- */}
      {trangThai === "xong" && (
        <div className="mt-5 grid grid-cols-3 gap-2" role="group" aria-label="Chọn cấp HSK">
          {CAC_CAP.map((c) => {
            const td = tienDoCap[c];
            const chon = cap === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => chonCap(c)}
                aria-pressed={chon}
                aria-label={`HSK ${c}, đã học ${td.da} trên ${td.tong} chữ, ${td.phanTram} phần trăm`}
                className={`flex flex-col items-stretch gap-1.5 rounded-[var(--bo-goc)] border px-2.5 pt-2 pb-2.5 text-center transition-colors ${
                  chon ? "border-nhan bg-nhan-nhat border-2" : "border-vien bg-nen-noi border-2"
                }`}
              >
                <span className="text-[length:var(--co-chu-latin)] font-bold">HSK {c}</span>
                <span className="bg-nen-phu h-1.5 w-full overflow-hidden rounded-[var(--bo-goc-tron)]">
                  <span
                    className="bg-nhan block h-full rounded-[var(--bo-goc-tron)]"
                    style={{ width: `${td.phanTram}%` }}
                  />
                </span>
                <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] font-semibold tabular-nums">
                  {td.phanTram}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {trangThai === "xong" && hienThi.length > 0 && (
        <KhungChonLuyenTap
          cacCach={[{ ma: "lat-the", nhan: "Trò chơi lật thẻ" }]}
          soMuc={hienThi.length}
          chon={() => setDangChoi(true)}
          ghiChu={`Mỗi ván 10 chữ (20 thẻ), lấy từ ${hienThi.length} chữ HSK ${cap}: ghép chữ Hán với nghĩa tiếng Nhật và tiếng Việt của nó. Mục tiêu ngày chỉ tính khi học xong Bài hôm nay (bấm thanh trên cùng).`}
        />
      )}

      {/* --- Xem toàn bộ chữ Hán của cấp đang chọn --- */}
      {trangThai === "xong" && hienThi.length > 0 && (
        <button
          type="button"
          onClick={() => setMoToanBo((m) => !m)}
          aria-expanded={moToanBo}
          className="border-vien mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten={moToanBo ? "thu-gon" : "xem-them"} co={16} />
          {moToanBo
            ? `Thu gọn danh sách HSK ${cap}`
            : `Xem toàn bộ chữ Hán HSK ${cap} (${hienThi.length} chữ)`}
        </button>
      )}

      {trangThai === "xong" && moToanBo && (
        <>
          <p className="text-chu-mo mt-3 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            Chữ đã học (thuộc bài đã học xong hoặc bạn tự đánh dấu) có viền nét
            đứt và mờ hơn.
          </p>
          <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-3 p-0">
            {hienThi.slice(0, soHien).map((muc) => (
              <li key={muc.id}>
                <TheChuHan
                  muc={muc}
                  daHoc={daHoc.has(muc.id)}
                  moChiTiet={() => setChuDangMo(muc)}
                />
              </li>
            ))}
          </ul>
          {hienThi.length > soHien && (
            <button
              type="button"
              onClick={() => setSoHien((n) => n + SO_THE_MOI_LAN)}
              className="border-vien mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2.5 text-[length:var(--co-chu-latin-nho)] font-semibold"
            >
              <BieuTuong ten="xem-them" co={16} />
              Xem thêm ({hienThi.length - soHien} chữ nữa)
            </button>
          )}
        </>
      )}
    </section>
  );
}

/* -----------------------------------------------------------------------------
   THẺ TRONG DANH SÁCH: chữ Trung + chữ Nhật cạnh nhau, nghĩa Việt phía dưới.
   Chữ đã học: viền nét đứt, mờ hơn.
   ----------------------------------------------------------------------------- */
function TheChuHan({ muc, moChiTiet, daHoc = false }) {
  const pinyinChinh = amChinh(muc.amDoc.pinyin)?.am ?? "";

  return (
    <button
      type="button"
      onClick={moChiTiet}
      className={`border-vien bg-nen-noi active:bg-nhan-nhat flex w-full flex-col items-center gap-1 rounded-[var(--bo-goc)] border px-2 py-3 text-center transition-colors ${
        daHoc
          ? "border-2 border-dashed opacity-55"
          : "shadow-[0_1px_3px_var(--bong)]"
      }`}
    >
      <div className="flex items-end justify-center gap-4">
        {/* TRUNG: giản thể kèm pinyin chính */}
        <ChuTrung amTiet={[{ chu: muc.gianThe, pinyin: pinyinChinh }]} />
        {/* NHẬT (có chữ Tiếng Nhật không dùng, ví dụ 爸, 吗) */}
        {muc.tuDangNhat ? <ChuNhat noiDung={muc.tuDangNhat} /> : <KhongCoChuNhat />}
      </div>
      {/* VIỆT */}
      <span className="text-[length:var(--co-chu-latin)] font-semibold">{muc.nghia.viet}</span>
      {daHoc && <span className="sr-only">(đã học)</span>}
    </button>
  );
}

/* -----------------------------------------------------------------------------
   CHI TIẾT MỘT CHỮ (GĐ 10, theo bản vẽ của chủ dự án, quyết định 18.22)
     Khung 1: Giản thể (pinyin) · Kanji · Phồn thể, nhãn so sánh tự dạng
     Khung 2: Pinyin | Tiếng Nhật (2 cột), rồi Hán Việt, nghĩa, số nét, bộ thủ
     Khung 3: Tập viết
   ----------------------------------------------------------------------------- */
const kieuKhung = "border-vien bg-nen-noi rounded-[var(--bo-goc-lon)] border p-4";

function ChiTietChuHan({ muc, quayLai }) {
  const { amDoc, soSanhTuDang: ss } = muc;
  const pinyinChinh = amChinh(amDoc.pinyin)?.am ?? "";
  // Tập viết chữ giản thể (Trung) hay chữ Nhật: hai bộ nét có thứ tự khác nhau
  const [boViet, setBoViet] = useState("trung");
  const coTiengNhat = amDoc.amOn.length > 0 || amDoc.amKun.length > 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={quayLai}
          className="border-vien inline-flex items-center gap-1.5 rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          <BieuTuong ten="quay-lai" co={16} />
          Về danh sách
        </button>
        <NutDaHoc id={muc.id} />
      </div>

      {/* === KHUNG 1: Giản thể · Kanji · Phồn thể === */}
      <div className={kieuKhung}>
        {/* Nhãn một hàng riêng để ba nhãn thẳng hàng (pinyin chỉ có ở cột giản thể) */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <p className={nhanTieuDe}>Giản thể</p>
          <p className={nhanTieuDe}>Kanji</p>
          <p className={nhanTieuDe}>Phồn thể</p>
        </div>
        <div className="grid grid-cols-3 items-end gap-2 text-center">
          <ChuTrung co="the" amTiet={[{ chu: muc.gianThe, pinyin: pinyinChinh }]} />
          <div>
            {muc.tuDangNhat ? (
              <ChuNhat co="the" noiDung={muc.tuDangNhat} />
            ) : (
              <KhongCoChuNhat co="the" />
            )}
          </div>
          {/* Cột phồn thể dùng font Noto Sans SC theo quyết định đã chốt */}
          <ChuTrung co="the" amTiet={[{ chu: muc.phonThe, pinyin: "" }]} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="bg-nhan-nhat rounded-[var(--bo-goc-tron)] px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-bold">
            Trung so với Nhật: {NHAN_TU_DANG[ss.trungVsNhat]}
          </span>
          {ss.khacNetVe && (
            <span className="border-vien rounded-[var(--bo-goc-tron)] border px-3 py-1 text-[length:var(--co-chu-latin-nho)] font-semibold">
              Cùng mã chữ nhưng nét vẽ khác
            </span>
          )}
        </div>
        {ss.ghiChu && (
          <p className="text-chu-mo mt-2 mb-0 text-center text-[length:var(--co-chu-latin-nho)] leading-relaxed">
            <VanBanPha noiDung={ss.ghiChu} />
          </p>
        )}
      </div>

      {/* === KHUNG 2: Pinyin | Tiếng Nhật, rồi Hán Việt, nghĩa, số nét, bộ thủ === */}
      <div className={`${kieuKhung} flex flex-col gap-4`}>
        <div className="grid grid-cols-2 gap-4">
          {/* TRUNG */}
          <div className="flex min-w-0 flex-col gap-3">
            <p className={nhanTieuDe}>Pinyin</p>
            {amDoc.pinyin.map((a) => (
              <div key={a.am} className="min-w-0">
                <AmChinhPhu am={a.am} chinh={a.chinh} />
                <ViDuTrung viDu={a} />
              </div>
            ))}
          </div>
          {/* NHẬT */}
          <div className="border-vien flex min-w-0 flex-col gap-3 border-l pl-4">
            <p className={nhanTieuDe}>Tiếng Nhật</p>
            {!coTiengNhat && (
              <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
                Tiếng Nhật không dùng chữ này.
              </p>
            )}
            {amDoc.amOn.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">Âm On</p>
                {amDoc.amOn.map((a) => (
                  <ViDuNhatCoAm key={a.am} a={a} />
                ))}
              </div>
            )}
            {amDoc.amKun.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">Âm Kun</p>
                {amDoc.amKun.map((a) => (
                  <ViDuNhatCoAm key={a.am} a={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VIỆT và thông tin chung */}
        <div className="border-vien flex flex-col gap-3 border-t pt-3">
          <div>
            <p className={nhanTieuDe}>Âm Hán Việt</p>
            <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {amDoc.amHanViet.map((a) => (
                <span
                  key={a.am}
                  className={
                    a.chinh
                      ? "text-[length:1.5rem] font-bold"
                      : "text-chu-mo text-[length:var(--co-chu-latin)]"
                  }
                >
                  {a.am}
                </span>
              ))}
            </p>
          </div>
          {/* Nghĩa: Nhật → Việt. Nghĩa tiếng Trung có trong dữ liệu nhưng CHƯA
              hiện, vì chưa có pinyin từng chữ cho câu giải nghĩa. */}
          <div>
            <p className={nhanTieuDe}>Nghĩa</p>
            <ChuNhat noiDung={muc.nghia.nhat} />
            <p className="mt-1 mb-0 text-[length:var(--co-chu-latin)]">{muc.nghia.viet}</p>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className={nhanTieuDe}>Số nét</p>
              <p className="m-0 text-[length:var(--co-chu-latin)] font-bold">{muc.soNet}</p>
            </div>
            <div>
              <p className={nhanTieuDe}>Bộ thủ</p>
              <ChuTrung amTiet={[{ chu: muc.boThu, pinyin: muc.boThuPinyin?.[0] ?? "" }]} />
            </div>
          </div>
        </div>
      </div>

      {/* === KHUNG 3: Tập viết (giản thể hoặc chữ Nhật) === */}
      <div className={`${kieuKhung} flex flex-col items-center gap-3`}>
        <h2 className="m-0 self-start text-[length:var(--co-chu-latin)] font-bold">Tập viết</h2>
        <div className="flex gap-2" role="group" aria-label="Chọn chữ để tập viết">
          {[
            { ma: "trung", nhan: "Giản thể (Trung)", chu: muc.gianThe },
            { ma: "nhat", nhan: "Kanji (Nhật)", chu: muc.tuDangNhat },
          ]
            .filter((b) => b.chu)
            .map((b) => (
              <button
                key={b.ma}
                type="button"
                onClick={() => setBoViet(b.ma)}
                aria-pressed={boViet === b.ma}
                className={`rounded-[var(--bo-goc-tron)] border px-3.5 py-1.5 text-[length:var(--co-chu-latin-nho)] font-semibold transition-colors ${
                  boViet === b.ma ? "border-nhan bg-nhan text-chu-tren-nhan" : "border-vien bg-transparent"
                }`}
              >
                {b.nhan}
              </button>
            ))}
        </div>
        <KhungTapViet
          idChu={muc.id}
          chu={boViet === "trung" ? muc.gianThe : muc.tuDangNhat}
          ngonNgu={boViet}
        />
      </div>

      {/* --- Mục chưa được người kiểm tra, hiện ra để chủ dự án rà lại --- */}
      <MucChuaKiemTra danhSach={muc.cangKiemTra} />
    </section>
  );
}

/* -----------------------------------------------------------------------------
   Các mảnh nhỏ dùng trong trang chi tiết
   ----------------------------------------------------------------------------- */

/** Âm chính hiện to, âm phụ hiện nhỏ hơn (quyết định 4.6). */
function AmChinhPhu({ am, chinh }) {
  return (
    <p
      className={`m-0 ${
        chinh
          ? "text-[length:1.5rem] font-bold"
          : "text-chu-mo text-[length:var(--co-chu-latin)] font-semibold"
      }`}
    >
      {am}
    </p>
  );
}

/** Từ ví dụ tiếng Trung: có pinyin trên từng chữ, kèm nghĩa Việt (xuống dòng khi hẹp). */
function ViDuTrung({ viDu }) {
  if (!viDu.viDuTu) return null;
  return (
    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
      <ChuTrung
        amTiet={ghepAmTiet(viDu.viDuTu, viDu.viDuPinyin)}
        ghiChuBienDieu={viDu.ghiChuBienDieu ?? null}
      />
      <span className="text-[length:var(--co-chu-latin)] break-words">{viDu.viDuNghia}</span>
    </div>
  );
}

/** Âm On/Kun của chữ Nhật: âm (font Nhật) + từ ví dụ có furigana + nghĩa Việt. */
function ViDuNhatCoAm({ a }) {
  return (
    <div className="min-w-0">
      <ChuNhat
        noiDung={a.am}
        co={a.chinh ? "thuong" : "nho"}
        className={a.chinh ? "font-bold" : "text-chu-mo font-semibold"}
      />
      <div className="flex flex-wrap items-baseline gap-x-3">
        <ChuNhat noiDung={a.viDuTu} />
        <span className="text-[length:var(--co-chu-latin)] break-words">{a.viDuNghia}</span>
      </div>
    </div>
  );
}
