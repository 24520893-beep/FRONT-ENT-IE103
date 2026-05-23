import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

// IMPORT fetchClient ĐỂ GỌI API CÓ XÁC THỰC TOKEN
import { fetchClient } from '../../utils/fetchClient';

// IMPORT WIDGET NHIỆM VỤ HÔM NAY
import NhiemVuHomNay from '../../components/NhiemVuHomNay';

export default function Home() {
  const carouselRef = useRef(null);
  const [userRole, setUserRole] = useState(null);
  
  // STATE LƯU TRỮ LỘ TRÌNH TIÊU BIỂU (PUBLIC)
  const [featuredRoadmaps, setFeaturedRoadmaps] = useState([]);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(true);

  // THÊM MỚI: STATE LƯU TRỮ NHIỆM VỤ HÔM NAY (CÁ NHÂN HÓA CHO HỌC SINH)
  const [todayTasks, setTodayTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // 1. Lấy vai trò người dùng khi trang web được nạp
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUserRole(JSON.parse(savedUser).VaiTro);
      } catch (e) {
        console.error("Lỗi đọc dữ liệu người dùng từ LocalStorage:", e);
      }
    }
  }, []);

  // 2. TỰ ĐỘNG LẤY NHIỆM VỤ HÔM NAY NẾU LÀ HỌC SINH
  useEffect(() => {
    const fetchTodayTasks = async () => {
      // Chỉ lấy nếu đã xác định được vai trò là Học sinh
      if (userRole !== 'HocSinh') return; 

      setIsLoadingTasks(true);
      try {
        // Dùng fetchClient để tự động đính kèm Token xác thực
        const response = await fetchClient('/api/lotrinhhoctap/nhiemvu-homnay');
        if (response.ok) {
          const resData = await response.json();
          setTodayTasks(resData.data || []);
        }
      } catch (error) {
        console.error("Lỗi lấy nhiệm vụ hôm nay:", error);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTodayTasks();
  }, [userRole]); // Dependency là userRole, sẽ tự chạy ngay khi biết là Học sinh

  // 3. LẤY DANH SÁCH LỘ TRÌNH TỪ API PUBLIC RIÊNG BIỆT (Cho tất cả mọi người xem)
  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const response = await fetch('/api/lotrinhhoctap/public/featured?limit=8');
        if (response.ok) {
          const resData = await response.json();
          const dataArray = Array.isArray(resData) ? resData : (resData.data || []);
          setFeaturedRoadmaps(dataArray);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách lộ trình tiêu biểu:", error);
      } finally {
        setIsLoadingRoadmaps(false);
      }
    };

    fetchRoadmaps();
  }, []);

  // Logic hỗ trợ kéo thả cho Carousel
  useEffect(() => {
    const carouselEl = carouselRef.current;
    if (!carouselEl || !window.bootstrap) return;

    const bsCarousel = new window.bootstrap.Carousel(carouselEl);
    let startX = 0;
    let isDragging = false;

    const handleMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      carouselEl.style.cursor = 'grabbing';
      bsCarousel.pause();
    };

    const handleMouseUp = (e) => {
      if (!isDragging) return;
      const diffX = startX - e.clientX;

      if (Math.abs(diffX) > 70) {
        if (diffX > 0) bsCarousel.next();
        else bsCarousel.prev();
      }

      isDragging = false;
      carouselEl.style.cursor = 'grab';
      bsCarousel.cycle();
    };

    const preventDrag = (e) => e.preventDefault();

    carouselEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const images = carouselEl.querySelectorAll('img');
    images.forEach(img => img.addEventListener('dragstart', preventDrag));

    return () => {
      carouselEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      images.forEach(img => img.removeEventListener('dragstart', preventDrag));
    };
  }, []);

  const fallbackImages = [
    "https://images.unsplash.com/photo-1434039311801-499948e9557a?q=80&w=400",
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400",
  ];

  return (
    <main>
      {/* TẦNG 1: DANH MỤC MÔN HỌC & BANNER PROMO */}
      <div className="container mt-4">
        <div className="row g-3">

          <div className="col-lg-3 col-md-4">
            <div className={`card border-0 shadow-sm overflow-hidden h-100 ${styles.listSubject}`}>
              <div
                className={`bg-main-orange text-white px-3 py-2 fw-bold d-flex justify-content-between align-items-center ${styles.categoryHeader}`}
                data-bs-toggle="collapse"
                data-bs-target="#collapseSubjects"
                aria-expanded="false"
                aria-controls="collapseSubjects"
              >
                <div><i className="bi bi-book-half me-2"></i>Danh mục môn học</div>
                <i className="bi bi-chevron-down d-md-none"></i>
              </div>

              <div className="collapse d-md-block" id="collapseSubjects">
                <ul className="list-unstyled mb-0 bg-white">
                  <li className="text-dark py-2 px-3 border-bottom" style={{ cursor: 'default' }}>
                    <i className="bi bi-calculator me-3 text-muted"></i>Toán Học
                  </li>
                  <li className="text-dark py-2 px-3 border-bottom" style={{ cursor: 'default' }}>
                    <i className="bi bi-spellcheck me-3 text-muted"></i>Ngữ Văn
                  </li>
                  <li className="text-dark py-2 px-3 border-bottom" style={{ cursor: 'default' }}>
                    <i className="bi bi-translate me-3 text-muted"></i>Tiếng Anh
                  </li>
                  <li className="text-dark py-2 px-3 border-bottom" style={{ cursor: 'default' }}>
                    <i className="bi bi-thermometer-half me-3 text-muted"></i>Vật Lý
                  </li>
                  <li className="text-dark py-2 px-3 border-bottom" style={{ cursor: 'default' }}>
                    <i className="bi bi-droplet-half me-3 text-muted"></i>Hóa Học
                  </li>
                  <li className="text-dark py-2 px-3 border-bottom" style={{ cursor: 'default' }}>
                    <i className="bi bi-bug me-3 text-muted"></i>Sinh Học
                  </li>
                  <li className="text-dark py-2 px-3" style={{ cursor: 'default' }}>
                    <i className="bi bi-globe-americas me-3 text-muted"></i>Lịch Sử - Địa Lý
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-8">
            <div ref={carouselRef} id="promoCarousel" className={`carousel slide shadow-sm rounded-3 overflow-hidden h-100 ${styles.promoCarousel}`} data-bs-ride="carousel">
              <div className="carousel-indicators">
                <button type="button" data-bs-target="#promoCarousel" data-bs-slide-to="0" className="active"></button>
                <button type="button" data-bs-target="#promoCarousel" data-bs-slide-to="1"></button>
                <button type="button" data-bs-target="#promoCarousel" data-bs-slide-to="2"></button>
              </div>
              <div className="carousel-inner h-100">
                <div className="carousel-item active h-100" data-bs-interval="3000">
                  <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800" className={`d-block w-100 ${styles.promoImg}`} alt="Khuyến mãi 1" />
                  <div className="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded">
                    <h5>Giảm 50% Gói Luyện Thi</h5>
                    <p>Dành cho 100 học viên đăng ký sớm nhất.</p>
                  </div>
                </div>
                <div className="carousel-item h-100" data-bs-interval="3000">
                  <img src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=800" className={`d-block w-100 ${styles.promoImg}`} alt="Khuyến mãi 2" />
                  <div className="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded">
                    <h5>Hỏi đáp AI Không Giới Hạn</h5>
                    <p>Giải đáp mọi thắc mắc ngay tức thì.</p>
                  </div>
                </div>
                <div className="carousel-item h-100" data-bs-interval="3000">
                  <img src="https://media.zim.vn/66b49bba6ad513d2a80bd4ff/dalle-2024-08-08-171920-a-classroom-scene-depicting-personalized-learning-without-technology-a-diverse-group-of-students-in-a-classroom-each-engaged-in-their-own-learning-a_xlarge.webp" className={`d-block w-100 ${styles.promoImg}`} alt="Lộ Trình Cá Nhân Hóa" />
                  <div className="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded">
                    <h5>Lộ Trình Cá Nhân Hóa</h5>
                    <p>Đột phá điểm số cùng chuyên gia.</p>
                  </div>
                </div>
              </div>
              <button className="carousel-control-prev" type="button" data-bs-target="#promoCarousel" data-bs-slide="prev">
                <span className="carousel-control-prev-icon"></span>
              </button>
              <button className="carousel-control-next" type="button" data-bs-target="#promoCarousel" data-bs-slide="next">
                <span className="carousel-control-next-icon"></span>
              </button>
            </div>
          </div>

          <div className="col-lg-3 d-none d-lg-block">
            <div className="card border-0 shadow-sm p-4 text-center h-100 d-flex flex-column justify-content-center bg-light">
              <h5 className="fw-bold mb-3 text-dark">HOCMOI App</h5>
              <p className="text-muted small mb-4">Học mọi lúc, mọi nơi ngay trên điện thoại của bạn.</p>
              <div className="d-grid gap-3">
                <Link to="#" className={`btn btn-dark py-2 d-flex align-items-center justify-content-center rounded-3 ${styles.appBtn}`}>
                  <i className="bi bi-apple fs-4 me-2"></i>
                  <div className="text-start">
                    <div style={{ fontSize: '0.7rem' }}>Download on the</div>
                    <div className="fw-bold" style={{ fontSize: '0.9rem', lineHeight: '1' }}>App Store</div>
                  </div>
                </Link>
                <Link to="#" className={`btn btn-dark py-2 d-flex align-items-center justify-content-center rounded-3 ${styles.appBtn}`}>
                  <i className="bi bi-google-play fs-4 me-2 text-warning"></i>
                  <div className="text-start">
                    <div style={{ fontSize: '0.7rem' }}>Get it on</div>
                    <div className="fw-bold" style={{ fontSize: '0.9rem', lineHeight: '1' }}>Google Play</div>
                  </div>
                </Link>
              </div>
              <hr className="my-4" />
              <div className="qr-code-placeholder mx-auto border p-2 bg-white rounded shadow-sm" style={{ width: '100px', height: '100px' }}>
                <i className="bi bi-qr-code fs-1 text-dark"></i>
                <div className="small fw-bold">Scan QR</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* TẦNG MỚI: CHÈN WIDGET VÀ TRUYỀN DỮ LIỆU NHIỆM VỤ HÔM NAY VÀO */}
      {userRole === 'HocSinh' && (
        <NhiemVuHomNay tasks={todayTasks} isLoading={isLoadingTasks} />
      )}

      {/* TẦNG 2: DANH SÁCH LỘ TRÌNH TỪ DATABASE */}
      <div className="container mt-5 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className={`mb-0 ${styles.sectionTitle}`}>Lộ Trình Học Tập Tiêu Biểu</h2>
          <Link to="/lo-trinh" className="text-main-orange text-decoration-none fw-bold">Xem tất cả <i className="bi bi-arrow-right"></i></Link>
        </div>

        <div className="row g-4">
          {isLoadingRoadmaps ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-main-orange" role="status"></div>
              <p className="mt-2 text-muted">Đang tải danh sách lộ trình...</p>
            </div>
          ) : featuredRoadmaps.length > 0 ? (
            featuredRoadmaps.map((roadmap, index) => {
              const imageUrl = roadmap.HinhAnhMinhHoa || roadmap.HinhAnh || fallbackImages[index % fallbackImages.length];
              const teacherName = roadmap.MaGVPhuTrach?.HoTen || "Giáo viên HOCMOI";
              const taskCount = roadmap.DanhSachNhiemVu ? roadmap.DanhSachNhiemVu.length : 0;

              return (
                <div key={roadmap._id || index} className="col-12 col-md-6 col-lg-3 d-flex">
                  <div className={`card border-0 shadow-sm w-100 ${styles.hoverCardRoadmap}`}>
                    <div className="position-relative">
                      <img 
                        src={imageUrl} 
                        className={`card-img-top ${styles.roadmapImg}`} 
                        alt={roadmap.TenLoTrinh} 
                        style={{ height: '160px', objectFit: 'cover' }} 
                      />
                      {index < 2 && <span className="badge bg-main-orange position-absolute top-0 start-0 m-2">HOT</span>}
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title fw-bold fs-6 mb-3 line-clamp-2" title={roadmap.TenLoTrinh}>
                        {roadmap.TenLoTrinh}
                      </h5>
                      <div className="mt-auto">
                        <p className={`mb-2 small text-truncate ${styles.teacherName}`}>
                          <i className="bi bi-person-badge me-1"></i> {teacherName}
                        </p>
                        <div className="d-flex justify-content-between text-muted small mb-3">
                          <span><i className="bi bi-journal-bookmark-fill me-1"></i>{taskCount} Bài học</span>
                          <span><i className="bi bi-tag-fill me-1"></i>{roadmap.MonHoc || 'Chung'}</span>
                        </div>
                        <Link to={`/lo-trinh/${roadmap._id}`} className="btn btn-outline-main-orange w-100 fw-bold btn-sm">
                          Chi tiết lộ trình
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-12 text-center py-5 bg-white rounded shadow-sm border">
              <i className="bi bi-map text-muted opacity-25 d-block mb-3" style={{ fontSize: '3rem' }}></i>
              <h5 className="text-muted">Chưa có lộ trình nào được công bố.</h5>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}