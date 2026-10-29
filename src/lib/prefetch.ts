/**
 * Точечный prefetch чанков страниц: пользовательское превью моментально.
 * Тяжёлые страницы (карта с leaflet, конструктор маршрутов) сознательно
 * не прогреваются — их код не должен тратиться, если пользователь
 * к ним так и не перейдёт.
 */

type PrefetchFn = () => Promise<unknown>;

const lightPages: Record<string, PrefetchFn> = {
  guide: () => import("@/pages/GuidePage"),
  plan: () => import("@/pages/PlanPage"),
  feed: () => import("@/pages/FeedPage"),
  events: () => import("@/pages/EventsPage"),
  navigation: () => import("@/pages/NavigationPage"),
};

const pending = new Set<string>();

const onIdle = (callback: () => void) => {
  const scope = window as unknown as {
    requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => void;
  };
  if (typeof scope.requestIdleCallback === "function") {
    scope.requestIdleCallback(callback, { timeout: 4000 });
  } else {
    window.setTimeout(callback, 1200);
  }
};

export function prefetchOnIdle(pages: string[] = ["guide", "plan", "feed", "events"]): void {
  if (typeof window === "undefined") return;
  onIdle(() => {
    for (const key of pages) {
      const load = lightPages[key];
      if (!load || pending.has(key)) continue;
      pending.add(key);
      void load().catch(() => {
        // Сетевые сбои prefetch не критичны — страница загрузится при переходе.
        pending.delete(key);
      });
    }
  });
}
