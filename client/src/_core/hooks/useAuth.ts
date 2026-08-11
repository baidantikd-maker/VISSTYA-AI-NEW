import { startLogin } from "@/const";
import { authStore, type AuthUser } from "@/lib/auth";
import { useCallback, useEffect, useSyncExternalStore } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};

  const user = useSyncExternalStore(
    authStore.subscribe,
    authStore.getUser,
    authStore.getUser
  );

  const logout = useCallback(async () => {
    authStore.signOut();
  }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [redirectOnUnauthenticated, redirectPath, user]);

  return {
    user,
    loading: false,
    error: null,
    isAuthenticated: Boolean(user && !user.isGuest),
    isGuest: Boolean(user?.isGuest),
    refresh: async () => authStore.getUser(),
    logout,
  };
}

export type { AuthUser };
