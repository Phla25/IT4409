import React, { useState, useEffect, useRef } from 'react';

const SimulationController = ({ initialPosition, onPositionChange }) => {
  // --- STATE ---
  const [position, setPosition] = useState(initialPosition);
  // ✨ State mới cho các ô input, lưu dưới dạng chuỗi để người dùng dễ dàng chỉnh sửa
  const [inputCoords, setInputCoords] = useState({
    lat: initialPosition.lat.toString(),
    lng: initialPosition.lng.toString(),
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- STATE CHO VIỆC KÉO THẢ PANEL ---
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState({ x: 20, y: 150 });
  const panelRef = useRef(null);

  // --- EFFECTS ---
  // Đồng bộ state nội bộ khi vị trí từ props (bản đồ) thay đổi
  useEffect(() => {
    setPosition(initialPosition);
    setInputCoords({ lat: initialPosition.lat.toString(), lng: initialPosition.lng.toString() });
  }, [initialPosition]);

  const handleMove = (latChange, lngChange) => {
    const newPos = {
      // Sử dụng parseFloat để đảm bảo phép cộng số học
      lat: parseFloat(position.lat) + latChange,
      lng: parseFloat(position.lng) + lngChange,
    };
    setPosition(newPos);
    onPositionChange(newPos);
  };

  // ✨ Xử lý khi người dùng nhập vào ô tọa độ
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputCoords(prev => ({ ...prev, [name]: value }));
  };

  // ✨ Xử lý khi người dùng nhấn nút "Đi đến" hoặc Enter
  const handleApplyCoords = (e) => {
    e.preventDefault(); // Ngăn form submit và tải lại trang
    const newLat = parseFloat(inputCoords.lat);
    const newLng = parseFloat(inputCoords.lng);

    if (!isNaN(newLat) && !isNaN(newLng)) {
      const newPos = { lat: newLat, lng: newLng };
      setPosition(newPos);
      onPositionChange(newPos);
    } else {
      alert("Tọa độ không hợp lệ!");
    }
  };

  // --- Xử lý kéo thả panel ---
  const onMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y,
    });
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    setPanelPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const moveStep = 0.001; // Bước nhảy tọa độ

  return (
    <div
      ref={panelRef}
      className={`simulation-panel ${isCollapsed ? 'collapsed' : ''}`}
      style={{ top: `${panelPosition.y}px`, left: `${panelPosition.x}px` }}
    >
      <div className="simulation-header" onMouseDown={onMouseDown}>
        <span>🕹️ Giả lập di chuyển</span>
        <button 
          className="toggle-collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? '⊕' : '−'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="simulation-body">
          <div className="coords-display">
            Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
          </div>

          {/* ✨ FORM NHẬP TỌA ĐỘ MỚI */}
          <form onSubmit={handleApplyCoords} className="coord-input-form">
            <div className="coord-input-group">
              <input
                type="number" step="any" name="lat"
                value={inputCoords.lat} onChange={handleInputChange}
                placeholder="Vĩ độ"
              />
              <input
                type="number" step="any" name="lng"
                value={inputCoords.lng} onChange={handleInputChange}
                placeholder="Kinh độ"
              />
            </div>
            <button type="submit" className="btn-apply-coords">Đi đến</button>
          </form>
          <div className="move-controls">
            <button className="north" onClick={() => handleMove(moveStep, 0)} title="Di chuyển lên Bắc">↑</button>
            <button className="west" onClick={() => handleMove(0, -moveStep)} title="Di chuyển sang Tây">←</button>
            <div className="center"></div> 
            <button className="east" onClick={() => handleMove(0, moveStep)} title="Di chuyển sang Đông">→</button>
            <button className="south" onClick={() => handleMove(-moveStep, 0)} title="Di chuyển xuống Nam">↓</button>
          </div>
          <button className="reset-btn" onClick={() => onPositionChange(null)}>
            Reset về vị trí thật
          </button>
        </div>
      )}
    </div>
  );
};

export default SimulationController;