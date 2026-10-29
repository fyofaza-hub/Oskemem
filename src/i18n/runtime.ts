import { translations } from "@/i18n/dictionary";

export type Language = "ru" | "kk" | "en";

export const LANGUAGES: Array<{ id: Language; label: string; short: string; locale: string }> = [
  { id: "ru", label: "Русский", short: "RU", locale: "ru-RU" },
  { id: "kk", label: "Қазақша", short: "KK", locale: "kk-KZ" },
  { id: "en", label: "English", short: "EN", locale: "en-US" },
];

export const LANGUAGE_STORAGE_KEY = "oskemen-language";

const isLanguage = (value: string | null | undefined): value is Language =>
  value === "ru" || value === "kk" || value === "en";

function detectLanguage(): Language {
  if (typeof window === "undefined") return "ru";
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(stored) ? stored : "ru";
}

let activeLanguage: Language = detectLanguage();

export const currentLanguage = () => activeLanguage;

export const setRuntimeLanguage = (language: Language) => {
  activeLanguage = language;
};

export const localeFor = (language: Language = activeLanguage) =>
  LANGUAGES.find((item) => item.id === language)?.locale ?? "ru-RU";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Looks up a Russian source string in the active locale.
 * Keys are trimmed while outer whitespace is preserved, so phrases split by
 * inline JSX keep their original spacing.
 */
export const tr = (
  source: string,
  variables?: Record<string, string | number>,
  language: Language = activeLanguage,
) => {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  const key = source.trim();
  if (!key) return source;
  let value = key;
  if (language !== "ru") {
    value = translations[language][key] ?? key;
  }
  if (variables) {
    for (const [name, replacement] of Object.entries(variables)) {
      value = value.replace(new RegExp(`\\{${escapeRegExp(name)}\\}`, "g"), String(replacement));
    }
  }
  return `${leading}${value}${trailing}`;
};

export const languageName = (language: Language = activeLanguage) =>
  LANGUAGES.find((item) => item.id === language)?.label ?? "Русский";
