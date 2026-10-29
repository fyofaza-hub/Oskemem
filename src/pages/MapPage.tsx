import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { CategoryId, Place, Route } from "@/types";
import { categoryMap, countPlacesByCategory } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import { cn, durationLabel, normalize, pluralizeStops } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { AddPlaceModal } from "@/components/places/AddPlaceModal";
import { PlaceDetail } from "@/components/places/PlaceDetail";
import { MapView } from "@/components/map/MapView";
import { CategoryIcon } from "@/components/ui/Category";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Bits";
import { Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

export function MapPage() {
  const { routes, draft, addPlaceToDraft, favorites, places, placeMap, currentUser } = useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepPlace = places.find((place) => place.id === searchParams.get("place"));
  const deepRoute = routes.find((route) => route.id === searchParams.get("route"));
  const [mode, setMode] = useState<"places" | "routes">(deepRoute ? "routes" : "places");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [communityOnly, setCommunityOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [activePlaceId, setActivePlaceId] = useState<string | null>(deepPlace?.id ?? null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(deepRoute?.id ?? routes[0]?.id ?? null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [markMode, setMarkMode] = useState(false);
  const [addCoords, setAddCoords] = useState<[number, number] | null>(null);
  const ready = useDelayedReady(300);

  const addRequested = searchParams.get("add") === "1";

  useEffect(() => {
    if (!addRequested) return;
    if (!currentUser) {
      toast({
        title: tr("Войдите, чтобы добавить место"),
        description: tr("После входа вы вернётесь на карту."),
        variant: "info",
      });
      navigate("/auth", { state: { from: "/map?add=1" } });
      return;
    }
    setMarkMode(false);
    setAddCoords(null);
    setAddOpen(true);
  }, [addRequested, currentUser, navigate, toast]);

  const closeAddModal = () => {
    setAddOpen(false);
    setMarkMode(false);
    setAddCoords(null);
    if (addRequested) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("add");
          return next;
        },
        { replace: true },
      );
    }
  };

  useEffect(() => {
    if (!deepPlace) return;
    setMode("places");
    setActivePlaceId(deepPlace.id);
  }, [deepPlace]);

  useEffect(() => {
    if (!deepRoute) return;
    setMode("routes");
    setActiveRouteId(deepRoute.id);
  }, [deepRoute]);

  const activePlace = activePlaceId ? placeMap[activePlaceId] : null;
  const activeRoute = routes.find((route) => route.id === activeRouteId) ?? null;
  const categoryCounts = useMemo(() => countPlacesByCategory(places), [places]);
  const communityCount = useMemo(
    () => places.filter((place) => place.source === "community").length,
    [places],
  );

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    return places.filter((place) => {
      if (communityOnly && place.source !== "community") return false;
      if (category !== "all" && place.category !== category) return false;
      if (!normalized) return true;
      return normalize(
        [
          place.name,
          place.address,
          place.district,
          place.shortDescription,
          categoryMap[place.category].label,
          ...place.tags,
        ].join(" "),
      ).includes(normalized);
    });
  }, [category, communityOnly, query, places]);

  useEffect(() => {
    if (!activePlaceId) return;
    if (!filtered.some((place) => place.id === activePlaceId)) {
      setActivePlaceId(null);
    }
  }, [activePlaceId, filtered]);

  const routeStops = activeRoute
    ? activeRoute.stops
        .map((stop) => placeMap[stop.placeId])
        .filter(Boolean)
        .map((place) => ({
          id: place.id,
          name: place.name,
          coords: place.coords,
          category: place.category,
        }))
    : [];

  const routePoints = activeRoute
    ? activeRoute.stops
        .map((stop) => placeMap[stop.placeId]?.coords)
        .filter((coords): coords is [number, number] => Boolean(coords))
    : [];

  const handleAddToDraft = (place: Place) => {
    requireAuth(() => {
      const result = addPlaceToDraft(place.id);
      toast({
        title: result === "exists" ? tr("Место уже в маршруте") : tr("Добавлено в маршрут"),
        description: place.name,
        variant: result === "exists" ? "info" : "success",
        action:
          result === "exists"
            ? undefined
            : { label: tr("Открыть конструктор"), onClick: () => navigate("/routes/new") },
      });
    });
  };

  const selectRoute = (route: Route) => {
    setActiveRouteId(route.id);
    setMode("routes");
    setActivePlaceId(null);
  };

  return (
    <div className="page-wrap">
      <PageHeader
        title={tr("Карта города")}
        description={tr("Все места и маршруты Өскемена на одной карте. Выбирайте точку, чтобы узнать подробнее.")}
        actions={
          <>
            <div className="segmented" role="group" aria-label={tr("Режим карты")}>
              <button
                type="button"
                onClick={() => setMode("places")}
                aria-pressed={mode === "places"}
                className={cn("segmented-item", mode === "places" && "segmented-item-active")}
              >
                <Icon name="location" size={15} />
                {tr("Места")}
              </button>
              <button
                type="button"
                onClick={() => setMode("routes")}
                aria-pressed={mode === "routes"}
                className={cn("segmented-item", mode === "routes" && "segmented-item-active")}
              >
                <Icon name="routes" size={15} />
                {tr("Маршруты")}
              </button>
            </div>
            <ButtonLink to="/routes/new" variant="secondary" icon="routePlanner">
              {tr("Собрать маршрут")}
            </ButtonLink>
            <Button
              variant="primary"
              icon="plus"
              onClick={() =>
                requireAuth(() => {
                  setMarkMode(false);
                  setAddCoords(null);
                  setAddOpen(true);
                }, tr("Войдите, чтобы добавить своё место"))
              }
            >
              {tr("Добавить место")}
            </Button>
          </>
        }
      />

      <div className="card mt-6 overflow-hidden">
        <div className="grid min-w-0 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="order-2 flex min-w-0 flex-col border-t border-line lg:order-1 lg:h-[calc(100svh-190px)] lg:min-h-[600px] lg:max-h-[820px] lg:border-r lg:border-t-0">
            {mode === "places" ? (
              <>
                <div className="border-b border-line p-3.5">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={tr("Найти на карте…")}
                    leadingIcon="search"
                    className="pr-11"
                    aria-label={tr("Поиск мест на карте")}
                    trailing={
                      query ? (
                        <IconButton icon="close" label={tr("Очистить")} size="sm" onClick={() => setQuery("")} />
                      ) : null
                    }
                  />
                  <div className="mt-3">
                    <CategoryFilter
                      value={category}
                      onChange={(value) => {
                        setCategory(value);
                        if (value === "all") setCommunityOnly(false);
                        setActivePlaceId(null);
                      }}
                      counts={categoryCounts}
                      className="-mx-3.5 px-3.5"
                      leading={
                        <button
                          type="button"
                          aria-pressed={communityOnly}
                          onClick={() => {
                            setCommunityOnly((prev) => !prev);
                            setActivePlaceId(null);
                          }}
                          className={cn("chip", communityOnly && "chip-active")}
                        >
                          <Icon name="plus" size={15} />
                          {tr("Мои места")}
                          <span className="text-[12px] text-faint">{communityCount}</span>
                        </button>
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2.5 text-meta text-muted">
                  <span>{filtered.length} {tr("точек")}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="heart" size={13} /> {favorites.length} {tr("в избранном")}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                  {!ready ? (
                    <div className="space-y-1.5 p-1.5">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                          <div className="skeleton h-12 w-12" />
                          <div className="flex-1 space-y-2">
                            <div className="skeleton h-3.5 w-3/4" />
                            <div className="skeleton h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filtered.length ? (
                    filtered.map((place) => {
                      const active = activePlaceId === place.id;
                      return (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => {
                            setActivePlaceId(place.id);
                            document
                              .getElementById("map-canvas")
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                            active
                              ? "border-accent bg-accent-soft"
                              : "border-transparent hover:border-line hover:bg-sunken",
                          )}
                        >
                          <img
                            src={place.image}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-fg">{place.name}</span>
                              {favorites.includes(place.id) ? (
                                <Icon name="heart" size={12} className="shrink-0 text-accent-ink" />
                              ) : null}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 text-meta text-muted">
                              <CategoryIcon category={place.category} size={12} />
                              <span className="shrink-0">{place.district}</span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{place.address}</span>
                            </span>
                          </span>
                          <Icon name="chevronRight" size={14} className="shrink-0 text-faint" />
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8">
                      <EmptyState
                        icon="map"
                        title={tr("Точек не нашлось")}
                        description={tr("Измените запрос или категорию.")}
                        className="border-0 bg-transparent px-2 py-4"
                        action={
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setQuery("");
                              setCategory("all");
                              setCommunityOnly(false);
                            }}
                          >
                            {tr("Сбросить фильтры")}
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-line p-4">
                  <label className="field-label" htmlFor="map-route">
                    {tr("Готовый маршрут")}
                  </label>
                  <Select
                    id="map-route"
                    value={activeRouteId ?? ""}
                    onChange={(event) => setActiveRouteId(event.target.value)}
                  >
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.title}
                      </option>
                    ))}
                  </Select>
                </div>

                {activeRoute ? (
                  <>
                    <div className="border-b border-line px-4 py-3.5">
                      <h2 className="font-display text-lg font-semibold text-fg">{activeRoute.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                        {activeRoute.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="badge">{pluralizeStops(activeRoute.stops.length)}</span>
                        <span className="badge">{durationLabel(activeRoute.durationMin)}</span>
                        <span className="badge">≈ {activeRoute.distanceKm} {tr("км")}</span>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                      {activeRoute.stops.map((stop, index) => {
                        const place = placeMap[stop.placeId];
                        if (!place) return null;
                        return (
                          <button
                            key={stop.placeId}
                            type="button"
                            onClick={() => {
                              setActivePlaceId(place.id);
                              setSelectedPlace(place);
                            }}
                            className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-sunken"
                          >
                            <span className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-meta font-semibold text-accent-ink">
                              {index + 1}
                              {index < activeRoute.stops.length - 1 ? (
                                <span className="absolute left-1/2 top-[30px] h-8 w-px -translate-x-1/2 border-l border-dashed border-line-strong" />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium text-fg">{place.name}</span>
                                <span className="ml-auto shrink-0 text-meta text-muted">{stop.time}</span>
                              </span>
                              <span className="mt-0.5 block truncate text-meta text-muted">
                                {stop.note || place.address}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-line p-3">
                      <ButtonLink
                        to={`/routes/${activeRoute.id}`}
                        variant="secondary"
                        size="sm"
                        iconRight="arrowRight"
                        fullWidth
                      >
                        {tr("Открыть маршрут")}
                      </ButtonLink>
                    </div>
                  </>
                ) : (
                  <div className="p-4">
                    <EmptyState
                      icon="routes"
                      title={tr("Выберите маршрут")}
                      description={tr("Линия маршрута появится на карте.")}
                      className="border-0 bg-transparent px-2 py-6"
                    />
                  </div>
                )}

                <div className="mt-auto border-t border-line p-3">
                  <button
                    type="button"
                    onClick={() => setMode("places")}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm text-muted transition-colors hover:bg-sunken hover:text-fg"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon name="grid" size={15} />
                      {tr("Все места")}
                    </span>
                    <span>{places.length}</span>
                  </button>
                </div>
              </div>
            )}
          </aside>

          <div className="relative order-1 min-w-0 lg:order-2">
            <div
              id="map-canvas"
              className="relative h-[52svh] min-h-[360px] lg:h-[calc(100svh-190px)] lg:min-h-[600px] lg:max-h-[820px]"
            >
              {mode === "routes" && activeRoute ? (
                <MapView
                  markers={routeStops}
                  routeStops={routeStops}
                  route={routePoints}
                  className="h-full"
                  showLocate={false}
                />
              ) : (
                <MapView
                  markers={filtered.map((place) => ({
                    id: place.id,
                    name: place.name,
                    coords: place.coords,
                    category: place.category,
                  }))}
                  activeId={activePlaceId}
                  onMarkerClick={(id) => {
                    if (markMode) return;
                    setActivePlaceId(id);
                  }}
                  onMapClick={(coords) => {
                    if (!markMode) return;
                    setAddCoords(coords);
                    setAddOpen(true);
                    setMarkMode(false);
                  }}
                  className={cn("h-full", markMode && "[&_.leaflet-container]:cursor-crosshair")}
                />
              )}

              <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 shadow-card backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-meta font-medium text-fg">
                  {mode === "routes" ? activeRoute?.title : `${filtered.length} ${tr("мест")} · ${tr("Өскемен")}`}
                </span>
              </div>

              {mode === "places" ? (
                <Button
                  variant={markMode ? "primary" : "secondary"}
                  size="sm"
                  icon="crosshair"
                  aria-pressed={markMode}
                  onClick={() => {
                    if (markMode) {
                      setMarkMode(false);
                      return;
                    }
                    requireAuth(
                      () => {
                        setMarkMode(true);
                        setActivePlaceId(null);
                        setSelectedPlace(null);
                      },
                      tr("Войдите, чтобы отметить своё место"),
                    );
                  }}
                  className="absolute right-3 top-14 z-[500] shadow-card"
                >
                  {tr("Отметить точку")}
                </Button>
              ) : null}

              {markMode ? (
                <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex justify-center">
                  <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-surface/95 px-4 py-2 shadow-raised backdrop-blur-md">
                    <Icon name="crosshair" size={15} className="text-accent" />
                    <span className="text-sm text-fg">{tr("Нажмите на карту, чтобы поставить точку")}</span>
                  </div>
                </div>
              ) : null}

              {mode === "places" && activePlace ? (
                <div className="absolute inset-x-3 bottom-3 z-[500] sm:left-3 sm:right-auto sm:w-[320px]">
                  <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-raised">
                    <div className="flex gap-3 p-2.5">
                      <img
                        src={activePlace.image}
                        alt=""
                        className="h-[72px] w-[80px] shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="text-meta text-muted">{categoryMap[activePlace.category].shortLabel}</p>
                        <p className="mt-1 truncate font-display text-[15px] font-semibold text-fg">
                          {activePlace.name}
                        </p>
                        <p className="mt-1 truncate text-meta text-muted">{activePlace.address}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Button variant="secondary" size="sm" onClick={() => setSelectedPlace(activePlace)}>
                            {tr("Подробнее")}
                          </Button>
                          <Button
                            variant={draft?.stops.some((stop) => stop.placeId === activePlace.id) ? "secondary" : "primary"}
                            size="sm"
                            icon={draft?.stops.some((stop) => stop.placeId === activePlace.id) ? "check" : "plus"}
                            onClick={() => handleAddToDraft(activePlace)}
                          >
                            {draft?.stops.some((stop) => stop.placeId === activePlace.id)
                              ? tr("В маршруте")
                              : tr("В маршрут")}
                          </Button>
                        </div>
                      </div>
                      <IconButton
                        icon="close"
                        label={tr("Скрыть карточку")}
                        size="sm"
                        onClick={() => setActivePlaceId(null)}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <p className="text-meta text-muted">
          {tr("Карта: OpenStreetMap. Точки и адреса проверены по открытым данным.")}
        </p>
        <Link
          to="/guide"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
        >
          {tr("Открыть гид")}
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>

      <PlaceDetail
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onSelectPlace={(place) => {
          setSelectedPlace(place);
          setActivePlaceId(place.id);
        }}
      />

      <AddPlaceModal
        open={addOpen}
        onClose={closeAddModal}
        initialCoords={addCoords}
        onCreated={(place) => {
          setMode("places");
          setCategory("all");
          setCommunityOnly(false);
          setQuery("");
          setActivePlaceId(place.id);
          setAddCoords(null);
          setMarkMode(false);
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("add");
              return next;
            },
            { replace: true },
          );
        }}
      />
    </div>
  );
}
