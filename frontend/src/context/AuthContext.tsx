import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api, getApiErrorMessage } from "../lib/apiClient";
import { Role } from "../lib/roles";

export interface AuthUser {
  id: string;
  rmsCode: string;
  username: string;
  fullName: string;
  department: string;
  position: string | null;
  role: Role;
  active: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ user: AuthUser }>("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await api.post<{ user: AuthUser }>("/auth/login", { username, password });
      setUser(res.data.user);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "เข้าสู่ระบบไม่สำเร็จ"));
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
