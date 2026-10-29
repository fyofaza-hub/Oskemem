import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CategoryId, CityEvent } from "@/types";
import { categoryMap } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import {
  formatDate,
  formatEventRange,
  isThisWeekend,
  isWithinDays,
  normalize,
  pluralizeEvents,
} from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { EventCard, EventCardSkeleton } from "@/components/events/EventCard";
import { EventDetailModal } from "@/components/events/EventDetailModal";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Bits";
import { Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

type TimeFilter = "all" | "week" | "weekend" | "free";

const timeFilters: Array<{ value: TimeFilter; label: string }> = [
  { value: "all", label: tr("Все") },
  { value: "week", label: tr("7 дней") },
  { value: "weekend", label: tr("Выходные") },
  { value: "free", label: tr("Бесплатно") },
];

const isFreeEvent = (event: CityEvent) => event.priceLabel === tr("Вход свободный");

export function EventsPage() {
  const { events, savedEventIds, placeMap } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [onlySaved, setOnlySaved] = useState(false);
  const ready = useDelayedReady(420);

  const selectedEvent = events.find((event) => event.id === searchParams.get("event")) ?? null;

  const openEvent = (event: CityEvent) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("event", event.id);
        return next;
      },
      { replace: false },
    );
  };

  const closeEvent = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("event");
        return next;
      },
      { replace: false },
    );
  };

  const counts: Record<CategoryId | "all", number> = useMemo(
    () => ({
      all: events.length,
      food: events.filter((event) => event.category === "food").length,
      nature: events.filter((event) => event.category === "nature").length,
      entertainment: events.filter((event) => event.category === "entertainment").length,
      culture: events.filter((event) => event.category === "culture").length,
      sport: events.filter((event) => event.category === "sport").length,
      landmark: events.filter((event) => event.category === "landmark").length,
      leisure: events.filter((event) => event.category === "leisure").length,
    }),
    [events],
  );

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    return [...events]
      .filter((event) => {
        if (category !== "all" && event.category !== category) return false;
        if (onlySaved && !savedEventIds.includes(event.id)) return false;
        if (timeFilter === "week" && !isWithinDays(event.dateISO, 7)) return false;
        if (timeFilter === "weekend" && !isThisWeekend(event.dateISO)) return false;
        if (timeFilter === "free" && !isFreeEvent(event)) return false;
        if (!normalized) return true;
        const place = placeMap[event.placeId];
        return normalize(
          [event.title, event.description, place?.name ?? "", categoryMap[event.category].label].join(" "),
        ).includes(normalized);
      })
      .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
  }, [events, category, onlySaved, savedEventIds, timeFilter, query, placeMap]);

  const nextEvent = useMemo(
    () =>
      [...events]
        .filter((event) => new Date(event.dateISO).getTime() >= Date.now() - 60 * 60 * 1000)
        .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())[0],
    [events],
  );

  const activeFilterCount =
    (query ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (timeFilter !== "all" ? 1 : 0) +
    (onlySaved ? 1 : 0);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setTimeFilter("all");
    setOnlySaved(false);
  };

  return (
    <div className="page-wrap">
      <PageHeader
        dataTour="events"
        title={tr("Афиша города")}
        description={tr("События Өскемена на ближайшие недели: вечера в музее, музыка у воды, маркеты и премьеры.")}
        actions={
          <>
            <Button
              variant={onlySaved ? "primary" : "secondary"}
              icon="bookmark"
              onClick={() => setOnlySaved((value) => !value)}
              aria-pressed={onlySaved}
            >
              {tr("Сохранённые")}
              <span className="tabular-nums opacity-70">{savedEventIds.length}</span>
            </Button>
            <ButtonLink to="/plan" variant="primary" icon="plan">
              {tr("Собрать вечер")}
            </ButtonLink>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="events" size={15} /> {pluralizeEvents(events.length)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="location" size={15} /> {new Set(events.map((event) => event.placeId)).size} {tr("мест")}
        </span>
        {nextEvent ? (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={15} /> {tr("Ближайшее")}:{" "}
            {formatDate(nextEvent.dateISO, { day: "numeric", month: "long" })}
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <section className="card p-3.5 sm:p-4" aria-label={tr("Поиск и фильтры")}>
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tr("Найти событие или место…")}
                leadingIcon="search"
                aria-label={tr("Поиск событий")}
                wrapperClassName="flex-1"
                trailing={
                  query ? (
                    <IconButton
                      icon="close"
                      label={tr("Очистить поиск")}
                      size="sm"
                      onClick={() => setQuery("")}
                    />
                  ) : null
                }
              />
              <div className="segmented no-scrollbar max-w-full overflow-x-auto">
                {timeFilters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTimeFilter(item.value)}
                    aria-pressed={timeFilter === item.value}
                    className={
                      timeFilter === item.value
                        ? "segmented-item segmented-item-active"
                        : "segmented-item"
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 border-t border-line pt-3">
              <CategoryFilter value={category} onChange={setCategory} counts={counts} />
            </div>
          </section>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {filtered.length ? (
                <>
                  {pluralizeEvents(filtered.length)}
                  {" · "}
                  <span className="text-fg">
                    {formatDate(filtered[0].dateISO, { day: "numeric", month: "long" })}
                    {filtered.length > 1
                      ? ` — ${formatDate(filtered[filtered.length - 1].dateISO, {
                          day: "numeric",
                          month: "long",
                        })}`
                      : ""}
                  </span>
                </>
              ) : (
                tr("События не найдены")
              )}
            </p>
            {activeFilterCount ? (
              <Button variant="ghost" size="sm" icon="refresh" onClick={resetFilters}>
                {tr("Сбросить фильтры")}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-meta text-faint">
                <Icon name="info" size={14} /> {tr("Условия уточняйте у организатора")}
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {!ready ? (
              Array.from({ length: 4 }).map((_, index) => <EventCardSkeleton key={index} />)
            ) : filtered.length ? (
              filtered.map((event) => <EventCard key={event.id} event={event} onOpen={openEvent} />)
            ) : (
              <div className="sm:col-span-2">
                <EmptyState
                  icon="calendarOff"
                  title={onlySaved ? tr("Сохранённых событий нет") : tr("Под эти фильтры ничего нет")}
                  description={
                    onlySaved
                      ? tr("Сохраняйте события закладкой — они появятся здесь и в вашем профиле.")
                      : tr("Попробуйте другую категорию или расширьте временной диапазон.")
                  }
                  action={
                    <Button variant="secondary" icon="refresh" onClick={resetFilters}>
                      {tr("Показать все события")}
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </div>

        <aside className="hidden min-w-0 space-y-4 xl:block">
          {nextEvent ? (
            <div className="card overflow-hidden">
              <div className="relative aspect-[16/9] overflow-hidden bg-sunken">
                <img src={nextEvent.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                <span className="badge absolute left-3 top-3 bg-surface/95 text-fg shadow-card">
                  <Icon name="calendarDays" size={14} />
                  {tr("Ближайшее")}
                </span>
              </div>
              <div className="p-4">
                <p className="text-meta text-muted">
                  {formatDate(nextEvent.dateISO, { day: "numeric", month: "long" })} ·{" "}
                  {formatEventRange(nextEvent.dateISO, nextEvent.endTime)}
                </p>
                <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug text-fg">
                  {nextEvent.title}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Icon name="location" size={14} className="shrink-0" />
                  <span className="truncate">{placeMap[nextEvent.placeId]?.name ?? tr("Өскемен")}</span>
                </p>
                <Button variant="secondary" size="sm" fullWidth className="mt-4" onClick={() => openEvent(nextEvent)}>
                  {tr("Открыть событие")}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">{tr("Как читать афишу")}</h2>
              <Icon name="info" size={17} className="text-faint" />
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
              <li className="flex gap-2.5">
                <Icon name="calendarDays" size={16} className="mt-0.5 shrink-0 text-accent-ink" />
                {tr("Даты рассчитываются от текущего дня, чтобы список не устаревал.")}
              </li>
              <li className="flex gap-2.5">
                <Icon name="ticket" size={16} className="mt-0.5 shrink-0 text-accent-ink" />
                {tr("Программу, время и условия проверяйте у организатора.")}
              </li>
              <li className="flex gap-2.5">
                <Icon name="download" size={16} className="mt-0.5 shrink-0 text-accent-ink" />
                {tr("Сохранённое событие можно добавить в календарь файлом .ics.")}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-sunken p-5">
            <Icon name="plan" size={19} className="text-accent-ink" />
            <h2 className="mt-3 font-display text-lg font-semibold text-fg">{tr("Не хочется выбирать?")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {tr("Ответьте на несколько вопросов — соберём маршрут на вечер.")}
            </p>
            <ButtonLink to="/plan" variant="primary" size="sm" fullWidth className="mt-4">
              {tr("Подобрать вечер")}
            </ButtonLink>
          </div>
        </aside>
      </div>

      <EventDetailModal event={selectedEvent} onClose={closeEvent} />
    </div>
  );
}
