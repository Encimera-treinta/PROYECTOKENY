"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  /* Al montar: respeta la preferencia guardada o del sistema. */
  useEffect(() => {
    const stored = window.localStorage.getItem("sportcrz-theme");

    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  /* Aplica el atributo y persiste. */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("sportcrz-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
