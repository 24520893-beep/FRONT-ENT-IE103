import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Lấy token thực tế từ Local Storage
  const token = localStorage.getItem('accessToken');

  // Nếu không có token, chặn lại và đẩy về trang đăng nhập
  if (!token) {
    return <Navigate to="/dang-nhap" replace />;
  }

  // Nếu CÓ token, dùng thẻ <Outlet /> để render các trang con bên trong (PhongLuyen, LoTrinh...)
  return <Outlet />;
};

export default ProtectedRoute;