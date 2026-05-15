import React, { useState, useEffect } from 'react';
import Select from 'react-select'; 
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from './ThemLoTrinh.module.css';
import { fetchClient } from '../../utils/fetchClient';

const ThemLoTrinh = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('edit');
    const isEditMode = !!editId;

    // STATE THÔNG TIN CƠ BẢN
    const [user, setUser] = useState(null);
    const [routeName, setRouteName] = useState('');
    const [ghiChu, setGhiChu] = useState(''); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(isEditMode); 

    // STATE HỌC SINH
    const [studentOptions, setStudentOptions] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null); 
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    // STATE TÀI LIỆU - ĐỀ THI
    const [materialOptions, setMaterialOptions] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

    // STATE QUẢN LÝ THÀNH PHẦN LỘ TRÌNH
    const [bulkMaterials, setBulkMaterials] = useState('');
    const [routeComponents, setRouteComponents] = useState([]); 

    // === STATE QUẢN LÝ OVERLAY XÁC NHẬN ===
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        message: '',
        type: 'primary', // primary, danger, warning
        actionType: null, // 'SAVE', 'DELETE_SINGLE', 'DELETE_SELECTED'
        targetId: null
    });

    const formatTeacherId = (id) => {
        if (!id || id.length < 12) return id;
        return `${id.substring(0, 6)}***${id.substring(id.length - 6)}`;
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));

        const fetchAllData = async () => {
            setIsLoadingStudents(true);
            setIsLoadingMaterials(true);
            try {
                const [resHS, resTL, resDT] = await Promise.all([
                    fetchClient('/api/nguoidung/danh-sach-hs'),
                    fetchClient('/api/tailieuhoctap?limit=500'),
                    fetchClient('/api/dethithu?limit=500')
                ]);

                if (!resHS.ok || !resTL.ok || !resDT.ok) throw new Error("Lỗi tải dữ liệu");

                const studentsData = await resHS.json();
                const docsData = await resTL.json();
                const examsData = await resDT.json();

                const formattedStudents = studentsData.map(hs => ({
                    value: hs._id,
                    label: `${hs.HoTen} - ${hs.Email}`
                }));
                setStudentOptions(formattedStudents);

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
                    }
                }
            } catch (error) {
                console.error(error);
                alert("Không thể tải dữ liệu.");
            } finally {
                setIsLoadingStudents(false);
                setIsLoadingMaterials(false);
                setIsLoadingData(false);
            }
        };
        fetchAllData();
    }, [editId, isEditMode]);

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
                }
            }
        });
        setRouteComponents(newComponents);
        setBulkMaterials(''); 
    };

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

    // --- LOGIC XỬ LÝ QUA MODAL ---
    const triggerDeleteSingle = (index) => {
        setConfirmModal({
            isOpen: true,
            message: `Bạn có chắc chắn muốn xóa nhiệm vụ "${routeComponents[index].ten}" khỏi lộ trình?`,
            type: 'danger',
            actionType: 'DELETE_SINGLE',
            targetId: index
        });
    };

    const triggerDeleteSelected = () => {
        const count = routeComponents.filter(c => c.checked).length;
        setConfirmModal({
            isOpen: true,
            message: `Bạn có chắc chắn muốn xóa ${count} nhiệm vụ đã chọn?`,
            type: 'danger',
            actionType: 'DELETE_SELECTED'
        });
    };

    const triggerSaveRoute = (e) => {
        e.preventDefault();
        if (!selectedStudent) return alert("Vui lòng chọn học sinh!");
        if (routeComponents.length === 0) return alert("Lộ trình chưa có nhiệm vụ!");

        setConfirmModal({
            isOpen: true,
            message: isEditMode ? "Xác nhận cập nhật các thay đổi cho lộ trình này?" : "Xác nhận tạo mới lộ trình học tập này?",
            type: 'primary',
            actionType: 'SAVE'
        });
    };

    const executeAction = async () => {
        const { actionType, targetId } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false });

        if (actionType === 'DELETE_SINGLE') {
            setRouteComponents(routeComponents.filter((_, i) => i !== targetId));
        } 
        else if (actionType === 'DELETE_SELECTED') {
            setRouteComponents(routeComponents.filter(comp => !comp.checked));
        } 
        else if (actionType === 'SAVE') {
            await handleFinalSubmit();
        }
    };

    const handleFinalSubmit = async () => {
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
            const url = isEditMode ? `/api/lotrinhhoctap/${editId}` : '/api/lotrinhhoctap';
            const method = isEditMode ? 'PUT' : 'POST';
            const response = await fetchClient(url, { method, body: JSON.stringify(payload) });

            if (response.ok) {
                alert("Thao tác thành công!");
                navigate('/lo-trinh'); 
            } else {
                alert("Lỗi khi lưu lộ trình.");
            }
        } catch (error) {
            alert("Lỗi kết nối máy chủ.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <div className="container py-4">
                <h1 className={styles.pageTitle}>
                    {isEditMode ? 'Cập nhật lộ trình' : 'Thêm lộ trình'}
                </h1>

                <form onSubmit={triggerSaveRoute}>
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
                                        className="form-control shadow-none"
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
                                        placeholder="Nhập lời dặn dò..."
                                        value={ghiChu}
                                        onChange={(e) => setGhiChu(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <label className="form-label fw-bold">Chọn học sinh thực hiện <span className="text-danger">*</span></label>
                            <Select
                                options={studentOptions}
                                value={selectedStudent}
                                onChange={setSelectedStudent}
                                isLoading={isLoadingStudents}
                                placeholder="Tìm kiếm học sinh..."
                                isClearable
                            />
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <div className="row">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Thêm nhiệm vụ lẻ</label>
                                    <div className="d-flex gap-2">
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
                                        <button type="button" className="btn btn-outline-primary fw-bold" onClick={handleAddSingleMaterial} disabled={!selectedMaterial}>
                                            Thêm
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Nhập danh sách mã ID</label>
                                    <div className="d-flex gap-2">
                                        <input 
                                            className="form-control shadow-none" 
                                            placeholder="Dán các ID cách nhau bởi dấu phẩy..."
                                            value={bulkMaterials}
                                            onChange={(e) => setBulkMaterials(e.target.value)}
                                        />
                                        <button type="button" className="btn btn-outline-primary fw-bold text-nowrap" onClick={handleAddBulkMaterials}>
                                            Thêm nhanh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <h5 className="mb-3 fw-bold">Danh sách nhiệm vụ ({routeComponents.length})</h5>
                            {routeComponents.length > 0 ? (
                                <>
                                    <div className="table-responsive border rounded">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="text-center" style={{ width: '40px' }}>
                                                        <input type="checkbox" className="form-check-input" onChange={toggleCheckAll} checked={routeComponents.length > 0 && routeComponents.every(c => c.checked)} />
                                                    </th>
                                                    <th className="text-center" style={{ width: '80px' }}>STT</th>
                                                    <th>Nhiệm vụ</th>
                                                    <th style={{ width: '150px' }}>Loại</th>
                                                    <th className="text-center" style={{ width: '120px' }}>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {routeComponents.map((comp, index) => (
                                                    <tr key={`${comp.maThanhPhan}-${index}`} className={comp.checked ? 'table-active' : ''}>
                                                        <td className="text-center"><input type="checkbox" className="form-check-input" checked={comp.checked} onChange={() => toggleCheck(index)} /></td>
                                                        <td className="text-center fw-bold">{index + 1}</td>
                                                        <td>
                                                            <div className="fw-semibold">{comp.ten}</div>
                                                            <code className="small text-primary">{comp.maThanhPhan}</code>
                                                        </td>
                                                        <td><span className={`badge ${comp.phanLoai === 'Đề thi' ? 'bg-danger' : 'bg-success'}`}>{comp.phanLoai}</span></td>
                                                        <td className="text-center">
                                                            <div className="btn-group gap-1">
                                                                <button type="button" className="btn btn-sm btn-light border" onClick={() => moveComponent(index, 'up')} disabled={index === 0}><i className="bi bi-arrow-up"></i></button>
                                                                <button type="button" className="btn btn-sm btn-light border" onClick={() => moveComponent(index, 'down')} disabled={index === routeComponents.length - 1}><i className="bi bi-arrow-down"></i></button>
                                                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => triggerDeleteSingle(index)}><i className="bi bi-trash"></i></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button type="button" className="btn btn-danger btn-sm mt-3 fw-bold" onClick={triggerDeleteSelected} disabled={!routeComponents.some(c => c.checked)}>
                                        Xóa mục đã chọn
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-4 border rounded bg-light text-muted">Chưa có nhiệm vụ nào.</div>
                            )}
                        </div>
                    </div>

                    <div className="text-end mb-5">
                        <Link to="/lo-trinh" className="btn btn-light btn-lg px-4 me-3 border">Hủy bỏ</Link>
                        <button type="submit" className="btn btn-primary btn-lg px-5 shadow fw-bold" disabled={isSubmitting}>
                            {isSubmitting ? "Đang lưu..." : (isEditMode ? "Cập nhật lộ trình" : "Tạo lộ trình")}
                        </button>
                    </div>
                </form>
            </div>

            {/* === GIAO DIỆN OVERLAY (MODAL) XÁC NHẬN === */}
            {confirmModal.isOpen && (
                <div 
                    className="d-flex align-items-center justify-content-center" 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, backdropFilter: 'blur(3px)' }}
                >
                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
                        <i className={`bi ${confirmModal.type === 'danger' ? 'bi-exclamation-octagon text-danger' : 'bi-question-circle text-primary'} mb-3`} style={{ fontSize: '4rem' }}></i>
                        <h4 className="fw-bold text-dark">Xác nhận thao tác</h4>
                        <p className="text-muted mt-2 mb-4">{confirmModal.message}</p>
                        <div className="d-flex justify-content-center gap-3">
                            <button className="btn btn-light border fw-bold rounded-pill px-4" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Hủy bỏ</button>
                            <button className={`btn btn-${confirmModal.type} fw-bold rounded-pill px-4 text-white`} onClick={executeAction}>Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ThemLoTrinh;