/* =============================================================================
   KHOÁ "TIẾNG TRUNG CƠ BẢN" — MỘT BÀI HỌC, 6 BUỔI (Phase 1, quyết định 18.65, 18.70)
   =============================================================================

   Buổi 1 Hội thoại      khởi động (ghép từ – ảnh), 3 hội thoại có âm thanh sách
   Buổi 2 Phát âm        bảng âm, thanh điệu, biến điệu, đọc theo, câu dùng trong lớp
   Buổi 3 Từ vựng        từ mới của sách + từ bổ sung HSK 2025, âm Hán Việt
   Buổi 4 Chữ & ngữ pháp nét, chữ độc thể (tập viết), bút thuận, chú thích ngữ pháp
   Buổi 5 Luyện tập      bài tập chọn lọc của sách bài tập (nghe, đọc, phát âm)
   Buổi 6 Ôn tập         trắc nghiệm nghĩa từ, vận dụng, văn hoá

   Phần hiển thị câu hỏi dùng lại của Thi thử (src/thi-thu/CauHoiThi.jsx).
   Âm thanh đoạn dài (hội thoại, bài nghe) dùng thẻ <audio> như Thi thử; âm
   tiết và từ vẫn đi qua phatAm() duy nhất.
   ============================================================================= */

import { useEffect, useMemo, useState } from "react";

import ChuTrung from "../thanh-phan/ChuTrung.jsx";
import VanBanPha from "../thanh-phan/VanBanPha.jsx";
import NutLoa from "../thanh-phan/NutLoa.jsx";
import BieuTuong from "../thanh-phan/BieuTuong.jsx";
import KhungTapViet from "../thanh-phan/KhungTapViet.jsx";
import NhomCau from "../thi-thu/CauHoiThi.jsx";
import { traLoiDung } from "../thi-thu/duLieuThiThu.js";
import { coAmTiet, NGON_NGU, phatAm, taiDanhSachAmTiet } from "../am-thanh/phatAm.js";
import { tachThanh } from "../am-thanh/dauThanh.js";
import { taiChuHan, taiNguPhap } from "../du-lieu/taiDuLieu.js";
import { tronNgauNhien } from "../luyen-tap/tienIch.js";
import BaiKhong from "./BaiKhong.jsx";
import {
  CAC_BUOI,
  duongDanAm,
  duongDanHinh,
  ghiXongBuoi,
  hanVietCuaTu,
  maBai,
  taiBai,
  taiHanViet,
  THU_MUC_BAI_TAP,
} from "./duLieuCoBan.js";

/* ---------------------------------------------------------------------------
   Tiện ích nhỏ
   --------------------------------------------------------------------------- */

/** { trung, pinyin: [...] } → dạng ChuTrung dùng. */
const amTiet = (c) => Array.from(c.trung).map((chu, i) => ({ chu, pinyin: c.pinyin?.[i] ?? "" }));

function Cau({ c, co }) {
  return <ChuTrung amTiet={amTiet(c)} ghiChuBienDieu={c.ghiChuBienDieu} co={co} />;
}

function Muc({ tieuDe, phu, children }) {
  return (
    <section className="border-vien bg-nen-noi flex flex-col gap-3 rounded-[var(--bo-goc)] border p-4">
      {tieuDe && (
        <header>
          <h3 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
            <VanBanPha noiDung={tieuDe} />
          </h3>
          {phu && (
            <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
              <VanBanPha noiDung={phu} />
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

/** Âm thanh cả đoạn của sách (hội thoại, bài nghe). */
function DoanAm({ ma }) {
  if (!ma) return null;
  return (
    <audio controls preload="none" src={duongDanAm(ma)} className="h-10 w-full">
      Trình duyệt không phát được âm thanh.
    </audio>
  );
}

function Anh({ bai, ten, className = "" }) {
  if (!ten) return null;
  return (
    <img
      src={duongDanHinh(bai, ten)}
      alt=""
      loading="lazy"
      className={`rounded-[var(--bo-goc-nho)] bg-white object-contain ${className}`}
    />
  );
}

/**
 * Nút đọc một nhóm âm tiết ("mā má mǎ mà", "nǐ hǎo"). Chỉ hiện khi MỌI âm tiết
 * có ghi âm (thanh nhẹ, âm cuốn lưỡi, từ viết liền như "kāfēi" thì không có).
 */
function NutDocAmTiet({ chuoi }) {
  const [sanSang, setSanSang] = useState(false);
  const khoa = useMemo(() => {
    const ds = chuoi.trim().split(/\s+/).map(tachThanh);
    return ds.every((a) => a.thanh >= 1 && /^[a-z]+$/.test(a.am)) ? ds.map((a) => `${a.am}${a.thanh}`) : null;
  }, [chuoi]);
  useEffect(() => {
    if (!khoa) return;
    let conSong = true;
    taiDanhSachAmTiet().then(() => conSong && setSanSang(khoa.every((k) => coAmTiet(k))));
    return () => {
      conSong = false;
    };
  }, [khoa]);

  return (
    <button
      type="button"
      disabled={!khoa || !sanSang}
      onClick={() => khoa && phatAm(khoa.join(" "), NGON_NGU.AM_TIET)}
      className="border-vien bg-nen-noi enabled:hover:border-nhan rounded-[var(--bo-goc-nho)] border px-3 py-1.5 text-[length:1.1rem] disabled:cursor-default"
    >
      {chuoi}
      {khoa && sanSang && <span className="text-nhan-chu ml-1.5 text-[length:0.8rem]">▶</span>}
    </button>
  );
}

/* ---------------------------------------------------------------------------
   BUỔI 1 · HỘI THOẠI
   --------------------------------------------------------------------------- */
function BuoiHoiThoai({ bai }) {
  const [traLoi, setTraLoi] = useState({});
  const [xemLai, setXemLai] = useState(false);
  const kd = bai.khoiDong;
  // Khởi động của sách = ghép từ với ảnh A–F: dựng thành một nhóm "ghep-hinh"
  const nhomKhoiDong = kd && {
    tieuDe: "热身",
    kieu: "ghep-hinh",
    luaChon: kd.anh.map((ten, i) => ({ ma: "ABCDEF"[i], hinh: `bai-${String(bai.bai).padStart(2, "0")}/${ten}.webp` })),
    cau: kd.tu.map((t, i) => ({ so: i + 1, dong: [amTiet(t).map((a) => [a.chu, a.pinyin])], dapAn: t.dapAn })),
  };

  return (
    <div className="flex flex-col gap-4">
      {nhomKhoiDong && (
        <Muc tieuDe="Khởi động" phu="Chọn ảnh hợp với từng từ (đáp án suy từ ảnh, chưa được duyệt).">
          <NhomCau
            maDe={THU_MUC_BAI_TAP}
            phanMa="doc"
            nhom={nhomKhoiDong}
            traLoi={traLoi}
            chon={(so, gt) => setTraLoi((t) => ({ ...t, [so]: gt }))}
            xemLai={xemLai}
          />
          <NutKiemTra xemLai={xemLai} setXemLai={setXemLai} datLai={() => setTraLoi({})} />
        </Muc>
      )}

      {bai.hoiThoai.map((h) => (
        <Muc
          key={h.so}
          tieuDe={`Hội thoại ${h.so}`}
          phu={h.boiCanh ? `${h.boiCanh.viet} · ${h.boiCanh.trung}` : null}
        >
          <Anh bai={bai.bai} ten={h.anh} className="max-h-52 w-full" />
          <DoanAm ma={h.am} />
          <div className="flex flex-col gap-3">
            {h.cau.map((c, i) => (
              <div key={i} className="flex gap-3">
                <span className="bg-nen-phu mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold">
                  {c.nguoi}
                </span>
                <div className="min-w-0">
                  <Cau c={c} />
                  <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">{c.viet}</p>
                </div>
              </div>
            ))}
          </div>
          <DanhSachTu ds={[...h.tuMoi, ...(h.tenRieng ?? [])]} />
        </Muc>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BUỔI 2 · PHÁT ÂM
   --------------------------------------------------------------------------- */
function BuoiPhatAm({ bai }) {
  return (
    <div className="flex flex-col gap-4">
      {bai.phatAm.map((p, i) => (
        <Muc key={i} tieuDe={p.tieuDe}>
          {p.giaiThich && (
            <p className="m-0 leading-relaxed">
              <VanBanPha noiDung={p.giaiThich} />
            </p>
          )}
          {p.luuY && <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">Lưu ý: {p.luuY}</p>}
          {p.am && <DoanAm ma={p.am} />}

          {p.loai === "bang-am" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Thanh mẫu (phụ âm đầu)", p.thanhMau],
                ["Vận mẫu (vần)", p.vanMau],
              ].map(([ten, ds]) => (
                <div key={ten} className="flex flex-col gap-1">
                  <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] font-semibold">{ten}</p>
                  {ds.map((dong) => (
                    <p key={dong} className="m-0 text-[length:1.15rem] tracking-wide">
                      {dong}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {p.amTiet && (
            <div className="flex flex-wrap gap-2">
              {p.amTiet.map((a) => (
                <NutDocAmTiet key={a} chuoi={a} />
              ))}
            </div>
          )}

          {p.loai === "doc-hinh" && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {p.tu.map((t, k) => (
                <figure key={k} className="m-0 flex flex-col items-center gap-1">
                  <Anh bai={bai.bai} ten={p.hinh?.[k]} className="h-20 w-full" />
                  <NutDocAmTiet chuoi={t} />
                </figure>
              ))}
            </div>
          )}

          {p.loai === "phan-biet" && Array.isArray(p.hinh) && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {p.hinh.map((h) => (
                <figure key={h} className="m-0 flex flex-col items-center gap-1">
                  <Anh bai={bai.bai} ten={h} className="h-24 w-full" />
                  <figcaption className="font-bold">{h.replace("mieng-", "").replace("v", "ü")}</figcaption>
                </figure>
              ))}
            </div>
          )}

          {p.loai === "cau-tao-am-tiet" && (
            <div className="flex flex-wrap gap-2">
              {p.viDu.map(([py, chu, tm, vm, th]) => (
                <div key={py} className="border-vien rounded-[var(--bo-goc-nho)] border px-3 py-2 text-center">
                  <ChuTrung amTiet={[{ chu, pinyin: py }]} />
                  <p className="text-chu-mo m-0 text-[length:0.8rem]">
                    {tm || "—"} + {vm} · thanh {th}
                  </p>
                </div>
              ))}
            </div>
          )}

          {p.loai === "bien-dieu" && (
            <div className="flex flex-col gap-1">
              {p.viDu.map(([c1, p1, c2, p2, doc]) => (
                <div key={c1 + c2} className="m-0 flex items-center gap-3">
                  <ChuTrung amTiet={[{ chu: c1, pinyin: p1 }, { chu: c2, pinyin: p2 }]} />
                  <span className="text-chu-mo">→ đọc là</span>
                  <b>{doc}</b>
                </div>
              ))}
            </div>
          )}

          {(p.loai === "thanh-dieu" || p.loai === "thanh-nhe" || p.loai === "er-hoa" || p.loai === "phoi-thanh") && (
            <div className="flex flex-wrap gap-3">
              {(p.viDu ?? []).map((v, k) =>
                Array.isArray(v) ? (
                  <div key={k} className="flex flex-col items-center">
                    <ChuTrung amTiet={[{ chu: v[0], pinyin: v[1] }]} />
                    <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">{v[2]}</span>
                  </div>
                ) : (
                  <figure key={k} className="m-0 flex w-24 flex-col items-center gap-1">
                    <Anh bai={bai.bai} ten={p.hinh?.[k]} className="h-20 w-full" />
                    <Cau c={v} />
                    <span className="text-chu-mo text-center text-[length:var(--co-chu-latin-nho)]">{v.viet}</span>
                  </figure>
                ),
              )}
            </div>
          )}

          {["giuNguyen", "doiThanh2", "doiThanh4"].map(
            (k) =>
              p[k] && (
                <div key={k}>
                  <p className="text-chu-mo m-0 mb-1 text-[length:var(--co-chu-latin-nho)] font-semibold">
                    {k === "giuNguyen" ? "Giữ nguyên thanh gốc" : k === "doiThanh2" ? "Đọc thành thanh 2" : "Đọc thành thanh 4"}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {p[k].map((v) => (
                      <div key={v.trung}>
                        <Cau c={v} />
                        <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">{v.viet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
          )}

          {p.bang && (
            <table className="w-full border-collapse text-[length:var(--co-chu-latin-nho)]">
              <tbody>
                {p.bang.map(([truoc, sau]) => (
                  <tr key={truoc} className="border-vien border-b">
                    <td className="py-1.5">{truoc}</td>
                    <td className="py-1.5 font-semibold">→ {sau}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Muc>
      ))}

      {bai.cumTuLop && (
        <Muc tieuDe="Câu dùng trong lớp" phu="Giáo viên hay nói những câu này">
          <DoanAm ma={bai.cumTuLop.am} />
          {bai.cumTuLop.cau.map((c) => (
            <div key={c.trung}>
              <Cau c={c} />
              <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">{c.viet}</p>
            </div>
          ))}
        </Muc>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BUỔI 3 · TỪ VỰNG
   --------------------------------------------------------------------------- */
function DanhSachTu({ ds, hanViet = null }) {
  if (!ds?.length) return null;
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {ds.map((t) => {
        const hv = hanViet ? hanVietCuaTu(t.trung, hanViet) : null;
        return (
          <li key={t.trung} className="border-vien flex items-center gap-3 border-t py-2 first:border-t-0">
            <div className="min-w-0 flex-1">
              <Cau c={t} />
              <p className="m-0 text-[length:var(--co-chu-latin-nho)] leading-snug">
                {t.tuLoai && <span className="text-chu-mo">{t.tuLoai} · </span>}
                {t.viet}
                {hv && <span className="text-chu-mo"> · Hán Việt: {hv}</span>}
                {t.boSung && <span className="text-chu-mo"> · từ bổ sung của sách</span>}
                {t.capHsk > 1 && <span className="text-chu-mo"> · HSK {t.capHsk}</span>}
              </p>
            </div>
            <NutLoa noiDung={t.trung} anKhiChuaCoAm co={36} />
          </li>
        );
      })}
    </ul>
  );
}

function BuoiTuVung({ bai, hanViet }) {
  const tuSach = bai.hoiThoai.flatMap((h) => h.tuMoi);
  const tenRieng = bai.hoiThoai.flatMap((h) => h.tenRieng ?? []);
  return (
    <div className="flex flex-col gap-4">
      <Muc tieuDe={`Từ mới của bài (${tuSach.length})`} phu="Âm Hán Việt là dữ liệu mở, chưa được duyệt từng chữ.">
        <DanhSachTu ds={tuSach} hanViet={hanViet} />
      </Muc>
      {tenRieng.length > 0 && (
        <Muc tieuDe="Tên riêng">
          <DanhSachTu ds={tenRieng} />
        </Muc>
      )}
      {bai.vanDung?.tuBoSung && (
        <Muc tieuDe="Từ bổ sung trong phần vận dụng">
          <DanhSachTu ds={bai.vanDung.tuBoSung} hanViet={hanViet} />
        </Muc>
      )}
      {bai.tuBoSung2025?.length > 0 && (
        <Muc
          tieuDe={`Từ bổ sung HSK 1 bản 2025 (${bai.tuBoSung2025.length})`}
          phu="Sách không dạy những từ này nhưng đề thi HSK 1 mới có. Nghĩa là bản nháp, chưa duyệt."
        >
          <DanhSachTu ds={bai.tuBoSung2025} hanViet={hanViet} />
        </Muc>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BUỔI 4 · CHỮ HÁN & NGỮ PHÁP
   --------------------------------------------------------------------------- */
function BuoiChuNguPhap({ bai }) {
  const [idChu, setIdChu] = useState({});
  const [dangViet, setDangViet] = useState(null);
  const [nguPhapHsk, setNguPhapHsk] = useState([]);

  useEffect(() => {
    taiChuHan()
      .then((ds) => setIdChu(Object.fromEntries(ds.map((c) => [c.gianThe, c.id]))))
      .catch(() => {});
    taiNguPhap()
      .then((ds) => setNguPhapHsk((ds.danhSach ?? ds).filter((g) => bai.nguPhapHsk?.includes(g.id))))
      .catch(() => {});
  }, [bai]);

  const ch = bai.chuHan;
  return (
    <div className="flex flex-col gap-4">
      {ch && (
        <>
          {ch.net.length > 0 && (
          <Muc tieuDe="Nét cơ bản">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {ch.net.map((n) => (
                <li key={n.ten} className="flex items-center gap-3">
                  <span lang="zh-CN" className="font-trung w-10 text-center text-[length:1.8rem]">
                    {n.net}
                  </span>
                  <span className="flex-1">
                    <b>{n.viet}</b> <span className="text-chu-mo">({n.pinyin})</span>
                  </span>
                  <span lang="zh-CN" className="font-trung text-[length:1.3rem]">
                    {n.viDu.join(" ")}
                  </span>
                </li>
              ))}
            </ul>
          </Muc>
          )}

          <Muc tieuDe="Chữ độc thể" phu="Bấm “Tập viết” để viết thử bằng ngón tay.">
            {ch.chuDocThe.map((c) => (
              <div key={c.trung} className="border-vien flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-3">
                  <Cau c={c} co="the" />
                  <p className="m-0 flex-1 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
                    <VanBanPha noiDung={c.giaiThich} />
                  </p>
                  {idChu[c.trung] && (
                    <button
                      type="button"
                      onClick={() => setDangViet(dangViet === c.trung ? null : c.trung)}
                      className="border-vien shrink-0 rounded-[var(--bo-goc-tron)] border px-3 py-1.5 text-[length:var(--co-chu-latin-nho)]"
                    >
                      {dangViet === c.trung ? "Đóng" : "Tập viết"}
                    </button>
                  )}
                </div>
                {dangViet === c.trung && (
                  <div className="flex justify-center">
                    <KhungTapViet idChu={idChu[c.trung]} chu={c.trung} ngonNgu="trung" />
                  </div>
                )}
              </div>
            ))}
          </Muc>

          {ch.cauTruc && (
            <Muc tieuDe="Cấu trúc chữ Hán">
              {ch.cauTruc.map((c) => (
                <p key={c.ten} className="m-0">
                  <b>{c.viet}</b>{" "}
                  <span lang="zh-CN" className="font-trung text-chu-mo">
                    ({c.ten})
                  </span>{" "}
                  · ví dụ{" "}
                  <span lang="zh-CN" className="font-trung text-[length:1.3rem]">
                    {c.viDu.join(" ")}
                  </span>
                </p>
              ))}
            </Muc>
          )}

          {ch.boThu && (
            <Muc tieuDe="Bộ thủ">
              {ch.boThu.map((b) => (
                <div key={b.bo} className="flex items-center gap-3">
                  <span lang="zh-CN" className="font-trung w-10 text-center text-[length:1.8rem]">
                    {b.bo}
                  </span>
                  <span className="min-w-0 flex-1 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
                    <VanBanPha noiDung={`${b.ten} (${b.pinyin}). ${b.giaiThich}`} />
                  </span>
                  <span lang="zh-CN" className="font-trung text-[length:1.3rem]">
                    {b.viDu.join(" ")}
                  </span>
                </div>
              ))}
            </Muc>
          )}

          {ch.butThuan && (
            <Muc tieuDe="Quy tắc bút thuận">
              {ch.butThuan.map((b) => (
                <p key={b.quyTac} className="m-0">
                  <b>{b.viet}</b>{" "}
                  <span lang="zh-CN" className="font-trung text-chu-mo">
                    ({b.quyTac})
                  </span>{" "}
                  · ví dụ{" "}
                  <span lang="zh-CN" className="font-trung text-[length:1.3rem]">
                    {b.viDu.join(" ")}
                  </span>
                </p>
              ))}
            </Muc>
          )}
        </>
      )}

      {(bai.nguPhap ?? []).map((g, i) => (
        <Muc key={i} tieuDe={g.ten.viet} phu={g.ten.trung}>
          {g.mau && <p className="bg-nen-phu m-0 rounded-[var(--bo-goc-nho)] px-3 py-2 font-semibold">{g.mau}</p>}
          <p className="m-0 leading-relaxed">
            <VanBanPha noiDung={g.giaiThich} />
          </p>
          {g.viDu.map((v) => (
            <div key={v.trung}>
              <Cau c={v} />
              <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">{v.viet}</p>
            </div>
          ))}
        </Muc>
      ))}

      {nguPhapHsk.length > 0 && (
        <Muc tieuDe="Điểm ngữ pháp HSK 1 (bản 2025) của bài">
          <ul className="m-0 flex flex-col gap-1 pl-5">
            {nguPhapHsk.map((g) => (
              <li key={g.id}>
                <VanBanPha noiDung={g.ten} />
              </li>
            ))}
          </ul>
        </Muc>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BUỔI 5 · LUYỆN TẬP
   --------------------------------------------------------------------------- */
function NutKiemTra({ xemLai, setXemLai, datLai, diem = null }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {xemLai ? (
        <>
          {diem && (
            <span className="font-bold">
              Đúng {diem[0]}/{diem[1]}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              datLai();
              setXemLai(false);
            }}
            className="border-vien inline-flex items-center gap-1 rounded-[var(--bo-goc-tron)] border px-4 py-2"
          >
            <BieuTuong ten="lam-lai" co={16} /> Làm lại
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setXemLai(true)}
          className="bg-nhan text-chu-tren-nhan inline-flex items-center gap-1 rounded-[var(--bo-goc-tron)] px-5 py-2 font-bold"
        >
          <BieuTuong ten="kiem-tra" co={16} /> Kiểm tra
        </button>
      )}
    </div>
  );
}

/** Các dạng riêng của khoá này (phần hiển thị Thi thử không có). */
function NhomRieng({ nhom, traLoi, chon, xemLai }) {
  const vien = (so, gt) =>
    xemLai && gt === nhom.cau.find((c) => c.so === so)?.dapAn
      ? "border-dung border-2"
      : traLoi[so] === gt
        ? xemLai
          ? "border-sai border-2"
          : "border-nhan bg-nhan-nhat border-2"
        : "border-vien";

  if (nhom.kieu === "doc-theo") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-chu-mo m-0">
          <VanBanPha noiDung={nhom.huongDan} />
        </p>
        <DoanAm ma={nhom.am} />
        <div className="flex flex-wrap gap-2">
          {nhom.cau[0].amTiet.map((a) => (
            <NutDocAmTiet key={a} chuoi={a} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-chu-mo m-0">
        <VanBanPha noiDung={nhom.huongDan} />
      </p>
      {nhom.kieu === "doan-hinh" && (
        <p className="m-0 flex flex-wrap gap-3 font-semibold">
          {nhom.luaChon.map((l) => (
            <span key={l.ma}>
              {l.ma}. {l.pinyin}
            </span>
          ))}
        </p>
      )}
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {nhom.cau.map((c) => {
          const cacChon =
            nhom.kieu === "doan-hinh"
              ? nhom.luaChon.map((l) => [l.ma, l.ma])
              : nhom.kieu === "chon-am"
                ? c.luaChon.map((l) => [l, l])
                : (nhom.kieu === "danh-thanh-bu" ? ["bù", "bú"] : ["yī", "yí", "yì"]).map((x) => [x, x]);
          return (
            <li key={c.so} className="flex flex-wrap items-center gap-3">
              <span className="w-7 font-bold tabular-nums">{c.so}.</span>
              {c.hinh && <img src={`${THU_MUC_BAI_TAP}hinh/${c.hinh}`} alt="" className="h-20 w-24 rounded-[var(--bo-goc-nho)] bg-white object-contain" />}
              {c.sau && (
                // 不 / 一 + chữ sau: pinyin của 不/一 là chỗ phải trả lời nên để "?"
                <ChuTrung
                  amTiet={[
                    { chu: c.chu[0], pinyin: "?" },
                    { chu: c.chu[1], pinyin: c.sau },
                  ]}
                />
              )}
              <span className="flex flex-wrap gap-2">
                {cacChon.map(([gt, nhan]) => (
                  <button
                    key={gt}
                    type="button"
                    disabled={xemLai}
                    onClick={() => chon(c.so, gt)}
                    className={`bg-nen-noi min-w-12 rounded-[var(--bo-goc-nho)] border px-3 py-1.5 text-[length:1.1rem] disabled:opacity-100 ${vien(c.so, gt)}`}
                  >
                    {nhan}
                  </button>
                ))}
              </span>
              {xemLai && c.nghia && <span className="text-chu-mo text-[length:var(--co-chu-latin-nho)]">{c.nghia}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const KIEU_RIENG = new Set(["doc-theo", "doan-hinh", "chon-am", "danh-thanh-bu", "danh-thanh-yi"]);

function PhanBaiTap({ phanMa, ten, phan }) {
  const [traLoi, setTraLoi] = useState({});
  const [xemLai, setXemLai] = useState(false);
  const chon = (so, gt) => setTraLoi((t) => ({ ...t, [so]: gt }));
  const coCham = phan.nhom.filter((n) => n.kieu !== "doc-theo");
  const cacCau = coCham.flatMap((n) => n.cau.map((c) => [n, c]));
  const soDung = cacCau.filter(([n, c]) =>
    KIEU_RIENG.has(n.kieu) ? traLoi[c.so] === c.dapAn : traLoiDung(n, c, traLoi[c.so]),
  ).length;
  const soChacChan = cacCau.filter(([, c]) => c.chacChan === false).length;

  return (
    <Muc tieuDe={ten} phu={soChacChan ? `${soChacChan} câu có đáp án suy từ ảnh, đang chờ duyệt.` : null}>
      {phan.am && <DoanAm ma={phan.am} />}
      {phan.nhom.map((n, i) =>
        KIEU_RIENG.has(n.kieu) ? (
          <NhomRieng key={i} nhom={n} traLoi={traLoi} chon={chon} xemLai={xemLai} />
        ) : (
          <NhomCau
            key={i}
            maDe={THU_MUC_BAI_TAP}
            phanMa={phanMa}
            nhom={n}
            traLoi={traLoi}
            chon={chon}
            xemLai={xemLai}
            loiNghe={phan.loiNghe ?? {}}
          />
        ),
      )}
      {xemLai &&
        cacCau
          .filter(([, c]) => c.lyDo)
          .map(([, c]) => (
            <p key={c.so} className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
              Câu {c.so}: {c.lyDo}
            </p>
          ))}
      {coCham.length > 0 && (
        <NutKiemTra xemLai={xemLai} setXemLai={setXemLai} datLai={() => setTraLoi({})} diem={[soDung, cacCau.length]} />
      )}
    </Muc>
  );
}

function BuoiLuyenTap({ bai }) {
  const bt = bai.baiTap ?? {};
  return (
    <div className="flex flex-col gap-4">
      {bt.nghe && <PhanBaiTap phanMa="nghe" ten="Nghe" phan={bt.nghe} />}
      {bt.doc && <PhanBaiTap phanMa="doc" ten="Đọc" phan={bt.doc} />}
      {bt.phatAm && <PhanBaiTap phanMa="phatAm" ten="Phát âm" phan={bt.phatAm} />}
      {(bai.luyenTap ?? [])
        .filter((l) => l.loai === "tra-loi-tu-do")
        .map((l, i) => (
          <Muc key={i} tieuDe="Tự trả lời thành tiếng" phu={l.tieuDe}>
            {l.cau.map((c) => (
              <Cau key={c.trung} c={c} />
            ))}
          </Muc>
        ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BUỔI 6 · ÔN TẬP
   --------------------------------------------------------------------------- */
function BuoiOnTap({ bai }) {
  // Trắc nghiệm nghĩa: mỗi từ mới của bài, chọn nghĩa đúng trong 4 (nghĩa sai lấy từ các từ khác)
  const cauHoi = useMemo(() => {
    const tu = [...bai.hoiThoai.flatMap((h) => h.tuMoi), ...(bai.tuBoSung2025 ?? [])].filter((t) => t.viet);
    return tronNgauNhien(tu)
      .slice(0, 10)
      .map((t) => ({
        tu: t,
        luaChon: tronNgauNhien([t.viet, ...tronNgauNhien(tu.filter((x) => x.viet !== t.viet)).slice(0, 3).map((x) => x.viet)]),
      }));
  }, [bai]);
  const [chon, setChon] = useState({});
  const soDung = cauHoi.filter((c, i) => chon[i] === c.tu.viet).length;
  const xong = Object.keys(chon).length === cauHoi.length;

  return (
    <div className="flex flex-col gap-4">
      <Muc tieuDe="Kiểm tra nhanh: chọn nghĩa đúng" phu={xong ? `Đúng ${soDung}/${cauHoi.length}` : `${cauHoi.length} câu`}>
        {cauHoi.map((c, i) => (
          <div key={c.tu.trung} className="border-vien flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0">
            <Cau c={c.tu} />
            <div className="grid grid-cols-2 gap-2">
              {c.luaChon.map((lc) => {
                const daChon = chon[i] != null;
                const dung = lc === c.tu.viet;
                const vien = !daChon ? "border-vien" : dung ? "border-dung border-2" : chon[i] === lc ? "border-sai border-2" : "border-vien";
                return (
                  <button
                    key={lc}
                    type="button"
                    disabled={daChon}
                    onClick={() => setChon((t) => ({ ...t, [i]: lc }))}
                    className={`bg-nen-noi rounded-[var(--bo-goc-nho)] border px-3 py-2 text-left text-[length:var(--co-chu-latin-nho)] disabled:opacity-100 ${vien}`}
                  >
                    {daChon && dung ? "✓ " : daChon && chon[i] === lc ? "✗ " : ""}
                    {lc}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Muc>

      {bai.vanDung && (
        <Muc tieuDe={`Vận dụng: ${bai.vanDung.tieuDe}`} phu="Tự nói thành tiếng, thay bằng thông tin của bạn">
          {bai.vanDung.viDu.map((v, i) => (
            <div key={i}>
              <Cau c={v} />
              <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">{v.viet}</p>
            </div>
          ))}
        </Muc>
      )}

      {bai.vanHoa && (
        <Muc tieuDe={`Văn hoá: ${bai.vanHoa.tieuDe.viet}`} phu={bai.vanHoa.tieuDe.trung}>
          <p className="m-0 leading-relaxed">
            <VanBanPha noiDung={bai.vanHoa.noiDung} />
          </p>
          {bai.vanHoa.cau.map((c) => (
            <Cau key={c.trung} c={c} />
          ))}
        </Muc>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   KHUNG BÀI HỌC
   --------------------------------------------------------------------------- */
export default function BaiHocCoBan({ soBai, uid, tienDo, capNhatTienDo, quayLai }) {
  const [bai, setBai] = useState(null);
  const [loi, setLoi] = useState(false);
  const [hanViet, setHanViet] = useState({});
  const daXong = tienDo[maBai(soBai)] ?? [];
  // Bài 0 có 2 buổi riêng (bai-00.json), các bài khác 6 buổi chung
  const cacBuoi = bai?.buoi ? bai.buoi.map(({ so, ten, moTa }) => ({ so, ten, moTa })) : CAC_BUOI;
  // Mở bài: vào buổi đầu tiên chưa xong
  const [buoi, setBuoi] = useState(() => {
    const soBuoi = soBai === 0 ? 2 : CAC_BUOI.length; // Bài 0 chỉ có 2 buổi
    for (let so = 1; so <= soBuoi; so++) if (!daXong.includes(so)) return so;
    return 1;
  });

  useEffect(() => {
    taiBai(soBai).then(setBai, () => setLoi(true));
    taiHanViet().then(setHanViet);
  }, [soBai]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [buoi]);

  async function hoanThanh() {
    capNhatTienDo(await ghiXongBuoi(uid, tienDo, soBai, buoi));
    if (buoi < cacBuoi.length) setBuoi(buoi + 1);
    else quayLai();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pt-4 pb-28">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={quayLai}
          className="text-chu-mo inline-flex items-center gap-1 text-[length:var(--co-chu-latin-nho)]"
        >
          <BieuTuong ten="quay-lai" co={18} /> Lộ trình
        </button>
      </header>

      {loi && <p className="text-sai mt-6">Không tải được bài học. Hãy kiểm tra mạng rồi mở lại.</p>}
      {!bai && !loi && <p className="text-chu-mo mt-6">Đang tải bài…</p>}

      {bai && (
        <>
          <div className="mt-3">
            {soBai > 0 && <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">Bài {soBai}</p>}
            {bai.ten.trung && <Cau c={bai.ten} />}
            <p className="m-0 font-semibold">{bai.ten.viet}</p>
          </div>

          {/* 6 buổi */}
          <nav className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2" aria-label="Các buổi của bài">
            {cacBuoi.map((b) => {
              const xong = daXong.includes(b.so);
              return (
                <button
                  key={b.so}
                  type="button"
                  onClick={() => setBuoi(b.so)}
                  aria-current={buoi === b.so ? "step" : undefined}
                  className={`shrink-0 rounded-[var(--bo-goc-tron)] border px-3 py-1.5 text-[length:var(--co-chu-latin-nho)] whitespace-nowrap ${buoi === b.so ? "border-nhan bg-nhan-nhat border-2 font-bold" : "border-vien bg-nen-noi"}`}
                >
                  {xong ? "✓ " : `${b.so}. `}
                  {b.ten}
                </button>
              );
            })}
          </nav>
          <p className="text-chu-mo mt-1 mb-4 text-[length:var(--co-chu-latin-nho)]">
            Buổi {buoi}: {cacBuoi[buoi - 1]?.moTa}
          </p>

          {soBai === 0 && <BaiKhong bai={bai} buoi={buoi} />}
          {soBai > 0 && buoi === 1 && <BuoiHoiThoai bai={bai} />}
          {soBai > 0 && buoi === 2 && <BuoiPhatAm bai={bai} />}
          {soBai > 0 && buoi === 3 && <BuoiTuVung bai={bai} hanViet={hanViet} />}
          {soBai > 0 && buoi === 4 && <BuoiChuNguPhap bai={bai} />}
          {soBai > 0 && buoi === 5 && <BuoiLuyenTap bai={bai} />}
          {soBai > 0 && buoi === 6 && <BuoiOnTap bai={bai} />}

          <p className="text-chu-mo mt-6 text-[length:0.75rem] leading-relaxed">
            {soBai === 0 ? (
              "Bài 0 do Riyi soạn riêng cho người Việt. Các so sánh với tiếng Việt là gần đúng, đang chờ duyệt. Âm thanh: bộ audio-cmn (CC BY-SA)."
            ) : (
              <>
                Nội dung chọn lọc từ giáo trình <VanBanPha noiDung="HSK标准教程" /> 1. Bản dịch tiếng Việt và đáp án bài
                tập là bản nháp, đang chờ duyệt. Âm Hán Việt: Kai Hanzi HSK × Sino-Vietnamese dataset, CC BY 4.0.
              </>
            )}
          </p>

          {/* Nút hoàn thành buổi, cố định phía dưới */}
          <div className="bg-nen/95 fixed right-0 bottom-0 left-0 z-20 border-t border-[var(--vien)] px-5 py-3 backdrop-blur" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
            <div className="mx-auto flex max-w-xl justify-end">
              <button
                type="button"
                onClick={hoanThanh}
                className="nut-hoan-thanh rounded-[var(--bo-goc-tron)] border px-6 py-3 font-bold"
              >
                {daXong.includes(buoi) ? "Buổi đã xong · " : "Hoàn thành buổi · "}
                {buoi < cacBuoi.length ? "sang buổi tiếp" : "về lộ trình"}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
