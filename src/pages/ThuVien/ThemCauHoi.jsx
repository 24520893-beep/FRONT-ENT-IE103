import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from './ThemCauHoi.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

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

    // STATE HÌNH ẢNH
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isRemoveImage, setIsRemoveImage] = useState(false); 
    const [imageError, setImageError] = useState('');

    // 2. STATE CHI TIẾT CHO TỪNG LOẠI
    const [luaChon, setLuaChon] = useState(['', '', '', '']); 
    const [dapAnDung, setDapAnDung] = useState(''); 
    const [dapAnGoiY, setDapAnGoiY] = useState(''); 

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode); 
    const [userRole, setUserRole] = useState('');

    // === STATE QUẢN LÝ OVERLAY XÁC NHẬN ===
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        message: '',
        type: 'primary' // primary cho lưu, danger cho xóa (nếu có)
    });

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
                    const res = await fetchClient(`/api/cauhoi/${editId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setLoaiCauHoi(data.LoaiCauHoi || 'TracNghiem');
                        setNoiDung(data.NoiDungCauHoi || '');
                        setMonHoc(data.MonHoc || '');
                        setDoKho(data.DoKho || 'Nhận biết');
                        setChuyenDe(data.ChuyenDe || '');
                        if (data.HinhAnhMinhHoa) setImagePreview(data.HinhAnhMinhHoa);

                        if (data.LoaiCauHoi === 'TracNghiem') {
                            setLuaChon(Array.isArray(data.DanhSachLuaChon) && data.DanhSachLuaChon.length === 4 ? data.DanhSachLuaChon : ['', '', '', '']);
                            setDapAnDung(data.DapAnChinhXac || '');
                        } 
                        else if (data.LoaiCauHoi === 'DungSai') {
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImageError('');
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setImageError('⚠️ Vui lòng chọn ảnh nhẹ hơn 10MB');
                e.target.value = "";
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setIsRemoveImage(false);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setIsRemoveImage(true);
        document.getElementById('imageUpload').value = "";
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...luaChon];
        newOptions[index] = value;
        setLuaChon(newOptions);
    };

    // --- LOGIC ĐIỀU PHỐI QUA OVERLAY ---
    
    // Bước 1: Khi nhấn nút submit form
    const handlePreSubmit = (e) => {
        e.preventDefault();
        if (imageError) return;
        if (!monHoc) return alert("Vui lòng cập nhật môn học trước khi lưu!");
        if (loaiCauHoi === 'TracNghiem' && !dapAnDung) return alert("Vui lòng chọn đáp án đúng cho câu hỏi trắc nghiệm!");

        setConfirmModal({
            isOpen: true,
            message: isEditMode 
                ? "Xác nhận cập nhật những thay đổi của câu hỏi này?" 
                : "Xác nhận lưu câu hỏi này vào ngân hàng và gửi kiểm duyệt?",
            type: 'primary'
        });
    };

    // Bước 2: Thực thi sau khi nhấn "Đồng ý" trên Modal
    const executeSubmit = async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            formData.append('LoaiCauHoi', loaiCauHoi);
            formData.append('NoiDungCauHoi', noiDung);
            formData.append('MonHoc', monHoc);
            formData.append('DoKho', doKho);
            formData.append('ChuyenDe', chuyenDe);
            formData.append('TrangThai', 'Đang kiểm duyệt');

            if (loaiCauHoi === 'TracNghiem') {
                formData.append('DanhSachLuaChon', JSON.stringify(luaChon));
                formData.append('DapAnChinhXac', dapAnDung);
            } else if (loaiCauHoi === 'DungSai') {
                formData.append('DanhSachLuaChon', JSON.stringify(luaChon));
                formData.append('DapAnChinhXac', ""); 
            } else if (loaiCauHoi === 'DienKhuyet') {
                formData.append('DanhSachLuaChon', JSON.stringify([]));
                formData.append('DapAnChinhXac', dapAnDung);
            } else if (loaiCauHoi === 'TuLuan') {
                formData.append('DanhSachLuaChon', JSON.stringify([]));
                formData.append('DapAnChinhXac', "");
                formData.append('DapAnGoiY', dapAnGoiY);
            }

            if (imageFile) formData.append('image', imageFile);
            if (isRemoveImage) formData.append('isRemoveImage', 'true');

            const url = isEditMode ? `/api/cauhoi/${editId}` : '/api/cauhoi';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetchClient(url, { method, body: formData });

            if (response.ok) {
                alert(`Thành công!`);
                navigate('/thu-vien'); 
            } else {
                const errorData = await response.json();
                alert(`Lỗi: ${errorData.message}`);
            }
        } catch (error) {
            alert("Lỗi kết nối server!");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <div className="container py-4">
                <h1 className={styles.pageTitle}>
                    {isEditMode ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới'}
                </h1>
                <p className="text-muted small">
                    {isEditMode ? 'Chỉnh sửa nội dung và gửi lại yêu cầu kiểm duyệt.' : 'Biên soạn nội dung câu hỏi cho kho học liệu.'}
                </p>

                <form onSubmit={handlePreSubmit}>
                    {/* CARD 1: CẤU HÌNH CHUNG */}
                    <div className="card shadow-sm border-0 mb-4 mt-3">
                        <div className="card-body p-4">
                            <h5 className="mb-4 fw-bold border-bottom pb-2">Cấu hình chung</h5>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Loại câu hỏi</label>
                                    <select className="form-select shadow-none" value={loaiCauHoi} onChange={(e) => setLoaiCauHoi(e.target.value)} disabled={isEditMode}>
                                        <option value="TracNghiem">Trắc nghiệm (4 lựa chọn)</option>
                                        <option value="DungSai">Đúng / Sai</option>
                                        <option value="DienKhuyet">Điền khuyết</option>
                                        <option value="TuLuan">Tự luận</option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Môn học</label>
                                    <input type="text" className="form-control shadow-none bg-light" placeholder="VD: Vật lý" value={monHoc} onChange={(e) => setMonHoc(e.target.value)} disabled={userRole === 'GiaoVien' || isEditMode} required />
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
                                    <input type="text" className="form-control shadow-none" placeholder="VD: Di truyền học Mendeln" value={chuyenDe} onChange={(e) => setChuyenDe(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: NỘI DUNG CÂU HỎI VÀ ẢNH */}
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <h5 className="mb-4 fw-bold border-bottom pb-2">Nội dung câu hỏi</h5>
                            
                            <div className="row">
                                <div className="col-md-8">
                                    <textarea className="form-control mb-3 shadow-none" rows="5" placeholder="Nhập nội dung đề bài tại đây..." value={noiDung} onChange={(e) => setNoiDung(e.target.value)} required></textarea>
                                </div>
                                <div className="col-md-4">
                                    <div className="border rounded p-3 bg-light h-100 d-flex flex-column align-items-center justify-content-center text-center">
                                        <label className="fw-bold d-block mb-2 text-secondary w-100">Ảnh minh họa (Tùy chọn)</label>
                                        {!imagePreview ? (
                                            <div className="w-100">
                                                <label htmlFor="imageUpload" className="btn btn-outline-secondary w-100 border-dashed py-3 d-flex flex-column align-items-center">
                                                    <i className="bi bi-cloud-arrow-up fs-2 mb-2"></i>
                                                    <span>Tải ảnh lên</span>
                                                </label>
                                                <input type="file" id="imageUpload" accept="image/*" className="d-none" onChange={handleImageChange} />
                                            </div>
                                        ) : (
                                            <div className="position-relative d-inline-block">
                                                <img src={imagePreview} alt="Minh họa" className="img-thumbnail shadow-sm" style={{ maxHeight: '160px', objectFit: 'contain' }} />
                                                <button type="button" className="btn btn-danger btn-sm position-absolute top-0 start-100 translate-middle rounded-circle shadow" onClick={handleRemoveImage} style={{ width: '28px', height: '28px', padding: 0 }}>
                                                    <i className="bi bi-x fs-5"></i>
                                                </button>
                                            </div>
                                        )}
                                        {imageError && <div className="text-danger small mt-2 fw-bold">{imageError}</div>}
                                    </div>
                                </div>
                            </div>

                            <hr className="my-4 text-muted" />

                            {/* CHI TIẾT ĐÁP ÁN THEO LOẠI */}
                            {loaiCauHoi === 'TracNghiem' && (
                                <div className="mt-4">
                                    <label className="form-label fw-bold text-primary mb-3">Các phương án lựa chọn (Tích chọn đáp án đúng):</label>
                                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                                        <div key={label} className="input-group mb-3">
                                            <span className="input-group-text fw-bold">{label}</span>
                                            <input type="text" className="form-control shadow-none" placeholder={`Nội dung ${label}`} value={luaChon[idx] || ''} onChange={(e) => handleOptionChange(idx, e.target.value)} required />
                                            <div className="input-group-text bg-white">
                                                <input className="form-check-input mt-0 cursor-pointer" type="radio" name="correctRadio" checked={dapAnDung === label} onChange={() => setDapAnDung(label)} required />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {loaiCauHoi === 'DungSai' && (
                                <div className="mt-4">
                                    <label className="form-label fw-bold text-primary mb-3">Cài đặt đáp án cho 4 phát biểu:</label>
                                    <div className="row row-cols-1 row-cols-md-2 g-3">
                                        {['Phát biểu a', 'Phát biểu b', 'Phát biểu c', 'Phát biểu d'].map((label, idx) => (
                                            <div className="col" key={label}>
                                                <div className="input-group">
                                                    <span className="input-group-text fw-bold flex-grow-1 bg-white">{label}</span>
                                                    <select className="form-select shadow-none flex-grow-0" style={{ width: 'auto', minWidth: '100px' }} value={luaChon[idx] || 'Đúng'} onChange={(e) => handleOptionChange(idx, e.target.value)}>
                                                        <option value="Đúng">Đúng</option>
                                                        <option value="Sai">Sai</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {loaiCauHoi === 'DienKhuyet' && (
                                <div className="mt-4">
                                    <label className="form-label fw-bold text-primary">Từ khóa cần điền:</label>
                                    <input type="text" className="form-control shadow-none border-primary" placeholder="Nhập đáp án chính xác..." value={dapAnDung} onChange={(e) => setDapAnDung(e.target.value)} required />
                                </div>
                            )}

                            {loaiCauHoi === 'TuLuan' && (
                                <div className="mt-4">
                                    <label className="form-label fw-bold text-primary">Gợi ý đáp án / Bài mẫu:</label>
                                    <textarea className="form-control shadow-none border-primary bg-light" rows="5" placeholder="Nhập nội dung gợi ý..." value={dapAnGoiY} onChange={(e) => setDapAnGoiY(e.target.value)}></textarea>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NÚT SUBMIT */}
                    <div className="text-end mb-5 mt-4">
                        <Link to="/thu-vien" className="btn btn-light btn-lg px-4 me-3 shadow-sm border">Hủy bỏ</Link>
                        <button type="submit" className="btn btn-primary btn-lg px-5 shadow fw-bold" disabled={isSubmitting}>
                            {isSubmitting ? "Đang xử lý..." : (isEditMode ? "Cập nhật câu hỏi" : "Lưu câu hỏi")}
                        </button>
                    </div>
                </form>
            </div>

            {/* === GIAO DIỆN OVERLAY (MODAL) XÁC NHẬN === */}
            {confirmModal.isOpen && (
                <div 
                    className="d-flex align-items-center justify-content-center" 
                    style={{
                        position: 'fixed', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.5)', 
                        zIndex: 10000,
                        backdropFilter: 'blur(3px)'
                    }}
                >
                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
                        <i className="bi bi-question-circle text-primary mb-3" style={{ fontSize: '4rem' }}></i>
                        <h4 className="fw-bold text-dark">Xác nhận thao tác</h4>
                        <p className="text-muted mt-2 mb-4">{confirmModal.message}</p>
                        <div className="d-flex justify-content-center gap-3">
                            <button 
                                className="btn btn-light border fw-bold rounded-pill px-4 py-2" 
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            >
                                Quay lại
                            </button>
                            <button 
                                className="btn btn-primary fw-bold rounded-pill px-4 py-2 text-white"
                                onClick={executeSubmit}
                            >
                                Đồng ý lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ThemCauHoi;