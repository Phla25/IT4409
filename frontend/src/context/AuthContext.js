// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Thay thế bằng logic lấy Token thực tế sau khi Login
  const [authToken, setAuthToken] = useState(
    'MOCK_ADMIN_TOKEN_HERE' 
    // Ghi chú: Bạn PHẢI thay thế chuỗi này bằng một token JWT hợp lệ 
    // sau khi đăng nhập Admin (POST /api/auth/login) để test CRUD thành công.
  );
  
  // Vai trò được gắn trực tiếp vào Token
  const [userRole, setUserRole] = useState('admin'); 

  // Hàm để lấy headers (cần cho mọi yêu cầu CRUD)
  const authHeaders = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  const login = (token, role) => {
    setAuthToken(token);
    setUserRole(role);
  };
  
  const logout = () => {
    setAuthToken(null);
    setUserRole('user');
  };


  return (
    <AuthContext.Provider value={{ 
      authToken, 
      userRole, 
      authHeaders,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};