import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HoTro.module.css';

export default function HoTro() {
  return (
    <main className={styles.pageSupport}>
      {/* PHẦN 1: TÌM KIẾM */}
      <section className={`${styles.supportSearchSection} py-5`}>
        <div className="container text-center py-4">
          <h2 className="fw-bold mb-4 text-dark">CHÚNG TÔI CÓ THỂ GIÚP GÌ CHO BẠN?</h2>
          
          {/* Ô Input tìm kiếm */}
          <div className={`${styles.searchBox} mx-auto shadow-sm rounded-pill overflow-hidden`}>
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-white border-0 text-muted ps-4">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-0 shadow-none ps-2" 
                placeholder="Mô tả sự cố của bạn..." 
              />
              <button className="btn btn-main-orange text-white px-4 fw-bold" type="button">
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PHẦN 2: NỘI DUNG (TỈ LỆ 1:2) */}
      <section className="py-5">
        <div className="container">
          <div className="row g-5">
            
            {/* CỘT TRÁI (Tỉ lệ 1 - col-lg-4) */}
            <div className="col-lg-4">
              
              {/* Mục lớn 1 */}
              <div className={`${styles.supportSidebar} mb-5`}>
                <h5 className={styles.sidebarTitle}>Nội dung cần hỗ trợ</h5>
                <ul className={styles.sidebarList}>
                  <li><Link to="#">Tìm hiểu sản phẩm của HOCMOI</Link></li>
                  <li><Link to="#">Quy định và chính sách</Link></li>
                  <li><Link to="#">Tài khoản - Đăng ký học - Tư vấn</Link></li>
                  <li><Link to="#">Hướng dẫn thao tác học tập online</Link></li>
                  <li><Link to="#">Học bạ, Báo cáo học tập</Link></li>
                  <li><Link to="#">Cộng đồng HOCMOI trên facebook</Link></li>
                  <li><Link to="#">Hoạt động - Sự kiện hiện nay</Link></li>
                  <li><Link to="#">Xử lý sự cố thường gặp trên thiết bị</Link></li>
                  <li><Link to="#">Liên hệ bộ phận CSKH</Link></li>
                  <li><Link to="#">Tạo yêu cầu hỗ trợ</Link></li>
                </ul>
              </div>

              {/* Mục lớn 2 */}
              <div className={styles.supportSidebar}>
                <h5 className={styles.sidebarTitle}>Những câu hỏi thường gặp</h5>
                <ul className={styles.sidebarList}>
                  <li><Link to="#">Chương trình 100 ngày Phá kén</Link></li>
                  <li><Link to="#">Hướng dẫn xử lý các lỗi thường gặp khi học livestream</Link></li>
                  <li><Link to="#">Quy định về chuyển đổi, hoàn trả, bảo lưu, chuyển nhượng</Link></li>
                  <li><Link to="#">Hướng dẫn tham gia nhóm Zalo</Link></li>
                  <li><Link to="#">Hướng dẫn cập nhật thông tin tài khoản</Link></li>
                  <li><Link to="#">Hướng dẫn lấy lại mật khẩu tài khoản đã tồn tại</Link></li>
                </ul>
              </div>
            </div>

            {/* CỘT PHẢI (Tỉ lệ 2 - col-lg-8) */}
            <div className="col-lg-8">
              <div className="row g-4 justify-content-center">
                
                <div className="col-12 col-md-6">
                  <Link to="#" className={styles.supportCard}>
                    <span>Chương trình 100 ngày Phá kén</span>
                  </Link>
                </div>
                
                <div className="col-12 col-md-6">
                  <Link to="#" className={styles.supportCard}>
                    <span>Hướng dẫn xử lý các lỗi thường gặp khi học livestream</span>
                  </Link>
                </div>
                
                <div className="col-12 col-md-6">
                  <Link to="#" className={styles.supportCard}>
                    <span>Quy định về chuyển đổi, hoàn trả, bảo lưu, chuyển nhượng</span>
                  </Link>
                </div>
                
                <div className="col-12 col-md-6">
                  <Link to="#" className={styles.supportCard}>
                    <span>Hướng dẫn tham gia nhóm Zalo</span>
                  </Link>
                </div>
                
                <div className="col-12 col-md-6">
                  <Link to="#" className={styles.supportCard}>
                    <span>Hướng dẫn cập nhật thông tin tài khoản</span>
                  </Link>
                </div>
                
                <div className="col-12 col-md-6">
                  <Link to="#" className={styles.supportCard}>
                    <span>Hướng dẫn lấy lại mật khẩu tài khoản đã tồn tại</span>
                  </Link>
                </div>
                
                {/* Ô số 7: Tự động căn giữa nếu lẻ loi nhờ justify-content-center */}
                <div className="col-12 col-md-6">
                  <Link to="#" className={`${styles.supportCard} ${styles.highlightCard}`}>
                    <span>
                      <i className="bi bi-headset fs-4 d-block mb-2"></i>
                      Hoặc tạo yêu cầu hỗ trợ
                    </span>
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}