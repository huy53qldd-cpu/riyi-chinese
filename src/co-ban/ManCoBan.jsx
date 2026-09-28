/* =============================================================================
   KHOÁ "TIẾNG TRUNG CƠ BẢN" — BẢN ĐỒ LỘ TRÌNH (Phase 1, quyết định 18.70)
   =============================================================================

   Màn đầu của khoá 2: 3 chặng, mỗi bài là một trạm trên đường đi, có số buổi
   đã xong. Bấm bài đã có dữ liệu thì mở bài học 6 buổi; bài chưa có thì hiện
   "Sắp có".
   ============================================================================= */

import { useEffect, useState } from "react";

import ChuTrung from "../thanh-phan/ChuTrung.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import CaiDat from "../man-hinh/CaiDat.jsx";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import BaiHocCoBan from "./BaiHocCoBan.jsx";
import { CAC_BUOI, docTienDo, maBai, taiMucLuc } from "./duLieuCoBan.js";

const amTietTen = (bai) => Array.from(bai.trung).map((chu, i) => ({ chu, pinyin: bai.pinyin?.[i] ?? "" }));

export default function ManCoBan({ thoatKhoa }) {
  const nd = useNguoiDung();
  const uid = nd.daDangNhap ? nd.nguoi?.uid : null;
  const [mucLuc, setMucLuc] = useState(null);
  const [loi, setLoi] = useState(false);
  const [tienDo, setTienDo] = useState({});
  const [baiDangMo, setBaiDangMo] = useState(null);
  const [moCaiDat, setMoCaiDat] = useState(false);

  useEffect(() => {
    taiMucLuc().then(setMucLuc, () => setLoi(true));
  }, []);

  useEffect(() => {
    let conSong = true;
    docTienDo(uid).then((t) => conSong && setTienDo(t));
    return () => {
      conSong = false;
    };
  }, [uid]);

  if (moCaiDat) return <CaiDat quayLai={() => setMoCaiDat(false)} thoatKhoa={thoatKhoa} />;

  if (baiDangMo != null) {
    return (
      <BaiHocCoBan
        soBai={baiDangMo}
        uid={uid}
        tienDo={tienDo}
        capNhatTienDo={setTienDo}
        quayLai={() => setBaiDangMo(null)}
      />
    );
  }

  const baiTheoSo = new Map((mucLuc?.bai ?? []).map((b) => [b.so, b]));
  const soXong = (so) => (tienDo[maBai(so)] ?? []).length;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pt-4 pb-10">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={thoatKhoa}
          className="text-chu-mo inline-flex items-center gap-1 text-[length:var(--co-chu-latin-nho)]"
        >
          <BieuTuong ten="quay-lai" co={18} /> Khoá học
        </button>
        <button
          type="button"
          onClick={() => setMoCaiDat(true)}
          aria-label="Cài đặt"
          className="border-vien text-chu-mo flex h-10 w-10 items-center justify-center rounded-full border"
        >
          <BieuTuong ten="cai-dat" co={20} />
        </button>
      </header>

      <h1 className="mt-4 mb-1 text-[length:1.5rem] font-bold">Tiếng Trung cơ bản</h1>
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
        HSK 1 · theo giáo trình HSK标准教程 1 · mỗi bài 6 buổi
        {!uid && " · chế độ khách: tiến độ chỉ lưu trên máy này"}
      </p>

      {loi && <p className="text-sai mt-6">Không tải được lộ trình. Hãy kiểm tra mạng rồi mở lại.</p>}
      {!mucLuc && !loi && <p className="text-chu-mo mt-6">Đang tải lộ trình…</p>}

      {mucLuc?.chang.map((chang) => (
        <section key={chang.ten} className="mt-7">
          <h2 className="m-0 mb-3 text-[length:var(--co-chu-latin)] font-bold">{chang.ten}</h2>
          <ol className="relative m-0 flex list-none flex-col gap-3 p-0">
            {/* Đường nối các trạm */}
            <span aria-hidden="true" className="bg-vien absolute top-6 bottom-6 left-[1.45rem] w-0.5" />
            {chang.bai.map((so) => {
              const bai = baiTheoSo.get(so);
              if (!bai) return null;
              const xong = soXong(so);
              const hetBai = xong >= bai.soBuoi;
              return (
                <li key={so} className="relative">
                  <button
                    type="button"
                    disabled={!bai.daCo}
                    onClick={() => setBaiDangMo(so)}
                    className={`border-vien bg-nen-noi flex w-full items-center gap-3 rounded-[var(--bo-goc)] border p-3 text-left transition-colors ${bai.daCo ? "hover:border-nhan active:border-nhan" : "opacity-60"}`}
                  >
                    <span
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold ${hetBai ? "nut-hoan-thanh" : xong > 0 ? "border-nhan text-nhan-chu bg-nen-noi" : "border-vien bg-nen-noi"}`}
                    >
                      {hetBai ? "✓" : so}
                    </span>
                    <span className="min-w-0 flex-1">
                      {bai.trung ? (
                        <ChuTrung amTiet={amTietTen(bai)} />
                      ) : null}
                      <span className="block text-[length:var(--co-chu-latin-nho)] leading-snug">
                        {so > 0 ? `Bài ${so}: ` : ""}
                        {bai.viet}
                      </span>
                    </span>
                    <span className="text-chu-mo shrink-0 text-[length:var(--co-chu-latin-nho)] tabular-nums">
                      {bai.daCo ? `${xong}/${bai.soBuoi}` : "Sắp có"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <p className="text-chu-mo mt-8 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        Mỗi bài gồm: {CAC_BUOI.map((b) => b.ten.toLowerCase()).join(" · ")}. Làm xong buổi nào thì bấm “Hoàn thành
        buổi” để đánh dấu.
      </p>
    </main>
  );
}
