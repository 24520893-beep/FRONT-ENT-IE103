import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient';

const QuanLyCanhBao = () => {
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await fetchClient('/api/reports/canhbao-hocsinh');
                if (response.ok) {
                    const data = await response.json();
                    setAlerts(data || []);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách cảnh báo:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    // Tạo sẵn luồng gửi Email bằng mailto của trình duyệt
    const handleSendEmail = (email, name, roadmap) => {
        const subject = encodeURIComponent("HOCMOI.VN - Thông báo nhắc nhở tiến độ học tập");
        const body = encodeURIComponent(
            `Chào ${name},\n\nHệ thống HOCMOI nhận thấy bạn đã đăng ký lộ trình "${roadmap}" nhưng chưa có nhiều hoạt động tương tác hay làm bài kiểm tra.\n\nBạn có đang gặp khó khăn gì trong quá trình học không? Hãy phản hồi lại email này để đội ngũ hỗ trợ giúp đỡ bạn nhé!\n\nTrân trọng,\nĐội ngũ CSKH HOCMOI.VN`
        );
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    };

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
                <div className="spinner-border text-warning" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }

    return (
        <main className="bg-light min-vh-100 pb-5" style={{ paddingTop: '80px' }}>
            <div className="container mt-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                    <div>
                        <h3 className="fw-bold text-dark mb-1">
                            <i className="bi bi-bell-fill text-warning me-2"></i>
                            Quản lý Cảnh báo Học tập
                        </h3>
                        <p className="text-muted mb-0">Hệ thống nhận diện học sinh bỏ bê lộ trình cần được hỗ trợ.</p>
                    </div>
                </div>

                <div className="card shadow-sm border-0">
                    <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold text-dark mb-0">Danh sách Học sinh "Ngủ đông"</h5>
                        <span className="badge bg-warning-subtle text-dark border border-warning px-3 py-2 rounded-pill fs-6">
                            {alerts.length} Trường hợp
                        </span>
                    </div>
                    
                    <div className="card-body">
                        {alerts.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light text-muted small text-uppercase">
                                        <tr>
                                            <th className="ps-3">Học sinh</th>
                                            <th>Email liên hệ</th>
                                            <th>Lộ trình đang học</th>
                                            <th className="text-center">Tiến độ</th>
                                            <th>Trạng thái hệ thống</th>
                                            <th className="text-end pe-3">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.map((student, idx) => (
                                            <tr key={idx}>
                                                <td className="ps-3 fw-bold text-dark">
                                                    <i className="bi bi-person-circle text-secondary me-2"></i>
                                                    {student.HoTen}
                                                </td>
                                                <td className="text-primary">{student.EmailLienHe}</td>
                                                <td>
                                                    <span className="badge bg-light text-dark border text-wrap text-start" style={{maxWidth: '200px'}}>
                                                        {student.TenLoTrinhDangHoc}
                                                    </span>
                                                </td>
                                                <td className="text-center fw-bold text-danger">
                                                    {student.MucDoHoanThanh}%
                                                </td>
                                                <td>
                                                    <span className="badge bg-danger-subtle text-danger">
                                                        <i className="bi bi-exclamation-triangle-fill me-1"></i> 
                                                        {student.TrangThai || "Thiếu tương tác"}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-3">
                                                    <button 
                                                        className="btn btn-sm btn-outline-dark fw-bold"
                                                        onClick={() => handleSendEmail(student.EmailLienHe, student.HoTen, student.TenLoTrinhDangHoc)}
                                                    >
                                                        <i className="bi bi-envelope-at me-1"></i> Gửi Email
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <i className="bi bi-shield-check text-success opacity-50 mb-3 d-block" style={{ fontSize: '4rem' }}></i>
                                <h5 className="text-muted fw-bold">Hệ thống ổn định!</h5>
                                <p className="text-muted">Tất cả học sinh đều đang tương tác tốt với các lộ trình học tập.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default QuanLyCanhBao;