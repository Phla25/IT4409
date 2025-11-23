import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import API from '../api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; 
import './LocationDetailPage.css';
import { useAuth } from '../context/AuthContext'; // ✨ THÊM DÒNG NÀY

// Fix lỗi icon của Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LocationDetailPage = () => {
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

  return (
    <div className="location-detail-page">
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          &larr; Quay lại
        </button>
        <h1>{location.name}</h1>
      </div>

      <div className="detail-content-layout">
        <div className="detail-info-panel">
          <h3>Thông tin chi tiết</h3>
          <p><strong>📍 Địa chỉ:</strong> {location.address}, {location.district}</p>
          {location.description && <p><strong>📝 Mô tả:</strong> {location.description}</p>}
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
    </div>
  );
};

export default LocationDetailPage;