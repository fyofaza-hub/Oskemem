import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CategoryId, Companion, Place } from "@/types";
import {
  categories,
  categoryMap,
  companionOptions,
  countPlacesByCategory,
} from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import { cn, normalize, pluralizePlaces } from "@/lib/utils";
import { localeFor, tr } from "@/i18n/runtime";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { PlaceCard, PlaceCardSkeleton } from "@/components/places/PlaceCard";
import { PlaceDetail } from "@/components/places/PlaceDetail";
import { PageHeader, EmptyState } from "@/components/ui/Bits";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

const priceOptions = [
  { value: "any", label: tr("Любой бюджет") },
  { value: "0", label: tr("Бесплатно") },
  { value: "1", label: tr("₸ · недорого") },
  { value: "2", label: tr("₸₸ · средне") },
  { value: "3", label: tr("₸₸₸ · премиум") },
] as const;

type PriceValue = (typeof priceOptions)[number]["value"];
type SortValue = "recommended" | "name" | "free";

export function GuidePage() {
  const { favorites, places } = useApp();
  const ready = useDelayedReady(420);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [price, setPrice] = useState<PriceValue>("any");
  const [companion, setCompanion] = useState<Companion | "any">("any");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<SortValue>("recommended");
  const [showFilters, setShowFilters] = useState(false);

  const categoryParam = searchParams.get("category");
  const category: CategoryId | "all" =
    categoryParam && categoryParam in categoryMap ? (categoryParam as CategoryId) : "all";
  const selectedPlace = places.find((place) => place.id === searchParams.get("place")) ?? null;

  const districts = useMemo(
    () =>
      Array.from(new Set(places.map((place) => place.district))).sort((a, b) =>
        a.localeCompare(b, localeFor()),
      ),
    [places],
  );

  const counts = useMemo(() => countPlacesByCategory(places), [places]);

  const setCategory = (value: CategoryId | "all") => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "all") next.delete("category");
        else next.set("category", value);
        next.delete("place");
        return next;
      },
      { replace: true },
    );
  };

  const openPlace = (place: Place) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("place", place.id);
        return next;
      },
      { replace: false },
    );
  };

  const closePlace = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("place");
        return next;
      },
      { replace: false },
    );
  };

  const resetFilters = () => {
    setQuery("");
    setDistrict("all");
    setPrice("any");
    setCompanion("any");
    setOnlyFavorites(false);
    setSort("recommended");
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("category");
        next.delete("place");
        return next;
      },
      { replace: true },
    );
  };

  const activeFilterCount =
    (query ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (district !== "all" ? 1 : 0) +
    (price !== "any" ? 1 : 0) +
    (companion !== "any" ? 1 : 0) +
    (onlyFavorites ? 1 : 0);

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query);
    const result = places.filter((place) => {
      if (category !== "all" && place.category !== category) return false;
      if (district !== "all" && place.district !== district) return false;
      if (price !== "any" && place.priceLevel !== Number(price)) return false;
      if (companion !== "any" && !place.companions.includes(companion)) return false;
      if (onlyFavorites && !favorites.includes(place.id)) return false;
      if (normalizedQuery) {
        const searchable = [
          place.name,
          place.address,
          place.district,
          place.description,
          place.shortDescription,
          categoryMap[place.category].label,
          ...place.tags,
        ].join(" ");
        if (!normalize(searchable).includes(normalizedQuery)) return false;
      }
      return true;
    });

    if (sort === "name") {
      return [...result].sort((a, b) => a.name.localeCompare(b.name, localeFor()));
    }
    if (sort === "free") {
      return [...result].sort((a, b) => a.priceLevel - b.priceLevel);
    }
    return [...result].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name, localeFor());
    });
  }, [category, district, price, companion, onlyFavorites, favorites, query, sort, places]);

  return (
    <div className="page-wrap">
      <PageHeader
        title={tr("Городской гид")}
        description={tr("Проверенные места Өскемена: музеи и театры, парки, кофейни и точки для долгого вечера.")}
        actions={
          <>
            <ButtonLink to="/map" variant="secondary" size="md" icon="map">
              {tr("На карте")}
            </ButtonLink>
            <ButtonLink to="/map?add=1" variant="primary" size="md" icon="plus">
              {tr("Добавить место")}
            </ButtonLink>
          </>
        }
      />

      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <Icon name="guide" size={16} className="text-accent" />
        {pluralizePlaces(places.length)} · {categories.length} {tr("категорий")}
      </p>

      <section className="card mt-6 p-3.5 sm:p-4" aria-label={tr("Поиск и фильтры")}>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("Найти место, район, кофе, музей…")}
            leadingIcon="search"
            className="pr-12"
            wrapperClassName="flex-1"
            aria-label={tr("Поиск по местам")}
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
          <div className="flex gap-2">
            <Button
              variant={showFilters || activeFilterCount ? "secondary" : "secondary"}
              size="md"
              icon="filter"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={cn("flex-1 sm:flex-none", showFilters && "border-accent bg-accent-soft text-accent-ink")}
            >
              {tr("Фильтры")}
              {activeFilterCount ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            <Button
              variant={onlyFavorites ? "primary" : "secondary"}
              size="md"
              icon="heart"
              onClick={() => setOnlyFavorites((value) => !value)}
              aria-pressed={onlyFavorites}
              className="flex-1 sm:flex-none"
            >
              {tr("Избранное")}
              <span className="tabular-nums opacity-70">{favorites.length}</span>
            </Button>
          </div>
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <CategoryFilter value={category} onChange={setCategory} counts={counts} />
        </div>

        {showFilters ? (
          <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="filter-district" label={tr("Район")}>
              <Select id="filter-district" value={district} onChange={(event) => setDistrict(event.target.value)}>
                <option value="all">{tr("Все районы")}</option>
                {districts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="filter-price" label={tr("Бюджет")}>
              <Select id="filter-price" value={price} onChange={(event) => setPrice(event.target.value as PriceValue)}>
                {priceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="filter-companion" label={tr("С кем")}>
              <Select
                id="filter-companion"
                value={companion}
                onChange={(event) => setCompanion(event.target.value as Companion | "any")}
              >
                <option value="any">{tr("Любая компания")}</option>
                {companionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="filter-sort" label={tr("Сортировка")}>
              <Select id="filter-sort" value={sort} onChange={(event) => setSort(event.target.value as SortValue)}>
                <option value="recommended">{tr("По рекомендации")}</option>
                <option value="name">{tr("По названию")}</option>
                <option value="free">{tr("Сначала бесплатные")}</option>
              </Select>
            </Field>
          </div>
        ) : null}
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {tr("Найдено")} <span className="font-medium text-fg">{filtered.length}</span>
          {query ? (
            <>
              {" "}
              {tr("по запросу")} <span className="text-fg">«{query}»</span>
            </>
          ) : null}
        </p>
        {activeFilterCount ? (
          <Button variant="ghost" size="sm" icon="refresh" onClick={resetFilters}>
            {tr("Сбросить фильтры")}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!ready ? (
          Array.from({ length: 6 }).map((_, index) => <PlaceCardSkeleton key={index} />)
        ) : filtered.length ? (
          filtered.map((place) => (
            <PlaceCard key={place.id} place={place} onOpen={openPlace} />
          ))
        ) : (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon="guide"
              title={tr("Здесь пока пусто")}
              description={
                onlyFavorites
                  ? tr("В избранном нет мест, подходящих под фильтры. Добавьте пару точек или сбросьте ограничения.")
                  : tr("Под такие фильтры мест не нашлось. Попробуйте расширить район, бюджет или запрос.")
              }
              action={
                <Button variant="secondary" icon="refresh" onClick={resetFilters}>
                  {tr("Сбросить фильтры")}
                </Button>
              }
            />
          </div>
        )}
      </div>

      <section className="mt-10 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
            <Icon name="location" size={19} />
          </span>
          <div>
            <p className="font-medium text-fg">{tr("Не хватает места, которое вы любите?")}</p>
            <p className="mt-1 text-sm text-muted">
              {tr("Добавьте его на карту — точка сразу появится в гиде и в маршрутах.")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/map?add=1" variant="secondary" size="sm" icon="plus">
            {tr("Добавить на карту")}
          </ButtonLink>
          <ButtonLink to="/feed?create=1" variant="primary" size="sm" icon="feed">
            {tr("Поделиться местом")}
          </ButtonLink>
        </div>
      </section>

      <PlaceDetail place={selectedPlace} onClose={closePlace} onSelectPlace={openPlace} />
    </div>
  );
}
