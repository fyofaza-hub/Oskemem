import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  getSessionUser,
  onSupabaseAuthChange,
  buildAppUserFromAuthUser,
  type SupabaseAuthUser,
} from "@/lib/supabase";

/**
 * Шаг 1 · Мост сессии Supabase ↔ AppContext.
 *
 * • при загрузке приложения читает supabase.auth.getSession() и ставит
 *   Google-профиля в текущего пользователя (шапка автоматически меняет
 *   кнопку «Войти» на аватар);
 * • подписывается на onAuthStateChange — редиректы, refresh и выход
 *   обновляют интерфейс без перезагрузки;
 * • повторные сессии не «слетают»: persistSession + autoRefreshToken
 *   включены в клиенте.
 */
export function SupabaseSessionSync() {
  const { setSupabaseUser } = useApp();

  useEffect(() => {
    if (!supabaseConfiguredSafe()) {
      return;
    }
    let cancelled = false;

    void (async () => {
      const user = await getSessionUser();
      if (cancelled) return;
      setSupabaseUser(user ? buildAppUserFromAuthUser(user) : null);
    })();

    const subscription = onSupabaseAuthChange((user: SupabaseAuthUser | null) => {
      if (cancelled) return;
      setSupabaseUser(user ? buildAppUserFromAuthUser(user) : null);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [setSupabaseUser]);

  return null;
}

function supabaseConfiguredSafe(): boolean {
  try {
    // Ленивый импорт избегаем: supabase.ts сам гасит ошибки без ключей
    return Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
  } catch {
    return false;
  }
}
