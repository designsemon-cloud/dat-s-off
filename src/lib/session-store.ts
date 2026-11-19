import { useSyncExternalStore } from "react";
import type { Session } from "./session-types";

// Sessions live in this browser only (IndexedDB — screenshots as data URLs are
// too large for localStorage's ~5MB quota). An in-memory cache backs the React
// hooks; every write goes to the cache first, then to IndexedDB.

const DB_NAME = "datsoff";
const STORE = "sessions";

const cache = new Map<string, Session>();
let loaded = false;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
let snapshot: { loaded: boolean; sessions: Session[] } = { loaded: false, sessions: [] };

function emit() {
  snapshot = {
    loaded,
    sessions: [...cache.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  };
  listeners.forEach((l) => l());
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function ensureLoaded() {
  if (typeof window === "undefined" || loadPromise) return loadPromise;
  loadPromise = tx<Session[]>("readonly", (s) => s.getAll() as IDBRequest<Session[]>)
    .then((all) => {
      // Merge rather than replace: a session created before the load
      // finished (e.g. straight from the landing composer) must survive.
      for (const s of all) if (!cache.has(s.id)) cache.set(s.id, s);
    })
    .catch(() => {
      // Private mode / blocked storage: run in-memory for this tab.
    })
    .finally(() => {
      loaded = true;
      emit();
    });
  return loadPromise;
}

function persist(session: Session) {
  if (session.readOnly) return;
  tx("readwrite", (s) => s.put(session)).catch(() => {});
}

export const sessionStore = {
  ready: () => ensureLoaded() ?? Promise.resolve(),
  get: (id: string) => cache.get(id),
  create(session: Session) {
    cache.set(session.id, session);
    persist(session);
    emit();
  },
  update(id: string, updater: (s: Session) => Session) {
    const current = cache.get(id);
    if (!current) return;
    const next = { ...updater(current), updatedAt: new Date().toISOString() };
    cache.set(id, next);
    persist(next);
    emit();
  },
  remove(id: string) {
    cache.delete(id);
    tx("readwrite", (s) => s.delete(id)).catch(() => {});
    emit();
  },
  clear() {
    cache.clear();
    tx("readwrite", (s) => s.clear()).catch(() => {});
    emit();
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureLoaded();
  return () => listeners.delete(listener);
}

const serverSnapshot = { loaded: false, sessions: [] as Session[] };

export function useSessions() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnapshot,
  );
}

export function useSession(id: string) {
  const { loaded: isLoaded, sessions } = useSessions();
  return { loaded: isLoaded, session: sessions.find((s) => s.id === id) };
}
