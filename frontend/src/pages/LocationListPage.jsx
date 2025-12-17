import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/distance';
import './LocationListPage.css';

// Cấu hình API URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LocationListPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Hiển thị 12 item/trang

  // Lấy vị trí người dùng
  const userLocation = useGeolocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLocation.loaded) return;

    if (userLocation.error) {
      setLoading(false);
      setError("Không thể xác định vị trí của bạn. Hãy bật GPS và thử lại.");
      return;
    }

    const fetchNearby = async () => {
      try {
        setLoading(true);
        const { lat, lng } = userLocation.coordinates;
        
        // Gọi API tìm quán gần đây (Bán kính mặc định 5km)
        const response = await axios.get(
          `${API_BASE}/locations/nearby?lat=${lat}&lng=${lng}&radius=5`
        );

        if (response.data.success) {
          setLocations(response.data.data);
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

    fetchNearby();
  }, [userLocation.loaded, userLocation.error]);

  // --- LOGIC TÍNH TOÁN ITEM CHO TRANG HIỆN TẠI ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLocations = locations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(locations.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Cuộn lên đầu danh sách khi chuyển trang
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
        <h2>📍 Địa điểm gần bạn (5km)</h2>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Xem bản đồ
        </button>
      </div>

      {loading && <div className="loading-state">⏳ Đang tìm các quán ngon quanh đây...</div>}
      
      {error && <div className="error-state">⚠️ {error}</div>}

      {!loading && !error && locations.length === 0 && (
        <div className="empty-state">
          <p>Không tìm thấy địa điểm nào trong bán kính 5km.</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      )}

      {/* Grid hiển thị các item của trang hiện tại */}
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
              <span className="distance-badge">{getDistance(loc)} km</span>
            </div>
            
            <div className="card-content">
              <h3 className="card-title">{loc.name}</h3>
              <p className="card-address">🏠 {loc.address}</p>
              
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

      {/* --- PHÂN TRANG CONTROL --- */}
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