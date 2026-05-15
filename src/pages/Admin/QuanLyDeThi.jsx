import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient'; 

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

    // === STATE QUẢN LÝ OVERLAY XÁC NHẬN ===
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        id: null,
        newStatus: null,
        message: '',
        type: 'info' // success, danger, warning, info
    });

    const fetchExams = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                status: activeTab 
            });

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

    // BƯỚC 1: HÀM KÍCH HOẠT OVERLAY
    const openConfirmModal = (id, newStatus) => {
        let msg = "Xác nhận thực hiện thao tác này?";
        let type = 'info';

        if (newStatus === 'Hoàn thiện') {
            msg = "Xác nhận DUYỆT đề thi này và xuất bản hệ thống?";
            type = 'success';
        }
        if (newStatus === 'Đã từ chối') {
            msg = "Xác nhận TỪ CHỐI đề thi này?";
            type = 'danger';
        }
        if (newStatus === 'Đang kiểm duyệt' && activeTab === 'Hoàn thiện') {
            msg = "Xác nhận THU HỒI đề thi này về trạng thái chờ duyệt?";
            type = 'warning';
        }
        if (newStatus === 'Đang kiểm duyệt' && activeTab === 'Đã từ chối') {
            msg = "Xác nhận KHÔI PHỤC đề thi này vào danh sách chờ duyệt?";
            type = 'info';
        }

        setConfirmModal({ isOpen: true, id, newStatus, message: msg, type });
    };

    // BƯỚC 2: HÀM GỌI API KHI ĐÃ XÁC NHẬN
    const executeUpdateStatus = async () => {
        const { id, newStatus } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false }); // Đóng modal

        try {
            const response = await fetchClient(`/api/dethithu/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ TrangThai: newStatus })
            });

            if (response.ok) {
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
        setCurrentPage(1); 
    };

    return (
        <>
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
                                                    <button 
                                                        className="btn btn-sm btn-light border text-primary" 
                                                        onClick={() => window.open(`/phong-luyen/${ex._id}`, '_blank')} 
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>

                                                    {activeTab === 'Đang kiểm duyệt' && (
                                                        <>
                                                            <button className="btn btn-sm btn-light border text-success fw-bold" onClick={() => openConfirmModal(ex._id, 'Hoàn thiện')} title="Duyệt">
                                                                <i className="bi bi-check-lg me-1"></i> Duyệt
                                                            </button>
                                                            <button className="btn btn-sm btn-light border text-danger fw-bold" onClick={() => openConfirmModal(ex._id, 'Đã từ chối')} title="Từ chối">
                                                                <i className="bi bi-x-lg me-1"></i> Từ chối
                                                            </button>
                                                        </>
                                                    )}

                                                    {activeTab === 'Hoàn thiện' && (
                                                        <button className="btn btn-sm btn-light border text-warning fw-bold" onClick={() => openConfirmModal(ex._id, 'Đang kiểm duyệt')} title="Thu hồi">
                                                            <i className="bi bi-arrow-counterclockwise me-1"></i> Thu hồi
                                                        </button>
                                                    )}

                                                    {activeTab === 'Đã từ chối' && (
                                                        <button className="btn btn-sm btn-light border text-info fw-bold" onClick={() => openConfirmModal(ex._id, 'Đang kiểm duyệt')} title="Khôi phục">
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
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 px-3 fw-bold text-main-orange bg-transparent" onClick={() => paginate(currentPage - 1)}>
                                        <i className="bi bi-chevron-double-left"></i>
                                    </button>
                                </li>
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
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 px-3 fw-bold text-main-orange bg-transparent" onClick={() => paginate(currentPage + 1)}>
                                        <i className="bi bi-chevron-double-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>

            {/* === GIAO DIỆN OVERLAY (MODAL) XÁC NHẬN THAO TÁC === */}
            {confirmModal.isOpen && (
                <div 
                    className="d-flex align-items-center justify-content-center" 
                    style={{
                        position: 'fixed', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.5)', 
                        zIndex: 9999,
                        backdropFilter: 'blur(3px)'
                    }}
                >
                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '420px', width: '90%' }}>
                        
                        {/* Icon thay đổi theo hành động */}
                        {confirmModal.type === 'success' && <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>}
                        {confirmModal.type === 'danger' && <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '4rem' }}></i>}
                        {confirmModal.type === 'warning' && <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '4rem' }}></i>}
                        {confirmModal.type === 'info' && <i className="bi bi-arrow-left-right text-info" style={{ fontSize: '4rem' }}></i>}
                        
                        <h4 className="fw-bold mt-3 text-dark">Xác nhận thao tác</h4>
                        <p className="text-muted mt-2 fs-6 mb-4">{confirmModal.message}</p>
                        
                        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                            <button 
                                className="btn btn-light border fw-bold rounded-pill px-4 py-2" 
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                className={`btn btn-${confirmModal.type === 'warning' ? 'warning text-dark' : confirmModal.type} fw-bold rounded-pill px-4 py-2 text-white`}
                                onClick={executeUpdateStatus}
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuanLyDeThi;