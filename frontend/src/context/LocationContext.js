import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import useGeolocation from '../hooks/useGeolocation'; // Sử dụng hook cũ để lấy vị trí thật

const LocationContext = createContext();

export const useLocationContext = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  // 1. Lấy vị trí thật từ Browser
  const realLocation = useGeolocation();
  
  // 2. State vị trí giả lập (Khởi tạo từ sessionStorage nếu có)
  const [simulatedLocation, setSimulatedLocation] = useState(() => {
    try {
      const saved = sessionStorage.getItem('simulated_location');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // 3. Tự động lưu vào sessionStorage khi thay đổi
  useEffect(() => {
    if (simulatedLocation) {
      sessionStorage.setItem('simulated_location', JSON.stringify(simulatedLocation));
    } else {
      sessionStorage.removeItem('simulated_location');
    }
  }, [simulatedLocation]);

  // 4. Tính toán vị trí "hiệu lực" (Effective Location)
  // Nếu có giả lập -> Dùng giả lập. Nếu không -> Dùng thật.
  const location = useMemo(() => {
    if (simulatedLocation) {
      return { 
        loaded: true, 
        coordinates: simulatedLocation, 
        error: null,
        isSimulated: true // Cờ đánh dấu đang giả lập
      };
    }
    return { ...realLocation, isSimulated: false };
  }, [simulatedLocation, realLocation]);

  // Hàm reset về vị trí thật
  const resetLocation = () => setSimulatedLocation(null);

  return (
    <LocationContext.Provider value={{ 
      location,             // Dữ liệu vị trí (đã xử lý ưu tiên)
      setSimulatedLocation, // Hàm set vị trí giả lập
      resetLocation         // Hàm xóa giả lập
    }}>
      {children}
    </LocationContext.Provider>
  );
};