// frontend/src/MapContainer.js (Cập nhật logic)
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import useGeolocation from './hooks/useGeolocation'; 
import 'leaflet/dist/leaflet.css'; // Đảm bảo đã import CSS

// Import icon Leaflet mặc định (để tránh lỗi hình ảnh)
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ... (các hằng số, Component ChangeView, và code khác giữ nguyên) ...

const hanoiPosition = [21.028511, 105.854199];
const INITIAL_ZOOM = 12;

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const LeafletMapComponent = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userLocation = useGeolocation();
  const [mapCenter, setMapCenter] = useState(hanoiPosition);

  // --- Hàm Debounce (Đơn giản) ---
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // --- Hàm gọi API Backend (Đã được Debounce) ---
  const debouncedFetchNearby = useCallback(
    debounce(async (lat, lng) => {
      try {
        setLoading(true);
        const radiusKm = 5; 
        console.log(`[API Call] Searching for nearby locations at Lat: ${lat}, Lng: ${lng}`);

        const response = await axios.get(
          `http://localhost:5000/api/locations/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
        );
        
        setLocations(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy địa điểm gần đây:", err);
        setError("Lỗi tải dữ liệu địa điểm gần bạn.");
        setLoading(false);
      }
    }, 1500), // <-- CHỈ GỌI API SAU KHI VỊ TRÍ ỔN ĐỊNH TRONG 1.5 GIÂY
    [] 
  );

  // 1. useEffect theo dõi vị trí và kích hoạt tìm kiếm
  useEffect(() => {
    if (userLocation.loaded) {
      if (userLocation.coordinates.lat) {
        const { lat, lng } = userLocation.coordinates;
        setMapCenter([lat, lng]); // Di chuyển bản đồ đến vị trí mới
        debouncedFetchNearby(lat, lng); // Kích hoạt tìm kiếm (có Debounce)
      } else {
        // Vị trí không lấy được (người dùng từ chối hoặc lỗi)
        setLoading(false);
        setError(`Vị trí không xác định. ${userLocation.error || "Hiển thị Hà Nội mặc định."}`);
        // Có thể thêm logic gọi API /api/locations để hiển thị tất cả quán ở đây
      }
    }
  }, [userLocation.loaded, userLocation.coordinates.lat, userLocation.coordinates.lng, debouncedFetchNearby]); // Phụ thuộc vào tọa độ

  
  // Hiển thị trạng thái
  if (loading) return <p>Đang chờ vị trí người dùng và tải dữ liệu...</p>;

  // 2. Render Bản đồ Leaflet
  return (
    <div style={{ height: '800px', width: '100%' }}>
      {error && <p style={{ color: 'red', padding: '10px' }}>{error}</p>}
      <MapContainer 
        center={mapCenter} 
        zoom={INITIAL_ZOOM} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={mapCenter} zoom={INITIAL_ZOOM} /> 
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marker Vị trí Người dùng */}
        {userLocation.coordinates.lat && (
          <Marker position={[userLocation.coordinates.lat, userLocation.coordinates.lng]}>
              <Popup>Vị trí hiện tại của bạn.</Popup>
          </Marker>
        )}

        {/* Marker Địa điểm Gần đó */}
        {locations.map((loc) => {
          const lat = parseFloat(loc.latitude);
          const lng = parseFloat(loc.longitude);
          
          if (isNaN(lat) || isNaN(lng)) return null; 

          return (
            <Marker 
              key={loc.id} 
              position={[lat, lng]} 
              title={loc.name}
            >
              <Popup>
                <strong>{loc.name}</strong>
                <br/>
                Khoảng cách: {loc.distance_km.toFixed(2)} km
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMapComponent;