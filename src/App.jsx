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
import PhanTichHocTap from './pages/NguoiDung/PhanTichHocTap';
import HocSinhSaSut from './pages/NguoiDung/HocSinhSaSut';
import QuanLyCanhBao from './pages/Admin/QuanLyCanhBao';
import QuanLyCauHoi from './pages/Admin/QuanLyCauHoi';
import QuanLyLoTrinh from './pages/Admin/QuanLyLoTrinh';
import XemBaiLam from './pages/PhongLuyen/XemBaiLam';
import TienDoLoTrinh from './pages/NguoiDung/TienDoLoTrinh';

import './App.css';

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        {/* ==========================================
            CÁC TRANG PUBLIC (Chỉ 5 trang được mở tự do)
            ========================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/gioi-thieu" element={<GioiThieu />} />
        <Route path="/giao-vien" element={<GiaoVien />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/dang-nhap" element={<DangNhap />} />

        {/* ==========================================
            CÁC TRANG PRIVATE (Bắt buộc đăng nhập)
            ========================================== */}
        <Route element={<ProtectedRoute />}>
          
          {/* CÁC TRANG CHÍNH NAY ĐÃ CHUYỂN THÀNH PRIVATE */}
          <Route path="/phong-luyen" element={<PhongLuyen />} />
          <Route path="/phong-luyen/:id" element={<LamBaiThi />} />
          <Route path="/thu-vien" element={<ThuVien />} />
          <Route path="/thu-vien/tai-lieu/:id" element={<ChiTietTaiLieu />} />
          <Route path="/thu-vien/cau-hoi/:id" element={<ChiTietCauHoi />} />
          <Route path="/lo-trinh" element={<LoTrinh />} />
          <Route path="/lo-trinh/:id" element={<ChiTietLoTrinh />} />
          <Route path="/ho-tro" element={<HoTro />} />

          {/* CÁC TRANG CÁ NHÂN / BÁO CÁO */}
          <Route path="/thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
          <Route path="/ket-qua-thi" element={<KetQuaThi />} />
          <Route path="/ket-qua-thi/:id" element={<XemBaiLam />} />
          <Route path="/thong-ke" element={<ThongKeThiThu />} />
          <Route path="/phan-tich-hoc-tap" element={<PhanTichHocTap />} />
          <Route path="/hoc-sinh-sa-sut" element={<HocSinhSaSut />} />
          <Route path="/quan-ly-canh-bao" element={<QuanLyCanhBao />} />
          <Route path="/tiendo-lotrinh" element={<TienDoLoTrinh />} />

          {/* CÁC TRANG THÊM MỚI DỮ LIỆU */}
          <Route path="/them-tai-lieu" element={<ThemTaiLieu />} />
          <Route path="/them-de-thi" element={<ThemDeThi />} />
          <Route path="/them-lo-trinh" element={<ThemLoTrinh />} />
          <Route path="/them-giao-vien" element={<ThemGiaoVien />} />
          <Route path="/them-cau-hoi" element={<ThemCauHoi />} />
          <Route path="/thung-rac" element={<ThungRac />} />

          {/* CÁC TRANG ADMIN */}
          <Route path="/admin-dashboard" element={<AdminLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="tailieu" element={<QuanLyTaiLieu />} />
            <Route path="dethi" element={<QuanLyDeThi />} />
            <Route path="cauhoi" element={<QuanLyCauHoi />} />
            <Route path="lotrinh" element={<QuanLyLoTrinh />} />
            <Route path="giaovien-daxoa" element={<GiaoVienDaXoa />} />
          </Route>
          
        </Route>
      </Routes>

      <Footer />
      <AIChat />
    </Router>
  );
}

export default App;