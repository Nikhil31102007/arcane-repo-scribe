import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  refresh as apiRefresh,
} from "@/services/api/auth";
import { configureApiClient } from "@/services/api/client";

const REFRESH_STORAGE_KEY = "codeplus.refreshToken";
const SILENT_REFRESH_INTERVAL_MS = 4 * 60 * 1000; // every 4 min while active

interface AuthContextValue {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // accessToken kept in a ref (not state) so we don't re-render on every refresh
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_STORAGE_KEY) : null,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const setRefreshToken = useCallback((token: string | null) => {
    refreshTokenRef.current = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem(REFRESH_STORAGE_KEY, token);
      else localStorage.removeItem(REFRESH_STORAGE_KEY);
    }
  }, []);

  const decodeUsername = (token: string): string | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username ?? `user #${payload.id ?? "?"}`;
    } catch {
      return null;
    }
  };

  const setSession = useCallback(
    (tokens: { accessToken: string; refreshToken: string }) => {
      accessTokenRef.current = tokens.accessToken;
      setRefreshToken(tokens.refreshToken);
      setUsername(decodeUsername(tokens.accessToken));
      setIsAuthenticated(true);
    },
    [setRefreshToken],
  );

  const logout = useCallback(() => {
    accessTokenRef.current = null;
    setRefreshToken(null);
    setUsername(null);
    setIsAuthenticated(false);
  }, [setRefreshToken]);

  const performRefresh = useCallback(async (): Promise<string | null> => {
    const rt = refreshTokenRef.current;
    if (!rt) return null;
    try {
      const tokens = await apiRefresh(rt);
      setSession(tokens);
      return tokens.accessToken;
    } catch {
      logout();
      return null;
    }
  }, [logout, setSession]);

  // Wire interceptor handlers
  useEffect(() => {
    configureApiClient({
      getAccessToken: () => accessTokenRef.current,
      onRefresh: performRefresh,
      onLogout: logout,
    });
  }, [performRefresh, logout]);

  // Bootstrap: try silent refresh from stored refresh token
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (refreshTokenRef.current) {
        await performRefresh();
      }
      if (!cancelled) setIsBootstrapping(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [performRefresh]);

  // Silent refresh loop while user is active and tab is visible
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void performRefresh();
      }
    }, SILENT_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, performRefresh]);

  const login = useCallback(
    async (u: string, p: string) => {
      const tokens = await apiLogin(u, p);
      setSession(tokens);
    },
    [setSession],
  );

  const register = useCallback(
    async (u: string, p: string) => {
      const tokens = await apiRegister(u, p);
      setSession(tokens);
    },
    [setSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isBootstrapping,
      username,
      login,
      register,
      logout,
    }),
    [isAuthenticated, isBootstrapping, username, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
