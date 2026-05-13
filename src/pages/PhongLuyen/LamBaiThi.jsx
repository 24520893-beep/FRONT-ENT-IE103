import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../ThuVien/ChiTietCauHoi';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const LamBaiThi = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [userRole, setUserRole] = useState(null);
    const [exam, setExam] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // QUẢN LÝ THỜI GIAN VÀ ĐÁP ÁN
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false); // Thêm cờ nhận diện hết giờ để tránh Stale state
    const [answers, setAnswers] = useState({});

    // 1. FETCH DỮ LIỆU ĐỀ THI & LẤY QUYỀN USER
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUserRole(JSON.parse(savedUser).VaiTro);
        }

        const fetchExam = async () => {
            try {
                // Đã sửa: Dùng fetchClient để lấy dữ liệu đề thi
                const res = await fetchClient(`/api/dethithu/${id}`);
                
                if (res.ok) {
                    const data = await res.json();
                    setExam(data);

                    // ==========================================
                    // BẢN VÁ LỖI BẢO MẬT: CHỐNG HACK THỜI GIAN
                    // ==========================================
                    const examKey = `exam_${id}_endTime`;
                    const savedEndTime = sessionStorage.getItem(examKey);
                    const now = new Date().getTime();

                    if (savedEndTime && parseInt(savedEndTime) > now) {
                        // Nếu đã đang làm bài, tính số giây còn lại dựa trên mốc kết thúc
                        setTimeLeft(Math.floor((parseInt(savedEndTime) - now) / 1000));
                    } else {
                        // Nếu mới bắt đầu làm, thiết lập mốc kết thúc mới và lưu vào sessionStorage
                        const timeInSeconds = data.ThoiGianGioiHan * 60;
                        setTimeLeft(timeInSeconds);
                        sessionStorage.setItem(examKey, now + timeInSeconds * 1000);
                    }
                } else {
                    alert("Không tìm thấy đề thi!");
                    navigate('/phong-luyen');
                }
            } catch (error) {
                console.error("Lỗi:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchExam();
    }, [id, navigate]);

    // 2. ĐỒNG HỒ ĐẾM NGƯỢC (CHỈ CHẠY CHO HỌC SINH)
    useEffect(() => {
        if (userRole !== 'HocSinh' || timeLeft === null || isSubmitting || isTimeUp) return;

        if (timeLeft <= 0) {
            setIsTimeUp(true); // Bật cờ hết giờ thay vì gọi thẳng handleSubmit để tránh Stale state
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isSubmitting, userRole, isTimeUp]);

    // Lắng nghe sự kiện hết giờ để tự động nộp bài
    useEffect(() => {
        if (isTimeUp && !isSubmitting) {
            alert("Đã hết thời gian làm bài! Hệ thống tự động thu bài của bạn.");
            handleSubmit(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTimeUp]); // Chỉ trigger khi isTimeUp thay đổi, closure lúc này sẽ chứa toàn bộ state mới nhất

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // 3. XỬ LÝ LƯU ĐÁP ÁN (FRONT-END)
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

    // 4. LOGIC NỘP BÀI THI & CHẤM ĐIỂM
    const handleSubmit = async (isAutoSubmit = false) => {
        // Nếu tự nộp do hết giờ thì không hỏi lại
        if (!isAutoSubmit && timeLeft > 0 && !window.confirm("Bạn có chắc chắn muốn nộp bài? Câu hỏi chưa làm sẽ bị tính là sai!")) {
            return;
        }
        
        setIsSubmitting(true);

        const chiTietBaiLam = exam.DanhSachCauHoi.map(q => {
            let luaChon = '';
            let isCorrect = false;

            if (q.LoaiCauHoi === 'TracNghiem') {
                luaChon = answers[q._id] || ''; 
                isCorrect = luaChon === q.DapAnChinhXac; 
            } 
            else if (q.LoaiCauHoi === 'DienKhuyet') {
                luaChon = answers[q._id] || '';
                isCorrect = luaChon.trim().toLowerCase() === (q.DapAnChinhXac || '').trim().toLowerCase();
            } 
            else if (q.LoaiCauHoi === 'DungSai') {
                const arr = answers[q._id] || ['', '', '', '']; 
                luaChon = arr.join('-');
                
                let correctArr = ['Đ','Đ','Đ','Đ'];
                if (q.DanhSachLuaChon && q.DanhSachLuaChon.length > 0) {
                    correctArr = q.DanhSachLuaChon.map(v => v.toString().trim().charAt(0).toUpperCase() === 'S' ? 'S' : 'Đ');
                }
                while(correctArr.length < 4) correctArr.push('Đ');
                
                isCorrect = arr.every((v, i) => v === correctArr[i]); 
            } 
            else if (q.LoaiCauHoi === 'TuLuan') {
                const tuLuanObj = answers[q._id] || {};
                luaChon = tuLuanObj.text || '';
                if (tuLuanObj.imageBase64) {
                    luaChon += `\n[Có đính kèm file: ${tuLuanObj.fileName}]`;
                }
                isCorrect = false; // Tự luận đợi GV chấm
            }

            return {
                MaCauHoi: q._id,
                LuaChonCuaHocSinh: luaChon,
                KetQuaDungSai: isCorrect
            };
        });

        // Tính điểm phần tự động chấm
        const autoGradable = exam.DanhSachCauHoi.filter(q => q.LoaiCauHoi !== 'TuLuan');
        const correctCount = chiTietBaiLam.filter(c => {
            const q = exam.DanhSachCauHoi.find(x => x._id === c.MaCauHoi);
            return q.LoaiCauHoi !== 'TuLuan' && c.KetQuaDungSai;
        }).length;
        
        const diemSo = autoGradable.length > 0 ? Number(((correctCount / autoGradable.length) * 10).toFixed(2)) : 0;

        try {
            // Đã sửa: Dùng fetchClient để nộp bài
            const res = await fetchClient('/api/ketquathithu', {
                method: 'POST',
                body: JSON.stringify({
                    MaDeThi: exam._id,
                    DiemSo: diemSo,
                    ChiTietBaiLam: chiTietBaiLam
                })
            });

            if (res.ok) {
                // Xóa session lưu trữ thời gian sau khi nộp thành công
                sessionStorage.removeItem(`exam_${id}_endTime`);
                
                alert(`Nộp bài thành công! Điểm hệ thống tự chấm: ${diemSo}/10`);
                navigate('/phong-luyen'); 
            } else {
                const err = await res.json();
                alert(`Lỗi nộp bài: ${err.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối máy chủ!");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-main-orange"></div></div>;
    if (!exam) return null;

    return (
        <main className="bg-light min-vh-100 pb-5">
            {/* THANH TOP BAR CỐ ĐỊNH */}
            <div className="bg-white shadow-sm sticky-top" style={{ zIndex: 1000 }}>
                <div className="container py-3 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold text-dark mb-0 text-truncate me-3">
                        <i className="bi bi-file-earmark-text text-main-orange me-2"></i>
                        {exam.TenDeThi}
                    </h5>
                    
                    <div className="d-flex align-items-center gap-4">
                        {/* HIỂN THỊ ĐỒNG HỒ & NÚT NỘP NẾU LÀ HỌC SINH */}
                        {userRole === 'HocSinh' ? (
                            <>
                                <div className={`fs-5 fw-bold ${timeLeft <= 300 ? 'text-danger animate__animated animate__flash animate__infinite' : 'text-primary'}`}>
                                    <i className="bi bi-clock-history me-2"></i>
                                    {formatTime(timeLeft)}
                                </div>
                                <button 
                                    className="btn btn-main-orange text-white fw-bold px-4" 
                                    onClick={() => handleSubmit(false)} 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Đang nộp...' : 'Nộp bài ngay'}
                                </button>
                            </>
                        ) : (
                            /* GIAO DIỆN XEM TRƯỚC CHO GIÁO VIÊN/ADMIN */
                            <span className="badge bg-secondary px-3 py-2 fs-6">
                                <i className="bi bi-eye me-2"></i>Chế độ xem trước
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mt-4">
                <div className="row g-4">
                    {/* CỘT TRÁI: NỘI DUNG CÂU HỎI */}
                    <div className="col-lg-8 col-xl-9">
                        {exam.DanhSachCauHoi.map((q, idx) => (
                            <div key={q._id} id={`question-${idx}`} className="card shadow-sm border-0 mb-4 p-4">
                                <div className="d-flex align-items-center mb-3">
                                    <h5 className="fw-bold text-main-orange mb-0">Câu {idx + 1}</h5>
                                    <span className="badge bg-light text-dark border ms-3 fw-normal">{q.DoKho}</span>
                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2 fw-normal">
                                        {q.LoaiCauHoi === 'TracNghiem' ? 'Trắc nghiệm' : q.LoaiCauHoi === 'DungSai' ? 'Đúng/Sai' : q.LoaiCauHoi === 'DienKhuyet' ? 'Điền khuyết' : 'Tự luận'}
                                    </span>
                                </div>
                                
                                <div className="fs-5 text-dark mb-4 lh-base" style={{ whiteSpace: 'pre-line' }}>
                                    {q.NoiDungCauHoi}
                                </div>

                                {/* 1. TRẮC NGHIỆM */}
                                {q.LoaiCauHoi === 'TracNghiem' && (
                                    <div className="d-flex flex-column gap-3">
                                        {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                                            <label key={label} className={`p-3 border rounded-3 cursor-pointer transition-all ${answers[q._id] === label ? 'border-primary bg-primary-subtle' : 'bg-white'}`}>
                                                <input 
                                                    type="radio" className="d-none" name={`q_${q._id}`} value={label} 
                                                    onChange={() => handleAnswerChange(q._id, label)} 
                                                    checked={answers[q._id] === label} 
                                                />
                                                <span className="fw-bold text-primary me-2">{label}.</span> {q.DanhSachLuaChon[optIdx]}
                                            </label>
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
                                    <div className="d-flex flex-column gap-3 bg-light p-3 rounded-3 border">
                                        <textarea 
                                            className="form-control shadow-none" 
                                            rows="5" 
                                            placeholder="Gõ trực tiếp nội dung bài làm của bạn..." 
                                            value={answers[q._id]?.text || ''} 
                                            onChange={(e) => handleAnswerChange(q._id, { ...(answers[q._id] || {}), text: e.target.value })}
                                        ></textarea>
                                        
                                        <div className="d-flex align-items-center gap-3 mt-2">
                                            <label className="btn btn-outline-main-orange fw-bold cursor-pointer">
                                                <i className="bi bi-camera me-2"></i>Đính kèm ảnh bài giải
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="d-none" 
                                                    onChange={(e) => handleFileUpload(q._id, e.target.files[0])} 
                                                />
                                            </label>
                                            
                                            {answers[q._id]?.fileName && (
                                                <span className="small text-muted bg-white px-3 py-2 rounded-pill shadow-sm border">
                                                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                    {answers[q._id].fileName}
                                                </span>
                                            )}
                                        </div>

                                        {answers[q._id]?.imageBase64 && (
                                            <div className="mt-2 text-center bg-white p-2 rounded border">
                                                <img src={answers[q._id].imageBase64} alt="Preview bài làm" className="img-fluid rounded" style={{ maxHeight: '300px' }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* CỘT PHẢI: MAP CÂU HỎI TRỰC QUAN */}
                    <div className="col-lg-4 col-xl-3 d-none d-lg-block">
                        <div className="card shadow-sm border-0 sticky-top" style={{ top: '90px' }}>
                            <div className="card-header bg-white border-bottom-0 pt-4 pb-2">
                                <h6 className="fw-bold mb-0">Bảng tiến độ</h6>
                            </div>
                            <div className="card-body">
                                <div className="d-flex flex-wrap gap-2">
                                    {exam.DanhSachCauHoi.map((q, idx) => {
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
        </main>
    );
};

export default LamBaiThi;