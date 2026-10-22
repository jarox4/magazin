import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { apiGetMe } from '../api/client';

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiGetMe().then(u => { setUser(u); setLoading(false); })
        .catch(() => { localStorage.removeItem('token'); setToken(null); setLoading(false); });
    } else { setLoading(false); }
  }, [token]);

  const login = (tok: string, u: User) => {
    localStorage.setItem('token', tok);
    setToken(tok); setUser(u);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null); setUser(null);
  };

  return <Ctx.Provider value={{ user, token, login, logout, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
