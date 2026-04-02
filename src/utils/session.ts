// src/utils/session.ts
import { useAuthStore } from "./../stores/authStore";

export const clearClientSession = () => {
  try {
    sessionStorage.clear();
    localStorage.clear();
  } catch (e) {
    /* ignore */
  }
}

export const clientSideLogout = (redirect = true) => {
  // Clear storages
  clearClientSession()

  // Reset zustand store state (direct setState avoids needing functions from inside the store)
  try {
    useAuthStore.setState({
      user: null,
      token: null,
      loading: false,
      error: null,
      isAdmin: false,
      isQA: false,
      isAnalyst: false,
      authError: null,
      isSpinning: false,
      showSessionExpiredModal: false,
      sessionExpiredMessage: '',
    } as any)
  } catch (e) {
    // If resetting state fails, ignore but still redirect
    console.warn('Failed to reset auth store state', e)
  }

  if (redirect) {
    // Force redirect to login page
    try {
      window.location.href = '/login'
    } catch (e) {
      /* ignore */
    }
  }
}

export const checkSessionExpiry = () => {
  const loginTimestamp = localStorage.getItem("loginTimestamp");
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  if (loginTimestamp && isAuthenticated) {
    const hours = (Date.now() - parseInt(loginTimestamp)) / (1000 * 60 * 60);
    if (hours >= 24) {
      console.warn("Session expired (24h reached)");
      clientSideLogout(true);
      return true;
    }
  }
  return false;
};