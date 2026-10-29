import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LANGUAGE_STORAGE_KEY,
  currentLanguage,
  localeFor,
  setRuntimeLanguage,
  tr,
  type Language,
} from "@/i18n/runtime";

interface LanguageContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const TITLE_SOURCE = "Oskemen Culture — открой свой город";
const DESCRIPTION_SOURCE =
  "Oskemen Culture — открой свой город. Места, события и маршруты Өскемена в одном пространстве.";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(currentLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    document.title = tr(TITLE_SOURCE, undefined, language);
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", tr(DESCRIPTION_SOURCE, undefined, language));
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    if (next === currentLanguage()) return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    setRuntimeLanguage(next);
    setLanguageState(next);
    document.documentElement.lang = next;
    // A reload guarantees that seed data, module-level navigation labels and
    // Intl formatters all switch together with the interface.
    window.location.reload();
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, locale: localeFor(language), setLanguage }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
