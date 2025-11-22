import React, { useState, useEffect, useRef } from 'react';

const SimulationController = ({ initialPosition, onPositionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false); // State để quản lý việc ẩn/hiện
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState({ x: 20, y: 150 });
  const panelRef = useRef(null);

  // Cập nhật vị trí nội bộ khi vị trí ban đầu thay đổi
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const handleMove = (latChange, lngChange) => {
    const newPos = {
      lat: position.lat + latChange,
      lng: position.lng + lngChange,
    };
    setPosition(newPos);
    onPositionChange(newPos);
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