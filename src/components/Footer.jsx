import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="pt-5 pb-4 mt-5 footer-hocmoi">
      <div className="container">
        {/* TẦNG 1: 5 CỘT LIÊN KẾT */}
        <div className="row row-cols-1 row-cols-md-3 row-cols-lg-5 g-4 mb-4">
          
          <div className="col">
            <h5 className="footer-title">Về HOCMOI</h5>
            <ul className="list-unstyled">
              <li><Link to="/gioi-thieu" className="footer-link">Giới thiệu</Link></li>
              <li><Link to="/giao-vien" className="footer-link">Giáo viên nổi tiếng</Link></li>
              <li><Link to="/hoc-sinh" className="footer-link">Học sinh tiêu biểu</Link></li>
              <li><Link to="/quy-che" className="footer-link">Quy chế hoạt động</Link></li>
              <li><Link to="/tuyen-dung" className="footer-link">Tuyển dụng</Link></li>
            </ul>
          </div>

          <div className="col">
            <h5 className="footer-title">Dịch vụ</h5>
            <ul className="list-unstyled">
              <li><Link to="/thu-vien" className="footer-link">Thư viện</Link></li>
              <li><Link to="/on-luyen" className="footer-link">Ôn luyện</Link></li>
              <li><Link to="/dien-dan" className="footer-link">Diễn đàn</Link></li>
            </ul>
          </div>

          <div className="col">
            <h5 className="footer-title">Hỗ trợ khách hàng</h5>
            <ul className="list-unstyled">
              <li><Link to="/tro-giup" className="footer-link">Trung tâm hỗ trợ</Link></li>
              <li><Link to="/lien-he" className="footer-link">Email phản hồi</Link></li>
              <li><Link to="/hotline" className="footer-link">Đường dây nóng</Link></li>
            </ul>
          </div>

          <div className="col">
            <h5 className="footer-title">Dành cho đối tác</h5>
            <ul className="list-unstyled">
              <li><span className="footer-link"><i className="bi bi-envelope me-2"></i>partner@hocmoi.vn</span></li>
              <li><span className="footer-link"><i className="bi bi-telephone me-2"></i>024 7300 1234</span></li>
              <li><span className="footer-link"><i className="bi bi-printer me-2"></i>Fax: +84 24 1234 5678</span></li>
            </ul>
          </div>

          <div className="col">
            <h5 className="footer-title">Tải ứng dụng</h5>
            <div className="d-flex flex-column gap-2">
              <a href="#" className="btn btn-outline-light d-flex align-items-center justify-content-start text-start btn-sm footer-app-btn">
                <i className="bi bi-google-play fs-4 me-2 text-warning"></i>
                <div>
                  <div className="fs-7">Get it on</div>
                  <div className="fw-bold fs-85">Google Play</div>
                </div>
              </a>
              <a href="#" className="btn btn-outline-light d-flex align-items-center justify-content-start text-start btn-sm footer-app-btn">
                <i className="bi bi-apple fs-4 me-2"></i>
                <div>
                  <div className="fs-7">Download on the</div>
                  <div className="fw-bold fs-85">App Store</div>
                </div>
              </a>
            </div>
          </div>

        </div>

        <hr className="border-secondary opacity-50 mb-4" />

        {/* TẦNG 2: THÔNG TIN PHÁP LÝ */}
        <div className="row g-4 footer-text">
          <div className="col-12 col-lg-7">
            <p className="mb-1"><strong className="text-white">Cơ quan chủ quản:</strong> Công ty Cổ phần Đầu tư và Dịch vụ Giáo dục</p>
            <p className="mb-3"><strong>MST:</strong> 0102183602 do Sở kế hoạch và Đầu tư thành phố Hà Nội cấp ngày 13 tháng 03 năm 2007</p>
            <p className="mb-1"><strong className="text-white">Địa chỉ:</strong></p>
            <ul className="list-unstyled ms-3">
              <li className="mb-1"><i className="bi bi-geo-alt-fill me-2 text-main-orange"></i><strong>Văn phòng Hà Nội:</strong> Tầng 4, Tòa nhà 25T2, Đường Nguyễn Thị Thập, Phường Trung Hoà, Quận Cầu Giấy, Hà Nội.</li>
              <li><i className="bi bi-geo-alt-fill me-2 text-main-orange"></i><strong>Văn phòng TP.HCM:</strong> Lầu 3, 51-53 Võ Văn Tần, phường Võ Thị Sáu, quận 3, Tp. Hồ Chí Minh.</li>
            </ul>
          </div>

          <div className="col-12 col-lg-5">
            <p className="mb-2"><i className="bi bi-headset me-2 text-main-orange"></i><strong>Hotline:</strong> <span className="text-white fw-bold fs-5">1900 6933</span></p>
            <p className="mb-3"><i className="bi bi-envelope-fill me-2 text-main-orange"></i><strong>Email:</strong> hotro@hocmoi.vn</p>
            <p className="mb-1"><strong>Chịu trách nhiệm nội dung:</strong> Phạm Giang Linh</p>
            <p className="mb-0">Giấy phép cung cấp dịch vụ mạng xã hội trực tuyến số 597/GP-BTTTT Bộ Thông tin và Truyền thông cấp ngày 30/12/2016.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}