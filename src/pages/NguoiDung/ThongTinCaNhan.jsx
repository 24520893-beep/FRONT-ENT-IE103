import React, { useState, useEffect } from 'react';
import styles from './ThongTinCaNhan.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ThongTinCaNhan = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Đã sửa: Sử dụng fetchClient, không cần truyền token và cấu hình Header thủ công
      const response = await fetchClient('/api/nguoidung/me');
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Đã sửa: Dùng fetchClient để gọi API cập nhật thông tin
      const response = await fetchClient(`/api/nguoidung/${userData._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          HoTen: userData.HoTen,
          Email: userData.Email,
          // Học sinh có thể sửa các trường này
          DiemKyVong: userData.DiemKyVong,
          KhoiThi: userData.KhoiThi,
          TruongKyVong: userData.TruongKyVong,
          // Giáo viên gửi giá trị hiện có (không cho sửa trên giao diện)
          MonHoc: userData.MonHoc
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        setMessage({ type: 'success', content: 'Cập nhật thông tin thành công!' });
      } else {
        setMessage({ type: 'danger', content: data.message || 'Lỗi cập nhật' });
      }
    } catch (err) {
      setMessage({ type: 'danger', content: 'Lỗi kết nối máy chủ' });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleName = (roleCode) => {
    switch (roleCode) {
      case 'HocSinh': return 'Học sinh';
      case 'GiaoVien': return 'Giáo viên';
      case 'QuanTriVien': return 'Quản trị viên';
      default: return roleCode;
    }
  };

  if (isLoading) return <div className="text-center py-5">Đang tải dữ liệu...</div>;
  if (!userData) return null;

  return (
    <main className={`${styles.pageProfile} py-5 bg-light`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            {/* BOX TỔNG QUAN */}
            <div className={`${styles.infoBox} card shadow-sm border-0 mb-4 p-4 d-flex flex-row align-items-center`}>
              <div className={styles.avatarPlaceholder}><i className="bi bi-person-circle"></i></div>
              <div className="ms-4">
                <h4 className="fw-bold mb-1">{userData.HoTen}</h4>
                <p className="text-muted mb-0 small">ID: <span className="fw-bold">{userData._id}</span></p>
              </div>
              <div className="ms-auto d-none d-md-block">
                <span className="badge bg-main-orange px-3 py-2">{getRoleName(userData.VaiTro)}</span>
              </div>
            </div>

            {/* FORM CHỈNH SỬA */}
            <div className="card shadow-sm border-0 p-4 p-md-5">
              <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin cá nhân</h5>

              {message.content && (
                <div className={`alert alert-${message.type} text-center py-2 small`}>{message.content}</div>
              )}

              <form onSubmit={handleUpdate}>
                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-medium">Họ và tên</label>
                    <input
                      type="text"
                      className="form-control"
                      value={userData.HoTen}
                      onChange={(e) => setUserData({ ...userData, HoTen: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-medium">Địa chỉ Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={userData.Email}
                      onChange={(e) => setUserData({ ...userData, Email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-medium text-muted">Vai trò (Cố định)</label>
                    <input type="text" className="form-control bg-light text-muted" value={getRoleName(userData.VaiTro)} readOnly />
                  </div>


                  {/* HIỂN THỊ TRƯỜNG CHO GIÁO VIÊN (CỐ ĐỊNH) */}
                  {userData.VaiTro === 'GiaoVien' && (
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium text-muted">Môn học giảng dạy (Cố định)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <i className="bi bi-book"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control bg-light text-muted border-start-0"
                          value={userData.MonHoc || "Chưa phân công"}
                          readOnly
                        />
                      </div>
                      <small className="text-info" style={{ fontSize: '0.75rem' }}>
                        * Liên hệ Quản trị viên nếu muốn thay đổi bộ môn.
                      </small>
                    </div>
                  )}

                  {/* HIỂN THỊ TRƯỜNG CHO HỌC SINH */}
                  {userData.VaiTro === 'HocSinh' && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Khối thi mục tiêu</label>
                        <select
                          className="form-select"
                          value={userData.KhoiThi || ""}
                          onChange={(e) => setUserData({ ...userData, KhoiThi: e.target.value })}
                        >
                          <option value="">Chọn khối thi</option>
                          <option value="A00">A00 (Toán, Lý, Hóa)</option>
                          <option value="B00">B00 (Toán, Hóa, Sinh)</option>
                          <option value="D01">D01 (Toán, Văn, Anh)</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium">Điểm kỳ vọng (3 môn)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={userData.DiemKyVong || 0}
                          onChange={(e) => setUserData({ ...userData, DiemKyVong: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-medium">Trường đại học kỳ vọng</label>
                        <input
                          type="text"
                          className="form-control"
                          value={userData.TruongKyVong || ""}
                          onChange={(e) => setUserData({ ...userData, TruongKyVong: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="col-12 mt-5 text-center">
                    <button
                      type="submit"
                      className="btn btn-main-orange px-5 py-2 fw-bold text-white rounded-pill shadow-sm"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Đang lưu...</>
                      ) : (
                        <><i className="bi bi-check2-circle me-2"></i> Lưu thông tin</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default ThongTinCaNhan;