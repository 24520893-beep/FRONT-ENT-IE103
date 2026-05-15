import React, { useState, useEffect } from 'react';
import { fetchClient } from '../../utils/fetchClient';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const ThongKeThiThu = () => {
    const [ranking, setRanking] = useState([]);
    const [scoreDist, setScoreDist] = useState([]);
    const [exams, setExams] = useState([]); // Danh sách đề để lọc phổ điểm
    const [selectedExamId, setSelectedExamId] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // 1. Lấy danh sách đề thi trước để có ID lọc phổ điểm
                const resExams = await fetchClient('/api/dethithu');
                if (resExams.ok) {
                    const dataExams = await resExams.json();
                    setExams(dataExams.data || []);
                    if (dataExams.data?.length > 0) {
                        setSelectedExamId(dataExams.data[0]._id);
                    }
                }

                // 2. Lấy bảng xếp hạng (View_BangXepHangThiThu)
                const resRank = await fetchClient('/api/reports/bangxephang-thithu');
                if (resRank.ok) {
                    const dataRank = await resRank.json();
                    setRanking(dataRank);
                }
            } catch (error) {
                console.error("Lỗi tải dữ liệu thống kê:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // 3. Lấy phổ điểm khi thay đổi đề thi (View_PhoDiemThiThu)
    useEffect(() => {
        if (!selectedExamId) return;

        const fetchDist = async () => {
            try {
                const res = await fetchClient(`/api/reports/phodiem-thithu?MaDeThi=${selectedExamId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Sắp xếp lại các khoảng điểm theo thứ tự từ thấp đến cao
                    const sortedData = data.sort((a, b) => {
                        const order = ["[0 - 1)", "[1 - 2)", "[2 - 3)", "[3 - 4)", "[4 - 5)", "[5 - 6)", "[6 - 7)", "[7 - 8)", "[8 - 9)", "[9 - 10]"];
                        return order.indexOf(a.PhanLoaiDiem) - order.indexOf(b.PhanLoaiDiem);
                    });
                    setScoreDist(sortedData);
                }
            } catch (error) {
                console.error("Lỗi tải phổ điểm:", error);
            }
        };
        fetchDist();
    }, [selectedExamId]);

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-main-orange"></div></div>;

    return (
        <main className="container-fluid px-4 py-4 bg-light min-vh-100">
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold"><i className="bi bi-graph-up-arrow me-2 text-main-orange"></i>Thống Kê & Thứ Hạng</h2>
                    <p className="text-muted">Phân tích kết quả thi thử và vinh danh những học sinh xuất sắc.</p>
                </div>
            </div>

            <div className="row g-4">
                {/* CỘT TRÁI: BẢNG XẾP HẠNG (VIEW_BANGXEPHANG) */}
                <div className="col-xl-5">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0"><i className="bi bi-trophy me-2 text-warning"></i>Top 10 Chiến Binh Xuất Sắc</h5>
                        </div>
                        <div className="card-body p-0">
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
                                                <td>
                                                    <div className="fw-bold">{item.HoTen}</div>
                                                </td>
                                                <td className="text-center">{item.TongSoBaiThi}</td>
                                                <td className="text-end pe-4 fw-bold text-primary">{item.DiemTrungBinh}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {ranking.length === 0 && <p className="text-center py-4 text-muted">Chưa có dữ liệu xếp hạng.</p>}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: PHỔ ĐIỂM (VIEW_PHODIEM) */}
                <div className="col-xl-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <h5 className="fw-bold mb-0"><i className="bi bi-bar-chart-line me-2 text-primary"></i>Phân Tích Phổ Điểm</h5>
                            <select 
                                className="form-select form-select-sm w-auto shadow-none"
                                value={selectedExamId}
                                onChange={(e) => setSelectedExamId(e.target.value)}
                            >
                                {exams.map(ex => (
                                    <option key={ex._id} value={ex._id}>{ex.TenDeThi}</option>
                                ))}
                            </select>
                        </div>
                        <div className="card-body px-4 pb-4">
                            <p className="small text-muted mb-4">Biểu đồ thể hiện số lượng học sinh đạt được trong từng khoảng điểm.</p>
                            
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <BarChart data={scoreDist} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="PhanLoaiDiem" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{fill: '#f8f9fa'}}
                                            contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}}
                                        />
                                        <Bar dataKey="SoLuongHocSinh" radius={[4, 4, 0, 0]} name="Số lượng học sinh">
                                            {scoreDist.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.SoLuongHocSinh > 5 ? '#fd7e14' : '#6c757d'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-4 p-3 bg-light rounded-3">
                                <div className="row text-center">
                                    <div className="col-4 border-end">
                                        <div className="small text-muted">Tổng thí sinh</div>
                                        <div className="fw-bold fs-5">
                                            {scoreDist.reduce((acc, curr) => acc + curr.SoLuongHocSinh, 0)}
                                        </div>
                                    </div>
                                    <div className="col-4 border-end">
                                        <div className="small text-muted">Điểm cao nhất</div>
                                        <div className="fw-bold fs-5 text-success">10.0</div>
                                    </div>
                                    <div className="col-4">
                                        <div className="small text-muted">Độ khó đề</div>
                                        <div className="fw-bold fs-5 text-primary">Trung bình</div>
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