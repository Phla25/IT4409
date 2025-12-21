import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FaHeart, FaRegHeart, FaUtensils, FaTimes, FaMapMarkerAlt, FaStar, FaTrash } from 'react-icons/fa';
import API from '../api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; 
import './LocationDetailPage.css';
import { useAuth } from '../context/AuthContext';

// Fix icon Leaflet bị lỗi mặc định
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Hàm helper: Tạo màu gradient ngẫu nhiên dựa trên tên
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

const LocationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth(); // Lấy thông tin user đăng nhập

  // --- LOGIC PHÂN QUYỀN ---
  const isResident = user && userRole === 'user';
  
  // State cơ bản
  const [isFavorited, setIsFavorited] = useState(false);
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]); 
  
  // State cho Menu Modal
  const [showMenuModal, setShowMenuModal] = useState(false); 
  const [menuItems, setMenuItems] = useState([]); 
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Form State (Review)
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check quyền Admin (có thể view như user nếu muốn test)
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isAdmin = userRole === 'admin' && queryParams.get('view') !== 'user';
  const isUser = userRole === 'user' || queryParams.get('view') === 'user';

  // --- FETCH DỮ LIỆU ---
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Lấy thông tin địa điểm
        const locRes = await API.get(`/locations/${id}`);
        setLocation(locRes.data.data);

        // 2. Lấy danh sách đánh giá
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

  // --- XỬ LÝ MENU (THỰC ĐƠN) ---
  const handleOpenMenu = async () => {
    setShowMenuModal(true);
    // Chỉ gọi API nếu chưa có dữ liệu menu
    if (menuItems.length === 0) {
        setLoadingMenu(true);
        try {
            const res = await API.get(`/locations/${id}/menu`);
            setMenuItems(res.data.data);
        } catch (err) {
            console.error("Lỗi tải menu:", err);
        } finally {
            setLoadingMenu(false);
        }
    }
  };

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
      {/* HEADER */}
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-button">&larr; Quay lại</button>
        
        <div className="title-section" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <h1>{location.name}</h1>
            
            {/* CỤM NÚT TÁC VỤ (Action Buttons) */}
            <div className="action-buttons">
                {/* Nút Yêu thích */}
                {isUser && (<button 
                    onClick={handleToggleFavorite}
                    className={`action-btn fav-btn ${isFavorited ? 'active' : ''}`}
                    title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                    {isFavorited ? <FaHeart /> : <FaRegHeart />}
                </button>)}

                {/* Nút Xem Menu */}
                <button onClick={handleOpenMenu} className="action-btn menu-btn">
                    <FaUtensils /> Xem thực đơn
                </button>

            </div>
        </div>
      </div>

      {/* LAYOUT CHÍNH: THÔNG TIN & MAP */}
      <div className="detail-content-layout">
        <div className="detail-info-panel">
          <h3>Thông tin chi tiết</h3>
          <p><strong>📍 Địa chỉ:</strong> {location.address}, {location.district}</p>
          {location.description && <p><strong>📝 Mô tả:</strong> {location.description}</p>}
          <p>
              <strong>⭐ Đánh giá:</strong> {location.average_rating ? Number(location.average_rating).toFixed(1) : 'Chưa có'} 
              {' '}({location.review_count || 0} lượt)
          </p>
          <p><strong>💰 Khoảng giá:</strong> {location.min_price?.toLocaleString()}đ - {location.max_price?.toLocaleString()}đ</p>
          
          {isAdmin && (
            <p style={{marginTop: 15}}>
              <strong>Trạng thái:</strong> <span className={`status-badge ${location.is_approved ? 'approved' : 'pending'}`}>{location.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}</span>
            </p>
          )}

          {/* ✨ MỤC HÌNH ẢNH (GALLERY) */}
          {location.images && location.images.length > 0 && (
            <div className="detail-gallery-section">
                <h4>📷 Hình ảnh</h4>
                <div className="image-gallery-container">
                    {location.images.map((image, index) => (
                        <div key={image.id || index} className="gallery-img-wrapper">
                            <img 
                                src={image.url} 
                                alt={`${location.name} - ${index + 1}`} 
                                className="gallery-image"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    if(e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            {/* Placeholder fallback cho gallery */}
                            <div className="gallery-placeholder" style={{...getPlaceholderStyle(location.name), display: 'none'}}>
                                {location.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
        
        <div className="detail-map-panel">
          <MapContainer center={position} zoom={16} scrollWheelZoom={false} className="detail-map">
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="Google Maps" />
            <Marker position={position}><Popup>{location.name}</Popup></Marker>
          </MapContainer>
        </div>
      </div>

      {/* PHẦN ĐÁNH GIÁ (REVIEWS) */}
      <div className="detail-section reviews-section">
        <h4>⭐ Đánh giá từ cộng đồng ({reviews.length})</h4>

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

        <div className="review-list">
          {reviews.length === 0 ? <p className="no-reviews">Chưa có đánh giá nào.</p> : reviews.map((rev) => (
            <div key={rev.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {/* Logic hiển thị Avatar: Ảnh -> Placeholder chữ cái */}
                    {rev.authorAvatar ? (
                        <>
                            <img 
                                src={rev.authorAvatar} 
                                alt="avatar" 
                                className="reviewer-avatar-img"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    if(e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="reviewer-placeholder" style={{...getPlaceholderStyle(rev.authorName), display: 'none'}}>
                                {rev.authorName.charAt(0).toUpperCase()}
                            </div>
                        </>
                    ) : (
                        <div className="reviewer-placeholder" style={getPlaceholderStyle(rev.authorName)}>
                            {rev.authorName.charAt(0).toUpperCase()}
                        </div>
                    )}
                  </div>
                  <div>
                    <div className="reviewer-name">{rev.authorName}</div>
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

      {/* ✨ MODAL HIỂN THỊ MENU */}
      {showMenuModal && (
        <div className="menu-modal-overlay" onClick={() => setShowMenuModal(false)}>
            <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="menu-modal-header">
                    <h2>📜 Thực đơn: {location.name}</h2>
                    <button className="close-modal-btn" onClick={() => setShowMenuModal(false)}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className="menu-modal-body">
                    {loadingMenu ? (
                        <div className="menu-loading">⏳ Đang tải món ăn...</div>
                    ) : menuItems.length === 0 ? (
                        <div className="menu-empty">Quán chưa cập nhật thực đơn.</div>
                    ) : (
                        <div className="menu-grid-display">
                            {menuItems.map((item) => (
                                <div key={item.id} className="menu-item-display">
                                    <div className="menu-item-info">
                                        <h4>{item.custom_name || item.base_dish_name}</h4>
                                        <p className="menu-desc">{item.description}</p>
                                    </div>
                                    <div className="menu-item-price">
                                        {Number(item.price).toLocaleString()}đ
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default LocationDetailPage;