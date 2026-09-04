import React, { createContext, useContext, useState, useEffect } from "react";
import { RequesterUser } from "../api.js";

interface RequesterContextType {
  currentRequester: RequesterUser | null;
  setCurrentRequester: (user: RequesterUser | null) => void;
  isSelectorOpen: boolean;
  setIsSelectorOpen: (open: boolean) => void;
  openSelector: () => void;
  closeSelector: () => void;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

const STORAGE_KEY = "toktickit_active_requester";

export function RequesterProvider({ children }: { children: React.ReactNode }) {
  const [currentRequester, setCurrentRequesterState] = useState<RequesterUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(!currentRequester);

  useEffect(() => {
    if (!currentRequester) {
      setIsSelectorOpen(true);
    }
  }, [currentRequester]);

  const setCurrentRequester = (user: RequesterUser | null) => {
    setCurrentRequesterState(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      setIsSelectorOpen(false);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setIsSelectorOpen(true);
    }
  };

  const openSelector = () => setIsSelectorOpen(true);
  const closeSelector = () => {
    if (currentRequester) {
      setIsSelectorOpen(false);
    }
  };

  return (
    <RequesterContext.Provider
      value={{
        currentRequester,
        setCurrentRequester,
        isSelectorOpen,
        setIsSelectorOpen,
        openSelector,
        closeSelector,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester(): RequesterContextType {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
