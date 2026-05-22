import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './ChiTietTaiLieu.module.css';
import { fetchClient } from '../../utils/fetchClient';

const ChiTietTaiLieu = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [documentData, setDocumentData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setCurrentUserId(JSON.parse(savedUser)._id);
        }

        const fetchDetail = async () => {
            try {
                const res = await fetchClient(`/api/tailieuhoctap/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setDocumentData(data);
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

    // HÀM TẢI FILE TỪ CLOUDINARY VỀ MÁY
    const handleDownload = async (url, filename) => {
        setIsDownloading(true);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'Tai_lieu_HOCMOI.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Lỗi khi tải file:", error);
            // Fallback: Mở tab mới để tải nếu fetch bị lỗi mạng
            window.open(url, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

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

    if (!documentData) return <div className="container py-5 text-center">Tài liệu không tồn tại.</div>;

    const isPDF = documentData.DinhDang === 'PDF';
    const isVideo = documentData.DinhDang === 'VIDEO' || documentData.DinhDang === 'MP4';

    return (
        <main className={styles.pageDetail}>
            <nav className="bg-light py-3 border-bottom mb-4">
                <div className="container">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><Link to="/thu-vien">Thư viện</Link></li>
                        <li className="breadcrumb-item active text-truncate" aria-current="page">{documentData.TenTaiLieu}</li>
                    </ol>
                </div>
            </nav>

            <div className="container mb-5">
                <div className="row g-4">
                    {/* CỘT TRÁI: KHUNG XEM TÀI LIỆU (PREVIEW) */}
                    <div className="col-12 col-lg-8">
                        <div className={`card shadow-sm border-0 overflow-hidden`}>
                            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0 text-dark">Nội dung tài liệu</h5>
                                <span className="badge bg-secondary">{documentData.DinhDang}</span>
                            </div>
                            <div className={`card-body p-0 bg-light`}>
                                {isPDF ? (
                                    /* DÙNG THẺ OBJECT NATIVE CỦA TRÌNH DUYỆT - Sạch sẽ và mượt nhất */
                                    <object
                                        data={`${documentData.DuongDan}#toolbar=0`}
                                        type="application/pdf"
                                        className="w-100 border-0"
                                        style={{ minHeight: '80vh', display: 'block' }}
                                    >
                                        <div className="p-5 text-center">
                                            <p>Trình duyệt của bạn không hỗ trợ xem trực tiếp PDF.</p>
                                            <button
                                                onClick={() => handleDownload(documentData.DuongDan, `${documentData.TenTaiLieu}.pdf`)}
                                                className="btn btn-primary"
                                            >
                                                Tải file về máy để xem
                                            </button>
                                        </div>
                                    </object>
                                ) : isVideo ? (
                                    <video controls className="w-100 bg-black" style={{ maxHeight: '80vh' }}>
                                        <source src={documentData.DuongDan} type="video/mp4" />
                                        Trình duyệt của bạn không hỗ trợ xem video.
                                    </video>
                                ) : (
                                    <div className="p-5 text-center d-flex flex-column justify-content-center" style={{ minHeight: '50vh' }}>
                                        <i className="bi bi-file-earmark-arrow-down display-1 text-muted mb-3"></i>
                                        <h5>Không hỗ trợ xem trước định dạng này</h5>
                                        <p className="text-muted">Vui lòng tải tài liệu về máy để xem nội dung chi tiết.</p>
                                        <div>
                                            <button
                                                onClick={() => handleDownload(documentData.DuongDan, `${documentData.TenTaiLieu}.${documentData.DinhDang.toLowerCase()}`)}
                                                className="btn btn-primary px-4 mt-2"
                                                disabled={isDownloading}
                                            >
                                                {isDownloading ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang xử lý...</> : <><i className="bi bi-download me-2"></i>Tải về máy</>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
                    <div className="col-12 col-lg-4">
                        <div className="card shadow-sm border-0 p-4 mb-4">
                            <h4 className="fw-bold text-dark mb-3 lh-base">{documentData.TenTaiLieu}</h4>

                            <div className="d-flex align-items-center gap-2 mb-4">
                                <span className={`badge ${getStatusBadge(documentData.TrangThai)}`}>
                                    {documentData.TrangThai}
                                </span>
                                <span className="text-muted small">•</span>
                                <span className="text-muted small">{new Date(documentData.NgayTao).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <hr className="opacity-10" />

                            <div className="info-list mt-3">
                                <div className="mb-3">
                                    <label className="text-muted small d-block">Môn học</label>
                                    <span className="fw-bold text-main-orange fs-5">
                                        {documentData.MonHoc || "Đánh giá năng lực (Tổng hợp)"}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <label className="text-muted small d-block mb-1">Giáo viên đăng tải</label>
                                    <div className="d-flex align-items-center">
                                        <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
                                            {documentData.MaGVDangTai?.HoTen?.charAt(0) || 'G'}
                                        </div>
                                        <span className="ms-2 fw-medium">{documentData.MaGVDangTai?.HoTen || "Đang cập nhật"}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="text-muted small d-block mb-2">Nhãn phân loại</label>
                                    <div className="d-flex flex-wrap gap-1">
                                        {documentData.DanhSachNhanDan?.length > 0 ? documentData.DanhSachNhanDan.map((tag, i) => (
                                            <span key={i} className="badge bg-light text-dark border fw-normal">
                                                #{tag.TenNhanDan || tag}
                                            </span>
                                        )) : <span className="text-muted small">Không có nhãn</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 d-grid gap-2">
                                <button
                                    onClick={() => handleDownload(documentData.DuongDan, `${documentData.TenTaiLieu}.${documentData.DinhDang.toLowerCase()}`)}
                                    className="btn btn-main-orange text-white fw-bold py-2 shadow-sm"
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Đang tải về...</>
                                    ) : (
                                        <><i className="bi bi-download me-2"></i>Tải tài liệu về</>
                                    )}
                                </button>

                                {currentUserId === documentData.MaGVDangTai?._id && (
                                    <button
                                        className="btn btn-outline-dark fw-bold py-2"
                                        onClick={() => navigate(`/them-tai-lieu?edit=${documentData._id}`)}
                                    >
                                        <i className="bi bi-pencil-square me-2"></i>Chỉnh sửa tài liệu
                                    </button>
                                )}
                            </div>
                        </div>

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