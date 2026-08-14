import { authStore, type AuthUser } from "@/lib/auth";
import { useSyncExternalStore } from "react";

export function useAuth() {
  const user = useSyncExternalStore(
    authStore.subscribe,
    authStore.getUser,
    authStore.getUser
  );

  return {
    user,
    loading: false,
    error: null,
    isAuthenticated: false,
    isGuest: Boolean(user?.isGuest),
    refresh: async () => authStore.getUser(),
  };
}

export type { AuthUser };
