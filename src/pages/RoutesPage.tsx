import { useMemo, useState } from "react";
import type { CategoryId } from "@/types";
import { categories } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import { normalize, pluralizeRoutes, pluralizeStops } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { RouteCard, RouteCardSkeleton } from "@/components/routes/RouteCard";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Bits";
import { Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

type RouteFilter = "all" | "mine" | "saved";
type RouteSort = "recommended" | "newest" | "short";

const routeFilters: Array<{ value: RouteFilter; label: string }> = [
  { value: "all", label: tr("Все") },
  { value: "mine", label: tr("Мои") },
  { value: "saved", label: tr("Сохранённые") },
];

export function RoutesPage() {
  const { routes, currentUser, savedRouteIds, draft } = useApp();
  const ready = useDelayedReady(420);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [filter, setFilter] = useState<RouteFilter>("all");
  const [sort, setSort] = useState<RouteSort>("recommended");

  const counts: Record<CategoryId | "all", number> = useMemo(
    () => ({
      all: routes.length,
      food: routes.filter((route) => route.categories.includes("food")).length,
      nature: routes.filter((route) => route.categories.includes("nature")).length,
      entertainment: routes.filter((route) => route.categories.includes("entertainment")).length,
      culture: routes.filter((route) => route.categories.includes("culture")).length,
      sport: routes.filter((route) => route.categories.includes("sport")).length,
      landmark: routes.filter((route) => route.categories.includes("landmark")).length,
      leisure: routes.filter((route) => route.categories.includes("leisure")).length,
    }),
    [routes],
  );

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    const result = routes.filter((route) => {
      if (category !== "all" && !route.categories.includes(category)) return false;
      if (filter === "mine" && route.authorId !== currentUser?.id) return false;
      if (filter === "saved" && !savedRouteIds.includes(route.id)) return false;
      if (!normalized) return true;
      return normalize(
        [
          route.title,
          route.description,
          ...route.categories.map((id) => categories.find((item) => item.id === id)?.label ?? ""),
        ].join(" "),
      ).includes(normalized);
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
  const activeFilterCount =
    (query ? 1 : 0) + (category !== "all" ? 1 : 0) + (filter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setFilter("all");
    setSort("recommended");
  };

  return (
    <div className="page-wrap">
      <PageHeader
        dataTour="routes"
        title={tr("Маршруты")}
        description={tr("Готовые сценарии прогулок и вечеров — или собственный маршрут из любимых мест. Порядок и время можно менять.")}
        actions={
          <>
            <ButtonLink to="/routes/new" variant="primary" icon="plus">
              {tr("Собрать маршрут")}
            </ButtonLink>
            <ButtonLink to="/plan" variant="secondary" icon="plan">
              {tr("Подобрать вечер")}
            </ButtonLink>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="routes" size={15} /> {pluralizeRoutes(routes.length)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="location" size={15} /> {pluralizeStops(totalStops)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="bookmark" size={15} /> {savedRouteIds.length} {tr("сохранено")}
        </span>
      </div>

      {draft && draft.stops.length ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-accent/25 bg-accent-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent-ink">
              <Icon name="routePlanner" size={19} />
            </span>
            <div>
              <p className="font-medium text-fg">{tr("У вас есть черновик маршрута")}</p>
              <p className="mt-1 text-sm text-muted">
                {pluralizeStops(draft.stops.length)} · {tr("продолжите с того места, где остановились.")}
              </p>
            </div>
          </div>
          <ButtonLink to="/routes/new" variant="primary" size="sm" iconRight="arrowRight">
            {tr("Продолжить черновик")}
          </ButtonLink>
        </div>
      ) : null}

      <section data-reveal className="card mt-6 p-3.5 sm:p-4" aria-label={tr("Поиск и фильтры")}>
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("Найти маршрут по названию или настроению…")}
            leadingIcon="search"
            aria-label={tr("Поиск маршрутов")}
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="segmented no-scrollbar max-w-full overflow-x-auto">
              {routeFilters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={
                    filter === item.value
                      ? "segmented-item segmented-item-active"
                      : "segmented-item"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as RouteSort)}
              aria-label={tr("Сортировка маршрутов")}
              className="h-10 min-w-[150px] text-sm"
              wrapperClassName="shrink-0"
            >
              <option value="recommended">{tr("Рекомендуемые")}</option>
              <option value="newest">{tr("Новые")}</option>
              <option value="short">{tr("Короткие")}</option>
            </Select>
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
              <span className="font-medium text-fg">{filtered.length}</span>{" "}
              {filter === "mine"
                ? tr("ваших маршрутов")
                : filter === "saved"
                  ? tr("сохранённых")
                  : tr("маршрутов")}{" "}
              · {tr("время и дистанция ориентировочные")}
            </>
          ) : (
            tr("Маршруты не нашлись")
          )}
        </p>
        {activeFilterCount ? (
          <Button variant="ghost" size="sm" icon="refresh" onClick={resetFilters}>
            {tr("Сбросить фильтры")}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-meta text-faint">
            <Icon name="notebook" size={14} /> {customCount} {tr("создано в этом браузере")}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {!ready ? (
          Array.from({ length: 3 }).map((_, index) => <RouteCardSkeleton key={index} />)
        ) : filtered.length ? (
          filtered.map((route) => <RouteCard key={route.id} route={route} />)
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              icon={filter === "saved" ? "bookmark" : filter === "mine" ? "routes" : "guide"}
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
                  <ButtonLink to="/routes/new" variant="primary" size="sm" icon="plus">
                    {tr("Собрать маршрут")}
                  </ButtonLink>
                  <Button variant="secondary" size="sm" onClick={resetFilters}>
                    {tr("Все маршруты")}
                  </Button>
                </div>
              }
            />
          </div>
        )}
      </div>

      <section data-reveal className="mt-10 grid gap-6 rounded-2xl border border-line bg-surface p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-fg sm:text-2xl">
            {tr("Два места — уже маршрут")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {tr("Добавляйте точки из гида или карты, переставляйте остановки и указывайте время. Сохранённый маршрут появится в профиле и получит ссылку, которой можно поделиться.")}
          </p>
          <ButtonLink to="/routes/new" variant="primary" size="sm" icon="plus" className="mt-4">
            {tr("Открыть конструктор")}
          </ButtonLink>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px]">
          {[
            { icon: "guide" as const, text: tr("выберите места") },
            { icon: "clock" as const, text: tr("расставьте время") },
            { icon: "share" as const, text: tr("поделитесь") },
          ].map((step, index) => (
            <div key={step.text} className="rounded-xl bg-sunken p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-accent-ink">
                <Icon name={step.icon} size={16} />
              </span>
              <p className="mt-2 text-meta font-medium text-fg">
                {index + 1}. {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
