export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Navigate to the email/password login page. */
export const startLogin = () => {
  window.location.href = "/login";
};
