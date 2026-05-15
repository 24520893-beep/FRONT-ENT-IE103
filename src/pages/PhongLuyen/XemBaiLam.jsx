import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchClient } from '../../utils/fetchClient';

const XemBaiLam = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [reviewData, setReviewData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. FETCH DỮ LIỆU TỪ VIEW (Đã sửa đường dẫn khớp với report.routes.js)
    useEffect(() => {
        const fetchResultDetail = async () => {
            try {
                const res = await fetchClient(`/api/reports/chitiet-ketquathithu/${id}`);

                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setReviewData(data);
                    } else {
                        alert("Dữ liệu bài làm bị trống hoặc không hợp lệ.");
                        navigate('/ket-qua-thi');
                    }
                } else {
                    alert("Không tìm thấy kết quả bài thi này!");
                    navigate('/ket-qua-thi');
                }
            } catch (error) {
                console.error("Lỗi tải chi tiết kết quả:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchResultDetail();
    }, [id, navigate]);

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-main-orange"></div></div>;
    if (reviewData.length === 0) return null;

    // Lấy thông tin chung từ bản ghi đầu tiên
    const DiemSo = reviewData[0]?.DiemSoTong || 0;
    const HoTenHS = reviewData[0]?.HoTenHocSinh || "Học sinh";
    const TenDe = reviewData[0]?.TenDeThi || "Bài thi thử";

    return (
        <main className="bg-light min-vh-100 pb-5">
            {/* THANH TOP BAR CỐ ĐỊNH */}
            <div className="bg-white shadow-sm sticky-top" style={{ zIndex: 1000, marginTop: '78px' }}>
                <div className="container py-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                    <h5 className="fw-bold text-dark mb-2 mb-md-0 text-truncate me-3">
                        <i className="bi bi-journal-check text-success me-2"></i>
                        Xem lại bài: {TenDe}
                    </h5>

                    <div className="d-flex align-items-center gap-3">
                        <div className="fs-5 fw-bold text-dark bg-light px-4 py-2 rounded-pill border shadow-sm">
                            Tổng điểm: <span className={DiemSo >= 5 ? "text-success" : "text-danger"}>{DiemSo}</span> <span className="text-muted fs-6">/ 10</span>
                        </div>
                        <Link to="/ket-qua-thi" className="btn btn-outline-secondary fw-bold px-4 rounded-pill shadow-sm">
                            <i className="bi bi-arrow-left me-2"></i>Quay lại
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mt-4">
                <div className="row g-4">
                    {/* CỘT TRÁI: DANH SÁCH CÂU HỎI CHI TIẾT */}
                    <div className="col-lg-8 col-xl-9">
                        <div className="mb-4 px-2">
                            <span className="badge bg-main-orange fs-6 px-3 py-2 rounded-pill shadow-sm">
                                <i className="bi bi-person-fill me-2"></i>Thí sinh: {HoTenHS}
                            </span>
                        </div>

                        {reviewData.map((item, idx) => {
                            const isTuLuan = item.LoaiCauHoi === 'TuLuan';
                            const isCorrect = item.KetQuaDungSai;

                            return (
                                <div key={idx} id={`question-${idx}`} className={`card shadow-sm mb-4 p-4 border-start border-4 ${isCorrect ? 'border-success' : isTuLuan ? 'border-warning' : 'border-danger'}`}>
                                    {/* Header câu hỏi */}
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="d-flex align-items-center flex-wrap gap-2">
                                            <h5 className="fw-bold text-dark mb-0">Câu {idx + 1}</h5>
                                            <span className="badge bg-light text-dark border fw-normal">{item.DoKho || 'Bình thường'}</span>
                                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle fw-normal">
                                                {item.LoaiCauHoi === 'TracNghiem' ? 'Trắc nghiệm' : item.LoaiCauHoi === 'DungSai' ? 'Đúng/Sai' : item.LoaiCauHoi === 'DienKhuyet' ? 'Điền khuyết' : 'Tự luận'}
                                            </span>
                                        </div>
                                        <div>
                                            {isTuLuan ? (
                                                <span className="badge bg-warning text-dark px-3 py-2"><i className="bi bi-clock-history me-1"></i>Chờ chấm</span>
                                            ) : isCorrect ? (
                                                <span className="badge bg-success px-3 py-2"><i className="bi bi-check-circle me-1"></i>Đúng</span>
                                            ) : (
                                                <span className="badge bg-danger px-3 py-2"><i className="bi bi-x-circle me-1"></i>Sai</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nội dung câu hỏi */}
                                    <div className="fs-5 text-dark mb-3 lh-base" style={{ whiteSpace: 'pre-line' }}>
                                        {item.NoiDungCauHoi}
                                    </div>

                                    {/* Hình ảnh minh họa */}
                                    {item.HinhAnhMinhHoa && (
                                        <div className="mb-4 text-center">
                                            <img src={item.HinhAnhMinhHoa} alt="Minh họa" className="img-fluid rounded shadow-sm border" style={{ maxHeight: '350px', objectFit: 'contain' }} />
                                        </div>
                                    )}

                                    {/* --- PHÂN LOẠI HIỂN THỊ THEO LOẠI CÂU HỎI --- */}

                                    {/* 1. TRẮC NGHIỆM */}
                                    {item.LoaiCauHoi === 'TracNghiem' && item.DanhSachLuaChon && (
                                        <div className="d-flex flex-column gap-2 mb-3">
                                            {['A', 'B', 'C', 'D'].map((label, optIdx) => {
                                                const choiceText = item.DanhSachLuaChon[optIdx];
                                                if (!choiceText) return null;

                                                const isCorrectChoice = label === item.DapAnChinhXac;
                                                const isUserChoice = label === item.LuaChonCuaHocSinh;

                                                let bgClass = 'bg-light border';
                                                if (isCorrectChoice) bgClass = 'bg-success-subtle border-success text-dark fw-bold shadow-sm';
                                                else if (isUserChoice) bgClass = 'bg-danger-subtle border-danger text-danger';

                                                return (
                                                    <div key={label} className={`p-3 rounded-3 d-flex align-items-center ${bgClass}`}>
                                                        <span className="fw-bold me-2">{label}.</span> {choiceText}
                                                        {isCorrectChoice && <i className="bi bi-check-lg ms-auto text-success fs-5"></i>}
                                                        {isUserChoice && !isCorrectChoice && <i className="bi bi-x-lg ms-auto text-danger fs-5"></i>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* 2. ĐÚNG / SAI - TỐI ƯU CHO MỆNH ĐỀ NỐI LIỀN TRONG ĐỀ BÀI */}
                                    {item.LoaiCauHoi === 'DungSai' && (() => {
                                        // Tách chuỗi đáp án: Chấp nhận dấu phẩy, gạch ngang hoặc khoảng cách
                                        const regexSplit = /[,\-\s]+/;
                                        const userAnsArr = item.LuaChonCuaHocSinh
                                            ? item.LuaChonCuaHocSinh.split(regexSplit).filter(x => x.trim() !== '')
                                            : [];
                                        const correctAnsArr = item.DapAnChinhXac
                                            ? item.DapAnChinhXac.split(regexSplit).filter(x => x.trim() !== '')
                                            : [];

                                        return (
                                            <div className="mt-3">
                                                <div className="table-responsive">
                                                    <table className="table table-bordered align-middle shadow-sm mb-0">
                                                        <thead className="table-light text-center small text-uppercase">
                                                            <tr>
                                                                <th style={{ width: '80px' }}>Mệnh đề</th>
                                                                <th>Bạn chọn</th>
                                                                <th>Đáp án đúng</th>
                                                                <th style={{ width: '100px' }}>Kết quả</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {['a', 'b', 'c', 'd'].map((char, dsIdx) => {
                                                                const uAns = userAnsArr[dsIdx]?.trim().toUpperCase();
                                                                const cAns = correctAnsArr[dsIdx]?.trim().toUpperCase();
                                                                const isMatch = uAns === cAns;
                                                                const hasAnswer = !!uAns;

                                                                return (
                                                                    <tr key={char} className={hasAnswer ? (isMatch ? 'table-success-subtle' : 'table-danger-subtle') : ''}>
                                                                        <td className="text-center fw-bold text-primary">({char})</td>
                                                                        <td className="text-center fw-bold">
                                                                            {uAns === 'Đ' ? <span className="text-success">Đúng</span> :
                                                                                uAns === 'S' ? <span className="text-danger">Sai</span> : '-'}
                                                                        </td>
                                                                        <td className="text-center fw-bold">
                                                                            {cAns === 'Đ' ? <span className="text-success text-decoration-underline">Đúng</span> :
                                                                                cAns === 'S' ? <span className="text-danger text-decoration-underline">Sai</span> : 'N/A'}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            {hasAnswer && (
                                                                                isMatch
                                                                                    ? <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                                                                    : <i className="bi bi-x-circle-fill text-danger fs-5"></i>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <p className="small text-muted mt-2 mb-0 italic">
                                                    <i className="bi bi-info-circle me-1"></i> Đối chiếu lựa chọn của bạn với các mệnh đề a, b, c, d đã nêu ở nội dung câu hỏi phía trên.
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* 3. ĐIỀN KHUYẾT */}
                                    {item.LoaiCauHoi === 'DienKhuyet' && (
                                        <div className="bg-white border rounded-3 p-3 mb-3 shadow-sm">
                                            <div className="row align-items-center">
                                                <div className="col-md-6 border-end">
                                                    <span className="small text-muted fw-bold text-uppercase">Bài làm của bạn:</span>
                                                    <div className={`fs-5 fw-bold mt-1 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                                                        {item.LuaChonCuaHocSinh || "[Bỏ trống]"}
                                                    </div>
                                                </div>
                                                <div className="col-md-6 ps-md-4">
                                                    <span className="small text-muted fw-bold text-uppercase">Đáp án chính xác:</span>
                                                    <div className="fs-5 text-primary fw-bold mt-1">{item.DapAnChinhXac}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. TỰ LUẬN */}
                                    {isTuLuan && (
                                        <div className="bg-white border rounded-3 p-4 mb-3 shadow-sm">
                                            <h6 className="fw-bold small text-muted text-uppercase mb-3 border-bottom pb-2">Nội dung bài làm:</h6>
                                            <p className="mb-0 text-dark lh-lg" style={{ whiteSpace: 'pre-wrap' }}>
                                                {item.LuaChonCuaHocSinh || <span className="text-muted fst-italic">Thí sinh không nộp nội dung cho câu hỏi này.</span>}
                                            </p>
                                        </div>
                                    )}

                                    {/* GIẢI THÍCH / GỢI Ý (Bổ sung cho tất cả loại câu hỏi) */}
                                    {item.DapAnGoiY && (
                                        <div className="mt-3 p-3 bg-info-subtle border-start border-info border-4 rounded-end shadow-sm">
                                            <div className="fw-bold text-info-emphasis mb-2">
                                                <i className="bi bi-lightbulb-fill me-2"></i>Hướng dẫn giải chi tiết:
                                            </div>
                                            <p className="mb-0 small text-dark lh-base" style={{ whiteSpace: 'pre-wrap' }}>
                                                {item.DapAnGoiY}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* CỘT PHẢI: BẢN ĐỒ CÂU HỎI (Sticky) */}
                    <div className="col-lg-4 col-xl-3 d-none d-lg-block">
                        <div className="card shadow-sm border-0 sticky-top" style={{ top: '160px' }}>
                            <div className="card-header bg-white border-bottom-0 pt-4 pb-2 text-center">
                                <h6 className="fw-bold mb-0 text-uppercase" style={{ letterSpacing: '1px' }}>Bản đồ kết quả</h6>
                            </div>
                            <div className="card-body">
                                <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
                                    {reviewData.map((item, idx) => {
                                        const isCorrectNav = item.KetQuaDungSai;
                                        const isTuLuanNav = item.LoaiCauHoi === 'TuLuan';
                                        let btnClass = isTuLuanNav ? 'btn-warning' : (isCorrectNav ? 'btn-success' : 'btn-danger');

                                        return (
                                            <a key={idx} href={`#question-${idx}`}
                                                className={`btn btn-sm ${btnClass} rounded-3 fw-bold text-white shadow-sm`}
                                                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {idx + 1}
                                            </a>
                                        );
                                    })}
                                </div>
                                <div className="pt-3 border-top x-small text-muted">
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="badge bg-success me-2" style={{ width: 12, height: 12, padding: 0 }}> </span> Trả lời đúng
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="badge bg-danger me-2" style={{ width: 12, height: 12, padding: 0 }}> </span> Trả lời sai
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <span className="badge bg-warning me-2" style={{ width: 12, height: 12, padding: 0 }}> </span> Tự luận / Chờ chấm
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default XemBaiLam;