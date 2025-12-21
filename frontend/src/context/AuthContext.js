import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // 1. Sử dụng Lazy Initialization: (Function trong useState)
  // Giúp React chỉ truy cập localStorage 1 lần khi khởi tạo, tăng hiệu năng.
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('role') || 'guest');
  
  // 2. FIX LỖI CRASH JSON: Bọc trong Try-Catch
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      
      // Kiểm tra kỹ các trường hợp dữ liệu rác
      if (!savedUser || savedUser === "undefined" || savedUser === "null") {
        return null;
      }
      
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Dữ liệu User trong LocalStorage bị lỗi, đang reset...", error);
      // Nếu dữ liệu hỏng, xóa đi để lần sau không bị lỗi nữa
      localStorage.removeItem('user');
      return null;
    }
  });

  // Hàm Login
  const login = (token, role, userData) => {
    setAuthToken(token);
    setUserRole(role);
    setUser(userData);

    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    
    // Kiểm tra userData trước khi lưu để tránh lưu chuỗi "undefined"
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // Hàm Logout
  const logout = () => {
    setAuthToken(null);
    setUserRole('guest');
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('username'); // Xóa sạch các key liên quan
    
    // Optional: Reload trang để clear state sạch sẽ
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ authToken, userRole, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};