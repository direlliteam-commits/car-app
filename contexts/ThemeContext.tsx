import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setGlobalLanguage, getSystemLanguage, type AppLanguage } from "@/lib/i18n";

export type { AppLanguage } from "@/lib/i18n";
export type ThemeMode = "system" | "light" | "dark";
export type DisplayCurrency = "USD" | "AMD" | "RUB" | "EUR";

const THEME_STORAGE_KEY = "auto_armenia_theme";
const LANGUAGE_STORAGE_KEY = "auto_armenia_language";
const CURRENCY_STORAGE_KEY = "auto_armenia_display_currency";

interface ThemeStateValue {
  themeMode: ThemeMode;
  resolvedScheme: "light" | "dark";
  language: AppLanguage;
  displayCurrency: DisplayCurrency;
}

interface ThemeActionsValue {
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: AppLanguage) => void;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
}

interface ThemeContextValue extends ThemeStateValue, ThemeActionsValue {}

const ThemeStateContext = createContext<ThemeStateValue | null>(null);
const ThemeActionsContext = createContext<ThemeActionsValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [language, setLanguageState] = useState<AppLanguage>(() => getSystemLanguage());
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>("USD");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedTheme, savedLang, savedCurrency] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
          AsyncStorage.getItem(CURRENCY_STORAGE_KEY),
        ]);
        if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
          setThemeModeState(savedTheme);
        }
        if (savedLang === "ru" || savedLang === "hy" || savedLang === "en") {
          setLanguageState(savedLang);
          setGlobalLanguage(savedLang);
        } else {
          const sysLang = getSystemLanguage();
          setGlobalLanguage(sysLang);
        }
        if (savedCurrency === "USD" || savedCurrency === "AMD" || savedCurrency === "RUB" || savedCurrency === "EUR") {
          setDisplayCurrencyState(savedCurrency);
        }
      } catch (e) {
        console.error("Failed to load theme/language prefs:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
  }, []);

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    setLanguageState(lang);
    setGlobalLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.error("Failed to save language:", e);
    }
  }, []);

  const setDisplayCurrency = useCallback(async (currency: DisplayCurrency) => {
    setDisplayCurrencyState(currency);
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch (e) {
      console.error("Failed to save currency:", e);
    }
  }, []);

  const resolvedScheme = useMemo<"light" | "dark">(() => {
    if (themeMode === "system") {
      return systemScheme === "dark" ? "dark" : "light";
    }
    return themeMode;
  }, [themeMode, systemScheme]);

  const stateValue = useMemo<ThemeStateValue>(() => ({
    themeMode,
    resolvedScheme,
    language,
    displayCurrency,
  }), [themeMode, resolvedScheme, language, displayCurrency]);

  const actionsValue = useMemo<ThemeActionsValue>(() => ({
    setThemeMode,
    setLanguage,
    setDisplayCurrency,
  }), [setThemeMode, setLanguage, setDisplayCurrency]);

  const defaultState = useMemo<ThemeStateValue>(() => ({
    themeMode: "system",
    resolvedScheme: systemScheme === "dark" ? "dark" : "light",
    language: getSystemLanguage(),
    displayCurrency: "USD",
  }), [systemScheme]);

  const defaultActions = useMemo<ThemeActionsValue>(() => ({
    setThemeMode: () => {},
    setLanguage: () => {},
    setDisplayCurrency: () => {},
  }), []);

  return (
    <ThemeStateContext.Provider value={loaded ? stateValue : defaultState}>
      <ThemeActionsContext.Provider value={loaded ? actionsValue : defaultActions}>
        {children}
      </ThemeActionsContext.Provider>
    </ThemeStateContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const state = useContext(ThemeStateContext);
  const actions = useContext(ThemeActionsContext);
  if (!state || !actions) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

export function useThemeState(): ThemeStateValue {
  const context = useContext(ThemeStateContext);
  if (!context) {
    throw new Error("useThemeState must be used within a ThemeProvider");
  }
  return context;
}

export function useThemeActions(): ThemeActionsValue {
  const context = useContext(ThemeActionsContext);
  if (!context) {
    throw new Error("useThemeActions must be used within a ThemeProvider");
  }
  return context;
}

export function useAppColorScheme(): "light" | "dark" {
  const systemScheme = useSystemColorScheme();
  const context = useContext(ThemeStateContext);
  if (!context) {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return context.resolvedScheme;
}
