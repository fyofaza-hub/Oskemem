import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  formatDateShort,
  normalize,
  pluralizeEvents,
  pluralizePlaces,
  pluralizeRoutes,
  pluralizeStops,
} from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Field";
import { categoryMap } from "@/data/categories";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const suggestions = [tr("набережная"), tr("музей"), tr("кофе"), tr("парк"), tr("театр")];

function ResultGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-3">
      <h3 className="px-3 pb-2 pt-3 text-meta font-medium text-muted">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function ResultRow({
  thumb,
  title,
  meta,
  onClick,
  children,
}: {
  thumb: ReactNode;
  title: string;
  meta: string;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {thumb}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{title}</span>
        <span className="mt-0.5 block truncate text-meta text-muted">{meta}</span>
      </span>
      {children}
      <Icon name="chevronRight" size={15} className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const { events, routes, getUser, places } = useApp();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  const navigate = useNavigate();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const normalized = normalize(query);
  const placeResults = normalized
    ? places
        .filter(
          (place) =>
            normalize(place.name).includes(normalized) ||
            normalize(place.description).includes(normalized) ||
            normalize(place.address).includes(normalized) ||
            place.tags.some((tag) => normalize(tag).includes(normalized)),
        )
        .slice(0, 4)
    : [];
  const eventResults = normalized
    ? events
        .filter(
          (event) =>
            normalize(event.title).includes(normalized) || normalize(event.description).includes(normalized),
        )
        .slice(0, 3)
    : [];
  const routeResults = normalized
    ? routes
        .filter(
          (route) =>
            normalize(route.title).includes(normalized) || normalize(route.description).includes(normalized),
        )
        .slice(0, 3)
    : [];
  const hasResults = placeResults.length + eventResults.length + routeResults.length > 0;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[110] flex justify-center sm:items-start sm:px-6 sm:pt-[10vh]">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-scrim/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={tr("Поиск по городу")}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-hidden bg-surface sm:h-auto sm:max-h-[72vh] sm:rounded-2xl sm:border sm:border-line sm:shadow-raised"
          >
            <div className="flex items-center gap-2 border-b border-line p-3 sm:p-4">
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tr("Место, событие, маршрут или настроение")}
                leadingIcon="search"
                wrapperClassName="flex-1"
                className="h-12 border-transparent bg-sunken pl-11 text-base hover:border-transparent focus:border-accent"
                autoComplete="off"
                aria-label={tr("Поиск по городу")}
              />
              <IconButton icon="close" label={tr("Закрыть поиск")} onClick={onClose} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
              {!normalized ? (
                <div className="px-3 pb-4 pt-3">
                  <p className="mb-3 text-meta font-medium text-muted">{tr("Быстрый старт")}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setQuery(item)}
                        className="chip"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {placeResults.length > 0 ? (
                <ResultGroup title={tr("Места")}>
                  {placeResults.map((place) => (
                    <ResultRow
                      key={place.id}
                      title={place.name}
                      meta={`${categoryMap[place.category].shortLabel} · ${place.address}`}
                      onClick={() => go(`/guide?place=${place.id}`)}
                      thumb={<img src={place.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />}
                    />
                  ))}
                </ResultGroup>
              ) : null}

              {eventResults.length > 0 ? (
                <ResultGroup title={tr("События")}>
                  {eventResults.map((event) => (
                    <ResultRow
                      key={event.id}
                      title={event.title}
                      meta={`${formatDateShort(event.dateISO)} · ${categoryMap[event.category].shortLabel}`}
                      onClick={() => go(`/events?event=${event.id}`)}
                      thumb={
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                          <Icon name="events" size={18} />
                        </span>
                      }
                    />
                  ))}
                </ResultGroup>
              ) : null}

              {routeResults.length > 0 ? (
                <ResultGroup title={tr("Маршруты")}>
                  {routeResults.map((route) => (
                    <ResultRow
                      key={route.id}
                      title={route.title}
                      meta={`${pluralizeStops(route.stops.length)} · ${getUser(route.authorId)?.name ?? tr("Городской автор")}`}
                      onClick={() => go(`/routes/${route.id}`)}
                      thumb={<img src={route.cover} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />}
                    />
                  ))}
                </ResultGroup>
              ) : null}

              {normalized && !hasResults ? (
                <div className="px-4 py-12 text-center">
                  <p className="font-display text-lg font-semibold text-fg">{tr("Ничего не нашлось")}</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                    {tr("Попробуйте «набережная», «кофе» или «музей». Или откройте весь гид и посмотрите подборку.")}
                  </p>
                  <Button variant="secondary" size="sm" className="mt-5" onClick={() => go("/guide")}>
                    {tr("Открыть гид")}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="hidden items-center justify-between border-t border-line px-5 py-3 text-meta text-muted sm:flex">
              <span>
                {pluralizePlaces(places.length)} · {pluralizeEvents(events.length)} · {pluralizeRoutes(routes.length)}
              </span>
              <span className="kbd">Esc</span>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
