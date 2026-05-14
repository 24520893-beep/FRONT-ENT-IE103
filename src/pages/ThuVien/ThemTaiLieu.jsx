import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import styles from './ThemTaiLieu.module.css';
import { fetchClient } from '../../utils/fetchClient'; 

const ThemTaiLieu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // BẮT THAM SỐ TỪ URL ĐỂ BIẾT CÓ PHẢI CHẾ ĐỘ SỬA KHÔNG
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('edit');
  const isEditMode = !!editId;

  const [docName, setDocName] = useState('');
  const [format, setFormat] = useState('');

  // STATE CHO NGƯỜI DÙNG (Giáo viên)
  const [user, setUser] = useState(null);

  // STATE CHO NHÃN DÁN (Tags)
  const [tagOptions, setTagOptions] = useState([]); 
  const [selectedTags, setSelectedTags] = useState([]); 
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  
  // STATE TẢI DỮ LIỆU CŨ
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);

  // 1. LẤY THÔNG TIN GIÁO VIÊN TỪ LOCALSTORAGE
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

  // 2. FETCH DANH SÁCH NHÃN DÁN SẴN CÓ VÀ DỮ LIỆU TÀI LIỆU CŨ (NẾU CÓ)
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
          // Map lại danh sách nhãn dán cũ cho react-select
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

  // 3. HÀM SUBMIT (DÙNG CHUNG CHO POST VÀ PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingTags(true);

    try {
      // Tách nhãn mới để tạo
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

      // CHUYỂN ĐỔI SANG FORMDATA
      const formData = new FormData();
      formData.append('TenTaiLieu', docName);
      formData.append('DinhDang', format);
      formData.append('TrangThai', 'Đang kiểm duyệt');

      // Mảng phải stringify trước khi append vào FormData
      const allTags = [...existingTagIds, ...newTagIds];
      if (allTags.length > 0) {
        formData.append('DanhSachNhanDan', JSON.stringify(allTags));
      }

      // Lấy file từ input
      const fileInput = document.getElementById('fileUpload');
      if (fileInput && fileInput.files.length > 0) {
        formData.append('fileUpload', fileInput.files[0]);
      } else if (!isEditMode) {
        // Cảnh báo nếu tạo mới mà không up file
        alert("Vui lòng tải lên một tệp tài liệu!");
        setIsLoadingTags(false);
        return;
      }

      // Xác định endpoint và method dựa trên mode
      const url = isEditMode ? `/api/tailieuhoctap/${editId}` : '/api/tailieuhoctap';
      const method = isEditMode ? 'PUT' : 'POST';

      // Gọi API qua fetchClient. FormData được truyền thẳng vào body
      const resDoc = await fetchClient(url, {
        method: method,
        body: formData 
      });

      if (resDoc.ok) {
        alert(`Đã ${isEditMode ? 'cập nhật' : 'tạo mới'} tài liệu thành công! Trạng thái: Chờ duyệt.`);
        navigate('/thu-vien'); 
      } else {
        const errorData = await resDoc.json();
        alert(`Lỗi khi ${isEditMode ? 'cập nhật' : 'tạo'} tài liệu: ` + (errorData.message || errorData.error));
      }

    } catch (error) {
      console.error("Lỗi:", error);
      alert("Đã xảy ra sự cố trong quá trình lưu dữ liệu.");
    } finally {
      setIsLoadingTags(false);
    }
  };

  if (isLoadingData) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* ĐỔI TIÊU ĐỀ THEO MODE */}
        <h1 className={styles.pageTitle}>
            {isEditMode ? 'Cập nhật tài liệu' : 'Thêm tài liệu mới'}
        </h1>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {/* ROW 1: Thông tin giáo viên */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold text-muted">Giáo viên thực hiện</label>
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

            {/* ROW 2: Môn học và Tên tài liệu */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold text-muted">Môn học phụ trách</label>
                <div className="form-control bg-light">
                  {user?.MonHoc || "Chưa cập nhật"}
                </div>
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

            {/* ROW 3: Định dạng & Upload */}
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
                <label className="form-label fw-bold">Thêm tài liệu (Tùy chọn tải file mới)</label>
                <div className={styles.uploadArea}>
                  <input type="file" className="form-control" id="fileUpload" accept=".pdf,audio/mp3,video/mp4" />
                </div>
                {isEditMode && <small className="text-muted mt-1 d-block">Bỏ trống nếu muốn giữ nguyên file cũ.</small>}
              </div>
            </div>

            {/* ROW 4: Nhãn dán */}
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
                  <><span className="spinner-border spinner-border-sm me-2"></span>Đang xử lý...</>
                ) : (
                  <><i className="bi bi-save me-2"></i>{isEditMode ? 'Cập nhật tài liệu' : 'Lưu tài liệu'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ThemTaiLieu;