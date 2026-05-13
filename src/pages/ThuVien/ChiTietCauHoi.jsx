import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './ChiTietCauHoi.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ChiTietCauHoi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // STATE DỮ LIỆU
    const [question, setQuestion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);

    // STATE TƯƠNG TÁC NGƯỜI DÙNG
    const [userAnswer, setUserAnswer] = useState(''); 
    const [userAnswersDS, setUserAnswersDS] = useState(['', '', '', '']); // 4 ý của câu Đúng/Sai
    const [isSubmitted, setIsSubmitted] = useState(false); 
    const [isCorrect, setIsCorrect] = useState(null); 

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const userObj = JSON.parse(savedUser);
            setUserRole(userObj.VaiTro);
            setCurrentUserId(userObj._id);
        }

        const fetchDetail = async () => {
            try {
                // Đã sửa: Dùng fetchClient để tự động xử lý URL và Token
                const res = await fetchClient(`/api/cauhoi/${id}`);
                const data = await res.json();
                
                if (res.ok) {
                    setQuestion(data);
                } else {
                    alert("Không tìm thấy câu hỏi!");
                    navigate('/thu-vien');
                }
            } catch (error) {
                console.error("Lỗi:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    // XỬ LÝ DỮ LIỆU CHUẨN SCHEMA
    let parsedDSAnswers = ['Đ', 'Đ', 'Đ', 'Đ']; 
    
    if (question && question.LoaiCauHoi === 'DungSai') {
        if (Array.isArray(question.DanhSachLuaChon) && question.DanhSachLuaChon.length > 0) {
            parsedDSAnswers = question.DanhSachLuaChon.map(val => {
                if (!val) return 'Đ';
                const firstChar = val.toString().trim().charAt(0).toUpperCase();
                return firstChar === 'S' ? 'S' : 'Đ';
            });
        }
        while (parsedDSAnswers.length < 4) parsedDSAnswers.push('Đ');
    }

    const handleSelectDS = (index, value) => {
        const newAnswers = [...userAnswersDS];
        newAnswers[index] = value;
        setUserAnswersDS(newAnswers);
    };

    const handleSubmitAnswer = () => {
        if (question.LoaiCauHoi === 'DungSai') {
            if (userAnswersDS.includes('')) {
                alert("Vui lòng chọn Đúng hoặc Sai cho tất cả 4 phát biểu!");
                return;
            }
        } else if (!userAnswer.trim() && question.LoaiCauHoi !== 'TuLuan') {
            alert("Vui lòng chọn hoặc nhập câu trả lời trước khi kiểm tra!");
            return;
        }

        setIsSubmitted(true);

        if (question.LoaiCauHoi === 'TracNghiem') {
            setIsCorrect(userAnswer === question.DapAnChinhXac);
        } 
        else if (question.LoaiCauHoi === 'DienKhuyet') {
            const normalizedUser = userAnswer.toString().trim().toLowerCase();
            const normalizedCorrect = (question.DapAnChinhXac || '').toString().trim().toLowerCase();
            setIsCorrect(normalizedUser === normalizedCorrect);
        }
        else if (question.LoaiCauHoi === 'DungSai') {
            const isAllCorrect = userAnswersDS.every((val, idx) => val === parsedDSAnswers[idx]);
            setIsCorrect(isAllCorrect);
        }
    };

    const handleReset = () => {
        setUserAnswer('');
        setUserAnswersDS(['', '', '', '']);
        setIsSubmitted(false);
        setIsCorrect(null);
    };

    const handleHoiAI = () => {
        let cauHoiChoAI = "";

        if (question.LoaiCauHoi === 'DungSai') {
            const saiCacY = [];
            ['a', 'b', 'c', 'd'].forEach((char, idx) => {
                if (userAnswersDS[idx] !== parsedDSAnswers[idx]) {
                    saiCacY.push(`- Phát biểu ${char}: Đáp án chuẩn là **${parsedDSAnswers[idx] === 'Đ' ? 'ĐÚNG' : 'SAI'}**`);
                }
            });

            cauHoiChoAI = `Tôi đã làm sai một số ý trong câu hỏi Đúng/Sai sau. Hãy giải thích chi tiết giúp tôi tại sao các ý này lại có đáp án như vậy nhé:\n\n` +
                `**Môn học:** ${question.MonHoc}\n` +
                `**Đề bài chính (Gồm các phát biểu):**\n${question.NoiDungCauHoi}\n\n` +
                `**Các ý tôi làm sai và cần giải thích:**\n${saiCacY.join('\n')}\n\n` +
                `Hãy phân tích ngắn gọn, dễ hiểu từng ý một dựa trên đề bài.`;
                
        } else if (question.LoaiCauHoi === 'TuLuan') {
            cauHoiChoAI = `Giải thích chi tiết và hướng dẫn tôi cách tư duy để giải quyết câu hỏi tự luận sau:\n\n` +
                `**Môn học:** ${question.MonHoc}\n` +
                `**Đề bài:**\n${question.NoiDungCauHoi}\n\n` +
                `**Gợi ý đáp án:**\n${question.DapAnGoiY || 'Chưa có gợi ý'}\n\n` +
                `Hãy đóng vai một giáo viên, phân tích đề và hướng dẫn tôi từng bước để giải quyết câu hỏi này.`;
        } else {
            let thongTinDapAn = "";
            if (question.LoaiCauHoi === 'TracNghiem') {
                const index = ['A', 'B', 'C', 'D'].indexOf(question.DapAnChinhXac);
                thongTinDapAn = `Phương án ${question.DapAnChinhXac}: ${question.DanhSachLuaChon?.[index] || ''}`;
            } else {
                thongTinDapAn = question.DapAnChinhXac;
            }

            cauHoiChoAI = `Giải thích chi tiết cho tôi câu hỏi sau:\n\n` +
                `**Môn học:** ${question.MonHoc}\n` +
                `**Nội dung:**\n${question.NoiDungCauHoi}\n\n` +
                `**Đáp án đúng là:**\n${thongTinDapAn}\n\n` +
                `Hãy giải thích chi tiết tại sao lại có kết quả như vậy một cách dễ hiểu nhất.`;
        }

        const event = new CustomEvent('openAIChat', { 
            detail: { message: cauHoiChoAI } 
        });
        window.dispatchEvent(event);
    };

    const getStatusBadge = (status) => {
        if (status === 'Hoàn thiện' || status === 'Đã xuất bản') return 'bg-success';
        if (status === 'Đã từ chối' || status === 'Từ chối') return 'bg-danger';
        return 'bg-warning text-dark';
    };

    if (isLoading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-main-orange" role="status"></div>
            <p className="mt-2 text-muted">Đang tải câu hỏi...</p>
        </div>
    );

    if (!question) return null;

    return (
        <main className={styles.pageDetail}>
            <nav className="bg-light py-3 border-bottom mb-4">
                <div className="container">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><Link to="/thu-vien">Thư viện</Link></li>
                        <li className="breadcrumb-item active">Chi tiết câu hỏi</li>
                    </ol>
                </div>
            </nav>

            <div className="container mb-5">
                <div className="row g-4">
                    <div className="col-12 col-lg-8">
                        <div className="card shadow-sm border-0 p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <span className="badge bg-main-orange-light text-main-orange px-3 py-2">
                                    {question.LoaiCauHoi === 'TracNghiem' ? 'Trắc nghiệm' : 
                                     question.LoaiCauHoi === 'DungSai' ? 'Đúng / Sai' :
                                     question.LoaiCauHoi === 'DienKhuyet' ? 'Điền khuyết' : 'Tự luận'}
                                </span>
                                <span className={`badge ${getStatusBadge(question.TrangThai)}`}>
                                    {question.TrangThai}
                                </span>
                            </div>

                            <h5 className="fw-bold text-secondary mb-3 small text-uppercase">Nội dung câu hỏi:</h5>
                            <div className={`fs-5 text-dark mb-4 lh-base ${styles.questionContent}`}>
                                {question.NoiDungCauHoi}
                            </div>

                            <div className={`p-4 rounded-3 mb-4 ${styles.interactiveZone}`}>
                                <h6 className="fw-bold mb-4 text-primary">
                                    <i className={question.LoaiCauHoi === 'TuLuan' ? "bi bi-journal-text me-2" : "bi bi-pencil-square me-2"}></i>
                                    {question.LoaiCauHoi === 'TuLuan' ? "Hướng dẫn học tập:" : "Khu vực làm bài:"}
                                </h6>
                                
                                {question.LoaiCauHoi === 'TracNghiem' && (
                                    <div className="d-flex flex-column gap-3">
                                        {['A', 'B', 'C', 'D'].map((label, idx) => (
                                            <label key={label} className={`${styles.optionLabel} ${userAnswer === label ? styles.optionSelected : ''} ${isSubmitted && question.DapAnChinhXac === label ? styles.optionCorrect : ''} ${isSubmitted && userAnswer === label && !isCorrect ? styles.optionWrong : ''}`}>
                                                <input 
                                                    type="radio" name="mcq" className="d-none" value={label}
                                                    disabled={isSubmitted}
                                                    onChange={(e) => setUserAnswer(e.target.value)}
                                                />
                                                <span className={styles.optionCircle}>{label}</span>
                                                <span className="ms-2">{question.DanhSachLuaChon?.[idx]}</span>
                                                {isSubmitted && question.DapAnChinhXac === label && <i className="bi bi-check-circle-fill ms-auto text-success fs-5"></i>}
                                                {isSubmitted && userAnswer === label && !isCorrect && <i className="bi bi-x-circle-fill ms-auto text-danger fs-5"></i>}
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {question.LoaiCauHoi === 'DungSai' && (
                                    <div className="d-flex flex-column gap-3">
                                        {['a', 'b', 'c', 'd'].map((char, idx) => {
                                            const isThisCorrect = isSubmitted ? (userAnswersDS[idx] === parsedDSAnswers[idx]) : null;
                                            return (
                                                <div key={idx} className={`p-3 border rounded-3 bg-white d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 ${isSubmitted ? (isThisCorrect ? 'border-success bg-success-subtle' : 'border-danger bg-danger-subtle') : ''}`}>
                                                    <div className="flex-grow-1 fw-bold text-secondary">Phát biểu {char}</div>
                                                    <div className="btn-group shadow-sm flex-shrink-0">
                                                        <input type="radio" className="btn-check" id={`ds_${idx}_D`} checked={userAnswersDS[idx] === 'Đ'} onChange={() => handleSelectDS(idx, 'Đ')} disabled={isSubmitted} />
                                                        <label className={`btn ${userAnswersDS[idx] === 'Đ' ? 'btn-primary' : 'btn-outline-primary'} px-3`} htmlFor={`ds_${idx}_D`}>Đúng</label>
                                                        <input type="radio" className="btn-check" id={`ds_${idx}_S`} checked={userAnswersDS[idx] === 'S'} onChange={() => handleSelectDS(idx, 'S')} disabled={isSubmitted} />
                                                        <label className={`btn ${userAnswersDS[idx] === 'S' ? 'btn-danger' : 'btn-outline-danger'} px-4`} htmlFor={`ds_${idx}_S`}>Sai</label>
                                                    </div>
                                                    {isSubmitted && (
                                                        <div className="flex-shrink-0 text-center ms-md-2" style={{width: '30px'}}>
                                                            {isThisCorrect ? <i className="bi bi-check-circle-fill text-success fs-4"></i> : <i className="bi bi-x-circle-fill text-danger fs-4"></i>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {question.LoaiCauHoi === 'DienKhuyet' && (
                                    <div>
                                        <label className="fw-bold mb-2">Nhập đáp án của bạn:</label>
                                        <input 
                                            type="text" 
                                            className={`form-control form-control-lg shadow-none ${isSubmitted ? (isCorrect ? 'is-valid' : 'is-invalid') : ''}`}
                                            placeholder="Gõ kết quả vào đây..."
                                            value={userAnswer}
                                            disabled={isSubmitted}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                        />
                                    </div>
                                )}

                                {question.LoaiCauHoi === 'TuLuan' && (
                                    <div className="text-center py-3">
                                        <p className="text-muted mb-4 fs-6">Giải quyết bài toán và đối chiếu với đáp án bên dưới.</p>
                                        {!isSubmitted ? (
                                            <button className="btn btn-primary px-5 py-2 fw-bold shadow-sm" onClick={() => setIsSubmitted(true)}>
                                                <i className="bi bi-eye-fill me-2"></i>Xem gợi ý đáp án
                                            </button>
                                        ) : (
                                            <button className="btn btn-outline-secondary px-5 py-2 fw-bold" onClick={handleReset}>
                                                <i className="bi bi-eye-slash-fill me-2"></i>Ẩn đáp án
                                            </button>
                                        )}
                                    </div>
                                )}

                                {question.LoaiCauHoi !== 'TuLuan' && (
                                    !isSubmitted ? (
                                        <button className="btn btn-main-orange text-white w-100 mt-4 py-2 fw-bold shadow-sm" onClick={handleSubmitAnswer}>
                                            <i className="bi bi-check2-circle me-2"></i>Kiểm tra đáp án
                                        </button>
                                    ) : (
                                        <button className="btn btn-outline-secondary w-100 mt-4 py-2 fw-bold" onClick={handleReset}>
                                            <i className="bi bi-arrow-counterclockwise me-2"></i>Làm lại câu này
                                        </button>
                                    )
                                )}
                            </div>

                            {isSubmitted && (
                                <div className={`animate__animated animate__fadeIn ${styles.feedbackArea}`}>
                                    {question.LoaiCauHoi === 'DungSai' ? (() => {
                                        const correctCount = userAnswersDS.filter((ans, idx) => ans === parsedDSAnswers[idx]).length;
                                        let alertClass = correctCount === 4 ? 'alert-success' : correctCount > 0 ? 'alert-warning text-dark' : 'alert-danger';
                                        return (
                                            <div className={`alert ${alertClass} border-0 d-flex align-items-center shadow-sm`}>
                                                <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                                                <div>
                                                    <div className="fw-bold">{correctCount === 4 ? "Hoàn hảo!" : "Kết quả:"}</div>
                                                    <div>Bạn trả lời đúng {correctCount}/4 ý.</div>
                                                </div>
                                            </div>
                                        );
                                    })() : question.LoaiCauHoi !== 'TuLuan' && (
                                        <div className={`alert ${isCorrect ? 'alert-success' : 'alert-danger'} border-0 d-flex align-items-center shadow-sm`}>
                                            <i className={`bi ${isCorrect ? 'bi-emoji-smile-fill' : 'bi-exclamation-triangle-fill'} fs-4 me-3`}></i>
                                            <div>
                                                <div className="fw-bold">{isCorrect ? "Hoàn toàn chính xác!" : "Chưa chính xác."}</div>
                                                {!isCorrect && <div className="mt-1">Đáp án đúng là: <span className="fw-bold">{question.DapAnChinhXac}</span></div>}
                                            </div>
                                        </div>
                                    )}

                                    {(question.DapAnGoiY || question.LoaiCauHoi === 'TuLuan') && (
                                        <div className="mt-4 p-4 bg-light rounded border-start border-4 border-primary shadow-sm">
                                            <h6 className="fw-bold text-primary mb-2">Hướng dẫn giải chi tiết:</h6>
                                            <div className="text-secondary small" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                                                {question.DapAnGoiY || "Đang cập nhật nội dung giải chi tiết..."}
                                            </div>
                                        </div>
                                    )}

                                    <div className={`p-3 rounded-3 border-orange-dashed d-flex align-items-center justify-content-between mt-4 ${styles.aiPrompt}`}>
                                        <div className="d-flex align-items-center">
                                            <div className={styles.aiIconMini}><i className="bi bi-robot"></i></div>
                                            <div className="ms-3 small text-dark">Vẫn còn thắc mắc? Hãy hỏi <b>Trợ lý AI HOCMOI</b> để được giải thích kỹ hơn!</div>
                                        </div>
                                        <button className="btn btn-sm btn-main-orange text-white fw-bold px-3 text-nowrap" onClick={handleHoiAI}>Hỏi AI ngay</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-12 col-lg-4">
                        <div className="card shadow-sm border-0 p-4 mb-4">
                            <h5 className="fw-bold mb-4">Thông tin bổ sung</h5>
                            <div className="mb-3"><label className="text-muted small d-block">Môn học</label><span className="fw-bold text-dark">{question.MonHoc}</span></div>
                            <div className="mb-3"><label className="text-muted small d-block">Chuyên đề</label><span className="fw-medium text-dark">{question.ChuyenDe || 'Đang cập nhật'}</span></div>
                            <div className="mb-3"><label className="text-muted small d-block">Mức độ</label><span className={`badge ${question.DoKho === 'Nhận biết' ? 'bg-info' : question.DoKho === 'Thông hiểu' ? 'bg-primary' : question.DoKho === 'Vận dụng' ? 'bg-warning text-dark' : 'bg-danger'}`}>{question.DoKho}</span></div>
                            <hr className="my-4 opacity-10" />
                            <div className="mb-4">
                                <label className="text-muted small d-block mb-2">Giáo viên biên soạn</label>
                                <div className="d-flex align-items-center">
                                    <div className={styles.avatar}>{question.MaGVBienSoan?.HoTen?.charAt(0) || 'G'}</div>
                                    <div className="ms-2">
                                        <div className="fw-bold small">{question.MaGVBienSoan?.HoTen || "Giáo viên ẩn danh"}</div>
                                        <div className="text-muted" style={{fontSize: '11px'}}>Cập nhật: {new Date(question.NgayCapNhat).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                </div>
                            </div>
                            {currentUserId === (question.MaGVBienSoan?._id || question.MaGVBienSoan) && (
                                <button className="btn btn-outline-dark w-100 fw-bold" onClick={() => navigate(`/them-cau-hoi?edit=${id}`)}>
                                    <i className="bi bi-pencil-square me-2"></i>Sửa câu hỏi
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ChiTietCauHoi;