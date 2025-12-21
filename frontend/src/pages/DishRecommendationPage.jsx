import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../hooks/useGeolocation';
import './DishRecommendationPage.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DishRecommendationPage = () => {
  const userLocation = useGeolocation();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Chỉ gọi API khi đã có vị trí
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

  // Xử lý tiêu đề dựa trên thời tiết
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
      {/* Header của trang */}
      <div className="dish-page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Quay lại
        </button>
        <div className="header-content">
          <h2>{title}</h2>
          <p>{subTitle}</p>
        </div>
      </div>

      {/* Trạng thái Loading / Lỗi */}
      {loading && <div className="page-loading">⏳ Đang phân tích thời tiết...</div>}
      
      {!loading && userLocation.error && (
        <div className="page-error">⚠️ Không thể xác định vị trí để gợi ý món ăn.</div>
      )}

      {/* Grid danh sách món ăn */}
      {recommendations && (
        <div className="dish-grid">
          {recommendations.data.map((dish) => (
            <div 
              key={dish.id} 
              className="dish-card-large"
              onClick={() => navigate(`/locations/${dish.location_id}`)}
            >
              <div className="dish-card-img">
                <img 
                  src={dish.dish_image || 'https://via.placeholder.com/300x200?text=Món+ngon'} 
                  alt={dish.dish_name} 
                />
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