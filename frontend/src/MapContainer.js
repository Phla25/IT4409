// frontend/src/MapContainer.js
import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import axios from 'axios';
import useGeolocation from './hooks/useGeolocation';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ⚙️ Fix icon marker mặc định
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const hanoiPosition = [21.028511, 105.854199];
const INITIAL_ZOOM = 15;

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

const LeafletMapComponent = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userLocation = useGeolocation();
  const [mapCenter, setMapCenter] = useState(hanoiPosition);

  // --- Hàm Debounce ---
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // --- Gọi API Backend (dùng useMemo để giữ ổn định) ---
  const debouncedFetchNearby = useMemo(() => {
    return debounce(async (lat, lng) => {
      try {
        setLoading(true);
        const radiusKm = 5;
        console.log(`[API Call] Searching nearby at: ${lat}, ${lng}`);

        const response = await axios.get(
          `http://localhost:5000/api/locations/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
        );

        setLocations(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải địa điểm gần:", err);
        setError("Không thể tải địa điểm gần bạn.");
      } finally {
        setLoading(false);
      }
    }, 1500);
  }, []); // chỉ tạo 1 lần

  // --- Theo dõi vị trí người dùng ---
  useEffect(() => {
    if (!userLocation.loaded) return;

    const { lat, lng } = userLocation.coordinates;
    if (lat && lng) {
      setMapCenter([lat, lng]);
      debouncedFetchNearby(lat, lng);
    } else if (userLocation.error) {
      setLoading(false);
      setError(`Không thể xác định vị trí: ${userLocation.error}`);
    }
  }, [userLocation.loaded, userLocation.coordinates, userLocation.error, debouncedFetchNearby]);

  if (loading) return <p>Đang tải dữ liệu bản đồ...</p>;

  return (
    <div style={{ height: '800px', width: '100%' }}>
      {error && <p style={{ color: 'red', padding: '10px' }}>{error}</p>}

      <MapContainer
        center={mapCenter}
        zoom={INITIAL_ZOOM}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        maxZoom={20}
      >
        <ChangeView center={mapCenter} zoom={INITIAL_ZOOM} />

        <TileLayer
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={20}
          maxNativeZoom={17}
        />

        {/* Vị trí người dùng */}
        {userLocation.coordinates.lat && (
          <>
            <Marker position={[userLocation.coordinates.lat, userLocation.coordinates.lng]}>
              <Popup>Vị trí hiện tại của bạn</Popup>
            </Marker>

            <Circle
              center={[userLocation.coordinates.lat, userLocation.coordinates.lng]}
              radius={1000}
              pathOptions={{
                color: 'blue',
                fillColor: 'lightblue',
                fillOpacity: 0.25,
              }}
            />
          </>
        )}

        {/* Địa điểm gần đó */}
        {locations.map((loc) => {
          const lat = parseFloat(loc.latitude);
          const lng = parseFloat(loc.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={loc.id} position={[lat, lng]} title={loc.name}>
              <Popup>
                <strong>{loc.name}</strong>
                <br />
                Khoảng cách: {loc.distance_km?.toFixed(2)} km
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMapComponent;
