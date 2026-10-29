import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { tr } from "@/i18n/runtime";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";

const TOUR_DONE_KEY = "oskemen-tour-done-v1";
const TOUR_REQUEST_KEY = "oskemen-tour-request";
const TOUR_EVENT = "oskemen-tour-request";

interface TourStep {
  path: string;
  selector: string;
  title: string;
  text: string;
}

const steps: TourStep[] = [
  {
    path: "/",
    selector: '[data-tour="plan-cta"]',
    title: tr("Куда сходить?"),
    text: tr("Создайте персональный план вечера по компании, бюджету и настроению — за пару кликов."),
  },
  {
    path: "/map",
    selector: '[data-tour="map-canvas"]',
    title: tr("Карта города"),
    text: tr("Все локации Усть-Каменогорска на одной карте: точки, маршруты и свои места."),
  },
  {
    path: "/routes",
    selector: '[data-tour="routes"]',
    title: tr("Готовые маршруты"),
    text: tr("Подборки прогулок от жителей: сохраняйте понравившиеся или берите за основу своё."),
  },
  {
    path: "/events",
    selector: '[data-tour="events"]',
    title: tr("Афиша города"),
    text: tr("События на ближайшие недели — повод выйти уже сегодня."),
  },
  {
    path: "/profile?tab=favorites",
    selector: '[data-tour="favorites"]',
    title: tr("Избранное"),
    text: tr("Всё, что отмечено сердечком, подождёт вас в профиле."),
  },
];

const isTourDone = () => {
  try {
    return window.localStorage.getItem(TOUR_DONE_KEY) === "1";
  } catch {
    return false;
  }
};

/** Пометить тур пройденным в localStorage. */
export const markTourDone = () => {
  try {
    window.localStorage.setItem(TOUR_DONE_KEY, "1");
    window.localStorage.removeItem(TOUR_REQUEST_KEY);
  } catch {
    /* приватный режим — тур не запоминается */
  }
};

/** Запросить запуск тура (после регистрации или из профиля). */
export const requestTour = () => {
  try {
    window.localStorage.removeItem(TOUR_DONE_KEY);
    window.localStorage.setItem(TOUR_REQUEST_KEY, "1");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(TOUR_EVENT));
};

interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingGateApi {
  /** true — действие разрешено; false — обучение не пройдено, показана модалка. */
  gate: () => boolean;
  startTour: () => void;
}

/**
 * Гейт-синглтон вместо React Context: устойчив к порядку монтирования
 * и дублированию модулей; без провайдера возвращает разрешение.
 */
let gateApi: OnboardingGateApi | null = null;

export const setOnboardingGateApi = (api: OnboardingGateApi | null) => {
  gateApi = api;
};

export const onboardingGate: OnboardingGateApi = {
  gate: () => gateApi ? gateApi.gate() : true,
  startTour: () => gateApi ? gateApi.startTour() : undefined,
};

interface OnboardingProviderProps {
  children: ReactNode;
}

/** Провайдер онбординга: тур с подсветкой, гейтинг и мягкая модалка-приглашение. */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    onboarded,
    completeOnboarding,
  } = useApp();

  const [active, setActive] = useState<number | null>(null);
  const [rect, setRect] = useState<TourRect | null>(null);
  const [blocked, setBlocked] = useState(false);

  /** Завершение/пропуск: устраняет гейтинг (профиль + localStorage). */
  const finish = useCallback(() => {
    markTourDone();
    completeOnboarding();
    setActive(null);
    setRect(null);
    setBlocked(false);
  }, [completeOnboarding]);

  const startTour = useCallback(() => {
    setBlocked(false);
    setActive(0);
  }, []);

  /** Ворот для интерактивных действий маршрутов, избранного и публикаций. */
  const gate = useCallback((): boolean => {
    if (onboarded) return true;
    setBlocked(true);
    return false;
  }, [onboarded]);

  // Регистрируем gate-API в синглтоне на всё время жизни провайдера.
  useEffect(() => {
    setOnboardingGateApi({ gate, startTour });
    return () => setOnboardingGateApi(null);
  }, [gate, startTour]);


  // Автозапуск: флаг запроса после регистрации либо новый аккаунт (isOnboarded=false).
  useEffect(() => {
    const tryAutoStart = () => {
      let requested = false;
      try {
        requested = window.localStorage.getItem(TOUR_REQUEST_KEY) === "1";
      } catch {
        requested = false;
      }
      const freshUser = Boolean(currentUser) && !onboarded;
      if ((!requested || isTourDone()) && !freshUser) return;
      if (active !== null) return;
      try {
        window.localStorage.removeItem(TOUR_REQUEST_KEY);
      } catch {
        /* ignore */
      }
      setActive(0);
    };
    tryAutoStart();
    window.addEventListener(TOUR_EVENT, tryAutoStart);
    return () => window.removeEventListener(TOUR_EVENT, tryAutoStart);
  }, [location.pathname, currentUser, onboarded, active]);

  // Навигация к странице шага и замер цели.
  useEffect(() => {
    if (active === null) return;
    setRect(null);
    const target = steps[active];
    let cancelled = false;
    let attempts = 0;
    const waitForElement = () => {
      if (cancelled) return;
      attempts += 1;
      const element = document.querySelector(target.selector);
      if (element) {
        const box = element.getBoundingClientRect();
        setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
        return;
      }
      if (attempts >= 24) {
        setRect(null);
        return;
      }
      window.setTimeout(waitForElement, 140);
    };
    if (location.pathname + location.search !== target.path) {
      navigate(target.path);
      window.setTimeout(waitForElement, 320);
    } else {
      window.setTimeout(waitForElement, 220);
    }
    const remeasure = () => {
      const element = document.querySelector(target.selector);
      if (!element) return;
      const box = element.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, location.pathname, location.search]);

  useEffect(() => {
    if (active === null) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  const step = active !== null ? steps[active] : null;
  const isLast = active === steps.length - 1;

  const spot = rect
    ? {
        top: Math.max(8, rect.top - 10),
        left: Math.max(8, rect.left - 10),
        width: Math.min(window.innerWidth - 16, rect.width + 20),
        height: Math.min(window.innerHeight - 16, rect.height + 20),
      }
    : {
        top: window.innerHeight / 2 - 70,
        left: window.innerWidth / 2 - 90,
        width: 180,
        height: 140,
      };

  const tipWidth = Math.min(340, window.innerWidth - 32);
  const spaceBelow = window.innerHeight - (spot.top + spot.height);
  const tipTop = spaceBelow > 200 ? spot.top + spot.height + 12 : Math.max(12, spot.top - 220);
  const tipLeft = Math.min(Math.max(16, spot.left), window.innerWidth - tipWidth - 16);

  return (
    <>
      {children}

      {step && active !== null ? (
        <>
          <motion.div
            key="tour-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-0 z-[150]"
            role="dialog"
            aria-label={tr("Обучение: как пользоваться сайтом")}
          >
            <div
              aria-hidden="true"
              className="absolute rounded-2xl ring-2 ring-accent transition-all duration-300 ease-smooth"
              style={{
                top: spot.top,
                left: spot.left,
                width: spot.width,
                height: spot.height,
                boxShadow: "0 0 0 9999px rgb(var(--scrim) / 0.62)",
              }}
            />
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto absolute z-[151] max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-surface p-4 shadow-raised"
              style={{ top: tipTop, left: tipLeft, width: tipWidth }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-meta font-medium uppercase tracking-[0.1em] text-accent-ink">
                  {tr("Шаг {n} из {total}", { n: active + 1, total: steps.length })}
                </p>
                <Button variant="ghost" size="sm" onClick={finish} className="h-7 px-2">
                  {tr("Пропустить обучение")}
                </Button>
              </div>
              <h2 className="mt-1.5 font-display text-lg font-semibold text-fg">{step.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {steps.map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-200",
                        index === active ? "w-4 bg-accent" : "w-1.5 bg-faint/40",
                      )}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActive((i) => Math.max(0, (i ?? 0) - 1))}
                    disabled={active === 0}
                  >
                    {tr("Назад")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight="arrowRight"
                    onClick={() => (isLast ? finish() : setActive(active + 1))}
                  >
                    {isLast ? tr("Завершить") : tr("Далее")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      ) : null}

      {/* Мягкая модалка-приглашение при попытке интерактивного действия до обучения */}
      <Modal
        open={blocked}
        onClose={() => setBlocked(false)}
        title={tr("Разблокируйте возможности сайта")}
        description={tr("Создание маршрутов, избранное и публикации откроются сразу после короткого обучения.")}
        size="sm"
      >
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-accent-soft p-3.5">
            <Icon name="guide" size={17} className="mt-0.5 shrink-0 text-accent-ink" />
            <p className="text-sm leading-relaxed text-accent-ink">
              {tr("Пять шагов займут меньше минуты — или пропустите, это тоже настроено.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="md"
              iconRight="arrowRight"
              onClick={() => {
                setBlocked(false);
                startTour();
              }}
            >
              {tr("Пройти обучение")}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setBlocked(false);
                finish();
              }}
            >
              {tr("Пропустить и продолжить")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Компонент-обёртка для AppShell: children + тур и модалка гейтинга. */
export function OnboardingTour({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
