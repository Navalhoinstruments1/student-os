"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "dracula";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("student-os-theme") as Theme;
    
    // Otimização: Só atualiza se o tema guardado for diferente do inicial
    if (savedTheme && savedTheme !== "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
    }
    
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, isMounted]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("student-os-theme", newTheme);
  };

  if (!isMounted) {
    return (
      <ThemeContext.Provider value={{ theme: "dark", setTheme: handleSetTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme tem de ser usado dentro do ThemeProvider");
  }
  return context;
};