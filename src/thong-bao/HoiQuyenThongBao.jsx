/* =============================================================================
   THÔNG BÁO MẶC ĐỊNH BẬT (quyết định 18.58)
   =============================================================================

   Nằm ở App.jsx, chạy trên mọi màn hình, làm hai việc:

   1. HỎI QUYỀN LẦN ĐẦU: máy chưa từng được hỏi thì sau khi mở app ~1.5 giây,
      hiện hộp "Cho phép Riyi nhắc bạn học?". Bấm "Cho phép" thì trình duyệt
      mới hiện hộp xin quyền của chính nó (trình duyệt chỉ cho xin quyền ngay
      sau một lần bấm của người dùng). Mỗi máy chỉ hỏi MỘT lần, chọn "Để sau"
      thì thôi; muốn bật lại thì vào Cài đặt.
      Không hỏi khi: trình duyệt không hỗ trợ (ví dụ iPhone chưa cài app vào
      màn hình chính), máy đã cho phép / đã chặn rồi, hoặc người học đã tự tắt
      thông báo trong Cài đặt.

   2. TỰ ĐĂNG KÝ LẠI: đã đăng nhập, không tự tắt, máy đã cho phép thì lặng lẽ
      lưu mã thiết bị (mã có thể đổi theo thời gian). Người học cho phép lúc
      chưa đăng nhập thì đăng nhập xong cũng tự được đăng ký.
   ============================================================================= */

import { useEffect, useState } from "react";

import { useNguoiDung } from "../nguoi-dung/NguoiDung.jsx";
import { useThongBao } from "../thanh-phan/ThongBao.jsx";
import HopThoaiXacNhan from "../thanh-phan/HopThoaiXacNhan.jsx";
import {
  batThongBao,
  daCauHinhThongBao,
  daHoiQuyenMayNay,
  dangKyLaiNeuCan,
  ghiDaHoiQuyen,
  quyenHienTai,
  trinhDuyetHoTro,
  xinQuyen,
} from "./dangKyThongBao.js";

export default function HoiQuyenThongBao() {
  const nd = useNguoiDung();
  const hienThongBao = useThongBao();
  const [hien, setHien] = useState(false);
  const uid = nd.daDangNhap ? nd.nguoi?.uid : null;

  // Việc 2: tự đăng ký lại mã thiết bị mỗi lần mở app
  useEffect(() => {
    if (uid && nd.thongBaoBat) dangKyLaiNeuCan(uid);
  }, [uid, nd.thongBaoBat]);

  // Việc 1: hỏi quyền lần đầu trên máy này
  const dangKiemTra = nd.trangThai === "dang-kiem-tra";
  const daTuTat = nd.daDangNhap && !nd.thongBaoBat;
  useEffect(() => {
    if (dangKiemTra || daTuTat) return undefined;
    if (!trinhDuyetHoTro() || !daCauHinhThongBao()) return undefined;
    if (quyenHienTai() !== "default" || daHoiQuyenMayNay()) return undefined;
    const hen = setTimeout(() => setHien(true), 1500);
    return () => clearTimeout(hen);
  }, [dangKiemTra, daTuTat]);

  if (!hien) return null;

  async function choPhep() {
    // xinQuyen phải chạy NGAY trong lần bấm, trước mọi việc chờ đợi khác
    const hoiQuyen = xinQuyen();
    ghiDaHoiQuyen();
    setHien(false);
    const quyen = await hoiQuyen;
    if (quyen !== "granted") {
      hienThongBao("Bạn chưa cho phép thông báo. Có thể bật lại trong Cài đặt.", 4);
      return;
    }
    if (!uid) {
      hienThongBao("Đã cho phép. Đăng nhập để Riyi nhắc bạn học mỗi ngày.", 4);
      return;
    }
    const kq = await batThongBao(uid);
    if (kq.thanhCong) {
      nd.doiThongBao(true);
      hienThongBao("Đã bật thông báo nhắc học.");
    } else if (kq.thongBao) {
      hienThongBao(kq.thongBao, 4);
    }
  }

  function deSau() {
    ghiDaHoiQuyen();
    setHien(false);
  }

  return (
    <HopThoaiXacNhan
      tieuDe="Cho phép Riyi nhắc bạn học?"
      noiDung={
        <>
          <p className="m-0 mb-2">
            Mỗi ngày Riyi gửi 3 lời nhắc ngắn: 7h sáng chào ngày mới, 14h và 21h báo
            tiến độ hôm nay.
          </p>
          <p className="m-0">
            Bấm "Cho phép", rồi chọn <span className="font-bold">Cho phép</span> (Allow)
            ở hộp hỏi của máy. Bạn có thể tắt bất cứ lúc nào trong Cài đặt.
          </p>
        </>
      }
      nutXacNhan="Cho phép"
      nutHuy="Để sau"
      khiXacNhan={choPhep}
      khiHuy={deSau}
    />
  );
}
