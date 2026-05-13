import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './DangNhap.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const DangKy = () => {
  const navigate = useNavigate();
  
  // 1. STATE LƯU TRỮ DỮ LIỆU CƠ BẢN
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  
  // 2. STATE LƯU TRỮ DỮ LIỆU MỤC TIÊU HỌC TẬP
  const [khoiThi, setKhoiThi] = useState('');
  const [diemKyVong, setDiemKyVong] = useState('');
  const [truongKyVong, setTruongKyVong] = useState('');

  // STATE ĐIỀU KHIỂN UI
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Kiểm tra mật khẩu xác nhận
    if (matKhau !== xacNhanMatKhau) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (matKhau.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);

    try {
      // Ép cứng VaiTro là Học Sinh và đưa các trường mục tiêu vào payload
      const payload = {
        HoTen: hoTen,
        Email: email,
        MatKhau: matKhau,
        VaiTro: 'HocSinh',
        KhoiThiMucTieu: khoiThi, 
        DiemKyVong: diemKyVong ? parseFloat(diemKyVong) : 0, 
        TruongKyVong: truongKyVong
      };

      // Đã sửa: Dùng fetchClient, tự động cấu hình URL và Headers
      const response = await fetchClient('/api/nguoidung/sign-up', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Đăng ký thành công! Hãy đăng nhập để bắt đầu học tập.");
        navigate('/dang-nhap'); // Chuyển hướng sang trang đăng nhập
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Email này có thể đã được sử dụng.');
      }
    } catch (error) {
      setErrorMessage('Lỗi kết nối tới máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`${styles.pageLogin} py-5 bg-light`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className={`card shadow-sm border-0 p-4 p-md-5 ${styles.loginCard}`}>
              
              <div className={styles.loginBlock1}>
                <h3 className="text-center fw-bold mb-2">Tạo tài khoản học tập</h3>
                <p className="text-center text-muted mb-4 small">Tham gia hệ thống luyện thi HOCMOI.VN</p>
                
                <form onSubmit={handleRegister}>
                  
                  {/* --- NHÓM 1: THÔNG TIN TÀI KHOẢN --- */}
                  <h6 className="fw-bold text-main-orange mb-3 border-bottom pb-2">Thông tin tài khoản</h6>
                  
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <label className="form-label fw-medium small">Họ và tên <span className="text-danger">*</span></label>
                      <div className={`input-group ${styles.loginInputGroup}`}>
                        <span className="input-group-text bg-white text-muted">
                          <i className="bi bi-person-badge"></i>
                        </span>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Nhập họ tên đầy đủ" 
                          required 
                          value={hoTen}
                          onChange={(e) => setHoTen(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium small">Địa chỉ Email <span className="text-danger">*</span></label>
                      <div className={`input-group ${styles.loginInputGroup}`}>
                        <span className="input-group-text bg-white text-muted">
                          <i className="bi bi-envelope"></i>
                        </span>
                        <input 
                          type="email" 
                          className="form-control" 
                          placeholder="Ví dụ: hocsinh@gmail.com" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <label className="form-label fw-medium small">Mật khẩu <span className="text-danger">*</span></label>
                      <div className={`input-group ${styles.loginInputGroup}`}>
                        <span className="input-group-text bg-white text-muted">
                          <i className="bi bi-lock"></i>
                        </span>
                        <input 
                          type="password" 
                          className="form-control" 
                          placeholder="Từ 6 ký tự" 
                          required 
                          minLength="6"
                          value={matKhau}
                          onChange={(e) => setMatKhau(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium small">Xác nhận mật khẩu <span className="text-danger">*</span></label>
                      <div className={`input-group ${styles.loginInputGroup}`}>
                        <span className="input-group-text bg-white text-muted">
                          <i className="bi bi-shield-check"></i>
                        </span>
                        <input 
                          type="password" 
                          className="form-control" 
                          placeholder="Nhập lại mật khẩu" 
                          required 
                          value={xacNhanMatKhau}
                          onChange={(e) => setXacNhanMatKhau(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- NHÓM 2: MỤC TIÊU HỌC TẬP --- */}
                  <h6 className="fw-bold text-main-orange mb-3 border-bottom pb-2 mt-4">Mục tiêu đại học (Không bắt buộc)</h6>
                  
                  <div className="row mb-3">
                    <div className="col-md-4 mb-3 mb-md-0">
                      <label className="form-label fw-medium small">Khối thi</label>
                      <select 
                        className={`form-select ${styles.loginInputGroup}`} 
                        value={khoiThi}
                        onChange={(e) => setKhoiThi(e.target.value)}
                      >
                        <option value="">-- Chọn khối --</option>
                        <option value="A00">A00 (Toán, Lý, Hóa)</option>
                        <option value="A01">A01 (Toán, Lý, Anh)</option>
                        <option value="B00">B00 (Toán, Hóa, Sinh)</option>
                        <option value="C00">C00 (Văn, Sử, Địa)</option>
                        <option value="D01">D01 (Toán, Văn, Anh)</option>
                        <option value="Khác">Khối khác</option>
                      </select>
                    </div>

                    <div className="col-md-4 mb-3 mb-md-0">
                      <label className="form-label fw-medium small">Điểm kỳ vọng</label>
                      <div className={`input-group ${styles.loginInputGroup}`}>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="VD: 26.5" 
                          step="0.1"
                          min="0"
                          max="30"
                          value={diemKyVong}
                          onChange={(e) => setDiemKyVong(e.target.value)}
                        />
                        <span className="input-group-text bg-light text-muted">Điểm</span>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-medium small">Trường đại học mục tiêu</label>
                      <div className={`input-group ${styles.loginInputGroup}`}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="VD: Đại học Bách Khoa..." 
                          value={truongKyVong}
                          onChange={(e) => setTruongKyVong(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hiển thị thông báo lỗi */}
                  {errorMessage && (
                    <div className="alert alert-danger py-2 fs-85 text-center mt-3" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  {/* Nút Submit */}
                  <button 
                    type="submit" 
                    className="btn btn-main-orange w-100 py-3 mt-4 fw-bold text-white rounded-3 shadow-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Đang xử lý...</>
                    ) : 'Đăng ký tài khoản'}
                  </button>
                </form>
              </div>

              {/* ĐƯỜNG KẺ NGĂN CÁCH */}
              <div className={`${styles.loginDivider} d-flex align-items-center my-4`}>
                <hr className="flex-grow-1 border-secondary opacity-25" />
                <span className="mx-3 text-muted small text-uppercase fw-bold">Hoặc đăng ký bằng</span>
                <hr className="flex-grow-1 border-secondary opacity-25" />
              </div>

              {/* NÚT MẠNG XÃ HỘI */}
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <button type="button" className={`btn w-100 d-flex align-items-center justify-content-center ${styles.btnSocial} ${styles.btnFb}`}>
                    <i className="bi bi-facebook fs-5 me-2"></i>
                    <span>Facebook</span>
                  </button>
                </div>
                <div className="col-12 col-md-6">
                  <button type="button" className={`btn w-100 d-flex align-items-center justify-content-center ${styles.btnSocial} ${styles.btnGoogle}`}>
                    <i className="bi bi-google fs-5 me-2"></i>
                    <span>Gmail</span>
                  </button>
                </div>
              </div>
              
              {/* Điều hướng về Đăng nhập */}
              <div className="text-center mt-4">
                <span className="text-muted small">Đã có tài khoản?</span> 
                <Link to="/dang-nhap" className={`fw-bold text-decoration-none small ms-1 ${styles.orangeText}`}>
                  Đăng nhập tại đây
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DangKy;