import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './PhongLuyen.module.css';
import { fetchClient } from '../../utils/fetchClient';

const SUBJECTS = [
  "Ngữ văn", "Toán học", "Vật lí", "Hóa học", "Sinh học",
  "Lịch sử", "Địa lí", "Giáo dục kinh tế và pháp luật",
  "Tin học", "Công nghệ Công nghiệp", "Công nghệ Nông nghiệp",
  "Tiếng Anh", "Tiếng Nga", "Tiếng Pháp", "Tiếng Trung Quốc",
  "Tiếng Đức", "Tiếng Nhật", "Tiếng Hàn"
];

const PhongLuyen = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [exams, setExams] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const examsPerPage = 12;
  const [searchTerm, setSearchTerm] = useState('');

  const location = useLocation();
  // BỘ LỌC MỚI
  const [filterExamType, setFilterExamType] = useState('Tất cả');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    message: '',
    type: 'danger'
  });

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: examsPerPage,
        search: searchTerm,
      });

      if (filterExamType !== 'Tất cả') queryParams.append('examType', filterExamType);
      if (selectedSubject !== 'Tất cả' && filterExamType !== 'DGNL') queryParams.append('subject', selectedSubject);
      if (filterStatus !== 'Tất cả') queryParams.append('status', filterStatus);

      const response = await fetchClient(`/api/dethithu?${queryParams.toString()}`);

      if (response.ok) {
        const json = await response.json();
        setExams(json.data || []);
        setTotalPages(json.totalPages || 1);
        setTotalItems(json.totalItems || 0);
      }
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filterExamType, selectedSubject, filterStatus]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subjectParam = params.get('subject');
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
  }, [location.search]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      setUserRole(userObj.VaiTro || '');
      setCurrentUserId(userObj._id);
    }
    fetchExams();
  }, [fetchExams]);

  const triggerDeleteExam = (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      message: "Bạn có chắc chắn muốn xóa đề thi này không? Dữ liệu đã xóa sẽ không thể phục hồi.",
      type: 'danger'
    });
  };

  const executeDeleteExam = async () => {
    const { id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      const response = await fetchClient(`/api/dethithu/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchExams();
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.message || 'Không thể xóa đề thi'}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa đề thi:", error);
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

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status) => {
    if (status === 'Đã xuất bản' || status === 'Hoàn thiện') return 'bg-success text-white';
    if (status === 'Đã từ chối' || status === 'Từ chối') return 'bg-danger text-white';
    return 'bg-warning text-dark';
  };

  return (
    <>
      <main className={styles.pagePhongLuyen}>
        <section className="bg-light py-4 border-bottom shadow-sm">
          <div className="container">
            <div className="row align-items-center mb-4">
              <div className="col-md-8">
                <h2 className="fw-bold mb-0">Phòng Luyện Thi</h2>
                <p className="text-muted mb-0 mt-2 fs-6">Hệ thống đề thi THPT Quốc gia & ĐGNL bám sát cấu trúc mới.</p>
              </div>

              {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  <button
                    className="btn btn-main-orange text-white fw-bold shadow-sm"
                    onClick={() => navigate('/them-de-thi')}
                  >
                    <i className="bi bi-cloud-arrow-up-fill me-2"></i>Thêm đề thi mới
                  </button>
                </div>
              )}
            </div>

            <div className="row g-2">
              {/* BỘ LỌC LOẠI ĐỀ THI */}
              <div className="col-12 col-md-2">
                <select className={`form-select shadow-none ${styles.filterControl}`} value={filterExamType} onChange={(e) => handleFilterChange(setFilterExamType, e.target.value)}>
                  <option value="Tất cả">Loại đề: Tất cả</option>
                  <option value="THPT">Thi THPT</option>
                  <option value="DGNL">Thi ĐGNL</option>
                </select>
              </div>

              {/* BỘ LỌC MÔN HỌC (Ẩn đi nếu đang chọn ĐGNL) */}
              <div className="col-12 col-md-2">
                <select
                  className={`form-select shadow-none ${styles.filterControl}`}
                  value={selectedSubject}
                  onChange={(e) => handleFilterChange(setSelectedSubject, e.target.value)}
                  disabled={filterExamType === 'DGNL'}
                >
                  <option value="Tất cả">Môn thi: Tất cả</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
                <div className="col-12 col-md-3">
                  <select className={`form-select shadow-none ${styles.filterControl}`} value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}>
                    <option value="Tất cả">Trạng thái: Tất cả</option>
                    <option value="Hoàn thiện">Đã xuất bản / Hoàn thiện</option>
                    <option value="Đang kiểm duyệt">Đang kiểm duyệt</option>
                    <option value="Từ chối">Bị từ chối</option>
                  </select>
                </div>
              )}

              <div className={`col-12 ${userRole === 'GiaoVien' || userRole === 'QuanTriVien' ? 'col-md-5' : 'col-md-8'}`}>
                <div className={`input-group shadow-sm ${styles.filterControl}`}>
                  <span className="input-group-text bg-white text-muted border-end-0"><i className="bi bi-search"></i></span>
                  <input type="text" className="form-control shadow-none border-start-0 ps-0" placeholder="Tìm kiếm tên đề thi..." value={searchTerm} onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)} />
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
                <p className="mt-2 text-muted small">Đang tải dữ liệu từ máy chủ...</p>
              </div>
            ) : (
              <>
                <div className="row g-4 mb-5">
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <div key={exam._id} className="col-12 col-md-6 col-xl-4 d-flex">
                        <div className={`card w-100 border-0 shadow-sm ${styles.examCard}`}>
                          <div className="card-body p-4 d-flex flex-column">

                            <div className="d-flex align-items-center justify-content-between mb-3">
                              {/* XỬ LÝ HIỂN THỊ DGNL NẾU KHÔNG CÓ MÔN HỌC */}
                              <span className={`badge px-3 py-2 fw-bold ${exam.MonHoc ? 'bg-main-orange' : 'bg-primary'}`}>
                                {exam.MonHoc ? exam.MonHoc : 'Đánh giá năng lực'}
                              </span>

                              {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && exam.TrangThai && (
                                <span className={`badge border ${getStatusBadge(exam.TrangThai)}`}>{exam.TrangThai}</span>
                              )}
                            </div>

                            <h5 className="card-title fw-bold text-dark mb-3 lh-base">{exam.TenDeThi}</h5>

                            <div className="mb-3 mt-auto">
                              {exam.DanhSachNhanDan?.map((tag, i) => (
                                <span key={i} className="badge bg-light text-dark border me-2 fw-normal mb-1">
                                  <i className="bi bi-tag-fill text-muted me-1"></i>{tag.TenNhanDan}
                                </span>
                              ))}
                            </div>

                            <div className="row g-2 text-muted small mb-4">
                              <div className="col-6">
                                <i className="bi bi-stopwatch text-main-orange me-2"></i>
                                <span className="fw-medium">{exam.ThoiGianGioiHan} phút</span>
                              </div>
                              <div className="col-6">
                                <i className="bi bi-list-task text-main-orange me-2"></i>
                                <span className="fw-medium">{exam.DanhSachCauHoi?.length || 0} câu</span>
                              </div>
                            </div>

                            <hr className="my-0 mb-3 opacity-10" />

                            <div className="d-flex gap-2">
                              <Link to={`/phong-luyen/${exam._id}`} className="btn btn-outline-main-orange flex-grow-1 fw-bold">
                                {userRole === 'HocSinh' ? 'Vào thi ngay' : 'Xem chi tiết'}
                              </Link>

                              {currentUserId === (exam.MaGVThietKe?._id || exam.MaGVThietKe) && (
                                <>
                                  <button
                                    className="btn btn-outline-dark px-3 flex-shrink-0"
                                    onClick={() => navigate(`/them-de-thi?edit=${exam._id}`)}
                                    title="Sửa đề thi"
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger px-3 flex-shrink-0"
                                    onClick={() => triggerDeleteExam(exam._id)}
                                    title="Xóa đề thi này"
                                  >
                                    <i className="bi bi-trash3-fill"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-5">
                      <i className="bi bi-folder-x text-muted opacity-25 d-block mb-3" style={{ fontSize: '4rem' }}></i>
                      <h5 className="text-muted">Không tìm thấy đề thi nào trên máy chủ.</h5>
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="d-flex justify-content-center">
                    <nav aria-label="Page navigation">
                      <ul className="pagination mb-0 shadow-sm rounded-pill overflow-hidden border-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link border-0 px-3 fw-bold" onClick={() => paginate(1)}>Đầu</button>
                        </li>
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link border-0 px-3" onClick={() => paginate(currentPage - 1)}>Trước</button>
                        </li>
                        {getPageNumbers().map((number) => (
                          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                            <button className={`page-link border-0 px-3 ${currentPage === number ? styles.activePage : ''}`} onClick={() => paginate(number)}>{number}</button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button className="page-link border-0 px-3" onClick={() => paginate(currentPage + 1)}>Sau</button>
                        </li>
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

      {/* MODAL XÓA */}
      {confirmModal.isOpen && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, backdropFilter: 'blur(3px)' }}>
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '420px', width: '90%' }}>
            <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '4rem' }}></i>
            <h4 className="fw-bold mt-3 text-dark">Xác nhận xóa</h4>
            <p className="text-muted mt-2 fs-6 mb-4">{confirmModal.message}</p>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <button className="btn btn-light border fw-bold rounded-pill px-4 py-2" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Hủy bỏ</button>
              <button className="btn btn-danger fw-bold rounded-pill px-4 py-2 text-white" onClick={executeDeleteExam}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhongLuyen;