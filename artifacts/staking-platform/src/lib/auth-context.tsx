import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getToken, clearToken, apiMe, type AuthUser } from "./auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await apiMe();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setAuthTokenGetter(null);
  }, []);

  useEffect(() => {
    // Wire up the API client to use our JWT token
    setAuthTokenGetter(() => Promise.resolve(getToken() ?? ""));

    apiMe().then((me) => {
      setUser(me);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth(): AuthCtx {
  return useContext(AuthContext);
}

export function useAppUser(): AuthUser | null {
  return useContext(AuthContext).user;
}
