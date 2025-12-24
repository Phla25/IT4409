<<<<<<< HEAD
import React, { useState, useEffect, useMemo } from 'react';
=======
import React, { useState, useEffect } from 'react';
import axios from 'axios';
>>>>>>> other_mvc
import { useNavigate } from 'react-router-dom';
import API from '../api';
import useGeolocation from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/distance';
<<<<<<< HEAD
=======
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa'; 
>>>>>>> other_mvc
import './LocationListPage.css';
import API from '../api';

<<<<<<< HEAD
// Component hiển thị một địa điểm trong danh sách
const LocationCard = ({ location, userCoords }) => {
  const navigate = useNavigate();
  const distance = userCoords.lat ? calculateDistance(userCoords.lat, userCoords.lng, location.latitude, location.longitude) : null;

  return (
    <div className="location-card" onClick={() => navigate(`/locations/${location.id}`)}>
      <img 
        src={location.images?.[0]?.url || 'https://via.placeholder.com/150?text=No+Image'} 
        alt={location.name} 
        className="card-image"
      />
      <div className="card-content">
        <h3 className="card-title">{location.name}</h3>
        <p className="card-address">{location.address}</p>
        <div className="card-footer">
          <span className="card-rating">
            ⭐ {location.average_rating ? Number(location.average_rating).toFixed(1) : 'Mới'}
          </span>
          {distance !== null && (
            <span className="card-distance">
              📍 {distance.toFixed(1)} km
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Component chính của trang
export default function LocationListPage() {
  const userLocation = useGeolocation();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 địa điểm mỗi trang

  // State cho tìm kiếm và sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' hoặc 'rating'
  const [radius, setRadius] = useState(5); // State cho bán kính tìm kiếm (km), mặc định 5km

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError('');
      try {
        let response;
        // Nếu có vị trí người dùng, ưu tiên API tìm kiếm lân cận
        if (userLocation.loaded && userLocation.coordinates.lat) {
          const { lat, lng } = userLocation.coordinates;
          response = await API.get(`/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`); // Lấy theo bán kính được chọn
        } else {
          // Nếu không, lấy tất cả địa điểm đã được duyệt
          response = await API.get('/locations');
        }
        setLocations(response.data.data || []);
      } catch (err) {
        console.error("Lỗi tải danh sách địa điểm:", err);
        setError("Không thể tải được danh sách địa điểm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [userLocation.loaded, userLocation.coordinates, radius]); // Fetch lại khi vị trí hoặc bán kính thay đổi

  // Logic lọc và sắp xếp dữ liệu
  const processedLocations = useMemo(() => {
    let filtered = locations.filter(loc =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'distance') {
      // Chỉ sắp xếp theo khoảng cách nếu có vị trí người dùng
      if (userLocation.loaded && userLocation.coordinates.lat) {
        filtered.sort((a, b) => {
          const distA = calculateDistance(userLocation.coordinates.lat, userLocation.coordinates.lng, a.latitude, a.longitude);
          const distB = calculateDistance(userLocation.coordinates.lat, userLocation.coordinates.lng, b.latitude, b.longitude);
          return distA - distB;
        });
      }
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    }

    return filtered;
  }, [locations, searchTerm, sortBy, userLocation.coordinates, userLocation.loaded]);

  // Logic phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedLocations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedLocations.length / itemsPerPage);

  // --- RENDER ---
  if (loading) {
    return <div className="list-page-status">⏳ Đang tìm các địa điểm xung quanh bạn...</div>;
  }

  if (error) {
    return <div className="list-page-status error">❌ {error}</div>;
  }

  return (
    <div className="location-list-page">
      <div className="list-header">
        <h1>Khám phá ẩm thực Hà Nội</h1>
        <p>
          {userLocation.loaded && userLocation.coordinates.lat 
            ? `Tìm thấy ${processedLocations.length} địa điểm trong vòng ${radius} km.`
            : `Hiển thị ${processedLocations.length} địa điểm nổi bật.`}
        </p>
      </div>

      {/* Thanh công cụ: Tìm kiếm và Sắp xếp */}
      <div className="toolbar-container">
        <div className="toolbar">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Tìm theo tên, địa chỉ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sort-options">
            <label htmlFor="sort-by">Sắp xếp theo:</label>
            <select 
              id="sort-by" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={sortBy}
            >
              <option value="distance" disabled={!userLocation.loaded}>Gần nhất</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </div>
          {userLocation.loaded && (
            <div className="radius-selector">
              <label htmlFor="radius-input">Trong bán kính:</label>
              <input
                id="radius-input"
                type="number"
                value={radius}
                onChange={e => setRadius(e.target.value > 0 ? e.target.value : 1)}
                min="1"
                step="1"
              />
              <span>km</span>
            </div>
          )}
        </div>
      </div>

      {/* Lưới hiển thị danh sách */}
      <div className="locations-grid">
        {processedLocations.length > 0 ? (
          currentItems.map(loc => (
            <LocationCard 
              key={loc.id} 
              location={loc} 
              userCoords={userLocation.coordinates} 
            />
          ))
        ) : (
          <div className="no-results">
            <p>Không tìm thấy địa điểm nào phù hợp với tìm kiếm của bạn.</p>
          </div>
        )}
      </div>

      {/* Điều khiển phân trang */}
      {totalPages > 1 && (
        <div className="pagination">
=======
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
>>>>>>> other_mvc
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1}
          >
            &laquo; Trang trước
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button 
              key={index + 1} 
              onClick={() => setCurrentPage(index + 1)}
              className={currentPage === index + 1 ? 'active' : ''}
            >
              {index + 1}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages}
          >
            Trang sau &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
