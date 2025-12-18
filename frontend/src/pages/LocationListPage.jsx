// src/LocationListPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/distance';
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa'; // ✨ MỚI: Import Icon
import './LocationListPage.css';

// Cấu hình API URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LocationListPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✨ MỚI: State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // --- PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; 

  // Lấy vị trí người dùng
  const userLocation = useGeolocation();
  const navigate = useNavigate();

  // ✨ MỚI: Hàm tải dữ liệu mặc định (Quán gần đây) - Tách ra để tái sử dụng
  const fetchDefaultLocations = async () => {
    if (!userLocation.loaded || userLocation.error) return;

    try {
      setLoading(true);
      setError(null);
      const { lat, lng } = userLocation.coordinates;
      
      const response = await axios.get(
        `${API_BASE}/locations/nearby?lat=${lat}&lng=${lng}&radius=5`
      );

      if (response.data.success) {
        setLocations(response.data.data);
        setCurrentPage(1); // Reset về trang 1 khi load dữ liệu mới
      } else {
        setError("Không tải được dữ liệu.");
      }
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
      setError("Lỗi kết nối máy chủ hoặc API bị lỗi.");
    } finally {
      setLoading(false);
    }
  };

  // useEffect ban đầu: Chỉ chạy khi có tọa độ (Load lần đầu)
  useEffect(() => {
    if (!userLocation.loaded) return;

    if (userLocation.error) {
      setLoading(false);
      setError("Không thể xác định vị trí của bạn. Hãy bật GPS và thử lại.");
      return;
    }

    // Gọi hàm load mặc định
    fetchDefaultLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation.loaded, userLocation.error]);


  // ✨ MỚI: Hàm xử lý Tìm kiếm
  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Nếu ô tìm kiếm trống -> Load lại quán gần đây (mặc định)
    if (!searchTerm.trim()) {
        fetchDefaultLocations(); 
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/locations/search?keyword=${searchTerm}`);
      
      if (response.data.success) {
        setLocations(response.data.data);
        setCurrentPage(1); // Quan trọng: Reset phân trang về 1
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
      setError("Có lỗi xảy ra khi tìm kiếm.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC TÍNH TOÁN ITEM CHO TRANG HIỆN TẠI (GIỮ NGUYÊN) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLocations = locations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(locations.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getDistance = (loc) => {
    if (!userLocation.coordinates || !userLocation.coordinates.lat) return 0;
    return calculateDistance(
      userLocation.coordinates.lat,
      userLocation.coordinates.lng,
      parseFloat(loc.latitude),
      parseFloat(loc.longitude)
    ).toFixed(2);
  };

  return (
    <div className="list-page-container">
      <div className="list-header">
        <h2>📍 Khám phá địa điểm</h2>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Xem bản đồ
        </button>
      </div>

      {/* ✨ MỚI: THANH TÌM KIẾM (SEARCH BAR) */}
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-box">
            <input 
                type="text" 
                placeholder="Bạn đang thèm gì? (VD: Phở, Cafe, Lẩu...)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">
                <FaSearch />
            </button>
        </form>
      </div>

      {loading && <div className="loading-state">⏳ Đang xử lý...</div>}
      
      {error && <div className="error-state">⚠️ {error}</div>}

      {/* ✨ CẬP NHẬT: Empty State xử lý cả trường hợp Search không ra kết quả */}
      {!loading && !error && locations.length === 0 && (
        <div className="empty-state">
          <p>Không tìm thấy địa điểm nào {searchTerm ? `cho từ khóa "${searchTerm}"` : 'trong bán kính 5km'}.</p>
          <button className="retry-btn" onClick={() => {
              setSearchTerm(''); 
              fetchDefaultLocations(); // Nút thử lại sẽ xóa search và load lại nearby
          }}>
             {searchTerm ? 'Xem tất cả' : 'Thử lại'}
          </button>
        </div>
      )}

      {/* Grid hiển thị (GIỮ NGUYÊN) */}
      <div className="locations-grid">
        {currentLocations.map((loc) => (
          <div key={loc.id} className="location-card" onClick={() => navigate(`/locations/${loc.id}`)}>
            <div className="card-image">
              <img 
                src={loc.images && loc.images.length > 0 
                  ? loc.images[0].url 
                  : 'https://via.placeholder.com/300x200?text=No+Image'} 
                alt={loc.name} 
              />
              {/* Chỉ hiện khoảng cách nếu có tọa độ user */}
              {userLocation.loaded && !userLocation.error && (
                  <span className="distance-badge">{getDistance(loc)} km</span>
              )}
            </div>
            
            <div className="card-content">
              <h3 className="card-title">{loc.name}</h3>
              <p className="card-address"><FaMapMarkerAlt /> {loc.address}</p>
              
              <div className="card-footer">
                <span className="card-price">
                  {loc.min_price > 0 ? `${loc.min_price.toLocaleString()}đ` : ''} 
                  {loc.max_price > 0 ? ` - ${loc.max_price.toLocaleString()}đ` : ''}
                </span>
                <button className="detail-btn">Xem chi tiết</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Phân trang (GIỮ NGUYÊN) */}
      {!loading && !error && locations.length > itemsPerPage && (
        <div className="pagination-controls">
          <button 
            className="pagination-btn" 
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            &laquo; Trước
          </button>
          
          <span className="pagination-info">
            Trang <strong>{currentPage}</strong> / {totalPages}
          </span>
          
          <button 
            className="pagination-btn" 
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Sau &raquo;
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationListPage;