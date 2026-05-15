import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LoTrinh.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

const LoTrinh = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); 
  const [roadmaps, setRoadmaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // PHÂN TRANG & BỘ LỌC
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả'); 

  // === STATE QUẢN LÝ OVERLAY XÁC NHẬN XÓA ===
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    message: '',
    type: 'danger'
  });

  const fetchRoadmaps = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      if (filterStatus !== 'Tất cả') {
        queryParams.append('status', filterStatus);
      }

      const response = await fetchClient(`/api/lotrinhhoctap?${queryParams.toString()}`);

      if (response.ok) {
        const json = await response.json();
        setRoadmaps(json.data || []);
        setTotalPages(json.totalPages || 1);
        setTotalItems(json.totalItems || 0);
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus]); 

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      setUserRole(userObj.VaiTro);
      setCurrentUserId(userObj._id); 
    }
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  // HÀM MỞ MODAL XÁC NHẬN XÓA
  const openDeleteModal = (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      message: "Bạn có chắc chắn muốn xóa lộ trình này không? Dữ liệu đã xóa không thể khôi phục lại.",
      type: 'danger'
    });
  };

  // HÀM THỰC THI XÓA SAU KHI XÁC NHẬN
  const executeDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false }); // Đóng modal

    try {
      const response = await fetchClient(`/api/lotrinhhoctap/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert("Xóa lộ trình thành công!");
        if (roadmaps.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            fetchRoadmaps(); 
        }
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.message || 'Không thể xóa lộ trình'}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert("Đã xảy ra lỗi kết nối khi xóa lộ trình.");
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
    for (let i = startPage; i <= endPage; i++) {
      if (i > 0) pages.push(i);
    }
    return pages;
  };

  const paginate = (num) => {
    setCurrentPage(num);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageTitle = () => {
    if (userRole === 'GiaoVien' || userRole === 'QuanTriVien') return 'Quản lý Lộ trình';
    return 'Lộ trình Học tập của tôi';
  };

  return (
    <>
      <main className={styles.pageLoTrinh}>
        <section className="bg-light py-4 border-bottom shadow-sm">
          <div className="container">
            <div className="row align-items-center mb-4">
              <div className="col-md-8">
                <h2 className="fw-bold mb-0">{getPageTitle()}</h2>
                <p className="text-muted mb-0 mt-2 fs-6">
                  {userRole === 'HocSinh'
                    ? 'Tiếp tục hành trình chinh phục điểm cao của bạn.'
                    : 'Quản lý danh sách các lộ trình bài giảng trên hệ thống.'}
                </p>
              </div>

              {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  <button
                    className="btn btn-main-orange text-white fw-bold shadow-sm"
                    onClick={() => navigate('/them-lo-trinh')}
                  >
                    <i className="bi bi-plus-circle me-2"></i>Tạo lộ trình mới
                  </button>
                </div>
              )}
            </div>

            <div className="row g-2">
              {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
                <div className="col-12 col-md-4 col-lg-3">
                  <select 
                    className={`form-select shadow-none ${styles.filterControl}`} 
                    value={filterStatus} 
                    onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}
                  >
                    <option value="Tất cả">Trạng thái: Tất cả</option>
                    <option value="Hoàn thiện">Đã xuất bản / Hoàn thiện</option>
                    <option value="Đang kiểm duyệt">Đang kiểm duyệt</option>
                    <option value="Từ chối">Bị từ chối</option>
                  </select>
                </div>
              )}

              <div className={`col-12 col-md-6 ${userRole === 'GiaoVien' || userRole === 'QuanTriVien' ? 'col-lg-5' : 'col-lg-6'}`}>
                <div className={`input-group shadow-sm ${styles.filterControl}`}>
                  <span className="input-group-text bg-white text-muted border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control shadow-none border-start-0 ps-0"
                    placeholder="Tìm kiếm tên lộ trình..."
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
                <div className="spinner-border text-main-orange" role="status"></div>
                <p className="mt-2 text-muted small">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <>
                <div className="row g-4 mb-5">
                  {roadmaps.length > 0 ? (
                    roadmaps.map((roadmap) => {
                      const isOwner = currentUserId === (roadmap.MaGVPhuTrach?._id || roadmap.MaGVPhuTrach);

                      return (
                        <div key={roadmap._id} className="col-12 col-md-6 col-lg-4 d-flex">
                          <div className={`card w-100 border-0 shadow-sm ${styles.roadmapCard}`}>
                            <div className="card-body p-4 d-flex flex-column">

                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <span className="badge bg-main-orange px-3 py-2 fw-normal">
                                  {roadmap.MonHoc || 'Tổng hợp'}
                                </span>

                                {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
                                  <span className={`badge border ${
                                    roadmap.TrangThai === 'Đã xuất bản' || roadmap.TrangThai === 'Hoàn thiện'
                                      ? 'bg-success text-white'
                                      : roadmap.TrangThai === 'Đang kiểm duyệt' || roadmap.TrangThai === 'Chờ duyệt'
                                        ? 'bg-warning text-dark'
                                        : 'bg-danger text-white'
                                    }`}>
                                    {roadmap.TrangThai || 'Bản nháp'}
                                  </span>
                                )}
                              </div>

                              <h5 className="card-title fw-bold text-dark mb-2 lh-base">{roadmap.TenLoTrinh}</h5>

                              <p className="text-muted small mb-3 text-truncate">
                                <i className="bi bi-person-video3 me-2"></i>
                                GV: {roadmap.MaGVPhuTrach?.HoTen || 'Đang cập nhật'}
                              </p>

                              {userRole === 'HocSinh' && (
                                <div className="mb-4 mt-auto">
                                  <div className="d-flex justify-content-between small text-muted mb-1">
                                    <span>Tiến độ học tập</span>
                                    <span className={roadmap.MucDoHoanThanh === 100 ? "fw-bold text-success" : "fw-bold text-main-orange"}>
                                      {roadmap.MucDoHoanThanh || 0}%
                                    </span>
                                  </div>
                                  <div className="progress" style={{ height: '8px' }}>
                                    <div
                                      className={`progress-bar ${roadmap.MucDoHoanThanh === 100 ? 'bg-success' : 'bg-main-orange'}`}
                                      style={{ width: `${roadmap.MucDoHoanThanh || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
                                <div className="row g-2 text-muted small mb-4 mt-auto">
                                  <div className="col-6">
                                    <i className="bi bi-journal-text text-main-orange me-2"></i>
                                    <span className="fw-medium">{roadmap.DanhSachNhiemVu?.length || 0} nhiệm vụ</span>
                                  </div>
                                  <div className="col-6">
                                    <i className="bi bi-person-badge text-main-orange me-2"></i>
                                    <span className="fw-medium text-truncate d-inline-block w-75 align-bottom">
                                      HS: {roadmap.MaHocSinh?.HoTen || 'Chưa gán'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <hr className="my-0 mb-3 opacity-10" />

                              <div className="d-flex gap-2">
                                {userRole === 'HocSinh' ? (
                                  roadmap.MucDoHoanThanh === 100 ? (
                                    <Link to={`/lo-trinh/${roadmap._id}`} className="btn btn-outline-success flex-grow-1 fw-bold">
                                      <i className="bi bi-check2-circle me-1"></i> Đã hoàn thành
                                    </Link>
                                  ) : (
                                    <Link to={`/lo-trinh/${roadmap._id}`} className="btn btn-outline-main-orange flex-grow-1 fw-bold">
                                      Tiếp tục học
                                    </Link>
                                  )
                                ) : (
                                  <Link to={`/lo-trinh/${roadmap._id}`} className="btn btn-outline-main-orange flex-grow-1 fw-bold">
                                    Xem chi tiết
                                  </Link>
                                )}

                                {isOwner && (
                                  <>
                                    <button 
                                      className="btn btn-outline-dark px-3 flex-shrink-0"
                                      onClick={() => navigate(`/them-lo-trinh?edit=${roadmap._id}`)}
                                      title="Sửa lộ trình"
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-danger px-3 flex-shrink-0"
                                      onClick={() => openDeleteModal(roadmap._id)}
                                      title="Xóa lộ trình"
                                    >
                                      <i className="bi bi-trash3-fill"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-12 text-center py-5">
                      <i className="bi bi-map text-muted opacity-25 d-block mb-3" style={{ fontSize: '4rem' }}></i>
                      <h5 className="text-muted">Không tìm thấy lộ trình nào phù hợp.</h5>
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

      {/* === GIAO DIỆN OVERLAY (MODAL) XÁC NHẬN XÓA LỘ TRÌNH === */}
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
                          className="btn btn-danger fw-bold rounded-pill px-4 py-2 text-white"
                          onClick={executeDelete}
                      >
                          Tôi muốn xóa
                      </button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default LoTrinh;