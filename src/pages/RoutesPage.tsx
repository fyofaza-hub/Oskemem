import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Compass,
  Plus,
  Route as RouteIcon,
  Search,
  Signpost,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { CategoryId } from "@/types";
import { categories } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import { normalize, pluralizeRoutes } from "@/lib/utils";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { RouteCard, RouteCardSkeleton } from "@/components/routes/RouteCard";
import { EmptyState } from "@/components/ui/Bits";
import { tr } from "@/i18n/runtime";

type RouteFilter = "all" | "mine" | "saved";
type RouteSort = "recommended" | "newest" | "short";

export function RoutesPage() {
  const { routes, currentUser, savedRouteIds, draft } = useApp();
  const ready = useDelayedReady(420);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [filter, setFilter] = useState<RouteFilter>("all");
  const [sort, setSort] = useState<RouteSort>("recommended");

  const counts: Record<CategoryId | "all", number> = {
    all: routes.length,
    food: routes.filter((route) => route.categories.includes("food")).length,
    nature: routes.filter((route) => route.categories.includes("nature")).length,
    entertainment: routes.filter((route) => route.categories.includes("entertainment")).length,
    culture: routes.filter((route) => route.categories.includes("culture")).length,
    sport: routes.filter((route) => route.categories.includes("sport")).length,
    landmark: routes.filter((route) => route.categories.includes("landmark")).length,
    leisure: routes.filter((route) => route.categories.includes("leisure")).length,
  };

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    const result = routes.filter((route) => {
      if (category !== "all" && !route.categories.includes(category)) return false;
      if (filter === "mine" && route.authorId !== currentUser?.id) return false;
      if (filter === "saved" && !savedRouteIds.includes(route.id)) return false;
      if (!normalized) return true;
      return normalize([route.title, route.description, ...route.categories.map((id) => categories.find((c) => c.id === id)?.label ?? "")].join(" ")).includes(
        normalized,
      );
    });

    if (sort === "newest") {
      return [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    if (sort === "short") {
      return [...result].sort((a, b) => a.stops.length - b.stops.length);
    }
    return [...result].sort((a, b) => {
      if (a.demo && !b.demo) return 1;
      if (!a.demo && b.demo) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [routes, category, filter, savedRouteIds, currentUser?.id, query, sort]);

  const customCount = routes.filter((route) => !route.demo).length;
  const totalStops = routes.reduce((total, route) => total + route.stops.length, 0);

  return (
    <div className="page-wrap">
      <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-surface">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] lg:block">
          <img
            src="/images/embankment.webp"
            alt=""
            className="h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/60 to-transparent" />
          <svg
            className="absolute bottom-8 left-6 h-24 w-[70%] text-accent/60"
            viewBox="0 0 260 80"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 66C46 66 48 20 96 20s46 40 94 40 40-34 66-34"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 7"
            />
            <circle cx="4" cy="66" r="3.5" fill="#4D8DFF" />
            <circle cx="96" cy="20" r="3.5" fill="#4D8DFF" />
            <circle cx="190" cy="60" r="3.5" fill="#4D8DFF" />
            <circle cx="256" cy="26" r="3.5" fill="#fff" />
          </svg>
        </div>
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.25fr_0.75fr] lg:p-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent">05</span>
              <span className="h-px w-8 bg-white/15" />
              <span className="eyebrow">{tr("маршруты · сценарии города")}</span>
            </div>
            <h1 className="display-title mt-5 text-[clamp(2.8rem,6vw,5rem)] text-primary">
              {tr(" Соберите ")}<br />
              <span className="text-outline">{tr("свой вечер.")}</span>
            </h1>
            <p className="mt-5 max-w-lg text-[13px] leading-relaxed text-white/45">
              {tr(" Готовые маршруты для прогулки, культуры и ужина — или собственный сценарий из любимых мест. Время, порядок и точки можно менять; карта построится сама. ")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Link to="/routes/new" className="btn btn-primary btn-lg gap-2">
                <Plus size={15} /> {tr(" Собрать маршрут ")}</Link>
              {draft && draft.stops.length ? (
                <Link to="/routes/new" className="btn btn-secondary btn-lg gap-2">
                  <RouteIcon size={15} /> {tr(" Продолжить черновик ")}<span className="rounded-full bg-accent/15 px-1.5 py-0.5 font-mono text-[8px] text-accent">
                    {draft.stops.length}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilter("saved")}
                  className="btn btn-secondary btn-lg gap-2"
                >
                  <Bookmark size={15} /> {tr(" Сохранённые ")}</button>
              )}
            </div>
          </div>
          <div className="relative hidden items-end justify-end lg:flex">
            <div className="w-[210px] rounded-2xl border border-white/10 bg-elevated/90 p-4 backdrop-blur-xl">
              <p className="eyebrow">{tr("в библиотеке")}</p>
              <p className="mt-2 font-display text-3xl font-light text-primary">{routes.length}</p>
              <p className="text-[10px] text-white/35">{pluralizeRoutes(routes.length)}</p>
              <div className="mt-4 space-y-2 border-t border-white/8 pt-3">
                <div className="flex items-center justify-between text-[9.5px]">
                  <span className="text-white/30">{tr("остановок")}</span>
                  <span className="text-white/65">{totalStops}</span>
                </div>
                <div className="flex items-center justify-between text-[9.5px]">
                  <span className="text-white/30">{tr("ваших маршрутов")}</span>
                  <span className="text-white/65">{customCount}</span>
                </div>
                <div className="flex items-center justify-between text-[9.5px]">
                  <span className="text-white/30">{tr("сохранено")}</span>
                  <span className="text-white/65">{savedRouteIds.length}</span>
                </div>
              </div>
            </div>
          </div>
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
              placeholder={tr("Найти маршрут по названию или настроению…")}
              className="field h-10 pl-10 pr-9 text-[12px]"
              aria-label={tr("Поиск маршрутов")}
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
          <div className="flex flex-col gap-2 xs:flex-row">
            <div className="flex w-full flex-1 rounded-full border border-white/10 bg-white/[0.025] p-1 sm:w-auto sm:flex-none">
              {[
                { value: "all", label: tr("Все") },
                { value: "mine", label: tr("Мои") },
                { value: "saved", label: tr("Сохранённые") },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value as RouteFilter)}
                  className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-full px-3 text-[10.5px] transition-all sm:px-3.5 ${
                    filter === item.value
                      ? "bg-white/10 text-primary"
                      : "text-white/35 hover:text-white/70"
                  }`}
                >
                  {item.value === "saved" ? <Bookmark size={10} /> : null}
                  {item.label}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as RouteSort)}
              className="field h-[42px] w-full shrink-0 appearance-none py-0 text-[11px] xs:w-[135px]"
              aria-label={tr("Сортировка маршрутов")}
            >
              <option value="recommended">{tr("Рекомендуемые")}</option>
              <option value="newest">{tr("Новые")}</option>
              <option value="short">{tr("Короткие")}</option>
            </select>
          </div>
        </div>
        <div className="mt-3 border-t border-white/6 pt-3">
          <CategoryFilter value={category} onChange={setCategory} counts={counts} />
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10.5px] text-white/30">
          <span className="text-white/60">{filtered.length}</span>{" "}
          {filter === "mine" ? tr("ваших маршрутов") : filter === "saved" ? tr("сохранённых") : tr("маршрутов")}{" "}
          {tr(" · время и дистанция ориентировочные ")}</p>
        <span className="hidden items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/20 sm:flex">
          <Signpost size={10} /> {customCount} {tr(" создано в этом браузере ")}</span>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {!ready ? (
          Array.from({ length: 3 }).map((_, index) => <RouteCardSkeleton key={index} />)
        ) : filtered.length ? (
          filtered.map((route) => <RouteCard key={route.id} route={route} />)
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              icon={filter === "saved" ? Bookmark : filter === "mine" ? RouteIcon : Compass}
              title={
                filter === "mine"
                  ? tr("У вас пока нет своих маршрутов")
                  : filter === "saved"
                    ? tr("Сохранённых маршрутов пока нет")
                    : tr("Маршруты не нашлись")
              }
              description={
                filter === "saved"
                  ? tr("Нажмите на закладку у любого маршрута — он появится здесь и в профиле.")
                  : tr("Соберите маршрут из двух или более мест: сохраните порядок, время и получите ссылку для друзей.")
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to="/routes/new" className="btn btn-primary btn-sm gap-1.5">
                    <Plus size={12} /> {tr(" Собрать маршрут ")}</Link>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("all");
                      setCategory("all");
                      setQuery("");
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    {tr(" Все маршруты ")}</button>
                </div>
              }
            />
          </div>
        )}
      </div>

      <section className="mt-12 overflow-hidden rounded-[26px] border border-white/9 bg-gradient-to-br from-elevated to-surface p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">{tr("конструктор")}</p>
            <h2 className="mt-2 max-w-xl font-display text-[clamp(1.7rem,3.4vw,2.8rem)] font-light leading-[1.04] tracking-[-0.04em] text-primary">
              {tr(" Два места — уже маршрут. ")}<br />
              <span className="text-outline-blue">{tr("Время и порядок — ваши.")}</span>
            </h2>
            <p className="mt-3 max-w-lg text-[11.5px] leading-relaxed text-white/35">
              {tr(" Добавляйте точки из гида или карты, переставляйте остановки, указывайте время. Сохранённый маршрут появится в профиле и получит ссылку, которой можно поделиться. ")}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Compass, text: tr("выберите места") },
              { icon: SlidersHorizontal, text: tr("расставьте время") },
              { icon: Sparkles, text: tr("поделитесь") },
            ].map((step, index) => (
              <div key={step.text} className="w-[90px] text-center sm:w-[120px]">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45">
                  <step.icon size={16} />
                </span>
                <p className="mt-2.5 font-mono text-[7.5px] text-white/25">
                  0{index + 1}
                </p>
                <p className="mt-1 text-[9px] leading-snug text-white/40">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
