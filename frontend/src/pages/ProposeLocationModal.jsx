import React, { useState } from 'react';
import API from '../api';
import './ProposeLocationModal.css';

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
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Chuẩn bị dữ liệu gửi lên
      const payload = {
        ...formData,
        latitude: lat,
        longitude: lng,
        min_price: formData.min_price ? parseInt(formData.min_price) : 0,
        max_price: formData.max_price ? parseInt(formData.max_price) : 0,
      };

      // Gọi API tạo địa điểm (Backend sẽ tự set is_approved = false nếu là user)
      await API.post('/locations', payload);
      
      alert("✅ Gửi đề xuất thành công! Admin sẽ duyệt địa điểm này sớm nhất.");
      onSuccess(); // Gọi callback để reset map
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