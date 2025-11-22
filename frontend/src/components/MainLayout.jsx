import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; // 👈 QUAN TRỌNG: Phải import cái này
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AuthModal from '../pages/AuthModal';

// ❌ Đừng import LeafletMapComponent ở đây!
// import LeafletMapComponent from '../MapContainer'; 

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="app-container">
      <Header 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <div className="body-container">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onCloseMobile={() => setIsSidebarOpen(false)} 
        />
        
        <main className="main-content">
          {/* 🔴 SAI: Nếu bạn để <LeafletMapComponent /> ở đây, 
             nó sẽ luôn hiện map dù bạn sang trang admin.
          */}

          {/* 🟢 ĐÚNG: Dùng Outlet. 
             - Nếu url là "/" -> Outlet sẽ hiện Map.
             - Nếu url là "/admin" -> Outlet sẽ hiện LocationCRUD.
          */}
          <Outlet /> 
        </main>
      </div>

      <Footer />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}