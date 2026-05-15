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
  const [avatarError, setAvatarError] = useState('');

  // === STATE QUẢN LÝ OVERLAY XÁC NHẬN LƯU (YÊU CẦU MẬT KHẨU) ===
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    passwordToVerify: '',
    error: ''
  });

  // === STATE QUẢN LÝ MODAL ĐỔI MẬT KHẨU ===
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    error: '',
    isSubmitting: false
  });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetchClient('/api/nguoidung/me');
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data);
        if (data.Avatar) setAvatarPreview(data.Avatar);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setAvatarError('');
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setAvatarError('⚠️ File vượt quá 10MB');
        e.target.value = ""; 
        return;
      }
      setAvatarFile(file); 
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  // --- LOGIC XỬ LÝ LƯU THÔNG TIN (MỞ MODAL XÁC NHẬN) ---
  const triggerUpdate = (e) => {
    e.preventDefault();
    if (avatarError) return;

    // Validate Điểm kỳ vọng (Từ 0 đến 30, hoặc rỗng)
    if (userData.VaiTro === 'HocSinh' && userData.DiemKyVong !== '' && userData.DiemKyVong !== null && userData.DiemKyVong !== undefined) {
        const diem = parseFloat(userData.DiemKyVong);
        if (isNaN(diem) || diem < 0 || diem > 30) {
            setMessage({ type: 'danger', content: 'Điểm kỳ vọng phải nằm trong khoảng từ 0 đến 30.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    }

    setMessage({ type: '', content: '' }); // Clear lỗi cũ nếu có
    setConfirmModal({
      isOpen: true,
      message: "Vui lòng nhập mật khẩu hiện tại của bạn để xác nhận cập nhật thông tin cá nhân.",
      passwordToVerify: '',
      error: ''
    });
  };

  const executeUpdate = async () => {
    if (!confirmModal.passwordToVerify) {
        setConfirmModal(prev => ({ ...prev, error: 'Vui lòng nhập mật khẩu!' }));
        return;
    }

    setIsUpdating(true);
    const passwordForAuth = confirmModal.passwordToVerify;
    setConfirmModal({ ...confirmModal, isOpen: false });
    setMessage({ type: '', content: '' });

    try {
      const formData = new FormData();
      formData.append('HoTen', userData.HoTen);
      formData.append('Email', userData.Email);
      formData.append('MatKhauXacNhan', passwordForAuth); 

      if (userData.VaiTro === 'HocSinh') {
        // Chỉ gửi DiemKyVong nếu có giá trị
        if (userData.DiemKyVong !== '' && userData.DiemKyVong !== null && userData.DiemKyVong !== undefined) {
            formData.append('DiemKyVong', userData.DiemKyVong);
        } else {
            // Nếu người dùng xóa trống ô điểm kỳ vọng, gửi một flag rỗng để Backend biết đường cập nhật
            formData.append('DiemKyVong', ''); 
        }

        if (userData.KhoiThi) formData.append('KhoiThi', userData.KhoiThi);
        if (userData.TruongKyVong) formData.append('TruongKyVong', userData.TruongKyVong);
      }

      if (avatarFile) formData.append('avatar', avatarFile);

      const response = await fetchClient(`/api/nguoidung/${userData._id}`, {
        method: 'PUT',
        body: formData 
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        setUserData(data);
        if (data.Avatar) setAvatarPreview(data.Avatar);
        setMessage({ type: 'success', content: 'Cập nhật thông tin thành công!' });
      } else {
        setMessage({ type: 'danger', content: data.message || 'Mật khẩu xác nhận không chính xác.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', content: 'Lỗi kết nối máy chủ' });
    } finally {
      setIsUpdating(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- LOGIC ĐỔI MẬT KHẨU ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordModal.newPassword !== passwordModal.confirmPassword) {
      setPasswordModal({ ...passwordModal, error: 'Mật khẩu mới và xác nhận không khớp!' });
      return;
    }

    setPasswordModal({ ...passwordModal, isSubmitting: true, error: '' });

    try {
      const response = await fetchClient('/api/nguoidung/doi-mat-khau', {
        method: 'PUT',
        body: JSON.stringify({
          MatKhauCu: passwordModal.oldPassword,
          MatKhauMoi: passwordModal.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Đổi mật khẩu thành công!");
        setPasswordModal({ 
            isOpen: false, oldPassword: '', newPassword: '', confirmPassword: '', error: '', isSubmitting: false 
        });
      } else {
        setPasswordModal({ ...passwordModal, error: data.message || "Lỗi khi đổi mật khẩu", isSubmitting: false });
      }
    } catch (err) {
      setPasswordModal({ ...passwordModal, error: "Lỗi kết nối máy chủ", isSubmitting: false });
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

  if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-main-orange"></div></div>;
  if (!userData) return null;

  return (
    <>
      <main className={`${styles.pageProfile} py-5 bg-light min-vh-100`}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">

              {/* BOX TỔNG QUAN & AVATAR */}
              <div className={`${styles.infoBox} card shadow-sm border-0 mb-4 p-4 d-flex flex-column flex-md-row align-items-center position-relative`}>
                <div className="d-flex flex-column align-items-center position-relative">
                  <div className="position-relative d-inline-block">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="rounded-circle border border-2 shadow-sm" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                    ) : (
                      <div className="rounded-circle border d-flex justify-content-center align-items-center bg-secondary text-white" style={{ width: '100px', height: '100px' }}>
                        <i className="bi bi-person-circle" style={{ fontSize: '3rem' }}></i>
                      </div>
                    )}
                    <label htmlFor="avatarUpload" className="position-absolute bottom-0 end-0 bg-main-orange text-white border-0 rounded-circle shadow d-flex align-items-center justify-content-center cursor-pointer" style={{ width: '32px', height: '32px' }}>
                      <i className="bi bi-camera-fill"></i>
                    </label>
                    <input type="file" id="avatarUpload" accept="image/*" className="d-none" onChange={handleImageChange} />
                  </div>
                  {avatarError && <div className="mt-2 text-danger fw-bold small text-center">{avatarError}</div>}
                </div>

                <div className="ms-md-4 mt-3 mt-md-0 text-center text-md-start flex-grow-1">
                  <h3 className="fw-bold mb-1 text-dark">{userData.HoTen}</h3>
                  <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-2 mt-2">
                    <span className="badge bg-main-orange">{getRoleName(userData.VaiTro)}</span>
                    <span className="badge bg-light text-dark border">Mã số: {userData._id.substring(18)}</span>
                  </div>
                </div>

                <button 
                  className="btn btn-outline-dark btn-sm rounded-pill px-3 mt-3 mt-md-0 fw-bold"
                  onClick={() => setPasswordModal({ ...passwordModal, isOpen: true })}
                >
                  <i className="bi bi-shield-lock me-2"></i> Đổi mật khẩu
                </button>
              </div>

              {/* FORM CHỈNH SỬA */}
              <div className="card shadow-sm border-0 p-4 p-md-5 rounded-4">
                <h5 className="fw-bold mb-4 border-bottom pb-3 text-primary"><i className="bi bi-person-lines-fill me-2"></i>Thông tin cá nhân</h5>

                {message.content && (
                  <div className={`alert alert-${message.type} text-center py-2 shadow-sm mb-4`}>{message.content}</div>
                )}

                <form onSubmit={triggerUpdate}>
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-muted">Họ và tên</label>
                      <input type="text" className="form-control form-control-lg shadow-none" value={userData.HoTen} onChange={(e) => setUserData({ ...userData, HoTen: e.target.value })} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-muted">Địa chỉ Email</label>
                      <input type="email" className="form-control form-control-lg shadow-none" value={userData.Email} onChange={(e) => setUserData({ ...userData, Email: e.target.value })} required />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-muted text-opacity-50">Vai trò (Cố định)</label>
                      <input type="text" className="form-control form-control-lg bg-light text-muted border-0" value={getRoleName(userData.VaiTro)} readOnly />
                    </div>

                    {userData.VaiTro === 'GiaoVien' && (
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold small text-muted text-opacity-50">Môn học phụ trách (Cố định)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-0"><i className="bi bi-book text-muted"></i></span>
                          <input type="text" className="form-control form-control-lg bg-light text-muted border-0" value={userData.MonHoc || "Chưa phân công"} readOnly />
                        </div>
                      </div>
                    )}

                    {userData.VaiTro === 'HocSinh' && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small text-muted">Khối thi mục tiêu</label>
                          <select className="form-select form-select-lg shadow-none" value={userData.KhoiThi || ""} onChange={(e) => setUserData({ ...userData, KhoiThi: e.target.value })}>
                            <option value="">Chọn khối thi</option>
                            <option value="A00">A00 (Toán, Lý, Hóa)</option>
                            <option value="B00">B00 (Toán, Hóa, Sinh)</option>
                            <option value="D01">D01 (Toán, Văn, Anh)</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small text-muted">Điểm kỳ vọng (3 môn)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0"
                            max="30"
                            className="form-control form-control-lg shadow-none" 
                            placeholder="Từ 0 đến 30 (VD: 25.5)"
                            value={userData.DiemKyVong !== null && userData.DiemKyVong !== undefined ? userData.DiemKyVong : ''} 
                            onChange={(e) => setUserData({ ...userData, DiemKyVong: e.target.value })} 
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-bold small text-muted">Trường đại học kỳ vọng</label>
                          <input type="text" className="form-control form-control-lg shadow-none" value={userData.TruongKyVong || ""} onChange={(e) => setUserData({ ...userData, TruongKyVong: e.target.value })} />
                        </div>
                      </>
                    )}

                    <div className="col-12 mt-4 text-center">
                      <button type="submit" className="btn btn-main-orange px-5 py-3 fw-bold text-white rounded-pill shadow w-100 w-md-auto" disabled={isUpdating}>
                        {isUpdating ? <><span className="spinner-border spinner-border-sm me-2"></span> Đang xử lý...</> : <><i className="bi bi-cloud-check-fill me-2"></i> Lưu thay đổi</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* === MODAL ĐỔI MẬT KHẨU === */}
      {passwordModal.isOpen && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
            <h4 className="fw-bold mb-4 text-center">Đổi mật khẩu tài khoản</h4>
            {passwordModal.error && <div className="alert alert-danger py-2 small text-center">{passwordModal.error}</div>}
            <form onSubmit={handlePasswordChange}>
              <div className="mb-3">
                <label className="form-label fw-bold small">Mật khẩu hiện tại</label>
                <input type="password" placeholder="Nhập mật khẩu đang dùng" className="form-control shadow-none" required value={passwordModal.oldPassword} onChange={(e) => setPasswordModal({ ...passwordModal, oldPassword: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold small">Mật khẩu mới</label>
                <input type="password" placeholder="Tối thiểu 6 ký tự" className="form-control shadow-none" required minLength="6" value={passwordModal.newPassword} onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })} />
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold small">Xác nhận mật khẩu mới</label>
                <input type="password" placeholder="Nhập lại mật khẩu mới" className="form-control shadow-none" required value={passwordModal.confirmPassword} onChange={(e) => setPasswordModal({ ...passwordModal, confirmPassword: e.target.value })} />
              </div>
              <div className="d-flex gap-3">
                <button type="button" className="btn btn-light border flex-grow-1 fw-bold rounded-pill" onClick={() => setPasswordModal({ ...passwordModal, isOpen: false })}>Hủy</button>
                <button type="submit" className="btn btn-primary flex-grow-1 fw-bold rounded-pill shadow" disabled={passwordModal.isSubmitting}>
                   {passwordModal.isSubmitting ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === OVERLAY XÁC NHẬN LƯU THÔNG TIN (YÊU CẦU NHẬP MẬT KHẨU) === */}
      {confirmModal.isOpen && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001, backdropFilter: 'blur(4px)' }}>
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__fadeInUp" style={{ maxWidth: '400px', width: '90%' }}>
                <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex p-3 mb-3"><i className="bi bi-shield-lock-fill fs-2"></i></div>
                <h4 className="fw-bold text-dark">Xác thực danh tính</h4>
                <p className="text-muted small mb-4">{confirmModal.message}</p>
                <div className="mb-4">
                    <input 
                        type="password" 
                        className={`form-control form-control-lg shadow-none ${confirmModal.error ? 'border-danger' : ''}`}
                        placeholder="Nhập mật khẩu hiện tại..."
                        value={confirmModal.passwordToVerify}
                        onChange={(e) => setConfirmModal({ ...confirmModal, passwordToVerify: e.target.value, error: '' })}
                        autoFocus
                    />
                    {confirmModal.error && <div className="text-danger small mt-1 fw-bold text-start">{confirmModal.error}</div>}
                </div>
                <div className="d-flex justify-content-center gap-3">
                    <button className="btn btn-light border fw-bold rounded-pill px-4 py-2" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Hủy bỏ</button>
                    <button className="btn btn-primary fw-bold rounded-pill px-4 py-2 text-white shadow" onClick={executeUpdate}>Xác nhận & Lưu</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default ThongTinCaNhan;