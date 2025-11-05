// frontend/src/App.js (Cập nhật)
import React from 'react';
import './App.css'; 
import LeafletMapComponent from './MapContainer';
import LocationCRUD from './LocationCRUD'; // <-- Sẽ tạo sau
import { AuthProvider } from './context/AuthContext'; // <-- Import AuthProvider

function App() {
  return (
    <AuthProvider> {/* Bọc toàn bộ ứng dụng */}
      <div className="App">
        <header className="App-header">
          <h1>Bản đồ Ẩm thực Hà Nội </h1>
        </header>
        {/* Component CRUD chỉ dành cho Admin */}
        <LocationCRUD /> 
        
        <div style={{ padding: '20px' }}>
          <LeafletMapComponent />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;