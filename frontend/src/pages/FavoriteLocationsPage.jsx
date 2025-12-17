import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './FavoriteLocationsPage.css'; 

// Import icon nếu bạn đã cài (npm install react-icons)
// Nếu chưa cài thì có thể bỏ qua và dùng text thường, nhưng CSS đang viết cho icon
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

  if (loading) return <div className="fav-empty" style={{marginTop: 50}}>⏳ Đang tải...</div>;

  return (
    // 1. Sửa className khớp với CSS: favorites-page-container
    <div className="favorites-page-container">
      <div className="fav-header">
        <h2>❤️ Địa điểm yêu thích</h2>
        <p>Danh sách các quán bạn đã lưu lại</p>
      </div>
      
      {favorites.length === 0 ? (
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
                // 2. QUAN TRỌNG: Sửa đường dẫn thành số nhiều 'locations' khớp với App.js
                onClick={() => navigate(`/locations/${loc.id}`)}
            >
              {/* 3. Sửa className khớp CSS: fav-card-img-wrapper */}
              <div className="fav-card-img-wrapper">
                 <div className="fav-img-placeholder">{loc.name.charAt(0).toUpperCase()}</div>
                 {/* Thêm badge nếu muốn giống CSS */}
                 {loc.district && <div className="fav-badge">{loc.district}</div>}
              </div>

              <div className="fav-card-body">
                {/* 4. Thêm class fav-title */}
                <h3 className="fav-title">{loc.name}</h3>
                
                {/* 5. Thêm class fav-address và icon */}
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