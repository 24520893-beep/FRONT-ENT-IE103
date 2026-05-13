import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './ChiTietTaiLieu.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ChiTietTaiLieu = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setCurrentUserId(JSON.parse(savedUser)._id);
        }

        const fetchDetail = async () => {
            try {
                // Đã sửa: Sử dụng fetchClient cho API lấy chi tiết
                const res = await fetchClient(`/api/tailieuhoctap/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setDocument(data);
                } else {
                    alert("Không tìm thấy tài liệu này!");
                    navigate('/thu-vien');
                }
            } catch (error) {
                console.error("Lỗi tải chi tiết tài liệu:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    const getStatusBadge = (status) => {
        if (status === 'Đã xuất bản' || status === 'Hoàn thiện') return 'bg-success';
        if (status === 'Đã từ chối' || status === 'Từ chối') return 'bg-danger';
        return 'bg-warning text-dark';
    };

    if (isLoading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-main-orange" role="status"></div>
            <p className="mt-2 text-muted">Đang tải tài liệu...</p>
        </div>
    );

    if (!document) return <div className="container py-5 text-center">Tài liệu không tồn tại.</div>;

    return (
        <main className={styles.pageDetail}>
            {/* BREADCRUMB - ĐƯỜNG DẪN */}
            <nav className="bg-light py-3 border-bottom mb-4">
                <div className="container">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><Link to="/thu-vien">Thư viện</Link></li>
                        <li className="breadcrumb-item active text-truncate" aria-current="page">{document.TenTaiLieu}</li>
                    </ol>
                </div>
            </nav>

            <div className="container mb-5">
                <div className="row g-4">
                    {/* CỘT TRÁI: KHUNG XEM TÀI LIỆU (PREVIEW) */}
                    <div className="col-12 col-lg-8">
                        <div className={`card shadow-sm border-0 ${styles.previewCard}`}>
                            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0 text-dark">Nội dung tài liệu</h5>
                                <span className="badge bg-secondary">{document.DinhDang}</span>
                            </div>
                            <div className={`card-body p-0 ${styles.previewBody}`}>
                                {document.DinhDang === 'PDF' ? (
                                    <iframe 
                                        src={`${document.DuongDan}#toolbar=0`} 
                                        title={document.TenTaiLieu}
                                        className={styles.pdfIframe}
                                    ></iframe>
                                ) : document.DinhDang === 'VIDEO' ? (
                                    <video controls className="w-100 h-100">
                                        <source src={document.DuongDan} type="video/mp4" />
                                        Trình duyệt của bạn không hỗ trợ xem video.
                                    </video>
                                ) : (
                                    <div className="p-5 text-center">
                                        <i className="bi bi-file-earmark-arrow-down display-1 text-muted"></i>
                                        <p className="mt-3">Định dạng này không hỗ trợ xem trực tuyến.</p>
                                        <a href={document.DuongDan} className="btn btn-primary px-4">Tải về máy</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
                    <div className="col-12 col-lg-4">
                        <div className="card shadow-sm border-0 p-4 mb-4">
                            <h4 className="fw-bold text-dark mb-3 lh-base">{document.TenTaiLieu}</h4>
                            
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <span className={`badge ${getStatusBadge(document.TrangThai)}`}>
                                    {document.TrangThai}
                                </span>
                                <span className="text-muted small">•</span>
                                <span className="text-muted small">{new Date(document.NgayTao).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <hr className="opacity-10" />

                            <div className="info-list mt-3">
                                <div className="mb-3">
                                    <label className="text-muted small d-block">Môn học</label>
                                    <span className="fw-bold text-main-orange fs-5">{document.MonHoc}</span>
                                </div>

                                <div className="mb-3">
                                    <label className="text-muted small d-block mb-1">Giáo viên đăng tải</label>
                                    <div className="d-flex align-items-center">
                                        <div className={styles.avatarMini}>
                                            {document.MaGVDangTai?.HoTen?.charAt(0) || 'G'}
                                        </div>
                                        <span className="ms-2 fw-medium">{document.MaGVDangTai?.HoTen || "Đang cập nhật"}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="text-muted small d-block mb-2">Nhãn phân loại</label>
                                    <div className="d-flex flex-wrap gap-1">
                                        {document.DanhSachNhanDan?.map((tag, i) => (
                                            <span key={i} className="badge bg-light text-dark border fw-normal">
                                                #{tag.TenNhanDan}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 d-grid gap-2">
                                <a href={document.DuongDan} download className="btn btn-main-orange text-white fw-bold py-2 shadow-sm">
                                    <i className="bi bi-download me-2"></i>Tải tài liệu về
                                </a>
                                
                                {/* NÚT CHỈ DÀNH CHO CHỦ SỞ HỮU */}
                                {currentUserId === document.MaGVDangTai?._id && (
                                    <button 
                                      className="btn btn-outline-dark fw-bold py-2"
                                      onClick={() => navigate(`/them-tai-lieu?edit=${document._id}`)}
                                    >
                                        <i className="bi bi-pencil-square me-2"></i>Chỉnh sửa tài liệu
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* CARD GỢI Ý HÀNH ĐỘNG */}
                        <div className="card shadow-sm border-0 bg-dark text-white p-4">
                            <h6 className="fw-bold mb-2">Bạn có thắc mắc về tài liệu này?</h6>
                            <p className="small opacity-75 mb-3">Hãy đặt câu hỏi cho Trợ lý AI để được giải đáp ngay lập tức.</p>
                            <button className="btn btn-sm btn-outline-light w-100" onClick={() => navigate('/ho-tro')}>
                                Nhắn tin với AI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ChiTietTaiLieu;