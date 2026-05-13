import React, { useState, useEffect } from 'react';
import Select from 'react-select'; 
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from './ThemDeThi.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ThemDeThi = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // BẮT THAM SỐ TỪ URL ĐỂ NHẬN BIẾT CHẾ ĐỘ SỬA
    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('edit');
    const isEditMode = !!editId;

    // STATE THÔNG TIN CƠ BẢN
    const [examName, setExamName] = useState('');
    const [timeLimit, setTimeLimit] = useState('');
    const [user, setUser] = useState(null);

    // STATE QUẢN LÝ CÂU HỎI ĐÃ THÊM
    const [bulkQuestions, setBulkQuestions] = useState('');
    const [addedQuestions, setAddedQuestions] = useState([]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(isEditMode); // Loading dữ liệu cũ

    // STATE CHO DROPDOWN GỢI Ý CÂU HỎI
    const [questionOptions, setQuestionOptions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

    // 1. LẤY THÔNG TIN GIÁO VIÊN KHI LOAD TRANG
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // 2. LẤY DỮ LIỆU ĐỀ THI CŨ NẾU ĐANG Ở CHẾ ĐỘ SỬA
    useEffect(() => {
        if (isEditMode) {
            const fetchOldData = async () => {
                try {
                    // Đã sửa: Dùng fetchClient để lấy chi tiết đề thi
                    const res = await fetchClient(`/api/dethithu/${editId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setExamName(data.TenDeThi || '');
                        setTimeLimit(data.ThoiGianGioiHan || '');
                        
                        // Xử lý DanhSachCauHoi: Đôi khi populate trả về object, đôi khi mảng ID
                        if (data.DanhSachCauHoi) {
                            const qIds = data.DanhSachCauHoi.map(q => typeof q === 'object' ? q._id : q);
                            setAddedQuestions(qIds);
                        }
                    } else {
                        alert("Không tìm thấy đề thi để chỉnh sửa!");
                        navigate('/phong-luyen');
                    }
                } catch (error) {
                    console.error("Lỗi lấy dữ liệu đề thi:", error);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchOldData();
        } else {
            setIsLoadingData(false);
        }
    }, [editId, isEditMode, navigate]);

    // 3. LẤY DANH SÁCH CÂU HỎI TỪ DATABASE ĐỂ LÀM GỢI Ý
    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoadingQuestions(true);
            try {
                // Đã sửa: Dùng fetchClient để lấy danh sách câu hỏi
                const res = await fetchClient('/api/cauhoi?limit=500');

                if (res.ok) {
                    const jsonResponse = await res.json();
                    const qList = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);

                    const formattedOptions = qList.map(q => ({
                        value: q._id,
                        label: `[${q.DoKho || 'Chưa phân loại'}] ${q.NoiDungCauHoi.substring(0, 70)}...`
                    }));

                    setQuestionOptions(formattedOptions);
                }
            } catch (error) {
                console.error("Lỗi tải danh sách câu hỏi gợi ý:", error);
            } finally {
                setIsLoadingQuestions(false);
            }
        };

        fetchQuestions();
    }, []);

    const formatTeacherId = (id) => {
        if (!id || id.length < 12) return id;
        return `${id.substring(0, 6)}***${id.substring(id.length - 6)}`;
    };

    const handleAddSingle = () => {
        if (!selectedQuestion) return; 

        const id = selectedQuestion.value;
        if (id && !addedQuestions.includes(id)) {
            setAddedQuestions([...addedQuestions, id]);
        }
        setSelectedQuestion(null); 
    };

    const handleAddBulk = () => {
        if (!bulkQuestions.trim()) return;

        const newIds = bulkQuestions
            .split(/[, \n]+/)
            .map(id => id.trim())
            .filter(id => id !== '');

        const uniqueNewIds = newIds.filter(id => !addedQuestions.includes(id));

        setAddedQuestions([...addedQuestions, ...uniqueNewIds]);
        setBulkQuestions('');
    };

    const handleRemoveQuestion = (idToRemove) => {
        setAddedQuestions(addedQuestions.filter(id => id !== idToRemove));
    };

    // HÀM SUBMIT TẠO/SỬA ĐỀ THI
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (addedQuestions.length === 0) {
            alert("Vui lòng thêm ít nhất 1 câu hỏi vào đề thi!");
            return;
        }

        setIsSubmitting(true);

        // KHI UPDATE CŨNG ĐẶT LẠI THÀNH ĐANG KIỂM DUYỆT
        const payload = {
            TenDeThi: examName,
            ThoiGianGioiHan: Number(timeLimit),
            TrangThai: "Đang kiểm duyệt",
            DanhSachCauHoi: addedQuestions
        };

        // Nếu tạo mới thì nhét thêm thông tin môn học, giáo viên
        if (!isEditMode) {
            payload.MaGVThietKe = user?._id;
            payload.MonHoc = user?.MonHoc;
        }

        try {
            // Đã sửa: Dùng fetchClient, tự động chèn Token và cấu hình Content-Type
            const url = isEditMode ? `/api/dethithu/${editId}` : '/api/dethithu';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetchClient(url, {
                method: method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(`Đã ${isEditMode ? 'cập nhật' : 'tạo'} đề thi thành công! Trạng thái: Chờ duyệt.`);
                navigate('/phong-luyen'); // Xong thì đá về trang danh sách
            } else {
                let errorMsg = "Không thể lưu đề thi";
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.message || errorData.error || errorMsg;
                } catch (parseError) {
                    errorMsg = `Lỗi máy chủ (Status: ${res.status}).`;
                }
                alert("Lỗi: " + errorMsg);
            }

        } catch (error) {
            console.error("Lỗi:", error);
            alert("Đã xảy ra sự cố trong quá trình lưu dữ liệu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getQuestionInfo = (qId) => {
        const found = questionOptions.find(opt => opt.value === qId);
        if (found) return found.label;
        return `Mã ID: ${qId}`; 
    };

    if (isLoadingData) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className={styles.pageTitle}>
                    {isEditMode ? 'Cập nhật đề thi' : 'Thêm đề thi mới'}
                </h1>
            </div>

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        {/* ROW 1: Thông tin giáo viên */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold text-muted">Giáo viên thiết kế</label>
                                <div className="form-control bg-light">
                                    {user?.HoTen || "Đang tải..."}
                                </div>
                            </div>
                            <div className="col-md-6 mt-3 mt-md-0">
                                <label className="form-label fw-bold text-muted">Mã GV</label>
                                <div className="form-control bg-light">
                                    {user ? formatTeacherId(user._id) : ".........."}
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: Môn học và Tên đề thi */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold text-muted">Môn học</label>
                                <div className="form-control bg-light">
                                    {user?.MonHoc || "Chưa cập nhật"}
                                </div>
                            </div>
                            <div className="col-md-6 mt-3 mt-md-0">
                                <label className="form-label fw-bold">Tên đề thi <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nhập tên đề thi (VD: Đề thi thử THPT Quốc Gia...)"
                                    value={examName}
                                    onChange={(e) => setExamName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* ROW 3: Thời gian làm bài và Số câu hỏi */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Thời gian làm bài (Phút) <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="VD: 50, 90, 120..."
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(e.target.value)}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="col-md-6 mt-3 mt-md-0">
                                <label className="form-label fw-bold text-muted">Số câu hỏi (Tự động tính)</label>
                                <div className="form-control bg-light text-primary fw-bold">
                                    {addedQuestions.length} câu
                                </div>
                            </div>
                        </div>

                        {/* ROW 4: Khu vực quản lý Câu hỏi */}
                        <div className="row mb-4 bg-light p-3 rounded border">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Thêm câu hỏi (Tìm kiếm & Chọn lẻ)</label>
                                <small className="text-muted d-block mb-2">Gõ từ khóa trong nội dung câu hỏi để tìm kiếm nhanh.</small>

                                <div className="d-flex gap-2 mb-3">
                                    <div style={{ flex: 1 }}>
                                        <Select
                                            options={questionOptions}
                                            value={selectedQuestion}
                                            onChange={setSelectedQuestion}
                                            isLoading={isLoadingQuestions}
                                            placeholder="Tìm và chọn câu hỏi..."
                                            isClearable
                                            noOptionsMessage={() => "Không tìm thấy câu hỏi nào"}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={handleAddSingle}
                                        disabled={!selectedQuestion}
                                    >
                                        <i className="bi bi-plus-circle me-1"></i> Thêm
                                    </button>
                                </div>
                            </div>

                            <div className="col-md-6 mt-3 mt-md-0">
                                <label className="form-label fw-bold">Nhập danh sách mã câu hỏi (Hàng loạt)</label>
                                <small className="text-muted d-block mb-2">Ngăn cách các ID bằng dấu phẩy hoặc khoảng trắng.</small>
                                <textarea
                                    className="form-control mb-2"
                                    rows="2"
                                    placeholder="VD: 69ea1a..., 69ea1b..., 69ea1c..."
                                    value={bulkQuestions}
                                    onChange={(e) => setBulkQuestions(e.target.value)}
                                ></textarea>
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={handleAddBulk}
                                >
                                    <i className="bi bi-list-check me-1"></i> Thêm hàng loạt
                                </button>
                            </div>
                        </div>

                        {/* SECTION: Danh sách câu hỏi đã thêm */}
                        {addedQuestions.length > 0 && (
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0">
                                        <i className="bi bi-ui-checks-grid me-2 text-success"></i>
                                        Danh sách câu hỏi trong đề ({addedQuestions.length})
                                    </h6>
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => setAddedQuestions([])}
                                    >
                                        Xóa tất cả
                                    </button>
                                </div>

                                <div className={`table-responsive border rounded ${styles.questionTableContainer}`}>
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: '50px' }} className="text-center">STT</th>
                                                <th>Nội dung câu hỏi</th>
                                                <th style={{ width: '150px' }}>Mã hệ thống</th>
                                                <th style={{ width: '80px' }} className="text-center">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {addedQuestions.map((qId, index) => (
                                                <tr key={qId}>
                                                    <td className="text-center fw-bold text-muted">{index + 1}</td>
                                                    <td>
                                                        <div className={styles.questionContentCell}>
                                                            {getQuestionInfo(qId)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <code className="small text-primary">{qId.substring(0, 8)}...</code>
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-link text-danger p-0 shadow-none"
                                                            onClick={() => handleRemoveQuestion(qId)}
                                                            title="Xóa khỏi đề"
                                                        >
                                                            <i className="bi bi-trash3-fill"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Nút Submit Main */}
                        <div className="text-end border-top pt-4">
                            <Link to="/phong-luyen" className="btn btn-light btn-lg px-4 me-3 shadow-sm border">Hủy bỏ</Link>
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg px-5 shadow"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Đang xử lý..." : (isEditMode ? "Cập nhật đề thi" : "Tạo đề thi")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ThemDeThi;