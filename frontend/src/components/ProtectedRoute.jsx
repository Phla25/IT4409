import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  // Context cũ của bạn trả về: { authToken, userRole, user, ... }
  const { authToken, userRole } = useAuth(); 

  // Debug để xem nó nhận được gì (F12 -> Console)
  console.log("🛡️ Protected Check:", { authToken, userRole, requiredRole });

  // Kiểm tra đăng nhập
  if (!authToken) {
      return <Navigate to="/" replace />;
  }

  // Kiểm tra quyền (Nếu yêu cầu admin mà userRole không phải admin)
  if (requiredRole && userRole !== requiredRole) {
    console.warn("⛔ Sai quyền! Chuyển hướng sang Unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}