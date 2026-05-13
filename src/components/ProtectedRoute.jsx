import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Lấy token thực tế từ Local Storage
  const token = localStorage.getItem('accessToken');

  // Nếu không có token, chặn lại và đẩy về trang đăng nhập
  if (!token) {
    return <Navigate to="/dang-nhap" replace />;
  }

  // Nếu có token, cho phép truy cập.
  // Back-end và fetchClient sẽ đảm nhiệm việc kiểm tra token hợp lệ ở các Request API sau đó.
  return children;
};

export default ProtectedRoute;