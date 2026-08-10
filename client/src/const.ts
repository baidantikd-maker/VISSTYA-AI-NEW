import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = () => {
  // Redirect to Google OAuth endpoint
  window.location.href = "/api/auth/google";
};
