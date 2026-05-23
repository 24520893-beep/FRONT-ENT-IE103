// src/utils/fetchClient.js - FIX: Tách xử lý 401 và 403

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// const BASE_URL = 'http://localhost:3000'; // chạy và test nhanh

export const fetchClient = async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const token = localStorage.getItem('accessToken');
  
    const headers = {
      'ngrok-skip-browser-warning': 'true',
      'Bypass-Tunnel-Reminder': 'true',
      ...options.headers,
    };
  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  
    try {
      const response = await fetch(fullUrl, { ...options, headers });
  
      // CHỈ logout khi 401 (token hết hạn / không hợp lệ)
      if (response.status === 401) {
        console.warn("🔒 Token hết hạn. Đang chuyển về đăng nhập...");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/dang-nhap';
        return Promise.reject(new Error("Unauthorized"));
      }

      // 403 = thiếu quyền -> trả về response bình thường, để component tự xử lý
      // KHÔNG logout, KHÔNG redirect
  
      return response;
    } catch (error) {
      console.error("🌐 Lỗi kết nối fetchClient:", error);
      throw error;
    }
};