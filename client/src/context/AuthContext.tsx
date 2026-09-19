import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, getToken, clearToken, login as apiLogin, logout as apiLogout, getMe, changePassword as apiChangePassword } from "../api.js";

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from token
  const loadUser = useCallback(async () => {
    const existingToken = getToken();
    if (!existingToken) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const user = await getMe();
      setCurrentUser(user);
    } catch {
      clearToken();
      setTokenState(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiLogin(email, password);
    setTokenState(data.token);
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiLogout();
    } finally {
      clearToken();
      setTokenState(null);
      setCurrentUser(null);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> => {
    const data = await apiChangePassword(currentPassword, newPassword, confirmPassword);
    setCurrentUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        isAuthenticated: !!currentUser,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
