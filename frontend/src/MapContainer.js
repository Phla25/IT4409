import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup, Polyline } from 'react-leaflet';
import { useNavigate } from 'react-router-dom'; // ✨ THÊM DÒNG NÀY
import API from './api'; // Dùng instance API chung
import useGeolocation from './hooks/useGeolocation'; // Giữ nguyên file hook của bạn
import SimulationController from './components/SimulationController'; // Import component mới
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

const currentLocationIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'current-location-marker' // Lớp CSS này sẽ được dùng để đổi màu icon
});

const hanoiPosition = [21.028511, 105.854199];

// --- COMPONENT HELPER: Tự động zoom vào tuyến đường ---
const FitBoundsToRoute = ({ route }) => {
  const map = useMap();

  useEffect(() => {
    // Nếu có dữ liệu tuyến đường (một mảng các tọa độ)
    if (route && route.length > 0) {
      // Sử dụng fitBounds để map tự động zoom và pan cho vừa với tuyến đường
      // Thêm padding để tuyến đường không bị sát vào các cạnh của bản đồ
      map.fitBounds(route, { padding: [50, 50] });
    }
  }, [route, map]); // Chạy lại mỗi khi `route` thay đổi

  return null; // Component này không render ra giao diện
};

// --- COMPONENT HELPER: Thay đổi view của bản đồ ---
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    // setView sẽ di chuyển bản đồ đến tọa độ và mức zoom mới một cách mượt mà
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);

  return null;
};

const LeafletMapComponent = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigate = useNavigate(); // ✨ THÊM DÒNG NÀY
  
  const [locations, setLocations] = useState([]);
  const [isAdminMode, setIsAdminMode] = useState(false); // Chế độ xem của Admin
  const [radius, setRadius] = useState(5); // Bán kính tìm kiếm (km)

  // --- STATE CHO TÍNH NĂNG CHỈ ĐƯỜNG ---
  const [route, setRoute] = useState(null); // Lưu trữ geometry của tuyến đường
  const [routeSummary, setRouteSummary] = useState(null); // State mới để lưu khoảng cách và thời gian
  const [routeProfile, setRouteProfile] = useState(null); // State mới để lưu profile (driving-car, foot-walking)
  const [isFetchingRoute, setIsFetchingRoute] = useState(false); // Trạng thái loading khi tìm đường

  const userLocation = useGeolocation();
  const [selectedLocation, setSelectedLocation] = useState(null);

  // --- STATE CHO GIẢ LẬP VỊ TRÍ ---
  const [simulatedLocation, setSimulatedLocation] = useState(null);

  // Quyết định xem nên dùng vị trí thật hay vị trí giả lập
  const effectiveUserLocation = useMemo(() => {
    // Nếu đang ở admin mode, không cần vị trí người dùng
    if (isAdminMode) {
      return { loaded: false, coordinates: { lat: null, lng: null }, error: null };
    }
    if (simulatedLocation) {
      return {
        loaded: true,
        coordinates: simulatedLocation,
        error: null,
      };
    }
    return userLocation; // Vị trí thật từ hook
  }, [simulatedLocation, userLocation, isAdminMode]);

  // --- STATE CHO MAP VIEW ---
  const [mapCenter, setMapCenter] = useState(hanoiPosition);
  const [mapZoom, setMapZoom] = useState(13);

  // --- EFFECT ĐỂ XỬ LÝ CHUYỂN VIEW ---
  useEffect(() => {
    if (isAdminMode) {
      // Khi chuyển sang Admin View, zoom ra Hà Nội
      setMapCenter(hanoiPosition);
      setMapZoom(13);
    } else if (effectiveUserLocation.loaded && effectiveUserLocation.coordinates.lat) {
      // Khi chuyển sang User View (và có vị trí), zoom vào người dùng
      setMapCenter([effectiveUserLocation.coordinates.lat, effectiveUserLocation.coordinates.lng]);
      setMapZoom(15);
    }
  }, [isAdminMode, effectiveUserLocation.loaded, effectiveUserLocation.coordinates]);

  // Khi role thay đổi, cập nhật chế độ
  useEffect(() => {
    setIsAdminMode(isAdmin);
  }, [isAdmin]);

  // Hàm fetch dữ liệu
  const fetchLocations = async () => {
    try {
      let url = ''; // Khởi tạo url rỗng
      
      if (isAdminMode) {
        // Admin: Lấy danh sách quản trị (bao gồm chưa duyệt)
        url = '/locations/admin/all';
      } else if (effectiveUserLocation.loaded && effectiveUserLocation.coordinates.lat) {
        // User/Guest: CHỈ lấy khi có tọa độ
        const { lat, lng } = effectiveUserLocation.coordinates;
        url = `/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      }

      if (!url) return; // Nếu không có url hợp lệ, không fetch
      const res = await API.get(url);
      setLocations(res.data.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // ============================================================
  // TÍNH NĂNG CHỈ ĐƯỜNG (SỬ DỤNG OPENROUTESERVICE)
  // ============================================================
  const getDirections = async (start, end, profile = 'driving-car') => {
    // BẠN CẦN THAY API KEY CỦA MÌNH VÀO ĐÂY
    // Đăng ký tại: https://openrouteservice.org/
    const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImQ5ZjA5NTk2MzBkMDRkYmM4MDM0OWQ5MTUyYmEwYzQ5IiwiaCI6Im11cm11cjY0In0=';

    if (ORS_API_KEY === 'YOUR_OPENROUTESERVICE_API_KEY') {
      alert('Vui lòng thay thế API Key của OpenRouteService trong file MapContainer.js');
      return;
    }

    setIsFetchingRoute(true);
    setRoute(null); // Xóa tuyến đường cũ
    setRouteSummary(null); // Xóa summary cũ
    setRouteProfile(profile); // Lưu lại profile đã chọn

    const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.longitude},${end.latitude}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        // Geometry trả về là [lng, lat], cần đảo ngược cho Leaflet [lat, lng]
        const routeCoordinates = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRoute(routeCoordinates);

        // Lấy thông tin summary (khoảng cách và thời gian)
        if (feature.properties.summary) {
            const { distance, duration } = feature.properties.summary;
            setRouteSummary({ distance, duration });
        }
      } else {
        alert("Không tìm thấy đường đi.");
      }
    } catch (error) {
      console.error("Lỗi khi lấy chỉ đường:", error);
      alert("Đã xảy ra lỗi khi cố gắng tìm đường đi.");
    } finally {
      setIsFetchingRoute(false);
    }
  };

  // Hàm tiện ích để format thời gian từ giây sang phút/giờ
  const formatDuration = (seconds) => {
    if (seconds < 60) return "dưới 1 phút";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} giờ ${remainingMinutes} phút`;
  };

  // Hàm tiện ích để format khoảng cách từ mét sang km
  const formatDistance = (meters) => {
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Hàm xử lý khi người dùng thay đổi bán kính (từ slider hoặc input)
  const handleRadiusChange = (e) => {
    let value = parseFloat(e.target.value);

    // Đảm bảo giá trị không rỗng và nằm trong khoảng cho phép
    if (isNaN(value) || value < 0.1) {
      value = 0.1;
    } else if (value > 5) {
      value = 5;
    }
    setRadius(value);
  };
  // Gọi API khi dependency thay đổi
  useEffect(() => { // Nếu là Admin mode -> gọi luôn // Nếu là User mode -> chờ có vị trí mới gọi
    if (isAdminMode || effectiveUserLocation.loaded && !effectiveUserLocation.error) {
      fetchLocations();
    }
  }, [isAdminMode, effectiveUserLocation, radius]);

  /**
   * ✨ Xử lý sự kiện khi Admin kéo thả marker vị trí người dùng (giả lập)
   * @param {DragEndEvent} e - Sự kiện từ Leaflet
   */
  const handleUserMarkerDrag = (e) => {
    // Chỉ cho phép chức năng này khi là Admin và đang ở User View
    if (!isAdmin || isAdminMode) return;

    const newLatLng = e.target.getLatLng();
    setSimulatedLocation({
      lat: newLatLng.lat,
      lng: newLatLng.lng,
    });
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>

      {/* --- BỘ ĐIỀU KHIỂN GIẢ LẬP (CHỈ HIỆN KHI ADMIN Ở USER VIEW) --- */}
      {isAdmin && !isAdminMode && userLocation.loaded && userLocation.coordinates.lat && (
        <SimulationController
          initialPosition={effectiveUserLocation.coordinates}
          onPositionChange={setSimulatedLocation}
        />
      )}


      {/* --- PANEL KẾT QUẢ CHỈ ĐƯỜNG --- */}
      {route && (
        <div className="route-summary-panel">
          {routeSummary && (
            <div className="route-info">              
              <span>{routeProfile === 'foot-walking' ? '🚶' : '🏍️'}</span>
              <span><b>{formatDistance(routeSummary.distance)}</b></span>
              <span>-</span>
              <span>~ <b>{formatDuration(routeSummary.duration)}</b></span>
            </div>
          )}
          <button
            className="btn-clear-route"
            onClick={() => { setRoute(null); setRouteSummary(null); setRouteProfile(null);}}
          >
            Xong
          </button>
        </div>
      )}

      {/* Loading indicator for routing */}
      {isFetchingRoute && (
        <div className="routing-loading-overlay">Đang tìm đường...</div>
      )}
      
      {/* Panel điều khiển (Filter Radius) */}
      {!isAdminMode && (
        <div className="radius-filter-panel">
          <div className="radius-input-container">
            <label htmlFor="radius-input">Bán kính:</label>
            <input
              id="radius-input"
              type="number"
              value={radius}
              onChange={handleRadiusChange}
              min="0.1"
              max="5"
              step="0.1"
            />
            <span>km</span>
          </div>
          <input 
            type="range" min="0.1" max="5" value={radius} 
            step="0.1" onChange={handleRadiusChange} 
          />
        </div>
      )}

      {/* --- CÔNG TẮC CHUYỂN CHẾ ĐỘ ADMIN --- */}
      {isAdmin && (
        <div className="admin-toggle-switch-container">
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isAdminMode}
              onChange={() => setIsAdminMode(!isAdminMode)}
            />
            <span className="slider round"></span>
          </label>
          <span className="admin-toggle-label">{isAdminMode ? "Admin View" : "User View"}</span>
        </div>
      )}

      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="Google Maps" />

        {/* Component helper để thay đổi view */}
        <ChangeView center={mapCenter} zoom={mapZoom} />

        {/* Component helper để tự động zoom */}
        <FitBoundsToRoute route={route} />

        {/* Vẽ tuyến đường lên bản đồ */}
        {route && <Polyline positions={route} color="#3498db" weight={5} />}

        {/* Marker vị trí người dùng */}
        {!isAdminMode && effectiveUserLocation.coordinates.lat && (
          <>
            <Marker 
              position={[effectiveUserLocation.coordinates.lat, effectiveUserLocation.coordinates.lng]}
              icon={currentLocationIcon}
              // ✨ BẬT CHỨC NĂNG KÉO THẢ CHO ADMIN Ở USER VIEW
              draggable={isAdmin && !isAdminMode}
              // ✨ CẬP NHẬT VỊ TRÍ GIẢ LẬP KHI KÉO XONG
              eventHandlers={{ dragend: handleUserMarkerDrag }}
            >
              <Popup>Bạn đang ở đây</Popup>
            </Marker>
            <Circle center={[effectiveUserLocation.coordinates.lat, effectiveUserLocation.coordinates.lng]} radius={radius * 1000} />
          </>
        )}

        {/* Marker các địa điểm */}
        {locations.map(loc => (
          <Marker 
            key={loc.id} 
            position={[loc.latitude, loc.longitude]}
            eventHandlers={{ click: () => setSelectedLocation(loc) }}
          > 
            {/* --- CẬP NHẬT NỘI DUNG POPUP --- */}
            <Popup> 
              <div className="location-popup-content">
                <h4 className="popup-title">{loc.name}</h4>
                
                <div className="popup-info-line">
                  <span className="popup-icon">📍</span>
                  <span>{loc.address}</span>
                </div>

                {loc.phone_number && (
                  <div className="popup-info-line">
                    <span className="popup-icon">📞</span>
                    <span>{loc.phone_number}</span>
                  </div>
                )}

                {(loc.min_price > 0 || loc.max_price > 0) && (
                  <div className="popup-info-line">
                    <span className="popup-icon">💰</span>
                    <span>{loc.min_price.toLocaleString()} - {loc.max_price.toLocaleString()} VNĐ</span>
                  </div>
                )}

                {isAdminMode && (
                  <div className={`popup-status ${loc.is_approved ? 'approved' : 'pending'}`}>
                    {loc.is_approved ? "✅ Đã duyệt" : "❌ Chờ duyệt"}
                  </div>
                )}
                
                {/* Nút chỉ đường */}
                {effectiveUserLocation.coordinates.lat && (
                  <div className="popup-directions-container">
                    <button 
                      className="popup-directions-button"
                      onClick={() => getDirections(effectiveUserLocation.coordinates, loc, 'driving-car')}
                    >
                      🏍️ Xe máy
                    </button>
                    <button 
                      className="popup-directions-button walk"
                      onClick={() => getDirections(effectiveUserLocation.coordinates, loc, 'foot-walking')}
                    >
                      🚶 Đi bộ
                    </button>
                  </div>
                )}

                {/* ✨ THÊM NÚT XEM CHI TIẾT */}
                {loc.id && (
                  <div className="popup-details-container">
                    <button 
                      className="popup-details-button" 
                      onClick={() => {
                        const targetUrl = isAdmin && !isAdminMode ? `/locations/${loc.id}?view=user` : `/locations/${loc.id}`;
                        navigate(targetUrl);
                      }}>
                      Xem chi tiết 
                    </button>
                  </div>
                )}
              </div>
            </Popup> 
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMapComponent;