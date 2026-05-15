import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient'; 

const QuanLyCauHoi = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // STATE ĐIỀU KHIỂN & BỘ LỌC
    const [activeTab, setActiveTab] = useState('Đang kiểm duyệt');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');

    // PHÂN TRANG: Đồng bộ với Server
    const [currentPage, setCurrentPage] = useState(1);
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

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage, 
                search: searchTerm,
                status: activeTab,
                difficulty: filterDifficulty === 'all' ? 'Tất cả' : filterDifficulty
            });

            const response = await fetchClient(`/api/cauhoi?${params}`);
            
            if (response.ok) {
                const json = await response.json();
                setQuestions(json.data || []);
                setTotalPages(json.totalPages || 1);
            }
        } catch (error) { 
            console.error("Lỗi tải ngân hàng câu hỏi:", error); 
        } finally { 
            setIsLoading(false); 
        }
    }, [currentPage, activeTab, filterDifficulty, searchTerm]);

    useEffect(() => { 
        fetchQuestions(); 
    }, [fetchQuestions]);

    // BƯỚC 1: HÀM KÍCH HOẠT OVERLAY
    const openConfirmModal = (id, newStatus) => {
        let msg = "Xác nhận thực hiện thao tác này?";
        let type = 'info';

        if (newStatus === 'Hoàn thiện') {
            msg = "Bạn có chắc chắn muốn DUYỆT và xuất bản câu hỏi này vào ngân hàng?";
            type = 'success';
        }
        if (newStatus === 'Đã từ chối') {
            msg = "Bạn có chắc chắn muốn TỪ CHỐI câu hỏi này? Câu hỏi sẽ bị trả về.";
            type = 'danger';
        }
        if (newStatus === 'Đang kiểm duyệt' && activeTab === 'Hoàn thiện') {
            msg = "Xác nhận THU HỒI câu hỏi này về trạng thái chờ duyệt?";
            type = 'warning';
        }
        if (newStatus === 'Đang kiểm duyệt' && activeTab === 'Đã từ chối') {
            msg = "Xác nhận KHÔI PHỤC câu hỏi này vào danh sách chờ duyệt?";
            type = 'info';
        }

        setConfirmModal({ isOpen: true, id, newStatus, message: msg, type });
    };

    // BƯỚC 2: HÀM GỌI API KHI ĐÃ XÁC NHẬN
    const executeUpdateStatus = async () => {
        const { id, newStatus } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false }); // Đóng modal
        
        try {
            const response = await fetchClient(`/api/cauhoi/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ TrangThai: newStatus })
            });

            if (response.ok) {
                if (questions.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchQuestions();
                }
            } else {
                const errData = await response.json();
                alert(`Lỗi: ${errData.message || "Không thể cập nhật trạng thái"}`);
            }
        } catch (error) {
            alert("Có lỗi kết nối với máy chủ!");
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

    const getDifficultyBadge = (level) => {
        switch(level) {
            case 'Khó': 
            case 'Vận dụng cao': return 'bg-danger-subtle text-danger border-danger';
            case 'Trung bình': 
            case 'Vận dụng':
            case 'Thông hiểu': return 'bg-warning-subtle text-warning-emphasis border-warning';
            default: return 'bg-info-subtle text-info-emphasis border-info';
        }
    };

    return (
        <>
            <div className="container-fluid py-4">
                <div className="mb-4">
                    <h2 className="fw-bold text-dark mb-1">Ngân hàng Câu hỏi</h2>
                    <p className="text-muted mb-0 small">Kiểm duyệt, quản lý vòng đời và điều phối kho câu hỏi trắc nghiệm, tự luận.</p>
                </div>

                {/* Điều hướng Tab */}
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

                {/* Bộ lọc và Tìm kiếm */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-3 d-flex gap-3">
                        <div className="input-group flex-grow-1">
                            <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-search text-muted"></i></span>
                            <input 
                                type="text" 
                                className="form-control border-start-0 bg-light shadow-none" 
                                placeholder="Tìm kiếm nội dung câu hỏi..." 
                                value={searchTerm}
                                onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)} 
                            />
                        </div>
                        <select 
                            className="form-select w-auto shadow-none bg-light fw-medium" 
                            value={filterDifficulty}
                            onChange={(e) => handleFilterChange(setFilterDifficulty, e.target.value)}
                        >
                            <option value="all">Tất cả độ khó</option>
                            <option value="Nhận biết">Nhận biết</option>
                            <option value="Thông hiểu">Thông hiểu</option>
                            <option value="Vận dụng">Vận dụng</option>
                            <option value="Vận dụng cao">Vận dụng cao</option>
                        </select>
                    </div>
                </div>

                {/* Bảng danh sách */}
                <div className="card border-0 shadow-sm overflow-hidden mb-4">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-muted small text-uppercase">
                                <tr>
                                    <th className="ps-4 py-3" style={{ width: '45%' }}>Nội dung câu hỏi</th>
                                    <th className="py-3">Môn học</th>
                                    <th className="py-3">Độ khó</th>
                                    <th className="py-3">Loại câu</th>
                                    <th className="pe-4 py-3 text-end">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <div className="spinner-border text-main-orange"></div>
                                        </td>
                                    </tr>
                                ) : questions.length > 0 ? (
                                    questions.map((q) => (
                                        <tr key={q._id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary-subtle text-primary rounded p-2 me-3" style={{ minWidth: '40px', textAlign: 'center' }}>
                                                        <i className="bi bi-patch-question-fill"></i>
                                                    </div>
                                                    <div className="text-dark text-truncate-2 small fw-medium" title={q.NoiDungCauHoi || q.NoiDung}>
                                                        {q.NoiDungCauHoi || q.NoiDung}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark border fw-normal">
                                                    <i className="bi bi-tag-fill text-main-orange me-1"></i>{q.MonHoc}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge border fw-bold ${getDifficultyBadge(q.DoKho)}`}>
                                                    {q.DoKho}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-muted small">
                                                    <i className="bi bi-file-earmark-text me-1"></i>{q.LoaiCauHoi}
                                                </div>
                                            </td>
                                            <td className="pe-4 text-end">
                                                <div className="btn-group shadow-sm">
                                                    <button 
                                                        className="btn btn-sm btn-light border" 
                                                        title="Xem chi tiết" 
                                                        onClick={() => window.open(`/thu-vien/cau-hoi/${q._id}`, '_blank')}
                                                    >
                                                        <i className="bi bi-eye text-primary"></i>
                                                    </button>
                                                    {activeTab === 'Đang kiểm duyệt' && (
                                                        <>
                                                            {/* ĐÃ SỬA: Thay thế hàm gọi trực tiếp bằng hàm mở Modal */}
                                                            <button className="btn btn-sm btn-light border text-success fw-bold" onClick={() => openConfirmModal(q._id, 'Hoàn thiện')} title="Phê duyệt">
                                                                <i className="bi bi-check-lg me-1"></i> Duyệt
                                                            </button>
                                                            <button className="btn btn-sm btn-light border text-danger fw-bold" onClick={() => openConfirmModal(q._id, 'Đã từ chối')} title="Từ chối">
                                                                <i className="bi bi-x-lg me-1"></i> Từ chối
                                                            </button>
                                                        </>
                                                    )}
                                                    {activeTab === 'Hoàn thiện' && (
                                                        <button className="btn btn-sm btn-light border text-warning fw-bold" onClick={() => openConfirmModal(q._id, 'Đang kiểm duyệt')} title="Thu hồi">
                                                            <i className="bi bi-arrow-counterclockwise me-1"></i> Thu hồi
                                                        </button>
                                                    )}
                                                    {activeTab === 'Đã từ chối' && (
                                                        <button className="btn btn-sm btn-light border text-info fw-bold" onClick={() => openConfirmModal(q._id, 'Đang kiểm duyệt')} title="Khôi phục">
                                                            <i className="bi bi-arrow-left-right me-1"></i> Khôi phục
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            <i className="bi bi-inbox fs-2 d-block mb-2 opacity-25"></i>
                                            Không có câu hỏi nào trong danh mục này.
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
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 px-3 fw-bold text-main-orange bg-transparent" onClick={() => paginate(1)}>
                                        <i className="bi bi-chevron-double-left"></i>
                                    </button>
                                </li>
                                {getPageNumbers().map(num => (
                                    <li key={num} className={`page-item ${currentPage === num ? 'active' : ''}`}>
                                        <button 
                                            className={`page-link border-0 px-3 mx-1 rounded-circle transition-all ${currentPage === num ? 'bg-main-orange text-white' : 'text-dark bg-transparent'}`}
                                            onClick={() => paginate(num)}
                                            style={currentPage === num ? { backgroundColor: '#ff6b00', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(255,107,0,0.3)' } : {}}
                                        >
                                            {num}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 px-3 fw-bold text-main-orange bg-transparent" onClick={() => paginate(totalPages)}>
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

export default QuanLyCauHoi;