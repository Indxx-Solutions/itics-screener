import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginSignup from './pages/Screener/loginSignup';
import Screener from './pages/Screener/screener';

function App() {
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";

  return (
    <BrowserRouter>
      <Routes>
        {/* Default route is Login, but redirect if already authenticated */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/screener" replace /> : <LoginSignup />} 
        />
        
        {/* Alias for login */}
        <Route path="/login" element={<LoginSignup />} />
        
        {/* Screener route after login */}
        <Route path="/screener" element={<Screener />} />
        
        {/* Fallback to login or screener based on auth */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/screener" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;