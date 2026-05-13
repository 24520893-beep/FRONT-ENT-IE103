import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css'; // Import CSS Module

export default function Home() {
  const carouselRef = useRef(null);

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

  return (
    <main>
      <div className="container mt-4">
        <div className="row g-3">

          {/* 1. Danh sách dọc các môn học (Cột trái) */}
          <div className="col-lg-3 col-md-4">
            <div className={`card border-0 shadow-sm overflow-hidden h-100 ${styles.listSubject}`}>

              {/* Thêm class styles.categoryHeader để điều khiển việc click */}
              <div
                className={`bg-main-orange text-white px-3 py-2 fw-bold d-flex justify-content-between align-items-center ${styles.categoryHeader}`}
                data-bs-toggle="collapse"
                data-bs-target="#collapseSubjects"
                aria-expanded="false"
                aria-controls="collapseSubjects"
              >
                <div><i className="bi bi-book-half me-2"></i>Danh mục môn học</div>
                {/* Icon chỉ hiện trên mobile (d-md-none) */}
                <i className="bi bi-chevron-down d-md-none"></i>
              </div>

              {/* d-md-block đảm bảo danh sách luôn hiện từ màn hình md trở lên */}
              <div className="collapse d-md-block" id="collapseSubjects">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item"><Link to="#"><i className="bi bi-calculator me-2"></i>Toán Học</Link></li>
                  <li className="list-group-item"><Link to="#"><i className="bi bi-spellcheck me-2"></i>Ngữ Văn</Link></li>
                  <li className="list-group-item"><Link to="#"><i className="bi bi-translate me-2"></i>Tiếng Anh</Link></li>
                  <li className="list-group-item"><Link to="#"><i className="bi bi-thermometer-half me-2"></i>Vật Lý</Link></li>
                  <li className="list-group-item"><Link to="#"><i className="bi bi-droplet-half me-2"></i>Hóa Học</Link></li>
                  <li className="list-group-item"><Link to="#"><i className="bi bi-bug me-2"></i>Sinh Học</Link></li>
                  <li className="list-group-item"><Link to="#"><i className="bi bi-globe-americas me-2"></i>Lịch Sử - Địa Lý</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2. Box hình khuyến mãi tự trượt & Kéo thả (Cột giữa) */}
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
                  <img src="https://images.unsplash.com/photo-1434039311801-499948e9557a?q=80&w=800" className={`d-block w-100 ${styles.promoImg}`} alt="Khuyến mãi 3" />
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

          {/* 3. Box tải ứng dụng (Cột phải) */}
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

      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className={`mb-0 ${styles.sectionTitle}`}>Lộ Trình Học Tập Tiêu Biểu</h2>
          <Link to="#" className="text-main-orange text-decoration-none fw-bold">Xem tất cả <i className="bi bi-arrow-right"></i></Link>
        </div>

        <div className="row g-4">

          {/* Lộ trình 1 */}
          <div className="col-12 col-md-6 col-lg-3 d-flex">
            <div className={`card border-0 shadow-sm ${styles.hoverCardRoadmap}`}>
              <div className="position-relative">
                <img src="https://images.unsplash.com/photo-1434039311801-499948e9557a?q=80&w=400" className={`card-img-top ${styles.roadmapImg}`} alt="TOEIC Roadmap" />
                <span className="badge bg-main-orange position-absolute top-0 start-0 m-2">HOT</span>
              </div>
              <div className="card-body">
                <h5 className="card-title fw-bold fs-6">Luyện thi TOEIC Cấp tốc 750+</h5>
                <div className="mt-auto">
                  <p className={`mb-2 small ${styles.teacherName}`}>
                    <i className="bi bi-person-badge me-1"></i>GV. Lê Lan Anh
                  </p>
                  <div className="d-flex justify-content-between text-muted small mb-3">
                    <span><i className="bi bi-file-earmark-text me-1"></i>45 Tài liệu</span>
                    <span><i className="bi bi-clipboard-check me-1"></i>12 Đề thi</span>
                  </div>
                  <button className="btn btn-outline-main-orange w-100 fw-bold btn-sm">Chi tiết lộ trình</button>
                </div>
              </div>
            </div>
          </div>

          {/* Lộ trình 2 */}
          <div className="col-12 col-md-6 col-lg-3 d-flex">
            <div className={`card border-0 shadow-sm ${styles.hoverCardRoadmap}`}>
              <div className="position-relative">
                <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400" className={`card-img-top ${styles.roadmapImg}`} alt="Math Roadmap" />
              </div>
              <div className="card-body">
                <h5 className="card-title fw-bold fs-6">Toán Cao Cấp - Bứt phá điểm A</h5>
                <div className="mt-auto">
                  <p className={`mb-2 small ${styles.teacherName}`}>
                    <i className="bi bi-person-badge me-1"></i>ThS. Nguyễn Quốc Bảo
                  </p>
                  <div className="d-flex justify-content-between text-muted small mb-3">
                    <span><i className="bi bi-file-earmark-text me-1"></i>30 Tài liệu</span>
                    <span><i className="bi bi-clipboard-check me-1"></i>08 Đề thi</span>
                  </div>
                  <button className="btn btn-outline-main-orange w-100 fw-bold btn-sm">Chi tiết lộ trình</button>
                </div>
              </div>
            </div>
          </div>

          {/* Lộ trình 3 */}
          <div className="col-12 col-md-6 col-lg-3 d-flex">
            <div className={`card border-0 shadow-sm ${styles.hoverCardRoadmap}`}>
              <div className="position-relative">
                <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400" className={`card-img-top ${styles.roadmapImg}`} alt="Web Dev Roadmap" />
              </div>
              <div className="card-body">
                <h5 className="card-title fw-bold fs-6">Full-stack Web Dev với React & Node</h5>
                <div className="mt-auto">
                  <p className={`mb-2 small ${styles.teacherName}`}>
                    <i className="bi bi-person-badge me-1"></i>GV. Trần Minh Triết
                  </p>
                  <div className="d-flex justify-content-between text-muted small mb-3">
                    <span><i className="bi bi-file-earmark-text me-1"></i>120 Tài liệu</span>
                    <span><i className="bi bi-clipboard-check me-1"></i>25 Đề thi</span>
                  </div>
                  <button className="btn btn-outline-main-orange w-100 fw-bold btn-sm">Chi tiết lộ trình</button>
                </div>
              </div>
            </div>
          </div>

          {/* Lộ trình 4 */}
          <div className="col-12 col-md-6 col-lg-3 d-flex">
            <div className={`card border-0 shadow-sm ${styles.hoverCardRoadmap}`}>
              <div className="position-relative">
                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400" className={`card-img-top ${styles.roadmapImg}`} alt="Security Roadmap" />
              </div>
              <div className="card-body">
                <h5 className="card-title fw-bold fs-6">Cybersecurity: Từ Zero đến Hero</h5>
                <div className="mt-auto">
                  <p className={`mb-2 small ${styles.teacherName}`}>
                    <i className="bi bi-person-badge me-1"></i>Kỹ sư. Hoàng Nam
                  </p>
                  <div className="d-flex justify-content-between text-muted small mb-3">
                    <span><i className="bi bi-file-earmark-text me-1"></i>65 Tài liệu</span>
                    <span><i className="bi bi-clipboard-check me-1"></i>15 Đề thi</span>
                  </div>
                  <button className="btn btn-outline-main-orange w-100 fw-bold btn-sm">Chi tiết lộ trình</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}