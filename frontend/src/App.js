import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import LeafletMapComponent from './MapContainer';
import LocationCRUD from './LocationCRUD'; // Giả định bạn đã có file này
import AuthModal from './pages/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

function Header({ onOpenAuth }) {
  const { user, logout } = useAuth();

  return (
    <header className="App-header">
      <h1>Bản đồ Ẩm thực Hà Nội</h1>
      <div className="header-controls">
        {user ? (
          <div className="user-info">
            <span>Xin chào, <b>{user.username}</b> ({user.role})</span>
            <button onClick={logout} className="logout-btn">Đăng xuất</button>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="login-btn">Đăng nhập / Đăng ký</button>
        )}
      </div>
    </header>
  );
}

function MainLayout() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { userRole } = useAuth();

  return (
    <div className="App">
      <Header onOpenAuth={() => setShowAuthModal(true)} />
      
      {/* Routes Setup */}
      <Routes>
        <Route path="/" element={
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
             {/* Nếu là Admin thì hiển thị bảng CRUD ngay trên Map hoặc tách trang riêng */}
             {/* Ở đây tôi để Admin Dashboard là trang riêng để Map đỡ rối */}
             {userRole === 'admin' && (
                <div style={{ padding: 10, background: '#f0f0f0', textAlign: 'center' }}>
                   <a href="/admin" style={{ fontWeight: 'bold', color: 'red' }}>⚙️ Quản lý địa điểm (CRUD)</a>
                </div>
             )}
             <LeafletMapComponent />
          </div>
        } />

        {/* Route Admin được bảo vệ */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
               <div style={{ padding: 20 }}>
                  <h2>Trang Quản trị Admin</h2>
                  <LocationCRUD /> 
               </div>
            </ProtectedRoute>
          } 
        />

        {/* Route mặc định 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;