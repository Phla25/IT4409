import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './FavoriteLocationsPage.css'; 
import { FaTrash, FaStar, FaMapMarkerAlt } from 'react-icons/fa'; 

// Hàm helper: Tạo màu gradient ngẫu nhiên (Đồng bộ style với các trang khác)
const getPlaceholderStyle = (name) => {
  const gradients = [
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)', // Hồng
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Tím nhạt
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // Xanh mint
    'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', // Xanh tím
    'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)', // Đỏ hồng
    'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', // Cam vàng
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' // Tím đậm
  ];
  
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const index = Math.abs(hash) % gradients.length;
  
  return { background: gradients[index] };
};

const FavoriteLocationsPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await API.get('/favorites');
        setFavorites(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemove = async (e, locationId) => {
    e.stopPropagation(); 
    if(!window.confirm("Bạn muốn xóa địa điểm này khỏi danh sách?")) return;

    try {
      await API.post('/favorites/toggle', { location_id: locationId });
      setFavorites(favorites.filter(loc => loc.id !== locationId));
    } catch (err) {
      alert("Lỗi khi xóa!");
    }
  };

  // Helper để lấy URL ảnh an toàn (tương tự LocationListPage)
  const getLocationImage = (loc) => {
      // Ưu tiên ảnh đầu tiên trong mảng images nếu có
      if (loc.images && loc.images.length > 0) {
          if (typeof loc.images[0] === 'string') return loc.images[0];
          if (loc.images[0].url) return loc.images[0].url;
      }
      // Nếu có trường image riêng lẻ (fallback)
      if (loc.image) return loc.image;
      
      return null;
  };

  return (
    <div className="favorites-page-container">
      <div className="fav-header">
        <h2>❤️ Địa điểm yêu thích</h2>
        <p>Danh sách các quán bạn đã lưu lại</p>
      </div>
      
      {loading ? (
        <div className="fav-loading">
            <div className="spinner"></div>
            <p>Đang tải danh sách...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="fav-empty">
          <p>Bạn chưa lưu địa điểm nào.</p>
          <button className="btn-explore" onClick={() => navigate('/')}>Khám phá ngay</button>
        </div>
      ) : (
        <div className="fav-grid">
          {favorites.map(loc => {
            const imageUrl = getLocationImage(loc);
            return (
              <div 
                  key={loc.id} 
                  className="fav-card" 
                  onClick={() => navigate(`/locations/${loc.id}`)}
              >
                <div className="fav-card-img-wrapper">
                  {/* Logic hiển thị ảnh hoặc chữ cái đầu */}
                  {imageUrl ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt={loc.name} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling && e.target.nextSibling.classList.contains('fallback')) {
                              e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                      {/* Fallback placeholder (ẩn mặc định, hiện khi img lỗi) */}
                      <div className="fav-img-placeholder fallback" style={{...getPlaceholderStyle(loc.name), display: 'none'}}>
                        {loc.name.charAt(0).toUpperCase()}
                      </div>
                    </>
                  ) : (
                    // Placeholder chính khi không có URL ảnh
                    <div className="fav-img-placeholder" style={getPlaceholderStyle(loc.name)}>
                      {loc.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {loc.district && <div className="fav-badge">{loc.district}</div>}
                </div>

                <div className="fav-card-body">
                  <h3 className="fav-title">{loc.name}</h3>
                  
                  <p className="fav-address">
                      <FaMapMarkerAlt /> {loc.address}
                  </p>
                  
                  <div className="fav-footer">
                    <div className="fav-rating">
                        <FaStar color="#f1c40f" />
                        <span>{loc.average_rating ? Number(loc.average_rating).toFixed(1) : 'N/A'}</span>
                        <span className="fav-count">({loc.review_count || 0})</span>
                    </div>
                    
                    <button 
                        className="btn-remove-fav" 
                        onClick={(e) => handleRemove(e, loc.id)}
                        title="Xóa khỏi yêu thích"
                    >
                        <FaTrash /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FavoriteLocationsPage;