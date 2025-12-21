import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/distance';
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa'; 
import './LocationListPage.css';
import API from '../api';

// Cấu hình API URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Hàm helper: Tạo màu gradient ngẫu nhiên (Đồng bộ style với DishRecommendation)
const getPlaceholderStyle = (name) => {
  const gradients = [
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)', // Hồng phấn
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Tím mộng mơ
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // Xanh mint
    'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', // Xanh tím
    'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)', // Đỏ hồng
    'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', // Cam vàng
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Tím đậm
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'  // Hồng đào
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  
  return { background: gradients[index] };
};

const LocationListPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; 

  const userLocation = useGeolocation();
  const navigate = useNavigate();

  // Hàm tải dữ liệu quán gần đây
  const fetchDefaultLocations = async () => {
    if (!userLocation.loaded || userLocation.error) return;

    try {
      setLoading(true);
      setError(null);
      const { lat, lng } = userLocation.coordinates;
      
      const response = await API.get(
        `/locations/nearby?lat=${lat}&lng=${lng}&radius=5`
      );
      if (response.data.success) {
        setLocations(response.data.data);
        setCurrentPage(1);
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

  useEffect(() => {
    if (!userLocation.loaded) return;

    if (userLocation.error) {
      setLoading(false);
      setError("Không thể xác định vị trí của bạn. Hãy bật GPS và thử lại.");
      return;
    }

    fetchDefaultLocations();
    // 👇 FIX: Thêm userLocation.coordinates vào dependency array để tránh warning và cập nhật khi vị trí thay đổi
  }, [userLocation.loaded, userLocation.error, userLocation.coordinates]);


  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
        fetchDefaultLocations(); 
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await API.get(`/locations/search?keyword=${searchTerm}`);
      if (response.data.success) {
        setLocations(response.data.data);
        setCurrentPage(1); 
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
      setError("Có lỗi xảy ra khi tìm kiếm.");
    } finally {
      setLoading(false);
    }
  };

  // Logic phân trang
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

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-box">
            <input 
                type="text" 
                placeholder="Bạn đang thèm gì? (VD: Phở, Cafe...)" 
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

      {!loading && !error && locations.length === 0 && (
        <div className="empty-state">
          <p>Không tìm thấy địa điểm nào {searchTerm ? `cho từ khóa "${searchTerm}"` : 'trong bán kính 5km'}.</p>
          <button className="retry-btn" onClick={() => {
              setSearchTerm(''); 
              fetchDefaultLocations(); 
          }}>
              {searchTerm ? 'Xem tất cả' : 'Thử lại'}
          </button>
        </div>
      )}

      <div className="locations-grid">
        {currentLocations.map((loc) => (
          <div key={loc.id} className="location-card" onClick={() => navigate(`/locations/${loc.id}`)}>
            <div className="card-image">
              {/* Logic hiển thị ảnh hoặc chữ cái đầu */}
              {loc.images && loc.images.length > 0 ? (
                <>
                  <img 
                    src={loc.images[0].url} 
                    alt={loc.name} 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling && e.target.nextSibling.classList.contains('fallback')) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="img-placeholder fallback" style={{...getPlaceholderStyle(loc.name), display: 'none'}}>
                    {loc.name.charAt(0).toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="img-placeholder" style={getPlaceholderStyle(loc.name)}>
                  {loc.name.charAt(0).toUpperCase()}
                </div>
              )}
              
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