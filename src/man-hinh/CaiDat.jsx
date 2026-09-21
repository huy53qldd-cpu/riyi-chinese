/* =============================================================================
   MÀN HÌNH CÀI ĐẶT
   =============================================================================

   Gồm: tài khoản (đăng nhập / đăng xuất), bật tắt furigana, giao diện sáng/tối,
   và mục Ứng dụng (phiên bản, nút "Cập nhật nội dung").

   Chế độ khách vẫn đổi được furigana và giao diện, nhưng chỉ lưu trên máy này.
   Người đã đăng nhập thì các cài đặt này đi theo tài khoản sang máy khác.
   ============================================================================= */

import { useEffect, useState } from "react";

import { capNhatNoiDung, phienBanNoiDung } from "../du-lieu/taiDuLieu.js";
import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";

export default function CaiDat({ quayLai }) {
  const nd = useNguoiDung();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-5 py-6">
      <div>
        <button
          type="button"
          onClick={quayLai}
          className="border-vien rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
        >
          ← Quay lại
        </button>
      </div>

      <h1 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Cài đặt
      </h1>

      {/* --- Tài khoản --- */}
      <section className="border-vien bg-nen-noi flex flex-col gap-3 rounded-[var(--bo-goc)] border p-4">
        <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          Tài khoản
        </h2>

        {nd.daDangNhap ? (
          <>
            <p className="m-0 text-[length:var(--co-chu-latin)]">
              Đang đăng nhập:{" "}
              <span className="font-bold">
                {nd.nguoi?.ten || nd.nguoi?.email}
              </span>
            </p>
            <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
              Tiến độ học và cài đặt của bạn được lưu theo tài khoản này.
            </p>
            <button
              type="button"
              onClick={nd.dangXuat}
              className="border-vien self-start rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
              Bạn đang học ở chế độ khách, tiến độ sẽ không được lưu. Đăng nhập
              để lưu tiến độ và dùng được trên nhiều máy.
            </p>
            <NutDangNhap nd={nd} />
          </>
        )}
      </section>

      {/* --- Hiển thị --- */}
      <section className="border-vien bg-nen-noi flex flex-col gap-4 rounded-[var(--bo-goc)] border p-4">
        <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
          Hiển thị
        </h2>

        <CongTat
          nhan="Furigana"
          moTa="Chữ nhỏ ghi cách đọc phía trên chữ Hán tiếng Nhật."
          bat={nd.caiDat.furigana === "bat"}
          doi={(bat) => nd.doiCaiDat("furigana", bat ? "bat" : "tat")}
        />

        <CongTat
          nhan="Giao diện tối"
          moTa="Nền tối, dịu mắt khi học buổi tối."
          bat={nd.caiDat.giaoDien === "toi"}
          doi={(bat) => nd.doiCaiDat("giaoDien", bat ? "toi" : "sang")}
        />

        {!nd.daDangNhap && (
          <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
            Ở chế độ khách, cài đặt chỉ được lưu trên máy này.
          </p>
        )}
      </section>

      <MucUngDung />
    </main>
  );
}

/* -----------------------------------------------------------------------------
   MỤC ỨNG DỤNG: phiên bản app, phiên bản nội dung, nút cập nhật nội dung
   ----------------------------------------------------------------------------- */
function MucUngDung() {
  const hienThongBao = useThongBao();
  const [banNoiDung, setBanNoiDung] = useState(null);
  const [dangCapNhat, setDangCapNhat] = useState(false);

  useEffect(() => {
    let conSong = true;
    phienBanNoiDung().then((b) => conSong && setBanNoiDung(b));
    return () => {
      conSong = false;
    };
  }, []);

  async function capNhat() {
    setDangCapNhat(true);
    try {
      const cu = banNoiDung;
      const moi = await capNhatNoiDung();
      setBanNoiDung(moi);
      hienThongBao(
        cu !== null && moi > cu
          ? `Đã tải nội dung mới (phiên bản ${moi}).`
          : "Nội dung bài học đã là bản mới nhất.",
      );
    } catch {
      hienThongBao("Không cập nhật được. Hãy kiểm tra mạng rồi thử lại.");
    }
    setDangCapNhat(false);
  }

  return (
    <section className="border-vien bg-nen-noi flex flex-col gap-3 rounded-[var(--bo-goc)] border p-4">
      <h2 className="m-0 text-[length:var(--co-chu-latin)] font-bold">
        Ứng dụng
      </h2>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[length:var(--co-chu-latin-nho)]">
        <dt className="text-chu-mo">Phiên bản app</dt>
        <dd className="m-0 font-semibold tabular-nums">{__PHIEN_BAN_APP__}</dd>
        <dt className="text-chu-mo">Nội dung bài học</dt>
        <dd className="m-0 font-semibold tabular-nums">
          {banNoiDung === null ? "…" : `phiên bản ${banNoiDung}`}
        </dd>
      </dl>
      <button
        type="button"
        onClick={capNhat}
        disabled={dangCapNhat}
        className="border-vien self-start rounded-[var(--bo-goc-tron)] border px-4 py-2 text-[length:var(--co-chu-latin-nho)] font-semibold disabled:opacity-50"
      >
        {dangCapNhat ? "Đang cập nhật..." : "Cập nhật nội dung"}
      </button>
      <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)] leading-relaxed">
        App tự lấy nội dung mới khi mở. Bấm nút này nếu muốn lấy ngay mà không
        cần mở lại app.
      </p>
    </section>
  );
}

/** Nút đăng nhập Google, dùng cả ở màn Cài đặt và màn chọn khoá học. */
export function NutDangNhap({ nd }) {
  const sanSang = nd.coTheDangNhap && nd.trangThai !== "dang-kiem-tra";
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={nd.dangNhap}
        disabled={!sanSang}
        className="bg-nhan text-chu-tren-nhan self-start rounded-[var(--bo-goc-tron)] px-5 py-2.5 text-[length:var(--co-chu-latin)] font-bold disabled:opacity-50"
      >
        Đăng nhập bằng Google
      </button>
      {!nd.coTheDangNhap && (
        <p className="text-chu-mo m-0 text-[length:var(--co-chu-latin-nho)]">
          Đăng nhập chưa sẵn sàng vì ứng dụng chưa được kết nối Firebase.
        </p>
      )}
    </div>
  );
}

/** Công tắc bật/tắt. Có chữ mô tả và role="switch" cho trình đọc màn hình. */
function CongTat({ nhan, moTa, bat, doi }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[length:var(--co-chu-latin)] font-semibold">
          {nhan}
        </div>
        <div className="text-chu-mo text-[length:var(--co-chu-latin-nho)] leading-snug">
          {moTa}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={bat}
        aria-label={nhan}
        onClick={() => doi(!bat)}
        className={`relative h-7 w-12 shrink-0 rounded-[var(--bo-goc-tron)] transition-colors ${
          bat ? "bg-nhan" : "bg-vien"
        }`}
      >
        <span
          className="bg-nen-noi absolute top-0.5 h-6 w-6 rounded-full shadow transition-all"
          style={{ left: bat ? "1.375rem" : "0.125rem" }}
        />
      </button>
    </div>
  );
}
