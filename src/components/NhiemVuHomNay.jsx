import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchClient } from '../utils/fetchClient';

const NhiemVuHomNay = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // API đã được bảo vệ qua getSecuredView, chỉ lấy data của chính học sinh này
                const response = await fetchClient('/api/reports/tiendo-nhiemvu-homnay');
                if (response.ok) {
                    const data = await response.json();
                    setTasks(data || []);
                }
            } catch (error) {
                console.error("Lỗi lấy nhiệm vụ hôm nay:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, []);

    // Nếu đang tải hoặc không có nhiệm vụ nào, ẩn widget đi để tránh làm rác trang chủ
    if (isLoading || tasks.length === 0) return null;

    return (
        <section className="py-4 mb-4 bg-white shadow-sm border-bottom border-top">
            <div className="container">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="fw-bold text-dark mb-0">
                        <i className="bi bi-lightning-charge-fill text-warning me-2"></i>
                        Mục tiêu hôm nay của bạn
                    </h4>
                </div>

                <div className="row g-3">
                    {tasks.map((task, index) => {
                        const isDeThi = task.LoaiNhiemVuTiepTheo === 'DeThiThu';
                        
                        return (
                            <div className="col-12 col-md-6 col-lg-4" key={index}>
                                <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: isDeThi ? '#f0f8ff' : '#fff3cd' }}>
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <span className={`badge ${isDeThi ? 'bg-primary' : 'bg-warning text-dark'}`}>
                                                {task.MonHoc || 'Chung'}
                                            </span>
                                            <i className={`bi ${isDeThi ? 'bi-journal-code text-primary' : 'bi-file-earmark-text text-warning'} fs-4 opacity-50`}></i>
                                        </div>
                                        
                                        <h6 className="card-title fw-bold text-dark mb-1 text-truncate" title={task.TenLoTrinh}>
                                            {task.TenLoTrinh}
                                        </h6>
                                        
                                        <p className="text-muted small mb-3">
                                            Nhiệm vụ tiếp theo: <strong>{isDeThi ? 'Làm bài kiểm tra' : 'Học tài liệu mới'}</strong>
                                        </p>
                                        
                                        <div className="mt-auto">
                                            {/* Nút điều hướng dẫn thẳng vào trang Chi tiết Lộ trình của môn đó */}
                                            <Link 
                                                to={`/lo-trinh/${task.MaLoTrinh}`} 
                                                className={`btn btn-sm w-100 fw-bold ${isDeThi ? 'btn-primary' : 'btn-warning'}`}
                                            >
                                                Học tiếp ngay <i className="bi bi-arrow-right-short ms-1"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default NhiemVuHomNay;