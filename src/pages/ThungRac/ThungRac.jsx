import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ThungRac.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

// Hàm tính toán số ngày còn lại (Hạn sử dụng 30 ngày)
const calculateDaysLeft = (deletedAt) => {
  if (!deletedAt) return 30; 
  const deleteDate = new Date(deletedAt);
  const expiryDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const currentDate = new Date();
  const diffTime = expiryDate - currentDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const ThungRac = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // PHÂN TRANG & BỘ LỌC
  const [trashItems, setTrashItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [filterType, setFilterType] = useState('Tất cả'); 
  const [searchTerm, setSearchTerm] = useState('');

  // === STATE QUẢN LÝ OVERLAY XÁC NHẬN ===
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    trashType: null,
    actionType: null, // 'RESTORE' hoặc 'FORCE_DELETE'
    message: '',
    modalStyle: 'primary' // 'success' hoặc 'danger'
  });

  const fetchTrashData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      if (filterType === 'Tất cả') {
        const endpoints = ['tailieuhoctap', 'cauhoi', 'dethithu', 'lotrinhhoctap'];
        const promises = endpoints.map(ep => 
          fetchClient(`/api/${ep}/thungrac?${queryParams.toString()}`)
            .then(res => res.ok ? res.json() : { data: [], totalItems: 0, totalPages: 1 })
            .catch(() => ({ data: [], totalItems: 0, totalPages: 1 }))
        );

        const results = await Promise.all(promises);
        
        let combinedData = [];
        let combinedTotal = 0;

        results.forEach((res, idx) => {
          const type = endpoints[idx];
          const items = (res.data || []).map(item => ({ ...item, trashType: type }));
          combinedData = [...combinedData, ...items];
          combinedTotal += (res.totalItems || 0);
        });

        combinedData.sort((a, b) => new Date(b.NgayXoa) - new Date(a.NgayXoa));
        setTrashItems(combinedData.slice(0, itemsPerPage));
        setTotalItems(combinedTotal);
        setTotalPages(Math.ceil(combinedTotal / itemsPerPage));

      } else {
        const response = await fetchClient(`/api/${filterType}/thungrac?${queryParams.toString()}`);
        if (response.ok) {
          const json = await response.json();
          const items = (json.data || []).map(item => ({ ...item, trashType: filterType }));
          setTrashItems(items);
          setTotalPages(json.totalPages || 1);
          setTotalItems(json.totalItems || 0);
        } else {
          setTrashItems([]);
          setTotalItems(0);
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu thùng rác:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filterType]);

  useEffect(() => {
    fetchTrashData();
  }, [fetchTrashData]);

  // --- LOGIC ĐIỀU PHỐI QUA MODAL ---

  const triggerRestore = (id, type, name) => {
    setConfirmModal({
      isOpen: true,
      id,
      trashType: type,
      actionType: 'RESTORE',
      message: `Bạn có muốn khôi phục mục "${name}" về lại hệ thống không?`,
      modalStyle: 'success'
    });
  };

  const triggerForceDelete = (id, type, name) => {
    setConfirmModal({
      isOpen: true,
      id,
      trashType: type,
      actionType: 'FORCE_DELETE',
      message: `CẢNH BÁO: Mục "${name}" sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu và không thể khôi phục lại. Bạn có chắc chắn?`,
      modalStyle: 'danger'
    });
  };

  const executeAction = async () => {
    const { id, trashType, actionType } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false }); 

    try {
      let response;
      if (actionType === 'RESTORE') {
        response = await fetchClient(`/api/${trashType}/${id}/restore`, { method: 'PUT' });
      } else {
        response = await fetchClient(`/api/${trashType}/${id}/force`, { method: 'DELETE' });
      }

      if (response.ok) {
        if (trashItems.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchTrashData();
        }
      } else {
        const err = await response.json();
        alert(`Lỗi: ${err.message || 'Thao tác thất bại'}`);
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ!");
    }
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
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

  const paginate = (num) => {
    setCurrentPage(num);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getItemDisplayInfo = (item) => {
    switch (item.trashType) {
      case 'tailieuhoctap':
        return { 
          title: item.TenTaiLieu || 'Tài liệu không tên', 
          badge: 'Tài liệu', 
          badgeColor: 'bg-primary', 
          icon: 'bi-file-earmark-text' 
        };
      case 'cauhoi':
        return { 
          title: item.NoiDungCauHoi || 'Câu hỏi trống', 
          badge: 'Câu hỏi', 
          badgeColor: 'bg-success', 
          icon: 'bi-patch-question' 
        };
      case 'dethithu':
        return { 
          title: item.TenDeThi || 'Đề thi không tên', 
          badge: 'Đề thi', 
          badgeColor: 'bg-info text-dark', 
          icon: 'bi-cloud-arrow-up' 
        };
      case 'lotrinhhoctap':
        return { 
          title: item.TenLoTrinh || 'Lộ trình không tên', 
          badge: 'Lộ trình', 
          badgeColor: 'bg-main-orange', 
          icon: 'bi-map' 
        };
      default:
        return { title: 'Mục không xác định', badge: 'Khác', badgeColor: 'bg-secondary', icon: 'bi-file' };
    }
  };

  return (
    <>
      <main className={styles.pageThungRac}>
        <section className="bg-light py-4 border-bottom shadow-sm">
          <div className="container">
            <div className="row align-items-center mb-4">
              <div className="col-12">
                <h2 className="fw-bold mb-0 text-danger"><i className="bi bi-trash3 me-2"></i>Thùng Rác</h2>
                <p className="text-muted mb-0 mt-2 fs-6">
                  Quản lý và khôi phục các dữ liệu đã bị xóa khỏi hệ thống.
                </p>
              </div>
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-4 col-lg-3">
                <select 
                  className={`form-select shadow-none ${styles.filterControl}`} 
                  value={filterType} 
                  onChange={(e) => handleFilterChange(setFilterType, e.target.value)}
                >
                  <option value="Tất cả">Hiển thị: Tất cả</option>
                  <option value="tailieuhoctap">Tài liệu học tập</option>
                  <option value="cauhoi">Câu hỏi</option>
                  <option value="dethithu">Đề thi thử</option>
                  <option value="lotrinhhoctap">Lộ trình học tập</option>
                </select>
              </div>

              <div className="col-12 col-md-8 col-lg-9">
                <div className={`input-group shadow-sm ${styles.filterControl}`}>
                  <span className="input-group-text bg-white text-muted border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control shadow-none border-start-0 ps-0"
                    placeholder="Tìm kiếm nội dung đã xóa..."
                    value={searchTerm}
                    onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-5 bg-light min-vh-100">
          <div className="container">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status"></div>
                <p className="mt-2 text-muted small">Đang tìm trong thùng rác...</p>
              </div>
            ) : (
              <>
                <div className="row g-4 mb-5">
                  {trashItems.length > 0 ? (
                    trashItems.map((item) => {
                      const displayInfo = getItemDisplayInfo(item);
                      const daysLeft = calculateDaysLeft(item.NgayXoa); // Gọi hàm tính toán

                      return (
                        <div key={`${item.trashType}-${item._id}`} className="col-12 col-md-6 col-lg-4 d-flex">
                          <div className={`card w-100 shadow-sm ${styles.trashCard}`}>
                            <div className="card-body p-4 d-flex flex-column">

                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <span className={`badge px-3 py-2 fw-normal ${displayInfo.badgeColor}`}>
                                  <i className={`bi ${displayInfo.icon} me-1`}></i> {displayInfo.badge}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  <i className="bi bi-clock-history me-1"></i>
                                  Xóa: {item.NgayXoa ? new Date(item.NgayXoa).toLocaleDateString('vi-VN') : 'Không rõ'}
                                </span>
                              </div>

                              <h5 className="card-title fw-bold text-dark mb-3 lh-base">
                                {displayInfo.title}
                              </h5>

                              {/* BỔ SUNG: Hiển thị đếm ngược thời gian tự động xóa */}
                              <div className="mb-3 small">
                                {daysLeft > 0 ? (
                                  <span className={`px-2 py-1 rounded ${daysLeft <= 5 ? 'bg-danger-subtle text-danger fw-bold' : 'bg-warning-subtle text-dark'}`}>
                                    <i className="bi bi-hourglass-split me-1"></i>
                                    Tự động xóa sau: {daysLeft} ngày
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded bg-danger-subtle text-danger fw-bold">
                                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                    Đang chờ xóa vĩnh viễn...
                                  </span>
                                )}
                              </div>

                              <div className="mt-auto d-flex gap-2">
                                <button 
                                  className="btn btn-outline-success flex-grow-1 fw-bold"
                                  onClick={() => triggerRestore(item._id, item.trashType, displayInfo.title)}
                                  title="Khôi phục dữ liệu này"
                                >
                                  <i className="bi bi-arrow-counterclockwise me-1"></i> Khôi phục
                                </button>
                                
                                <button 
                                  className="btn btn-danger px-3 flex-shrink-0"
                                  onClick={() => triggerForceDelete(item._id, item.trashType, displayInfo.title)}
                                  title="Xóa vĩnh viễn"
                                >
                                  <i className="bi bi-x-circle-fill"></i>
                                </button>
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-12 text-center py-5">
                      <i className="bi bi-trash text-muted opacity-25 d-block mb-3" style={{ fontSize: '4rem' }}></i>
                      <h5 className="text-muted">Thùng rác trống.</h5>
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="d-flex justify-content-center">
                    <nav>
                      <ul className="pagination mb-0 shadow-sm rounded-pill overflow-hidden border-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link border-0 px-3 fw-bold" onClick={() => paginate(1)}>Đầu</button>
                        </li>
                        {getPageNumbers().map((number) => (
                          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                            <button
                              className={`page-link border-0 px-3 ${currentPage === number ? styles.activePage : ''}`}
                              onClick={() => paginate(number)}
                            >
                              {number}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button className="page-link border-0 px-3 fw-bold" onClick={() => paginate(totalPages)}>Cuối</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* === GIAO DIỆN OVERLAY (MODAL) XÁC NHẬN THAO TÁC THÙNG RÁC === */}
      {confirmModal.isOpen && (
        <div 
            className="d-flex align-items-center justify-content-center" 
            style={{
                position: 'fixed', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                zIndex: 10000,
                backdropFilter: 'blur(3px)'
            }}
        >
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
                
                {confirmModal.actionType === 'RESTORE' ? (
                  <i className="bi bi-arrow-counterclockwise text-success" style={{ fontSize: '4rem' }}></i>
                ) : (
                  <i className="bi bi-exclamation-octagon-fill text-danger" style={{ fontSize: '4rem' }}></i>
                )}
                
                <h4 className="fw-bold mt-3 text-dark">
                  {confirmModal.actionType === 'RESTORE' ? 'Xác nhận khôi phục' : 'Xác nhận xóa vĩnh viễn'}
                </h4>
                <p className="text-muted mt-2 fs-6 mb-4">{confirmModal.message}</p>
                
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                    <button 
                        className="btn btn-light border fw-bold rounded-pill px-4 py-2" 
                        onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        className={`btn btn-${confirmModal.modalStyle} fw-bold rounded-pill px-4 py-2 text-white`}
                        onClick={executeAction}
                    >
                        {confirmModal.actionType === 'RESTORE' ? 'Khôi phục ngay' : 'Tôi chắc chắn xóa'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default ThungRac;