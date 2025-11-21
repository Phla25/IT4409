import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import axios from 'axios';

// 🛠️ Import đúng đường dẫn
import useGeolocation from './hooks/useGeolocation'; 
import { useAuth } from './context/AuthContext';
import { calculateDistance } from './utils/distance';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- CẤU HÌNH ICON ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- HẰNG SỐ ---
const FIXED_RADIUS_METERS = 2000;
const FIXED_RADIUS_KM = 2;
const HANOI_POSITION = [21.028511, 105.854199];
const USER_ZOOM = 15;
const ADMIN_ZOOM = 13;

// --- HELPER COMPONENT ---
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !center) return;

    const rafId = requestAnimationFrame(() => {
      if (map.getContainer()) {
        try {
          map.setView(center, zoom, { animate: false });
        } catch (e) {
          console.warn("Map update ignored:", e);
        }
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [map, center, zoom]);

  return null;
};

// --- COMPONENT CHÍNH ---
const MapContainer = () => {
  const authContext = useAuth() || {};
  const { userRole } = authContext;
  const isAdmin = userRole === 'admin';

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(HANOI_POSITION);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const userLocation = useGeolocation();

  // Đồng bộ trạng thái Admin
  useEffect(() => {
    setIsAdminMode(isAdmin);
  }, [isAdmin]);

  // Debounce
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedFetchLocations = useMemo(() => {
    return debounce(async (lat, lng, adminMode) => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const url = adminMode
          ? `${API_BASE}/api/locations`
          : `${API_BASE}/api/locations/nearby?lat=${lat}&lng=${lng}&radius=${FIXED_RADIUS_KM}`;
          
        const response = await axios.get(url);
        setLocations(response.data.data || response.data);
        setError(null);
      } catch (err) {
        console.error('Lỗi tải địa điểm:', err);
      } finally {
        setLoading(false);
      }
    }, 1000);
  }, []);

  // Effect chính
  useEffect(() => {
    if (isAdminMode) {
      debouncedFetchLocations(null, null, true);
      setMapCenter(HANOI_POSITION);
      return;
    }

    if (!userLocation.loaded) return;

    const { lat, lng } = userLocation.coordinates;
    if (lat && lng) {
      setMapCenter([lat, lng]);
      debouncedFetchLocations(lat, lng, false);
    } else if (userLocation.error) {
      setLoading(false);
      setError(`Lỗi GPS: ${userLocation.error}`);
    }
  }, [userLocation.loaded, userLocation.coordinates, userLocation.error, isAdminMode, debouncedFetchLocations]);

  const handleToggleMode = () => {
    if (!isAdmin) return;
    setIsAdminMode((prev) => !prev);
  };

  const getDistanceToUser = (loc) => {
    if (!userLocation.loaded || !userLocation.coordinates.lat) return null;
    return calculateDistance(
      userLocation.coordinates.lat,
      userLocation.coordinates.lng,
      parseFloat(loc.latitude),
      parseFloat(loc.longitude)
    );
  };

  const visibleLocations = useMemo(() => {
    if (isAdminMode) return locations;
    if (!userLocation.loaded || !userLocation.coordinates.lat) return [];
    
    return locations.filter((loc) => {
      const dist = calculateDistance(
        userLocation.coordinates.lat,
        userLocation.coordinates.lng,
        parseFloat(loc.latitude),
        parseFloat(loc.longitude)
      );
      return dist <= FIXED_RADIUS_KM;
    });
  }, [locations, isAdminMode, userLocation.coordinates, userLocation.loaded]);

  const shouldShowUserLocation = !isAdminMode && userLocation.loaded && userLocation.coordinates.lat;

  if (loading) return <p style={{textAlign: 'center', padding: 20}}>Đang tải bản đồ...</p>;

  return (
    <div className="map-container-leaflet" style={{ position: 'relative' }}>
      {error && <div style={{ color: 'red', padding: '10px', background: '#ffebee', position: 'absolute', zIndex: 1000, top: 10, left: 10, borderRadius: 8 }}>{error}</div>}

      {isAdmin && (
        <button
          onClick={handleToggleMode}
          className="toggle-mode-btn" // Sử dụng class từ App.css nếu có, hoặc style inline tối giản
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 999,
            padding: '8px 12px', borderRadius: '8px', border: 'none',
            background: isAdminMode ? '#d9534f' : '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          {isAdminMode ? 'Admin Mode' : 'User Mode'}
        </button>
      )}

      <LeafletMapContainer
        key={isAdminMode ? "admin-map" : "user-map"} 
        center={mapCenter}
        zoom={isAdminMode ? ADMIN_ZOOM : USER_ZOOM}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        maxZoom={20}
      >
        <ChangeView center={mapCenter} zoom={isAdminMode ? ADMIN_ZOOM : USER_ZOOM} />

        <TileLayer
          attribution='Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />

        {shouldShowUserLocation && (
          <>
            <Marker position={[userLocation.coordinates.lat, userLocation.coordinates.lng]}>
              <Popup>Vị trí của bạn</Popup>
            </Marker>
            <Circle
              center={[userLocation.coordinates.lat, userLocation.coordinates.lng]}
              radius={FIXED_RADIUS_METERS}
              pathOptions={{ 
                color: '#FF5722',
                fillColor: '#FFCCBC',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 10'
              }}
            />
          </>
        )}

        {visibleLocations.map((loc) => {
          const lat = parseFloat(loc.latitude);
          const lng = parseFloat(loc.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          
          return (
            <Marker
              key={loc.id}
              position={[lat, lng]}
              title={loc.name}
              eventHandlers={{ click: () => setSelectedLocation(loc) }}
            />
          );
        })}
      </LeafletMapContainer>

      {/* Modal Chi tiết - ĐÃ SỬA DÙNG CLASS CSS THAY VÌ INLINE STYLE */}
      {selectedLocation && (
        <div 
          className={`detail-modal ${selectedLocation.fadeOut ? 'fade-out' : ''}`}
          // Xử lý đóng khi click ra ngoài (tùy chọn)
          onClick={(e) => {
             if (e.target.classList.contains('detail-modal')) setSelectedLocation(null);
          }}
        >
          <div className={`detail-content ${selectedLocation.fadeOut ? 'fade-out-content' : ''}`}>
            <button 
              className="detail-close" 
              onClick={() => setSelectedLocation(null)}
            >
              ×
            </button>
            
            <h2>{selectedLocation.name}</h2>
            <p><strong>Địa chỉ:</strong> {selectedLocation.address}</p>
            
            {selectedLocation.description && (
               <div style={{ 
                 background: 'rgba(0,0,0,0.05)', // Dùng màu trong suốt để hợp cả light/dark
                 padding: '10px', 
                 borderRadius: '4px', 
                 margin: '10px 0'
               }}>
                 {selectedLocation.description}
               </div>
            )}
            
            {!isAdminMode && userLocation.loaded && (
              <p style={{color: '#E65100', fontWeight: 'bold', marginTop: '10px'}}>
                📍 Khoảng cách: {getDistanceToUser(selectedLocation)?.toFixed(2)} km
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;