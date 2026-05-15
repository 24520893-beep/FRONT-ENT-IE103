import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient'; 

const LamBaiThi = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [userRole, setUserRole] = useState(null);
    const [exam, setExam] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(''); // State xử lý lỗi khi tải đề
    const [isSubmitting, setIsSubmitting] = useState(false);

    // QUẢN LÝ THỜI GIAN VÀ ĐÁP ÁN
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false); 
    const [answers, setAnswers] = useState({});

    // === STATE QUẢN LÝ OVERLAY ===
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [unansweredCount, setUnansweredCount] = useState(0);
    
    // STATE MỚI: Quản lý Modal Kết quả sau khi nộp bài
    const [resultModal, setResultModal] = useState({
        isOpen: false,
        isSuccess: false,
        score: 0,
        message: ''
    });

    // 1. FETCH DỮ LIỆU ĐỀ THI TỪ VIEW & LẤY QUYỀN USER
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

    // 2. ĐỒNG HỒ ĐẾM NGƯỢC
    useEffect(() => {
        if (userRole !== 'HocSinh' || timeLeft === null || isSubmitting || isTimeUp) return;

        if (timeLeft <= 0) {
            setIsTimeUp(true); 
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isSubmitting, userRole, isTimeUp]);

    // Tự động thu bài khi hết giờ
    useEffect(() => {
        if (isTimeUp && !isSubmitting && !resultModal.isOpen) {
            setShowSubmitModal(false); 
            handleSubmit(true); // Gửi cờ true để nhận diện tự động nộp do hết giờ
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

    // 3. XỬ LÝ LƯU ĐÁP ÁN
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
        const reader = new FileReader();
        reader.onloadend = () => {
            setAnswers(prev => {
                const currentObj = prev[qId] || { text: '', imageBase64: null, fileName: '' };
                return { ...prev, [qId]: { ...currentObj, imageBase64: reader.result, fileName: file.name } };
            });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = (qId) => {
        setAnswers(prev => {
            const currentObj = prev[qId] || { text: '' };
            return { ...prev, [qId]: { ...currentObj, imageBase64: null, fileName: '' } };
        });
        const fileInput = document.getElementById(`upload-${qId}`);
        if (fileInput) fileInput.value = '';
    };

    // === HÀM KIỂM TRA TRƯỚC KHI NỘP BÀI (MỞ OVERLAY) ===
    const handlePreSubmit = () => {
        let missingCount = 0;
        
        exam.DanhSachCauHoi.forEach(q => {
            let isDone = false;
            if (q.LoaiCauHoi === 'DungSai') {
                const arr = answers[q._id] || [];
                isDone = arr.filter(x => x !== '').length === 4;
            } else if (q.LoaiCauHoi === 'TuLuan') {
                isDone = !!answers[q._id]?.text || !!answers[q._id]?.imageBase64;
            } else {
                isDone = !!answers[q._id];
            }

            if (!isDone) missingCount++;
        });

        setUnansweredCount(missingCount);
        setShowSubmitModal(true); 
    };

    // 4. LOGIC NỘP BÀI THI & CHẤM ĐIỂM
    const handleSubmit = async (isAutoSubmit = false) => {
        setShowSubmitModal(false); 
        setIsSubmitting(true);

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
                if (tuLuanObj.imageBase64) {
                    luaChon += `\n[Có đính kèm file: ${tuLuanObj.fileName}]`;
                }
            }

            return {
                MaCauHoi: q._id,
                LuaChonCuaHocSinh: luaChon
            };
        });

        try {
            const res = await fetchClient('/api/ketquathithu', {
                method: 'POST',
                body: JSON.stringify({
                    MaDeThi: exam._id,
                    ChiTietBaiLam: chiTietBaiLam
                })
            });

            if (res.ok) {
                const dataRes = await res.json();
                sessionStorage.removeItem(`exam_${id}_endTime`);
                
                // MỞ MODAL THÔNG BÁO THÀNH CÔNG THAY VÌ ALERT
                setResultModal({
                    isOpen: true,
                    isSuccess: true,
                    score: dataRes.DiemSo,
                    message: isAutoSubmit ? "Đã hết thời gian! Hệ thống đã tự động thu bài của bạn." : "Bài làm của bạn đã được ghi nhận vào hệ thống."
                });
            } else {
                const err = await res.json();
                setResultModal({
                    isOpen: true,
                    isSuccess: false,
                    message: `Lỗi nộp bài: ${err.message}`
                });
            }
        } catch (error) {
            console.error(error);
            setResultModal({
                isOpen: true,
                isSuccess: false,
                message: "Lỗi kết nối máy chủ! Không thể nộp bài lúc này."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // RENDERS
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
                        
                        {/* CỘT TRÁI: NỘI DUNG CÂU HỎI */}
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

                                    {/* HIỂN THỊ ẢNH MINH HỌA NẾU CÓ */}
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

                                    {/* 1. TRẮC NGHIỆM */}
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

                                    {/* 2. ĐÚNG / SAI */}
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

                                    {/* 3. ĐIỀN KHUYẾT */}
                                    {q.LoaiCauHoi === 'DienKhuyet' && (
                                        <input 
                                            type="text" 
                                            className="form-control form-control-lg shadow-none border-primary" 
                                            placeholder="Nhập đáp án của bạn vào đây..." 
                                            value={answers[q._id] || ''} 
                                            onChange={(e) => handleAnswerChange(q._id, e.target.value)} 
                                        />
                                    )}

                                    {/* 4. TỰ LUẬN */}
                                    {q.LoaiCauHoi === 'TuLuan' && (
                                        <div className="d-flex flex-column gap-3 bg-light p-3 rounded-3 border mt-3">
                                            <label className="fw-bold text-dark">Bài làm của bạn:</label>
                                            <textarea 
                                                className="form-control shadow-none" 
                                                rows="5" 
                                                placeholder="Gõ trực tiếp nội dung bài làm của bạn vào đây..." 
                                                value={answers[q._id]?.text || ''} 
                                                onChange={(e) => handleAnswerChange(q._id, { ...(answers[q._id] || {}), text: e.target.value })}
                                            ></textarea>
                                            
                                            <div className="p-4 bg-white border border-primary border-2 rounded-3 mt-2" style={{ display: 'block' }}>
                                                <label htmlFor={`upload-${q._id}`} className="form-label fw-bold text-primary mb-3 fs-5">
                                                    <i className="bi bi-paperclip me-2"></i>Đính kèm tệp bài làm (Hình ảnh hoặc PDF)
                                                </label>
                                                <input 
                                                    type="file" 
                                                    id={`upload-${q._id}`}
                                                    className="form-control form-control-lg border-primary shadow-sm" 
                                                    accept="image/*,application/pdf" 
                                                    onChange={(e) => handleFileUpload(q._id, e.target.files[0])} 
                                                    style={{ display: 'block', width: '100%' }}
                                                />
                                                <small className="text-muted mt-2 d-block">Định dạng hỗ trợ: JPG, PNG, PDF.</small>
                                            </div>

                                            {answers[q._id]?.fileName && (
                                                <div className="d-flex align-items-center bg-white px-3 py-2 rounded shadow-sm border border-success mt-2">
                                                    <i className={`bi ${answers[q._id].fileName.toLowerCase().endsWith('.pdf') ? 'bi-file-pdf-fill text-danger' : 'bi-image-fill text-success'} fs-4 me-3`}></i>
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

                                            {answers[q._id]?.imageBase64 && (
                                                <div className="mt-3 text-center bg-white p-2 rounded border shadow-sm">
                                                    {answers[q._id].fileName.toLowerCase().endsWith('.pdf') ? (
                                                        <object 
                                                            data={answers[q._id].imageBase64} 
                                                            type="application/pdf" 
                                                            width="100%" 
                                                            height="500px" 
                                                            className="rounded"
                                                        >
                                                            <div className="p-4 text-center">
                                                                <i className="bi bi-file-earmark-pdf text-danger" style={{ fontSize: '3rem' }}></i>
                                                                <p className="text-muted mt-3 mb-1">Trình duyệt của bạn không hỗ trợ xem trước PDF.</p>
                                                                <a href={answers[q._id].imageBase64} download={answers[q._id].fileName} className="btn btn-primary btn-sm mt-2">
                                                                    Tải file xuống để xem
                                                                </a>
                                                            </div>
                                                        </object>
                                                    ) : (
                                                        <img 
                                                            src={answers[q._id].imageBase64} 
                                                            alt="Preview bài làm" 
                                                            className="img-fluid rounded" 
                                                            style={{ maxHeight: '400px', objectFit: 'contain' }} 
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* CỘT PHẢI: MAP CÂU HỎI TRỰC QUAN & ĐỒNG HỒ NỘP BÀI */}
                        <div className="col-lg-4 col-xl-3 order-1 order-lg-2 mb-4 mb-lg-0">
                            <div className="sticky-top" style={{ top: '150px', zIndex: 900 }}>
                                
                                {/* CARD: ĐỒNG HỒ VÀ NỘP BÀI */}
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
                                                    disabled={isSubmitting || isTimeUp}
                                                >
                                                    {isSubmitting ? (
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

                                {/* CARD: BẢNG TIẾN ĐỘ */}
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
                                                    isDone = !!answers[q._id]?.text || !!answers[q._id]?.imageBase64;
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

            {/* === OVERLAY 1: XÁC NHẬN TRƯỚC KHI NỘP BÀI === */}
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

            {/* === OVERLAY 2: THÔNG BÁO KẾT QUẢ ĐIỂM SỐ (THAY THẾ CHO ALERT) === */}
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
                                    <i className="bi bi-trophy-fill text-warning drop-shadow" style={{ fontSize: '6rem' }}></i>
                                </div>
                                <h3 className="fw-bold text-dark mb-2">Nộp bài thành công!</h3>
                                <p className="text-muted mb-4">{resultModal.message}</p>
                                
                                <div className="bg-light rounded-4 p-4 mb-4 border shadow-sm">
                                    <p className="text-muted mb-1 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Điểm hệ thống tự chấm</p>
                                    <h1 className="display-2 fw-bold text-main-orange mb-0">
                                        {resultModal.score}<span className="fs-3 text-muted">/10</span>
                                    </h1>
                                </div>
                                
                                <button 
                                    className="btn btn-main-orange text-white fw-bold rounded-pill px-5 py-3 w-100 shadow" 
                                    onClick={() => navigate('/ket-qua-thi')}
                                >
                                    <i className="bi bi-graph-up-arrow me-2"></i>Xem chi tiết kết quả
                                </button>
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