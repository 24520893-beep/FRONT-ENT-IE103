import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

const AdminLayout = () => {
    const navigate = useNavigate();
    const [adminInfo, setAdminInfo] = useState(null);

    useEffect(() => {
        const verifyAdminSession = async () => {
            try {
                const response = await fetchClient('/api/nguoidung/me');
                if (response.ok) {
                    const data = await response.json();
                    if (data.VaiTro === 'HocSinh') {
                        alert("Bạn không có quyền truy cập khu vực quản trị!");
                        navigate('/');
                        return;
                    }
                    setAdminInfo(data);
                } else {
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
        { path: '/admin-dashboard/lotrinh', icon: 'bi-map', label: 'Quản lý Lộ trình' },
        // Thêm đường dẫn tới trang Quản lý giáo viên đã xóa
        { path: '/admin-dashboard/giaovien-daxoa', icon: 'bi-person-x-fill', label: 'Giáo viên đã xóa' }
    ];

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/dang-nhap');
    };

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

            <main className={styles.mainContent}>
                <Outlet context={{ adminInfo }} />
            </main>
        </div>
    );
};

export default AdminLayout;