import React, { useState, useRef } from 'react';
import API from '../api';
import './ProposeLocationModal.css';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

const ProposeLocationModal = ({ lat, lng, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    district: '',
    description: '',
    phone_number: '',
    min_price: '',
    max_price: ''
  });
  
  // State quản lý ảnh
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý chọn ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chỉ chọn file ảnh!');
        return;
      }
      setSelectedImage(file);
      // Tạo URL preview
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Vì có file, ta phải dùng FormData
      const data = new FormData();
      
      // Append các trường text
      data.append('name', formData.name);
      data.append('address', formData.address);
      data.append('district', formData.district);
      data.append('description', formData.description);
      data.append('phone_number', formData.phone_number);
      data.append('latitude', lat);
      data.append('longitude', lng);
      
      if (formData.min_price) data.append('min_price', formData.min_price);
      if (formData.max_price) data.append('max_price', formData.max_price);

      // Append file ảnh (quan trọng: tên 'image' phải khớp với backend upload.single('image'))
      if (selectedImage) {
        data.append('image', selectedImage);
      }

      // Gọi API tạo địa điểm (Lưu ý: API phải hỗ trợ multipart/form-data)
      // Nếu backend bạn tách riêng API upload ảnh, logic sẽ khác một chút. 
      // Ở đây tôi giả định backend nhận cả thông tin và ảnh trong cùng 1 request POST /locations
      // HOẶC: Bạn gọi tạo location trước, lấy ID, rồi gọi API upload ảnh sau.
      // Dưới đây là cách gọi gộp (nếu backend hỗ trợ) hoặc gọi tách (phổ biến hơn).
      
      // CÁCH 1: Gửi location trước -> Lấy ID -> Gửi ảnh sau (An toàn nhất với cấu trúc hiện tại)
      
      // 1. Tạo Location (Gửi JSON như cũ)
      const locationPayload = {
        ...formData,
        latitude: lat,
        longitude: lng,
        min_price: formData.min_price ? parseInt(formData.min_price) : 0,
        max_price: formData.max_price ? parseInt(formData.max_price) : 0,
      };
      
      const res = await API.post('/locations', locationPayload);
      const newLocationId = res.data.data.id;

      // 2. Nếu có ảnh, upload ảnh cho location vừa tạo
      if (selectedImage && newLocationId) {
         const imageFormData = new FormData();
         imageFormData.append('image', selectedImage);
         // Gọi API upload ảnh (đã cấu hình ở các bước trước: /locations/:id/images)
         await API.post(`/locations/${newLocationId}/images`, imageFormData, {
             headers: { 'Content-Type': 'multipart/form-data' }
         });
      }
      
      alert("✅ Gửi đề xuất thành công! Admin sẽ duyệt địa điểm này sớm nhất.");
      onSuccess(); 

    } catch (err) {
      console.error(err);
      alert("❌ Lỗi: " + (err.response?.data?.message || "Không thể gửi đề xuất."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>📍 Đề xuất địa điểm mới</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-info-box">
           Tọa độ đã chọn: <b>{lat.toFixed(5)}, {lng.toFixed(5)}</b>
        </div>

        <form onSubmit={handleSubmit} className="propose-form">
          
          {/* KHUNG UPLOAD ẢNH */}
          <div className="form-group upload-section">
            <label>Ảnh đại diện (Tùy chọn)</label>
            
            {!previewUrl ? (
                <div 
                    className="upload-placeholder"
                    onClick={() => fileInputRef.current.click()}
                >
                    <FaCloudUploadAlt size={40} color="#3498db" />
                    <span>Nhấn để chọn ảnh</span>
                    <small>JPG, PNG, WEBP (Max 5MB)</small>
                </div>
            ) : (
                <div className="image-preview-wrapper">
                    <img src={previewUrl} alt="Preview" className="image-preview" />
                    <button 
                        type="button" 
                        className="btn-remove-image"
                        onClick={handleRemoveImage}
                        title="Xóa ảnh"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}
            
            <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageChange}
            />
          </div>

          <div className="form-group">
            <label>Tên địa điểm <span style={{color:'red'}}>*</span></label>
            <input 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="VD: Phở Cồ Cầu Giấy..." 
                autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
                <label>Địa chỉ <span style={{color:'red'}}>*</span></label>
                <input name="address" required value={formData.address} onChange={handleChange} placeholder="Số nhà, đường..." />
            </div>
            <div className="form-group">
                <label>Xã/ Phường <span style={{color:'red'}}>*</span></label>
                <input name="district" required value={formData.district} onChange={handleChange} placeholder="VD: Bạch Mai" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
                <label>Giá thấp nhất (VNĐ)</label>
                <input type="number" name="min_price" value={formData.min_price} onChange={handleChange} placeholder="0" />
            </div>
            <div className="form-group">
                <label>Giá cao nhất (VNĐ)</label>
                <input type="number" name="max_price" value={formData.max_price} onChange={handleChange} placeholder="0" />
            </div>
          </div>
          
          <div className="form-group">
            <label>Số điện thoại</label>
            <input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="09xxxx..." />
          </div>

          <div className="form-group">
            <label>Mô tả ngắn</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Quán chuyên về món gì..."></textarea>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy bỏ</button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đề xuất'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposeLocationModal;