import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient'; // Thêm import fetchClient

const QuanLyDeThi = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState('Đang kiểm duyệt'); 
    const [searchTerm, setSearchTerm] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 6;

    const fetchExams = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                status: activeTab 
            });

            // Sử dụng fetchClient, lược bỏ URL tuyệt đối và lấy Token thủ công
            const response = await fetchClient(`/api/dethithu?${params}`);

            if (response.ok) {
                const json = await response.json();
                setExams(json.data || []);
                setTotalItems(json.totalItems || 0);
                setTotalPages(json.totalPages || 1);
            }
        } catch (error) {
            console.error("Lỗi tải danh sách đề thi:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchTerm, activeTab]);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    const handleUpdateStatus = async (id, newStatus) => {
        let msg = "Xác nhận thực hiện thao tác này?";
        if (newStatus === 'Hoàn thiện') msg = "Xác nhận DUYỆT đề thi này?";
        if (newStatus === 'Đã từ chối') msg = "Xác nhận TỪ CHỐI đề thi này?";
        if (newStatus === 'Đang kiểm duyệt' && activeTab === 'Hoàn thiện') msg = "Xác nhận THU HỒI đề thi về trạng thái chờ duyệt?";
        if (newStatus === 'Đang kiểm duyệt' && activeTab === 'Đã từ chối') msg = "Xác nhận ĐƯA LẠI đề thi vào danh sách chờ duyệt?";

        if (!window.confirm(msg)) return;

        try {
            const response = await fetchClient(`/api/dethithu/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ TrangThai: newStatus })
            });

            if (response.ok) {
                // Kiểm tra nếu xóa phần tử duy nhất ở trang cuối thì quay về trang trước đó
                if (exams.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchExams();
                }
            } else {
                const errData = await response.json();
                alert(`Lỗi: ${errData.message || "Sai trạng thái"}`);
            }
        } catch (error) {
            alert("Có lỗi kết nối máy chủ!");
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
        if (endPage - startPage < maxPageDisplay - 1) startPage = Math.max(1, endPage - maxPageDisplay + 1);
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
                <h2 className="fw-bold text-dark mb-1">Kiểm duyệt Đề thi</h2>
                <p className="text-muted mb-0 small">Quản lý vòng đời đề thi: Duyệt mới, Thu hồi hoặc Khôi phục.</p>
            </div>

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

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-3">
                    <div className="input-group">
                        <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-search text-muted"></i></span>
                        <input 
                            type="text" 
                            className="form-control border-start-0 shadow-none bg-light" 
                            placeholder="Tìm tên đề thi..." 
                            value={searchTerm}
                            onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm overflow-hidden mb-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small text-uppercase">
                            <tr>
                                <th className="ps-4 py-3">Thông tin đề thi</th>
                                <th className="py-3">Môn học</th>
                                <th className="py-3 text-center">Số câu</th>
                                <th className="py-3">Thời gian</th>
                                <th className="py-3">Người tạo</th>
                                <th className="pe-4 py-3 text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-main-orange"></div></td></tr>
                            ) : exams.length > 0 ? (
                                exams.map((ex) => (
                                    <tr key={ex._id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-primary-subtle text-primary rounded p-2 me-3" style={{ minWidth: '40px', textAlign: 'center' }}>
                                                    <i className="bi bi-card-checklist fs-5"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{ex.TenDeThi}</div>
                                                    <div className="text-muted small">Mã: {ex._id.substring(18).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge bg-light text-dark border">{ex.MonHoc}</span></td>
                                        <td className="text-center"><span className="fw-bold text-primary">{ex.DanhSachCauHoi?.length || 0}</span></td>
                                        <td><span className="fw-medium">{ex.ThoiGianLamBai || ex.ThoiGianGioiHan}</span> <span className="small text-muted">phút</span></td>
                                        <td>
                                            <div className="small fw-medium text-dark">{ex.MaGVThietKe?.HoTen || ex.MaGVPhuTrach?.HoTen || 'Admin'}</div>
                                            <div className="text-muted" style={{fontSize: '0.7rem'}}>{new Date(ex.NgayTao).toLocaleDateString('vi-VN')}</div>
                                        </td>
                                        <td className="pe-4 text-end">
                                            <div className="btn-group shadow-sm">
                                                <button className="btn btn-sm btn-light border text-primary" onClick={() => navigate(`/phong-luyen/${ex._id}`)} title="Xem chi tiết">
                                                    <i className="bi bi-eye"></i>
                                                </button>

                                                {activeTab === 'Đang kiểm duyệt' && (
                                                    <>
                                                        <button className="btn btn-sm btn-light border text-success fw-bold" onClick={() => handleUpdateStatus(ex._id, 'Hoàn thiện')}>
                                                            <i className="bi bi-check-lg me-1"></i> Duyệt
                                                        </button>
                                                        <button className="btn btn-sm btn-light border text-danger fw-bold" onClick={() => handleUpdateStatus(ex._id, 'Đã từ chối')}>
                                                            <i className="bi bi-x-lg me-1"></i> Từ chối
                                                        </button>
                                                    </>
                                                )}

                                                {activeTab === 'Hoàn thiện' && (
                                                    <button className="btn btn-sm btn-light border text-warning fw-bold" onClick={() => handleUpdateStatus(ex._id, 'Đang kiểm duyệt')}>
                                                        <i className="bi bi-arrow-counterclockwise me-1"></i> Thu hồi
                                                    </button>
                                                )}

                                                {activeTab === 'Đã từ chối' && (
                                                    <button className="btn btn-sm btn-light border text-info fw-bold" onClick={() => handleUpdateStatus(ex._id, 'Đang kiểm duyệt')}>
                                                        <i className="bi bi-arrow-left-right me-1"></i> Khôi phục
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center py-5 text-muted">Không có dữ liệu đề thi nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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

export default QuanLyDeThi;