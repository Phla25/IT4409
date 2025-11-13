import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import axios from 'axios';
import useGeolocation from './hooks/useGeolocation';
import { useAuth } from './context/AuthContext';
import { calculateDistance } from './utils/distance';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ⚙️ Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const hanoiPosition = [21.028511, 105.854199];
const USER_ZOOM = 15;
const ADMIN_ZOOM = 13;

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

const LeafletMapComponent = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userLocation = useGeolocation();
  const [mapCenter, setMapCenter] = useState(hanoiPosition);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    if (isAdmin) setIsAdminMode(true);
  }, [isAdmin]);

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
        const url = adminMode
          ? 'http://localhost:5000/api/locations'
          : `http://localhost:5000/api/locations/nearby?lat=${lat}&lng=${lng}&radius=5`;
        const response = await axios.get(url);
        setLocations(response.data.data || response.data);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải địa điểm:', err);
        setError('Không thể tải dữ liệu địa điểm.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    if (isAdminMode) {
      debouncedFetchLocations(null, null, true);
      setMapCenter(hanoiPosition);
      return;
    }

    if (!userLocation.loaded) return;

    const { lat, lng } = userLocation.coordinates;
    if (lat && lng) {
      setMapCenter([lat, lng]);
      debouncedFetchLocations(lat, lng, false);
    } else if (userLocation.error) {
      setLoading(false);
      setError(`Không thể xác định vị trí: ${userLocation.error}`);
    }
  }, [
    userLocation.loaded,
    userLocation.coordinates,
    userLocation.error,
    isAdminMode,
    debouncedFetchLocations,
  ]);

  const handleToggleMode = () => {
    if (!isAdmin) return;
    setIsAdminMode((prev) => !prev);
  };

  if (loading) return <p>Đang tải dữ liệu bản đồ...</p>;

  const getDistanceToUser = (loc) => {
    if (!userLocation.loaded || !userLocation.coordinates.lat) return null;
    return calculateDistance(
      userLocation.coordinates.lat,
      userLocation.coordinates.lng,
      parseFloat(loc.latitude),
      parseFloat(loc.longitude)
    ).toFixed(2);
  };

  return (
    <div style={{ height: '800px', width: '100%', position: 'relative' }}>
      {error && <p style={{ color: 'red', padding: '10px' }}>{error}</p>}

      {isAdmin && (
        <button
          onClick={handleToggleMode}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 999,
            padding: '8px 12px',
            borderRadius: '8px',
            background: isAdminMode ? '#d9534f' : '#0275d8',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isAdminMode ? 'Admin Mode' : 'User Mode'}
        </button>
      )}

      <MapContainer
        center={mapCenter}
        zoom={isAdminMode ? ADMIN_ZOOM : USER_ZOOM}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        maxZoom={20}
      >
        <ChangeView center={mapCenter} zoom={isAdminMode ? ADMIN_ZOOM : USER_ZOOM} />

        <TileLayer
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={20}
          maxNativeZoom={17}
        />

        {/* Marker vị trí hiện tại của user */}
        {userLocation.loaded && userLocation.coordinates.lat && (
          <>
            <Marker position={[userLocation.coordinates.lat, userLocation.coordinates.lng]}>
              <Popup>Vị trí hiện tại của bạn</Popup>
            </Marker>
            <Circle
              center={[userLocation.coordinates.lat, userLocation.coordinates.lng]}
              radius={1000}
              pathOptions={{ color: 'blue', fillColor: 'lightblue', fillOpacity: 0.25 }}
            />
          </>
        )}

        {/* Các location: không hiển thị popup */}
        {locations.map((loc) => {
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
      </MapContainer>

      {/* Modal chi tiết */}
      {selectedLocation && (
        <div
          className={`detail-modal ${selectedLocation.fadeOut ? 'fade-out' : ''}`}
          onAnimationEnd={() => {
            if (selectedLocation.fadeOut) setSelectedLocation(null);
          }}
        >
          <div className={`detail-content ${selectedLocation.fadeOut ? 'fade-out-content' : ''}`}>
            <button
              className="detail-close"
              onClick={() => setSelectedLocation((prev) => ({ ...prev, fadeOut: true }))}
            >
              ×
            </button>

            <h2>{selectedLocation.name}</h2>
            {selectedLocation.address && (
              <p>
                <strong>Địa chỉ:</strong> {selectedLocation.address}
              </p>
            )}
            {selectedLocation.description && <p>{selectedLocation.description}</p>}
            {!isAdminMode && userLocation.loaded && (
              <p>
                <strong>Khoảng cách tới bạn:</strong> {getDistanceToUser(selectedLocation)} km
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMapComponent;
