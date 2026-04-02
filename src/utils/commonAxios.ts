import { REFRESH_TOKEN_API } from "./../assets/entpoint";
import axios, { type AxiosResponse, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";

interface ApiParams {
  [key: string]: any;
}

interface StandardizedError {
  message: string;
  status?: number;
  isServerError: boolean;
  originalError: any;
}

// ============================================
// Helpers
// ============================================

const getAccessToken = (): string | null => {
  return sessionStorage.getItem("AccessToken");
};

const getHeaders = (overrides: { [key: string]: any } = {}) => {
  const accessToken = getAccessToken();

  const baseHeaders: { [key: string]: any } = {
    ...overrides,
  };

  if (accessToken) {
    baseHeaders.Authorization = `Bearer ${accessToken}`;
  }

  return baseHeaders;
};

// ============================================
// LOGOUT HELPER
// ============================================
const forceLogout = async (reason: string = "Session expired") => {
  console.warn(`⚠️ FORCE LOGOUT TRIGGERED: ${reason}`);

  // Clear storage immediately
  try {
    sessionStorage.clear();
    localStorage.clear();
  } catch (e) {
    console.warn("Error clearing storage", e);
  }

  // Reset zustand store
  try {
    const authStore = useAuthStore.getState();
    authStore.setSpinning(false);
    authStore.clearError();
  } catch (e) {
    console.warn("Error resetting auth store", e);
  }

  // Redirect to login
  globalThis.location.href = "/login";
};

// ============================================
// TOKEN REFRESH MECHANISM
// ============================================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = sessionStorage.getItem("RefreshToken");

  if (!refreshToken) {
    console.warn("❌ No refresh token available");
    await forceLogout("No refresh token available");
    throw new Error("No refresh token available");
  }

  try {

    console.log("🔄 Attempting to refresh access token...");

    const response = await axios.post(
      REFRESH_TOKEN_API,
      {
        refresh_token: refreshToken,
        email: sessionStorage.getItem("email"),
      },
      {
        headers: {
          "Content-Type": "application/json",

        },
      },
    );

    // Check if response is successful (200-299)
    if (response.status >= 200 && response.status < 300) {
      const newAccessToken =
        response.data.access_token ?? response.data.accessToken;
      const newRefreshToken =
        response.data.refresh_token ?? response.data.refreshToken;

      if (!newAccessToken) {
        console.warn(
          "❌ Refresh API succeeded but no access token in response",
        );
        await forceLogout("Invalid refresh response");
        throw new Error("Refresh did not return access token");
      }

      sessionStorage.setItem("AccessToken", newAccessToken);
      if (newRefreshToken) {
        sessionStorage.setItem("RefreshToken", newRefreshToken);
      }

      console.log("✅ Token refreshed successfully");
      return newAccessToken;
    } else {
      // If refresh API returns non-200 status, logout immediately
      console.warn(
        `❌ Refresh API returned non-200 status: ${response.status}`,
      );
      await forceLogout(`Token refresh failed (status: ${response.status})`);
      throw new Error(`Refresh failed with status: ${response.status}`);
    }
  } catch (err: any) {
    console.error("❌ Refresh token failed:", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });

    // ANY refresh failure means the session is invalid - logout immediately
    const statusCode = err?.response?.status || "network error";
    await forceLogout(`Token refresh failed (${statusCode})`);

    throw err;
  }
};

// ============================================
// CENTRALIZED ERROR HANDLER
// ============================================
const handleApiError = (error: any): StandardizedError => {
  const status = error.response?.status;
  const data = error.response?.data;

  let errorMessage = "Something went wrong. Please try again.";

  if (data) {
    if (typeof data === "string") {
      errorMessage = data;
    } else if (data.message) {
      errorMessage = data.message;
    } else if (data.error) {
      errorMessage = data.error;
    } else if (data.file && Array.isArray(data.file)) {
      errorMessage = data.file.join(", ");
    } else if (typeof data === "object") {
      // Handle cases where data is an object of field errors, e.g., { "fieldname": ["Error message"] }
      const firstError = Object.values(data)[0];
      if (Array.isArray(firstError)) {
        errorMessage = firstError[0];
      } else if (typeof firstError === "string") {
        errorMessage = firstError;
      }
    }
  } else if (error.message) {
    errorMessage = error.message;
  }

  return {
    message: errorMessage,
    status: status,
    isServerError: status >= 500,
    originalError: error,
  };
};

// ============================================
// MAIN REQUEST WRAPPER
// ============================================
const makeRequest = async (
  config: AxiosRequestConfig,
  retryAttempt = 0,
): Promise<AxiosResponse> => {
  try {
    config.headers = {
      ...getHeaders(config.headers as any),
      ...(config.headers || {}),
    };

    const response = await axios(config);
    return response;
  } catch (error: any) {
    const status = error?.response?.status;

    // Handle 401 - Unauthorized (token expired)
    if (status === 401) {
      console.warn("⚠️ Received 401 - Token expired");

      // Only attempt refresh once
      if (retryAttempt > 0) {
        console.warn("❌ Already tried refreshing, logging out");
        await forceLogout("Token refresh failed");
        throw error;
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        console.log("⏳ Token refresh in progress, queuing request...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            config.headers = {
              ...getHeaders(config.headers as any),
              Authorization: `Bearer ${token}`,
            };
            return makeRequest(config, retryAttempt + 1);
          })
          .catch((err) => {
            throw err;
          });
      }

      // Start refresh process
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);

        // Retry the original request with new token
        config.headers = {
          ...getHeaders(config.headers as any),
          Authorization: `Bearer ${newToken}`,
        };

        return await makeRequest(config, retryAttempt + 1);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        // forceLogout already called in refreshAccessToken
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 - Forbidden
    if (status === 403) {
      console.warn("⚠️ Received 403 - Access forbidden");
      await forceLogout("Access forbidden");
      throw error;
    }

    // Handle 400 with invalid_grant (Cognito error)
    if (status === 400) {
      const body = error?.response?.data;
      const isInvalidGrant =
        body?.detail?.error === "invalid_grant" ||
        body?.error === "invalid_grant" ||
        body?.message === "Cognito error" ||
        body?.error_description === "Invalid grant";

      if (isInvalidGrant) {
        console.warn("⚠️ Received 400 invalid_grant - Token expired");
        await forceLogout("Invalid grant error - token expired");
        throw error;
      }
    }

    // For all other errors, just throw
    throw error;
  }
};

// ============================================
// API METHODS WITH CENTRALIZED ERROR HANDLING
// ============================================

export const postMethodApi = (
  Url: string,
  params: ApiParams,
): Promise<AxiosResponse> => {
  return makeRequest({
    method: "POST",
    url: Url,
    headers: getHeaders(),
    data: params,
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch((error) => {
    throw handleApiError(error);
  });
};

export const postFileUploadApi = (
  url: string,
  file: File,
  extraHeaders?: { [key: string]: string },
): Promise<AxiosResponse> => {
  if (!file) throw new Error("File is required for upload");
  if (!url) throw new Error("URL is required for upload");

  const formData = new FormData();
  formData.append("file", file);

  if (extraHeaders) {
    Object.keys(extraHeaders).forEach((key) => {
      if (key.startsWith("form-")) {
        const fieldName = key.replace("form-", "");
        const value = extraHeaders[key];
        formData.append(fieldName, value);
      }
    });
  }

  return makeRequest({
    method: "POST",
    url: url,
    headers: getHeaders({ Accept: "application/json" }),
    data: formData,
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch((error) => {
    throw handleApiError(error);
  });
};

export const postFileUploadApiMinimal = (
  url: string,
  file: File,
): Promise<AxiosResponse> => {
  if (!file) throw new Error("File is required for upload");
  if (!url) throw new Error("URL is required for upload");

  const formData = new FormData();
  formData.append("file", file);

  return makeRequest({
    method: "POST",
    url: url,
    headers: getHeaders({ Accept: "application/json" }),
    data: formData,
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch((error) => {
    throw handleApiError(error);
  });
};

export const putMethodApi = (
  Url: string,
  params: ApiParams,
): Promise<AxiosResponse> => {
  return makeRequest({
    method: "PUT",
    url: Url,
    headers: getHeaders(),
    data: params,
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch((error) => {
    throw handleApiError(error);
  });
};

export const patchMethodApi = (
  Url: string,
  params: ApiParams,
): Promise<AxiosResponse> => {
  return makeRequest({
    method: "PATCH",
    url: Url,
    headers: getHeaders(),
    data: params,
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch((error) => {
    throw handleApiError(error);
  });
};

export const downloadPostMethodApi = (
  Url: string,
  params: ApiParams,
): Promise<AxiosResponse> => {
  return makeRequest({
    method: "POST",
    responseType: "blob",
    url: Url,
    data: params,
    headers: getHeaders({ Accept: "application/*" }),
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch(async (error) => {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text);
      } catch (e) {
        // Not a JSON blob, keep original
      }
    }
    throw handleApiError(error);
  });
};

export const downloadGetMethodApi = (Url: string): Promise<AxiosResponse> => {
  return makeRequest({
    method: "GET",
    responseType: "blob",
    url: Url,
    headers: getHeaders({ Accept: "application/*" }),
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch(async (error) => {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text);
      } catch (e) {
        // Not a JSON blob, keep original
      }
    }
    throw handleApiError(error);
  });
};

export const getMethodApi = (
  Url: string,
  params?: ApiParams,
): Promise<AxiosResponse> => {
  return makeRequest({
    method: "GET",
    url: Url,
    headers: getHeaders(),
    params: params,
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch((error) => {
    throw handleApiError(error);
  });
};

export const deleteMethodApi = (
  Url: string,
  params?: ApiParams,
): Promise<AxiosResponse> => {
  return makeRequest({
    method: "DELETE",
    url: Url,
    headers: getHeaders(),
    data: params,
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch((error) => {
    throw handleApiError(error);
  });
};

export const postFileUploadApiNew = (
  url: string,
  file: File,
  extraHeaders?: Record<string, any>,
): Promise<AxiosResponse> => {
  if (!file) throw new Error("File is required for upload");
  if (!url) throw new Error("URL is required for upload");

  const formData = new FormData();
  formData.append("file", file);

  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // ✅ FIXED: Send array as SINGLE JSON string
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
  }

  return makeRequest({
    method: "POST",
    url: url,
    headers: getHeaders({ Accept: "application/json" }),
    data: formData,
    validateStatus: (status) => status >= 200 && status < 300,
  }).catch((error) => {
    throw handleApiError(error);
  });
};