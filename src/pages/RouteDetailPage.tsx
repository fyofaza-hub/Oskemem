import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { categoryMap } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn, durationLabel, pluralizeStops, shareLink } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";
import { CategoryIcon } from "@/components/ui/Category";
import { Icon } from "@/components/ui/Icon";
import { MapView } from "@/components/map/MapView";
import { RouteCard } from "@/components/routes/RouteCard";

export function RouteDetailPage() {
  const { id } = useParams();
  const {
    getRoute,
    getUser,
    savedRouteIds,
    toggleSaveRoute,
    copyRoute,
    startDraft,
    routes,
    placeMap,
  } = useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  const route = id ? getRoute(id) : undefined;

  if (!route) {
    return (
      <div className="page-wrap">
        <EmptyState
          icon="routes"
          title={tr("Маршрут не найден")}
          description={tr("Возможно, он был создан в другом браузере или ссылка устарела. В библиотеке есть готовые сценарии.")}
          action={
            <ButtonLink to="/routes" variant="primary" icon="arrowLeft">
              {tr("К маршрутам")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const author = getUser(route.authorId);
  const saved = savedRouteIds.includes(route.id);
  const stopPlaces = route.stops.flatMap((stop) => {
    const place = placeMap[stop.placeId];
    return place ? [{ stop, place }] : [];
  });
  const markers = stopPlaces.map(({ place }) => ({
    id: place.id,
    name: place.name,
    coords: place.coords,
    category: place.category,
  }));
  const points = stopPlaces.map(({ place }) => place.coords);
  const related = routes
    .filter(
      (item) =>
        item.id !== route.id && item.categories.some((category) => route.categories.includes(category)),
    )
    .slice(0, 3);

  const handleSave = () => {
    requireAuth(() => {
      toggleSaveRoute(route.id);
      toast({
        title: saved ? tr("Маршрут убран из сохранённых") : tr("Маршрут сохранён"),
        description: route.title,
        variant: saved ? "info" : "success",
      });
    });
  };

  const handleCopy = () => {
    requireAuth(() => {
      const copy = copyRoute(route.id);
      if (!copy) {
        toast({ title: tr("Не удалось создать копию"), variant: "error" });
        return;
      }
      toast({
        title: tr("Копия маршрута создана"),
        description: tr("Она уже в профиле, в разделе «Мои маршруты»."),
      });
      navigate(`/routes/${copy.id}`);
    });
  };

  const handleShare = async () => {
    const result = await shareLink({
      title: route.title,
      text: `${route.title} · ${pluralizeStops(route.stops.length)} · ${durationLabel(route.durationMin)}`,
      url: `${window.location.origin}/routes/${route.id}`,
    });
    if (result === "copied") {
      toast({ title: tr("Ссылка на маршрут скопирована"), description: tr("Отправьте её друзьям.") });
    } else if (result === "failed") {
      toast({ title: tr("Не удалось скопировать ссылку"), variant: "error" });
    }
  };

  const handleUseAsBase = () => {
    requireAuth(() => {
      startDraft(
        route.stops.map((stop) => stop.placeId),
        {
          title: `${route.title} · ${tr("моя версия")}`,
          description: route.description,
        },
      );
      toast({
        title: tr("Основа маршрута перенесена в конструктор"),
        description: tr("Измените порядок, время и заметки."),
      });
      navigate("/routes/new");
    });
  };

  return (
    <div className="page-wrap">
      <nav className="flex items-center gap-2 text-sm text-muted" aria-label={tr("Хлебные крошки")}>
        <Link
          to="/routes"
          className="inline-flex items-center gap-1.5 rounded-lg transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon name="arrowLeft" size={15} />
          {tr("Маршруты")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-fg">{route.title}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
        <div className="min-w-0">
          <section className="card overflow-hidden">
            <div className="relative aspect-[16/9] max-h-[380px] w-full overflow-hidden bg-sunken">
              <img src={route.cover} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
                <span className="badge bg-surface/95 text-fg shadow-card">
                  <Icon name="routes" size={14} />
                  {route.demo ? tr("готовый маршрут") : tr("ваш маршрут")}
                </span>
                {route.categories.slice(0, 3).map((category) => (
                  <span key={category} className="badge bg-surface/95 text-fg shadow-card">
                    <CategoryIcon category={category} size={13} />
                    {categoryMap[category].shortLabel}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[32px]">
                {route.title}
              </h1>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">{route.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={15} />
                  {durationLabel(route.durationMin)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="distance" size={15} />≈ {route.distanceKm} {tr("км")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="location" size={15} />
                  {pluralizeStops(route.stops.length)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="info" size={15} />
                  {tr("время и дистанция ориентировочные")}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar user={author} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {author?.name ?? tr("Городской автор")}
                    </p>
                    <p className="text-meta text-muted">{tr("автор маршрута")}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={saved ? "primary" : "secondary"}
                    size="sm"
                    icon="bookmark"
                    onClick={handleSave}
                    aria-pressed={saved}
                  >
                    {saved ? tr("Сохранено") : tr("Сохранить")}
                  </Button>
                  <Button variant="secondary" size="sm" icon="share" onClick={handleShare}>
                    {tr("Поделиться")}
                  </Button>
                  <Button variant="secondary" size="sm" icon="copy" onClick={handleCopy}>
                    {tr("Себе")}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="card mt-5 overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="section-title">{tr("Как пройдёт вечер")}</h2>
                <p className="mt-1 text-sm text-muted">
                  {tr("Нажмите на точку, чтобы показать её на карте.")}
                </p>
              </div>
              <span className="badge">≈ {route.distanceKm} {tr("км")}</span>
            </div>

            <div className="p-4 sm:p-5">
              {stopPlaces.length ? (
                stopPlaces.map(({ stop, place }, index) => {
                  const active = activeStopId === place.id;
                  return (
                    <div key={stop.placeId} className="relative flex gap-3 sm:gap-4">
                      <div className="flex w-8 shrink-0 flex-col items-center">
                        <button
                          type="button"
                          onClick={() => setActiveStopId(place.id)}
                          className={cn(
                            "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors",
                            active
                              ? "border-accent bg-accent text-white"
                              : "border-line bg-surface text-muted hover:border-accent hover:text-accent-ink",
                          )}
                          aria-label={`${tr("Показать на карте")}: ${place.name}`}
                          aria-pressed={active}
                        >
                          {index + 1}
                        </button>
                        {index < stopPlaces.length - 1 ? (
                          <span className="w-px flex-1 border-l border-dashed border-line-strong" aria-hidden="true" />
                        ) : null}
                      </div>

                      <div className={cn("min-w-0 flex-1", index < stopPlaces.length - 1 ? "pb-5" : "")}>
                        <div
                          className={cn(
                            "flex flex-col gap-3 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center",
                            active ? "border-accent/40 bg-accent-soft/40" : "border-line bg-surface",
                          )}
                        >
                          <img
                            src={place.image}
                            alt=""
                            className="h-20 w-full shrink-0 rounded-lg object-cover sm:h-[72px] sm:w-[84px]"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="badge badge-accent">{stop.time}</span>
                              <span className="text-meta text-muted">
                                {categoryMap[place.category].shortLabel}
                              </span>
                            </div>
                            <Link
                              to={`/guide?place=${place.id}`}
                              className="mt-1.5 block truncate font-display text-[16px] font-semibold text-fg transition-colors hover:text-accent-ink"
                            >
                              {place.name}
                            </Link>
                            <p className="mt-0.5 flex items-center gap-1.5 text-meta text-muted">
                              <Icon name="location" size={13} className="shrink-0" />
                              <span className="truncate">{place.address}</span>
                            </p>
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                              {stop.note || place.shortDescription}
                            </p>
                          </div>
                          <IconButton
                            icon="map"
                            label={`${tr("Показать на карте")}: ${place.name}`}
                            size="sm"
                            variant="bordered"
                            onClick={() => setActiveStopId(place.id)}
                            className="self-start sm:self-center"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon="location"
                  title={tr("В маршруте нет точек")}
                  description={tr("Добавьте места в конструкторе — они появятся здесь по порядку.")}
                  className="border-0 bg-transparent py-8"
                />
              )}
            </div>
          </section>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button variant="primary" icon="routePlanner" onClick={handleUseAsBase} fullWidth>
              {tr("Взять за основу")}
            </Button>
            <ButtonLink to={`/map?route=${route.id}`} variant="secondary" icon="map" fullWidth>
              {tr("Показать на карте целиком")}
            </ButtonLink>
          </div>
          <p className="mt-3 flex items-start gap-2 text-meta leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            {tr("Время и дистанция рассчитаны по точкам маршрута, а не по расписанию мест. Проверяйте актуальную информацию перед выходом.")}
          </p>
        </div>

        <aside className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-[88px]">
            <div className="card overflow-hidden">
              <div className="relative h-[300px]">
                <MapView
                  markers={markers}
                  routeStops={markers}
                  route={points}
                  activeId={activeStopId}
                  onMarkerClick={(placeId) => setActiveStopId(placeId)}
                  className="h-full"
                  showLocate={false}
                />
                <span className="pointer-events-none absolute left-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/95 px-2.5 py-1.5 text-meta font-medium text-fg shadow-card backdrop-blur-md">
                  <Icon name="routes" size={13} className="text-accent-ink" />
                  {pluralizeStops(route.stops.length)} · {route.distanceKm} {tr("км")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
                <span className="text-meta text-faint">{tr("линия маршрута · OpenStreetMap")}</span>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-1 text-meta font-medium text-accent-ink hover:underline"
                >
                  {tr("Карта города")}
                  <Icon name="arrowRight" size={13} />
                </Link>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-fg">{tr("Детали маршрута")}</h2>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted">{tr("Остановок")}</dt>
                  <dd className="font-medium text-fg">{route.stops.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted">{tr("Длительность")}</dt>
                  <dd className="font-medium text-fg">{durationLabel(route.durationMin)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted">{tr("Дистанция")}</dt>
                  <dd className="font-medium text-fg">≈ {route.distanceKm} {tr("км")}</dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-t border-line pt-3 text-sm">
                  <dt className="shrink-0 text-muted">{tr("Категории")}</dt>
                  <dd className="text-right font-medium text-fg">
                    {route.categories.map((category) => categoryMap[category].shortLabel).join(", ")}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl bg-sunken p-5">
              <Icon name="info" size={18} className="text-accent-ink" />
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {tr("Места и адреса — по данным OpenStreetMap. Фотографии могут быть иллюстративными.")}
              </p>
              <ButtonLink to="/guide" variant="ghost" size="sm" iconRight="arrowRight" className="mt-3 -ml-2">
                {tr("Открыть гид")}
              </ButtonLink>
            </div>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="section-title">{tr("Похожие маршруты")}</h2>
            <ButtonLink to="/routes" variant="ghost" size="sm" iconRight="arrowRight">
              {tr("Все маршруты")}
            </ButtonLink>
          </div>
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <RouteCard key={item.id} route={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
