import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './FavoriteLocationsPage.css'; 
import { FaTrash, FaStar, FaMapMarkerAlt } from 'react-icons/fa'; 

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

  return (
    // ✨ Container chính luôn bao bọc toàn bộ nội dung
    <div className="favorites-page-container">
      <div className="fav-header">
        <h2>❤️ Địa điểm yêu thích</h2>
        <p>Danh sách các quán bạn đã lưu lại</p>
      </div>
      
      {/* ✨ LOGIC HIỂN THỊ MỚI */}
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
          {favorites.map(loc => (
            <div 
                key={loc.id} 
                className="fav-card" 
                onClick={() => navigate(`/locations/${loc.id}`)}
            >
              <div className="fav-card-img-wrapper">
                 {loc.image ? (
                    <img src={loc.image} alt={loc.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                 ) : (
                    <div className="fav-img-placeholder">{loc.name.charAt(0).toUpperCase()}</div>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteLocationsPage;