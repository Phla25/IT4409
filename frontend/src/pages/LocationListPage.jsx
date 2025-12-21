import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import useGeolocation from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/distance';
import './LocationListPage.css';

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
