import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaTimes, FaTrash } from 'react-icons/fa';
import API from '../services/api'; // Hoặc đường dẫn tới file api.js của bạn
import './AddImageModal.css';

const AddImageModal = ({ locationId, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Xử lý khi chọn file
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Gộp file mới vào danh sách cũ
    setSelectedFiles(prev => [...prev, ...files]);

    // Tạo URL preview
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  // Xóa file khỏi danh sách chờ
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Gửi lên Server
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return alert("Chưa chọn ảnh nào!");

    setUploading(true);
    const formData = new FormData();
    
    // Append từng file vào formData với key 'images' (khớp với backend)
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      // Gọi API thêm ảnh vào địa điểm cũ
      await API.post(`/locations/${locationId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert(`Đã thêm thành công ${selectedFiles.length} ảnh!`);
      onSuccess(); // Gọi callback để reload trang cha
      onClose();   // Đóng modal
    } catch (error) {
      console.error(error);
      alert("Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  // Dọn dẹp URL blob khi unmount để tránh leak memory
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="modal-overlay">
      <div className="upload-modal-content">
        <div className="upload-header">
          <h3>📸 Thêm ảnh vào bộ sưu tập</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="upload-body">
          {/* Khu vực kéo thả / chọn file */}
          <div className="drop-zone">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange} 
              id="file-upload"
              hidden
            />
            <label htmlFor="file-upload" className="drop-label">
              <FaCloudUploadAlt size={40} color="#3498db" />
              <p>Nhấn để chọn ảnh (Có thể chọn nhiều)</p>
            </label>
          </div>

          {/* Khu vực Preview */}
          {previewUrls.length > 0 && (
            <div className="preview-grid">
              {previewUrls.map((url, index) => (
                <div key={index} className="preview-item">
                  <img src={url} alt="preview" />
                  <button className="remove-preview-btn" onClick={() => removeFile(index)}>
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="upload-footer">
          <span className="file-count">Đã chọn: {selectedFiles.length} ảnh</span>
          <button 
            className="btn-submit-upload" 
            onClick={handleUpload} 
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? 'Đang tải lên...' : 'Lưu ảnh'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddImageModal;