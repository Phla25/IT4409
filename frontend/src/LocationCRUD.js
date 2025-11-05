// frontend/src/LocationCRUD.js (CODE ĐÃ HOÀN THIỆN)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext'; 

const API_URL = 'http://localhost:5000/api/locations';
const ADMIN_API_URL = `${API_URL}/admin`; // Endpoint mới dành cho Admin

const LocationCRUD = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', address: '', district: '', 
    latitude: '', longitude: '', phone_number: '', 
    min_price: 0, max_price: 0, is_approved: false
  });
  const [error, setError] = useState(null);
  
  // Lấy thông tin xác thực từ AuthContext
  const { userRole, authHeaders } = useAuth(); 

  // --- HÀM TẢI DỮ LIỆU ---
  const fetchLocations = useCallback(async () => {
    // Chỉ Admin mới được phép fetch
    if (userRole !== 'admin') return; 
    setLoading(true);
    setError(null);
    try {
      // Gọi API ADMIN để lấy TẤT CẢ địa điểm (Đã duyệt và chưa duyệt)
      const response = await axios.get(ADMIN_API_URL, { headers: authHeaders });
      setLocations(response.data.data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách Admin:", err.response?.data?.message || err.message);
      setError("Không thể tải danh sách Admin. Hãy kiểm tra Token/Server.");
    } finally {
      setLoading(false);
    }
  }, [userRole, authHeaders]);
  
  // --- XỬ LÝ FORM VÀ CRUD ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      // Xử lý giá trị boolean cho checkbox
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const resetForm = () => {
    // Reset form về trạng thái rỗng
    setFormData({
      name: '', description: '', address: '', district: '', 
      latitude: '', longitude: '', phone_number: '', 
      min_price: 0, max_price: 0, is_approved: false
    });
    setIsEditing(false);
    setCurrentLocationId(null);
  };
  
  const handleEdit = (location) => {
    // Đổ dữ liệu vào form khi bấm Sửa
    setFormData({
      ...location,
      latitude: String(location.latitude), // Chuyển sang string cho input type="number"
      longitude: String(location.longitude),
      min_price: location.min_price || 0,
      max_price: location.max_price || 0,
    });
    setIsEditing(true);
    setCurrentLocationId(location.id);
    window.scrollTo(0, 0); // Cuộn lên đầu để tiện chỉnh sửa
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa địa điểm ID: ${id}?`)) return;
    try {
      // Gửi yêu cầu DELETE đến API
      await axios.delete(`${API_URL}/${id}`, { headers: authHeaders });
      fetchLocations(); // Tải lại danh sách
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      setError("Không thể xóa địa điểm. Kiểm tra Token và quyền của bạn.");
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Ép kiểu dữ liệu số trước khi gửi
    const dataToSend = {
        ...formData,
        min_price: Number(formData.min_price),
        max_price: Number(formData.max_price),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
    };
    
    try {
      if (isEditing) {
        // UPDATE: Gửi PUT
        await axios.put(`${API_URL}/${currentLocationId}`, dataToSend, { headers: authHeaders });
      } else {
        // CREATE: Gửi POST
        await axios.post(API_URL, dataToSend, { headers: authHeaders });
      }
      
      resetForm(); // Xóa dữ liệu form
      fetchLocations(); // Tải lại danh sách
    } catch (err) {
      console.error("Lỗi khi gửi form:", err);
      setError(err.response?.data?.message || "Lỗi khi lưu dữ liệu. Kiểm tra token và dữ liệu nhập.");
    }
  };


  // --- useEffect: Tải dữ liệu lần đầu ---
  useEffect(() => {
    if (userRole === 'admin') {
      fetchLocations();
    }
  }, [userRole, fetchLocations]);

  
  // --- ĐIỀU KIỆN QUYỀN ADMIN ---
  if (userRole !== 'admin') {
    return null; 
  }
  
  // --- RENDER GIAO DIỆN ADMIN ---
  if (loading) return <p style={{ margin: '20px', padding: '20px', border: '1px solid #ccc' }}>Đang tải danh sách Admin...</p>;

  return (
    <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Quản lý Địa điểm (Admin Dashboard)</h2>
        
        {error && <p style={{ color: 'white', backgroundColor: '#f44336', padding: '10px' }}>Lỗi: {error}</p>}

        {/* FORM CREATE/EDIT */}
        <h3>{isEditing ? 'Chỉnh sửa Địa điểm (ID: ' + currentLocationId + ')' : 'Thêm Địa điểm Mới'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên địa điểm" required />
            <input name="address" value={formData.address} onChange={handleChange} placeholder="Địa chỉ" required />
            
            <input name="district" value={formData.district} onChange={handleChange} placeholder="Quận/Huyện" required />
            <input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Số điện thoại" />

            <input type="number" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="Vĩ độ (Latitude)" required />
            <input type="number" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="Kinh độ (Longitude)" required />
            
            <input type="number" name="min_price" value={formData.min_price} onChange={handleChange} placeholder="Giá tối thiểu" />
            <input type="number" name="max_price" value={formData.max_price} onChange={handleChange} placeholder="Giá tối đa" />
            
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả" style={{ gridColumn: 'span 2' }}></textarea>
            
            <label style={{ gridColumn: 'span 2' }}>
                <input type="checkbox" name="is_approved" checked={formData.is_approved} onChange={handleChange} /> 
                Đã duyệt (Hiển thị trên bản đồ)
            </label>
            
            <button type="submit" style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: isEditing ? '#ff9800' : '#4CAF50', color: 'white', border: 'none' }}>
                {isEditing ? 'CẬP NHẬT ĐỊA ĐIỂM' : 'THÊM ĐỊA ĐIỂM'}
            </button>
            {isEditing && (
                <button type="button" onClick={resetForm} style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: '#9e9e9e', color: 'white', border: 'none' }}>
                    Hủy Chỉnh sửa / Tạo Mới
                </button>
            )}
        </form>

        <hr style={{ margin: '20px 0' }}/>
        
        {/* DANH SÁCH ĐỊA ĐIỂM */}
        <h3>Danh sách Địa điểm ({locations.length})</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            {locations.map((loc) => (
                <li key={loc.id} style={{ border: loc.is_approved ? '1px solid #4CAF50' : '1px solid #f44336', padding: '10px', marginBottom: '10px', backgroundColor: loc.is_approved ? '#e8f5e9' : '#ffebee' }}>
                    <strong>ID {loc.id}: {loc.name}</strong> 
                    <span style={{ float: 'right', fontWeight: 'bold', color: loc.is_approved ? '#4CAF50' : '#f44336' }}>({loc.is_approved ? 'ĐÃ DUYỆT' : 'CHƯA DUYỆT'})</span>
                    <p style={{ margin: '5px 0' }}>**Địa chỉ:** {loc.address}</p>
                    <button onClick={() => handleEdit(loc)} style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDelete(loc.id)} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}>Xóa</button>
                </li>
            ))}
        </ul>
    </div>
  );
};

export default LocationCRUD;