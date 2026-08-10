import { useSyncExternalStore } from "react";
import {
  getMockStoreVersion,
  mockStore,
  subscribeMockStore,
} from "./store";
import type { VerificationReport } from "./types";

export function useMockReports(): VerificationReport[] {
  useSyncExternalStore(subscribeMockStore, getMockStoreVersion, getMockStoreVersion);
  return mockStore.list();
}
