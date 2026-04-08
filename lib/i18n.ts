import { useCallback, useSyncExternalStore } from "react";
import { Platform, NativeModules } from "react-native";
import ru from "./locales/ru";
import hy from "./locales/hy";
import en from "./locales/en";
import optionTranslations from "./locales/options";

export type AppLanguage = "ru" | "hy" | "en";

function getNestedValue(obj: any, path: string): string {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return path;
    current = current[key];
  }
  return typeof current === "string" ? current : path;
}

function getNestedRaw(obj: any, path: string): any {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

export function translateRaw(key: string): any {
  const dict = translations[_currentLanguage] || translations.ru;
  const value = getNestedRaw(dict, key);
  if (value !== undefined) return value;
  return getNestedRaw(translations.ru, key);
}

const translations: Record<AppLanguage, typeof ru> = { ru, hy, en };

export function getSystemLanguage(): AppLanguage {
  try {
    let locale = "hy";
    if (Platform.OS === "ios") {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || "hy";
    } else if (Platform.OS === "android") {
      locale = NativeModules.I18nManager?.localeIdentifier || "hy";
    } else if (Platform.OS === "web") {
      locale = (typeof navigator !== "undefined" && navigator.language) || "hy";
    }
    const lang = locale.substring(0, 2).toLowerCase();
    if (lang === "hy") return "hy";
    if (lang === "ru") return "ru";
    if (lang === "en") return "en";
    return "hy";
  } catch {
    return "hy";
  }
}

let _currentLanguage: AppLanguage = getSystemLanguage();
const _listeners = new Set<() => void>();

function _emitChange() {
  _listeners.forEach((fn) => fn());
}

function _subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function _getSnapshot(): AppLanguage {
  return _currentLanguage;
}

export function setGlobalLanguage(lang: AppLanguage) {
  if (_currentLanguage === lang) return;
  _currentLanguage = lang;
  try {
    const { setErrorLanguage } = require("./error-utils");
    setErrorLanguage(lang);
  } catch {}
  _emitChange();
}

export function getGlobalLanguage(): AppLanguage {
  return _currentLanguage;
}

export function translate(key: string): string {
  if (key.startsWith("options.")) {
    const code = key.substring(8);
    const langMap = optionTranslations[_currentLanguage];
    if (langMap && langMap[code]) return langMap[code];
    const ruMap = optionTranslations.ru;
    if (ruMap && ruMap[code]) return ruMap[code];
    return key;
  }
  const dict = translations[_currentLanguage] || translations.ru;
  const value = getNestedValue(dict, key);
  if (value === key) {
    const fallback = getNestedValue(translations.ru, key);
    return fallback !== key ? fallback : key;
  }
  return value;
}

export function useTranslation() {
  const language = useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot);

  const t = useCallback(
    (key: string): string => {
      const dict = translations[language] || translations.ru;
      const value = getNestedValue(dict, key);
      if (value === key) {
        const fallback = getNestedValue(translations.ru, key);
        return fallback !== key ? fallback : key;
      }
      return value;
    },
    [language]
  );

  return { t, language };
}

export { translations };
