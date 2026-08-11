export {
  COOKIE_NAME,
  ONE_YEAR_MS,
  UNAUTHED_ERR_MSG,
  NOT_ADMIN_ERR_MSG,
} from "@shared/const";

/** Navigate to the email/password login page. */
export const startLogin = () => {
  window.location.href = "/login";
};
