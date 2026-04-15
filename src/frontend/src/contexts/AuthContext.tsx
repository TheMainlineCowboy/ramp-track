import { type ReactNode, createContext, useContext, useState } from "react";

export interface AuthState {
  username: string;
  badge: string;
  roles: string[];
  loginTime: number;
  name: string;
}

interface AuthContextValue {
  auth: AuthState | null;
  login: (params: {
    username: string;
    password: string;
    badge: string;
  }) => Promise<void>;
  badgeLogin: (badgeId: string) => Promise<void>;
  logout: () => void;
  isRefreshing: boolean;
}

const USERS = [
  {
    username: "operator@demo.com",
    password: "test123",
    roles: ["agent"],
    name: "Demo Agent",
  },
  {
    username: "970251",
    password: "admin123",
    roles: ["admin", "agent"],
    name: "Jayson James",
  },
  {
    username: "100001",
    password: "test123",
    roles: ["agent"],
    name: "Demo Agent",
  },
];

const STORAGE_KEY = "ramptrack_auth_state";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async ({
    username,
    password,
    badge,
  }: { username: string; password: string; badge: string }) => {
    const user = USERS.find(
      (u) => u.username === username && u.password === password,
    );
    if (!user)
      throw new Error(
        "Invalid credentials. Please check your email/ID and password.",
      );
    const state: AuthState = {
      username,
      badge,
      roles: user.roles,
      loginTime: Date.now(),
      name: user.name,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setAuth(state);
  };

  const badgeLogin = async (badgeId: string) => {
    let username: string;
    let roles: string[];
    let name: string;
    if (badgeId === "970251" || badgeId === "97025101") {
      username = "Jayson James";
      roles = ["admin", "agent"];
      name = "Jayson James";
    } else {
      username = badgeId;
      roles = ["agent"];
      name = badgeId;
    }
    const state: AuthState = {
      username,
      badge: badgeId,
      roles,
      loginTime: Date.now(),
      name,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setAuth(state);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  };

  return (
    <AuthContext.Provider
      value={{ auth, login, badgeLogin, logout, isRefreshing: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
