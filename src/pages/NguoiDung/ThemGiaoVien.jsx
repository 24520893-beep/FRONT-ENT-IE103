import React, { useState } from 'react';
import styles from './ThemGiaoVien.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ThemGiaoVien = () => {
    // STATE LƯU TRỮ DỮ LIỆU FORM
    const [hoTen, setHoTen] = useState('');
    const [email, setEmail] = useState('');
    const [matKhau, setMatKhau] = useState('');
    const [monHoc, setMonHoc] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // XỬ LÝ SUBMIT TẠO GIÁO VIÊN
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate cơ bản
        if (!monHoc) {
            alert("Vui lòng chọn môn học phụ trách cho Giáo viên.");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            HoTen: hoTen,
            Email: email,
            MatKhau: matKhau,
            VaiTro: 'GiaoVien', // Ép cứng vai trò là Giáo viên
            MonHoc: monHoc
        };

        try {
            // Đã sửa: Sử dụng fetchClient, không cần lấy token và set Headers JSON thủ công
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
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className={styles.pageTitle}>Thêm giáo viên mới</h1>
                    <p className="text-muted mb-0 mt-1">Cấp tài khoản và phân công môn học cho giáo viên</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card shadow-sm border-0 mb-4 mt-2">
                    <div className="card-body p-4">
                        <h5 className="mb-4 fw-bold border-bottom pb-2">Thông tin định danh</h5>
                        
                        {/* ROW 1: Họ Tên & Email */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Họ và tên <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nhập họ tên đầy đủ..."
                                    value={hoTen}
                                    onChange={(e) => setHoTen(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mt-3 mt-md-0">
                                <label className="form-label fw-bold">Địa chỉ Email <span className="text-danger">*</span></label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Ví dụ: giaovien@hocmoi.vn"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <small className="text-muted mt-1 d-block">Dùng làm tên đăng nhập hệ thống.</small>
                            </div>
                        </div>

                        <h5 className="mb-4 fw-bold border-bottom pb-2 mt-5">Bảo mật & Phân công</h5>

                        {/* ROW 2: Mật khẩu & Môn học */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Mật khẩu khởi tạo <span className="text-danger">*</span></label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Nhập mật khẩu..."
                                    value={matKhau}
                                    onChange={(e) => setMatKhau(e.target.value)}
                                    required
                                    minLength="6"
                                />
                                <small className="text-muted mt-1 d-block">Giáo viên có thể đổi mật khẩu này sau khi đăng nhập.</small>
                            </div>
                            <div className="col-md-6 mt-3 mt-md-0">
                                <label className="form-label fw-bold">Môn học phụ trách <span className="text-danger">*</span></label>
                                <select
                                    className="form-select"
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

                {/* NÚT SUBMIT */}
                <div className="text-end mb-5">
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-lg px-5 shadow" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang xử lý...</>
                        ) : (
                            <><i className="bi bi-person-plus-fill me-2"></i>Tạo tài khoản</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ThemGiaoVien;