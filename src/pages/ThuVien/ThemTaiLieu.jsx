import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import styles from './ThemTaiLieu.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

const ThemTaiLieu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('edit');
  const isEditMode = !!editId;

  const [docName, setDocName] = useState('');
  const [format, setFormat] = useState('');
  const [user, setUser] = useState(null);
  const [tagOptions, setTagOptions] = useState([]); 
  const [selectedTags, setSelectedTags] = useState([]); 
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    type: 'primary'
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const formatTeacherId = (id) => {
    if (!id || id.length < 12) return id;
    return `${id.substring(0, 6)}***${id.substring(id.length - 6)}`;
  };

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetchClient('/api/nhandan');
        if (res.ok) {
          const jsonResponse = await res.json();
          const tagsArray = Array.isArray(jsonResponse) ? jsonResponse : jsonResponse.data;
          if (tagsArray) {
            setTagOptions(tagsArray.map(tag => ({ value: tag._id, label: tag.TenNhanDan })));
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải nhãn dán:", error);
      }
    };

    const fetchOldData = async () => {
      if (!isEditMode) return;
      try {
        const res = await fetchClient(`/api/tailieuhoctap/${editId}`);
        if (res.ok) {
          const data = await res.json();
          setDocName(data.TenTaiLieu);
          setFormat(data.DinhDang);
          if (data.DanhSachNhanDan) {
            setSelectedTags(data.DanhSachNhanDan.map(tag => ({
              value: tag._id,
              label: tag.TenNhanDan
            })));
          }
        } else {
          alert("Không tìm thấy tài liệu để chỉnh sửa!");
          navigate('/thu-vien');
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchTags();
    fetchOldData();
  }, [editId, isEditMode, navigate]);

  const handleCreateTag = (inputValue) => {
    const newOption = { value: inputValue, label: inputValue, isNew: true };
    setTagOptions((prev) => [...prev, newOption]);
    setSelectedTags((prev) => [...prev, newOption]);
  };

  // 1. CHỈNH SỬA: Loại bỏ alert, chỉ hiện Modal khi form đã vượt qua kiểm tra native (required)
  const handlePreSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
        isOpen: true,
        message: isEditMode 
            ? "Xác nhận cập nhật thông tin mới cho tài liệu này?" 
            : "Xác nhận tải tài liệu này lên hệ thống và gửi kiểm duyệt?",
        type: 'primary'
    });
  };

  const executeSubmit = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setIsLoadingTags(true);

    try {
      const existingTagIds = selectedTags.filter(tag => !tag.isNew).map(tag => tag.value);
      const tagsToCreate = selectedTags.filter(tag => tag.isNew);

      let newTagIds = [];
      if (tagsToCreate.length > 0) {
        const createTagPromises = tagsToCreate.map(tag =>
          fetchClient('/api/nhandan', {
            method: 'POST',
            body: JSON.stringify({ TenNhanDan: tag.label })
          }).then(res => res.json())
        );
        const createdTags = await Promise.all(createTagPromises);
        newTagIds = createdTags.map(tag => tag._id);
      }

      const formData = new FormData();
      formData.append('TenTaiLieu', docName);
      formData.append('DinhDang', format);
      formData.append('TrangThai', 'Đang kiểm duyệt');

      const allTags = [...existingTagIds, ...newTagIds];
      if (allTags.length > 0) {
        formData.append('DanhSachNhanDan', JSON.stringify(allTags));
      }

      const fileInput = document.getElementById('fileUpload');
      if (fileInput && fileInput.files.length > 0) {
        formData.append('fileUpload', fileInput.files[0]);
      }

      const url = isEditMode ? `/api/tailieuhoctap/${editId}` : '/api/tailieuhoctap';
      const method = isEditMode ? 'PUT' : 'POST';

      const resDoc = await fetchClient(url, {
        method: method,
        body: formData 
      });

      if (resDoc.ok) {
        alert("Thành công!");
        navigate('/thu-vien'); 
      } else {
        const errorData = await resDoc.json();
        alert("Lỗi: " + (errorData.message || "Không thể thực hiện"));
      }

    } catch (error) {
      alert("Đã xảy ra sự cố kết nối máy chủ.");
    } finally {
      setIsLoadingTags(false);
    }
  };

  if (isLoadingData) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className={styles.pageTitle}>
              {isEditMode ? 'Cập nhật tài liệu' : 'Thêm tài liệu mới'}
          </h1>
        </div>

        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <form onSubmit={handlePreSubmit}>
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted">Giáo viên thực hiện</label>
                  <div className="form-control bg-light">{user?.HoTen || "Đang tải..."}</div>
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <label className="form-label fw-bold text-muted">Mã GV</label>
                  <div className="form-control bg-light">{user ? formatTeacherId(user._id) : ".........."}</div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted">Môn học phụ trách</label>
                  <div className="form-control bg-light">{user?.MonHoc || "Chưa cập nhật"}</div>
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <label className="form-label fw-bold">Tên tài liệu <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control shadow-none"
                    placeholder="Nhập tên cho tài liệu..."
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Định dạng <span className="text-danger">*</span></label>
                  <select
                    className="form-select shadow-none"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    required
                  >
                    <option value="">Chọn định dạng</option>
                    <option value="PDF">PDF</option>
                    <option value="MP4">MP4</option>
                  </select>
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <label className="form-label fw-bold">Thêm tài liệu <span className="text-danger">*</span></label>
                  <div className={styles.uploadArea}>
                    {/* 2. CẬP NHẬT: Thêm required={!isEditMode} */}
                    <input 
                        type="file" 
                        className="form-control" 
                        id="fileUpload" 
                        accept=".pdf,audio/mp3,video/mp4" 
                        required={!isEditMode} 
                    />
                  </div>
                  {isEditMode && <small className="text-muted mt-1 d-block">Bỏ trống nếu muốn giữ nguyên file cũ.</small>}
                </div>
              </div>

              <div className="row mb-4 bg-light p-3 rounded border">
                <div className="col-12">
                  <label className="form-label fw-bold">Nhãn dán (Tags)</label>
                  <small className="text-muted d-block mb-2">Nhãn mới sẽ chỉ được lưu vào hệ thống sau khi bạn bấm Lưu.</small>
                  <CreatableSelect
                    isMulti
                    isDisabled={isLoadingTags}
                    isLoading={isLoadingTags}
                    onChange={(newValue) => setSelectedTags(newValue)}
                    onCreateOption={handleCreateTag}
                    options={tagOptions}
                    value={selectedTags}
                    placeholder="Chọn hoặc gõ tên nhãn dán..."
                    noOptionsMessage={() => "Không tìm thấy nhãn dán"}
                    formatCreateLabel={(inputValue) => `+ Thêm nhãn mới: "${inputValue}"`}
                  />
                </div>
              </div>

              <div className="text-end">
                <Link to="/thu-vien" className="btn btn-light btn-lg px-4 me-3 shadow-sm border">Hủy bỏ</Link>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-5 shadow fw-bold"
                  disabled={isLoadingTags}
                >
                  {isLoadingTags ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</>
                  ) : (
                    <><i className="bi bi-save me-2"></i>{isEditMode ? 'Cập nhật tài liệu' : 'Lưu tài liệu'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {confirmModal.isOpen && (
        <div 
            className="d-flex align-items-center justify-content-center" 
            style={{
                position: 'fixed', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                zIndex: 10000,
                backdropFilter: 'blur(3px)'
            }}
        >
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
                <i className="bi bi-question-circle text-primary mb-3" style={{ fontSize: '4rem' }}></i>
                <h4 className="fw-bold text-dark">Xác nhận thao tác</h4>
                <p className="text-muted mt-2 mb-4">{confirmModal.message}</p>
                <div className="d-flex justify-content-center gap-3">
                    <button 
                        className="btn btn-light border fw-bold rounded-pill px-4 py-2" 
                        onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    >
                        Quay lại
                    </button>
                    <button 
                        className="btn btn-primary fw-bold rounded-pill px-4 py-2 text-white"
                        onClick={executeSubmit}
                    >
                        Đồng ý lưu
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default ThemTaiLieu;