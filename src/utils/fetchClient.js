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
  
      // 4. Xử lý lỗi 401 (Hết hạn phiên đăng nhập)
      if (response.status === 401) {
        console.warn("🔒 Phiên đăng nhập đã hết hạn. Đang đăng xuất...");
        
        // Dọn dẹp rác trong LocalStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Thông báo cho người dùng
        alert("Phiên đăng nhập của bạn đã kết thúc. Vui lòng đăng nhập lại!");
        
        // Điều hướng thẳng về trang đăng nhập
        window.location.href = '/dang-nhap';
        
        return response; // Trả về để tránh rơi vào catch lỗi mạng không cần thiết
      }
  
      return response;
    } catch (error) {
      // Các lỗi khác như mất mạng, server sập...
      console.error("🌐 Lỗi kết nối fetchClient:", error);
      throw error;
    }
};