import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Compass,
  Crosshair,
  Layers,
  LocateFixed,
  MapPin,
  MapPinPlus,
  Plus,
  Route as RouteIcon,
  Search,
  X,
} from "lucide-react";
import type { CategoryId, Place, Route } from "@/types";
import { categoryMap, countPlacesByCategory } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import {
  cn,
  durationLabel,
  normalize,
  pluralizeStops,
} from "@/lib/utils";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { AddPlaceModal } from "@/components/places/AddPlaceModal";
import { PlaceDetail } from "@/components/places/PlaceDetail";
import { MapView } from "@/components/map/MapView";
import { CategoryIcon } from "@/components/ui/Category";
import { EmptyState } from "@/components/ui/Bits";
import { tr } from "@/i18n/runtime";

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
  const [activeRouteId, setActiveRouteId] = useState<string | null>(
    deepRoute?.id ?? routes[0]?.id ?? null,
  );
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showMobileList, setShowMobileList] = useState(false);
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
        title: result === "exists" ? tr("Место уже в черновике") : tr("Добавлено в маршрут"),
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
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent">04</span>
            <span className="h-px w-8 bg-white/15" />
            <span className="eyebrow">{tr("интерактивная карта · OpenStreetMap")}</span>
          </div>
          <h1 className="display-title mt-3 text-[clamp(2.5rem,4.6vw,4.1rem)] text-primary">
            {tr(" Карта ")}<span className="text-outline">{tr("города")}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setMode("places")}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[11px] transition-all",
                mode === "places" ? "bg-white/10 text-primary" : "text-white/40 hover:text-white/75",
              )}
            >
              <MapPin size={12} /> {tr(" Места ")}</button>
            <button
              type="button"
              onClick={() => setMode("routes")}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[11px] transition-all",
                mode === "routes" ? "bg-white/10 text-primary" : "text-white/40 hover:text-white/75",
              )}
            >
              <RouteIcon size={12} /> {tr(" Маршрут ")}</button>
          </div>
          <Link to="/routes/new" className="btn btn-primary btn-md gap-1.5">
            <Plus size={14} /> {tr(" Собрать свой ")}</Link>
          <button
            type="button"
            onClick={() =>
              requireAuth(() => {
                setMarkMode(false);
                setAddCoords(null);
                setAddOpen(true);
              }, tr("Войдите, чтобы добавить своё место"))
            }
            className="btn btn-secondary btn-md gap-1.5"
          >
            <MapPinPlus size={14} /> {tr(" Добавить место ")}</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-white/9 bg-surface">
        <div className="grid min-w-0 lg:grid-cols-[380px_1fr]">
          <aside className="order-2 flex min-w-0 max-h-[760px] flex-col border-t border-white/8 lg:order-1 lg:h-[calc(100svh-205px)] lg:min-h-[620px] lg:max-h-none lg:border-r lg:border-t-0">
            {mode === "places" ? (
              <>
                <div className="border-b border-white/8 p-3.5">
                  <div className="relative">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={tr("Найти на карте…")}
                      className="field h-10 pl-9 pr-8 text-[12px]"
                      aria-label={tr("Поиск мест на карте")}
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                        aria-label={tr("Очистить")}
                      >
                        <X size={13} />
                      </button>
                    ) : null}
                  </div>
                  <CategoryFilter
                    value={category}
                    onChange={(value) => {
                      setCategory(value);
                      if (value === "all") setCommunityOnly(false);
                      setActivePlaceId(null);
                    }}
                    counts={categoryCounts}
                    wrap={false}
                    showScrollbar
                    className="mt-3 -mb-1"
                    leading={
                      <button
                        type="button"
                        role="tab"
                        aria-selected={communityOnly}
                        onClick={() => {
                          setCommunityOnly((prev) => !prev);
                          setActivePlaceId(null);
                        }}
                        className={cn(
                          "chip shrink-0 gap-2",
                          communityOnly && "chip-active",
                        )}
                      >
                        <MapPinPlus size={13} />
                        {tr(" Мои места ")}<span
                          className={cn(
                            "font-mono text-[9px]",
                            communityOnly ? "text-accent/80" : "text-white/30",
                          )}
                        >
                          {communityCount}
                        </span>
                      </button>
                    }
                  />
                </div>

                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">
                    {filtered.length} {tr(" точек · нажмите, чтобы приблизить ")}</span>
                  <span className="flex items-center gap-1 text-[9px] text-white/25">
                    <Layers size={10} /> {favorites.length} {tr(" в избранном ")}</span>
                </div>

                <div className="no-scrollbar flex-1 overflow-y-auto px-2 pb-3">
                  {!ready ? (
                    <div className="space-y-1.5 p-1.5">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-xl border border-white/6 p-2.5"
                        >
                          <div className="skeleton h-12 w-12" />
                          <div className="flex-1">
                            <div className="skeleton h-3 w-3/4" />
                            <div className="skeleton mt-2 h-2.5 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filtered.length ? (
                    filtered.map((place) => {
                      const active = activePlaceId === place.id;
                      const favorite = favorites.includes(place.id);
                      return (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => {
                            setActivePlaceId(place.id);
                            setShowMobileList(false);
                            document
                              .getElementById("map-canvas")
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all",
                            active
                              ? "border-accent/35 bg-accent/[0.08]"
                              : "border-transparent hover:border-white/8 hover:bg-white/[0.035]",
                          )}
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                            <img
                              src={place.image}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "truncate text-[12px]",
                                  active ? "text-white" : "text-white/75",
                                )}
                              >
                                {place.name}
                              </span>
                              {favorite ? (
                                <span className="h-1 w-1 shrink-0 rounded-full bg-accent" />
                              ) : null}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-white/30">
                              <CategoryIcon category={place.category} size={9} />
                              <span className="truncate">{place.district}</span>
                              <span>·</span>
                              <span className="truncate">{place.address}</span>
                            </div>
                          </div>
                          <ArrowRight
                            size={12}
                            className={cn(
                              "shrink-0 transition-transform",
                              active
                                ? "text-accent"
                                : "text-white/15 group-hover:translate-x-0.5 group-hover:text-white/40",
                            )}
                          />
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <Compass size={22} className="mx-auto text-white/20" />
                      <p className="mt-3 text-[12px] text-white/50">{tr("Точек не нашлось")}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setCategory("all");
                        }}
                        className="mt-3 text-[10px] text-accent"
                      >
                        {tr(" Сбросить фильтры ")}</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-white/8 p-4">
                  <label className="field-label" htmlFor="map-route">
                    {tr(" Готовый маршрут ")}</label>
                  <select
                    id="map-route"
                    value={activeRouteId ?? ""}
                    onChange={(event) => setActiveRouteId(event.target.value)}
                    className="field appearance-none"
                  >
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.title}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("places")}
                      className="text-[9px] text-white/30 transition-colors hover:text-white/70"
                    >
                      {tr(" ← все места ")}</button>
                    <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">
                      {tr(" пунктир = маршрут ")}</span>
                  </div>
                </div>

                {activeRoute ? (
                  <>
                    <div className="border-b border-white/8 px-4 py-3.5">
                      <h2 className="font-display text-[18px] font-normal leading-tight text-primary">
                        {activeRoute.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-relaxed text-white/35">
                        {activeRoute.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="pill py-1 text-[9px]">
                          {pluralizeStops(activeRoute.stops.length)}
                        </span>
                        <span className="pill py-1 text-[9px]">{durationLabel(activeRoute.durationMin)}</span>
                        <span className="pill py-1 text-[9px]">≈ {activeRoute.distanceKm} {tr(" км")}</span>
                      </div>
                    </div>
                    <div className="no-scrollbar flex-1 overflow-y-auto p-3">
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
                            className="group flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.035]"
                          >
                            <span className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-mono text-[9px] text-accent">
                              {index + 1}
                              {index < activeRoute.stops.length - 1 ? (
                                <span className="absolute left-1/2 top-[30px] h-8 w-px -translate-x-1/2 border-l border-dashed border-white/12" />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="truncate text-[11.5px] text-white/80">
                                  {place.name}
                                </span>
                                <span className="ml-auto shrink-0 font-mono text-[8px] text-white/30">
                                  {stop.time}
                                </span>
                              </span>
                              <span className="mt-0.5 block truncate text-[9.5px] text-white/30">
                                {stop.note || place.address}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-white/8 p-3">
                      <Link
                        to={`/routes/${activeRoute.id}`}
                        className="btn btn-secondary btn-sm w-full gap-1.5"
                      >
                        {tr(" Открыть маршрут ")}<ArrowRight size={12} />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-[12px] text-white/40">
                    {tr(" Выберите маршрут, чтобы увидеть линию на карте. ")}</div>
                )}
              </div>
            )}
          </aside>

          <div className="relative order-1 min-w-0 lg:order-2">
            <div
              id="map-canvas"
              className="relative h-[54svh] min-h-[390px] lg:h-[calc(100svh-205px)] lg:min-h-[620px]"
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
                    setShowMobileList(false);
                  }}
                  onMapClick={(coords) => {
                    if (!markMode) return;
                    setAddCoords(coords);
                    setAddOpen(true);
                    setMarkMode(false);
                  }}
                  className={cn(
                    "h-full",
                    markMode && "[&_.leaflet-container]:cursor-crosshair",
                  )}
                />
              )}

              {mode === "places" ? (
                <button
                  type="button"
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
                  aria-pressed={markMode}
                  aria-label={tr("Отметить точку на карте")}
                  className={cn(
                    "absolute right-3 top-14 z-[500] flex h-9 items-center gap-1.5 rounded-xl border px-2.5 shadow-lg backdrop-blur-md transition-colors",
                    markMode
                      ? "border-accent/45 bg-accent/15 text-accent"
                      : "border-white/10 bg-card/94 text-white/60 hover:text-white",
                  )}
                >
                  <Crosshair size={14} />
                  <span className="hidden text-[9px] font-medium sm:inline">{tr("Отметить точку")}</span>
                </button>
              ) : null}

              {markMode ? (
                <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex justify-center">
                  <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-surface/95 px-4 py-2 shadow-float backdrop-blur-md">
                    <Crosshair size={13} className="text-accent" />
                    <span className="text-[10px] text-white/70">
                      {tr(" Нажмите на карту, чтобы поставить точку ")}</span>
                  </div>
                </div>
              ) : null}

              <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full border border-white/10 bg-surface/90 px-3 py-1.5 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/45">
                  {mode === "routes" ? activeRoute?.title : `${filtered.length} мест · Өскемен`}
                </span>
              </div>

              {mode === "places" && activePlace ? (
                <div
                  className={cn(
                    "absolute inset-x-3 bottom-3 z-[500] sm:left-3 sm:right-auto sm:w-[300px]",
                    draft?.stops.length && "lg:bottom-24",
                  )}
                >
                  <div className="overflow-hidden rounded-2xl border border-white/12 bg-elevated shadow-float">
                    <div className="flex gap-3 p-2.5">
                      <img
                        src={activePlace.image}
                        alt=""
                        className="h-[68px] w-[74px] shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-white/30">
                          {categoryMap[activePlace.category].shortLabel}
                        </p>
                        <p className="mt-1 line-clamp-1 font-display text-[14px] text-primary">
                          {activePlace.name}
                        </p>
                        <p className="mt-1 line-clamp-1 text-[9.5px] text-white/35">
                          {activePlace.address}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPlace(activePlace)}
                            className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[8.5px] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
                          >
                            {tr(" Подробнее ")}</button>
                          <button
                            type="button"
                            onClick={() => handleAddToDraft(activePlace)}
                            className={cn(
                              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[8.5px] transition-colors",
                              draft?.stops.some((stop) => stop.placeId === activePlace.id)
                                ? "bg-accent/15 text-accent"
                                : "on-accent bg-accent text-white hover:bg-accent-hover",
                            )}
                          >
                            {draft?.stops.some((stop) => stop.placeId === activePlace.id) ? (
                              <Check size={9} />
                            ) : (
                              <Plus size={9} />
                            )}
                            {draft?.stops.some((stop) => stop.placeId === activePlace.id)
                              ? tr("В маршруте")
                              : tr("В маршрут")}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePlaceId(null)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/25 transition-colors hover:bg-white/[0.07] hover:text-white"
                        aria-label={tr("Скрыть карточку")}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.018] px-4 py-3">
        <p className="text-[10px] text-white/35">
          {tr(" Карта: OpenStreetMap. Точки и адреса проверены по открытым данным. ")}</p>
        <div className="flex items-center gap-4">
          <Link to="/guide" className="text-[10px] text-accent transition-opacity hover:opacity-75">
            {tr(" Открыть гид → ")}</Link>
          <span className="hidden items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/25 sm:flex">
            <LocateFixed size={10} /> {tr(" прицел на карте = моя точка ")}</span>
        </div>
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
          setShowMobileList(false);
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
