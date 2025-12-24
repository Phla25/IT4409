// frontend/src/pages/LocationDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
<<<<<<< HEAD
=======
import { 
  FaHeart, FaRegHeart, FaUtensils, FaTimes, 
  FaMapMarkerAlt, FaCamera, FaTrash // ✨ Thêm FaTrash và FaTimes
} from 'react-icons/fa';

>>>>>>> other_mvc
import API from '../api';
import AddImageModal from '../pages/AddImageModal';
import { useAuth } from '../context/AuthContext';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; 
import './LocationDetailPage.css';
<<<<<<< HEAD
import { useAuth } from '../context/AuthContext'; // ✨ THÊM DÒNG NÀY

// Fix lỗi icon của Leaflet
=======

// --- CẤU HÌNH LEAFLET ---
>>>>>>> other_mvc
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- HELPER PLACEHOLDER ---
const getPlaceholderStyle = (name) => {
  // (Giữ nguyên code cũ...)
  const gradients = ['linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', 'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)', 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'];
  let hash = 0;
  if (name) { for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return { background: gradients[Math.abs(hash) % gradients.length] };
};

const LocationDetailPage = () => {
<<<<<<< HEAD
  const { id } = useParams(); // Lấy ID từ URL
  const { search } = useLocation(); // Lấy query params từ URL (ví dụ: ?view=user)
  const navigate = useNavigate(); // Hook để điều hướng
  const [location, setLocation] = useState(null);
  const { userRole } = useAuth(); // ✨ LẤY VAI TRÒ USER

  // ✨ LOGIC MỚI: KIỂM TRA QUYỀN ADMIN VÀ CHẾ ĐỘ XEM
  const queryParams = new URLSearchParams(search);
  const isUserViewForced = queryParams.get('view') === 'user';
  const isAdmin = userRole === 'admin' && !isUserViewForced;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        // Gọi API để lấy chi tiết địa điểm theo ID
        const response = await API.get(`/locations/${id}`);
        setLocation(response.data.data);
        setError('');
      } catch (err) {
        console.error('Lỗi tải chi tiết địa điểm:', err);
        setError('Không thể tải thông tin địa điểm. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [id]); // Chạy lại effect khi ID thay đổi

  if (loading) {
    return <div className="detail-page-loading">⏳ Đang tải thông tin...</div>;
  }

  if (error) {
    return <div className="detail-page-error">❌ {error}</div>;
  }

  if (!location) {
    return <div className="detail-page-error">Không tìm thấy địa điểm.</div>;
  }

  const position = [location.latitude, location.longitude];
=======
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  // --- STATE ---
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  
  // State Modals
  const [showMenuModal, setShowMenuModal] = useState(false); 
  const [menuItems, setMenuItems] = useState([]); 
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ✨ STATE MỚI CHO LIGHTBOX (Phóng to ảnh)
  const [clickedImg, setClickedImg] = useState(null);

  // State Reviews
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- CHECK QUYỀN ---
  const isAdmin = userRole === 'admin' && queryParams.get('view') !== 'user';
  const isResident = user && userRole === 'user';
  const isUser = userRole === 'user' || queryParams.get('view') === 'user';

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const locRes = await API.get(`/locations/${id}`);
      setLocation(locRes.data.data);
      const revRes = await API.get(`/reviews`, { params: { location_id: id } });
      setReviews(revRes.data.data || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
      if (!location) setError("Không thể tải thông tin địa điểm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchData(); }, [id]);

  useEffect(() => {
    if (user && id) {
      API.get(`/favorites/check?location_id=${id}`).then(res => setIsFavorited(res.data.isFavorited)).catch(err => console.error(err));
    }
  }, [user, id]);

  // --- HANDLERS ---
  
  // ✨ HÀM XÓA ẢNH (CHO ADMIN)
  const handleDeleteImage = async (imageId, e) => {
      e.stopPropagation(); // Ngăn không cho mở Lightbox khi bấm nút xóa
      if (!window.confirm("Bạn chắc chắn muốn xóa ảnh này? Hành động này không thể hoàn tác.")) return;

      try {
          await API.delete(`/locations/images/${imageId}`);
          
          // Cập nhật UI ngay lập tức bằng cách lọc bỏ ảnh đã xóa khỏi state
          const updatedImages = location.images.filter(img => img.id !== imageId);
          setLocation({ ...location, images: updatedImages });
          alert("Đã xóa ảnh thành công!");
      } catch (err) {
          alert("Lỗi xóa ảnh: " + (err.response?.data?.message || err.message));
      }
  };

  // (Các hàm handleOpenMenu, handlePostReview, handleToggleFavorite giữ nguyên...)
  const handleOpenMenu = async () => { setShowMenuModal(true); if (menuItems.length === 0) { setLoadingMenu(true); try { const res = await API.get(`/locations/${id}/menu`); setMenuItems(res.data.data); } catch (err) { console.error(err); } finally { setLoadingMenu(false); } } };
  const handlePostReview = async (e) => { e.preventDefault(); if (!isResident) return alert("Chỉ Cư dân mới được đánh giá!"); if (!userComment.trim()) return alert("Vui lòng nhập nội dung!"); setSubmitting(true); try { await API.post('/reviews', { location_id: parseInt(id), user_id: user.id, rating: userRating, comment: userComment, review_type: 'location' }); alert("Cảm ơn đánh giá!"); setUserComment(''); setUserRating(5); fetchData(); } catch (err) { alert(err.response?.data?.message || "Lỗi gửi đánh giá."); } finally { setSubmitting(false); } };
  const handleToggleFavorite = async () => { if (!user) return alert("Vui lòng đăng nhập!"); try { setIsFavorited(!isFavorited); await API.post('/favorites/toggle', { location_id: id }); } catch (err) { setIsFavorited(!isFavorited); alert("Lỗi kết nối!"); } };
  const handleUploadSuccess = () => { fetchData(); };

  // --- RENDER ---
  if (loading) return <div className="detail-page-loading">⏳ Đang tải...</div>;
  if (error) return <div className="detail-page-error">❌ {error}</div>;
  if (!location) return null;

  const position = [location.latitude, location.longitude];
  // Ưu tiên dùng mảng 'images' nếu backend trả về đúng chuẩn mới
  const displayImages = location.images || location.gallery || [];
>>>>>>> other_mvc

  return (
    <div className="location-detail-page">
      <div className="detail-header">
<<<<<<< HEAD
        <button onClick={() => navigate(-1)} className="back-button">
          &larr; Quay lại
        </button>
        <h1>{location.name}</h1>
      </div>

=======
        <button onClick={() => navigate(-1)} className="back-button">&larr; Quay lại</button>
        <div className="title-section">
            <h1>{location.name}</h1>
            <div className="action-buttons">
                {isUser && (<button onClick={handleToggleFavorite} className={`action-btn fav-btn ${isFavorited ? 'active' : ''}`}>{isFavorited ? <FaHeart /> : <FaRegHeart />}</button>)}
                <button onClick={handleOpenMenu} className="action-btn menu-btn"><FaUtensils /> Xem thực đơn</button>
                <button onClick={() => setShowUploadModal(true)} className="action-btn upload-btn"><FaCamera /> Thêm ảnh</button>
            </div>
        </div>
      </div>

      {/* CONTENT LAYOUT */}
>>>>>>> other_mvc
      <div className="detail-content-layout">
        <div className="detail-info-panel">
          <h3>Thông tin chi tiết</h3>
          <p><strong>📍 Địa chỉ:</strong> {location.address}, {location.district}</p>
          {location.description && <p><strong>📝 Mô tả:</strong> {location.description}</p>}
<<<<<<< HEAD
          {location.phone_number && <p><strong>📞 Điện thoại:</strong> {location.phone_number}</p>}
          {(location.min_price > 0 || location.max_price > 0) && (
            <p>
              <strong>💰 Mức giá:</strong> {location.min_price.toLocaleString()} - {location.max_price.toLocaleString()} VNĐ
            </p>
          )}
          {/* ✨ CHỈ HIỂN THỊ TRẠNG THÁI CHO ADMIN */}
          {isAdmin && (
            <p>
              <strong>Trạng thái:</strong>
              <span className={`status-badge ${location.is_approved ? 'approved' : 'pending'}`}>{location.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}</span>
            </p>
          )}
        </div>

=======
          <p><strong>⭐ Đánh giá:</strong> {location.average_rating ? Number(location.average_rating).toFixed(1) : 'Chưa có'} ({location.review_count || 0} lượt)</p>
          <p><strong>💰 Khoảng giá:</strong> {location.min_price?.toLocaleString()}đ - {location.max_price?.toLocaleString()}đ</p>
          {isAdmin && (<p style={{marginTop: 15}}><strong>Trạng thái:</strong> <span className={`status-badge ${location.is_approved ? 'approved' : 'pending'}`}>{location.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}</span></p>)}

          {/* ✨ MỤC HÌNH ẢNH - CÓ PHÓNG TO VÀ NÚT XÓA */}
          {displayImages.length > 0 && (
            <div className="detail-gallery-section">
                <h4>📷 Hình ảnh ({displayImages.length})</h4>
                <div className="image-gallery-container">
                    {displayImages.map((image, index) => {
                        const imgSrc = image.url || image; // Hỗ trợ cả object hoặc string url
                        const imgId = image.id; // Cần ID để xóa

                        return (
                          <div 
                            key={imgId || index} 
                            className="gallery-img-wrapper"
                            onClick={() => setClickedImg(imgSrc)} // ✨ Bấm vào wrapper để phóng to
                            style={{cursor: 'pointer'}}
                          >
                              <img 
                                  src={imgSrc} alt={`Ảnh ${index}`} className="gallery-image"
                                  onError={(e) => { e.target.style.display = 'none'; if(e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                              />
                              <div className="gallery-placeholder" style={{...getPlaceholderStyle(location.name), display: 'none'}}>{location.name.charAt(0).toUpperCase()}</div>
                              
                              {/* ✨ NÚT XÓA ẢNH (Chỉ Admin thấy) */}
                              {isAdmin && imgId && (
                                <button 
                                    className="btn-delete-image" 
                                    onClick={(e) => handleDeleteImage(imgId, e)}
                                    title="Xóa ảnh này"
                                >
                                    <FaTrash />
                                </button>
                              )}
                          </div>
                        );
                    })}
                </div>
            </div>
          )}
        </div>
        
        {/* MAP */}
>>>>>>> other_mvc
        <div className="detail-map-panel">
          <MapContainer center={position} zoom={16} scrollWheelZoom={false} className="detail-map">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution="Google Maps"
            />
            <Marker position={position}>
              <Popup>{location.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

<<<<<<< HEAD
          {/* ✨ MỤC HÌNH ẢNH CỦA QUÁN */}
          {location.images && location.images.length > 0 && (
            <div className="detail-section">
              <h4>📷 Hình ảnh</h4>
              <div className="image-gallery-container">
                {location.images.map((image, index) => (
                  <a key={image.id || index} href={image.url} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={image.url} 
                      alt={`${location.name} - ảnh ${index + 1}`} 
                      className="gallery-image" 
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ✨ MỤC THỰC ĐƠN CÁC MÓN ĂN */}
          {location.menu && location.menu.length > 0 && (
            <div className="detail-section">
              <h4>📜 Thực đơn</h4>
              <ul className="menu-list">
                {location.menu.map((item, index) => (
                  <li key={index} className="menu-item">
                    <span className="menu-item-name">{item.name}</span>
                    <span className="menu-item-price">{item.price.toLocaleString()} VNĐ</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      {/* =========================================
          PHẦN ĐÁNH GIÁ CỦA KHÁCH HÀNG
          ========================================= */}
      <div className="detail-section reviews-section">
        <h4>⭐ Đánh giá từ cộng đồng</h4>
        <div className="review-summary">
          <span className="avg-rating">{location.average_rating ? Number(location.average_rating).toFixed(1) : 'Chưa có'}</span>
          <span className="review-count">({location.review_count || 0} lượt đánh giá)</span>
        </div>
        {/* TODO: Thêm form gửi review và danh sách review ở đây */}
      </div>
=======
      {/* REVIEWS SECTION (Giữ nguyên code cũ...) */}
      <div className="reviews-section">
        <h4>⭐ Đánh giá từ cộng đồng ({reviews.length})</h4>
        {isResident ? (
          <form className="review-form" onSubmit={handlePostReview}>
            <div className="rating-select">{[1, 2, 3, 4, 5].map(star => (<span key={star} className={`star ${star <= userRating ? 'active' : ''}`} onClick={() => setUserRating(star)}>★</span>))}<span className="rating-text">({userRating} sao)</span></div>
            <textarea className="review-textarea" placeholder="Chia sẻ trải nghiệm..." value={userComment} onChange={e => setUserComment(e.target.value)} />
            <button type="submit" className="btn-submit-review" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
          </form>
        ) : (<div className="login-prompt">{userRole === 'admin' ? "⚠️ Admin không thể đánh giá." : "Vui lòng đăng nhập Cư dân để đánh giá."}</div>)}
        <div className="review-list">{reviews.length === 0 ? <p className="no-reviews">Chưa có đánh giá.</p> : reviews.map((rev) => (<div key={rev.id} className="review-item"><div className="review-header"><div className="reviewer-info"><div className="reviewer-avatar"><div className="reviewer-placeholder" style={getPlaceholderStyle(rev.authorName)}>{rev.authorName?.charAt(0).toUpperCase()}</div></div><div><div className="reviewer-name">{rev.authorName}</div><div className="review-date">{rev.timeAgo}</div></div></div><div className="review-rating">{"⭐".repeat(rev.rating)}</div></div><div className="review-comment">{rev.comment}</div></div>))}</div>
      </div>

      {/* MODALS (Menu & Upload giữ nguyên) */}
      {showMenuModal && (<div className="menu-modal-overlay" onClick={() => setShowMenuModal(false)}><div className="menu-modal-content" onClick={(e) => e.stopPropagation()}><div className="menu-modal-header"><h2>📜 Thực đơn: {location.name}</h2><button className="close-modal-btn" onClick={() => setShowMenuModal(false)}><FaTimes /></button></div><div className="menu-modal-body">{loadingMenu ? (<div className="menu-loading">⏳ Tải menu...</div>) : menuItems.length === 0 ? (<div className="menu-empty">Chưa có menu.</div>) : (<div className="menu-grid-display">{menuItems.map((item) => (<div key={item.id} className="menu-item-display"><div className="menu-item-info"><h4>{item.custom_name || item.base_dish_name}</h4><p className="menu-desc">{item.description}</p></div><div className="menu-item-price">{Number(item.price).toLocaleString()}đ</div></div>))}</div>)}</div></div></div>)}
      {showUploadModal && (<AddImageModal locationId={id} onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />)}

      {/* ✨ LIGHTBOX MODAL (Phóng to ảnh) */}
      {clickedImg && (
        <div className="lightbox-overlay" onClick={() => setClickedImg(null)}>
            <span className="lightbox-close" onClick={() => setClickedImg(null)}>
                <FaTimes />
            </span>
            <img src={clickedImg} alt="Full screen" className="lightbox-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

>>>>>>> other_mvc
    </div>
  );
};

export default LocationDetailPage;