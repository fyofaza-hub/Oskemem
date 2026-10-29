import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bookmark,
  CalendarDays,
  CalendarX,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import type { CategoryId } from "@/types";
import { categoryMap } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import {
  eventDateBadge,
  formatDate,
  formatEventRange,
  isThisWeekend,
  isWithinDays,
  normalize,
} from "@/lib/utils";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { EventCard, EventCardSkeleton } from "@/components/events/EventCard";
import { EventDetailModal } from "@/components/events/EventDetailModal";
import { EmptyState } from "@/components/ui/Bits";
import { tr } from "@/i18n/runtime";

type TimeFilter = "all" | "week" | "weekend" | "free";

export function EventsPage() {
  const { events, savedEventIds, placeMap } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [onlySaved, setOnlySaved] = useState(false);
  const ready = useDelayedReady(420);

  const selectedEvent = events.find((event) => event.id === searchParams.get("event")) ?? null;

  const openEvent = (event: (typeof events)[number]) => {
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

  const counts: Record<CategoryId | "all", number> = {
    all: events.length,
    food: events.filter((event) => event.category === "food").length,
    nature: events.filter((event) => event.category === "nature").length,
    entertainment: events.filter((event) => event.category === "entertainment").length,
    culture: events.filter((event) => event.category === "culture").length,
    sport: events.filter((event) => event.category === "sport").length,
    landmark: events.filter((event) => event.category === "landmark").length,
    leisure: events.filter((event) => event.category === "leisure").length,
  };

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    return [...events]
      .filter((event) => {
        if (category !== "all" && event.category !== category) return false;
        if (onlySaved && !savedEventIds.includes(event.id)) return false;
        if (timeFilter === "week" && !isWithinDays(event.dateISO, 7)) return false;
        if (timeFilter === "weekend" && !isThisWeekend(event.dateISO)) return false;
        if (timeFilter === "free" && !event.priceLabel.toLowerCase().includes(tr("свободный"))) return false;
        if (!normalized) return true;
        const place = placeMap[event.placeId];
        return normalize(
          [event.title, event.description, place?.name ?? "", categoryMap[event.category].label].join(" "),
        ).includes(normalized);
      })
      .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
  }, [events, category, onlySaved, savedEventIds, timeFilter, query, placeMap]);

  const nextEvent = filtered[0] ?? events[0];
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
      <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-surface">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] lg:block">
          <img src="/images/festival.webp" alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/20" />
        </div>
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent">06</span>
              <span className="h-px w-8 bg-white/15" />
              <span className="eyebrow">{tr("афиша · события города")}</span>
            </div>
            <h1 className="display-title mt-5 text-[clamp(2.8rem,6vw,5rem)] text-primary">
              {tr(" Поводы ")}<br />
              <span className="text-outline">{tr("выйти из дома.")}</span>
            </h1>
            <p className="mt-5 max-w-lg text-[13px] leading-relaxed text-white/45">
              {tr(" Вечера в музее, кино в парке, маркеты и пробежки. Даты рассчитываются от текущего дня, а программу и условия стоит уточнять у организатора. ")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setOnlySaved(false);
                  setTimeFilter("week");
                  setCategory("all");
                }}
                className="btn btn-primary btn-lg gap-2"
              >
                <CalendarDays size={15} /> {tr(" Ближайшая неделя ")}</button>
              <button
                type="button"
                onClick={() => setOnlySaved(true)}
                className="btn btn-secondary btn-lg gap-2"
              >
                <Bookmark size={15} /> {tr(" Сохранённые ")}<span className="font-mono text-[9px] opacity-50">{savedEventIds.length}</span>
              </button>
            </div>
          </div>

          {nextEvent ? (
            <div className="relative hidden self-end lg:block">
              <div className="ml-auto w-[290px] rounded-2xl border border-white/12 bg-field/90 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">{tr("ближайшее в списке")}</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </div>
                <div className="mt-3 flex gap-3">
                  <div className="flex h-[58px] w-[52px] shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <span className="font-display text-[22px] font-light leading-none text-primary">
                      {eventDateBadge(nextEvent.dateISO).day}
                    </span>
                    <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-white/35">
                      {eventDateBadge(nextEvent.dateISO).month}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-display text-[14px] leading-tight text-primary">
                      {nextEvent.title}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1 text-[8.5px] text-white/30">
                      <MapPin size={8} />
                      {placeMap[nextEvent.placeId]?.name}
                    </p>
                    <p className="mt-1 font-mono text-[8px] text-accent/70">
                      {formatEventRange(nextEvent.dateISO, nextEvent.endTime)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEvent(nextEvent)}
                  className="btn btn-secondary btn-sm mt-3 w-full"
                >
                  {tr(" Открыть событие ")}</button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/8 bg-surface p-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tr("Найти событие или место…")}
              className="field h-10 pl-10 pr-9 text-[12px]"
              aria-label={tr("Поиск событий")}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                aria-label={tr("Очистить поиск")}
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
          <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.025] p-1">
            {[
              { value: "all", label: tr("Все") },
              { value: "week", label: tr("7 дней") },
              { value: "weekend", label: tr("Выходные") },
              { value: "free", label: tr("Бесплатно") },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTimeFilter(item.value as TimeFilter)}
                className={`flex h-8 flex-1 items-center justify-center rounded-full px-3 text-[10px] transition-all sm:flex-none ${
                  timeFilter === item.value
                    ? "bg-white/10 text-primary"
                    : "text-white/35 hover:text-white/70"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOnlySaved((value) => !value)}
            className={`btn btn-md h-10 shrink-0 gap-1.5 ${
              onlySaved ? "btn-primary" : "btn-secondary"
            }`}
          >
            <Bookmark size={13} fill={onlySaved ? "currentColor" : "none"} />
            {tr(" Сохранённые ")}</button>
        </div>
        <div className="mt-3 border-t border-white/6 pt-3">
          <CategoryFilter value={category} onChange={setCategory} counts={counts} />
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10.5px] text-white/30">
          {filtered.length ? (
            <>
              {filtered.length} {filtered.length === 1 ? tr("событие") : tr("событий")} ·{" "}
              <span className="text-white/50">
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
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-[9.5px] text-accent transition-opacity hover:opacity-70"
          >
            <X size={11} /> {tr(" Сбросить фильтры ")}</button>
        ) : (
          <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">
            <Ticket size={10} /> {tr(" условия уточняйте у организатора ")}</span>
        )}
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {!ready ? (
          Array.from({ length: 6 }).map((_, index) => <EventCardSkeleton key={index} />)
        ) : filtered.length ? (
          filtered.map((event) => <EventCard key={event.id} event={event} onOpen={openEvent} />)
        ) : (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              icon={CalendarX}
              title={onlySaved ? tr("Сохранённых событий нет") : tr("Под эти фильтры ничего нет")}
              description={
                onlySaved
                  ? tr("Сохраняйте события закладкой — они появятся здесь и в вашем профиле.")
                  : tr("Попробуйте другую категорию или расширьте временной диапазон.")
              }
              action={
                <button type="button" onClick={resetFilters} className="btn btn-secondary btn-sm">
                  {tr(" Показать все события ")}</button>
              }
            />
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-3 rounded-2xl border border-white/8 bg-white/[0.018] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200/15 bg-amber-200/[0.055] text-amber-100/60">
            <Sparkles size={15} />
          </span>
          <div>
            <p className="text-[11.5px] text-white/60">{tr("Афиша города в одном месте")}</p>
            <p className="mt-1 max-w-2xl text-[9.5px] leading-relaxed text-white/28">
              {tr(" Даты рассчитываются от текущего дня, чтобы список не устаревал. Перед посещением проверяйте программу и условия у организатора. ")}</p>
          </div>
        </div>
        <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/20 sm:text-right">
          {tr(" можно добавить событие ")}<br />
          {tr(" в календарь (.ics) ")}</p>
      </div>

      <EventDetailModal event={selectedEvent} onClose={closeEvent} />
    </div>
  );
}
