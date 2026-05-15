import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fetchClient } from '../utils/fetchClient';

export default function Header() {
  const headerT2Ref = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const response = await fetchClient('/api/nguoidung/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      } catch (error) {
        console.error("Lỗi đồng bộ thông tin người dùng:", error);
      }
    };
    syncUser();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/dang-nhap');
  };

  useEffect(() => {
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
      const bsCollapse = window.bootstrap?.Collapse?.getInstance(mainMenu);
      if (bsCollapse) bsCollapse.hide();
    }
  }, [location]);

  useEffect(() => {
    const threshold = 100;
    const handleScroll = () => {
      if (!headerT2Ref.current) return;
      if (window.innerWidth < 992) {
        headerT2Ref.current.style.transform = `translateY(0%)`;
        headerT2Ref.current.style.opacity = '1';
        return; 
      }
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      let ratio = scrollTop / threshold;
      if (ratio > 1) ratio = 1;
      if (ratio < 0) ratio = 0;
      
      headerT2Ref.current.style.transform = `translateY(-${ratio * 100}%)`;
      headerT2Ref.current.style.opacity = (1 - ratio).toString();
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    }; 
  }, []);

  return (
    <header className="fixed-top border-0"> 
      
      {/* Navbar Tầng 1 */}
      <nav className="navbar navbar-light bg-white py-3 border-bottom shadow-sm" 
           style={{ zIndex: 10, position: 'relative' }}>
        <div className="container">
          <Link className="navbar-brand" to="/">
            <img src="/img/logo.jpg" alt="HOCMOI Logo" className="navbar-logo d-lg-none" />
            <img src="/img/logo_reverse-removebg-preview.png" alt="HOCMOI Logo" className="navbar-logo d-none d-lg-block" />
          </Link>

          <form className="d-none d-md-flex mx-auto w-50">
            <div className="input-group">
              <input type="text" className="form-control border-orange" placeholder="Tìm khóa học..." />
              <button className="btn btn-main-orange" type="button"><i className="bi bi-search"></i></button>
            </div>
          </form>

          <div className="d-none d-lg-flex gap-2 align-items-center">
            {user ? (
              <div className="dropdown">
                <button 
                  className="btn border-0 d-flex align-items-center gap-2 dropdown-toggle" 
                  type="button" 
                  id="userMenu" 
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-person-circle fs-3 text-main-orange"></i>
                  <span className="fw-bold text-dark">{user.HoTen}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                  <li>
                    <Link className="dropdown-item py-2" to="/thong-tin-ca-nhan">
                      <i className="bi bi-person-badge me-2"></i>Thông tin cá nhân
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/ket-qua-thi">
                      <i className="bi bi-clipboard2-data me-2 text-primary"></i>Kết quả bài thi
                    </Link>
                  </li>
                  {/* ĐÃ BỎ: Mục Thống kê ở đây */}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/dang-nhap" className="btn btn-outline-main-orange px-4 fw-bold">Đăng nhập</Link>
                <Link to="/dang-ky" className="btn btn-main-orange px-4 fw-bold text-white">Đăng ký</Link>
              </>
            )}
          </div>

          <button className="navbar-toggler d-lg-none" type="button" data-bs-toggle="collapse" data-bs-target="#mainMenu">
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
      </nav>

      {/* Navbar Tầng 2 */}
      <nav ref={headerT2Ref} 
           className="navbar navbar-expand-lg navbar-dark bg-main-orange py-0 shadow-sm" 
           style={{ zIndex: 5, position: 'relative' }}>
        <div className="container">
          <div className="collapse navbar-collapse" id="mainMenu">
            <ul className="navbar-nav w-100 justify-content-between py-2 py-lg-0">
              <li className="nav-item"><NavLink className="nav-link" to="/" end><i className="bi bi-house-door-fill me-1"></i>Trang chủ</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/gioi-thieu">Giới thiệu</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/giao-vien">Giáo viên</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/phong-luyen">Phòng luyện</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/thu-vien">Thư viện</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/lo-trinh">Lộ trình</NavLink></li>
              
              {/* Giữ lại mục Thống kê trên thanh điều hướng chính */}
              <li className="nav-item">
                <NavLink className="nav-link" to="/thong-ke">
                  <i className="bi bi-bar-chart-line-fill me-1"></i>Thống kê
                </NavLink>
              </li>

              {(!user || user.VaiTro === 'HocSinh') && (
                <li className="nav-item"><NavLink className="nav-link" to="/ho-tro">Hỗ trợ</NavLink></li>
              )}

              {user?.VaiTro === 'GiaoVien' && (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/thung-rac">
                    <i className="bi bi-trash3-fill me-1"></i>Thùng rác
                  </NavLink>
                </li>
              )}

              {user?.VaiTro === 'QuanTriVien' && (
                <li className="nav-item">
                  <NavLink className="nav-link fw-bold text-warning" to="/admin-dashboard">
                    <i className="bi bi-shield-lock-fill me-1"></i>Quản trị
                  </NavLink>
                </li>
              )}

              <hr className="text-white d-lg-none" />
              
              {user ? (
                <>
                  <li className="nav-item d-lg-none">
                    <NavLink className="nav-link" to="/thong-tin-ca-nhan">
                      <i className="bi bi-person-badge me-2"></i>Cá nhân: {user.HoTen}
                    </NavLink>
                  </li>
                  <li className="nav-item d-lg-none">
                    <NavLink className="nav-link" to="/ket-qua-thi">
                      <i className="bi bi-clipboard2-data me-2"></i>Kết quả bài thi
                    </NavLink>
                  </li>
                  {/* ĐÃ BỎ: Mục Thống kê ở Mobile list */}
                  <li className="nav-item d-lg-none">
                    <button className="nav-link btn border-0 text-start w-100" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item d-lg-none"><NavLink className="nav-link" to="/dang-nhap">Đăng nhập</NavLink></li>
                  <li className="nav-item d-lg-none"><NavLink className="nav-link fw-bold" to="/dang-ky">Đăng ký</NavLink></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}