import { useAuthStore } from "../stores/authStore";

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isQA = useAuthStore((state) => state.isQA);
  const isAnalyst = useAuthStore((state) => state.isAnalyst);
  const authError = useAuthStore((state) => state.authError);
  const isSpinning = useAuthStore((state) => state.isSpinning);

  const login = useAuthStore((state) => state.login);
  const otp = useAuthStore((state) => state.otp);
  const setnewpassword = useAuthStore((state) => state.setnewpassword);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);
  const resetError = useAuthStore((state) => state.resetError);
  const setSpinning = useAuthStore((state) => state.setSpinning);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  return {
    user,
    token,
    loading,
    error,
    isAdmin,
    isQA,
    isAnalyst,
    authError,
    isSpinning,
    login,
    otp,
    setnewpassword,
    logout,
    clearError,
    resetError,
    setSpinning,
    setAuthError,
  };
};