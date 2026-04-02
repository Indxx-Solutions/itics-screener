const authBaseURL = 'http://127.0.0.1:8000/api/v1';

export const BaseUrl = "http://15.206.224.193:8000";

//LOGIN
export const LOGIN_API = authBaseURL + "/login/";
export const LOGOUT_API = authBaseURL + "/logout/";
export const REFRESH_TOKEN_API = authBaseURL + "/refresh_access_token/";
export const OTP_API = authBaseURL + "/auth/password/forgot/";
export const NEW_PASSWORD_API = authBaseURL + "/auth/password/confirm-forgot/";

// User Management
export const GET_ALL_USERS = authBaseURL + "/users/";
export const GET_USER = authBaseURL + "/users/email/"; // + userEmail
export const POST_CREATE_USER = authBaseURL + "/users/";
export const PATCH_CREATE_USER = authBaseURL + "/users/"; // + userEmail
export const PUT_CREATE_USER = authBaseURL + "/users/"; // + userEmail
export const DELETE_USER = authBaseURL + "/users/delete/"; // + userEmail