import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import type { AuthState } from "./../interfaces/auth";
import { postMethodApi } from "../utils/commonAxios";
import {
  NEW_PASSWORD_API,
  OTP_API,
  SEND_OTP_API,
  VERIFY_OTP_API,
} from "./../assets/entpoint";
import { clientSideLogout } from "./../utils/session";

interface AuthError {
  error: string;
  code?: string;
}

interface EnhancedAuthState extends AuthState {
  authError: AuthError | null;
  isSpinning: boolean;
  showSessionExpiredModal: boolean;
  sessionExpiredMessage: string;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  otp: (email: string) => Promise<void>;
  setnewpassword: (
    email: string,
    otp: string,
    password: string,
  ) => Promise<void>;
  sendLoginOtp: (email: string) => Promise<void>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  resetError: () => void;
  setSpinning: (spinning: boolean) => void;
  setAuthError: (error: AuthError | null) => void;
}

export const useAuthStore = create<EnhancedAuthState & AuthActions>()(
  subscribeWithSelector(
    immer((set, _) => ({
      // Initial state
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
      sessionExpiredMessage: "",

      // Login action
      sendLoginOtp: async (email: string) => {
        set((state) => {
          state.loading = true;
          state.isSpinning = true;
          state.error = null;
          state.authError = null;
        });

        try {
          const response = await postMethodApi(SEND_OTP_API, { email });

          if (response.status === 200 || response.status === 201) {
            set((state) => {
              state.loading = false;
              state.isSpinning = false;
            });
          } else {
            throw new Error("Failed to send OTP. Please try again.");
          }
        } catch (error: any) {
          console.error("Error in sendLoginOtp", error);
          const errorMessage =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to send OTP";

          set((state) => {
            state.loading = false;
            state.isSpinning = false;
            state.error = errorMessage;
            state.authError = {
              error: errorMessage,
              code: error?.response?.status?.toString() || "SEND_OTP_ERROR",
            };
          });
          throw error;
        }
      },

      verifyLoginOtp: async (email: string, otp: string) => {
        set((state) => {
          state.loading = true;
          state.isSpinning = true;
          state.error = null;
          state.authError = null;
        });

        try {
          const response = await postMethodApi(VERIFY_OTP_API, { email, otp });

          if (response.status === 200 || response.status === 201) {
            const data = response.data;
            const accesstoken = data.access_token;
            const user = data.user;

            // Store in localStorage for 24h persistence
            localStorage.setItem("email", email);
            localStorage.setItem("AccessToken", accesstoken);
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("loginTimestamp", Date.now().toString());
            if (user) {
              localStorage.setItem("user_id", user.id.toString());
              localStorage.setItem("username", user.username);
            }

            // Update store state
            set((state) => {
              state.user = user;
              state.token = accesstoken;
              state.isAdmin = true; // Defaulting for now, adjust based on user role if available
              state.loading = false;
              state.isSpinning = false;
              state.error = null;
              state.authError = null;
            });
          } else {
            throw new Error("Invalid OTP. Please try again.");
          }
        } catch (error: any) {
          console.error("Error in verifyLoginOtp", error);
          const errorMessage =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.message ||
            "OTP verification failed";

          set((state) => {
            state.loading = false;
            state.isSpinning = false;
            state.error = errorMessage;
            state.authError = {
              error: errorMessage,
              code: error?.response?.status?.toString() || "VERIFY_OTP_ERROR",
            };
          });
          throw error;
        }
      },

      // Keep login for backward compatibility
      login: async () => {
        // This is now effectively replaced by sendLoginOtp/verifyLoginOtp
        console.warn("login() is deprecated. Use sendLoginOtp/verifyLoginOtp.");
      },

      // OTP - Only for forgot password (doesn't set token)
      otp: async (email: string) => {
        set((state) => {
          state.loading = true;
          state.isSpinning = true;
          state.error = null;
          state.authError = null;
        });

        try {
          console.log({ email });

          const params = {
            username: email,
            tool_id: 1,
          };

          const response = await postMethodApi(OTP_API, params);

          if (response.status === 200) {
            // OTP sent successfully - don't set token or user
            set((state) => {
              state.loading = false;
              state.isSpinning = false;
              state.error = null;
              state.authError = null;
            });
          } else {
            throw new Error("OTP request failed. Please try again.");
          }
        } catch (error: any) {
          console.error("Error in OTP", error);
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "OTP request failed";

          set((state) => {
            state.loading = false;
            state.isSpinning = false;
            state.error = errorMessage;
            state.authError = {
              error: errorMessage,
              code: error?.response?.status?.toString() || "OTP_ERROR",
            };
          });
          throw error;
        }
      },

      // SET NEW PASSWORD
      setnewpassword: async (email: string, otp: string, password: string) => {
        try {
          console.log({ email, otp, password });

          // const secretKey = import.meta.env.VITE_SECRET_KEY_HASH;

          // const encryptPassword = (password: string): string => {
          //   return CryptoJS.AES.encrypt(password, secretKey).toString();
          // };

          const encryptedPassword = password;

          const params = {
            username: email,
            code: otp,
            new_password: encryptedPassword,
            tool_id: 1,
          };

          const response = await postMethodApi(NEW_PASSWORD_API, params);

          if (response.status !== 200) {
            throw new Error("Failed to reset password. Please try again.");
          }
        } catch (error: any) {
          console.error("Error in password reset", error);
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Password reset failed";
          console.log(errorMessage);
          throw error;
        }
      },

      // Unified logout implementation
      logout: async () => {
        // Clear all storage and reset store via utility
        clientSideLogout(true);
      },

      // Clear error
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // Reset error
      resetError: () => {
        set((state) => {
          state.authError = null;
          state.error = null;
        });
      },

      // Set spinning state
      setSpinning: (spinning: boolean) => {
        set((state) => {
          state.isSpinning = spinning;
        });
      },

      // Set auth error
      setAuthError: (error: AuthError | null) => {
        set((state) => {
          state.authError = error;
          // Open session expired modal automatically for refresh-expired or missing refresh token
          if (
            error?.code === "REFRESH_EXPIRED" ||
            error?.code === "NO_REFRESH_TOKEN"
          ) {
            state.showSessionExpiredModal = true;
            state.sessionExpiredMessage =
              error.error || "Your session has expired. Please login again.";
          }
        });
      },

      openSessionExpiredModal: (message?: string) => {
        set((state) => {
          state.showSessionExpiredModal = true;
          if (message) state.sessionExpiredMessage = message;
        });
      },
      closeSessionExpiredModal: () => {
        set((state) => {
          state.showSessionExpiredModal = false;
          state.sessionExpiredMessage = "";
        });
      },
    })),
  ),
);