import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import người gác cổng
import ProtectedRoute from './components/ProtectedRoute';

import Header from './components/Header';
import Footer from './components/Footer'; 
import AIChat from './components/AIChat';

// Import các trang
import Home from './pages/Home/Home';
import GioiThieu from './pages/GioiThieu/GioiThieu';
import GiaoVien from './pages/NguoiDung/GiaoVien';
import PhongLuyen from './pages/PhongLuyen/PhongLuyen';
import HoTro from './pages/HoTro/HoTro';
import ThuVien from './pages/ThuVien/ThuVien';
import LoTrinh from './pages/LoTrinh/LoTrinh';
import DangKy from './pages/NguoiDung/DangKy';
import DangNhap from './pages/NguoiDung/DangNhap';
import ThongTinCaNhan from './pages/NguoiDung/ThongTinCaNhan';
import ThemTaiLieu from './pages/ThuVien/ThemTaiLieu';
import ThemDeThi from './pages/PhongLuyen/ThemDeThi';
import ThemLoTrinh from './pages/LoTrinh/ThemLoTrinh';
import ThemGiaoVien from './pages/NguoiDung/ThemGiaoVien';
import ThemCauHoi from './pages/ThuVien/ThemCauHoi';
import ChiTietLoTrinh from './pages/LoTrinh/ChiTietLoTrinh';
import AdminLayout from './pages/Admin/AdminLayout';
import DashboardOverview from './pages/Admin/DashboardOverview';
import QuanLyTaiLieu from './pages/Admin/QuanLyTaiLieu';
import QuanLyDeThi from './pages/Admin/QuanLyDeThi';
import ChiTietTaiLieu from './pages/ThuVien/ChiTietTaiLieu';
import ChiTietCauHoi from './pages/ThuVien/ChiTietCauHoi';
import LamBaiThi from './pages/PhongLuyen/LamBaiThi';
import ThungRac from './pages/ThungRac/ThungRac';
import KetQuaThi from './pages/KetQuaThi/KetQuaThi';
import GiaoVienDaXoa from './pages/Admin/GiaoVienDaXoa';
import ThongKeThiThu from './pages/KetQuaThi/ThongKeThiThu';

import './App.css';
import QuanLyCauHoi from './pages/Admin/QuanLyCauHoi';
import QuanLyLoTrinh from './pages/Admin/QuanLyLoTrinh';
import XemBaiLam from './pages/PhongLuyen/XemBaiLam';

function App() {
  return (
    <Router>
      <Header />
      
      <Routes>
        {/* Khai báo Route cho tất cả các trang đã import */}
        <Route path="/" element={<Home />} />
        <Route path="/gioi-thieu" element={<GioiThieu />} />
        <Route path="/giao-vien" element={<GiaoVien />} />
        <Route path="/phong-luyen" element={<PhongLuyen />} />
        <Route path="/them-tai-lieu" element={<ThemTaiLieu />} />
        <Route path="/them-de-thi" element={<ThemDeThi />} />
        <Route path="/them-lo-trinh" element={<ThemLoTrinh />} />
        <Route path="/them-giao-vien" element={<ThemGiaoVien />} />
        <Route path="/them-cau-hoi" element={<ThemCauHoi />} />      
        <Route path="/lo-trinh/:id" element={<ChiTietLoTrinh />} />
        <Route path="/ho-tro" element={<HoTro />} />
        <Route path="/lo-trinh" element={<LoTrinh />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/phong-luyen/:id" element={<LamBaiThi />} />
        <Route path="/thung-rac" element={<ThungRac />} />
        <Route path="/ket-qua-thi" element={<KetQuaThi />} />
        <Route path="/ket-qua-thi/:id" element={<XemBaiLam />} />
        <Route path="/thong-ke" element={<ThongKeThiThu />} />

        <Route path="/thu-vien">
          {/* Trang chính: /thu-vien */}
          <Route index element={<ThuVien />} /> 
          
          {/* Trang chi tiết: /thu-vien/tai-lieu/:id */}
          <Route path="tai-lieu/:id" element={<ChiTietTaiLieu />} />
          
          <Route path="cau-hoi/:id" element={<ChiTietCauHoi />} /> 
        </Route>


        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="tailieu" element={<QuanLyTaiLieu />} />
          <Route path="dethi" element={<QuanLyDeThi />} />
          <Route path="cauhoi" element={<QuanLyCauHoi />} />
          <Route path="lotrinh" element={<QuanLyLoTrinh />} />
          <Route path="giaovien-daxoa" element={<GiaoVienDaXoa />} />

        </Route>

        {/* ROUTE BỊ RÀNG BUỘC: Chỉ vào được khi đã đăng nhập */}
        <Route 
          path="/thong-tin-ca-nhan" 
          element={
            <ProtectedRoute>
              <ThongTinCaNhan />
            </ProtectedRoute>
          } 
        />
      </Routes>

      <Footer />
      <AIChat />
    </Router>
  );
}

export default App;