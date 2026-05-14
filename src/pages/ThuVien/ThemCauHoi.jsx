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

    // STATE HÌNH ẢNH MỚI BỔ SUNG
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isRemoveImage, setIsRemoveImage] = useState(false); // Cờ báo hiệu muốn xóa ảnh cũ khi edit
    const [imageError, setImageError] = useState('');

    // 2. STATE CHI TIẾT CHO TỪNG LOẠI
    const [luaChon, setLuaChon] = useState(['', '', '', '']); 
    const [dapAnDung, setDapAnDung] = useState(''); 
    const [dapAnGoiY, setDapAnGoiY] = useState(''); 

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
                    const res = await fetchClient(`/api/cauhoi/${editId}`);
                    
                    if (res.ok) {
                        const data = await res.json();
                        setLoaiCauHoi(data.LoaiCauHoi || 'TracNghiem');
                        setNoiDung(data.NoiDungCauHoi || '');
                        setMonHoc(data.MonHoc || '');
                        setDoKho(data.DoKho || 'Nhận biết');
                        setChuyenDe(data.ChuyenDe || '');

                        // TẢI ẢNH CŨ LÊN PREVIEW (NẾU CÓ)
                        if (data.HinhAnhMinhHoa) {
                            setImagePreview(data.HinhAnhMinhHoa);
                        }

                        // MAP DỮ LIỆU CŨ VÀO STATE
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

    // HÀM XỬ LÝ KHI CHỌN ẢNH
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImageError('');
        
        if (file) {
            // Cảnh báo nếu ảnh > 10MB
            if (file.size > 10 * 1024 * 1024) {
                setImageError('⚠️ Vui lòng chọn ảnh nhẹ hơn 10MB');
                e.target.value = "";
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setIsRemoveImage(false); // Nếu chọn ảnh mới, hủy cờ báo xóa ảnh
        }
    };

    // HÀM XỬ LÝ KHI BẤM NÚT XÓA ẢNH
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setIsRemoveImage(true); // Bật cờ báo xóa ảnh
        document.getElementById('imageUpload').value = "";
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...luaChon];
        newOptions[index] = value;
        setLuaChon(newOptions);
    };

    // SUBMIT FORM BẰNG FORMDATA ĐỂ HỖ TRỢ UPLOAD FILE
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (imageError) return; // Chặn lưu nếu ảnh đang bị lỗi dung lượng

        if (!monHoc) {
            alert("Vui lòng cập nhật môn học trước khi lưu câu hỏi!");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            
            // Append các text field
            formData.append('LoaiCauHoi', loaiCauHoi);
            formData.append('NoiDungCauHoi', noiDung);
            formData.append('MonHoc', monHoc);
            formData.append('DoKho', doKho);
            formData.append('ChuyenDe', chuyenDe);
            formData.append('TrangThai', 'Đang kiểm duyệt');

            // Gắn thêm dữ liệu tùy theo loại câu hỏi (Mảng phải được stringify)
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

            // APPEND FILE ẢNH HOẶC CỜ XÓA ẢNH
            if (imageFile) {
                formData.append('image', imageFile); // 'image' là tên trường khai báo bên Router
            }
            if (isRemoveImage) {
                formData.append('isRemoveImage', 'true');
            }

            const url = isEditMode ? `/api/cauhoi/${editId}` : '/api/cauhoi';
            const method = isEditMode ? 'PUT' : 'POST';

            // Dùng fetchClient để POST/PUT lên server (sẽ tự nhận diện FormData)
            const response = await fetchClient(url, {
                method: method,
                body: formData
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
                {/* CARD 1: CẤU HÌNH CHUNG */}
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
                                    disabled={isEditMode} 
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

                {/* CARD 2: NỘI DUNG CÂU HỎI VÀ ẢNH MINH HỌA */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <h5 className="mb-4 fw-bold border-bottom pb-2">Nội dung câu hỏi</h5>
                        
                        {loaiCauHoi === 'DungSai' && (
                            <div className="alert alert-info py-2 small">
                                <i className="bi bi-info-circle me-2"></i>Với câu hỏi <b>Đúng/Sai</b>, bạn hãy gõ toàn bộ đề bài và cả 4 phát biểu (a, b, c, d) vào ô bên dưới.
                            </div>
                        )}

                        <div className="row">
                            {/* Cột trái: Nhập văn bản */}
                            <div className="col-md-8">
                                <textarea 
                                    className="form-control mb-3 shadow-none" 
                                    rows="5" 
                                    placeholder="Nhập nội dung đề bài tại đây..." 
                                    value={noiDung} 
                                    onChange={(e) => setNoiDung(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            
                            {/* Cột phải: Upload hình ảnh minh họa */}
                            <div className="col-md-4">
                                <div className="border rounded p-3 bg-light h-100 d-flex flex-column align-items-center justify-content-center text-center">
                                    <label className="fw-bold d-block mb-2 text-secondary w-100">
                                        Ảnh minh họa (Tùy chọn)
                                    </label>
                                    
                                    {!imagePreview ? (
                                        <div className="w-100">
                                            <label htmlFor="imageUpload" className="btn btn-outline-secondary w-100 border-dashed py-3 d-flex flex-column align-items-center">
                                                <i className="bi bi-cloud-arrow-up fs-2 mb-2"></i>
                                                <span>Tải ảnh lên</span>
                                            </label>
                                            <input 
                                                type="file" 
                                                id="imageUpload" 
                                                accept="image/*" 
                                                className="d-none" 
                                                onChange={handleImageChange} 
                                            />
                                        </div>
                                    ) : (
                                        <div className="position-relative d-inline-block">
                                            <img 
                                                src={imagePreview} 
                                                alt="Minh họa" 
                                                className="img-thumbnail shadow-sm" 
                                                style={{ maxHeight: '160px', objectFit: 'contain' }} 
                                            />
                                            <button 
                                                type="button" 
                                                className="btn btn-danger btn-sm position-absolute top-0 start-100 translate-middle rounded-circle shadow"
                                                onClick={handleRemoveImage}
                                                title="Xóa ảnh này"
                                                style={{ width: '28px', height: '28px', padding: 0 }}
                                            >
                                                <i className="bi bi-x fs-5"></i>
                                            </button>
                                        </div>
                                    )}

                                    {/* Cảnh báo lỗi ảnh nếu có */}
                                    {imageError && (
                                        <div className="text-danger small mt-2 fw-bold">
                                            {imageError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <hr className="my-4 text-muted" />

                        {/* 1. TRẮC NGHIỆM */}
                        {loaiCauHoi === 'TracNghiem' && (
                            <div className="mt-4">
                                <label className="form-label fw-bold text-primary mb-3">Các phương án lựa chọn:</label>
                                {['A', 'B', 'C', 'D'].map((label, idx) => (
                                    <div key={label} className="input-group mb-3">
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
                                                className="form-check-input mt-0 cursor-pointer" 
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

                        {/* 2. ĐÚNG SAI */}
                        {loaiCauHoi === 'DungSai' && (
                            <div className="mt-4">
                                <label className="form-label fw-bold text-primary mb-3">Cài đặt đáp án cho 4 phát biểu:</label>
                                <div className="row row-cols-1 row-cols-md-2 g-3">
                                    {['Phát biểu a', 'Phát biểu b', 'Phát biểu c', 'Phát biểu d'].map((label, idx) => (
                                        <div className="col" key={label}>
                                            <div className="input-group">
                                                <span className="input-group-text fw-bold flex-grow-1 bg-white">{label}</span>
                                                <select 
                                                    className="form-select shadow-none flex-grow-0" 
                                                    style={{ width: 'auto', minWidth: '100px' }}
                                                    value={luaChon[idx] || 'Đúng'}
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                >
                                                    <option value="Đúng">Đúng</option>
                                                    <option value="Sai">Sai</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. ĐIỀN KHUYẾT */}
                        {loaiCauHoi === 'DienKhuyet' && (
                            <div className="mt-4">
                                <label className="form-label fw-bold text-primary">Từ khóa cần điền:</label>
                                <input 
                                    type="text" 
                                    className="form-control shadow-none border-primary" 
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
                                    className="form-control shadow-none border-primary bg-light" 
                                    rows="5" 
                                    placeholder="Nhập nội dung gợi ý trả lời..." 
                                    value={dapAnGoiY} 
                                    onChange={(e) => setDapAnGoiY(e.target.value)}
                                ></textarea>
                            </div>
                        )}
                    </div>
                </div>

                {/* NÚT SUBMIT */}
                <div className="text-end mb-5 mt-4">
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