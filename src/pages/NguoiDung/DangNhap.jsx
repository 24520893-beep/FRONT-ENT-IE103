import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './DangNhap.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const DangNhap = () => {
  const navigate = useNavigate();
  
  // 1. Tạo state để lưu trữ dữ liệu nhập vào và thông báo lỗi
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. Hàm xử lý đăng nhập gọi API
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Đã sửa: Dùng fetchClient để gọi API Đăng nhập
      const response = await fetchClient('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ Email: username, MatKhau: password }),
      });

      const loginData = await response.json();

      if (response.ok) {
        const token = loginData.token;
        
        // LƯU TOKEN TRƯỚC VÀO LOCAL STORAGE
        // (Để fetchClient ở bước tiếp theo có thể tự động móc ra gửi kèm vào Headers)
        localStorage.setItem('accessToken', token);
        
        // Gọi API lấy thông tin chi tiết bằng fetchClient
        const userRes = await fetchClient('/api/nguoidung/me');
        const userData = await userRes.json();

        if (userRes.ok) {
          // Lưu đối tượng user
          localStorage.setItem('user', JSON.stringify(userData)); 
          
          // Điều hướng dựa trên VaiTro (nếu muốn, hoặc về trang thông tin cá nhân)
          navigate('/thong-tin-ca-nhan');
        }
      } else {
        setErrorMessage(loginData.message || 'Sai thông tin đăng nhập');
      }
    } catch (error) {
      setErrorMessage('Lỗi kết nối server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`${styles.pageLogin} py-5 bg-light`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <div className={`card shadow-sm border-0 p-4 p-md-5 ${styles.loginCard}`}>
              
              <div className={styles.loginBlock1}>
                <h3 className="text-center fw-bold mb-4">Đăng nhập vào tài khoản của bạn</h3>
                
                <form onSubmit={handleLogin}>
                  {/* Ô nhập Tên đăng nhập */}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Tên đăng nhập</label>
                    <div className={`input-group ${styles.loginInputGroup}`}>
                      <span className="input-group-text bg-white text-muted">
                        <i className="bi bi-person"></i>
                      </span>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Nhập email đăng nhập..." 
                        required 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Ô nhập Mật khẩu */}
                  <div className="mb-4">
                    <label className="form-label fw-medium">Mật khẩu</label>
                    <div className={`input-group ${styles.loginInputGroup}`}>
                      <span className="input-group-text bg-white text-muted">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Nhập mật khẩu" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                      />
                    </div>
                    <div className="text-end mt-2">
                      <Link to="/quen-mat-khau" className={`text-decoration-none small ${styles.orangeText}`}>
                        Quên mật khẩu?
                      </Link>
                    </div>
                  </div>

                  {/* Hiển thị thông báo lỗi nếu có */}
                  {errorMessage && (
                    <div className="alert alert-danger py-2 fs-85 text-center" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  {/* Nút Submit có trạng thái loading */}
                  <button 
                    type="submit" 
                    className="btn btn-main-orange w-100 py-2 fw-bold text-white rounded-3"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                  </button>
                </form>
              </div>

              {/* ĐƯỜNG KẺ NGĂN CÁCH */}
              <div className={`${styles.loginDivider} d-flex align-items-center my-4`}>
                <hr className="flex-grow-1 border-secondary opacity-25" />
                <span className="mx-3 text-muted small text-uppercase fw-bold">Hoặc</span>
                <hr className="flex-grow-1 border-secondary opacity-25" />
              </div>

              {/* KHỐI 2: CÁC TÙY CHỌN ĐĂNG NHẬP */}
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <button className={`btn w-100 d-flex align-items-center justify-content-center ${styles.btnSocial} ${styles.btnFb}`}>
                    <i className="bi bi-facebook fs-5 me-2"></i>
                    <span>Đăng nhập bằng Facebook</span>
                  </button>
                </div>
                
                <div className="col-12 col-md-6">
                  <button className={`btn w-100 d-flex align-items-center justify-content-center ${styles.btnSocial} ${styles.btnApple}`}>
                    <i className="bi bi-apple fs-5 me-2"></i>
                    <span>Đăng nhập bằng Apple</span>
                  </button>
                </div>
                
                <div className="col-12 col-md-6">
                  <button className={`btn w-100 d-flex align-items-center justify-content-center ${styles.btnSocial} ${styles.btnGoogle}`}>
                    <i className="bi bi-google fs-5 me-2"></i>
                    <span>Đăng nhập bằng Gmail</span>
                  </button>
                </div>
                
                <div className="col-12 col-md-6">
                  <button className={`btn w-100 d-flex align-items-center justify-content-center ${styles.btnSocial} ${styles.btnPhone}`}>
                    <i className="bi bi-telephone-fill fs-5 me-2"></i>
                    <span>Đăng nhập bằng Số điện thoại</span>
                  </button>
                </div>
              </div>
              
              {/* Dòng điều hướng */}
              <div className="text-center mt-4">
                <span className="text-muted small">Chưa có tài khoản?</span> 
                <Link to="/dang-ky" className={`fw-bold text-decoration-none small ms-1 ${styles.orangeText}`}>
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DangNhap;