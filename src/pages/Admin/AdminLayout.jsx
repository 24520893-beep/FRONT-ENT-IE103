import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const AdminLayout = () => {
    const navigate = useNavigate();
    const [adminInfo, setAdminInfo] = useState(null);

    useEffect(() => {
        const verifyAdminSession = async () => {
            try {
                // Đã sửa: Tận dụng fetchClient với đường dẫn tương đối
                const response = await fetchClient('/api/nguoidung/me');
                
                // Lưu ý: Nếu response.status là 401, fetchClient đã tự chuyển hướng về /dang-nhap
                if (response.ok) {
                    const data = await response.json();
                    
                    // 2. Kiểm tra quyền hạn (Role-based Access Control)
                    if (data.VaiTro === 'HocSinh') {
                        alert("Bạn không có quyền truy cập khu vực quản trị!");
                        navigate('/');
                        return;
                    }
                    setAdminInfo(data);
                } else {
                    // Xử lý các lỗi khác ngoài 401 (ví dụ 403, 500)
                    console.error("Không thể xác thực quyền Admin.");
                    navigate('/dang-nhap');
                }
            } catch (error) {
                console.error("Lỗi kết nối API xác thực:", error);
            }
        };

        verifyAdminSession();
    }, [navigate]);

    const menuItems = [
        { path: '/admin-dashboard', icon: 'bi-speedometer2', label: 'Dashboard Tổng quan', end: true },
        { path: '/admin-dashboard/tailieu', icon: 'bi-journal-text', label: 'Quản lý Tài liệu' },
        { path: '/admin-dashboard/dethi', icon: 'bi-file-earmark-text', label: 'Quản lý Đề thi' },
        { path: '/admin-dashboard/cauhoi', icon: 'bi-patch-question', label: 'Quản lý Câu hỏi' },
        { path: '/admin-dashboard/lotrinh', icon: 'bi-map', label: 'Quản lý Lộ trình' }
    ];

    const handleLogout = () => {
        // 3. Đồng bộ hóa việc dọn dẹp với logic trong fetchClient
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/dang-nhap');
    };

    // Nếu chưa lấy được thông tin admin, có thể hiển thị loading để tránh "nháy" UI
    if (!adminInfo) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <div className="spinner-border text-main-orange" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.adminLayout}>
            {/* SIDEBAR */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h4 className="fw-bold text-main-orange mb-0">HOCMOI Admin</h4>
                    <div className="text-muted small mt-1">
                        <i className="bi bi-person-check me-1"></i>
                        {adminInfo.HoTen}
                    </div>
                </div>

                <div className={styles.sidebarMenu}>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => 
                                `${styles.menuItem} text-decoration-none ${isActive ? styles.active : ''}`
                            }
                        >
                            <i className={`bi ${item.icon} me-3`}></i>{item.label}
                        </NavLink>
                    ))}
                </div>

                <div className={styles.sidebarFooter}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <i className="bi bi-box-arrow-left me-2"></i>Đăng xuất
                    </button>
                </div>
            </aside>

            {/* NỘI DUNG CHÍNH */}
            <main className={styles.mainContent}>
                <Outlet context={{ adminInfo }} />
            </main>
        </div>
    );
};

export default AdminLayout;