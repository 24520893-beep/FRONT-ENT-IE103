import React, { useState, useEffect, useCallback } from 'react';
import { fetchClient } from '../../utils/fetchClient'; 
// Bạn có thể tái sử dụng file CSS của trang GiaoVien nếu chung style
import styles from '../NguoiDung/GiaoVien.module.css'; 

const GiaoVienDaXoa = () => {
  const [teachers, setTeachers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 12; 
  const [searchTerm, setSearchTerm] = useState('');

  // === STATE QUẢN LÝ OVERLAY XÁC NHẬN ===
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    actionType: null, // 'RESTORE' hoặc 'FORCE_DELETE'
    message: '',
    modalStyle: 'primary' // 'success' hoặc 'danger'
  });

  const fetchDeletedTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: teachersPerPage,
        search: searchTerm
      }).toString();

      // Gọi API lấy danh sách giáo viên đã xóa mềm
      const response = await fetchClient(`/api/nguoidung/thungrac-gv?${queryParams}`);

      if (response.ok) {
        const json = await response.json();
        setTeachers(json.data || []);
        setTotalPages(json.totalPages || 1);
        setTotalItems(json.totalItems || 0);
      }
    } catch (error) {
      console.error("Không thể kết nối đến máy chủ:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchDeletedTeachers();
  }, [fetchDeletedTeachers]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  // --- LOGIC ĐIỀU PHỐI QUA MODAL ---
  const triggerRestore = (id, name) => {
    setConfirmModal({
      isOpen: true,
      id,
      actionType: 'RESTORE',
      message: `Bạn có muốn khôi phục quyền truy cập cho giáo viên "${name}" không?`,
      modalStyle: 'success'
    });
  };

  const triggerForceDelete = (id, name) => {
    setConfirmModal({
      isOpen: true,
      id,
      actionType: 'FORCE_DELETE',
      message: `CẢNH BÁO: Tài khoản của giáo viên "${name}" sẽ bị xóa vĩnh viễn và không thể khôi phục lại. Bạn có chắc chắn?`,
      modalStyle: 'danger'
    });
  };

  const executeAction = async () => {
    const { id, actionType } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false }); 
    
    try {
      let response;
      if (actionType === 'RESTORE') {
        response = await fetchClient(`/api/nguoidung/${id}/restore`, { method: 'PUT' });
      } else {
        response = await fetchClient(`/api/nguoidung/${id}/force`, { method: 'DELETE' });
      }

      if (response.ok) {
        if (teachers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchDeletedTeachers();
        }
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.message || 'Thao tác thất bại'}`);
      }
    } catch (error) {
      alert("Đã xảy ra lỗi kết nối.");
    }
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

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <main className="bg-light min-vh-100 py-4">
        {/* SECTION 1: FILTER & SEARCH */}
        <section className="mb-4">
          <div className="container-fluid px-4">
            <div className="row align-items-center mb-4">
              <div className="col-12">
                <h2 className="fw-bold mb-0 text-danger"><i className="bi bi-person-x-fill me-2"></i>Giáo viên đã xóa</h2>
                <p className="text-muted mb-0 mt-2 fs-6">Quản lý và khôi phục tài khoản giáo viên đã bị vô hiệu hóa.</p>
              </div>
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-6 col-lg-4">
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control shadow-none border-start-0 ps-0"
                    placeholder="Tìm tên hoặc email giáo viên..."
                    value={searchTerm}
                    onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: DANH SÁCH GIÁO VIÊN ĐÃ XÓA */}
        <section>
          <div className="container-fluid px-4">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status"></div>
              </div>
            ) : (
              <>
                <div className="row g-4 mb-4">
                  {teachers.length > 0 ? (
                    teachers.map((teacher) => (
                      <div key={teacher._id} className="col-12 col-md-6 col-xl-4 d-flex">
                        <div className="card w-100 border-0 shadow-sm position-relative">
                          <div className="card-body p-4 d-flex flex-column">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <span className="badge bg-danger px-3 py-2 fw-normal"><i className="bi bi-slash-circle me-1"></i> Đã vô hiệu hóa</span>
                                {teacher.NgayXoa && (
                                    <span className="text-muted small"><i className="bi bi-clock-history me-1"></i> Xóa lúc: {new Date(teacher.NgayXoa).toLocaleDateString('vi-VN')}</span>
                                )}
                            </div>

                            <div className="d-flex align-items-center mb-3">
                              <div className="me-3 opacity-50">
                                {teacher.Avatar ? (
                                  <img src={teacher.Avatar} alt={teacher.HoTen} className="rounded-circle border" style={{ width: '60px', height: '60px', objectFit: 'cover', filter: 'grayscale(100%)' }} />
                                ) : (
                                  <i className="bi bi-person-badge text-secondary" style={{ fontSize: '3.5rem' }}></i>
                                )}
                              </div>
                              <div>
                                <h5 className="card-title fw-bold text-dark mb-1 text-truncate" style={{ maxWidth: '200px' }}>{teacher.HoTen}</h5>
                                <p className="text-muted mb-0 small text-truncate" style={{ maxWidth: '200px' }}>{teacher.Email}</p>
                                <span className="badge bg-secondary mt-2">{teacher.MonHoc || 'Chưa cập nhật môn'}</span>
                              </div>
                            </div>

                            <div className="mt-auto d-flex gap-2 border-top pt-3">
                              <button 
                                className="btn btn-outline-success flex-grow-1 fw-bold"
                                onClick={() => triggerRestore(teacher._id, teacher.HoTen)}
                              >
                                <i className="bi bi-arrow-counterclockwise me-1"></i> Khôi phục
                              </button>
                              
                              <button 
                                className="btn btn-danger px-3 flex-shrink-0"
                                onClick={() => triggerForceDelete(teacher._id, teacher.HoTen)}
                                title="Xóa vĩnh viễn"
                              >
                                <i className="bi bi-x-circle-fill"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-5">
                       <i className="bi bi-person-check text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
                       <h5 className="text-muted mt-3">Không có giáo viên nào trong thùng rác.</h5>
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
                          <li key={number} className={`page-item ${currentPage === number ? 'active bg-danger' : ''}`}>
                            <button 
                                className="page-link border-0 px-3 text-dark" 
                                style={currentPage === number ? { backgroundColor: '#dc3545', color: 'white' } : {}}
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
                <div className="text-center mt-3 text-muted small">
                  Trang {currentPage} / {totalPages} (Tổng cộng {totalItems} giáo viên đã xóa)
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* === GIAO DIỆN OVERLAY (MODAL) XÁC NHẬN === */}
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
              <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '420px', width: '90%' }}>
                  
                  {confirmModal.actionType === 'RESTORE' ? (
                      <i className="bi bi-arrow-counterclockwise text-success" style={{ fontSize: '4rem' }}></i>
                  ) : (
                      <i className="bi bi-exclamation-octagon-fill text-danger" style={{ fontSize: '4rem' }}></i>
                  )}

                  <h4 className="fw-bold mt-3 text-dark">
                      {confirmModal.actionType === 'RESTORE' ? 'Khôi phục giáo viên' : 'Xóa vĩnh viễn'}
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
                          className={`btn btn-${confirmModal.modalStyle} fw-bold rounded-pill px-4 py-2 text-white shadow`}
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

export default GiaoVienDaXoa;