import { useEffect, useState } from "react";
import { LANGUAGE_KEY, THEME_KEY } from "../lib/constants";
import type { Language, ThemeMode } from "../lib/types";

export function usePreferences() {
  const [language, setLanguageState] = useState<Language>(
    () => (window.localStorage.getItem(LANGUAGE_KEY) as Language) || "zh",
  );
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (window.localStorage.getItem(THEME_KEY) as ThemeMode) || "light",
  );

  function setLanguage(language: Language) {
    setLanguageState(language);
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }

  function setTheme(theme: ThemeMode) {
    setThemeState(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [theme, language]);

  return { language, setLanguage, theme, setTheme, isDark: theme === "dark" };
}
