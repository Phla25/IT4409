import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AuthModal from '../pages/AuthModal';
import { useAuth } from '../context/AuthContext';
import API from '../api';

// 👇 SOCKET & TOAST IMPORTS
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MainLayout() {
  const { userRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const SERVER_URL = process.env.REACT_APP_BACK_END_API_URL;
  // 1. Hàm lấy số lượng pending (để dùng lại nhiều lần)
  const fetchPendingCount = async () => {
    if (userRole === 'admin') {
      try {
        const res = await API.get('/locations/admin/pending-count');
        if (res.data.success) {
            setPendingCount(res.data.count);
        }
      } catch (err) {
        console.error("Lỗi lấy thông báo:", err);
      }
    }
  };

  // 2. useEffect xử lý Socket
  useEffect(() => {
    fetchPendingCount(); // Gọi lần đầu

    let socket = null;
    if (userRole === 'admin') {
        socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });
        
        socket.on('connect', () => {
            socket.emit('join_admin_room'); 
        });

        // 1. Sự kiện có bài mới (Tăng số)
        socket.on('new_proposal', (data) => {
            toast.info(data.message, { theme: "colored" });
            fetchPendingCount();
        });

        // 👇 2. THÊM MỚI: Sự kiện khi Duyệt hoặc Xóa xong (Giảm số)
        socket.on('refresh_pending_count', () => {
            console.log("♻️ Dữ liệu thay đổi, đang cập nhật số lượng...");
            fetchPendingCount(); // Gọi lại hàm đếm để cập nhật số mới
        });
    }

    return () => { if (socket) socket.disconnect(); };
  }, [userRole]);
  return (
    <div className="app-container">
      {/* Container chứa các thông báo Toast bay ra */}
      <ToastContainer />

      <Header 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpenAuth={() => setShowAuthModal(true)}
        pendingCount={pendingCount} 
      />

      <div className="body-container">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onCloseMobile={() => setIsSidebarOpen(false)} 
          pendingCount={pendingCount}
        />
        
        <main className="main-content">
          <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
            <Outlet />
          </div> 
        </main>
      </div>

      <Footer />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}