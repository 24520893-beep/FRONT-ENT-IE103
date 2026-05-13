import React, { useState, useEffect } from 'react';
import Select from 'react-select'; 
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from './ThemLoTrinh.module.css';
import { fetchClient } from '../../utils/fetchClient'; // Bổ sung import fetchClient

const ThemLoTrinh = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // BẮT THAM SỐ TỪ URL ĐỂ NHẬN BIẾT CHẾ ĐỘ SỬA
    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('edit');
    const isEditMode = !!editId;

    // STATE THÔNG TIN CƠ BẢN
    const [user, setUser] = useState(null);
    const [routeName, setRouteName] = useState('');
    const [ghiChu, setGhiChu] = useState(''); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(isEditMode); 

    // STATE HỌC SINH (CHỈ CHỌN 1 HỌC SINH THEO SCHEMA)
    const [studentOptions, setStudentOptions] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null); 
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    // STATE TÀI LIỆU - ĐỀ THI (GỢI Ý)
    const [materialOptions, setMaterialOptions] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

    // STATE QUẢN LÝ THÀNH PHẦN LỘ TRÌNH (BẢNG)
    const [bulkMaterials, setBulkMaterials] = useState('');
    const [routeComponents, setRouteComponents] = useState([]); 

    const formatTeacherId = (id) => {
        if (!id || id.length < 12) return id;
        return `${id.substring(0, 6)}***${id.substring(id.length - 6)}`;
    };

    // 1. LẤY THÔNG TIN USER TỪ LOCALSTORAGE VÀ FETCH DỮ LIỆU CHUNG
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));

        const fetchAllData = async () => {
            setIsLoadingStudents(true);
            setIsLoadingMaterials(true);
            try {
                // Đã sửa: Dùng Promise.all kết hợp fetchClient để lấy dữ liệu đồng thời
                const [resHS, resTL, resDT] = await Promise.all([
                    fetchClient('/api/nguoidung/danh-sach-hs'),
                    fetchClient('/api/tailieuhoctap?limit=500'),
                    fetchClient('/api/dethithu?limit=500')
                ]);

                if (!resHS.ok || !resTL.ok || !resDT.ok) {
                    throw new Error(`Lỗi API: HS:${resHS.status}, TL:${resTL.status}, DT:${resDT.status}`);
                }

                const studentsData = await resHS.json();
                const docsData = await resTL.json();
                const examsData = await resDT.json();

                const formattedStudents = studentsData.map(hs => ({
                    value: hs._id,
                    label: `${hs.HoTen} - ${hs.Email}`
                }));
                setStudentOptions(formattedStudents);

                // FIX: Map type trùng với Mongoose Enum để thuận tiện so sánh
                const formattedDocs = (docsData.data || docsData).map(doc => ({
                    value: doc._id,
                    label: `[Tài liệu] ${doc.TenTaiLieu}`,
                    type: 'TaiLieuHocTap' 
                }));

                const formattedExams = (examsData.data || examsData).map(exam => ({
                    value: exam._id,
                    label: `[Đề thi] ${exam.TenDeThi}`,
                    type: 'DeThiThu' 
                }));

                const allMaterials = [...formattedDocs, ...formattedExams];
                setMaterialOptions(allMaterials);

                // NẾU CHẾ ĐỘ SỬA: LẤY DỮ LIỆU LỘ TRÌNH CŨ VÀ MAP VÀO STATE
                if (isEditMode) {
                    const resOld = await fetchClient(`/api/lotrinhhoctap/${editId}`);
                    
                    if (resOld.ok) {
                        const oldData = await resOld.json();
                        setRouteName(oldData.TenLoTrinh || '');
                        setGhiChu(oldData.GhiChu || '');

                        if (oldData.MaHocSinh) {
                            const id = typeof oldData.MaHocSinh === 'object' ? oldData.MaHocSinh._id : oldData.MaHocSinh;
                            const found = formattedStudents.find(opt => opt.value === id);
                            setSelectedStudent(found || { value: id, label: `Mã HS: ${id}` });
                        }

                        if (oldData.DanhSachNhiemVu) {
                            const components = oldData.DanhSachNhiemVu
                                .sort((a, b) => a.ThuTu - b.ThuTu)
                                .map(comp => {
                                    const foundMaterial = allMaterials.find(opt => opt.value === comp.MaThamChieu);
                                    return {
                                        maThanhPhan: comp.MaThamChieu,
                                        ten: foundMaterial ? foundMaterial.label : `Chưa rõ tên (Mã: ${comp.MaThamChieu})`,
                                        phanLoai: (comp.LoaiNhiemVu === 'DeThiThu' || comp.LoaiNhiemVu === 'DeThi') ? 'Đề thi' : 'Tài liệu',
                                        checked: false
                                    };
                                });
                            setRouteComponents(components);
                        }
                    } else {
                        alert("Không tìm thấy lộ trình để chỉnh sửa!");
                        navigate('/lo-trinh');
                    }
                }

            } catch (error) {
                console.error("Chi tiết lỗi:", error);
                alert("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.");
            } finally {
                setIsLoadingStudents(false);
                setIsLoadingMaterials(false);
                setIsLoadingData(false);
            }
        };

        fetchAllData();
    }, [editId, isEditMode, navigate]);

    // 3. XỬ LÝ THÊM THÀNH PHẦN VÀO LỘ TRÌNH
    const handleAddSingleMaterial = () => {
        if (!selectedMaterial) return;

        const isExist = routeComponents.some(comp => comp.maThanhPhan === selectedMaterial.value);
        if (!isExist) {
            setRouteComponents([...routeComponents, {
                maThanhPhan: selectedMaterial.value,
                ten: selectedMaterial.label,
                phanLoai: selectedMaterial.type === 'DeThiThu' ? 'Đề thi' : 'Tài liệu',
                checked: false
            }]);
        }
        setSelectedMaterial(null);
    };

    const handleAddBulkMaterials = () => {
        if (!bulkMaterials.trim()) return;

        const newIds = bulkMaterials.split(/[, \n]+/).map(id => id.trim()).filter(id => id !== '');
        let newComponents = [...routeComponents];
        let notFoundIds = []; 

        newIds.forEach(id => {
            if (!newComponents.some(comp => comp.maThanhPhan === id)) {
                const foundMaterial = materialOptions.find(opt => opt.value === id);

                if (foundMaterial) {
                    newComponents.push({
                        maThanhPhan: foundMaterial.value,
                        ten: foundMaterial.label,
                        phanLoai: foundMaterial.type === 'DeThiThu' ? 'Đề thi' : 'Tài liệu',
                        checked: false
                    });
                } else {
                    notFoundIds.push(id);
                }
            }
        });

        setRouteComponents(newComponents);
        setBulkMaterials(''); 

        if (notFoundIds.length > 0) {
            alert(`Không tìm thấy các mã ID sau trong hệ thống:\n\n${notFoundIds.join('\n')}`);
        }
    };

    // 4. THAO TÁC TRÊN BẢNG
    const moveComponent = (index, direction) => {
        const newComponents = [...routeComponents];
        if (direction === 'up' && index > 0) {
            [newComponents[index - 1], newComponents[index]] = [newComponents[index], newComponents[index - 1]];
        } else if (direction === 'down' && index < newComponents.length - 1) {
            [newComponents[index + 1], newComponents[index]] = [newComponents[index], newComponents[index + 1]];
        }
        setRouteComponents(newComponents);
    };

    const toggleCheck = (index) => {
        const newComponents = [...routeComponents];
        newComponents[index].checked = !newComponents[index].checked;
        setRouteComponents(newComponents);
    };

    const toggleCheckAll = (e) => {
        const isChecked = e.target.checked;
        setRouteComponents(routeComponents.map(comp => ({ ...comp, checked: isChecked })));
    };

    const handleDeleteSelected = () => {
        setRouteComponents(routeComponents.filter(comp => !comp.checked));
    };

    const handleDeleteSingle = (index) => {
        setRouteComponents(routeComponents.filter((_, i) => i !== index));
    };

    // 5. SUBMIT TẠO/SỬA LỘ TRÌNH ĐỒNG BỘ SCHEMA
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedStudent) {
            alert("Vui lòng chọn 1 học sinh cho lộ trình!");
            return;
        }
        if (routeComponents.length === 0) {
            alert("Lộ trình phải có ít nhất 1 nhiệm vụ (Tài liệu hoặc đề thi)!");
            return;
        }

        setIsSubmitting(true);
        const payload = {
            TenLoTrinh: routeName,
            MonHoc: user?.MonHoc,
            GhiChu: ghiChu,
            TrangThai: "Đang kiểm duyệt", 
            MaHocSinh: selectedStudent.value, 
            MaGVPhuTrach: user?._id, 
            DanhSachNhiemVu: routeComponents.map((comp, index) => ({
                LoaiNhiemVu: comp.phanLoai === 'Đề thi' ? 'DeThiThu' : 'TaiLieuHocTap',
                MaThamChieu: comp.maThanhPhan,
                ThuTu: index + 1
            }))
        };

        try {
            // Đã sửa: Dùng fetchClient để tự lo Header và BASE_URL
            const url = isEditMode ? `/api/lotrinhhoctap/${editId}` : '/api/lotrinhhoctap';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetchClient(url, {
                method: method,
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert(`Đã ${isEditMode ? 'cập nhật' : 'tạo mới'} lộ trình thành công! Trạng thái: Chờ duyệt.`);
                navigate('/lo-trinh'); 
            } else {
                let errorMsg = "Không thể lưu lộ trình.";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (parseError) {}
                alert(`Lỗi: ${errorMsg}`);
            }

        } catch (error) {
            console.error("Lỗi:", error);
            alert("Đã xảy ra sự cố kết nối tới máy chủ.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container py-4">
            <h1 className={styles.pageTitle}>
                {isEditMode ? 'Cập nhật lộ trình' : 'Thêm lộ trình'}
            </h1>

            <form onSubmit={handleSubmit}>
                <div className="card shadow-sm border-0 mb-4 mt-3">
                    <div className="card-body p-4">
                        <h5 className="mb-4 fw-bold border-bottom pb-2">Thông tin chung</h5>
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold text-muted">Giáo viên phụ trách</label>
                                <div className="form-control bg-light">{user?.HoTen || "Đang tải..."}</div>
                            </div>
                            <div className="col-md-6 mt-3 mt-md-0">
                                <label className="form-label fw-bold text-muted">Mã GV</label>
                                <div className="form-control bg-light">{user ? formatTeacherId(user._id) : ".........."}</div>
                            </div>
                        </div>
                        <div className="row mb-2">
                            <div className="col-md-6">
                                <label className="form-label fw-bold text-muted">Môn học phụ trách</label>
                                <div className="form-control bg-light">{user?.MonHoc || "Chưa cập nhật"}</div>
                            </div>
                            <div className="col-md-6 mt-3 mt-md-0">
                                <label className="form-label fw-bold">Tên lộ trình <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Đặt tên cho lộ trình..."
                                    value={routeName}
                                    onChange={(e) => setRouteName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col-12">
                                <label className="form-label fw-bold">Ghi chú (Tùy chọn)</label>
                                <textarea
                                    className="form-control shadow-none"
                                    rows="2"
                                    placeholder="Nhập lời dặn dò, ghi chú thêm cho lộ trình này..."
                                    value={ghiChu}
                                    onChange={(e) => setGhiChu(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <label className="form-label fw-bold">Chọn học sinh thực hiện (1 học sinh/lộ trình) <span className="text-danger">*</span></label>
                        <small className="text-muted d-block mb-2">Nhập mã hoặc tên học sinh để xem gợi ý.</small>
                        <Select
                            options={studentOptions}
                            value={selectedStudent}
                            onChange={setSelectedStudent}
                            isLoading={isLoadingStudents}
                            placeholder="Tìm kiếm và chọn học sinh..."
                            noOptionsMessage={() => "Không tìm thấy học sinh"}
                            isClearable
                        />
                    </div>
                </div>

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <div className="row">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Thêm nhiệm vụ (Tài liệu/Đề thi)</label>
                                <small className="text-muted d-block mb-2">Nhập mã hoặc tên tài liệu/đề thi để xem gợi ý.</small>
                                <div className="d-flex gap-2 mb-3">
                                    <div style={{ flex: 1 }}>
                                        <Select
                                            options={materialOptions}
                                            value={selectedMaterial}
                                            onChange={setSelectedMaterial}
                                            isLoading={isLoadingMaterials}
                                            placeholder="Chọn tài liệu/đề thi..."
                                            isClearable
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        />
                                    </div>
                                    <button type="button" className="btn btn-outline-primary" onClick={handleAddSingleMaterial} disabled={!selectedMaterial}>
                                        <i className="bi bi-plus-circle"></i> Thêm
                                    </button>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">Nhập danh sách (Hàng loạt)</label>
                                <small className="text-muted d-block mb-2">Dán các mã ID hệ thống cách nhau bởi dấu phẩy.</small>
                                <textarea
                                    className="form-control mb-2"
                                    rows="2"
                                    placeholder="VD: 65a12b..., 65a13c..."
                                    value={bulkMaterials}
                                    onChange={(e) => setBulkMaterials(e.target.value)}
                                ></textarea>
                                <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddBulkMaterials}>
                                    <i className="bi bi-list-check"></i> Thêm nhanh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <h5 className="mb-3 fw-bold">Danh sách các nhiệm vụ của lộ trình ({routeComponents.length})</h5>

                        {routeComponents.length > 0 ? (
                            <>
                                <div className={`table-responsive border rounded ${styles.tableContainer}`}>
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="text-center" style={{ width: '40px' }}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        onChange={toggleCheckAll}
                                                        checked={routeComponents.length > 0 && routeComponents.every(c => c.checked)}
                                                    />
                                                </th>
                                                <th className="text-center" style={{ width: '80px' }}>Thứ tự</th>
                                                <th>Tên / Mã tham chiếu</th>
                                                <th style={{ width: '200px' }}>Phân loại</th>
                                                <th className="text-center" style={{ width: '120px' }}>Điều hướng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {routeComponents.map((comp, index) => (
                                                <tr key={`${comp.maThanhPhan}-${index}`} className={comp.checked ? 'table-active' : ''}>
                                                    <td className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={comp.checked}
                                                            onChange={() => toggleCheck(index)}
                                                        />
                                                    </td>
                                                    <td className="text-center fw-bold">{index + 1}</td>
                                                    <td>
                                                        <div className="fw-semibold">{comp.ten}</div>
                                                        <code className="small text-primary">{comp.maThanhPhan}</code>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${comp.phanLoai === 'Đề thi' ? 'bg-danger' : 'bg-success'}`}>
                                                            {comp.phanLoai}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-1">
                                                            <button type="button" className="btn btn-sm btn-light" onClick={() => moveComponent(index, 'up')} disabled={index === 0}>
                                                                <i className="bi bi-arrow-up"></i>
                                                            </button>
                                                            <button type="button" className="btn btn-sm btn-light" onClick={() => moveComponent(index, 'down')} disabled={index === routeComponents.length - 1}>
                                                                <i className="bi bi-arrow-down"></i>
                                                            </button>
                                                            <button type="button" className="btn btn-sm btn-outline-danger ms-1" onClick={() => handleDeleteSingle(index)}>
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={handleDeleteSelected}
                                        disabled={!routeComponents.some(c => c.checked)}
                                    >
                                        <i className="bi bi-trash-fill me-1"></i> Xóa nhiệm vụ đã chọn
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-muted py-4 border rounded bg-light">
                                <i className="bi bi-card-checklist fs-1"></i>
                                <p className="mt-2">Chưa có tài liệu hoặc đề thi nào được phân công.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-end mb-5">
                    <Link to="/lo-trinh" className="btn btn-light btn-lg px-4 me-3 shadow-sm border">Hủy bỏ</Link>
                    <button type="submit" className="btn btn-primary btn-lg px-5 shadow fw-bold" disabled={isSubmitting}>
                        {isSubmitting ? "Đang xử lý..." : (isEditMode ? "Cập nhật lộ trình" : "Tạo lộ trình")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ThemLoTrinh;