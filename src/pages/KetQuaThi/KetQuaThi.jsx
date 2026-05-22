import React, { useState, useEffect, useCallback } from 'react';
import { fetchClient } from '../../utils/fetchClient';
import styles from './KetQuaThi.module.css';

const KetQuaThi = () => {
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUserRole(JSON.parse(savedUser).VaiTro);
    }, []);

    const fetchResults = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetchClient(`/api/ketquathithu?page=${currentPage}&limit=${itemsPerPage}`);
            if (response.ok) {
                const json = await response.json();
                setResults(json.data || []);
                setTotalPages(json.totalPages || 1);
            }
        } catch (error) {
            console.error("Lỗi tải kết quả:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage]);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    const getScoreBadgeClass = (score) => {
        if (score >= 8) return 'bg-success';
        if (score >= 5) return 'bg-warning text-dark';
        return 'bg-danger';
    };

    return (
        <main className={`container py-5 ${styles.pageContainer}`} style={{ marginTop: '70px', minHeight: '85vh' }}>
            <div className="mb-4">
                <h2 className="fw-bold text-main-orange mb-1">
                    <i className="bi bi-clipboard2-data-fill me-2"></i>Kết quả Bài thi
                </h2>
                <p className="text-muted">
                    {userRole === 'HocSinh' ? "Lịch sử nỗ lực và quá trình thăng tiến của bạn." : "Quản lý kết quả làm bài của học sinh toàn hệ thống."}
                </p>
            </div>

            <div className={`card ${styles.resultCard}`}>
                <div className={`table-responsive ${styles.tableWrapper}`}>
                    <table className={`table align-middle ${styles.tableCustom}`}>
                        <thead>
                            <tr>
                                <th className="ps-4 py-3" style={{ minWidth: '200px' }}>Đề thi / Môn học</th>
                                {userRole !== 'HocSinh' && <th className="py-3" style={{ minWidth: '180px' }}>Thí sinh</th>}
                                <th className="py-3 text-center" style={{ minWidth: '150px' }}>Điểm số</th>
                                <th className="py-3 text-center" style={{ minWidth: '120px' }}>Ngày nộp</th>
                                <th className="pe-4 py-3 text-end" style={{ minWidth: '140px' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={userRole !== 'HocSinh' ? "5" : "4"} className="text-center py-5">
                                        <div className="spinner-border text-main-orange"></div>
                                    </td>
                                </tr>
                            ) : results.length > 0 ? (
                                results.map((item) => (
                                    <tr key={item._id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-dark">{item.MaDeThi?.TenDeThi || "Đề thi đã bị xóa"}</div>
                                            
                                            {/* ĐÃ CHỈNH SỬA TẠI ĐÂY: Hiển thị Đánh giá năng lực nếu không có MonHoc */}
                                            <span className={`badge border fw-normal mt-1 ${item.MaDeThi?.MonHoc ? 'bg-light text-muted' : 'bg-primary-subtle text-primary border-primary-subtle'}`}>
                                                {item.MaDeThi?.MonHoc ? item.MaDeThi.MonHoc : 'Đánh giá năng lực'}
                                            </span>
                                        </td>
                                        {userRole !== 'HocSinh' && (
                                            <td>
                                                <div className="small fw-bold">{item.MaHocSinh?.HoTen}</div>
                                                <div className="text-muted" style={{ fontSize: '11px' }}>{item.MaHocSinh?.Email}</div>
                                            </td>
                                        )}
                                        <td className="text-center">
                                            <span className={`badge ${styles.scoreBadge} ${getScoreBadgeClass(item.DiemSo)}`}>
                                                {item.DiemSo} / 10
                                            </span>
                                        </td>
                                        <td className="text-center text-muted small">
                                            {new Date(item.NgayTao).toLocaleDateString('vi-VN')}
                                            <div style={{ fontSize: '10px' }}>{new Date(item.NgayTao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="pe-4 text-end">
                                            <button 
                                                className="btn btn-sm btn-main-orange rounded-pill px-3 fw-bold text-nowrap"
                                                onClick={() => window.open(`/ket-qua-thi/${item._id}`, '_blank')}
                                            >
                                                Xem bài thi
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={userRole !== 'HocSinh' ? "5" : "4"} className={styles.emptyState}>
                                        <i className={`bi bi-inbox ${styles.emptyIcon}`}></i>
                                        <p className="text-muted">Không có kết quả bài thi nào.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                    <nav>
                        <ul className={`pagination ${styles.paginationCustom}`}>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className={`page-link ${styles.pageLink}`} onClick={() => setCurrentPage(currentPage - 1)}>Trước</button>
                            </li>
                            {[...Array(totalPages)].map((_, i) => (
                                <li key={i+1} className="page-item">
                                    <button 
                                        className={`page-link ${styles.pageLink} ${currentPage === i+1 ? styles.pageLinkActive : ''}`}
                                        onClick={() => setCurrentPage(i+1)}
                                    >
                                        {i+1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className={`page-link ${styles.pageLink}`} onClick={() => setCurrentPage(currentPage + 1)}>Sau</button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </main>
    );
};

export default KetQuaThi;