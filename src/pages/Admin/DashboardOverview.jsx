import React, { useState, useEffect, useRef } from 'react';
import ChartsEmbedSDK from '@mongodb-js/charts-embed-dom';
import styles from './AdminDashboard.module.css';

const DashboardOverview = () => {
    // Đã sửa: Thay thế useState bằng useRef để lưu trữ instance của biểu đồ, tránh re-render rò rỉ bộ nhớ
    const growthChartRefInstance = useRef(null);
    const loadChartRefInstance = useRef(null);

    // Thời gian mặc định
    const currentYearStr = new Date().getFullYear().toString();
    const [selectedYear, setSelectedYear] = useState(currentYearStr); 
    const [loadYear, setLoadYear] = useState(currentYearStr);
    const [loadWeek, setLoadWeek] = useState('1');

    // Refs DOM biểu đồ
    const kpiTrafficRef = useRef(null);
    const kpiAlertRef = useRef(null);
    const chartGrowthRef = useRef(null);
    const chartRoleRef = useRef(null);
    const chartLoadRef = useRef(null);

    useEffect(() => {
        const sdk = new ChartsEmbedSDK({
            baseUrl: 'https://charts.mongodb.com/charts-ie103_quanlyonthi_tudaica-dnifgsl' 
        });

        const kpiTraffic = sdk.createChart({ chartId: 'b0d819a6-92f8-42f2-8bf0-028d78a8adb4', height: '120px' });
        const kpiAlert = sdk.createChart({ chartId: '0dd3258d-0f0e-4406-b40e-53fc23c27e32', height: '120px' });
        const chartRole = sdk.createChart({ chartId: '66f1e02f-8dc1-44dd-8e99-c0632983d1d3', height: '200px' });
        const chartGrowthInstance = sdk.createChart({ chartId: '9648ff60-cf8d-413e-a526-8f4c13a6be2c', height: '350px' });
        const chartLoadInstance = sdk.createChart({ chartId: '78b1ddec-ea09-4c53-8e65-381a742291ae', height: '400px' });

        [kpiTrafficRef, kpiAlertRef, chartRoleRef, chartGrowthRef, chartLoadRef].forEach(ref => {
            if (ref.current) ref.current.innerHTML = '';
        });

        kpiTraffic.render(kpiTrafficRef.current);
        kpiAlert.render(kpiAlertRef.current);
        chartRole.render(chartRoleRef.current);
        
        // Gán instance vào ref sau khi render xong
        chartGrowthInstance.render(chartGrowthRef.current).then(() => {
            growthChartRefInstance.current = chartGrowthInstance;
        });
        chartLoadInstance.render(chartLoadRef.current).then(() => {
            loadChartRefInstance.current = chartLoadInstance;
        });
    }, []);

    // Filter Logic: Đã bỏ chart khỏi dependency array, chỉ dựa vào sự thay đổi của User Input (selectedYear)
    useEffect(() => {
        const chart = growthChartRefInstance.current;
        if (chart) {
            if (selectedYear === 'all') {
                chart.setFilter({});
            } else {
                const start = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
                const end = new Date(`${parseInt(selectedYear) + 1}-01-01T00:00:00.000Z`);
                chart.setFilter({ NgayTao: { $gte: start, $lt: end } });
            }
        }
    }, [selectedYear]);

    useEffect(() => {
        const chart = loadChartRefInstance.current;
        if (chart) {
            const janFirst = new Date(parseInt(loadYear), 0, 1);
            const daysOffset = (parseInt(loadWeek) - 1) * 7;
            const startOfWeek = new Date(janFirst.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
            chart.setFilter({ NgayTao: { $gte: startOfWeek, $lt: endOfWeek } });
        }
    }, [loadYear, loadWeek]);

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Tổng quan hệ thống</h2>
                    <p className="text-muted mb-0 small">Giám sát các chỉ số vận hành năm {currentYearStr}.</p>
                </div>
                <button className="btn btn-outline-primary btn-sm fw-bold shadow-sm px-3">
                    <i className="bi bi-file-earmark-spreadsheet me-2"></i>Xuất báo cáo
                </button>
            </div>

            {/* HÀNG 1 */}
            <div className="row g-4 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 p-3">
                        <h6 className="text-muted fw-bold mb-3 small text-uppercase">Số lượng người dùng</h6>
                        <div ref={kpiTrafficRef}></div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 p-3">
                        <h6 className="text-muted fw-bold mb-3 small text-uppercase">Số lượng học liệu chờ duyệt</h6>
                        <div ref={kpiAlertRef}></div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 p-3">
                        <h6 className="text-muted fw-bold mb-3 small text-uppercase">CƠ CẤU VAI TRÒ</h6>
                        <div ref={chartRoleRef}></div>
                    </div>
                </div>
            </div>

            {/* HÀNG 2 */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className={`card border-0 shadow-sm ${styles.chartCard}`}>
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0">Tăng trưởng người dùng năm {selectedYear !== 'all' ? selectedYear : ''}</h5>
                                <select 
                                    className="form-select form-select-sm shadow-none w-auto border-orange" 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    <option value={currentYearStr}>Năm hiện tại ({currentYearStr})</option>
                                    <option value="2025">Năm 2025</option>
                                    <option value="all">Tất cả các năm</option>
                                </select>
                            </div>
                            <div ref={chartGrowthRef}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HÀNG 3 */}
            <div className="row g-4 mb-5">
                <div className="col-12">
                    <div className={`card border-0 shadow-sm ${styles.chartCard}`}>
                        <div className="card-body p-4">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                                <div>
                                    <h5 className="fw-bold mb-1">Lưu lượng làm bài thi</h5>
                                    <p className="text-muted small mb-0">Dữ liệu chi tiết tuần {loadWeek} năm {loadYear}</p>
                                </div>
                                <div className="mt-3 mt-md-0 d-flex gap-2">
                                    <select className="form-select form-select-sm shadow-none border-orange" value={loadYear} onChange={(e) => setLoadYear(e.target.value)}>
                                        <option value="2026">2026</option>
                                        <option value="2025">2025</option>
                                    </select>
                                    <select className="form-select form-select-sm shadow-none border-orange" value={loadWeek} onChange={(e) => setLoadWeek(e.target.value)}>
                                        {[...Array(52)].map((_, i) => (
                                            <option key={i+1} value={i+1}>Tuần {i+1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div ref={chartLoadRef}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;