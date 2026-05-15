import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ThemGiaoVien.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

const ThemGiaoVien = () => {
    // STATE LƯU TRỮ DỮ LIỆU FORM
    const [hoTen, setHoTen] = useState('');
    const [email, setEmail] = useState('');
    const [matKhau, setMatKhau] = useState('');
    const [monHoc, setMonHoc] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // === STATE QUẢN LÝ OVERLAY XÁC NHẬN ===
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        message: '',
        type: 'primary' // 'primary' cho tạo mới, 'danger' cho cảnh báo
    });

    // HÀM XỬ LÝ KHI NHẤN NÚT "TẠO TÀI KHOẢN" (MỞ MODAL)
    const handlePreSubmit = (e) => {
        e.preventDefault();

        // Validate cơ bản
        if (!monHoc) {
            alert("Vui lòng chọn môn học phụ trách cho Giáo viên.");
            return;
        }

        setConfirmModal({
            isOpen: true,
            message: `Xác nhận tạo tài khoản cho Giáo viên "${hoTen}" với môn học phụ trách là "${monHoc}"?`,
            type: 'primary'
        });
    };

    // HÀM THỰC THI GỌI API SAU KHI XÁC NHẬN TRÊN MODAL
    const executeCreateTeacher = async () => {
        setConfirmModal({ ...confirmModal, isOpen: false }); // Đóng modal ngay
        setIsSubmitting(true);

        const payload = {
            HoTen: hoTen,
            Email: email,
            MatKhau: matKhau,
            VaiTro: 'GiaoVien',
            MonHoc: monHoc
        };

        try {
            const response = await fetchClient('/api/nguoidung', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Đã tạo tài khoản Giáo viên thành công!");
                
                // Reset form sau khi tạo thành công
                setHoTen('');
                setEmail('');
                setMatKhau('');
                setMonHoc('');
            } else {
                let errorMsg = "Không thể tạo tài khoản. Vui lòng kiểm tra lại.";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (parseError) {
                    console.error("Không thể đọc lỗi từ server");
                }
                alert(`Lỗi: ${errorMsg}`);
            }

        } catch (error) {
            console.error("Lỗi kết nối:", error);
            alert("Đã xảy ra sự cố kết nối tới máy chủ. Vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className={styles.pageTitle}>Thêm giáo viên mới</h1>
                        <p className="text-muted mb-0 mt-1 small text-uppercase fw-bold letter-spacing-1">
                            <i className="bi bi-shield-lock-fill me-2"></i>Cấp tài khoản & Phân công chuyên môn
                        </p>
                    </div>
                </div>

                <form onSubmit={handlePreSubmit}>
                    <div className="card shadow-sm border-0 mb-4 mt-2">
                        <div className="card-body p-4 p-md-5">
                            <h5 className="mb-4 fw-bold border-bottom pb-3">
                                <i className="bi bi-person-badge me-2 text-primary"></i>Thông tin cá nhân
                            </h5>
                            
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Họ và tên giáo viên <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg shadow-none"
                                        placeholder="Nhập họ tên đầy đủ..."
                                        value={hoTen}
                                        onChange={(e) => setHoTen(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 mt-3 mt-md-0">
                                    <label className="form-label fw-bold small text-muted">Địa chỉ Email <span className="text-danger">*</span></label>
                                    <input
                                        type="email"
                                        className="form-control form-control-lg shadow-none"
                                        placeholder="Ví dụ: giaovien@hocmoi.vn"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <small className="text-muted mt-2 d-block fst-italic">Địa chỉ này sẽ dùng để đăng nhập vào hệ thống.</small>
                                </div>
                            </div>

                            <h5 className="mb-4 fw-bold border-bottom pb-3 mt-5">
                                <i className="bi bi-briefcase me-2 text-primary"></i>Bảo mật & Chuyên môn
                            </h5>

                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-muted">Mật khẩu khởi tạo <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-key"></i></span>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg shadow-none border-start-0"
                                            placeholder="Nhập mật khẩu..."
                                            value={matKhau}
                                            onChange={(e) => setMatKhau(e.target.value)}
                                            required
                                            minLength="6"
                                        />
                                    </div>
                                    <small className="text-muted mt-2 d-block">Tối thiểu 6 ký tự. GV có thể tự đổi sau.</small>
                                </div>
                                <div className="col-md-6 mt-3 mt-md-0">
                                    <label className="form-label fw-bold small text-muted">Môn học phụ trách <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-book"></i></span>
                                        <select
                                            className="form-select form-select-lg shadow-none border-start-0 fw-medium"
                                            value={monHoc}
                                            onChange={(e) => setMonHoc(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>-- Chọn môn học --</option>
                                            <option value="Toán">Toán</option>
                                            <option value="Vật lý">Vật lý</option>
                                            <option value="Hóa học">Hóa học</option>
                                            <option value="Ngữ văn">Ngữ văn</option>
                                            <option value="Tiếng Anh">Tiếng Anh</option>
                                            <option value="Sinh học">Sinh học</option>
                                            <option value="Lịch sử">Lịch sử</option>
                                            <option value="Địa lý">Địa lý</option>
                                            <option value="GDCD">Giáo dục Công dân</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NÚT SUBMIT */}
                    <div className="text-end mb-5">
                        <Link to="/quan-ly-nguoi-dung" className="btn btn-light btn-lg px-4 me-3 border shadow-sm">Hủy bỏ</Link>
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-lg px-5 shadow-sm fw-bold" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Đang xử lý...</>
                            ) : (
                                <><i className="bi bi-person-plus-fill me-2"></i>Tạo tài khoản ngay</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* === GIAO DIỆN OVERLAY (MODAL) XÁC NHẬN THÊM GIÁO VIÊN === */}
            {confirmModal.isOpen && (
                <div 
                    className="d-flex align-items-center justify-content-center" 
                    style={{
                        position: 'fixed', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.5)', 
                        zIndex: 10000,
                        backdropFilter: 'blur(3px)'
                    }}
                >
                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
                        <i className="bi bi-person-check-fill text-primary mb-3" style={{ fontSize: '4rem' }}></i>
                        <h4 className="fw-bold text-dark">Xác nhận tạo giáo viên</h4>
                        <p className="text-muted mt-2 mb-4 fs-6">{confirmModal.message}</p>
                        
                        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 mt-4">
                            <button 
                                className="btn btn-light border fw-bold rounded-pill px-4 py-2" 
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            >
                                Quay lại sửa
                            </button>
                            <button 
                                className="btn btn-primary fw-bold rounded-pill px-4 py-2 text-white shadow"
                                onClick={executeCreateTeacher}
                            >
                                Đồng ý & Tạo mới
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ThemGiaoVien;