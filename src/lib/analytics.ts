/**
 * Тонкий слой веб-аналитики. Готов к подключению GTM/gtag/Plausible:
 * события всегда идут в window.dataLayer (протокол GTM), а данные
 * самого приложения от provider-скрипта не зависят.
 *
 * Подключение в продакшене: добавьте сниппет GTM/Plausible в <head>
 * и при желании расширьте track() для других провайдеров.
 */

type AnalyticsPayload = Record<string, string | number | boolean>;

export type AnalyticsEvent =
  /** Регистрация завершена. */
  | "auth_register"
  /** Вход в аккаунт. */
  | "auth_login"
  /** Место добавлено или убрано из избранного. */
  | "place_favorite"
  /** Место добавлено в черновик маршрута. */
  | "place_in_route"
  /** Место добавлено сообществом на карту. */
  | "place_added"
  /** Прилетел ответ голосового подбора. */
  | "voice_match"
  /** Пост отправлен в ленту. */
  | "post_created";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...payload });
  if (import.meta.env.DEV) {
    // В разработке события видны в консоли — удобно проверять точки конверсий.
    console.debug("[analytics]", event, payload);
  }
}
