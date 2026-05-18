import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ChartsEmbedSDK from '@mongodb-js/charts-embed-dom';
import { fetchClient } from '../../utils/fetchClient';

// ========================================================
// COMPONENT CON: CHỊU TRÁCH NHIỆM VẼ 1 BỘ BIỂU ĐỒ CHO 1 LỘ TRÌNH
// ========================================================
const RoadmapChartGroup = ({ sdk, roadmap }) => {
    const gaugeChartRef = useRef(null);
    const lineChartRef = useRef(null);
    const gaugeInstanceRef = useRef(null);
    const lineInstanceRef = useRef(null);

    useEffect(() => {
        const renderCharts = async () => {
            try {
                // BỘ LỌC ĐỘNG: Lọc chính xác theo ID của lộ trình này
                const chartFilter = { _id: { $oid: roadmap._id } };

                // Vẽ Gauge Chart
                if (gaugeChartRef.current && !gaugeInstanceRef.current) {
                    const gaugeChart = sdk.createChart({
                        chartId: '4e529aef-f564-4c41-994c-b9dcc0f409d4', // ID Biểu đồ Gauge của bạn
                        filter: chartFilter,
                        theme: 'light',
                        background: 'transparent'
                    });
                    await gaugeChart.render(gaugeChartRef.current);
                    gaugeInstanceRef.current = gaugeChart;
                }

                // Vẽ Line Chart
                if (lineChartRef.current && !lineInstanceRef.current) {
                    const lineChart = sdk.createChart({
                        chartId: '9f3909fb-cd5b-4869-ba75-e0c99c4e25dd', // ID Biểu đồ Line của bạn
                        filter: chartFilter,
                        theme: 'light',
                        background: 'transparent'
                    });
                    await lineChart.render(lineChartRef.current);
                    lineInstanceRef.current = lineChart;
                }
            } catch (error) {
                console.error(`Lỗi vẽ biểu đồ cho lộ trình ${roadmap.TenLoTrinh}:`, error);
            }
        };

        renderCharts();

        // Dọn dẹp bộ nhớ khi component bị hủy
        return () => {
            if (gaugeInstanceRef.current) gaugeInstanceRef.current.destroy();
            if (lineInstanceRef.current) lineInstanceRef.current.destroy();
        };
    }, [sdk, roadmap._id]);

    return (
        <div className="card shadow-sm border-0 mb-5">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="fw-bold text-dark mb-1">{roadmap.TenLoTrinh}</h5>
                    <span className="badge bg-light text-secondary border">Môn: {roadmap.MonHoc}</span>
                </div>
                <Link to={`/lo-trinh/${roadmap._id}`} className="btn btn-sm btn-outline-main-orange">
                    Đến bài học <i className="bi bi-arrow-right"></i>
                </Link>
            </div>
            <div className="card-body bg-light">
                <div className="row g-4">
                    {/* Gauge Chart */}
                    <div className="col-12 col-md-4">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <h6 className="fw-bold text-muted mb-0 mt-2">Tiến độ hiện tại</h6>
                                <div ref={gaugeChartRef} style={{ height: '250px', width: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                    {/* Line Chart */}
                    <div className="col-12 col-md-8">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body p-2 d-flex flex-column">
                                <h6 className="fw-bold text-muted mb-0 mt-2 ms-3">Xu hướng học tập (Tốc độ tăng trưởng)</h6>
                                <div ref={lineChartRef} style={{ height: '250px', width: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================
// COMPONENT CHÍNH: LẤY DANH SÁCH LỘ TRÌNH VÀ RENDER
// ========================================================
const TienDoLoTrinh = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [roadmaps, setRoadmaps] = useState([]);
    const [sdk, setSdk] = useState(null);

    // Khởi tạo SDK một lần duy nhất
    useEffect(() => {
        const chartsSdk = new ChartsEmbedSDK({
            baseUrl: 'https://charts.mongodb.com/charts-ie103_quanlyonthi_tudaica-dnifgsl'
        });
        setSdk(chartsSdk);
    }, []);

    // Lấy danh sách lộ trình của học sinh từ DB
    useEffect(() => {
        const fetchStudentRoadmaps = async () => {
            try {
                // Gọi API lấy danh sách lộ trình. 
                // Do backend của bạn đã tự lọc bằng req.user._id (currentUser.VaiTro === 'HocSinh') ở hàm getAll,
                // nên ta chỉ cần gọi thẳng API này.
                const response = await fetchClient('/api/lotrinhhoctap?limit=50');
                if (response.ok) {
                    const resData = await response.json();
                    const dataArray = Array.isArray(resData) ? resData : (resData.data || []);
                    setRoadmaps(dataArray);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách lộ trình:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudentRoadmaps();
    }, []);

    return (
        <main className="bg-light min-vh-100 pb-5" style={{ paddingTop: '80px' }}>
            <div className="container mt-4">
                {/* Tiêu đề trang */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 className="fw-bold text-dark mb-1">
                            <i className="bi bi-activity text-main-orange me-2"></i>
                            Báo cáo Phân tích Lộ trình
                        </h3>
                        <p className="text-muted small mb-0">Theo dõi tốc độ và đà tăng trưởng của từng mục tiêu học tập</p>
                    </div>
                    <Link to="/lo-trinh" className="btn btn-outline-secondary rounded-pill fw-bold px-4">
                        <i className="bi bi-arrow-left me-2"></i>Về danh sách
                    </Link>
                </div>

                {isLoading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-main-orange" role="status"></div>
                        <p className="mt-3 fw-bold text-muted">Đang trích xuất dữ liệu biểu đồ...</p>
                    </div>
                ) : roadmaps.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded shadow-sm border">
                        <i className="bi bi-journal-x text-muted opacity-25 d-block mb-3" style={{ fontSize: '4rem' }}></i>
                        <h5 className="text-muted fw-bold">Chưa có dữ liệu phân tích</h5>
                        <p className="text-muted">Bạn chưa tham gia lộ trình nào hoặc lộ trình chưa có hoạt động.</p>
                        <Link to="/lo-trinh" className="btn btn-main-orange mt-2">Khám phá Lộ trình</Link>
                    </div>
                ) : (
                    // Lặp qua từng lộ trình và in ra bộ biểu đồ tương ứng
                    roadmaps.map((rm) => (
                        <RoadmapChartGroup key={rm._id} sdk={sdk} roadmap={rm} />
                    ))
                )}
            </div>
        </main>
    );
};

export default TienDoLoTrinh;