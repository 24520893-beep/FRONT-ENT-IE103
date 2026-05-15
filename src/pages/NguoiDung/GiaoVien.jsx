import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './GiaoVien.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

const GiaoVien = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  // STATE DỮ LIỆU TỪ SERVER
  const [teachers, setTeachers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // STATE ĐIỀU KHIỂN BỘ LỌC VÀ PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 12; 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');

  // === STATE QUẢN LÝ OVERLAY XÁC NHẬN XÓA ===
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    message: '',
    type: 'danger'
  });

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: teachersPerPage,
        search: searchTerm,
        subject: selectedSubject
      }).toString();

      const response = await fetchClient(`/api/nguoidung/danh-sach-gv?${queryParams}`);

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
  }, [currentPage, searchTerm, selectedSubject]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUserRole(JSON.parse(savedUser).VaiTro);
    }
    fetchTeachers();
  }, [fetchTeachers]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  // --- LOGIC ĐIỀU PHỐI QUA MODAL ---

  // Bước 1: Kích hoạt Modal khi nhấn nút thùng rác
  const triggerDelete = (teacherId, teacherName) => {
    setConfirmModal({
      isOpen: true,
      id: teacherId,
      message: `Bạn có chắc chắn muốn xóa giáo viên "${teacherName}" khỏi hệ thống? Hành động này không thể hoàn tác.`,
      type: 'danger'
    });
  };

  // Bước 2: Thực thi xóa sau khi xác nhận trên Modal
  const executeDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false }); // Đóng modal ngay
    
    try {
      const response = await fetchClient(`/api/nguoidung/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Đã bỏ alert, tự động tải lại danh sách
        if (teachers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchTeachers();
        }
      } else {
        const errorData = await response.json();
        console.error(`Lỗi: ${errorData.message || 'Không thể xóa'}`);
      }
    } catch (error) {
      console.error("Đã xảy ra lỗi kết nối.", error);
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
      <main className={styles.pageGiaoVien}>
        {/* SECTION 1: FILTER & SEARCH */}
        <section className="bg-light py-4 border-bottom shadow-sm">
          <div className="container">
            <div className="row align-items-center mb-4">
              <div className="col-md-6">
                <h2 className="fw-bold mb-0">Đội ngũ Giáo viên</h2>
                <p className="text-muted mb-0 mt-2 fs-6">Hệ thống luyện thi Đại học HOCMOI.VN</p>
              </div>
              {userRole === 'QuanTriVien' && (
                <div className="col-md-6 text-md-end mt-3 mt-md-0">
                  <Link to="/them-giao-vien" className="btn btn-main-orange text-white fw-bold shadow-sm">
                    <i className="bi bi-plus-circle me-2"></i>Thêm giáo viên
                  </Link>
                </div>
              )}
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-3">
                <select
                  className={`form-select shadow-none ${styles.filterControl}`}
                  value={selectedSubject}
                  onChange={(e) => handleFilterChange(setSelectedSubject, e.target.value)}
                >
                  <option value="Tất cả">Tất cả môn</option>
                  <option value="Toán">Toán</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Sinh học">Sinh học</option>
                </select>
              </div>
              <div className="col-12 col-md-9">
                <div className={`input-group shadow-sm ${styles.filterControl}`}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control shadow-none border-start-0 ps-0"
                    placeholder="Tìm tên giáo viên..."
                    value={searchTerm}
                    onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: DANH SÁCH GIÁO VIÊN */}
        <section className="py-5 bg-light min-vh-100">
          <div className="container">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-main-orange" role="status"></div>
                <p className="mt-2 text-muted small">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <>
                <div className="row g-4 mb-5">
                  {teachers.length > 0 ? (
                    teachers.map((teacher) => (
                      <div key={teacher._id} className="col-12 col-md-6 col-lg-4 d-flex">
                        <div className={`card w-100 border-0 shadow-sm position-relative ${styles.teacherCard}`}>
                          
                          {userRole === 'QuanTriVien' && (
                            <button 
                              className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
                              style={{ width: '32px', height: '32px', zIndex: 10, opacity: 0.8 }}
                              title="Xóa giáo viên"
                              onClick={() => triggerDelete(teacher._id, teacher.HoTen)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}

                          <div className="card-body p-4 text-center d-flex flex-column">
                            <div className="mb-3">
                              {teacher.Avatar ? (
                                <img src={teacher.Avatar} alt={teacher.HoTen} className="rounded-circle border shadow-sm" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                              ) : (
                                <i className="bi bi-person-badge text-main-orange opacity-50" style={{ fontSize: '3.5rem' }}></i>
                              )}
                            </div>
                            <div className="badge bg-main-orange mb-3 align-self-center px-3 py-2 fw-normal">{teacher.MonHoc || 'Chưa cập nhật'}</div>
                            <h5 className="card-title fw-bold text-dark mb-2 text-truncate">{teacher.HoTen}</h5>
                            <p className="text-muted mb-0 text-truncate small">{teacher.Email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-5">
                       <i className="bi bi-person-x text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
                       <h5 className="text-muted mt-3">Không tìm thấy giáo viên nào.</h5>
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
                            <button className={`page-link border-0 px-3 ${currentPage === number ? styles.activePage : ''}`} onClick={() => paginate(number)}>{number}</button>
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
                  Trang {currentPage} / {totalPages} (Tổng cộng {totalItems} giáo viên)
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* === GIAO DIỆN OVERLAY (MODAL) XÁC NHẬN XÓA GIÁO VIÊN === */}
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
                  <i className="bi bi-exclamation-octagon-fill text-danger" style={{ fontSize: '4rem' }}></i>
                  <h4 className="fw-bold mt-3 text-dark">Xác nhận xóa</h4>
                  <p className="text-muted mt-2 fs-6 mb-4">{confirmModal.message}</p>
                  
                  <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                      <button 
                          className="btn btn-light border fw-bold rounded-pill px-4 py-2" 
                          onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                      >
                          Hủy bỏ
                      </button>
                      <button 
                          className="btn btn-danger fw-bold rounded-pill px-4 py-2 text-white shadow"
                          onClick={executeDelete}
                      >
                          Xác nhận xóa
                      </button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default GiaoVien;