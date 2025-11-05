// frontend/src/hooks/useGeolocation.js
import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState({
    loaded: false,
    coordinates: { lat: null, lng: null },
    error: null,
  });

  // Hàm xử lý khi lấy vị trí thành công
  const onSuccess = (position) => {
    setLocation({
      loaded: true,
      coordinates: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      error: null,
    });
  };

  // Hàm xử lý khi lấy vị trí thất bại hoặc bị từ chối
  const onError = (error) => {
    setLocation({
      loaded: true,
      coordinates: { lat: null, lng: null },
      error: error.message || "Lỗi định vị không xác định.",
    });
  };

  useEffect(() => {
    // 1. Kiểm tra hỗ trợ trình duyệt
    if (!("geolocation" in navigator)) {
      onError({ code: 0, message: "Trình duyệt không hỗ trợ định vị." });
      return;
    }

    // 2. Sử dụng watchPosition để theo dõi vị trí liên tục
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true, // Tăng độ chính xác
      timeout: 10000,          // Thời gian chờ
      maximumAge: 0,           // Không sử dụng cache
    });

    // 3. Cleanup: Dừng theo dõi khi component bị hủy
    return () => navigator.geolocation.clearWatch(watchId);
  }, []); // Chỉ chạy một lần khi component mount

  return location;
};

export default useGeolocation;