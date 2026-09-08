"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildInitialState } from "./seed";
import type {
  AlertItem,
  AppState,
  ChatMessage,
  Defect,
  IotDevice,
  Machine,
  QcReport,
  User,
} from "./types";

const DATA_KEY = "texvision.data.v1";
const SESSION_KEY = "texvision.session.v1";

type Entity = "defects" | "machines" | "devices" | "reports" | "users" | "alerts";

interface StoreValue extends AppState {
  ready: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;

  addDefect: (d: Defect) => void;
  updateDefect: (id: string, patch: Partial<Defect>) => void;
  removeDefect: (id: string) => void;

  addMachine: (m: Machine) => void;
  updateMachine: (id: string, patch: Partial<Machine>) => void;
  removeMachine: (id: string) => void;

  addDevice: (d: IotDevice) => void;
  updateDevice: (id: string, patch: Partial<IotDevice>) => void;
  removeDevice: (id: string) => void;

  addReport: (r: QcReport) => void;
  updateReport: (id: string, patch: Partial<QcReport>) => void;
  removeReport: (id: string) => void;

  addUser: (u: User) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  removeUser: (id: string) => void;

  pushAlert: (a: AlertItem) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;

  pushChat: (m: ChatMessage) => void;
  resetChat: () => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildInitialState());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  /* ---------------------------------------------------- hydrate from disk */
  // localStorage is an external store that cannot be read during SSR, so the
  // one-shot restore has to happen after mount. It runs once on mount and never
  // again, so it cannot cascade.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DATA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        // Merge so a schema addition does not blank the app out.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((prev) => ({ ...prev, ...parsed }));
      }
      const session = window.localStorage.getItem(SESSION_KEY);
      if (session) {
        const { email } = JSON.parse(session) as { email: string };
        const base = raw ? (JSON.parse(raw) as AppState) : null;
        const users = base?.users ?? buildInitialState().users;
        setCurrentUser(users.find((u) => u.email === email) ?? null);
      }
    } catch {
      /* corrupted storage - fall back to seed */
    }
    setReady(true);
  }, []);

  /* ------------------------------------------------------ persist changes */
  // Debounced: the live inspection page can append a defect every second, and
  // serialising the whole store on each one is wasted work.
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DATA_KEY, JSON.stringify(state));
      } catch {
        /* quota exceeded - the in-memory store still works */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [state, ready]);

  const upsert = useCallback(
    <K extends Entity>(key: K, item: AppState[K][number]) => {
      setState((s) => ({ ...s, [key]: [item, ...(s[key] as unknown[])] } as AppState));
    },
    [],
  );

  const patch = useCallback(
    <K extends Entity>(key: K, id: string, changes: Partial<AppState[K][number]>) => {
      setState(
        (s) =>
          ({
            ...s,
            [key]: (s[key] as { id: string }[]).map((it) =>
              it.id === id ? { ...it, ...changes } : it,
            ),
          }) as AppState,
      );
    },
    [],
  );

  const drop = useCallback((key: Entity, id: string) => {
    setState(
      (s) =>
        ({ ...s, [key]: (s[key] as { id: string }[]).filter((it) => it.id !== id) }) as AppState,
    );
  }, []);

  const login: StoreValue["login"] = useCallback(
    (email, password) => {
      const user = state.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!user) return { ok: false, error: "No account found for that email." };
      if (user.password !== password) return { ok: false, error: "Incorrect password." };
      if (!user.active) return { ok: false, error: "This account has been deactivated." };
      setCurrentUser(user);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
      return { ok: true };
    },
    [state.users],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const resetAll = useCallback(() => {
    const fresh = buildInitialState();
    setState(fresh);
    window.localStorage.setItem(DATA_KEY, JSON.stringify(fresh));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ready,
      currentUser,
      login,
      logout,
      addDefect: (d) => upsert("defects", d),
      updateDefect: (id, p) => patch("defects", id, p),
      removeDefect: (id) => drop("defects", id),
      addMachine: (m) => upsert("machines", m),
      updateMachine: (id, p) => patch("machines", id, p),
      removeMachine: (id) => drop("machines", id),
      addDevice: (d) => upsert("devices", d),
      updateDevice: (id, p) => patch("devices", id, p),
      removeDevice: (id) => drop("devices", id),
      addReport: (r) => upsert("reports", r),
      updateReport: (id, p) => patch("reports", id, p),
      removeReport: (id) => drop("reports", id),
      addUser: (u) => upsert("users", u),
      updateUser: (id, p) => patch("users", id, p),
      removeUser: (id) => drop("users", id),
      pushAlert: (a) => upsert("alerts", a),
      acknowledgeAlert: (id) => patch("alerts", id, { acknowledged: true }),
      clearAlerts: () => setState((s) => ({ ...s, alerts: [] })),
      pushChat: (m) => setState((s) => ({ ...s, chat: [...s.chat, m] })),
      resetChat: () => setState((s) => ({ ...s, chat: [] })),
      resetAll,
    }),
    [state, ready, currentUser, login, logout, upsert, patch, drop, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
