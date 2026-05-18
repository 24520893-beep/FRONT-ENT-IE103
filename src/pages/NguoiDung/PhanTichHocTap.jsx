import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient';
import ChartsEmbedSDK from '@mongodb-js/charts-embed-dom';

const PhanTichHocTap = () => {
    const [soTayData, setSoTayData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Tham chiếu đến div chứa biểu đồ
    const chartContainerRef = useRef(null);
    // Tham chiếu để lưu instance của biểu đồ (tránh render lại nhiều lần)
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const loadDataAndChart = async () => {
            setIsLoading(true);
            try {
                // 1. Lấy thông tin user hiện tại từ LocalStorage
                const savedUser = localStorage.getItem('user');
                let currentUserId = null;
                if (savedUser) {
                    currentUserId = JSON.parse(savedUser)._id;
                }

                // 2. Fetch dữ liệu cho Sổ tay lỗi sai từ Back-end
                const resSoTay = await fetchClient('/api/reports/sotay-loisai');
                if (resSoTay.ok) {
                    const dataSoTay = await resSoTay.json();
                    setSoTayData(dataSoTay || []);
                }

                // 3. Khởi tạo và nhúng Biểu đồ MongoDB (Nếu có container và chưa render)
                if (chartContainerRef.current && currentUserId && !chartInstanceRef.current) {
                    const sdk = new ChartsEmbedSDK({
                        // Sử dụng Base URL của project bạn (lấy từ DashboardOverview)
                        baseUrl: 'https://charts.mongodb.com/charts-ie103_quanlyonthi_tudaica-dnifgsl'
                    });

                    const chart = sdk.createChart({
                        // THAY THẾ ID BIỂU ĐỒ CỦA BẠN VÀO ĐÂY:
                        chartId: '645b89c5-a01b-4444-9907-4b6745c11b6b', 
                        // BỘ LỌC BẢO MẬT: Chỉ lấy dữ liệu của học sinh hiện tại
                        filter: { MaHocSinh: { $oid: currentUserId } },
                        theme: 'light',
                        autoRefresh: true,
                        maxDataAge: 60,
                        background: 'transparent'
                    });

                    await chart.render(chartContainerRef.current);
                    chartInstanceRef.current = chart; // Lưu lại để không render đè
                }

            } catch (error) {
                console.error("Lỗi tải phân tích học tập:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDataAndChart();

        // Cleanup function: Hủy biểu đồ khi người dùng rời khỏi trang
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, []);

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
                <div className="spinner-border text-main-orange" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }

    return (
        <main className="bg-light min-vh-100 pb-5" style={{ paddingTop: '80px' }}>
            <div className="container mt-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                    <h3 className="fw-bold text-dark mb-3 mb-md-0">
                        <i className="bi bi-clipboard-data-fill text-main-orange me-2"></i>
                        Phân tích Học tập & Sổ tay lỗi sai
                    </h3>
                    <Link to="/ket-qua-thi" className="btn btn-outline-secondary rounded-pill fw-bold px-4">
                        <i className="bi bi-arrow-left me-2"></i>Về Lịch sử thi
                    </Link>
                </div>

                <div className="row g-4">
                    {/* PHẦN 1: BIỂU ĐỒ 100% STACKED BAR NHÚNG TỪ MONGODB ATLAS */}
                    <div className="col-12 col-xl-5">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-header bg-white border-0 pt-4 pb-0">
                                <h5 className="fw-bold text-dark mb-1">Thống kê Lỗ hổng kiến thức</h5>
                                <p className="text-muted small">Tỷ lệ Trả lời Đúng / Sai theo từng chuyên đề</p>
                            </div>
                            <div className="card-body p-2">
                                {/* Thẻ div này là nơi MongoDB Chart sẽ được vẽ vào */}
                                <div 
                                    ref={chartContainerRef} 
                                    style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* PHẦN 2: SỔ TAY LỖI SAI CHI TIẾT */}
                    <div className="col-12 col-xl-7">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-header bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold text-dark mb-1">Sổ tay Lỗi sai</h5>
                                    <p className="text-muted small">Những câu hỏi bạn đã làm sai gần đây</p>
                                </div>
                                <span className="badge bg-danger-subtle text-danger fs-6 rounded-pill px-3 py-2">
                                    {soTayData.length} câu sai
                                </span>
                            </div>
                            <div className="card-body overflow-auto" style={{ maxHeight: '600px' }}>
                                {soTayData.length > 0 ? (
                                    <div className="accordion" id="accordionMistakes">
                                        {soTayData.map((item, idx) => (
                                            <div className="accordion-item border-0 mb-3 shadow-sm rounded-3 overflow-hidden" key={idx}>
                                                <h2 className="accordion-header" id={`heading-${idx}`}>
                                                    <button 
                                                        className="accordion-button collapsed bg-white fw-bold text-dark shadow-none" 
                                                        type="button" 
                                                        data-bs-toggle="collapse" 
                                                        data-bs-target={`#collapse-${idx}`}
                                                    >
                                                        <span className="badge bg-secondary me-2">{item.MonHoc || 'Chung'}</span>
                                                        <span className="text-truncate" style={{ maxWidth: '70%' }}>
                                                            {item.NoiDungCauHoi}
                                                        </span>
                                                    </button>
                                                </h2>
                                                <div id={`collapse-${idx}`} className="accordion-collapse collapse" data-bs-parent="#accordionMistakes">
                                                    <div className="accordion-body bg-light">
                                                        <div className="mb-3 text-dark fw-medium lh-base">
                                                            <strong>Nội dung:</strong> {item.NoiDungCauHoi}
                                                        </div>
                                                        <div className="row g-3 mb-3">
                                                            <div className="col-md-6">
                                                                <div className="p-3 bg-danger-subtle border border-danger border-opacity-25 rounded-3 h-100">
                                                                    <div className="small text-danger fw-bold text-uppercase mb-1"><i className="bi bi-x-circle me-1"></i>Bạn đã chọn</div>
                                                                    <div className="text-dark fw-medium">{item.LuaChonCuaHocSinh || '[Bỏ trống]'}</div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className="p-3 bg-success-subtle border border-success border-opacity-25 rounded-3 h-100">
                                                                    <div className="small text-success fw-bold text-uppercase mb-1"><i className="bi bi-check-circle me-1"></i>Đáp án đúng</div>
                                                                    <div className="text-dark fw-medium">{item.DapAnChinhXac}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {item.DapAnGoiY && (
                                                            <div className="p-3 bg-white border-start border-4 border-info shadow-sm rounded-end">
                                                                <div className="small text-info fw-bold text-uppercase mb-1"><i className="bi bi-lightbulb me-1"></i>Giải thích / Gợi ý</div>
                                                                <div className="text-dark small lh-lg">{item.DapAnGoiY}</div>
                                                            </div>
                                                        )}
                                                        <div className="text-end mt-3">
                                                            <span className="text-muted" style={{fontSize: '11px'}}>Trích từ đề thi: {item.TenDeThi} ({new Date(item.NgayLam).toLocaleDateString('vi-VN')})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted opacity-50 py-5">
                                        <i className="bi bi-journal-check fs-1 mb-2"></i>
                                        <p>Tuyệt vời! Bạn không có lỗi sai nào gần đây.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PhanTichHocTap;