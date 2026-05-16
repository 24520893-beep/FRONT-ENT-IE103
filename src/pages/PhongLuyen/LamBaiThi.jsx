import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient'; 

const LamBaiThi = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [userRole, setUserRole] = useState(null);
    const [exam, setExam] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(''); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false); 
    const [answers, setAnswers] = useState({});

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [unansweredCount, setUnansweredCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState(''); 
    
    const [resultModal, setResultModal] = useState({
        isOpen: false,
        isSuccess: false,
        score: 0,
        aiFailed: false, // Thay thế status bằng cờ aiFailed
        message: ''
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUserRole(JSON.parse(savedUser).VaiTro);
        }

        const fetchExam = async () => {
            try {
                const res = await fetchClient(`/api/reports/chitiet-dethi/${id}`);
                
                if (res.ok) {
                    const data = await res.json();
                    setExam(data);

                    const examKey = `exam_${id}_endTime`;
                    const savedEndTime = sessionStorage.getItem(examKey);
                    const now = new Date().getTime();

                    if (savedEndTime && parseInt(savedEndTime) > now) {
                        setTimeLeft(Math.floor((parseInt(savedEndTime) - now) / 1000));
                    } else {
                        const timeInSeconds = data.ThoiGianGioiHan * 60;
                        setTimeLeft(timeInSeconds);
                        sessionStorage.setItem(examKey, now + timeInSeconds * 1000);
                    }
                } else {
                    setFetchError("Không tìm thấy đề thi hoặc đề thi chưa được xuất bản!");
                }
            } catch (error) {
                console.error("Lỗi:", error);
                setFetchError("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchExam();
    }, [id]);

    useEffect(() => {
        if (userRole !== 'HocSinh' || timeLeft === null || isSubmitting || isProcessing || isTimeUp) return;

        if (timeLeft <= 0) {
            setIsTimeUp(true); 
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isSubmitting, isProcessing, userRole, isTimeUp]);

    useEffect(() => {
        if (isTimeUp && !isSubmitting && !isProcessing && !resultModal.isOpen) {
            setShowSubmitModal(false); 
            handleSubmit(true); 
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTimeUp]); 

    const formatTime = (seconds) => {
        if (!seconds || seconds <= 0) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (qId, value) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const handleDSAnswer = (qId, idx, value) => {
        setAnswers(prev => {
            const currentArr = prev[qId] || ['', '', '', ''];
            const newArr = [...currentArr];
            newArr[idx] = value;
            return { ...prev, [qId]: newArr };
        });
    };

    const handleFileUpload = (qId, file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Chỉ cho phép tải lên tệp hình ảnh (JPG, PNG, JPEG, GIF...).');
            return;
        }
        setAnswers(prev => {
            const currentObj = prev[qId] || { text: '', file: null, fileName: '' };
            return { ...prev, [qId]: { ...currentObj, file: file, fileName: file.name } };
        });
    };

    const handleRemoveFile = (qId) => {
        setAnswers(prev => {
            const currentObj = prev[qId] || { text: '' };
            return { ...prev, [qId]: { ...currentObj, file: null, fileName: '' } };
        });
        const fileInput = document.getElementById(`upload-${qId}`);
        if (fileInput) fileInput.value = '';
    };

    const handlePreSubmit = () => {
        let missingCount = 0;
        
        exam.DanhSachCauHoi.forEach(q => {
            let isDone = false;
            if (q.LoaiCauHoi === 'DungSai') {
                const arr = answers[q._id] || [];
                isDone = arr.filter(x => x !== '').length === 4;
            } else if (q.LoaiCauHoi === 'TuLuan') {
                isDone = !!answers[q._id]?.text || !!answers[q._id]?.file; 
            } else {
                isDone = !!answers[q._id];
            }

            if (!isDone) missingCount++;
        });

        setUnansweredCount(missingCount);
        setShowSubmitModal(true); 
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        setShowSubmitModal(false); 
        setIsSubmitting(true);
        setIsProcessing(true); 
        
        setProcessingMessage("Hệ thống Trợ lý AI đang phân tích và chấm điểm bài làm...");
        const timer1 = setTimeout(() => {
            setProcessingMessage("Hệ thống AI đang phản hồi chậm, xin đợi thêm ít phút...");
        }, 8000);
        
        const timer2 = setTimeout(() => {
            setProcessingMessage("Hệ thống vẫn đang xử lý, vui lòng không đóng trình duyệt lúc này...");
        }, 15000);

        const formData = new FormData();
        formData.append('MaDeThi', exam._id);

        const chiTietBaiLam = exam.DanhSachCauHoi.map(q => {
            let luaChon = '';

            if (q.LoaiCauHoi === 'TracNghiem' || q.LoaiCauHoi === 'DienKhuyet') {
                luaChon = answers[q._id] || ''; 
            } 
            else if (q.LoaiCauHoi === 'DungSai') {
                const arr = answers[q._id] || ['', '', '', '']; 
                luaChon = arr.join('-'); 
            } 
            else if (q.LoaiCauHoi === 'TuLuan') {
                const tuLuanObj = answers[q._id] || {};
                luaChon = tuLuanObj.text || ''; 
                
                if (tuLuanObj.file) {
                    formData.append(`file_${q._id}`, tuLuanObj.file);
                }
            }

            return {
                MaCauHoi: q._id,
                LuaChonCuaHocSinh: luaChon
            };
        });

        formData.append('ChiTietBaiLam', JSON.stringify(chiTietBaiLam));

        try {
            const res = await fetchClient('/api/ketquathithu', {
                method: 'POST',
                body: formData
            });

            clearTimeout(timer1);
            clearTimeout(timer2);

            if (res.ok) {
                const dataRes = await res.json();
                sessionStorage.removeItem(`exam_${id}_endTime`);
                setIsProcessing(false);
                setProcessingMessage("");
                
                // Nếu Back-end phản hồi aiFailed = true (Nghĩa là AI sập)
                if (dataRes.aiFailed) {
                    setResultModal({
                        isOpen: true,
                        isSuccess: true,
                        score: dataRes.DiemSo,
                        aiFailed: true, // Lưu lại cờ này để UI nhận biết
                        message: "Trợ lý AI hiện đang quá tải. Phần Tự luận của bạn đã được gửi cho Giáo viên chấm bù."
                    });

                    // Chờ 5s cho HS đọc thông báo rồi nhảy trang
                    setTimeout(() => {
                        navigate(`/ket-qua-thi/${dataRes._id}`);
                    }, 5000);
                } else {
                    // Nếu AI chấm trơn tru, bay thẳng qua trang kết quả
                    navigate(`/ket-qua-thi/${dataRes._id}`);
                }

            } else {
                const err = await res.json();
                setIsProcessing(false);
                setProcessingMessage("");
                setResultModal({
                    isOpen: true,
                    isSuccess: false,
                    message: `Lỗi nộp bài: ${err.message}`
                });
            }
        } catch (error) {
            console.error(error);
            clearTimeout(timer1);
            clearTimeout(timer2);
            setIsProcessing(false);
            setProcessingMessage("");
            setResultModal({
                isOpen: true,
                isSuccess: false,
                message: "Lỗi kết nối máy chủ! Không thể nộp bài lúc này."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-main-orange"></div></div>;
    
    if (fetchError) return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
            <i className="bi bi-file-earmark-x text-danger mb-3" style={{ fontSize: '5rem' }}></i>
            <h4 className="fw-bold text-dark">{fetchError}</h4>
            <button className="btn btn-primary rounded-pill px-4 py-2 mt-4 shadow-sm" onClick={() => navigate('/phong-luyen')}>
                <i className="bi bi-arrow-left me-2"></i>Quay lại phòng luyện
            </button>
        </div>
    );

    if (!exam) return null;

    return (
        <>
            <main className="bg-light min-vh-100 pb-5">
                <div className="bg-white shadow-sm sticky-top" style={{ zIndex: 1000, marginTop: '78px' }}>
                    <div className="container py-3 d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold text-dark mb-0 text-truncate me-3">
                            <i className="bi bi-file-earmark-text text-main-orange me-2"></i>
                            {exam.TenDeThi}
                        </h5>
                        
                        <button className="btn btn-outline-secondary fw-bold px-4 rounded-pill" onClick={() => navigate(-1)}>
                            <i className="bi bi-box-arrow-left me-2"></i>Thoát
                        </button>
                    </div>
                </div>

                <div className="container mt-4">
                    <div className="row g-4">
                        
                        <div className="col-lg-8 col-xl-9 order-2 order-lg-1">
                            {exam.DanhSachCauHoi?.map((q, idx) => (
                                <div key={q._id} id={`question-${idx}`} className="card shadow-sm border-0 mb-4 p-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <h5 className="fw-bold text-main-orange mb-0">Câu {idx + 1}</h5>
                                        <span className="badge bg-light text-dark border ms-3 fw-normal">{q.DoKho || 'Bình thường'}</span>
                                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2 fw-normal">
                                            {q.LoaiCauHoi === 'TracNghiem' ? 'Trắc nghiệm' : q.LoaiCauHoi === 'DungSai' ? 'Đúng/Sai' : q.LoaiCauHoi === 'DienKhuyet' ? 'Điền khuyết' : 'Tự luận'}
                                        </span>
                                    </div>
                                    
                                    <div className="fs-5 text-dark mb-3 lh-base" style={{ whiteSpace: 'pre-line' }}>
                                        {q.NoiDungCauHoi}
                                    </div>

                                    {q.HinhAnhMinhHoa && (
                                        <div className="mb-4 text-center">
                                            <img 
                                                src={q.HinhAnhMinhHoa} 
                                                alt={`Minh họa câu ${idx + 1}`} 
                                                className="img-fluid rounded shadow-sm border" 
                                                style={{ maxHeight: '400px', objectFit: 'contain' }} 
                                            />
                                        </div>
                                    )}

                                    {q.LoaiCauHoi === 'TracNghiem' && q.DanhSachLuaChon && (
                                        <div className="d-flex flex-column gap-3">
                                            {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                                                q.DanhSachLuaChon[optIdx] ? (
                                                    <label key={label} className={`p-3 border rounded-3 cursor-pointer transition-all ${answers[q._id] === label ? 'border-primary bg-primary-subtle' : 'bg-white'}`}>
                                                        <input 
                                                            type="radio" className="d-none" name={`q_${q._id}`} value={label} 
                                                            onChange={() => handleAnswerChange(q._id, label)} 
                                                            checked={answers[q._id] === label} 
                                                        />
                                                        <span className="fw-bold text-primary me-2">{label}.</span> {q.DanhSachLuaChon[optIdx]}
                                                    </label>
                                                ) : null
                                            ))}
                                        </div>
                                    )}

                                    {q.LoaiCauHoi === 'DungSai' && (
                                        <div className="d-flex flex-column gap-3">
                                            {['a', 'b', 'c', 'd'].map((char, dsIdx) => (
                                                <div key={char} className="p-3 border rounded-3 bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                                    <div className="flex-grow-1 fw-bold text-secondary">Phát biểu {char}</div>
                                                    <div className="btn-group shadow-sm flex-shrink-0">
                                                        <input type="radio" className="btn-check" id={`q_${q._id}_${dsIdx}_D`} checked={answers[q._id]?.[dsIdx] === 'Đ'} onChange={() => handleDSAnswer(q._id, dsIdx, 'Đ')} />
                                                        <label className={`btn ${answers[q._id]?.[dsIdx] === 'Đ' ? 'btn-primary' : 'btn-outline-primary'} px-3`} htmlFor={`q_${q._id}_${dsIdx}_D`}>Đúng</label>
                                                        
                                                        <input type="radio" className="btn-check" id={`q_${q._id}_${dsIdx}_S`} checked={answers[q._id]?.[dsIdx] === 'S'} onChange={() => handleDSAnswer(q._id, dsIdx, 'S')} />
                                                        <label className={`btn ${answers[q._id]?.[dsIdx] === 'S' ? 'btn-danger' : 'btn-outline-danger'} px-4`} htmlFor={`q_${q._id}_${dsIdx}_S`}>Sai</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {q.LoaiCauHoi === 'DienKhuyet' && (
                                        <input 
                                            type="text" 
                                            className="form-control form-control-lg shadow-none border-primary" 
                                            placeholder="Nhập đáp án của bạn vào đây..." 
                                            value={answers[q._id] || ''} 
                                            onChange={(e) => handleAnswerChange(q._id, e.target.value)} 
                                        />
                                    )}

                                    {q.LoaiCauHoi === 'TuLuan' && (
                                        <div className="d-flex flex-column gap-3 bg-light p-3 rounded-3 border mt-3">
                                            <label className="fw-bold text-dark">Bài làm của bạn:</label>
                                            <textarea 
                                                className="form-control shadow-none" 
                                                rows="5" 
                                                placeholder="Gõ trực tiếp nội dung văn bản bài làm của bạn vào đây..." 
                                                value={answers[q._id]?.text || ''} 
                                                onChange={(e) => handleAnswerChange(q._id, { ...(answers[q._id] || {}), text: e.target.value })}
                                            ></textarea>
                                            
                                            <div className="p-4 bg-white border border-primary border-2 rounded-3 mt-2" style={{ display: 'block' }}>
                                                <label htmlFor={`upload-${q._id}`} className="form-label fw-bold text-primary mb-3 fs-5">
                                                    <i className="bi bi-image me-2"></i>Đính kèm tệp bài làm (Chỉ Hình ảnh)
                                                </label>
                                                <input 
                                                    type="file" 
                                                    id={`upload-${q._id}`}
                                                    className="form-control form-control-lg border-primary shadow-sm" 
                                                    accept="image/*" 
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file && !file.type.startsWith('image/')) {
                                                            alert('Hệ thống chỉ cho phép tải lên định dạng hình ảnh (JPG, PNG, JPEG, GIF...).');
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        handleFileUpload(q._id, file);
                                                    }} 
                                                    style={{ display: 'block', width: '100%' }}
                                                />
                                                <small className="text-muted mt-2 d-block">Định dạng hỗ trợ: JPG, JPEG, PNG, GIF, WEBP.</small>
                                            </div>

                                            {answers[q._id]?.fileName && (
                                                <div className="d-flex align-items-center bg-white px-3 py-2 rounded shadow-sm border border-success mt-2">
                                                    <i className="bi bi-image-fill text-success fs-4 me-3"></i>
                                                    <div className="flex-grow-1 text-truncate fw-bold text-dark" style={{ maxWidth: '75%' }}>
                                                        {answers[q._id].fileName}
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-danger btn-sm ms-auto fw-bold flex-shrink-0" 
                                                        onClick={() => handleRemoveFile(q._id)}
                                                    >
                                                        <i className="bi bi-trash-fill me-1"></i> Xóa
                                                    </button>
                                                </div>
                                            )}

                                            {answers[q._id]?.file && (
                                                <div className="mt-3 text-center bg-white p-2 rounded border shadow-sm">
                                                    <img 
                                                        src={URL.createObjectURL(answers[q._id].file)} 
                                                        alt="Preview bài làm" 
                                                        className="img-fluid rounded" 
                                                        style={{ maxHeight: '400px', objectFit: 'contain' }} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="col-lg-4 col-xl-3 order-1 order-lg-2 mb-4 mb-lg-0">
                            <div className="sticky-top" style={{ top: '150px', zIndex: 900 }}>
                                
                                <div className="card shadow-sm border-0 mb-3">
                                    <div className="card-body text-center p-4">
                                        {userRole === 'HocSinh' ? (
                                            <>
                                                <h6 className="fw-bold text-secondary mb-3"><i className="bi bi-alarm me-2"></i>THỜI GIAN CÒN LẠI</h6>
                                                <div className={`display-4 fw-bold mb-4 ${timeLeft <= 300 ? 'text-danger animate__animated animate__flash animate__infinite' : 'text-primary'}`}>
                                                    {formatTime(timeLeft)}
                                                </div>
                                                <button 
                                                    className="btn btn-main-orange text-white fw-bold w-100 py-3 rounded-pill shadow" 
                                                    onClick={handlePreSubmit} 
                                                    disabled={isSubmitting || isTimeUp || isProcessing}
                                                >
                                                    {isSubmitting || isProcessing ? (
                                                        <><span className="spinner-border spinner-border-sm me-2"></span> ĐANG NỘP BÀI...</>
                                                    ) : (
                                                        <><i className="bi bi-send-check-fill me-2"></i> NỘP BÀI NGAY</>
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="py-3">
                                                <span className="badge bg-secondary px-4 py-3 fs-6 rounded-pill">
                                                    <i className="bi bi-eye me-2"></i>CHẾ ĐỘ XEM TRƯỚC
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0">
                                    <div className="card-header bg-white border-bottom-0 pt-4 pb-2">
                                        <h6 className="fw-bold mb-0">Bảng tiến độ</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {(exam?.DanhSachCauHoi || []).map((q, idx) => {
                                                let isDone = false;
                                                if (q.LoaiCauHoi === 'DungSai') {
                                                    const arr = answers[q._id] || [];
                                                    isDone = arr.filter(x => x !== '').length === 4;
                                                } else if (q.LoaiCauHoi === 'TuLuan') {
                                                    isDone = !!answers[q._id]?.text || !!answers[q._id]?.file;
                                                } else {
                                                    isDone = !!answers[q._id];
                                                }

                                                return (
                                                    <a 
                                                        key={q._id} 
                                                        href={`#question-${idx}`} 
                                                        className={`btn btn-sm ${isDone ? 'btn-primary' : 'btn-outline-secondary'} rounded-3 fw-bold`}
                                                        style={{ width: '45px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title={isDone ? "Đã làm" : "Chưa làm"}
                                                    >
                                                        {idx + 1}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* OVERLAY XÁC NHẬN TRƯỚC KHI NỘP BÀI */}
            {showSubmitModal && (
                <div 
                    className="d-flex align-items-center justify-content-center" 
                    style={{
                        position: 'fixed', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.6)', 
                        zIndex: 9999,
                        backdropFilter: 'blur(3px)'
                    }}
                >
                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
                        
                        {unansweredCount > 0 ? (
                            <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '4rem' }}></i>
                        ) : (
                            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                        )}
                        
                        <h4 className="fw-bold mt-3 text-dark">Xác nhận nộp bài</h4>
                        
                        {unansweredCount > 0 ? (
                            <p className="text-muted mt-2 fs-6">
                                Bạn còn <strong className="text-danger fs-5">{unansweredCount} câu hỏi</strong> chưa hoàn thành. Các câu bị bỏ trống sẽ không được tính điểm.
                            </p>
                        ) : (
                            <p className="text-muted mt-2 fs-6">
                                Bạn đã hoàn thành tất cả câu hỏi trong bài thi. Bạn đã sẵn sàng để nộp bài chưa?
                            </p>
                        )}
                        
                        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 mt-4">
                            <button 
                                className="btn btn-light border fw-bold rounded-pill px-4 py-2" 
                                onClick={() => setShowSubmitModal(false)}
                            >
                                Quay lại làm tiếp
                            </button>
                            <button 
                                className="btn btn-main-orange text-white fw-bold rounded-pill px-4 py-2" 
                                onClick={() => handleSubmit(false)}
                            >
                                Xác nhận nộp bài
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY CHỜ AI XỬ LÝ VỚI TIN NHẮN ĐỘNG */}
            {isProcessing && processingMessage !== '' && (
                <div 
                    className="d-flex align-items-center justify-content-center" 
                    style={{
                        position: 'fixed', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        zIndex: 10000,
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__pulse animate__infinite" style={{ maxWidth: '400px', width: '90%' }}>
                        <div className="spinner-border text-main-orange mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                        <h4 className="fw-bold text-dark">Đang xử lý bài làm</h4>
                        <p className="text-primary fw-bold mt-3 mb-0 fs-6 animate__animated animate__fadeIn">
                            {processingMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* OVERLAY KẾT QUẢ NỘP BÀI KHI AI THẤT BẠI */}
            {resultModal.isOpen && (
                <div 
                    className="d-flex align-items-center justify-content-center" 
                    style={{
                        position: 'fixed', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.7)', 
                        zIndex: 10000,
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__bounceIn" style={{ maxWidth: '450px', width: '90%' }}>
                        {resultModal.isSuccess ? (
                            <>
                                <div className="mb-4">
                                    <i className="bi bi-check-circle-fill text-success drop-shadow" style={{ fontSize: '6rem' }}></i>
                                </div>
                                <h3 className="fw-bold text-dark mb-2">Nộp bài thành công!</h3>
                                
                                <div className="alert alert-warning mt-3 mb-4 small text-start shadow-sm">
                                    <i className="bi bi-info-circle-fill me-2"></i>
                                    {resultModal.message}
                                </div>

                                <div className="bg-light rounded-4 p-3 mb-4 border shadow-sm">
                                    {/* ĐÃ SỬA: BẮT THEO CỜ aiFailed */}
                                    <p className="text-muted mb-1 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>
                                        {resultModal.aiFailed ? 'Điểm trắc nghiệm (Tạm tính)' : 'Điểm hệ thống tự chấm'}
                                    </p>
                                    <h1 className="display-4 fw-bold text-main-orange mb-0">
                                        {resultModal.score}<span className="fs-4 text-muted">/10</span>
                                    </h1>
                                </div>
                                
                                <div className="spinner-border spinner-border-sm text-secondary me-2"></div>
                                <span className="text-muted small">Đang chuyển hướng đến trang kết quả...</span>
                            </>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <i className="bi bi-x-octagon-fill text-danger" style={{ fontSize: '5rem' }}></i>
                                </div>
                                <h3 className="fw-bold text-dark mb-2">Nộp bài thất bại</h3>
                                <p className="text-muted mb-4">{resultModal.message}</p>
                                <button 
                                    className="btn btn-secondary fw-bold rounded-pill px-5 py-3 w-100" 
                                    onClick={() => setResultModal({ ...resultModal, isOpen: false })}
                                >
                                    Đóng và thử lại
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default LamBaiThi;