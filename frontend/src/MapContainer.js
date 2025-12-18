import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import API from './api'; 
import useGeolocation from './hooks/useGeolocation';
import SimulationController from './components/SimulationController';
import { useAuth } from './context/AuthContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ✨ IMPORT MỚI: Modal, Icon và CSS
import ProposeLocationModal from './pages/ProposeLocationModal';
import { FaPlusCircle, FaCrosshairs, FaCheck, FaTimes } from 'react-icons/fa';
import './MapContainer.css'; // Import file CSS mới tạo ở bước 3

// --- FIX ICON LEAFLET ---
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
  className: 'current-location-marker' 
});

// Icon màu đỏ cho Marker tạm thời (Khi chọn vị trí thêm mới)
const tempMarkerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const hanoiPosition = [21.028511, 105.854199];

// --- COMPONENT HELPER ---
const FitBoundsToRoute = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      map.fitBounds(route, { padding: [50, 50] });
    }
  }, [route, map]); 
  return null; 
};

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
};

// ✨ COMPONENT MỚI: Xử lý Click trên bản đồ để chọn vị trí
const MapClickHandler = ({ isAddingMode, onLocationSelect }) => {
    useMapEvents({
      click(e) {
        if (isAddingMode) {
          onLocationSelect(e.latlng); // Trả về { lat, lng }
        }
      },
    });
    return null;
};

const LeafletMapComponent = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigate = useNavigate();
  
  const [locations, setLocations] = useState([]);
  const [isAdminMode, setIsAdminMode] = useState(false); 
  const [radius, setRadius] = useState(5); 

  // Routing State
  const [route, setRoute] = useState(null); 
  const [routeSummary, setRouteSummary] = useState(null); 
  const [routeProfile, setRouteProfile] = useState(null); 
  const [isFetchingRoute, setIsFetchingRoute] = useState(false); 

  const userLocation = useGeolocation();
  const [simulatedLocation, setSimulatedLocation] = useState(null);

  // ✨ STATE MỚI: CHỨC NĂNG ĐÓNG GÓP ĐỊA ĐIỂM
  const [isAddingMode, setIsAddingMode] = useState(false); // Trạng thái đang thêm
  const [tempMarker, setTempMarker] = useState(null); // Vị trí marker tạm thời (ghim đỏ)
  const [showProposeModal, setShowProposeModal] = useState(false); // Hiện form nhập liệu

  // User location logic
  const effectiveUserLocation = useMemo(() => {
    if (isAdminMode) {
      return { loaded: false, coordinates: { lat: null, lng: null }, error: null };
    }
    if (simulatedLocation) {
      return { loaded: true, coordinates: simulatedLocation, error: null };
    }
    return userLocation; 
  }, [simulatedLocation, userLocation, isAdminMode]);

  // Map View State
  const [mapCenter, setMapCenter] = useState(hanoiPosition);
  const [mapZoom, setMapZoom] = useState(13);

  // Effect view map
  useEffect(() => {
    if (isAdminMode) {
      setMapCenter(hanoiPosition);
      setMapZoom(13);
    } else if (effectiveUserLocation.loaded && effectiveUserLocation.coordinates.lat) {
      setMapCenter([effectiveUserLocation.coordinates.lat, effectiveUserLocation.coordinates.lng]);
      setMapZoom(15);
    }
  }, [isAdminMode, effectiveUserLocation.loaded, effectiveUserLocation.coordinates]);

  useEffect(() => {
    setIsAdminMode(isAdmin);
  }, [isAdmin]);

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      let url = ''; 
      if (isAdminMode) {
        url = '/locations/admin/all';
      } else if (effectiveUserLocation.loaded && effectiveUserLocation.coordinates.lat) {
        const { lat, lng } = effectiveUserLocation.coordinates;
        url = `/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      }

      if (!url) return; 
      const res = await API.get(url);
      setLocations(res.data.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }, [isAdminMode, effectiveUserLocation.loaded, effectiveUserLocation.coordinates, radius]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Routing Logic
  const getDirections = async (start, end, profile = 'driving-car') => {
    // Lưu ý: Thay API KEY thật của bạn vào đây
    const ORS_API_KEY = 'YOUR_OPENROUTESERVICE_API_KEY'; 

    if (ORS_API_KEY === 'YOUR_OPENROUTESERVICE_API_KEY') {
      alert('Vui lòng cấu hình API Key OpenRouteService trong MapContainer.js');
      return;
    }

    setIsFetchingRoute(true);
    setRoute(null);
    setRouteSummary(null);
    setRouteProfile(profile);

    const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.longitude},${end.latitude}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const routeCoordinates = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRoute(routeCoordinates);
        if (feature.properties.summary) {
            const { distance, duration } = feature.properties.summary;
            setRouteSummary({ distance, duration });
        }
      } else {
        alert("Không tìm thấy đường đi.");
      }
    } catch (error) {
      console.error("Lỗi chỉ đường:", error);
      alert("Lỗi khi tìm đường.");
    } finally {
      setIsFetchingRoute(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return "dưới 1 phút";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} giờ ${remainingMinutes} phút`;
  };

  const formatDistance = (meters) => `${(meters / 1000).toFixed(1)} km`;

  const handleRadiusChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0.1) value = 0.1;
    else if (value > 5) value = 5;
    setRadius(value);
  };

  const handleUserMarkerDrag = (e) => {
    if (!isAdmin || isAdminMode) return;
    const newLatLng = e.target.getLatLng();
    setSimulatedLocation({ lat: newLatLng.lat, lng: newLatLng.lng });
  };

  // ✨ CÁC HÀM XỬ LÝ ĐÓNG GÓP ĐỊA ĐIỂM MỚI
  const toggleAddMode = () => {
    const newState = !isAddingMode;
    setIsAddingMode(newState);
    // Nếu tắt chế độ thêm thì xóa marker tạm và ẩn modal
    if (!newState) {
        setTempMarker(null);
        setShowProposeModal(false);
    }
  };

  const handleMapClick = (latlng) => {
    setTempMarker(latlng); // Đặt ghim đỏ tại vị trí click
  };

  const handleUseCurrentLocation = () => {
    if (effectiveUserLocation.coordinates.lat) {
        const currentPos = { 
            lat: effectiveUserLocation.coordinates.lat, 
            lng: effectiveUserLocation.coordinates.lng 
        };
        setTempMarker(currentPos);
        setMapCenter([currentPos.lat, currentPos.lng]); // Zoom đến đó
    } else {
        alert("Chưa lấy được vị trí của bạn.");
    }
  };

  const handleProposeSuccess = () => {
      setShowProposeModal(false);
      setIsAddingMode(false);
      setTempMarker(null);
      // Có thể fetch lại location nếu cần (để user thấy ngay quán chờ duyệt nếu logic cho phép)
      fetchLocations(); 
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>

      {/* --- CÔNG CỤ ĐÓNG GÓP ĐỊA ĐIỂM (HIỆN KHI KHÔNG PHẢI ADMIN VIEW) --- */}
      {!isAdminMode && (
          <div className="contribute-controls">
            <button 
                className={`btn-contribute ${isAddingMode ? 'active' : ''}`} 
                onClick={toggleAddMode}
                title="Đóng góp địa điểm mới"
            >
                {isAddingMode ? <><FaTimes /> Hủy thêm</> : <><FaPlusCircle /> Đóng góp địa điểm</>}
            </button>
            
            {isAddingMode && (
                <button className="btn-use-gps" onClick={handleUseCurrentLocation}>
                    <FaCrosshairs /> Dùng vị trí hiện tại
                </button>
            )}
          </div>
      )}

      {/* HƯỚNG DẪN KHI ĐANG Ở CHẾ ĐỘ THÊM */}
      {isAddingMode && !tempMarker && (
          <div className="add-mode-instruction">
              👇 Chạm vào bản đồ để chọn vị trí quán
          </div>
      )}

      {/* --- CÁC PANEL CŨ (Giữ nguyên) --- */}
      {isAdmin && !isAdminMode && userLocation.loaded && userLocation.coordinates.lat && (
        <SimulationController
          initialPosition={effectiveUserLocation.coordinates}
          onPositionChange={setSimulatedLocation}
        />
      )}

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
          <button className="btn-clear-route" onClick={() => { setRoute(null); setRouteSummary(null); setRouteProfile(null);}}>
            Xong
          </button>
        </div>
      )}

      {isFetchingRoute && <div className="routing-loading-overlay">Đang tìm đường...</div>}
      
      {!isAdminMode && (
        <div className="radius-filter-panel">
          <div className="radius-input-container">
            <label htmlFor="radius-input">Bán kính:</label>
            <input id="radius-input" type="number" value={radius} onChange={handleRadiusChange} min="0.1" max="5" step="0.1"/>
            <span>km</span>
          </div>
          <input type="range" min="0.1" max="5" value={radius} step="0.1" onChange={handleRadiusChange} />
        </div>
      )}

      {isAdmin && (
        <div className="admin-toggle-switch-container">
          <label className="switch">
            <input type="checkbox" checked={isAdminMode} onChange={() => setIsAdminMode(!isAdminMode)}/>
            <span className="slider round"></span>
          </label>
          <span className="admin-toggle-label">{isAdminMode ? "Admin View" : "User View"}</span>
        </div>
      )}

      {/* --- MAP CONTAINER --- */}
      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="Google Maps" />

        <ChangeView center={mapCenter} zoom={mapZoom} />
        <FitBoundsToRoute route={route} />

        {/* XỬ LÝ CLICK ĐỂ THÊM ĐỊA ĐIỂM */}
        <MapClickHandler isAddingMode={isAddingMode} onLocationSelect={handleMapClick} />

        {route && <Polyline positions={route} color="#3498db" weight={5} />}

        {/* ✨ MARKER TẠM THỜI (GHIM ĐỎ) */}
        {tempMarker && (
            <Marker position={tempMarker} icon={tempMarkerIcon}>
                <Popup isOpen={true} closeButton={false} autoPan={true}>
                    <div style={{textAlign: 'center', padding: '5px'}}>
                        <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>Thêm địa điểm tại đây?</p>
                        <button 
                            className="btn-confirm-add"
                            onClick={() => setShowProposeModal(true)}
                        >
                            <FaCheck /> Nhập thông tin quán
                        </button>
                    </div>
                </Popup>
            </Marker>
        )}

        {/* MARKER VỊ TRÍ NGƯỜI DÙNG */}
        {!isAdminMode && effectiveUserLocation.coordinates.lat && (
          <>
            <Marker 
              position={[effectiveUserLocation.coordinates.lat, effectiveUserLocation.coordinates.lng]}
              icon={currentLocationIcon}
              draggable={isAdmin && !isAdminMode}
              eventHandlers={{ dragend: handleUserMarkerDrag }}
            >
              <Popup>Bạn đang ở đây</Popup>
            </Marker>
            <Circle center={[effectiveUserLocation.coordinates.lat, effectiveUserLocation.coordinates.lng]} radius={radius * 1000} />
          </>
        )}

        {/* DANH SÁCH CÁC ĐỊA ĐIỂM */}
        {locations.map(loc => (
          <Marker key={loc.id} position={[loc.latitude, loc.longitude]}> 
            <Popup> 
              <div className="location-popup-content">
                <h4 className="popup-title">{loc.name}</h4>
                
                <div className="popup-info-line"><span>📍</span><span>{loc.address}</span></div>
                {loc.phone_number && <div className="popup-info-line"><span>📞</span><span>{loc.phone_number}</span></div>}
                {(loc.min_price > 0 || loc.max_price > 0) && (
                  <div className="popup-info-line"><span>💰</span><span>{loc.min_price.toLocaleString()} - {loc.max_price.toLocaleString()} VNĐ</span></div>
                )}

                {isAdminMode && (
                  <div className={`popup-status ${loc.is_approved ? 'approved' : 'pending'}`}>
                    {loc.is_approved ? "✅ Đã duyệt" : "❌ Chờ duyệt"}
                  </div>
                )}
                
                {effectiveUserLocation.coordinates.lat && (
                  <div className="popup-directions-container">
                    <button className="popup-directions-button" onClick={() => getDirections(effectiveUserLocation.coordinates, loc, 'driving-car')}>🏍️ Xe máy</button>
                    <button className="popup-directions-button walk" onClick={() => getDirections(effectiveUserLocation.coordinates, loc, 'foot-walking')}>🚶 Đi bộ</button>
                  </div>
                )}

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

      {/* ✨ MODAL NHẬP LIỆU */}
      {showProposeModal && tempMarker && (
        <ProposeLocationModal 
            lat={tempMarker.lat}
            lng={tempMarker.lng}
            onClose={() => setShowProposeModal(false)}
            onSuccess={handleProposeSuccess}
        />
      )}
    </div>
  );
};

export default LeafletMapComponent;