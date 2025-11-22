import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import API from './api'; // Dùng instance API chung
import useGeolocation from './hooks/useGeolocation'; // Giữ nguyên file hook của bạn
import { useAuth } from './context/AuthContext';
import { calculateDistance } from './utils/distance';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const hanoiPosition = [21.028511, 105.854199];

const LeafletMapComponent = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [locations, setLocations] = useState([]);
  const [isAdminMode, setIsAdminMode] = useState(false); // Chế độ xem của Admin
  const [radius, setRadius] = useState(5); // Bán kính tìm kiếm (km)

  const userLocation = useGeolocation();
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Khi role thay đổi, cập nhật chế độ
  useEffect(() => {
    setIsAdminMode(isAdmin);
  }, [isAdmin]);

  // Hàm fetch dữ liệu
  const fetchLocations = async () => {
    try {
      let url = '/locations'; // Mặc định lấy list public
      
      if (isAdminMode) {
        // Admin: Lấy danh sách quản trị (bao gồm chưa duyệt)
        url = '/locations/admin/all';
      } else if (userLocation.loaded && userLocation.coordinates.lat) {
        // User/Guest: Lấy theo bán kính gần đây
        const { lat, lng } = userLocation.coordinates;
        url = `/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      }

      const res = await API.get(url);
      setLocations(res.data.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // Gọi API khi dependency thay đổi
  useEffect(() => {
    // Nếu là Admin mode -> gọi luôn
    // Nếu là User mode -> chờ có vị trí mới gọi
    if (isAdminMode || (userLocation.loaded && !userLocation.error)) {
      fetchLocations();
    }
  }, [isAdminMode, userLocation.loaded, radius]);

  return (
    <div style={{ position: 'relative', height: '80vh', width: '100%' }}>
      
      {/* Panel điều khiển (Filter Radius) */}
      {!isAdminMode && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'white', padding: 10, borderRadius: 5 }}>
          <label>Tìm bán kính: {radius} km</label>
          <input 
            type="range" min="1" max="20" value={radius} 
            onChange={(e) => setRadius(e.target.value)} 
          />
        </div>
      )}

      {/* Nút Toggle Admin Mode */}
      {isAdmin && (
        <button
          onClick={() => setIsAdminMode(!isAdminMode)}
          class = "btn"
          style={{ position: 'absolute', top: 100, right: 10, zIndex: 1000, padding: '5px 10px' }}
        >
          {isAdminMode ? "Switch to User View" : "Switch to Admin View"}
        </button>
      )}

      <MapContainer center={hanoiPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="Google Maps" />

        {/* Marker vị trí người dùng */}
        {userLocation.coordinates.lat && (
          <>
            <Marker position={[userLocation.coordinates.lat, userLocation.coordinates.lng]}>
              <Popup>Bạn đang ở đây</Popup>
            </Marker>
            <Circle center={[userLocation.coordinates.lat, userLocation.coordinates.lng]} radius={radius * 1000} />
          </>
        )}

        {/* Marker các địa điểm */}
        {locations.map(loc => (
          <Marker 
            key={loc.id} 
            position={[loc.latitude, loc.longitude]}
            eventHandlers={{ click: () => setSelectedLocation(loc) }}
          >
            <Popup>
               <b>{loc.name}</b> <br/>
               {loc.address} <br/>
               {isAdminMode && (loc.is_approved ? "✅ Đã duyệt" : "❌ Chưa duyệt")}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMapComponent;