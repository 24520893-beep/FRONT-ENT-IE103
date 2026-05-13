import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './ChiTietLoTrinh.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ChiTietLoTrinh = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [roadmap, setRoadmap] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUserRole(JSON.parse(savedUser).VaiTro);

        const fetchDetail = async () => {
            try {
                // Đã sửa: Dùng fetchClient thay vì fetch thuần
                const response = await fetchClient(`/api/lotrinhhoctap/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setRoadmap(data);
                }
            } catch (error) {
                console.error("Lỗi tải chi tiết:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // HÀM XỬ LÝ KHI CLICK VÀO NHIỆM VỤ
    const handleTaskAction = async (e, item, index, isActive, isLocked) => {
        e.preventDefault();
        
        // Nếu nhiệm vụ đang bị khóa (đối với học sinh) thì không làm gì cả
        if (isLocked) return;

        const isExam = item.LoaiNhiemVu === 'DeThiThu';
        const targetUrl = isExam ? `/phong-luyen/${item.MaThamChieu?._id}` : `/thu-vien/tai-lieu/${item.MaThamChieu?._id}`;

        // CHỐT CHẶN AN TOÀN: CHỈ TĂNG TIẾN ĐỘ NẾU NGƯỜI DÙNG LÀ HỌC SINH VÀ ĐANG Ở NHIỆM VỤ HIỆN TẠI
        if (userRole === 'HocSinh' && isActive && !isExam) {
            const totalTasks = roadmap.DanhSachNhiemVu.length;
            const newDoneCount = index + 1;
            const newPercentage = Math.round((newDoneCount / totalTasks) * 100);

            try {
                // Đã sửa: Dùng fetchClient để tự động cấu hình headers
                await fetchClient(`/api/lotrinhhoctap/${roadmap._id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        MucDoHoanThanh: newPercentage,
                        NhiemVuHoanThanh: newDoneCount
                    })
                });
            } catch (error) {
                console.error("Lỗi khi cập nhật tiến độ tài liệu:", error);
            }
        }
        
        // Điều hướng tới tài liệu/đề thi (Cho cả Học sinh và Giáo viên)
        navigate(targetUrl);
    };

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (!roadmap) return <div className="container py-5 text-center"><h5>Không tìm thấy lộ trình.</h5></div>;

    // TÍNH TOÁN SỐ NHIỆM VỤ ĐÃ HOÀN THÀNH TỪ PHẦN TRĂM
    const totalTasks = roadmap.DanhSachNhiemVu?.length || 0;
    const currentPercent = roadmap.MucDoHoanThanh || 0;
    const doneCount = Math.round((currentPercent * totalTasks) / 100);

    return (
        <div className="container py-4">
            {/* BREADCRUMB & BACK BUTTON */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/lo-trinh">Lộ trình</Link></li>
                    <li className="breadcrumb-item active">{roadmap.TenLoTrinh}</li>
                </ol>
            </nav>

            <div className="row g-4">
                {/* CỘT TRÁI: DANH SÁCH NHIỆM VỤ */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 p-4 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold mb-0">Nội dung học tập</h4>
                            <span className="badge bg-light text-dark border">{totalTasks} Nhiệm vụ</span>
                        </div>

                        <div className={styles.timeline}>
                            {roadmap.DanhSachNhiemVu?.map((item, index) => {
                                // XÁC ĐỊNH TRẠNG THÁI CỦA TỪNG NHIỆM VỤ
                                const isCompleted = index < doneCount;
                                const isActive = index === doneCount;
                                // Khóa bài chỉ áp dụng cho Học sinh
                                const isLocked = index > doneCount && userRole === 'HocSinh';

                                return (
                                    <div key={index} className={styles.timelineItem}>
                                        {/* Cột mốc Timeline (Giáo viên vẫn thấy được tiến độ của học sinh qua màu sắc) */}
                                        <div className={`${styles.timelineNumber} ${isCompleted ? 'bg-success text-white' : isLocked ? 'bg-secondary text-white opacity-50' : 'bg-main-orange text-white'}`}>
                                            {isCompleted ? <i className="bi bi-check-lg"></i> : isLocked ? <i className="bi bi-lock-fill"></i> : index + 1}
                                        </div>

                                        <div className={`card border-0 shadow-sm w-100 ${styles.taskCard} ${isLocked ? 'opacity-50 bg-light' : ''}`}>
                                            <div className="card-body d-flex align-items-center justify-content-between p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className={`${styles.iconBox} me-3 bg-light ${isCompleted ? 'text-success' : 'text-primary'}`}>
                                                        <i className={`bi ${item.LoaiNhiemVu === 'DeThiThu' ? 'bi-file-earmark-text' : 'bi-book'}`}></i>
                                                    </div>
                                                    <div>
                                                        <h6 className={`mb-1 fw-bold ${isLocked ? 'text-muted' : 'text-dark'}`}>
                                                            {item.MaThamChieu?.TenTaiLieu || item.MaThamChieu?.TenDeThi || "Nội dung học tập"}
                                                        </h6>
                                                        <span className="badge bg-light text-muted fw-normal">
                                                            {item.LoaiNhiemVu === 'DeThiThu' ? 'Đề thi thử' : 'Tài liệu học tập'}
                                                            {isCompleted && <span className="ms-2 text-success"><i className="bi bi-check-circle-fill me-1"></i>Đã hoàn thành</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* NÚT THAO TÁC ĐÃ ĐƯỢC PHÂN QUYỀN GIAO DIỆN */}
                                                <button 
                                                    onClick={(e) => handleTaskAction(e, item, index, isActive, isLocked)}
                                                    disabled={isLocked}
                                                    className={`btn btn-sm rounded-pill px-3 ${
                                                        userRole !== 'HocSinh' ? 'btn-outline-secondary fw-bold' : // Nút trung tính cho GV
                                                        isLocked ? 'btn-secondary disabled' : 
                                                        isCompleted ? 'btn-outline-success' : 
                                                        'btn-outline-primary fw-bold'
                                                    }`}
                                                >
                                                    {userRole !== 'HocSinh' ? (
                                                        <>Xem chi tiết <i className="bi bi-eye ms-1"></i></>
                                                    ) : isLocked ? (
                                                        <><i className="bi bi-lock me-1"></i> Chưa mở khóa</>
                                                    ) : isCompleted ? (
                                                        <><i className="bi bi-arrow-repeat me-1"></i> Xem lại</>
                                                    ) : item.LoaiNhiemVu === 'DeThiThu' ? (
                                                        <>Làm bài <i className="bi bi-pencil-square ms-1"></i></>
                                                    ) : (
                                                        <>Bắt đầu học <i className="bi bi-arrow-right ms-1"></i></>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: THÔNG TIN PHỤ */}
                <div className="col-lg-4">
                    {/* CARD TIẾN ĐỘ */}
                    <div className="card shadow-sm border-0 p-4 mb-4 bg-main-orange text-white">
                        <h5 className="fw-bold mb-3">Tiến độ của {userRole === 'HocSinh' ? 'bạn' : 'học sinh'}</h5>
                        <div className="d-flex align-items-center mb-2">
                            <h2 className="mb-0 fw-bold">{roadmap.MucDoHoanThanh || 0}%</h2>
                            <small className="ms-2 opacity-75">hoàn thành ({doneCount}/{totalTasks})</small>
                        </div>
                        <div className="progress bg-white bg-opacity-25" style={{ height: '10px' }}>
                            <div 
                                className="progress-bar bg-white" 
                                style={{ width: `${roadmap.MucDoHoanThanh || 0}%`, transition: 'width 0.5s ease-in-out' }}
                            ></div>
                        </div>
                    </div>

                    {/* CARD GIÁO VIÊN */}
                    <div className="card shadow-sm border-0 p-4 mb-4">
                        <h6 className="text-muted fw-bold mb-3">Giáo viên phụ trách</h6>
                        <div className="d-flex align-items-center">
                            <div className={styles.avatarCircle}>
                                <i className="bi bi-person-fill"></i>
                            </div>
                            <div className="ms-3">
                                <div className="fw-bold text-dark">{roadmap.MaGVPhuTrach?.HoTen || "Chưa xác định"}</div>
                                <div className="small text-muted">{roadmap.MonHoc}</div>
                            </div>
                        </div>
                    </div>

                    {/* CARD THÔNG TIN THÊM */}
                    <div className="card shadow-sm border-0 p-4">
                        <h6 className="text-muted fw-bold mb-3">Ghi chú lộ trình</h6>
                        <p className="small text-secondary mb-0">
                            {roadmap.GhiChu || "Không có ghi chú nào cho lộ trình này."}
                        </p>
                    </div>

                    {/* NÚT ĐIỀU KHIỂN DÀNH CHO GV */}
                    {(userRole === 'GiaoVien' || userRole === 'QuanTriVien') && (
                        <div className="mt-4 d-grid gap-2">
                            <button 
                                className="btn btn-dark shadow-sm"
                                onClick={() => navigate(`/them-lo-trinh?edit=${roadmap._id}`)}
                            >
                                <i className="bi bi-pencil-square me-2"></i>Chỉnh sửa lộ trình
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChiTietLoTrinh;