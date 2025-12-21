import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../hooks/useGeolocation';
import './DishRecommendationPage.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Hàm helper: Tạo màu gradient ngẫu nhiên dựa trên tên món
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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  
  return { background: gradients[index] };
};

const DishRecommendationPage = () => {
  const userLocation = useGeolocation();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLocation.loaded && !userLocation.error) {
      fetchDishes();
    } else if (userLocation.error) {
      setLoading(false);
    }
  }, [userLocation.loaded, userLocation.error]);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const { lat, lng } = userLocation.coordinates;
      const res = await axios.get(`${API_BASE}/locations/recommendations/dishes?lat=${lat}&lng=${lng}`);
      if (res.data.success) {
        setRecommendations(res.data);
      }
    } catch (err) {
      console.error("Lỗi lấy món ăn:", err);
    } finally {
      setLoading(false);
    }
  };

  let title = "Gợi ý hôm nay";
  let subTitle = "Món ngon dành cho bạn";
  
  if (recommendations && recommendations.weather) {
    const { temp } = recommendations.weather;
    if (temp < 18) {
      title = `Trời lạnh ${temp}°C ❄️`;
      subTitle = "Làm ngay món nóng hổi cho ấm bụng nhé!";
    } else if (temp > 28) {
      title = `Trời nóng ${temp}°C ☀️`;
      subTitle = "Giải nhiệt ngay với các món mát lạnh!";
    } else {
      title = `Thời tiết đẹp ${temp}°C 🌤️`;
      subTitle = "Hôm nay bạn muốn ăn gì?";
    }
  }

  return (
    <div className="dish-page-container">
      <div className="dish-page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Quay lại
        </button>
        <div className="header-content">
          <h2>{title}</h2>
          <p>{subTitle}</p>
        </div>
      </div>

      {loading && <div className="page-loading">⏳ Đang phân tích thời tiết...</div>}
      
      {!loading && userLocation.error && (
        <div className="page-error">⚠️ Không thể xác định vị trí để gợi ý món ăn.</div>
      )}

      {recommendations && (
        <div className="dish-grid">
          {recommendations.data.map((dish) => (
            <div 
              key={dish.id} 
              className="dish-card-large"
              onClick={() => navigate(`/locations/${dish.location_id}`)}
            >
              <div className="dish-card-img">
                {/* Logic hiển thị ảnh hoặc chữ cái đầu */}
                {dish.dish_image ? (
                  <>
                    <img 
                      src={dish.dish_image} 
                      alt={dish.dish_name} 
                      onError={(e) => {
                         // Nếu ảnh lỗi, ẩn ảnh đi và hiện placeholder kế tiếp
                         e.target.style.display = 'none';
                         e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Placeholder ẩn (Fallback) dùng khi ảnh lỗi */}
                    <div className="dish-placeholder fallback" style={{...getPlaceholderStyle(dish.dish_name), display: 'none'}}>
                      {dish.dish_name.charAt(0).toUpperCase()}
                    </div>
                  </>
                ) : (
                  // Placeholder chính khi không có URL ảnh
                  <div className="dish-placeholder" style={getPlaceholderStyle(dish.dish_name)}>
                    {dish.dish_name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <span className="price-tag">{parseInt(dish.price).toLocaleString()}đ</span>
              </div>
              
              <div className="dish-card-body">
                <h3>{dish.dish_name}</h3>
                <p className="restaurant-name">🏠 {dish.restaurant_name}</p>
                <p className="dish-address">📍 {dish.address}</p>
                <button className="view-btn">Xem quán</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DishRecommendationPage;