import React, { useState, useEffect } from 'react';
import styles from './ThongTinCaNhan.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

const ThongTinCaNhan = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  // STATE QUẢN LÝ ẢNH ĐẠI DIỆN
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  // Thêm state riêng cho lỗi ảnh để hiển thị tại chỗ
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetchClient('/api/nguoidung/me');
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data);
        if (data.Avatar) {
          setAvatarPreview(data.Avatar);
        }
      }
    } catch (err) {
      console.error("Lỗi tải thông tin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setAvatarError(''); // Reset lỗi mỗi lần chọn lại

    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setAvatarError('⚠️ File vượt quá 10MB');
        e.target.value = ""; // Reset input
        return;
      }

      setAvatarFile(file); 
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (avatarError) return; // Chặn nếu đang có lỗi ảnh

    setIsUpdating(true);
    setMessage({ type: '', content: '' });

    try {
      const formData = new FormData();
      formData.append('HoTen', userData.HoTen);
      formData.append('Email', userData.Email);

      if (userData.VaiTro === 'HocSinh') {
        if (userData.DiemKyVong) formData.append('DiemKyVong', userData.DiemKyVong);
        if (userData.KhoiThi) formData.append('KhoiThi', userData.KhoiThi);
        if (userData.TruongKyVong) formData.append('TruongKyVong', userData.TruongKyVong);
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetchClient(`/api/nguoidung/${userData._id}`, {
        method: 'PUT',
        body: formData 
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        setUserData(data);
        if (data.Avatar) {
           setAvatarPreview(data.Avatar);
        }
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

            {/* BOX TỔNG QUAN & AVATAR */}
            <div className={`${styles.infoBox} card shadow-sm border-0 mb-4 p-4 d-flex flex-row align-items-center position-relative`}>
              
              <div className="d-flex flex-column align-items-center position-relative">
                <div className="position-relative d-inline-block">
                    {avatarPreview ? (
                    <img 
                        src={avatarPreview} 
                        alt="Avatar" 
                        className="rounded-circle border border-2 shadow-sm" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
                    />
                    ) : (
                    <div className="rounded-circle border d-flex justify-content-center align-items-center bg-secondary text-white" style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-person-circle" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    )}
                    
                    <label 
                    htmlFor="avatarUpload" 
                    className="position-absolute bottom-0 end-0 bg-white border rounded-circle shadow-sm d-flex align-items-center justify-content-center text-main-orange" 
                    style={{ cursor: 'pointer', width: '28px', height: '28px', transform: 'translate(10%, 10%)' }}
                    title="Thay đổi ảnh đại diện"
                    >
                    <i className="bi bi-camera-fill" style={{ fontSize: '0.9rem' }}></i>
                    </label>
                    <input 
                    type="file" 
                    id="avatarUpload" 
                    accept="image/*" 
                    className="d-none" 
                    onChange={handleImageChange} 
                    />
                </div>
                
                {/* HIỂN THỊ LỖI NGAY DƯỚI/CẠNH ẢNH */}
                {avatarError ? (
                  <div className="position-absolute start-100 ms-3 bg-danger text-white p-2 rounded shadow-sm flex-nowrap d-flex align-items-center" 
                       style={{ zIndex: 10, width: 'max-content', fontSize: '0.75rem', top: '20%' }}>
                    <div className={styles.arrowLeft}></div> {/* Tạo mũi tên trỏ vào ảnh nếu cần trong CSS */}
                    {avatarError}
                  </div>
                ) : (
                  <div className="mt-2 text-muted" style={{ fontSize: '0.65rem' }}>Tối đa 10MB</div>
                )}
              </div>

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
                <div className={`alert alert-${message.type} text-center py-2 small shadow-sm mb-4`}>
                    {message.content}
                </div>
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
                    </div>
                  )}

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