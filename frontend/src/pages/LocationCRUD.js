import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // ✨ THÊM DÒNG NÀY
import API from '../api'; // Dùng instance đã cấu hình interceptor
import * as XLSX from 'xlsx';
import './LocationCRUD.css'; // Nhớ đảm bảo file CSS này đã được tạo như bước trước

export default function LocationCRUD() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [locations, setLocations] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0); // Biến trigger reload
  const [view, setView] = useState('list'); // 'list' hoặc 'form'

  // --- STATE FORM ---
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
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

  // --- STATE TÌM KIẾM, LỌC, SẮP XẾP & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' }); // ✨ Sắp xếp mặc định theo ID
  const itemsPerPage = 10;

  // ============================================================
  // 1. FETCH DỮ LIỆU
  // ============================================================
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        // ✨ Sửa đổi: Thêm query param `status=all` để đảm bảo lấy tất cả địa điểm
        const res = await API.get('/locations/admin/all', {
          params: { status: 'all' }
        });
        setLocations(res.data.data);
      } catch (err) {
        console.error("Lỗi tải danh sách:", err);
        alert("Không thể tải dữ liệu. Vui lòng kiểm tra đăng nhập.");
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, [refresh]);

  // ============================================================
  // 2. XỬ LÝ FORM (THÊM / SỬA)
  // ============================================================
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddForm = () => {
    setFormData({
      name: '', description: '', address: '', district: '',
      latitude: '', longitude: '', phone_number: '',
      min_price: 0, max_price: 0, is_approved: true // Admin tạo thì mặc định duyệt luôn
    });
    setIsEditing(false);
    setView('form');
  };

  const openEditForm = (loc) => {
    setFormData({
      name: loc.name,
      description: loc.description || '',
      address: loc.address,
      district: loc.district,
      latitude: loc.latitude,
      longitude: loc.longitude,
      phone_number: loc.phone_number || '',
      min_price: loc.min_price || 0,
      max_price: loc.max_price || 0,
      is_approved: loc.is_approved
    });
    setCurrentId(loc.id);
    setIsEditing(true);
    setView('form');
  };

  const  handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await API.put(`/locations/${currentId}`, formData);
        alert("Cập nhật thành công!");
      } else {
        await API.post('/locations', formData); // API create (nhớ chỉnh route backend ko cần /propose nếu là admin)
        alert("Thêm mới thành công!");
      }
      setRefresh(prev => prev + 1);
      setView('list');
    } catch (error) {
      alert("Lỗi khi lưu dữ liệu: " + (error.response?.data?.message || error.message));
    }
  };

  // ============================================================
  // 3. XỬ LÝ HÀNH ĐỘNG (DUYỆT / XÓA)
  // ============================================================
  const handleApprove = async (id) => {
    try {
      await API.put(`/locations/${id}`, { is_approved: true });
      setRefresh(prev => prev + 1);
    } catch (error) {
      alert("Lỗi khi duyệt.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn địa điểm này?")) return;
    try {
      await API.delete(`/locations/${id}`);
      setRefresh(prev => prev + 1);
    } catch (error) {
      alert("Lỗi khi xóa.");
    }
  };

  // ============================================================
  // 4. XỬ LÝ EXCEL
  // ============================================================
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!Array.isArray(sheet) || sheet.length === 0) {
        alert('File rỗng hoặc không hợp lệ!');
        return;
      }

      // Map dữ liệu từ Excel sang chuẩn DB
      const locationsData = sheet.map((row) => ({
        name: row['Tên địa điểm'],
        description: row['Mô tả'],
        address: row['Địa chỉ'],
        district: row['Phường/Xã'],
        latitude: Number(row['Vĩ độ']),
        longitude: Number(row['Kinh độ']),
        phone_number: row['Số điện thoại'],
        min_price: Number(row['Giá tối thiểu']),
        max_price: Number(row['Giá tối đa']),
        is_approved: true 
      }));

      await API.post('/locations/batch', { locations: locationsData });
      alert(`Đã nhập ${locationsData.length} địa điểm!`);
      setRefresh(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert('Lỗi import Excel.');
    } finally {
      e.target.value = '';
    }
  };

  // ============================================================
  // 5. LOGIC LỌC & PHÂN TRANG
  // ============================================================

  // ✨ Hàm xử lý khi click vào header để sắp xếp
  const requestSort = (key) => {
    let direction = 'ascending';
    // Nếu click lại cột đang sắp xếp, đảo chiều
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Quay về trang 1 khi sắp xếp lại
  };

  // ✨ Dùng useMemo để tối ưu việc lọc và sắp xếp
  const processedLocations = useMemo(() => {
    let sortableItems = [...locations];

    // 1. Lọc theo từ khóa tìm kiếm
    sortableItems = sortableItems.filter(loc => 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sắp xếp
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        // Xử lý giá trị null hoặc undefined
        const valA = a[sortConfig.key] === null || a[sortConfig.key] === undefined ? '' : a[sortConfig.key];
        const valB = b[sortConfig.key] === null || b[sortConfig.key] === undefined ? '' : b[sortConfig.key];

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [locations, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedLocations.length / itemsPerPage);
  const currentData = processedLocations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ============================================================
  // RENDER GIAO DIỆN
  // ============================================================

  // ✨ Helper để thêm class cho mũi tên sắp xếp
  const getSortIndicator = (name) => {
    if (!sortConfig || sortConfig.key !== name) return null;
    if (sortConfig.direction === 'ascending') return ' ▲';
    return ' ▼';
  };


  // --- VIEW 1: FORM NHẬP LIỆU ---
  if (view === 'form') {
    return (
      <div className="crud-container">
        <div className="crud-header">
          <h3>{isEditing ? '✏️ Chỉnh sửa địa điểm' : '➕ Thêm địa điểm mới'}</h3>
          <button className="btn-secondary" onClick={() => setView('list')}>Quay lại danh sách</button>
        </div>
        
        <form onSubmit={handleSubmit} className="crud-form-layout">
            <div className="form-row">
                <div className="form-col">
                    <label>Tên địa điểm *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-col">
                    <label>Phường / Quận *</label>
                    <input name="district" value={formData.district} onChange={handleInputChange} required />
                </div>
            </div>

            <div className="form-col">
                <label>Địa chỉ chi tiết *</label>
                <input name="address" value={formData.address} onChange={handleInputChange} required />
            </div>

            <div className="form-row">
                 <div className="form-col">
                    <label>Vĩ độ (Latitude) *</label>
                    <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} required />
                </div>
                <div className="form-col">
                    <label>Kinh độ (Longitude) *</label>
                    <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} required />
                </div>
            </div>

            <div className="form-row">
                <div className="form-col">
                    <label>Giá thấp nhất</label>
                    <input type="number" name="min_price" value={formData.min_price} onChange={handleInputChange} />
                </div>
                <div className="form-col">
                    <label>Giá cao nhất</label>
                    <input type="number" name="max_price" value={formData.max_price} onChange={handleInputChange} />
                </div>
            </div>

            <div className="form-col">
                <label>Mô tả</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} />
            </div>
            
            <div className="form-checkbox">
                <label>
                    <input type="checkbox" name="is_approved" checked={formData.is_approved} onChange={handleInputChange} />
                    Hiển thị ngay trên bản đồ (Đã duyệt)
                </label>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-add-new">{isEditing ? 'Cập nhật' : 'Lưu địa điểm'}</button>
            </div>
        </form>
      </div>
    );
  }

  // --- VIEW 2: DANH SÁCH (DEFAULT) ---
  return (
    <div className="crud-container">
      <div className="crud-header">
        <h3>📋 Quản lý Địa điểm ({locations.length})</h3>
        <div className="header-tools">
            {/* Nút Excel ẩn */}
            <input id="excel-upload" type="file" hidden accept=".xlsx" onChange={handleExcelUpload} />
            <button className="btn-excel" onClick={() => document.getElementById('excel-upload').click()}>
                📂 Import Excel
            </button>
            <button className="btn-add-new" onClick={openAddForm}> + Thêm mới</button>
        </div>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="crud-search-bar">
        <input 
            type="text" 
            placeholder="🔍 Tìm kiếm theo tên hoặc địa chỉ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{textAlign:'center', padding: 20}}>⏳ Đang tải dữ liệu...</p>
      ) : (
        <div className="table-responsive">
          <table className="crud-table">
            <thead>
              <tr>
                <th style={{width: '5%'}} onClick={() => requestSort('id')}>
                  ID{getSortIndicator('id')}
                </th>
                <th style={{width: '25%'}} onClick={() => requestSort('name')}>
                  Tên địa điểm{getSortIndicator('name')}
                </th>
                <th style={{width: '30%'}} onClick={() => requestSort('address')}>
                  Địa chỉ{getSortIndicator('address')}
                </th>
                <th style={{width: '10%'}} onClick={() => requestSort('is_approved')}>
                  Trạng thái{getSortIndicator('is_approved')}
                </th>
                <th style={{width: '15%'}} onClick={() => requestSort('created_by_username')}>
                  Người tạo{getSortIndicator('created_by_username')}
                </th>
                <th style={{width: '15%'}} className="no-sort">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((loc) => (
                <tr key={loc.id}>
                  <td>#{loc.id}</td>
                  <td>
                      <div style={{fontWeight: 'bold', color: '#2c3e50'}}>{loc.name}</div>
                      <small style={{color: '#7f8c8d'}}>{loc.district}</small>
                  </td>
                  <td>{loc.address}</td>
                  <td>
                    {loc.is_approved ? (
                      <span className="badge success">Active</span>
                    ) : (
                      <span className="badge pending">Pending</span>
                    )}
                  </td>
                  <td>{loc.created_by_username || (loc.created_by_user_id ? `User #${loc.created_by_user_id}` : 'Admin')}</td>
                  <td>
                    <div className="action-buttons">
                      {!loc.is_approved && (
                        <button 
                          className="btn-icon approve" 
                          onClick={() => handleApprove(loc.id)}
                          title="Duyệt nhanh"
                        >
                          ✅
                        </button>
                      )}
                      {/* ✨ THÊM NÚT XEM CHI TIẾT */}
                      <button 
                        className="btn-icon view" 
                        onClick={() => navigate(`/locations/${loc.id}`)} 
                        title="Xem chi tiết">👁️
                      </button>
                      <button className="btn-icon edit" onClick={() => openEditForm(loc)} title="Sửa">✏️</button>
                      <button className="btn-icon delete" onClick={() => handleDelete(loc.id)} title="Xóa">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentData.length === 0 && (
                  <tr>
                      <td colSpan="6" style={{textAlign: 'center', padding: 20}}>Không tìm thấy dữ liệu phù hợp.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="pagination-container">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Trước</button>
            <span>Trang {currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
}