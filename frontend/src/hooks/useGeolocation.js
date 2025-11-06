import { useState, useEffect, useRef } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState({
    loaded: false,
    coordinates: { lat: null, lng: null },
    error: null,
  });

  const lastPosition = useRef(null); // 🧭 Lưu vị trí gần nhất để so sánh

  const onSuccess = (position) => {
    const { latitude, longitude, accuracy } = position.coords;

    // Nếu vị trí mới khác biệt đáng kể so với vị trí cũ thì mới cập nhật
    if (
      !lastPosition.current ||
      getDistance(
        lastPosition.current.latitude,
        lastPosition.current.longitude,
        latitude,
        longitude
      ) > 0.02 // chỉ cập nhật nếu di chuyển > 20m
    ) {
      lastPosition.current = { latitude, longitude };
      setLocation({
        loaded: true,
        coordinates: { lat: latitude, lng: longitude },
        error: null,
      });
    }
  };

  const onError = (error) => {
    setLocation({
      loaded: true,
      coordinates: { lat: null, lng: null },
      error: error.message || 'Không thể lấy vị trí người dùng.',
    });
  };

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      onError({ message: 'Trình duyệt không hỗ trợ định vị.' });
      return;
    }

    // Sử dụng watchPosition để theo dõi vị trí liên tục
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });

    // Cleanup khi component unmount
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return location;
};

// 👉 Hàm tính khoảng cách giữa 2 tọa độ (km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default useGeolocation;
