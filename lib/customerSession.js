export const SIGNUP_SESSION_KEY = "customerSignupSession";
export const AUTH_REDIRECT_KEY = "customerAuthRedirect";

export const hasFullCustomerAuth = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  const customerUser = localStorage.getItem("customerUser");
  return Boolean(token && customerUser);
};

export const setSignupSession = (payload = {}) => {
  if (typeof window === "undefined") return;
  const session = { createdAt: Date.now(), ...payload };
  sessionStorage.setItem(SIGNUP_SESSION_KEY, JSON.stringify(session));
};

export const hasSignupSession = () => {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(SIGNUP_SESSION_KEY));
};

export const clearSignupSession = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SIGNUP_SESSION_KEY);
};

export const hasBrowseAccess = () => hasFullCustomerAuth() || hasSignupSession();

export const setAuthRedirect = (path) => {
  if (typeof window === "undefined") return;
  if (!path) return;
  sessionStorage.setItem(AUTH_REDIRECT_KEY, path);
};

export const consumeAuthRedirect = () => {
  if (typeof window === "undefined") return "";
  const path = sessionStorage.getItem(AUTH_REDIRECT_KEY) || "";
  if (path) {
    sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  }
  return path;
};

export const clearAuthRedirect = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
};
