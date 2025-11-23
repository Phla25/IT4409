import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components & Pages
import MainLayout from './components/MainLayout';
import LeafletMapComponent from './MapContainer';
// 👇 Đảm bảo đường dẫn này đúng với máy bạn (src/LocationCRUD.js hay src/pages/LocationCRUD.js?)
import LocationCRUD from './pages/LocationCRUD'; 
import LocationDetailPage from './pages/LocationDetailPage.jsx'; // ✨ THÊM DÒNG NÀY
import LandingPage from './pages/LandingPage.jsx';
import ProtectedRoute from './components/ProtectedRoute';

import { AuthProvider, useAuth } from './context/AuthContext';

// --- TRANG BÁO LỖI QUYỀN (Component nhỏ nội bộ) ---
function UnauthorizedPage() {
  return (
    <div style={{ padding: 50, textAlign: 'center', marginTop: 50 }}>
      <h1>⛔ Truy cập bị từ chối</h1>
      <p>Bạn cần quyền <b>Quản trị viên (Admin)</b> để truy cập trang này.</p>
      <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>Quay lại trang chủ</a>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  // Nếu chưa đăng nhập -> Hiện Landing Page
  if (!user) {
    return <LandingPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Mặc định hiện Map */}
        <Route index element={<LeafletMapComponent />} />

        {/* ✨ THÊM ROUTE CHO TRANG CHI TIẾT */}
        <Route path="locations/:id" element={<LocationDetailPage />} />
        
        {/* Route Admin được bảo vệ */}
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requiredRole="admin">
               <div style={{ padding: '20px', overflowY: 'auto', height: '100%', width: '100%' }}>
                  {/* Render bảng quản lý */}
                  <LocationCRUD />
               </div>
            </ProtectedRoute>
          } 
        />
        
        {/* 👇 THÊM ROUTE NÀY */}
        <Route path="unauthorized" element={<UnauthorizedPage />} />

        {/* Catch-all: Về trang chủ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
         <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;