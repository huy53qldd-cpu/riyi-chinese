/* =============================================================================
   THI THỬ HSK (Khám phá → Thi thử HSK, quyết định 18.59)
   =============================================================================

   Luật làm bài (chủ dự án chốt):
     - Mỗi phần thi là MỘT TRANG CUỘN. Làm xong trang Nghe thì bấm nút cuối
       trang sang trang Đọc; ở trang Đọc quay lại trang Nghe để SỬA ĐÁP ÁN được.
     - Phần NGHE: nút nghe ở đầu trang, bấm là phát MỘT MẠCH từ đầu tới cuối như
       thi thật: không dừng, không tua, không nghe lại. Tải lại trang / thoát ra
       giữa chừng thì lần sau NGHE TIẾP TỪ CHỖ DỪNG. Nghe hết mới sang phần Đọc
       được (trừ khi không tải được file nghe). Nghe xong thì nút nghe khoá hẳn.
     - Phần ĐỌC: đếm ngược đúng thời gian của đề (HSK 1: 17 phút) tính từ lúc vào
       trang Đọc lần đầu, vẫn chạy khi thoát ra; hết giờ thì tự nộp.
     - Nộp bài: điểm từng phần, tổng điểm, đạt / chưa đạt theo thang HSK; xem lại
       từng câu (đúng/sai, đáp án, lời thoại phần nghe). Người đã đăng nhập thì
       điểm được lưu vào tài khoản. Khách vẫn làm được nhưng không lưu điểm.
     - Đề giữ NGUYÊN BẢN: có pinyin chỗ nào là theo đề gốc (CauHoiThi.jsx).
   ============================================================================= */

import { useEffect, useRef, useState } from "react";

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import HopThoaiXacNhan from "../thanh-phan/HopThoaiXacNhan.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import { kieu } from "../luyen-tap/tienIch.js";
import NhomCau from "./CauHoiThi.jsx";
import {
  baiLamMoi,
  chamDiem,
  docBaiLam,
  duongDan,
  ghiBaiLam,
  soCauBoTrong,
  taiDanhSachDe,
  taiDe,
  xoaBaiLam,
} from "./duLieuThiThu.js";
import { docKetQuaThiThu, ghiKetQuaThiThu } from "./ketQuaThiThu.js";

/** "mm:ss" */
function phutGiay(giay) {
  const g = Math.max(0, Math.round(giay));
  return `${String(Math.floor(g / 60)).padStart(2, "0")}:${String(g % 60).padStart(2, "0")}`;
}

/* =============================================================================
   DANH SÁCH ĐỀ
   ============================================================================= */
export default function ThiThu() {
  const nd = useNguoiDung();
  const [ds, setDs] = useState(null);
  const [loi, setLoi] = useState(false);
  const [ketQua, setKetQua] = useState({});
  const [dangLam, setDangLam] = useState(null);
  const uid = nd.daDangNhap ? nd.nguoi?.uid : null;

  useEffect(() => {
    taiDanhSachDe()
      .then(setDs)
      .catch(() => setLoi(true));
  }, []);

  useEffect(() => {
    let conSong = true;
    docKetQuaThiThu(uid).then((kq) => conSong && setKetQua(kq));
    return () => {
      conSong = false;
    };
  }, [uid]);

  if (dangLam) {
    return (
      <LamBai
        thongTin={dangLam}
        ketQuaCu={ketQua[dangLam.ma]}
        quayLai={() => setDangLam(null)}
        khiLuuDiem={(ma, luu) =>
          setKetQua((cu) => ({
            ...cu,
            [ma]: {
              lanCuoi: luu,
              cao: !cu[ma]?.cao || luu.tong >= cu[ma].cao.tong ? luu : cu[ma].cao,
              soLan: (cu[ma]?.soLan ?? 0) + 1,
            },
          }))
        }
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">Thi thử HSK</h1>
        <p className="text-chu-mo mt-1.5 mb-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
          Đề thi thật của các kỳ HSK trước, làm đúng như đi thi: phần Nghe chỉ nghe một
          lần, phần Đọc có giờ.
          {!uid && " Bạn đang ở chế độ khách: làm được nhưng điểm không được lưu."}
        </p>
      </div>

      {loi && <p className="text-sai m-0">Không tải được danh sách đề. Hãy kiểm tra mạng rồi mở lại.</p>}
      {!ds && !loi && <p className={kieu.chuNho}>Đang tải danh sách đề...</p>}

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {(ds ?? []).map((de) => {
          const dangDo = docBaiLam(de.ma);
          const kq = ketQua[de.ma];
          return (
            <li key={de.ma}>
              <button
                type="button"
                onClick={() => setDangLam(de)}
                className="border-vien bg-nen-noi active:bg-nhan-nhat flex w-full items-center gap-4 rounded-[var(--bo-goc)] border px-4 py-4 text-left shadow-[0_1px_3px_var(--bong)]"
              >
                <span className="bg-nhan-nhat text-nhan-chu flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[var(--bo-goc)] leading-none font-bold">
                  <span className="text-[length:0.6875rem]">HSK</span>
                  <span className="text-[length:1.25rem]">{de.cap}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[length:var(--co-chu-latin)] font-bold">Đề {de.ma}</span>
                  <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">
                    {de.soCau ?? 40} câu · Nghe khoảng 15 phút · Đọc 17 phút
                  </span>
                  {dangDo && !dangDo.ketQua && (
                    <span className="text-canh-bao text-[length:var(--co-chu-latin-nho)] font-semibold">
                      Đang làm dở, bấm để làm tiếp
                    </span>
                  )}
                  {kq?.cao && (
                    <span className="text-[length:var(--co-chu-latin-nho)] font-semibold">
                      Cao nhất: {kq.cao.tong}/200 · đã làm {kq.soLan ?? 1} lần
                    </span>
                  )}
                </span>
                <BieuTuong ten="sau" className="text-chu-mo" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* =============================================================================
   LÀM BÀI
   ============================================================================= */
function LamBai({ thongTin, ketQuaCu, quayLai, khiLuuDiem }) {
  const nd = useNguoiDung();
  const hienThongBao = useThongBao();
  const ma = thongTin.ma;
  const [de, setDe] = useState(null);
  const [loiTai, setLoiTai] = useState(false);
  const [bai, setBai] = useState(() => docBaiLam(ma) ?? baiLamMoi());
  const [loiAmThanh, setLoiAmThanh] = useState(false);
  const [xemLai, setXemLai] = useState(false);
  const [hoiNop, setHoiNop] = useState(false);
  const [hoiLamLai, setHoiLamLai] = useState(false);
  // Lưu điểm lên tài khoản: null | "dang" | "xong" | "loi"
  const [luuDiem, setLuuDiem] = useState(null);

  useEffect(() => {
    taiDe(ma, thongTin.version)
      .then(setDe)
      .catch(() => setLoiTai(true));
  }, [ma, thongTin.version]);

  // Lưu bài làm dở sau mỗi thay đổi (đáp án, vị trí file nghe, trang...)
  useEffect(() => ghiBaiLam(ma, bai), [ma, bai]);

  const chon = (so, gt) => setBai((b) => ({ ...b, traLoi: { ...b.traLoi, [so]: gt } }));
  const capNhatNghe = (thay) => setBai((b) => ({ ...b, nghe: { ...b.nghe, ...thay } }));

  function sangTrang(trang) {
    setBai((b) => ({ ...b, trang, docBatDau: trang === 1 && !b.docBatDau ? Date.now() : b.docBatDau }));
    window.scrollTo(0, 0);
  }

  // Nộp bài (bấm nút, hoặc tự nộp khi hết giờ phần Đọc). Chỉ nộp MỘT lần.
  const daNop = useRef(Boolean(bai.ketQua));
  function nop() {
    if (!de || daNop.current) return;
    daNop.current = true;
    setHoiNop(false);
    const diem = chamDiem(de, bai.traLoi);
    const luu = {
      nghe: diem.phan.nghe.diem,
      doc: diem.phan.doc.diem,
      tong: diem.tong,
      dat: diem.dat,
      luc: new Date().toISOString(),
    };
    setBai((b) => ({ ...b, ketQua: luu }));
    window.scrollTo(0, 0);
    if (nd.daDangNhap) {
      setLuuDiem("dang");
      ghiKetQuaThiThu(nd.nguoi.uid, ma, luu, ketQuaCu).then((ok) => {
        setLuuDiem(ok ? "xong" : "loi");
        if (ok) khiLuuDiem(ma, luu);
        else hienThongBao("Chưa lưu được điểm lên tài khoản. Hãy kiểm tra mạng.", 4);
      });
    }
  }
  const nopMoiNhat = useRef(nop);
  useEffect(() => {
    nopMoiNhat.current = nop;
  });

  function lamLai() {
    xoaBaiLam(ma);
    daNop.current = false;
    setBai(baiLamMoi());
    setXemLai(false);
    setHoiLamLai(false);
    window.scrollTo(0, 0);
  }

  const nutThoat = (
    <button type="button" onClick={quayLai} className={kieu.nutPhu}>
      <BieuTuong ten="quay-lai" co={16} />
      Danh sách đề
    </button>
  );

  if (loiTai) {
    return (
      <section className="flex flex-col gap-4">
        <div>{nutThoat}</div>
        <p className="text-sai m-0">Không tải được đề thi. Hãy kiểm tra mạng rồi thử lại.</p>
      </section>
    );
  }
  if (!de) return <p className={kieu.chuNho}>Đang tải đề thi...</p>;

  // ----- ĐÃ NỘP: kết quả, hoặc xem lại từng câu -----
  if (bai.ketQua) {
    const diem = chamDiem(de, bai.traLoi);
    if (xemLai) {
      return (
        <section className="flex flex-col gap-6">
          <div>
            <button type="button" onClick={() => setXemLai(false)} className={kieu.nutPhu}>
              <BieuTuong ten="quay-lai" co={16} />
              Kết quả
            </button>
          </div>
          {de.phan.map((phan) => (
            <div key={phan.ma} className="flex flex-col gap-6">
              <TieuDePhan phan={phan} diem={diem.phan[phan.ma]} />
              {phan.nhom.map((nhom) => (
                <NhomCau
                  key={nhom.tieuDe}
                  maDe={ma}
                  phanMa={phan.ma}
                  nhom={nhom}
                  traLoi={bai.traLoi}
                  chon={() => {}}
                  xemLai
                  loiNghe={de.loiNghe}
                />
              ))}
            </div>
          ))}
        </section>
      );
    }
    return (
      <section className="flex flex-col gap-4">
        <div>{nutThoat}</div>
        <div className={`${kieu.khung} items-center text-center`}>
          <p className={kieu.nhanTieuDe}>Kết quả đề {ma}</p>
          <p className="m-0 text-[2.75rem] leading-none font-extrabold tabular-nums">
            {diem.tong}
            <span className="text-chu-mo text-[length:var(--co-chu-latin)] font-bold">/{diem.tongToiDa}</span>
          </p>
          <p className={`m-0 text-[length:var(--co-chu-latin)] font-bold ${diem.dat ? "text-dung" : "text-sai"}`}>
            {diem.dat ? "✓ Đạt" : "✗ Chưa đạt"}
            <span className="text-chu-mo font-semibold"> (cần {de.diemDat} điểm)</span>
          </p>
          <div className="mt-2 grid w-full grid-cols-2 gap-2">
            {de.phan.map((phan) => {
              const p = diem.phan[phan.ma];
              return (
                <div key={phan.ma} className="bg-nen-phu rounded-[var(--bo-goc-nho)] px-3 py-2">
                  <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">
                    {phan.tenViet}
                  </p>
                  <p className="m-0 text-[length:var(--co-chu-latin)] font-bold tabular-nums">
                    {p.diem}/{p.diemToiDa}
                  </p>
                  <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] tabular-nums">
                    Đúng {p.dung}/{p.soCau} câu
                  </p>
                </div>
              );
            })}
          </div>
          <p className={`${kieu.chuNho} mt-1`}>
            {!nd.daDangNhap
              ? "Bạn đang ở chế độ khách nên điểm không được lưu."
              : luuDiem === "dang"
                ? "Đang lưu điểm vào tài khoản..."
                : luuDiem === "loi"
                  ? "Chưa lưu được điểm vào tài khoản (lỗi mạng)."
                  : luuDiem === "xong"
                    ? "Điểm đã được lưu vào tài khoản."
                    : "Bài làm đã nộp."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setXemLai(true)} className={kieu.nutChinh}>
            <BieuTuong ten="xem-mau" />
            Xem lại từng câu
          </button>
          <button type="button" onClick={() => setHoiLamLai(true)} className={kieu.nutPhu}>
            <BieuTuong ten="lam-lai" co={16} />
            Làm lại đề
          </button>
        </div>
        {hoiLamLai && (
          <HopThoaiXacNhan
            tieuDe="Làm lại đề này?"
            noiDung={<p className="m-0">Bài làm hiện tại sẽ bị xoá để làm lại từ đầu. Điểm đã lưu vẫn giữ.</p>}
            nutXacNhan="Làm lại"
            nutHuy="Thôi"
            khiXacNhan={lamLai}
            khiHuy={() => setHoiLamLai(false)}
          />
        )}
      </section>
    );
  }

  // ----- ĐANG LÀM -----
  const phan = de.phan[bai.trang];
  const laNghe = phan.ma === "nghe";
  const coTheSangDoc = bai.nghe.xong || loiAmThanh;
  const boTrong = de.phan.reduce((t, p) => t + soCauBoTrong(p, bai.traLoi), 0);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {nutThoat}
        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">
          Thoát ra vẫn giữ bài làm
        </span>
      </div>

      {/* Thanh dính trên cùng: đang ở phần nào + đồng hồ phần Đọc */}
      <div
        className="border-vien bg-nen-noi sticky z-30 flex items-center gap-3 rounded-[var(--bo-goc)] border px-4 py-2 shadow-[0_2px_8px_var(--bong)]"
        style={{ top: "calc(var(--cao-thanh-tren) + env(safe-area-inset-top) + 0.5rem)" }}
      >
        <span className="font-bold">
          Đề {ma} · {bai.trang + 1}/{de.phan.length} {phan.tenViet}
        </span>
        {bai.docBatDau && (
          <DongHoDoc
            batDau={bai.docBatDau}
            phut={de.phan.find((p) => p.ma === "doc").thoiGianPhut}
            hetGio={() => nopMoiNhat.current()}
          />
        )}
      </div>

      <TieuDePhan phan={phan} />

      {laNghe && (
        <TrinhNghe
          src={duongDan(ma, phan.amThanh)}
          nghe={bai.nghe}
          capNhatNghe={capNhatNghe}
          khiLoi={() => setLoiAmThanh(true)}
        />
      )}

      {phan.nhom.map((nhom) => (
        <NhomCau
          key={nhom.tieuDe}
          maDe={ma}
          phanMa={phan.ma}
          nhom={nhom}
          traLoi={bai.traLoi}
          chon={chon}
        />
      ))}

      {/* Nút cuối trang */}
      <div className="border-vien flex flex-col gap-3 border-t pt-5">
        {laNghe ? (
          <>
            <button
              type="button"
              onClick={() => sangTrang(1)}
              disabled={!coTheSangDoc}
              className={`${kieu.nutChinh} self-stretch`}
            >
              Sang phần Đọc hiểu
              <BieuTuong ten="sau" />
            </button>
            {!coTheSangDoc && (
              <p className={`${kieu.chuNho} text-center`}>Nghe hết bài nghe thì mới sang phần Đọc được.</p>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={() => setHoiNop(true)} className={`${kieu.nutChinh} self-stretch`}>
              <BieuTuong ten="kiem-tra" />
              Nộp bài
            </button>
            <button type="button" onClick={() => sangTrang(0)} className={`${kieu.nutPhu} self-start`}>
              <BieuTuong ten="quay-lai" co={16} />
              Quay lại phần Nghe (sửa đáp án)
            </button>
          </>
        )}
      </div>

      {hoiNop && (
        <HopThoaiXacNhan
          tieuDe="Nộp bài?"
          noiDung={
            <p className="m-0">
              {boTrong > 0
                ? `Bạn còn ${boTrong} câu chưa trả lời. Nộp rồi thì không sửa được nữa.`
                : "Bạn đã trả lời hết. Nộp rồi thì không sửa được nữa."}
            </p>
          }
          nutXacNhan="Nộp bài"
          nutHuy="Làm tiếp"
          khiXacNhan={nop}
          khiHuy={() => setHoiNop(false)}
        />
      )}
    </section>
  );
}

/** Tiêu đề một phần thi, đúng như đề: 一、听力 / 二、阅读. */
function TieuDePhan({ phan, diem }) {
  const so = phan.ma === "nghe" ? "一" : "二";
  return (
    <header className="flex flex-col items-center gap-1 text-center">
      <h2 className="m-0 text-[length:1.5rem] font-bold tracking-[0.35em]">
        <VanBanPha noiDung={`${so}、${phan.ten}`} />
      </h2>
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
        {phan.tenViet}
        {diem && ` · đúng ${diem.dung}/${diem.soCau} câu, ${diem.diem}/${diem.diemToiDa} điểm`}
      </p>
    </header>
  );
}

/* -----------------------------------------------------------------------------
   ĐỒNG HỒ PHẦN ĐỌC: đếm ngược theo giờ thật (tắt app vẫn chạy), hết giờ tự nộp
   ----------------------------------------------------------------------------- */
function DongHoDoc({ batDau, phut, hetGio }) {
  const [bayGio, setBayGio] = useState(() => Date.now());
  const conLai = phut * 60 - (bayGio - batDau) / 1000;

  useEffect(() => {
    const hen = setInterval(() => setBayGio(Date.now()), 1000);
    return () => clearInterval(hen);
  }, []);

  const daBao = useRef(false);
  useEffect(() => {
    if (conLai <= 0 && !daBao.current) {
      daBao.current = true;
      hetGio();
    }
  }, [conLai, hetGio]);

  const sapHet = conLai <= 60;
  return (
    <span
      className={`ml-auto flex items-center gap-1.5 font-bold tabular-nums ${sapHet ? "text-sai" : ""}`}
      role="timer"
      aria-label={`Phần Đọc còn ${Math.ceil(conLai / 60)} phút`}
    >
      <BieuTuong ten="dong-ho" co={16} />
      {phutGiay(conLai)}
    </span>
  );
}

/* -----------------------------------------------------------------------------
   TRÌNH NGHE: chỉ một nút phát, không dừng, không tua, không nghe lại.
   Vị trí đã phát lưu mỗi giây (bài làm dở), nên thoát ra / tải lại trang thì
   lần sau phát tiếp từ đó. Ai tua lùi (ví dụ bằng nút trên màn hình khoá)
   thì bị đưa về chỗ xa nhất đã nghe.
   ----------------------------------------------------------------------------- */
function TrinhNghe({ src, nghe, capNhatNghe, khiLoi }) {
  const hienThongBao = useThongBao();
  const am = useRef(null);
  const [dangPhat, setDangPhat] = useState(false);
  const [giay, setGiay] = useState(nghe.viTri);
  const [thoiLuong, setThoiLuong] = useState(0);
  const [loi, setLoi] = useState(false);
  const xaNhat = useRef(nghe.viTri);
  const daLuuGiay = useRef(Math.floor(nghe.viTri));
  // Bắt đầu phát từ đúng chỗ đã dừng (chỉ tính một lần lúc mở trang)
  const [nguon] = useState(() => `${src}#t=${Math.floor(nghe.viTri)}`);

  function phat() {
    const a = am.current;
    if (!a) return;
    if (a.readyState >= 1 && Math.abs(a.currentTime - nghe.viTri) > 1.5) a.currentTime = nghe.viTri;
    // play() phải gọi NGAY trong lần bấm (iPhone chặn phát tự động)
    a.play()
      .then(() => {
        if (!nghe.daBatDau) capNhatNghe({ daBatDau: true });
      })
      .catch(() => hienThongBao("Không phát được file nghe. Hãy bấm lại.", 4));
  }

  function khiChay() {
    const a = am.current;
    const t = a.currentTime;
    xaNhat.current = Math.max(xaNhat.current, t);
    setGiay(t);
    if (Math.floor(t) !== daLuuGiay.current) {
      daLuuGiay.current = Math.floor(t);
      capNhatNghe({ viTri: t });
    }
  }

  function khiTua() {
    const a = am.current;
    if (a.currentTime < xaNhat.current - 1) a.currentTime = xaNhat.current;
  }

  const tongGiay = thoiLuong || 0;
  const tiLe = tongGiay ? Math.min(1, giay / tongGiay) : 0;

  return (
    <div className="border-vien bg-nen-noi flex flex-col gap-3 rounded-[var(--bo-goc)] border p-4">
      <audio
        ref={am}
        src={nguon}
        preload="auto"
        onLoadedMetadata={(e) => setThoiLuong(e.currentTarget.duration)}
        onTimeUpdate={khiChay}
        onSeeking={khiTua}
        onPlay={() => setDangPhat(true)}
        onPause={() => setDangPhat(false)}
        onEnded={() => {
          setDangPhat(false);
          capNhatNghe({ xong: true, viTri: am.current.duration });
        }}
        onError={() => {
          setLoi(true);
          khiLoi();
        }}
      />

      {loi ? (
        <p className="text-sai m-0 font-semibold">
          Không tải được file nghe. Hãy kiểm tra mạng rồi mở lại đề. Tạm thời vẫn sang phần Đọc được.
        </p>
      ) : nghe.xong ? (
        <p className="text-dung m-0 font-bold">✓ Đã nghe xong. Bài nghe chỉ được nghe một lần.</p>
      ) : dangPhat ? (
        <p className="m-0 flex items-center gap-2 font-bold">
          <BieuTuong ten="nghe" co={20} />
          Đang phát, hãy làm bài trong lúc nghe...
        </p>
      ) : (
        <>
          <button type="button" onClick={phat} className={`${kieu.nutChinh} self-stretch`}>
            <BieuTuong ten="nghe" />
            {nghe.daBatDau ? `Nghe tiếp từ ${phutGiay(nghe.viTri)}` : "Bắt đầu nghe"}
          </button>
          <p className={kieu.chuNho}>
            Chỉ nghe được MỘT lần, không dừng và không tua lại. Nếu thoát ra giữa chừng, lần sau
            sẽ nghe tiếp từ chỗ đã dừng.
          </p>
        </>
      )}

      {(nghe.daBatDau || dangPhat) && !loi && (
        <div className="flex items-center gap-3">
          <div
            className="bg-nen-phu h-2 flex-1 overflow-hidden rounded-[var(--bo-goc-tron)]"
            role="progressbar"
            aria-label="Tiến độ bài nghe"
            aria-valuenow={Math.round(tiLe * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="bg-nhan h-full rounded-[var(--bo-goc-tron)]" style={{ width: `${(nghe.xong ? 1 : tiLe) * 100}%` }} />
          </div>
          {tongGiay > 0 && !nghe.xong && (
            <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)] tabular-nums">
              còn {phutGiay(tongGiay - giay)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
