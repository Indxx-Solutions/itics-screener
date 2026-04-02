import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import type { AuthState } from "./../interfaces/auth";
import { LEVEL_1, LEVEL_2, LEVEL_3 } from "./../constants/constants";
import { postMethodApi } from "../utils/commonAxios";
import {
  LOGOUT_API,
  NEW_PASSWORD_API,
  OTP_API,
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
      login: async (email: string, _password: string) => {
        set((state) => {
          state.loading = true;
          state.isSpinning = true;
          state.error = null;
          state.authError = null;
        });

        try {
          // Bypassing real authentication for development/testing
          const mockData: any = {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            tenant_id: "mock-tenant-id",
            role: LEVEL_1, // Defaulting to Admin access
            name: email.split("@")[0] || "User",
            idToken: {
              jwtToken: "mock-id-token",
              payload: {
                profile: "Admin",
                name: email.split("@")[0] || "User",
                email: email,
              },
            },
            accessToken: {
              jwtToken: "mock-access-token",
            },
          };

          const data = mockData;
          const accesstoken = data.access_token;
          const refreshtoken = data.refresh_token;
          const tenentID = data.tenant_id;
          const role = data.role;
          const name = data.name;

          // Store in sessionStorage
          sessionStorage.setItem("role", role);
          sessionStorage.setItem("email", email);
          sessionStorage.setItem("AccessToken", accesstoken);
          sessionStorage.setItem("TenantID", tenentID);
          sessionStorage.setItem("RefreshToken", refreshtoken);
          sessionStorage.setItem("name", name);
          sessionStorage.setItem("isAuthenticated", "true");

          // Update store state
          set((state) => {
            state.user = data;
            state.token = accesstoken;
            state.isAnalyst = role === LEVEL_3;
            state.isQA = role === LEVEL_2;
            state.isAdmin = role === LEVEL_1;
            state.loading = false;
            state.isSpinning = false;
            state.error = null;
            state.authError = null;
          });
        } catch (error: any) {
          console.error("Error in mock login", error);
          set((state) => {
            state.loading = false;
            state.isSpinning = false;
            state.error = "Login failed";
          });
          throw error;
        }
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

      // Replace the existing logout implementation with this one inside useAuthStore
      logout: async () => {
        try {
          // Option A — send access token only (keeps current behavior)
          // const accessToken = sessionStorage.getItem('AccessToken');
          // const params: { [k: string]: any } = {};
          // if (accessToken) params.access_token = accessToken;
          // await postMethodApi(LOGOUT_API, params);

          // Option B — send no token at all (use this if your backend expects an empty body)
          await postMethodApi(LOGOUT_API, {
            access_token: sessionStorage.getItem("AccessToken"),
          });

          // ALWAYS clear client session (localStorage + sessionStorage) and reset store
          sessionStorage.clear();
          localStorage.clear();
        } catch (serverErr: any) {
          // If server responded with 401 -> treat as refresh-token problem and go to login
          const status = serverErr?.response?.status;
          console.warn("Server logout failed:", serverErr);

          try {
            // still clear client storage
            sessionStorage.clear();
            localStorage.clear();
          } catch (e) {
            /* ignore */
          }

          if (status === 401) {
            // Explicit redirect to login when server returns 401
            // (This avoids relying on React Router inside the store.)
            window.location.href = "/login";
          }

          // Continue to reset store state below (so client UI is cleaned up)
        } finally {
          // reset store and clear storage (clientSideLogout does both)
          clientSideLogout(false); // pass false to not redirect twice if you prefer
          // If you want to redirect here:
          // clientSideLogout(true)
        }

        // Reset the zustand store state (always run)
        set((state) => {
          state.user = null;
          state.token = null;
          state.loading = false;
          state.isSpinning = false;
          state.error = null;
          state.authError = null;
          state.isAdmin = false;
          state.isQA = false;
          state.isAnalyst = false;
          state.showSessionExpiredModal = false;
          state.sessionExpiredMessage = "";
        });
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