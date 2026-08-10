import { SEED_REPORTS } from "./data";
import type { VerificationReport } from "./types";

const STORAGE_KEY = "vistai.mock.reports.v1";
const SEEDS_HIDDEN_KEY = "vistai.mock.seedsHidden.v1";

const cache = new Map<number, VerificationReport>();
const listeners = new Set<() => void>();
let version = 0;
let listCache: VerificationReport[] | null = null;
let hydrated = false;

function emit() {
  listCache = null;
  version += 1;
  listeners.forEach((listener) => listener());
}

function loadPersisted(): VerificationReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VerificationReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hydrateCache() {
  if (hydrated) return;
  hydrated = true;
  loadPersisted().forEach((r) => {
    if (!cache.has(r.id)) cache.set(r.id, r);
  });
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(cache.values())));
  } catch {
    // storage unavailable (e.g. quota) — the in-memory cache keeps reports
    // available for the current session regardless
  }
}

function seedsHidden(): boolean {
  try {
    return localStorage.getItem(SEEDS_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function setSeedsHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(SEEDS_HIDDEN_KEY, "1");
    else localStorage.removeItem(SEEDS_HIDDEN_KEY);
  } catch {
    // ignore
  }
}

function all(): VerificationReport[] {
  hydrateCache();
  if (listCache) return listCache;

  const seen = new Set<number>();
  const result: VerificationReport[] = [];

  Array.from(cache.values()).forEach((r) => {
    result.push(r);
    seen.add(r.id);
  });
  if (!seedsHidden()) {
    SEED_REPORTS.forEach((r) => {
      if (!seen.has(r.id)) {
        result.push(r);
        seen.add(r.id);
      }
    });
  }

  listCache = result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return listCache;
}

export function subscribeMockStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMockStoreVersion(): number {
  return version;
}

export const mockStore = {
  list(): VerificationReport[] {
    return all();
  },

  getById(id: number | string): VerificationReport | undefined {
    const num = Number(id);
    return all().find((r) => r.id === num);
  },

  getByShareToken(token: string): VerificationReport | undefined {
    return all().find((r) => r.shareToken === token);
  },

  create(report: VerificationReport): VerificationReport {
    hydrateCache();
    cache.set(report.id, report);
    persist();
    emit();
    return report;
  },

  /** Removes user-created reports only; demo seed reports remain. */
  clearCreated() {
    cache.clear();
    hydrated = true;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    emit();
  },

  /** Removes all local verification data, including demo seeds from this browser. */
  clearAll() {
    cache.clear();
    hydrated = true;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSeedsHidden(true);
    emit();
  },

  /** Restores demo seed reports after a full wipe (optional). */
  restoreSeeds() {
    setSeedsHidden(false);
    emit();
  },

  exportJson(): string {
    return JSON.stringify(all(), null, 2);
  },
};
