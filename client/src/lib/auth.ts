export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
};

const STORAGE_KEY = "visstya.auth.user.v1";

export const GUEST_USER: AuthUser = {
  id: "guest",
  name: "Guest",
  email: "",
  isGuest: true,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable
  }
  emit();
}

export const authStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getUser(): AuthUser {
    return readUser() ?? GUEST_USER;
  },

  isGuest(): boolean {
    const current = readUser();
    return current === null || current.isGuest === true;
  },

  updateProfile(patch: Partial<Pick<AuthUser, "name" | "email">>) {
    const current = readUser();
    const guest = current === null;

    const name = patch.name?.trim() || current?.name || "Guest";
    const email = patch.email?.trim().toLowerCase() || current?.email || "";
    const upgraded = guest && Boolean(name && email);

    const next: AuthUser = {
      id: upgraded ? email : current?.id ?? "guest",
      name,
      email,
      isGuest: guest ? !upgraded : false,
    };

    writeUser(next);
    return next;
  },
};
