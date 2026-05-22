import React, { useState, useEffect, useRef } from 'react';
import { fetchClient } from '../../utils/fetchClient';
import ChartsEmbedSDK from '@mongodb-js/charts-embed-dom';

const ThongKeThiThu = () => {
    const [ranking, setRanking] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [isLoadingRanking, setIsLoadingRanking] = useState(true); // FIX 3: Tách loading state
    const [isLoadingExams, setIsLoadingExams] = useState(true);     // FIX 3: Tách loading state

    // Tham chiếu cho Chart
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const sdk = useRef(null);

    // 1. Khởi tạo SDK Atlas Charts
    useEffect(() => {
        sdk.current = new ChartsEmbedSDK({
            baseUrl: 'https://charts.mongodb.com/charts-ie103_quanlyonthi_tudaica-dnifgsl',
        });
    }, []);

    // 2. Load dữ liệu ban đầu
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingRanking(true);
            setIsLoadingExams(true);
            try {
                // Lấy danh sách đề
                const resExams = await fetchClient('/api/dethithu');
                if (resExams.ok) {
                    const dataExams = await resExams.json();
                    setExams(dataExams.data || []);
                    if (dataExams.data?.length > 0) {
                        setSelectedExamId(dataExams.data[0]._id);
                    }
                }
            } catch (error) {
                console.error("Lỗi tải danh sách đề:", error);
            } finally {
                setIsLoadingExams(false);
            }

            try {
                // Lấy bảng xếp hạng
                const resRank = await fetchClient('/api/reports/bangxephang-thithu');
                if (resRank.ok) {
                    const dataRank = await resRank.json();
                    setRanking(dataRank);
                }
            } catch (error) {
                console.error("Lỗi tải bảng xếp hạng:", error);
            } finally {
                setIsLoadingRanking(false);
            }
        };
        loadInitialData();
    }, []);

    // 3. Render/Update biểu đồ phổ điểm khi selectedExamId thay đổi
    useEffect(() => {
        if (!sdk.current || !selectedExamId) return;

        const renderChart = async () => {
            // FIX 1: Kiểm tra chartRef.current TRƯỚC KHI làm bất cứ điều gì
            if (!chartRef.current) {
                console.error("chartRef hiện đang null, biểu đồ không có chỗ để vẽ!");
                return;
            }

            try {
                if (!chartInstance.current) {
                    console.log("Đang khởi tạo biểu đồ mới...");
                    chartInstance.current = sdk.current.createChart({
                        chartId: '5696c537-3de0-484b-998c-e2ffd50f0452',
                        filter: { "MaDeThi": { "$oid": selectedExamId } },
                        theme: 'light',
                        background: 'transparent'
                    });

                    await chartInstance.current.render(chartRef.current);
                    console.log("Biểu đồ đã render thành công");
                } else {
                    console.log("Đang cập nhật filter...");
                    await chartInstance.current.setFilter({ "MaDeThi": { "$oid": selectedExamId } });
                }
            } catch (err) {
                console.error("Lỗi từ SDK Charts:", err);
            }
        };

        renderChart();

        // FIX 2: Cleanup đúng cách — destroy instance và reset về null
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy?.();
                chartInstance.current = null;
            }
        };
    }, [selectedExamId]);

    // FIX 3: Không return sớm toàn bộ component — giữ DOM của chartRef luôn tồn tại
    return (
        <main className="container-fluid px-4 py-4 bg-light min-vh-100">
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold">
                        <i className="bi bi-graph-up-arrow me-2 text-main-orange"></i>
                        Thống Kê & Thứ Hạng
                    </h2>
                    <p className="text-muted">Phân tích kết quả thi thử và vinh danh những học sinh xuất sắc.</p>
                </div>
            </div>

            <div className="row g-4">
                {/* CỘT TRÁI: BẢNG XẾP HẠNG */}
                <div className="col-xl-5">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-trophy me-2 text-warning"></i>
                                Top 10 Chiến Binh Xuất Sắc
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            {/* FIX 3: Chỉ spinner riêng phần ranking, không ảnh hưởng phần chart */}
                            {isLoadingRanking ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-main-orange"></div>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Hạng</th>
                                                <th>Học sinh</th>
                                                <th className="text-center">Số bài thi</th>
                                                <th className="text-end pe-4">Điểm TB</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ranking.map((item, index) => (
                                                <tr key={item.MaHocSinh}>
                                                    <td className="ps-4">
                                                        {index === 0 ? <span className="badge bg-warning text-dark fs-6">1</span> :
                                                            index === 1 ? <span className="badge bg-secondary text-white fs-6">2</span> :
                                                                index === 2 ? <span className="badge bg-danger text-white fs-6">3</span> :
                                                                    <span className="text-muted fw-bold ms-2">{index + 1}</span>}
                                                    </td>
                                                    <td><div className="fw-bold">{item.HoTen}</div></td>
                                                    <td className="text-center">{item.TongSoBaiThi}</td>
                                                    <td className="text-end pe-4 fw-bold text-primary">{item.DiemTrungBinh}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {ranking.length === 0 && (
                                        <p className="text-center py-4 text-muted">Chưa có dữ liệu xếp hạng.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: PHỔ ĐIỂM (NHÚNG ATLAS CHARTS) */}
                <div className="col-xl-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-bar-chart-line me-2 text-primary"></i>
                                Phân Tích Phổ Điểm
                            </h5>
                            {/* FIX 3: Spinner riêng cho dropdown đề thi */}
                            {isLoadingExams ? (
                                <div className="spinner-border spinner-border-sm text-primary"></div>
                            ) : (
                                <select
                                    className="form-select form-select-sm w-auto shadow-none"
                                    value={selectedExamId}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                >
                                    {exams.map(ex => (
                                        <option key={ex._id} value={ex._id}>{ex.TenDeThi}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="card-body px-4 pb-4">
                            <p className="small text-muted mb-4">
                                Biểu đồ thể hiện số lượng học sinh đạt được trong từng khoảng điểm.
                            </p>

                            {/* FIX 3: DIV này luôn tồn tại trong DOM — chartRef không bao giờ bị null */}
                            <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>

                            <div className="mt-4 p-3 bg-light rounded-3">
                                <div className="row text-center">
                                    <div className="col-12">
                                        <div className="small text-muted">Số liệu được cập nhật từ hệ thống Atlas</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ThongKeThiThu;