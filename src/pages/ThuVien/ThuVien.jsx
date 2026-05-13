import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ThuVien.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ThuVien = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const [libraryItems, setLibraryItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterFormat, setFilterFormat] = useState('Tất cả');
  const [filterQuestionType, setFilterQuestionType] = useState('Tất cả');
  const [filterDifficulty, setFilterDifficulty] = useState('Tất cả');
  const [filterTag, setFilterTag] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');

  const [danhSachNhanDan, setDanhSachNhanDan] = useState([]);

  useEffect(() => {
    const fetchNhanDan = async () => {
      try {
        // Đã sửa: Dùng fetchClient để gọi API
        const res = await fetchClient('/api/nhandan');
        if (res.ok) {
          const data = await res.json();
          setDanhSachNhanDan(data);
        }
      } catch (error) {
        console.error("Lỗi tải nhãn dán:", error);
      }
    };
    fetchNhanDan();
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      setUserRole(userObj.VaiTro || '');
      setCurrentUserId(userObj._id);
    }
  }, []);

  // ... (Các phần import và useEffect ban đầu giữ nguyên)

  const fetchLibraryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const commonParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage, // Lấy tối đa giới hạn để có đủ dữ liệu lọc
        search: searchTerm,
      });
      if (filterStatus !== 'Tất cả') commonParams.append('status', filterStatus);

      let data = [];
      let totalP = 1;
      let totalI = 0;

      if (filterType === 'Câu hỏi') {
        commonParams.append('type', filterQuestionType);
        commonParams.append('difficulty', filterDifficulty);
        const res = await fetchClient(`/api/cauhoi?${commonParams}`);
        const json = await res.json();
        data = (json.data || []).map(q => ({ ...q, itemType: 'cauhoi' }));
        totalP = json.totalPages;
        totalI = json.totalItems;
      }
      else if (filterType === 'Tài liệu') {
        commonParams.append('format', filterFormat);
        commonParams.append('tag', filterTag);
        const res = await fetchClient(`/api/tailieuhoctap?${commonParams}`);
        const json = await res.json();
        data = (json.data || []).map(m => ({ ...m, itemType: 'tailieu' }));
        totalP = json.totalPages;
        totalI = json.totalItems;
      }
      else {
        // --- CHẾ ĐỘ TẤT CẢ: ƯU TIÊN TUYỆT ĐỐI NỘI DUNG CỦA TÔI ---
        const [resQ, resM] = await Promise.all([
          fetchClient(`/api/cauhoi?${commonParams}&type=${filterQuestionType}&difficulty=${filterDifficulty}`),
          fetchClient(`/api/tailieuhoctap?${commonParams}&format=${filterFormat}&tag=${filterTag}`)
        ]);

        const jsonQ = await resQ.json();
        const jsonM = await resM.json();

        const arrM = (jsonM.data || []).map(m => ({ ...m, itemType: 'tailieu' }));
        const arrQ = (jsonQ.data || []).map(q => ({ ...q, itemType: 'cauhoi' }));

        // Gộp chung tất cả lại
        const combined = [...arrM, ...arrQ];

        // Thuật toán sắp xếp ưu tiên:
        combined.sort((a, b) => {
          // Kiểm tra quyền sở hữu (MaGVDangTai hoặc MaGVBienSoan)
          const ownerA = a.MaGVDangTai?._id || a.MaGVDangTai || a.MaGVBienSoan?._id || a.MaGVBienSoan;
          const ownerB = b.MaGVDangTai?._id || b.MaGVDangTai || b.MaGVBienSoan?._id || b.MaGVBienSoan;

          const isAMine = ownerA === currentUserId;
          const isBMine = ownerB === currentUserId;

          // 1. Ưu tiên của tôi lên trước
          if (isAMine && !isBMine) return -1;
          if (!isAMine && isBMine) return 1;

          // 2. Nếu cùng là "Của tôi" hoặc cùng là "Của người khác", xếp theo Trạng thái (đã xử lý ở Backend qua sortPriority)
          // Ở đây ta giữ nguyên thứ tự Backend trả về bằng cách so sánh timestamp hoặc để nguyên
          return 0;
        });

        // Lấy đúng số lượng item cho 1 trang
        data = combined.slice(0, itemsPerPage);

        totalI = (jsonQ.totalItems || 0) + (jsonM.totalItems || 0);
        totalP = Math.max(jsonQ.totalPages || 1, jsonM.totalPages || 1);
      }

      setLibraryItems(data);
      setTotalPages(totalP);
      setTotalItems(totalI);

    } catch (error) {
      console.error("Lỗi tải dữ liệu thư viện:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, filterType, filterFormat, filterQuestionType, filterDifficulty, filterTag, filterStatus, currentUserId]);

  useEffect(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);

  const handleDeleteItem = async (id, type) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mục này không?")) return;
    const endpoint = type === 'tailieu' ? 'tailieuhoctap' : 'cauhoi';
    try {
      // Đã sửa: Dùng fetchClient cho phương thức DELETE
      const response = await fetchClient(`/api/${endpoint}/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert("Xóa thành công!");
        fetchLibraryData();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message || 'Không thể xóa'}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
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
    for (let i = startPage; i <= endPage; i++) { if (i > 0) pages.push(i); }
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
    <main className={styles.pageThuVien}>
      <section className="bg-white py-4 border-bottom shadow-sm">
        <div className="container">

          <div className="row mb-4 align-items-center">
            <div className="col-12 d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h2 className="fw-bold mb-0">Thư Viện Học Tập</h2>
                <p className="text-muted mb-0 mt-2 fs-6">Hàng ngàn tài liệu và câu hỏi trắc nghiệm chất lượng.</p>
              </div>

              {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success px-4 py-2 shadow-sm fw-bold"
                    onClick={() => navigate('/them-cau-hoi')}
                  >
                    <i className="bi bi-plus-square-fill me-2"></i> Thêm câu hỏi
                  </button>
                  <button
                    className="btn btn-primary px-4 py-2 shadow-sm fw-bold"
                    onClick={() => navigate('/them-tai-lieu')}
                  >
                    <i className="bi bi-plus-circle-fill me-2"></i> Thêm tài liệu
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`input-group mb-3 shadow-sm ${styles.filterControl}`}>
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input
              type="text"
              className="form-control border-start-0 shadow-none"
              placeholder="Tìm kiếm nội dung tài liệu hoặc câu hỏi..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            />
          </div>

          <div className="row g-2">
            <div className="col-6 col-md-4 col-lg-2">
              <select className={`form-select shadow-none ${styles.filterControl}`} value={filterType} onChange={(e) => handleFilterChange(setFilterType, e.target.value)}>
                <option value="Tất cả">Phân loại: Tất cả</option>
                <option value="Tài liệu">Chỉ Tài liệu</option>
                <option value="Câu hỏi">Chỉ Câu hỏi</option>
              </select>
            </div>

            {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
              <div className="col-6 col-md-4 col-lg-2">
                <select className={`form-select shadow-none ${styles.filterControl}`} value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}>
                  <option value="Tất cả">Trạng thái: Tất cả</option>
                  <option value="Hoàn thiện">Đã xuất bản / Hoàn thiện</option>
                  <option value="Đang kiểm duyệt">Đang kiểm duyệt</option>
                  <option value="Từ chối">Bị từ chối</option>
                </select>
              </div>
            )}

            {(filterType === 'Tất cả' || filterType === 'Tài liệu') && (
              <>
                <div className="col-6 col-md-4 col-lg-2">
                  <select className={`form-select shadow-none ${styles.filterControl}`} value={filterFormat} onChange={(e) => handleFilterChange(setFilterFormat, e.target.value)}>
                    <option value="Tất cả">Định dạng: Tất cả</option>
                    <option value="PDF">PDF</option>
                    <option value="VIDEO">VIDEO</option>
                  </select>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                  <select className={`form-select shadow-none ${styles.filterControl}`} value={filterTag} onChange={(e) => handleFilterChange(setFilterTag, e.target.value)}>
                    <option value="Tất cả">Nhãn dán: Tất cả</option>
                    {danhSachNhanDan.map((tag) => (
                      <option key={tag._id} value={tag.TenNhanDan}>{tag.TenNhanDan}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {(filterType === 'Tất cả' || filterType === 'Câu hỏi') && (
              <>
                <div className="col-6 col-md-4 col-lg-2">
                  <select className={`form-select shadow-none ${styles.filterControl}`} value={filterQuestionType} onChange={(e) => handleFilterChange(setFilterQuestionType, e.target.value)}>
                    <option value="Tất cả">Loại câu: Tất cả</option>
                    <option value="Trắc nghiệm 4 lựa chọn">Trắc nghiệm</option>
                    <option value="DungSai">Đúng / Sai</option>
                    <option value="DienKhuyet">Điền khuyết</option>
                    <option value="TuLuan">Tự luận</option>
                  </select>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                  <select className={`form-select shadow-none ${styles.filterControl}`} value={filterDifficulty} onChange={(e) => handleFilterChange(setFilterDifficulty, e.target.value)}>
                    <option value="Tất cả">Độ khó: Tất cả</option>
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-5 bg-light min-vh-100">
        <div className="container">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-main-orange" role="status"></div>
            </div>
          ) : (
            <>
              <div className="row g-4 mb-5">
                {libraryItems.length > 0 ? (
                  libraryItems.map((item) => (
                    <div key={item._id} className="col-12 col-md-6 col-xl-4 d-flex">
                      <div className={`card w-100 border-0 shadow-sm ${styles.libraryCard}`}>
                        <div className="card-body p-4 d-flex flex-column">
                          {item.itemType === 'tailieu' ? (
                            <>
                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                  <span className="badge bg-primary px-3 py-2 fw-normal me-2">Tài liệu</span>
                                  <span className="badge bg-secondary border">{item.DinhDang}</span>
                                </div>
                                {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && item.TrangThai && (
                                  <span className={`badge ${getStatusBadge(item.TrangThai)}`}>{item.TrangThai}</span>
                                )}
                              </div>
                              <h5 className="card-title fw-bold text-dark mb-3 lh-base">{item.TenTaiLieu}</h5>
                              <div className="mb-3 mt-auto">
                                {item.DanhSachNhanDan?.map((tag, i) => (
                                  <span key={i} className="badge bg-white text-dark border me-1 fw-normal mb-1">{tag.TenNhanDan}</span>
                                ))}
                              </div>
                              <div className="d-flex gap-2 mt-2">
                                <button className="btn btn-outline-primary flex-grow-1 fw-bold" onClick={() => navigate(`/thu-vien/tai-lieu/${item._id}`)}>
                                  Xem chi tiết
                                </button>

                                {currentUserId === (item.MaGVDangTai?._id || item.MaGVDangTai) && (
                                  <>
                                    <button className="btn btn-outline-dark px-3" onClick={() => navigate(`/them-tai-lieu?edit=${item._id}`)} title="Sửa tài liệu">
                                      <i className="bi bi-pencil-square"></i>
                                    </button>
                                    <button className="btn btn-outline-danger px-3" onClick={() => handleDeleteItem(item._id, 'tailieu')} title="Xóa tài liệu">
                                      <i className="bi bi-trash3-fill"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                  <span className="badge bg-success px-3 py-2 fw-normal me-2">Câu hỏi</span>
                                  <span className="badge bg-info border">{item.DoKho}</span>
                                </div>
                                {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && item.TrangThai && (
                                  <span className={`badge ${getStatusBadge(item.TrangThai)}`}>{item.TrangThai}</span>
                                )}
                              </div>
                              <p className={`card-text text-dark fw-medium mb-3 ${styles.questionText}`}>{item.NoiDungCauHoi}</p>
                              <div className="row g-2 text-muted small mt-auto mb-3">
                                <div className="col-12"><i className="bi bi-tags-fill text-success me-2"></i>{item.LoaiCauHoi}</div>
                                <div className="col-12"><i className="bi bi-folder-fill text-warning me-2"></i>{item.ChuyenDe}</div>
                              </div>
                              <div className="d-flex gap-2 mt-2">
                                <button className="btn btn-outline-success flex-grow-1 fw-bold" onClick={() => navigate(`/thu-vien/cau-hoi/${item._id}`)}>
                                  Xem chi tiết
                                </button>

                                {currentUserId === (item.MaGVBienSoan?._id || item.MaGVBienSoan) && (
                                  <>
                                    <button className="btn btn-outline-dark px-3" onClick={() => navigate(`/them-cau-hoi?edit=${item._id}`)} title="Sửa câu hỏi">
                                      <i className="bi bi-pencil-square"></i>
                                    </button>
                                    <button className="btn btn-outline-danger px-3" onClick={() => handleDeleteItem(item._id, 'cauhoi')} title="Xóa câu hỏi">
                                      <i className="bi bi-trash3-fill"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5">
                    <i className="bi bi-inbox text-muted opacity-25 d-block mb-3" style={{ fontSize: '4rem' }}></i>
                    <h5 className="text-muted">Không tìm thấy kết quả nào.</h5>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center">
                  <ul className="pagination mb-0 shadow-sm rounded-pill overflow-hidden border-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link border-0 px-3 fw-bold" onClick={() => paginate(1)}>Đầu</button>
                    </li>
                    {getPageNumbers().map((number) => (
                      <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                        <button className={`page-link border-0 px-3 ${currentPage === number ? styles.activePage : ''}`} onClick={() => paginate(number)}>
                          {number}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link border-0 px-3 fw-bold" onClick={() => paginate(totalPages)}>Cuối</button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default ThuVien;