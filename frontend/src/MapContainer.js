import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Circle, useMap, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import API from './api'; 
// 👇 Thay useGeolocation bằng useLocationContext
import { useLocationContext } from './context/LocationContext'; 
import SimulationController from './components/SimulationController';
import { useAuth } from './context/AuthContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import ProposeLocationModal from './pages/ProposeLocationModal';
import { FaPlusCircle, FaCrosshairs, FaCheck, FaTimes } from 'react-icons/fa';
import './MapContainer.css'; 

// --- FIX ICON LEAFLET (Giữ nguyên) ---
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

const tempMarkerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const hanoiPosition = [21.028511, 105.854199];

// --- COMPONENT HELPER (Giữ nguyên) ---
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

const MapClickHandler = ({ isAddingMode, onLocationSelect }) => {
    useMapEvents({
      click(e) {
        if (isAddingMode) {
          onLocationSelect(e.latlng); 
        }
      },
    });
    return null;
};

const MapContainer = () => {
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

  // 👇 SỬ DỤNG CONTEXT: Lấy vị trí và hàm cập nhật giả lập từ Global State
  // Lưu ý: userLocation ở đây đã được xử lý trong Context (nếu có giả lập thì lấy giả lập, không thì lấy thật)
  const { location: userLocation, setSimulatedLocation } = useLocationContext();

  const [isAddingMode, setIsAddingMode] = useState(false); 
  const [tempMarker, setTempMarker] = useState(null); 
  const [showProposeModal, setShowProposeModal] = useState(false); 

  const [isDebugMode, setIsDebugMode] = useState(false);

  // Logic xác định vị trí để hiển thị trên bản đồ
  const effectiveUserLocation = useMemo(() => {
    // Nếu Admin đang ở chế độ xem Admin -> Không cần quan tâm vị trí User
    if (isAdminMode) {
      return { loaded: false, coordinates: { lat: null, lng: null }, error: null };
    }
    // Ngược lại, trả về vị trí từ Context (đã bao gồm logic thật/giả lập)
    return userLocation; 
  }, [userLocation, isAdminMode]);

  const [mapCenter, setMapCenter] = useState(hanoiPosition);
  const [mapZoom, setMapZoom] = useState(13);

  // Debug Mode Key Listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && (event.key === 'D' || event.key === 'd')) {
        event.preventDefault();
        setIsDebugMode(prev => !prev);
        console.log("Debug Mode toggled");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update Map View
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
    if ((!isAdminMode && isDebugMode) || (isAdmin && !isAdminMode)) {
        const newLatLng = e.target.getLatLng();
        // 👇 Gọi hàm setSimulatedLocation từ Context
        setSimulatedLocation({ lat: newLatLng.lat, lng: newLatLng.lng });
    }
  };

  // Add Mode Functions
  const toggleAddMode = () => {
    const newState = !isAddingMode;
    setIsAddingMode(newState);
    if (!newState) {
        setTempMarker(null);
        setShowProposeModal(false);
    }
  };

  const handleMapClick = (latlng) => {
    setTempMarker(latlng); 
  };

  const handleUseCurrentLocation = () => {
    if (effectiveUserLocation.coordinates.lat) {
        const currentPos = { 
            lat: effectiveUserLocation.coordinates.lat, 
            lng: effectiveUserLocation.coordinates.lng 
        };
        setTempMarker(currentPos);
        setMapCenter([currentPos.lat, currentPos.lng]); 
    } else {
        alert("Chưa lấy được vị trí của bạn.");
    }
  };

  const handleProposeSuccess = () => {
      setShowProposeModal(false);
      setIsAddingMode(false);
      setTempMarker(null);
      fetchLocations(); 
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>

      {/* CONTROLS */}
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

      {isAddingMode && !tempMarker && (
          <div className="add-mode-instruction">👇 Chạm vào bản đồ để chọn vị trí quán</div>
      )}

      {/* SIMULATION CONTROLLER (Sử dụng Context) */}
      {isDebugMode && !isAdminMode && userLocation.loaded && userLocation.coordinates.lat && (
        <>
            <SimulationController
              initialPosition={effectiveUserLocation.coordinates}
              onPositionChange={setSimulatedLocation} // Cập nhật vào Context
            />
            <div style={{
                position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(255, 0, 0, 0.8)', color: 'white', padding: '5px 10px',
                borderRadius: '5px', zIndex: 2000, fontSize: '0.8rem', pointerEvents: 'none'
            }}>
                🔧 Debug Mode: ON
            </div>
        </>
      )}

      {/* Route Summary */}
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

      {/* MAP */}
      <LeafletMapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="Google Maps" />

        <ChangeView center={mapCenter} zoom={mapZoom} />
        <FitBoundsToRoute route={route} />

        <MapClickHandler isAddingMode={isAddingMode} onLocationSelect={handleMapClick} />

        {route && <Polyline positions={route} color="#3498db" weight={5} />}

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

        {!isAdminMode && effectiveUserLocation.coordinates.lat && (
          <>
            <Marker 
              position={[effectiveUserLocation.coordinates.lat, effectiveUserLocation.coordinates.lng]}
              icon={currentLocationIcon}
              draggable={isDebugMode && !isAdminMode}
              eventHandlers={{ dragend: handleUserMarkerDrag }}
            >
              <Popup>
                Bạn đang ở đây 
                {effectiveUserLocation.isSimulated && <span style={{color:'red'}}> (Giả lập)</span>}
              </Popup>
            </Marker>
            <Circle center={[effectiveUserLocation.coordinates.lat, effectiveUserLocation.coordinates.lng]} radius={radius * 1000} />
          </>
        )}

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
      </LeafletMapContainer>

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

export default MapContainer;