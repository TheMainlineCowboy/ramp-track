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
    username: "100001",
    password: "test123",
    roles: ["agent"],
    name: "Demo Agent",
  },
  // Generic agent demo account
  {
    username: "agent@ramptrack.com",
    password: "test123",
    roles: ["agent"],
    name: "Agent",
  },
  // Manager accounts
  {
    username: "970251",
    password: "admin123",
    roles: ["admin", "agent"],
    name: "Jayson James",
  },
  {
    username: "906779",
    password: "admin123",
    roles: ["admin"],
    name: "Ramon",
  },
  {
    username: "259254",
    password: "admin123",
    roles: ["admin"],
    name: "Geoffrey",
  },
  {
    username: "255580",
    password: "admin123",
    roles: ["admin"],
    name: "Ernie",
  },
  {
    username: "812329",
    password: "admin123",
    roles: ["admin"],
    name: "Joshua",
  },
  {
    username: "933130",
    password: "admin123",
    roles: ["admin"],
    name: "Wendy",
  },
  {
    username: "792631",
    password: "admin123",
    roles: ["admin"],
    name: "Valentine",
  },
  {
    username: "218231",
    password: "admin123",
    roles: ["admin"],
    name: "Connor",
  },
  {
    username: "222857",
    password: "admin123",
    roles: ["admin"],
    name: "Christopher",
  },
  {
    username: "264789",
    password: "admin123",
    roles: ["admin"],
    name: "Anthony",
  },
  {
    username: "583943",
    password: "admin123",
    roles: ["admin"],
    name: "Mike",
  },
  {
    username: "878288",
    password: "admin123",
    roles: ["admin"],
    name: "Rebecca",
  },
  {
    username: "215760",
    password: "admin123",
    roles: ["admin"],
    name: "Jeremy",
  },
  {
    username: "206289",
    password: "admin123",
    roles: ["admin"],
    name: "Archie",
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
    // Extract longest digit sequence from the scanned badge value
    const digitMatches = badgeId.match(/\d+/g);
    const longestDigits = digitMatches
      ? digitMatches.reduce((a, b) => (a.length >= b.length ? a : b), "")
      : badgeId;

    // Check against USERS roster — find any user whose username (employee ID) matches
    // or is contained within the extracted digit sequence
    const matchedUser = USERS.find(
      (u) =>
        /^\d+$/.test(u.username) &&
        (longestDigits === u.username ||
          longestDigits.includes(u.username) ||
          u.username.includes(longestDigits)),
    );

    let username: string;
    let roles: string[];
    let name: string;

    if (matchedUser) {
      username = matchedUser.username;
      roles = matchedUser.roles;
      name = matchedUser.name;
    } else if (badgeId === "970251" || badgeId === "97025101") {
      // Fallback hardcoded Jayson check for backwards compatibility
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
