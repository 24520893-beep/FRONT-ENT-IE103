import React, { useState, useEffect } from 'react';
import styles from './GioiThieu.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const GioiThieu = () => {
  // State lưu trữ dữ liệu thống kê, mặc định là 0 trong lúc chờ API
  const [stats, setStats] = useState({
    hocSinh: 0,
    giaoVien: 0,
    taiLieu: 0,
    deThi: 0,
    cauHoi: 0
  });

  useEffect(() => {
    // Gọi API Back-end để lấy số lượng thực tế trong Database
    const fetchStats = async () => {
      try {
        // Đã sửa: Dùng fetchClient và đường dẫn tương đối thay vì localhost
        const response = await fetchClient('/api/thongke/tongquan');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Không thể tải dữ liệu thống kê:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <main className={styles.pageGioiThieu}>

      {/* ================= TẦNG 1: TÊN WEB & THỐNG KÊ ================= */}
      <section className={`py-5 text-center ${styles.tierOne}`}>
        <div className="container py-4">
          <h1 className="display-4 fw-bold text-main-orange mb-3">HOCMOI.VN</h1>
          <p className="lead text-muted mb-5">
            Hệ sinh thái luyện thi TOEIC toàn diện với kho dữ liệu khổng lồ, đồng hành cùng bạn trên con đường chinh phục điểm cao.
          </p>

          <div className="row justify-content-center g-4">
            <StatCard title="Học sinh" count={stats.hocSinh} icon="bi-mortarboard-fill" />
            <StatCard title="Giáo viên" count={stats.giaoVien} icon="bi-person-workspace" />
            <StatCard title="Tài liệu học tập" count={stats.taiLieu} icon="bi-journal-bookmark-fill" />
            <StatCard title="Đề thi thử" count={stats.deThi} icon="bi-file-earmark-bar-graph-fill" />
            <StatCard title="Câu hỏi" count={stats.cauHoi} icon="bi-patch-question-fill" />
          </div>
        </div>
      </section>
      
      {/* ================= TẦNG TRUNG GIAN: GIÁ TRỊ CỐT LÕI ================= */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Giá trị cốt lõi của chúng tôi</h2>
            <div className="mx-auto bg-main-orange" style={{ height: '3px', width: '60px' }}></div>
          </div>

          <div className="row g-4">
            <ValueItem
              title="Dữ liệu chính xác"
              desc="Ngân hàng câu hỏi được kiểm duyệt kỹ lưỡng bởi đội ngũ giáo viên giàu kinh nghiệm."
              icon="bi-check-circle-fill"
            />
            <ValueItem
              title="Lộ trình cá nhân"
              desc="Đội ngũ giáo viên chuyên nghiệp phân tích điểm yếu và đề xuất lộ trình học tập tối ưu cho từng cá nhân."
              icon="bi-graph-up-arrow"
            />
            <ValueItem
              title="Hỗ trợ 24/7"
              desc="Trợ lý ảo và đội ngũ tư vấn luôn sẵn sàng giải đáp mọi thắc mắc của học viên."
              icon="bi-headset"
            />
          </div>
        </div>
      </section>
      
      {/* ================= TẦNG 2: HÌNH NỀN & TẢI APP ================= */}
      <section className={`${styles.tierTwo} d-flex align-items-center justify-content-center text-center`}>
        {/* Lớp mờ (overlay) để chữ trắng nổi bật trên ảnh nền */}
        <div className={styles.overlay}></div>

        <div className="position-relative z-1 container">
          <h2 className="text-white fw-bold mb-4 display-6">Học mọi lúc, Thi mọi nơi</h2>
          <p className="text-light mb-5 fs-5">
            Tải ứng dụng HOCMOI ngay hôm nay để trải nghiệm không gian học tập liền mạch trên thiết bị di động của bạn.
          </p>

          <div className="d-flex justify-content-center gap-4 flex-wrap">
            <a href="#google-play" className={styles.appLink}>
              <div className={`btn btn-dark py-2 px-4 d-flex align-items-center rounded-3 ${styles.storeBtn}`}>
                <i className="bi bi-google-play fs-2 me-3 text-warning"></i>
                <div className="text-start">
                  <div className={styles.storeTextSmall}>GET IT ON</div>
                  <div className={styles.storeTextLarge}>Google Play</div>
                </div>
              </div>
            </a>

            <a href="#app-store" className={styles.appLink}>
              <div className={`btn btn-dark py-2 px-4 d-flex align-items-center rounded-3 ${styles.storeBtn}`}>
                <i className="bi bi-apple fs-2 me-3 text-white"></i>
                <div className="text-start">
                  <div className={styles.storeTextSmall}>Download on the</div>
                  <div className={styles.storeTextLarge}>App Store</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
};

const ValueItem = ({ title, desc, icon }) => (
  <div className="col-md-4 text-center">
    <div className="p-3">
      <i className={`bi ${icon} text-main-orange display-5 mb-3`}></i>
      <h4 className="fw-bold">{title}</h4>
      <p className="text-muted">{desc}</p>
    </div>
  </div>
);

// Component con (Sub-component) dùng để render các thẻ thống kê
const StatCard = ({ title, count, icon }) => (
  <div className="col-6 col-md-4 col-lg-2">
    <div className={`card border-0 shadow-sm h-100 py-4 ${styles.statCard}`}>
      <div className="card-body">
        <div className={`fs-1 mb-3 text-main-orange`}>
          <i className={`bi ${icon}`}></i>
        </div>
        <h3 className="h4 fw-bold text-dark mb-1">
          {/* Format số tự động thêm dấu chấm (VD: 25.000) */}
          {count.toLocaleString('vi-VN')}+
        </h3>
        <p className="text-muted mb-0 fw-medium small">{title}</p>
      </div>
    </div>
  </div>
);

export default GioiThieu;