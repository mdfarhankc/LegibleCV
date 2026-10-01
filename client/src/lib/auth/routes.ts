export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const UPDATE_PASSWORD_PATH = "/update-password";
export const SETTINGS_PATH = "/settings";
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

const PROTECTED_PREFIXES = ["/dashboard", "/editor", SETTINGS_PATH, UPDATE_PASSWORD_PATH];
const GUEST_ONLY_PATHS = [LOGIN_PATH, SIGNUP_PATH, FORGOT_PASSWORD_PATH];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.includes(pathname);
}
