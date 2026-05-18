import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient';

const HocSinhSaSut = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAlertData = async () => {
            try {
                const response = await fetchClient('/api/reports/phantich-muctieu-thucte');
                if (response.ok) {
                    const data = await response.json();
                    setStudents(data || []);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách học sinh sa sút:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlertData();
    }, []);

    const handleTuVan = (studentName) => {
        // Có thể mở một modal chat hoặc chuyển hướng đến trang nhắn tin nội bộ
        alert(`Hệ thống đang kết nối phiên Tư vấn trực tiếp cho học sinh: ${studentName}`);
    };

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
                <div className="spinner-border text-danger" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }

    return (
        <main className="bg-light min-vh-100 pb-5" style={{ paddingTop: '80px' }}>
            <div className="container mt-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                    <div>
                        <h3 className="fw-bold text-dark mb-1">
                            <i className="bi bi-life-preserver text-danger me-2"></i>
                            Bảng Điều Khiển "Cứu Net"
                        </h3>
                        <p className="text-muted mb-0">Theo dõi và hỗ trợ kịp thời các học sinh đang có điểm số sa sút.</p>
                    </div>
                </div>

                <div className="card shadow-sm border-0">
                    <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold text-dark mb-0">Danh sách cần hỗ trợ khẩn cấp</h5>
                        <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fs-6">
                            {students.length} Học sinh
                        </span>
                    </div>
                    
                    <div className="card-body">
                        {students.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light text-muted small text-uppercase">
                                        <tr>
                                            <th className="ps-3">Học sinh</th>
                                            <th>Mục tiêu Đại học</th>
                                            <th className="text-center">Điểm kỳ vọng</th>
                                            <th className="text-center">Điểm thực tế</th>
                                            <th className="text-center">Độ lệch</th>
                                            <th className="text-end pe-3">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student, idx) => (
                                            <tr key={idx}>
                                                <td className="ps-3 fw-bold text-dark">
                                                    <i className="bi bi-person-circle text-secondary me-2"></i>
                                                    {student.HoTen}
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark border text-wrap text-start" style={{maxWidth: '200px'}}>
                                                        {student.TruongKyVong || 'Chưa cập nhật'}
                                                    </span>
                                                </td>
                                                <td className="text-center fw-bold text-primary">
                                                    {student.DiemKyVong ? student.DiemKyVong.toFixed(1) : '-'}
                                                </td>
                                                <td className="text-center fw-bold text-danger">
                                                    {student.DiemThucTe.toFixed(2)}
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge bg-danger-subtle text-danger">
                                                        <i className="bi bi-arrow-down-short"></i> {student.ChenhLech}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-3">
                                                    <div className="btn-group">
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger fw-bold"
                                                            onClick={() => handleTuVan(student.HoTen)}
                                                        >
                                                            <i className="bi bi-chat-dots me-1"></i> Tư vấn
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-outline-secondary fw-bold"
                                                            title="Giảm độ khó Lộ trình"
                                                            onClick={() => navigate('/lo-trinh')}
                                                        >
                                                            <i className="bi bi-sliders"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <i className="bi bi-emoji-smile text-success opacity-50 mb-3 d-block" style={{ fontSize: '4rem' }}></i>
                                <h5 className="text-muted fw-bold">Tuyệt vời!</h5>
                                <p className="text-muted">Hiện tại không có học sinh nào bị tụt lại phía sau.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default HocSinhSaSut;