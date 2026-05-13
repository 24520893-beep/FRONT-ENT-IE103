import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient'; // Thêm import fetchClient

const QuanLyLoTrinh = () => {
    const navigate = useNavigate();
    const [paths, setPaths] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // STATE ĐIỀU KHIỂN & BỘ LỌC
    const [activeTab, setActiveTab] = useState('Đang kiểm duyệt');
    const [searchTerm, setSearchTerm] = useState('');

    // PHÂN TRANG (Đồng bộ với Server)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 6;

    const fetchPaths = useCallback(async () => {
        setIsLoading(true);
        try {
            // Đẩy bộ lọc và phân trang xuống Backend
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage, 
                search: searchTerm,
                status: activeTab 
            });

            // Sử dụng fetchClient tự động nối URL và gửi Token
            const response = await fetchClient(`/api/lotrinhhoctap?${params}`);

            if (response.ok) {
                const json = await response.json();
                setPaths(json.data || []);
                setTotalPages(json.totalPages || 1);
            }
        } catch (error) { 
            console.error("Lỗi tải lộ trình:", error); 
        } finally { 
            setIsLoading(false); 
        }
    }, [currentPage, activeTab, searchTerm]);

    useEffect(() => { 
        fetchPaths(); 
    }, [fetchPaths]);

    const handleUpdateStatus = async (id, newStatus) => {
        let msg = "Xác nhận thực hiện thao tác này?";
        if (newStatus === 'Hoàn thiện') msg = "Xác nhận DUYỆT lộ trình này?";
        if (newStatus === 'Đã từ chối') msg = "Xác nhận TỪ CHỐI lộ trình này?";
        if (newStatus === 'Đang kiểm duyệt' && activeTab === 'Hoàn thiện') msg = "Xác nhận THU HỒI lộ trình về trạng thái chờ duyệt?";
        if (newStatus === 'Đang kiểm duyệt' && activeTab === 'Đã từ chối') msg = "Xác nhận ĐƯA LẠI lộ trình vào danh sách chờ duyệt?";

        if (!window.confirm(msg)) return;
        
        try {
            // Sử dụng fetchClient
            const res = await fetchClient(`/api/lotrinhhoctap/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ TrangThai: newStatus }) 
            });

            if (res.ok) {
                if (paths.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchPaths();
                }
            } else {
                const errData = await res.json();
                alert(`Lỗi cập nhật: ${errData.message || "Kiểm tra lại Enum Database"}`);
            }
        } catch (error) {
            alert("Lỗi kết nối máy chủ!");
        }
    };

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const maxPageDisplay = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxPageDisplay - 1);
        if (endPage - startPage < maxPageDisplay - 1) {
            startPage = Math.max(1, endPage - maxPageDisplay + 1);
        }
        const pages = [];
        for (let i = startPage; i <= endPage; i++) if (i > 0) pages.push(i);
        return pages;
    };

    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1); // Reset về trang 1
    };

    return (
        <div className="container-fluid py-4">
            <div className="mb-4">
                <h2 className="fw-bold text-dark mb-1">Quản lý Lộ trình</h2>
                <p className="text-muted mb-0 small">Phê duyệt, thu hồi và điều phối các lộ trình học tập hệ thống.</p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white p-2 rounded shadow-sm d-inline-flex mb-4">
                {[
                    { id: 'Đang kiểm duyệt', label: 'Chờ duyệt', icon: 'bi-hourglass-split', color: 'warning' },
                    { id: 'Hoàn thiện', label: 'Đã xuất bản', icon: 'bi-check-circle', color: 'success' },
                    { id: 'Đã từ chối', label: 'Bị từ chối', icon: 'bi-x-circle', color: 'danger' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-link border-0 px-4 py-2 rounded fw-bold transition-all ${
                            activeTab === tab.id 
                            ? `bg-${tab.color} ${tab.color === 'warning' ? 'text-dark' : 'text-white'}` 
                            : 'text-muted bg-transparent'
                        }`}
                        onClick={() => handleFilterChange(setActiveTab, tab.id)}
                    >
                        <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                    </button>
                ))}
            </div>

            {/* Thanh tìm kiếm */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-3">
                    <div className="input-group">
                        <span className="input-group-text bg-transparent border-end-0">
                            <i className="bi bi-search text-muted"></i>
                        </span>
                        <input 
                            type="text" 
                            className="form-control border-start-0 bg-light shadow-none" 
                            placeholder="Tìm kiếm tên lộ trình..." 
                            value={searchTerm}
                            onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Bảng danh sách */}
            <div className="card border-0 shadow-sm overflow-hidden mb-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small text-uppercase">
                            <tr>
                                <th className="ps-4 py-3">Tên lộ trình</th>
                                <th className="py-3">Môn học</th>
                                <th className="py-3 text-center">Số chặng</th>
                                <th className="py-3">Người tạo</th>
                                <th className="py-3">Ngày tạo</th>
                                <th className="pe-4 py-3 text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        <div className="spinner-border text-main-orange"></div>
                                    </td>
                                </tr>
                            ) : paths.length > 0 ? (
                                paths.map((p) => (
                                    <tr key={p._id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-primary-subtle text-primary rounded p-2 me-3" style={{ minWidth: '40px', textAlign: 'center' }}>
                                                    <i className="bi bi-map-fill"></i>
                                                </div>
                                                <div className="fw-bold text-dark">{p.TenLoTrinh}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border fw-normal">
                                                <i className="bi bi-journal-bookmark-fill text-main-orange me-1"></i>
                                                {p.MonHoc}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className="fw-bold text-primary">
                                                {p.DanhSachNhiemVu?.length || p.CacBuoc?.length || 0}
                                            </span>
                                            <span className="text-muted small ms-1">chặng</span>
                                        </td>
                                        <td>
                                            <div className="small fw-medium">{p.MaGVPhuTrach?.HoTen || 'Quản trị viên'}</div>
                                        </td>
                                        <td className="text-muted small">
                                            <i className="bi bi-calendar3 me-1"></i>
                                            {new Date(p.NgayTao).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="pe-4 text-end">
                                            <div className="btn-group shadow-sm">
                                                <button className="btn btn-sm btn-light border text-primary" title="Xem chi tiết" onClick={() => navigate(`/lo-trinh/${p._id}`)}>
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                                
                                                {activeTab === 'Đang kiểm duyệt' && (
                                                    <>
                                                        <button className="btn btn-sm btn-light border text-success fw-bold" onClick={() => handleUpdateStatus(p._id, 'Hoàn thiện')}>
                                                            <i className="bi bi-check-lg me-1"></i> Duyệt
                                                        </button>
                                                        <button className="btn btn-sm btn-light border text-danger fw-bold" onClick={() => handleUpdateStatus(p._id, 'Đã từ chối')}>
                                                            <i className="bi bi-x-lg me-1"></i> Từ chối
                                                        </button>
                                                    </>
                                                )}

                                                {activeTab === 'Hoàn thiện' && (
                                                    <button className="btn btn-sm btn-light border text-warning fw-bold" onClick={() => handleUpdateStatus(p._id, 'Đang kiểm duyệt')}>
                                                        <i className="bi bi-arrow-counterclockwise me-1"></i> Thu hồi
                                                    </button>
                                                )}

                                                {activeTab === 'Đã từ chối' && (
                                                    <button className="btn btn-sm btn-light border text-info fw-bold" onClick={() => handleUpdateStatus(p._id, 'Đang kiểm duyệt')}>
                                                        <i className="bi bi-arrow-left-right me-1"></i> Khôi phục
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox fs-2 d-block mb-2 opacity-25"></i>
                                        Không tìm thấy lộ trình nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="d-flex flex-column align-items-center mt-4">
                    <nav>
                        <ul className="pagination shadow-sm rounded-pill overflow-hidden border-0 bg-white p-1">
                            {getPageNumbers().map(num => (
                                <li key={num} className={`page-item ${currentPage === num ? 'active' : ''}`}>
                                    <button 
                                        className={`page-link border-0 px-3 mx-1 rounded-circle transition-all ${currentPage === num ? 'bg-main-orange text-white' : 'text-dark bg-transparent'}`}
                                        onClick={() => paginate(num)}
                                        style={currentPage === num ? { backgroundColor: '#ff6b00', fontWeight: 'bold' } : {}}
                                    >
                                        {num}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default QuanLyLoTrinh;