import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Ваши палитры в духе Bear: одна светлая + четыре «дорогих» тёмных. */
export type Theme = "light" | "charcoal" | "solarized-dark" | "panic-mode" | "gotham";

const LIGHT_THEME: Theme = "light";
/** Тема по умолчанию, если сохранённого выбора нет (та же «чистая» тёмная, что была и раньше). */
const DEFAULT_DARK: Theme = "charcoal";

const DARK_THEMES: readonly Theme[] = ["charcoal", "solarized-dark", "panic-mode", "gotham"];

export const isDarkTheme = (theme: Theme): boolean => theme !== LIGHT_THEME;

const STORAGE_KEY = "oskemen-theme";
const THEME_COLORS: Record<Theme, string> = {
  light: "#F8FAFC",
  charcoal: "#1C1C1E",
  "solarized-dark": "#002B36",
  "panic-mode": "#12141C",
  gotham: "#0F131A",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isTheme = (value: string | null | undefined): value is Theme =>
  value === "light" ||
  value === "charcoal" ||
  value === "solarized-dark" ||
  value === "panic-mode" ||
  value === "gotham";

/** Старые сборки сохраняли просто "dark" — считаем это Charcoal. */
function normalizeTheme(value: string | null | undefined): Theme | null {
  if (value === "dark") return "charcoal";
  return isTheme(value) ? value : null;
}

function systemTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_DARK;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? LIGHT_THEME : DEFAULT_DARK;
}

function initialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_DARK;
  const stored = normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
  return stored ?? systemTheme();
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === LIGHT_THEME ? "light" : "dark";
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLORS[theme];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!media) return;
    const onChange = (event: MediaQueryListEvent) => {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
      setThemeState(event.matches ? LIGHT_THEME : DEFAULT_DARK);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isLight: theme === LIGHT_THEME, isDark: theme !== LIGHT_THEME, setTheme }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

interface ThemeContextValue {
  theme: Theme;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
/** Все темы и их инлайн-палитры для превью в переключателе. */
export const THEME_SWATCHES: Record<Theme, readonly [string, string, string]> = {
  light: ["#F8FAFC", "#FFFFFF", "#FF6B35"],
  charcoal: ["#1C1C1E", "#2C2C2E", "#FF8457"],
  "solarized-dark": ["#002B36", "#073642", "#F06E32"],
  "panic-mode": ["#12141C", "#1A1D28", "#5CBEFF"],
  gotham: ["#0F131A", "#161B22", "#68A0FF"],
};

export { DARK_THEMES, LIGHT_THEME };
