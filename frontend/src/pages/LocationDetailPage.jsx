import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import API from '../api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; 
import './LocationDetailPage.css';
import { useAuth } from '../context/AuthContext';

// Fix icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LocationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth(); // Lấy thông tin user đăng nhập

  // --- LOGIC PHÂN QUYỀN CƯ DÂN ---
  const isResident = user && userRole === 'user';
  const [isFavorited, setIsFavorited] = useState(false);
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]); // Chứa danh sách ReviewDTO
  
  // Form State
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin view check
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isAdmin = userRole === 'admin' && queryParams.get('view') !== 'user';

  // --- FETCH DỮ LIỆU ---
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Lấy thông tin địa điểm
        const locRes = await API.get(`/locations/${id}`);
        setLocation(locRes.data.data);

        // 2. Lấy danh sách đánh giá (API trả về ReviewDTO)
        const revRes = await API.get(`/reviews`, { params: { location_id: id } });
        setReviews(revRes.data.data || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        if (!location) setError("Không thể tải thông tin địa điểm.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  // --- KIỂM TRA YÊU THÍCH ---
  useEffect(() => {
    if (user && id) {
      API.get(`/favorites/check?location_id=${id}`)
         .then(res => setIsFavorited(res.data.isFavorited))
         .catch(err => console.error(err));
    }
  }, [user, id]);

  // --- XỬ LÝ GỬI ĐÁNH GIÁ ---
  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!isResident) return alert("Chỉ Cư dân mới được đánh giá!");
    if (!userComment.trim()) return alert("Vui lòng nhập nội dung!");

    setSubmitting(true);
    try {
      const payload = {
        location_id: parseInt(id),
        user_id: user.id,
        rating: userRating,
        comment: userComment,
        review_type: 'location'
      };

      await API.post('/reviews', payload);
      
      alert("Cảm ơn bạn đã đánh giá!");
      setUserComment('');
      setUserRating(5);
      
      // Refresh lại danh sách review
      const res = await API.get(`/reviews`, { params: { location_id: id } });
      setReviews(res.data.data || []);
      
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi gửi đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };
  // Hàm xử lý bấm tim
  const handleToggleFavorite = async () => {
    if (!user) return alert("Vui lòng đăng nhập để lưu địa điểm!");
    
    try {
      // UI Optimistic Update (Đổi màu ngay lập tức cho mượt)
      const newStatus = !isFavorited;
      setIsFavorited(newStatus);

      await API.post('/favorites/toggle', { location_id: id });
    } catch (err) {
      console.error(err);
      setIsFavorited(!isFavorited); // Revert nếu lỗi
      alert("Lỗi kết nối!");
    }
  };

  if (loading) return <div className="detail-page-loading">⏳ Đang tải...</div>;
  if (error) return <div className="detail-page-error">❌ {error}</div>;
  if (!location) return null;

  const position = [location.latitude, location.longitude];
  const renderStars = (n) => "⭐".repeat(n);

  return (
    <div className="location-detail-page">
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-button">&larr; Quay lại</button>
        <div className="title-section" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1>{location.name}</h1>
            <button 
                onClick={handleToggleFavorite}
                className={`favorite-btn ${isFavorited ? 'active' : ''}`}
                title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            >
                {isFavorited ? <FaHeart color="#e74c3c" /> : <FaRegHeart color="#95a5a6" />}
            </button>
        </div>
      </div>

      {/* Layout Thông tin & Map */}
      <div className="detail-content-layout">
        <div className="detail-info-panel">
          <h3>Thông tin chi tiết</h3>
          <p><strong>📍 Địa chỉ:</strong> {location.address}, {location.district}</p>
          {location.description && <p><strong>📝 Mô tả:</strong> {location.description}</p>}
          <p>
              <strong>⭐ Đánh giá:</strong> {location.average_rating ? Number(location.average_rating).toFixed(1) : 'Chưa có'} 
              {' '}({location.review_count || 0} lượt)
          </p>
          {isAdmin && (
            <p>
              <strong>Trạng thái:</strong> <span className={`status-badge ${location.is_approved ? 'approved' : 'pending'}`}>{location.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}</span>
            </p>
          )}
        </div>
        <div className="detail-map-panel">
          <MapContainer center={position} zoom={16} scrollWheelZoom={false} className="detail-map">
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="Google Maps" />
            <Marker position={position}><Popup>{location.name}</Popup></Marker>
          </MapContainer>
        </div>
      </div>

      {/* --- PHẦN ĐÁNH GIÁ (REVIEWS) --- */}
      <div className="detail-section reviews-section">
        <h4>⭐ Đánh giá từ cộng đồng ({reviews.length})</h4>

        {/* Form nhập liệu (Chỉ hiện cho Resident) */}
        {isResident ? (
          <form className="review-form" onSubmit={handlePostReview}>
            <div className="rating-select">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={`star ${star <= userRating ? 'active' : ''}`} onClick={() => setUserRating(star)}>★</span>
              ))}
              <span className="rating-text">({userRating} sao)</span>
            </div>
            <textarea 
              className="review-textarea" 
              placeholder="Chia sẻ trải nghiệm của bạn..." 
              value={userComment} 
              onChange={e => setUserComment(e.target.value)} 
            />
            <button type="submit" className="btn-submit-review" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        ) : (
          <div className="login-prompt">
            {userRole === 'admin' ? "⚠️ Quản trị viên không thể đánh giá." : "Vui lòng đăng nhập tài khoản Cư dân để đánh giá."}
          </div>
        )}

        {/* Danh sách hiển thị (Dùng trường dữ liệu từ DTO) */}
        <div className="review-list">
          {reviews.length === 0 ? <p className="no-reviews">Chưa có đánh giá nào.</p> : reviews.map((rev) => (
            <div key={rev.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  {/* Hiển thị Avatar nếu có */}
                  <div className="reviewer-avatar">
                    {rev.authorAvatar ? <img src={rev.authorAvatar} alt="avatar" /> : rev.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {/* Dùng authorName từ DTO */}
                    <div className="reviewer-name">{rev.authorName}</div>
                    {/* Dùng timeAgo từ DTO */}
                    <div className="review-date">{rev.timeAgo}</div>
                  </div>
                </div>
                <div className="review-rating">{renderStars(rev.rating)}</div>
              </div>
              <div className="review-comment">{rev.comment}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationDetailPage;