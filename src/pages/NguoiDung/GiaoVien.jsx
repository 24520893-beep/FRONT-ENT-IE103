import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './GiaoVien.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const GiaoVien = () => {
  const [userRole, setUserRole] = useState(null);

  // STATE DỮ LIỆU TỪ SERVER
  const [teachers, setTeachers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // STATE ĐIỀU KHIỂN BỘ LỌC VÀ PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 12; // 3 thẻ/dòng x 4 dòng = 12 thẻ/trang
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');

  // 1. HÀM GỌI API LẤY DỮ LIỆU THEO TRANG (SERVER-SIDE)
  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: teachersPerPage,
        search: searchTerm,
        subject: selectedSubject
      }).toString();

      // Đã sửa: Dùng fetchClient để gọi API
      const response = await fetchClient(`/api/nguoidung/danh-sach-gv?${queryParams}`);

      if (response.ok) {
        const json = await response.json();
        setTeachers(json.data || []);
        setTotalPages(json.totalPages || 1);
        setTotalItems(json.totalItems || 0);
      } else {
        console.error("Lỗi khi lấy danh sách giáo viên");
      }
    } catch (error) {
      console.error("Không thể kết nối đến máy chủ:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedSubject]);

  // 2. THEO DÕI THAY ĐỔI ĐỂ TẢI LẠI DỮ LIỆU
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUserRole(JSON.parse(savedUser).VaiTro);
    }
    fetchTeachers();
  }, [fetchTeachers]);

  // 3. XỬ LÝ KHI THAY ĐỔI BỘ LỌC (RESET VỀ TRANG 1)
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  // 4. HÀM XỬ LÝ XÓA GIÁO VIÊN (Dành cho Quản trị viên)
  const handleDelete = async (teacherId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giáo viên này khỏi hệ thống?")) return;

    try {
      // Đã sửa: Dùng fetchClient, tự động chèn Token, không cần cấu hình header thủ công
      const response = await fetchClient(`/api/nguoidung/${teacherId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert("Xóa giáo viên thành công!");
        // Nếu xóa phần tử cuối cùng của trang, lùi lại 1 trang
        if (teachers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchTeachers(); // Tải lại danh sách hiện tại
        }
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.message || 'Không thể xóa giáo viên'}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert("Đã xảy ra lỗi kết nối khi xóa giáo viên.");
    }
  };

  // 5. LOGIC HIỂN THỊ DẢI SỐ TRANG (MAX 5 SỐ)
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

  return (
    <main className={styles.pageGiaoVien}>

      {/* SECTION 1: FILTER & SEARCH */}
      <section className="bg-light py-4 border-bottom shadow-sm">
        <div className="container">
          <div className="row align-items-center mb-4">
            <div className="col-md-6">
              <h2 className="fw-bold mb-0">Đội ngũ Giáo viên</h2>
              <p className="text-muted mb-0 mt-2 fs-6">Hệ thống luyện thi Đại học HOCMOI.VN</p>
            </div>
            {/* Nếu là Quản trị viên thì hiển thị nút Thêm giáo viên */}
            {userRole === 'QuanTriVien' && (
              <div className="col-md-6 text-md-end mt-3 mt-md-0">
                <Link 
                  to="/them-giao-vien" 
                  className="btn btn-main-orange text-white fw-bold shadow-sm"
                >
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
              <div className="spinner-border text-main-orange" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="mt-2 text-muted">Đang tải dữ liệu từ máy chủ...</p>
            </div>
          ) : (
            <>
              <div className="row g-4 mb-5">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <div key={teacher._id} className="col-12 col-md-6 col-lg-4 d-flex">
                      {/* Thêm position-relative để đặt nút xóa lên góc */}
                      <div className={`card w-100 border-0 shadow-sm position-relative ${styles.teacherCard}`}>
                        
                        {/* NÚT XÓA CHỈ HIỂN THỊ CHO QUẢN TRỊ VIÊN */}
                        {userRole === 'QuanTriVien' && (
                          <button 
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
                            style={{ width: '32px', height: '32px', zIndex: 10, opacity: 0.8 }}
                            title="Xóa giáo viên này"
                            onClick={() => handleDelete(teacher._id)}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}

                        <div className="card-body p-4 text-center d-flex flex-column">
                          <div className="mb-3">
                            <i className="bi bi-person-badge text-main-orange opacity-50" style={{ fontSize: '3rem' }}></i>
                          </div>
                          <div className="badge bg-main-orange mb-3 align-self-center">{teacher.MonHoc || 'Chưa cập nhật'}</div>
                          <h5 className="card-title fw-bold text-dark mb-2 text-truncate">{teacher.HoTen}</h5>
                          <p className="text-muted mb-0 text-truncate small">{teacher.Email}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5">
                    <p className="text-muted">Không tìm thấy giáo viên nào phù hợp trên máy chủ.</p>
                  </div>
                )}
              </div>

              {/* ================= THANH PHÂN TRANG NÂNG CẤP ================= */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center">
                  <nav>
                    <ul className="pagination mb-0 shadow-sm rounded-pill overflow-hidden border-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link border-0 px-3 fw-bold" onClick={() => paginate(1)}>Đầu</button>
                      </li>
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link border-0 px-3" onClick={() => paginate(currentPage - 1)}>Trước</button>
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
                        <button className="page-link border-0 px-3" onClick={() => paginate(currentPage + 1)}>Sau</button>
                      </li>
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
  );
};

export default GiaoVien;