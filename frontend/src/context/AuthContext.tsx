import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearToken, getToken, setToken, UserProfile } from "../lib/api";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Core logout: clear token + user state, redirect to /login
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  // On mount: if a token exists, validate it by calling /api/users/me
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => {
        // Token invalid or expired — clear it silently
        clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen for 401 events fired by api.ts when any authenticated request is rejected
  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      navigate("/login", { replace: true });
    }
    window.addEventListener("workpilot:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("workpilot:unauthorized", handleUnauthorized);
  }, [navigate]);

  async function login(email: string, password: string) {
    const { access_token } = await api.login(email, password);
    setToken(access_token);
    const profile = await api.me();
    setUser(profile);
  }

  async function register(fullName: string, email: string, password: string) {
    await api.register(fullName, email, password);
    await login(email, password);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


