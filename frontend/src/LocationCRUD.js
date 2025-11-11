// frontend/src/LocationCRUD.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:5000/api/locations';
const ADMIN_API_URL = `${API_URL}/admin`;

const LocationCRUD = () => {
  const { userRole, authHeaders } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    district: '',
    latitude: '',
    longitude: '',
    phone_number: '',
    min_price: 0,
    max_price: 0,
    is_approved: false,
  });

  // ----------------- PHÂN TRANG -----------------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ----------------- TÌM KIẾM + LỌC -----------------
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // ----------------- FETCH LOCATIONS -----------------
  const fetchLocations = useCallback(async () => {
    if (userRole !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(ADMIN_API_URL, { headers: authHeaders });
      setLocations(response.data.data);
      setCurrentPage(1);
    } catch (err) {
      setError('Không thể tải danh sách địa điểm. Hãy kiểm tra token hoặc server.');
    } finally {
      setLoading(false);
    }
  }, [userRole, authHeaders]);

  useEffect(() => {
    if (userRole === 'admin') fetchLocations();
  }, [userRole, fetchLocations]);

  // ----------------- FORM HANDLERS -----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      district: '',
      latitude: '',
      longitude: '',
      phone_number: '',
      min_price: 0,
      max_price: 0,
      is_approved: false,
    });
    setIsEditing(false);
    setCurrentLocationId(null);
  };

  const handleEdit = (loc) => {
    setFormData({
      ...loc,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
    });
    setIsEditing(true);
    setCurrentLocationId(loc.id);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Xóa địa điểm ID: ${id}?`)) return;
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: authHeaders });
      fetchLocations();
    } catch {
      setError('Không thể xóa địa điểm.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      min_price: Number(formData.min_price),
      max_price: Number(formData.max_price),
    };
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${currentLocationId}`, data, { headers: authHeaders });
      } else {
        await axios.post(API_URL, data, { headers: authHeaders });
      }
      resetForm();
      fetchLocations();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu dữ liệu.');
    }
  };

  // ----------------- EXCEL IMPORT -----------------
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!Array.isArray(sheet) || sheet.length === 0) {
        alert('File Excel không có dữ liệu hợp lệ!');
        return;
      }

      const locationsData = sheet.map((row) => ({
        name: row['Tên địa điểm'] || '',
        description: row['Mô tả'] || '',
        address: row['Địa chỉ'] || '',
        district: row['Phường/Xã'] || '',
        latitude: Number(row['Vĩ độ']) || 0,
        longitude: Number(row['Kinh độ']) || 0,
        phone_number: row['Số điện thoại'] || '',
        min_price: Number(row['Giá tối thiểu']) || 0,
        max_price: Number(row['Giá tối đa']) || 0,
        is_approved: row['Hiển thị'] === true || row['Hiển thị'] === 'TRUE'
      }));

      await axios.post(`${API_URL}/batch`, { locations: locationsData }, { headers: authHeaders });

      alert(`Đã nhập ${locationsData.length} địa điểm thành công!`);
      fetchLocations();
    } catch (error) {
      console.error(error);
      alert('Lỗi khi xử lý hoặc gửi file Excel!');
    } finally {
      e.target.value = ''; // reset input file
    }
  };

  // ----------------- LỌC + PHÂN TRANG -----------------
  const uniqueWards = useMemo(
    () => [...new Set(locations.map((l) => l.district).filter(Boolean))],
    [locations]
  );

  const filteredLocations = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return locations.filter((loc) => {
      const matchesName = loc.name?.toLowerCase().includes(term);
      const matchesWard = selectedWard ? loc.district === selectedWard : true;
      return matchesName && matchesWard;
    });
  }, [locations, searchTerm, selectedWard]);

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLocations = filteredLocations.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedWard]);

  // ----------------- RENDER -----------------
  if (userRole !== 'admin') return null;

  return (
    <div className="crud-container">
      <h2 className="crud-title">Quản lý Địa điểm (Admin Dashboard)</h2>

      {error && <div className="crud-error">{error}</div>}

      {/* FORM NHẬP / SỬA */}
      <form onSubmit={handleSubmit} className="crud-form">
        <h3>{isEditing ? `Chỉnh sửa (ID: ${currentLocationId})` : 'Thêm Địa điểm Mới'}</h3>

        <div className="crud-grid">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên địa điểm" required />
          <input name="address" value={formData.address} onChange={handleChange} placeholder="Địa chỉ" required />
          <input name="district" value={formData.district} onChange={handleChange} placeholder="Phường/Xã" required />
          <input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Số điện thoại" />
          <input type="number" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="Vĩ độ" required />
          <input type="number" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="Kinh độ" required />
          <input type="number" name="min_price" value={formData.min_price} onChange={handleChange} placeholder="Giá tối thiểu" />
          <input type="number" name="max_price" value={formData.max_price} onChange={handleChange} placeholder="Giá tối đa" />
        </div>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả"
          className="crud-textarea"
        />

        <label className="crud-checkbox">
          <input type="checkbox" name="is_approved" checked={formData.is_approved} onChange={handleChange} />
          Hiển thị trên bản đồ
        </label>

        <div className="crud-actions">
          <button type="submit" className={isEditing ? 'btn-warning' : 'btn-success'}>
            {isEditing ? 'Cập nhật' : 'Thêm mới'}
          </button>
          {isEditing && (
            <button type="button" className="btn-gray" onClick={resetForm}>
              Hủy
            </button>
          )}
        </div>
      </form>

      {/* NÚT NHẬP TỪ EXCEL */}
      <div className="crud-actions">
        <button
          type="button"
          className="btn-blue"
          onClick={() => document.getElementById('excel-upload').click()}
        >
          Nhập từ Excel
        </button>
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          onChange={handleExcelUpload}
        />
      </div>

      {/* NÚT TẢI FILE MẪU */}
      <div className="crud-actions">
        <button
          type="button"
          className="btn-gray"
          onClick={() => window.open('/templates/locations_template.xlsx', '_blank')}
        >
          Tải file mẫu
        </button>
      </div>

      {/* THANH TÌM KIẾM + FILTER */}
      <div className="crud-search" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="🔍 Tìm theo tên địa điểm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
          <option value="">-- Lọc theo Phường/Xã --</option>
          {uniqueWards.map((ward, idx) => (
            <option key={idx} value={ward}>
              {ward}
            </option>
          ))}
        </select>
      </div>

      {/* DANH SÁCH ĐỊA ĐIỂM */}
      <h3 className="crud-subtitle">
        Danh sách Địa điểm ({filteredLocations.length})
      </h3>
      <div className="crud-list">
        {loading ? (
          <p>Đang tải...</p>
        ) : currentLocations.length === 0 ? (
          <p>Không có dữ liệu phù hợp.</p>
        ) : (
          currentLocations.map((loc) => (
            <div
              key={loc.id}
              className={`crud-card ${loc.is_approved ? 'approved' : 'pending'}`}
            >
              <div className="crud-card-header">
                <strong>{loc.name}</strong>
                <span className={loc.is_approved ? 'status-approved' : 'status-pending'}>
                  {loc.is_approved ? 'ĐÃ DUYỆT' : 'CHƯA DUYỆT'}
                </span>
              </div>
              <p className="location-address">{loc.address}</p>
              <div className="crud-card-actions">
                <button onClick={() => handleEdit(loc)} className="btn-blue">
                  Sửa
                </button>
                <button onClick={() => handleDelete(loc.id)} className="btn-red">
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            Trang trước
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationCRUD;
