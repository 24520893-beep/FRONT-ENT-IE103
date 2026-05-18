// Đường dẫn file: src/utils/fetchClient.js

// Lấy URL từ biến môi trường (Vite), mặc định là localhost nếu không có
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// const BASE_URL = 'http://localhost:3000'; //dùng để test cloud storage cho nhanh

export const fetchClient = async (url, options = {}) => {
    // 0. Xử lý URL: Nếu là đường dẫn tương đối thì nối với BASE_URL
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    // 1. Tự động lấy token từ LocalStorage
    const token = localStorage.getItem('accessToken');
  
    // 2. Cấu hình Headers mặc định
    const headers = {
      'ngrok-skip-browser-warning': 'true',
      'Bypass-Tunnel-Reminder': 'true',
      ...options.headers,
    };
  
    // Tự động đính kèm Token nếu có
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  
    // Tự động thêm Content-Type là JSON (trừ trường hợp upload file bằng FormData)
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  
    // 3. Gọi API thực tế bằng fullUrl đã xử lý
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });
  
      // 4. Xử lý lỗi 401 (Hết hạn phiên) hoặc 403 (Không có quyền truy cập)
      if (response.status === 401 || response.status === 403) {
        console.warn("🔒 Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Đang chuyển hướng im lặng...");
        
        // Dọn dẹp rác trong LocalStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Điều hướng thẳng về trang đăng nhập (UX mượt mà, không dùng alert chặn luồng)
        window.location.href = '/dang-nhap';
        
        // CẮT ĐỨT PROMISE: Trả về reject để component gọi API không chạy tiếp lệnh .json() gây lỗi
        return Promise.reject(new Error("Unauthorized Access")); 
      }
  
      return response;
    } catch (error) {
      // Các lỗi khác như mất mạng, server sập...
      console.error("🌐 Lỗi kết nối fetchClient:", error);
      throw error;
    }
};