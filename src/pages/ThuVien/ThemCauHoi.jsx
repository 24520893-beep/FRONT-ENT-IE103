import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from './ThemCauHoi.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ThemCauHoi = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Bắt tham số ?edit=id từ URL
    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('edit');
    const isEditMode = !!editId;

    // 1. STATE CHUNG
    const [loaiCauHoi, setLoaiCauHoi] = useState('TracNghiem');
    const [noiDung, setNoiDung] = useState('');
    const [monHoc, setMonHoc] = useState('');
    const [doKho, setDoKho] = useState('Nhận biết'); 
    const [chuyenDe, setChuyenDe] = useState('');

    // 2. STATE CHI TIẾT CHO TỪNG LOẠI
    const [luaChon, setLuaChon] = useState(['', '', '', '']); // Dùng chung cho Trắc nghiệm & Đúng/Sai
    const [dapAnDung, setDapAnDung] = useState(''); // Điền khuyết & Trắc nghiệm
    const [dapAnGoiY, setDapAnGoiY] = useState(''); // Tự luận

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode); 
    const [userRole, setUserRole] = useState('');

    // 3. EFFECT: TẢI DỮ LIỆU CŨ KHI CHỈNH SỬA
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setUserRole(user.VaiTro);
            if (user.VaiTro === 'GiaoVien' && !isEditMode) {
                setMonHoc(user.MonHoc || '');
            }
        }

        if (isEditMode) {
            const fetchOldData = async () => {
                try {
                    // Đã sửa: Dùng fetchClient để lấy dữ liệu câu hỏi cũ
                    const res = await fetchClient(`/api/cauhoi/${editId}`);
                    
                    if (res.ok) {
                        const data = await res.json();
                        setLoaiCauHoi(data.LoaiCauHoi || 'TracNghiem');
                        setNoiDung(data.NoiDungCauHoi || '');
                        setMonHoc(data.MonHoc || '');
                        setDoKho(data.DoKho || 'Nhận biết');
                        setChuyenDe(data.ChuyenDe || '');

                        // MAP DỮ LIỆU CŨ VÀO STATE DỰA TRÊN SCHEMA MỚI
                        if (data.LoaiCauHoi === 'TracNghiem') {
                            setLuaChon(Array.isArray(data.DanhSachLuaChon) && data.DanhSachLuaChon.length === 4 ? data.DanhSachLuaChon : ['', '', '', '']);
                            setDapAnDung(data.DapAnChinhXac || '');
                        } 
                        else if (data.LoaiCauHoi === 'DungSai') {
                            // Schema chuẩn: ["Đúng", "Sai", "Đúng", "Sai"]
                            setLuaChon(Array.isArray(data.DanhSachLuaChon) && data.DanhSachLuaChon.length === 4 ? data.DanhSachLuaChon : ['Đúng', 'Đúng', 'Đúng', 'Đúng']);
                        } 
                        else if (data.LoaiCauHoi === 'DienKhuyet') {
                            setDapAnDung(data.DapAnChinhXac || '');
                        } 
                        else if (data.LoaiCauHoi === 'TuLuan') {
                            setDapAnGoiY(data.DapAnGoiY || '');
                        }
                    } else {
                        alert("Không tìm thấy câu hỏi để chỉnh sửa!");
                        navigate('/thu-vien');
                    }
                } catch (error) {
                    console.error("Lỗi lấy dữ liệu:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchOldData();
        } else {
            setIsLoading(false);
        }
    }, [editId, isEditMode, navigate]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...luaChon];
        newOptions[index] = value;
        setLuaChon(newOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!monHoc) {
            alert("Vui lòng cập nhật môn học trước khi lưu câu hỏi!");
            return;
        }

        setIsSubmitting(true);
        
        const payload = {
            LoaiCauHoi: loaiCauHoi,
            NoiDungCauHoi: noiDung,
            MonHoc: monHoc,
            DoKho: doKho,
            ChuyenDe: chuyenDe,
            TrangThai: 'Đang kiểm duyệt' 
        };

        // Gắn thêm dữ liệu tùy theo loại câu hỏi
        if (loaiCauHoi === 'TracNghiem') {
            payload.DanhSachLuaChon = luaChon;
            payload.DapAnChinhXac = dapAnDung;
        } else if (loaiCauHoi === 'DungSai') {
            payload.DanhSachLuaChon = luaChon;
            payload.DapAnChinhXac = ""; 
        } else if (loaiCauHoi === 'DienKhuyet') {
            payload.DanhSachLuaChon = [];
            payload.DapAnChinhXac = dapAnDung;
        } else if (loaiCauHoi === 'TuLuan') {
            payload.DanhSachLuaChon = [];
            payload.DapAnChinhXac = "";
            payload.DapAnGoiY = dapAnGoiY;
        }

        try {
            // Đã sửa: Dùng fetchClient để POST/PUT lên server
            const url = isEditMode ? `/api/cauhoi/${editId}` : '/api/cauhoi';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetchClient(url, {
                method: method,
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert(`Đã ${isEditMode ? 'cập nhật' : 'thêm'} câu hỏi thành công!`);
                navigate('/thu-vien'); 
            } else {
                const errorData = await response.json();
                alert(`Lỗi: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Lỗi khi gửi dữ liệu:", error);
            alert("Lỗi kết nối server!");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container py-4">
            <h1 className={styles.pageTitle}>
                {isEditMode ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới'}
            </h1>
            <p className="text-muted">
                {isEditMode ? 'Chỉnh sửa nội dung và gửi lại yêu cầu kiểm duyệt.' : 'Biên soạn nội dung câu hỏi cho kho học liệu.'}
            </p>

            <form onSubmit={handleSubmit}>
                <div className="card shadow-sm border-0 mb-4 mt-3">
                    <div className="card-body p-4">
                        <h5 className="mb-4 fw-bold border-bottom pb-2">Cấu hình chung</h5>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label fw-bold">Loại câu hỏi</label>
                                <select 
                                    className="form-select shadow-none" 
                                    value={loaiCauHoi} 
                                    onChange={(e) => setLoaiCauHoi(e.target.value)}
                                    disabled={isEditMode} // Không cho phép đổi dạng câu khi sửa
                                >
                                    <option value="TracNghiem">Trắc nghiệm (4 lựa chọn)</option>
                                    <option value="DungSai">Đúng / Sai</option>
                                    <option value="DienKhuyet">Điền khuyết</option>
                                    <option value="TuLuan">Tự luận</option>
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Môn học</label>
                                <input 
                                    type="text" 
                                    className="form-control shadow-none bg-light" 
                                    placeholder="VD: Vật lý" 
                                    value={monHoc} 
                                    onChange={(e) => setMonHoc(e.target.value)}
                                    disabled={userRole === 'GiaoVien' || isEditMode} 
                                    required 
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Độ khó</label>
                                <select className="form-select shadow-none" value={doKho} onChange={(e) => setDoKho(e.target.value)}>
                                    <option value="Nhận biết">Nhận biết</option>
                                    <option value="Thông hiểu">Thông hiểu</option>
                                    <option value="Vận dụng">Vận dụng</option>
                                    <option value="Vận dụng cao">Vận dụng cao</option>
                                </select>
                            </div>

                            <div className="col-md-12">
                                <label className="form-label fw-bold">Chuyên đề / Bài học</label>
                                <input 
                                    type="text" 
                                    className="form-control shadow-none" 
                                    placeholder="VD: Di truyền học Mendeln" 
                                    value={chuyenDe} 
                                    onChange={(e) => setChuyenDe(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <h5 className="mb-4 fw-bold border-bottom pb-2">Nội dung câu hỏi</h5>
                        
                        {loaiCauHoi === 'DungSai' && (
                            <div className="alert alert-info py-2 small">
                                <i className="bi bi-info-circle me-2"></i>Với câu hỏi <b>Đúng/Sai</b>, bạn hãy gõ toàn bộ đề bài và cả 4 phát biểu (a, b, c, d) vào ô bên dưới.
                            </div>
                        )}

                        <textarea 
                            className="form-control mb-3 shadow-none" 
                            rows="4" 
                            placeholder="Nhập nội dung đề bài tại đây..." 
                            value={noiDung} 
                            onChange={(e) => setNoiDung(e.target.value)}
                            required
                        ></textarea>

                        {/* 1. TRẮC NGHIỆM */}
                        {loaiCauHoi === 'TracNghiem' && (
                            <div className="mt-4">
                                <label className="form-label fw-bold text-primary">Các phương án lựa chọn:</label>
                                {['A', 'B', 'C', 'D'].map((label, idx) => (
                                    <div key={label} className="input-group mb-2">
                                        <span className="input-group-text fw-bold">{label}</span>
                                        <input 
                                            type="text" 
                                            className="form-control shadow-none" 
                                            placeholder={`Nội dung lựa chọn ${label}`}
                                            value={luaChon[idx] || ''}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            required
                                        />
                                        <div className="input-group-text bg-white" title="Đánh dấu đáp án đúng">
                                            <input 
                                                className="form-check-input mt-0" 
                                                type="radio" 
                                                name="correctRadio" 
                                                checked={dapAnDung === label}
                                                onChange={() => setDapAnDung(label)} 
                                                required
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. ĐÚNG SAI (SCHEMA MỚI) */}
                        {loaiCauHoi === 'DungSai' && (
                            <div className="mt-4">
                                <label className="form-label fw-bold text-primary">Cài đặt đáp án cho 4 phát biểu:</label>
                                {['Phát biểu a', 'Phát biểu b', 'Phát biểu c', 'Phát biểu d'].map((label, idx) => (
                                    <div key={label} className="input-group mb-2" style={{maxWidth: '300px'}}>
                                        <span className="input-group-text fw-bold flex-grow-1">{label}</span>
                                        <select 
                                            className="form-select shadow-none" 
                                            value={luaChon[idx] || 'Đúng'}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        >
                                            <option value="Đúng">Đúng</option>
                                            <option value="Sai">Sai</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 3. ĐIỀN KHUYẾT */}
                        {loaiCauHoi === 'DienKhuyet' && (
                            <div className="mt-4">
                                <label className="form-label fw-bold text-primary">Từ khóa cần điền:</label>
                                <input 
                                    type="text" 
                                    className="form-control shadow-none" 
                                    placeholder="Nhập đáp án chính xác..." 
                                    value={dapAnDung} 
                                    onChange={(e) => setDapAnDung(e.target.value)} 
                                    required 
                                />
                            </div>
                        )}

                        {/* 4. TỰ LUẬN */}
                        {loaiCauHoi === 'TuLuan' && (
                            <div className="mt-4">
                                <label className="form-label fw-bold text-primary">Gợi ý đáp án / Bài mẫu:</label>
                                <textarea 
                                    className="form-control shadow-none" 
                                    rows="5" 
                                    placeholder="Nhập nội dung gợi ý trả lời..." 
                                    value={dapAnGoiY} 
                                    onChange={(e) => setDapAnGoiY(e.target.value)}
                                ></textarea>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-end mb-5">
                    <Link to="/thu-vien" className="btn btn-light btn-lg px-4 me-3 shadow-sm border">Hủy bỏ</Link>
                    <button type="submit" className="btn btn-primary btn-lg px-5 shadow fw-bold" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</>
                        ) : (
                            <><i className="bi bi-save me-2"></i>{isEditMode ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ThemCauHoi;