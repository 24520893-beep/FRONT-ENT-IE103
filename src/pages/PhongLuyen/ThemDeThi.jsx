import React, { useState, useEffect } from 'react';
import Select from 'react-select'; 
import CreatableSelect from 'react-select/creatable'; // Dùng cho nhãn dán
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from './ThemDeThi.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

const ThemDeThi = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('edit');
    const isEditMode = !!editId;

    const [examName, setExamName] = useState('');
    const [timeLimit, setTimeLimit] = useState('');
    const [user, setUser] = useState(null);

    // STATE QUẢN LÝ CÂU HỎI
    const [bulkQuestions, setBulkQuestions] = useState('');
    const [addedQuestions, setAddedQuestions] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]); 

    // STATE QUẢN LÝ NHÃN DÁN (Chuẩn Schema)
    const [tagOptions, setTagOptions] = useState([]); 
    const [selectedTags, setSelectedTags] = useState([]); 
    const [isLoadingTags, setIsLoadingTags] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(isEditMode); 

    const [questionOptions, setQuestionOptions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        message: '',
        type: 'primary', 
        actionType: null, // 'SAVE', 'DELETE_SINGLE', 'DELETE_SELECTED'
        targetId: null    
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    // 1. FETCH DỮ LIỆU CŨ VÀ NHÃN DÁN
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await fetchClient('/api/nhandan');
                if (res.ok) {
                    const json = await res.json();
                    const tagsArray = Array.isArray(json) ? json : (json.data || []);
                    setTagOptions(tagsArray.map(tag => ({ value: tag._id, label: tag.TenNhanDan })));
                }
            } catch (error) { console.error("Lỗi tải nhãn dán:", error); }
        };

        const fetchOldData = async () => {
            if (!isEditMode) { setIsLoadingData(false); return; }
            try {
                const res = await fetchClient(`/api/dethithu/${editId}`);
                if (res.ok) {
                    const data = await res.json();
                    setExamName(data.TenDeThi || '');
                    setTimeLimit(data.ThoiGianGioiHan || '');
                    
                    if (data.DanhSachCauHoi) {
                        setAddedQuestions(data.DanhSachCauHoi.map(q => typeof q === 'object' ? q._id : q));
                    }
                    if (data.DanhSachNhanDan) {
                        setSelectedTags(data.DanhSachNhanDan.map(tag => ({
                            value: tag._id,
                            label: tag.TenNhanDan
                        })));
                    }
                } else {
                    alert("Không tìm thấy đề thi!");
                    navigate('/phong-luyen');
                }
            } catch (error) { console.error(error); } finally { setIsLoadingData(false); }
        };

        fetchTags();
        fetchOldData();
    }, [editId, isEditMode, navigate]);

    // FETCH GỢI Ý CÂU HỎI
    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoadingQuestions(true);
            try {
                const res = await fetchClient('/api/cauhoi?limit=500');
                if (res.ok) {
                    const json = await res.json();
                    const qList = Array.isArray(json) ? json : (json.data || []);
                    setQuestionOptions(qList.map(q => ({
                        value: q._id,
                        label: `[${q.DoKho || 'N/A'}] ${q.NoiDungCauHoi.substring(0, 70)}...`
                    })));
                }
            } catch (error) { console.error(error); } finally { setIsLoadingQuestions(false); }
        };
        fetchQuestions();
    }, []);

    const handleCreateTag = (inputValue) => {
        const newOption = { value: inputValue, label: inputValue, isNew: true };
        setTagOptions((prev) => [...prev, newOption]);
        setSelectedTags((prev) => [...prev, newOption]);
    };

    const handleAddSingle = () => {
        if (selectedQuestion && !addedQuestions.includes(selectedQuestion.value)) {
            setAddedQuestions([...addedQuestions, selectedQuestion.value]);
        }
        setSelectedQuestion(null); 
    };

    const handleAddBulk = () => {
        if (!bulkQuestions.trim()) return;
        const newIds = bulkQuestions.split(/[, \n]+/).map(id => id.trim()).filter(id => id !== '');
        const uniqueNewIds = newIds.filter(id => !addedQuestions.includes(id));
        setAddedQuestions([...addedQuestions, ...uniqueNewIds]);
        setBulkQuestions('');
    };

    const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? addedQuestions : []);
    const toggleSelectOne = (qId) => setSelectedIds(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]);

    const triggerDeleteSingle = (qId) => setConfirmModal({
        isOpen: true, message: `Gỡ câu hỏi này khỏi đề thi?`, type: 'danger', actionType: 'DELETE_SINGLE', targetId: qId
    });

    const triggerDeleteSelected = () => setConfirmModal({
        isOpen: true, message: `Gỡ ${selectedIds.length} câu hỏi đã chọn khỏi đề thi?`, type: 'danger', actionType: 'DELETE_SELECTED'
    });

    const triggerSaveExam = (e) => {
        e.preventDefault();
        if (addedQuestions.length === 0) return alert("Vui lòng thêm ít nhất 1 câu hỏi!");
        setConfirmModal({
            isOpen: true, message: isEditMode ? "Cập nhật đề thi?" : "Tạo mới đề thi?", type: 'primary', actionType: 'SAVE'
        });
    };

    const executeAction = async () => {
        const { actionType, targetId } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false });

        if (actionType === 'DELETE_SINGLE') {
            setAddedQuestions(addedQuestions.filter(id => id !== targetId));
            setSelectedIds(selectedIds.filter(id => id !== targetId));
        } else if (actionType === 'DELETE_SELECTED') {
            setAddedQuestions(addedQuestions.filter(id => !selectedIds.includes(id)));
            setSelectedIds([]);
        } else if (actionType === 'SAVE') {
            await handleFinalSubmit();
        }
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Xử lý tạo nhãn mới trước
            const existingTagIds = selectedTags.filter(tag => !tag.isNew).map(tag => tag.value);
            const tagsToCreate = selectedTags.filter(tag => tag.isNew);
            let newTagIds = [];

            if (tagsToCreate.length > 0) {
                const createdTags = await Promise.all(tagsToCreate.map(tag =>
                    fetchClient('/api/nhandan', { method: 'POST', body: JSON.stringify({ TenNhanDan: tag.label }) }).then(res => res.json())
                ));
                newTagIds = createdTags.map(t => t._id);
            }

            const payload = {
                TenDeThi: examName,
                ThoiGianGioiHan: Number(timeLimit),
                TrangThai: "Đang kiểm duyệt",
                DanhSachCauHoi: addedQuestions,
                DanhSachNhanDan: [...existingTagIds, ...newTagIds]
            };

            if (!isEditMode) {
                payload.MaGVThietKe = user?._id;
                payload.MonHoc = user?.MonHoc;
            }

            const url = isEditMode ? `/api/dethithu/${editId}` : '/api/dethithu';
            const method = isEditMode ? 'PUT' : 'POST';
            const res = await fetchClient(url, { method, body: JSON.stringify(payload) });

            if (res.ok) {
                alert("Thao tác thành công!");
                navigate('/phong-luyen');
            }
        } catch (error) { alert("Lỗi kết nối máy chủ."); } finally { setIsSubmitting(false); }
    };

    const getQuestionInfo = (qId) => (questionOptions.find(opt => opt.value === qId)?.label || `Mã ID: ${qId}`);
    const formatTeacherId = (id) => id ? `${id.substring(0, 6)}***${id.substring(id.length - 6)}` : "..........";

    if (isLoadingData) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <div className="container py-4">
                <h1 className={styles.pageTitle}>{isEditMode ? 'Cập nhật đề thi' : 'Thêm đề thi mới'}</h1>

                <form onSubmit={triggerSaveExam}>
                    <div className="card shadow-sm border-0 mb-4 mt-3">
                        <div className="card-body p-4">
                            <h5 className="mb-4 fw-bold border-bottom pb-2">Thông tin cơ bản</h5>
                            <div className="row mb-4 g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-muted small">Giáo viên thiết kế</label>
                                    <div className="form-control bg-light">{user?.HoTen}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-muted small">Môn học phụ trách</label>
                                    <div className="form-control bg-light">{user?.MonHoc}</div>
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label fw-bold small">Tên đề thi <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control" placeholder="Nhập tên đề thi..." value={examName} onChange={(e) => setExamName(e.target.value)} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold small">Thời gian (Phút) <span className="text-danger">*</span></label>
                                    <input type="number" className="form-control" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} min="1" required />
                                </div>
                                <div className="col-12 mt-3">
                                    <label className="form-label fw-bold small">Nhãn dán (Tags)</label>
                                    <CreatableSelect
                                        isMulti
                                        options={tagOptions}
                                        value={selectedTags}
                                        onChange={setSelectedTags}
                                        onCreateOption={handleCreateTag}
                                        placeholder="Chọn hoặc tạo nhãn mới..."
                                        formatCreateLabel={(v) => `+ Thêm nhãn: "${v}"`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small">Thêm câu hỏi lẻ</label>
                                    <div className="d-flex gap-2">
                                        <div style={{ flex: 1 }}>
                                            <Select options={questionOptions} value={selectedQuestion} onChange={setSelectedQuestion} isLoading={isLoadingQuestions} placeholder="Tìm câu hỏi..." isClearable />
                                        </div>
                                        <button type="button" className="btn btn-outline-primary fw-bold" onClick={handleAddSingle} disabled={!selectedQuestion}>Thêm</button>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small">Nhập hàng loạt mã ID</label>
                                    <div className="d-flex gap-2">
                                        <input className="form-control shadow-none" placeholder="Dán các mã ID..." value={bulkQuestions} onChange={(e) => setBulkQuestions(e.target.value)} />
                                        <button type="button" className="btn btn-outline-primary fw-bold text-nowrap" onClick={handleAddBulk}>Thêm nhanh</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <h5 className="mb-3 fw-bold">Danh sách câu hỏi ({addedQuestions.length})</h5>
                            {addedQuestions.length > 0 ? (
                                <>
                                    <div className="table-responsive border rounded overflow-auto" style={{ maxHeight: '400px' }}>
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light sticky-top">
                                                <tr>
                                                    <th style={{ width: '40px' }} className="text-center"><input type="checkbox" className="form-check-input" onChange={toggleSelectAll} checked={addedQuestions.length > 0 && selectedIds.length === addedQuestions.length} /></th>
                                                    <th style={{ width: '50px' }} className="text-center">STT</th>
                                                    <th>Nội dung câu hỏi</th>
                                                    <th className="text-center" style={{ width: '80px' }}>Gỡ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {addedQuestions.map((qId, index) => (
                                                    <tr key={`${qId}-${index}`} className={selectedIds.includes(qId) ? 'table-active' : ''}>
                                                        <td className="text-center"><input type="checkbox" className="form-check-input" checked={selectedIds.includes(qId)} onChange={() => toggleSelectOne(qId)} /></td>
                                                        <td className="text-center fw-bold text-muted small">{index + 1}</td>
                                                        <td className="small">{getQuestionInfo(qId)}</td>
                                                        <td className="text-center">
                                                            <button type="button" className="btn btn-link text-danger p-0" onClick={() => triggerDeleteSingle(qId)}><i className="bi bi-trash3-fill"></i></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button type="button" className="btn btn-danger btn-sm fw-bold mt-3" onClick={triggerDeleteSelected} disabled={selectedIds.length === 0}>
                                        <i className="bi bi-trash-fill me-1"></i> Gỡ mục đã chọn ({selectedIds.length})
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-4 border rounded bg-light text-muted">Chưa có câu hỏi nào.</div>
                            )}
                        </div>
                    </div>

                    <div className="text-end mb-5">
                        <Link to="/phong-luyen" className="btn btn-light btn-lg px-4 me-3 border shadow-sm">Hủy bỏ</Link>
                        <button type="submit" className="btn btn-primary btn-lg px-5 shadow fw-bold" disabled={isSubmitting || isLoadingTags}>
                            {isSubmitting ? "Đang xử lý..." : (isEditMode ? "Cập nhật đề thi" : "Tạo đề thi")}
                        </button>
                    </div>
                </form>
            </div>

            {confirmModal.isOpen && (
                <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, backdropFilter: 'blur(3px)' }}>
                    <div className="bg-white p-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
                        <i className={`bi ${confirmModal.type === 'danger' ? 'bi-exclamation-octagon text-danger' : 'bi-question-circle text-primary'} mb-3`} style={{ fontSize: '4rem' }}></i>
                        <h4 className="fw-bold text-dark">Xác nhận</h4>
                        <p className="text-muted mt-2 mb-4">{confirmModal.message}</p>
                        <div className="d-flex justify-content-center gap-3">
                            <button className="btn btn-light border fw-bold rounded-pill px-4" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Hủy</button>
                            <button className={`btn btn-${confirmModal.type} fw-bold rounded-pill px-4 text-white`} onClick={executeAction}>Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ThemDeThi;