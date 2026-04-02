import axios, { type AxiosResponse, type AxiosRequestConfig } from "axios";
import { clientSideLogout } from "./session";

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
  return localStorage.getItem("AccessToken") || sessionStorage.getItem("AccessToken");
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
// LOGOUT HELPER (disabled during dev bypass)
// ============================================
const forceLogout = (reason: string = "Session expired") => {
  console.warn(`⚠️ FORCE LOGOUT: ${reason}`);
  clientSideLogout(true);
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
      forceLogout("Token expired");
      throw error;
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