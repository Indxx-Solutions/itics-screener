import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginSignup from "./pages/LoginPage/loginSignup";
import Screener from "./pages/Screener/screener";
import { useEffect } from "react";
import { checkSessionExpiry } from "./utils/session";

function App() {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  useEffect(() => {
    // Check expiry on mount
    checkSessionExpiry();

    // Optionally check periodically every minute
    const interval = setInterval(checkSessionExpiry, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Default route is Login, but redirect if already authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/screener" replace />
            ) : (
              <LoginSignup />
            )
          }
        />

        {/* Alias for login */}
        <Route path="/login" element={<LoginSignup />} />

        {/* Screener route after login */}
        <Route path="/screener" element={<Screener />} />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/screener" : "/"} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
