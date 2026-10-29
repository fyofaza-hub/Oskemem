import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock3,
  Copy,
  MapPin,
  Route as RouteIcon,
  Share2,
  Signpost,
  Sparkles,
} from "lucide-react";
import { categoryMap } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  cn,
  durationLabel,
  pluralizeStops,
  shareLink,
} from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Bits";
import { CategoryDot } from "@/components/ui/Category";
import { MapView } from "@/components/map/MapView";
import { RouteCard } from "@/components/routes/RouteCard";
import { tr } from "@/i18n/runtime";

export function RouteDetailPage() {
  const { id } = useParams();
  const { getRoute, getUser, currentUser, savedRouteIds, toggleSaveRoute, copyRoute, startDraft, routes, placeMap } =
    useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  const route = id ? getRoute(id) : undefined;

  if (!route) {
    return (
      <div className="page-wrap">
        <EmptyState
          icon={RouteIcon}
          title={tr("Маршрут не найден")}
          description={tr("Возможно, он был создан в другом браузере или ссылка устарела. В библиотеке есть готовые сценарии.")}
          action={
            <Link to="/routes" className="btn btn-primary btn-sm gap-1.5">
              <ArrowLeft size={12} /> {tr(" К маршрутам ")}</Link>
          }
        />
      </div>
    );
  }

  const author = getUser(route.authorId);
  const saved = savedRouteIds.includes(route.id);
  const stopPlaces = route.stops
    .map((stop) => ({ stop, place: placeMap[stop.placeId] }))
    .filter((item) => Boolean(item.place));
  const markers = stopPlaces.map(({ place }) => ({
    id: place.id,
    name: place.name,
    coords: place.coords,
    category: place.category,
  }));
  const points = stopPlaces.map(({ place }) => place.coords);
  const related = routes
    .filter((item) => item.id !== route.id && item.categories.some((cat) => route.categories.includes(cat)))
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
          title: `${route.title} · моя версия`,
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
      <div className="mb-4 flex items-center gap-3 text-[10px] text-white/30">
        <Link to="/routes" className="flex items-center gap-1.5 transition-colors hover:text-white">
          <ArrowLeft size={12} /> {tr(" Маршруты ")}</Link>
        <span>/</span>
        <span className="truncate text-white/50">{route.title}</span>
      </div>

      <section className="relative overflow-hidden rounded-[28px] border border-white/10">
        <div className="on-media relative h-[320px] sm:h-[400px]">
          <img src={route.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e13] via-[#0b0e13]/55 to-[#0b0e13]/20" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.09] px-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-accent-soft backdrop-blur-md">
                {route.demo ? tr("готовый маршрут") : tr("ваш маршрут")}
              </span>
              {route.categories.map((category) => (
                <span
                  key={category}
                  className="flex h-7 items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/65 backdrop-blur-md"
                >
                  <CategoryDot category={category} />
                  {categoryMap[category].shortLabel}
                </span>
              ))}
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,5.5vw,4.2rem)] font-light leading-[1.01] tracking-[-0.05em] text-white">
              {route.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] text-white/50">
              <span className="flex items-center gap-1.5">
                <Clock3 size={11} /> {durationLabel(route.durationMin)}
              </span>
              <span className="flex items-center gap-1.5">
                <Signpost size={11} /> ≈ {route.distanceKm} {tr(" км ")}</span>
              <span className="flex items-center gap-1.5">
                <RouteIcon size={11} /> {pluralizeStops(route.stops.length)}
              </span>
              <span>{tr("· время и дистанция ориентировочные")}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar user={author} size="sm" />
              <div>
                <p className="text-[11.5px] text-white/75">{author?.name ?? tr("Городской автор")}</p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/25">
                  {tr(" автор маршрута ")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                className={cn("btn btn-sm gap-1.5", saved ? "btn-primary" : "btn-secondary")}
              >
                <Bookmark size={13} fill={saved ? "currentColor" : "none"} />
                {saved ? tr("Сохранено") : tr("Сохранить")}
              </button>
              <button type="button" onClick={handleShare} className="btn btn-secondary btn-sm gap-1.5">
                <Share2 size={13} /> {tr(" Поделиться ")}</button>
              <button type="button" onClick={handleCopy} className="btn btn-secondary btn-sm gap-1.5">
                <Copy size={13} /> {tr(" Себе ")}</button>
            </div>
          </div>

          <div className="mt-7 border-t border-white/8 pt-6">
            <p className="eyebrow mb-3">{tr("о маршруте")}</p>
            <p className="max-w-2xl text-[13px] leading-[1.8] text-white/55">{route.description}</p>
          </div>

          <div className="mt-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">{tr("остановки")}</p>
                <h2 className="mt-2 font-display text-2xl font-light tracking-[-0.03em] text-primary">
                  {tr(" Как пройдёт вечер ")}</h2>
              </div>
              <span className="hidden font-mono text-[8px] uppercase tracking-[0.1em] text-white/20 sm:block">
                {tr(" нажмите на точку → карта ")}</span>
            </div>

            <div className="mt-5">
              {stopPlaces.map(({ stop, place }, index) => {
                const active = activeStopId === place.id;
                return (
                  <div key={stop.placeId} className="relative flex gap-4">
                    <div className="flex w-7 shrink-0 flex-col items-center">
                      <button
                        type="button"
                        onClick={() => setActiveStopId(place.id)}
                        className={cn(
                          "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[9px] transition-all",
                          active
                            ? "border-accent on-accent bg-accent text-white shadow-[0_0_0_5px_rgba(77,141,255,0.15)]"
                            : "border-white/18 bg-card text-white/50 hover:border-accent/50 hover:text-accent",
                        )}
                        aria-label={`Показать ${place.name} на карте`}
                      >
                        {index + 1}
                      </button>
                      {index < stopPlaces.length - 1 ? (
                        <span className="w-px flex-1 border-l border-dashed border-white/12" />
                      ) : null}
                    </div>

                    <div className={cn("min-w-0 flex-1 pb-6", active && "pb-8")}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-0.5 font-mono text-[8.5px] text-white/55">
                          {stop.time}
                        </span>
                        <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-white/22">
                          {categoryMap[place.category].shortLabel}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-3 rounded-2xl border border-white/8 bg-white/[0.022] p-2.5 transition-colors hover:border-white/15">
                        <img
                          src={place.image}
                          alt=""
                          className="h-[76px] w-[84px] shrink-0 rounded-xl object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1 py-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/guide?place=${place.id}`)
                            }
                            className="block max-w-full truncate text-left font-display text-[15px] text-primary transition-colors hover:text-white"
                          >
                            {place.name}
                          </button>
                          <p className="mt-1 flex items-center gap-1.5 truncate text-[9.5px] text-white/30">
                            <MapPin size={9} className="shrink-0" />
                            {place.address}
                          </p>
                          {stop.note ? (
                            <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-white/40">
                              {stop.note}
                            </p>
                          ) : (
                            <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-white/40">
                              {place.shortDescription}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStopId(place.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-white/25 transition-colors hover:bg-white/[0.06] hover:text-accent"
                          aria-label={tr("Показать на карте")}
                        >
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={handleUseAsBase} className="btn btn-primary btn-md gap-2">
              <Sparkles size={14} /> {tr(" Взять за основу ")}</button>
            <Link
              to={`/map?route=${route.id}`}
              className="btn btn-secondary btn-md gap-2"
            >
              <MapPin size={14} /> {tr(" Показать на карте целиком ")}</Link>
          </div>
          <p className="mt-3 text-[9.5px] leading-relaxed text-white/25">
            {tr(" Время и дистанция рассчитаны по точкам маршрута, а не по расписанию мест. Проверяйте актуальную информацию перед выходом. ")}</p>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-[92px] space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/9 bg-surface">
              <div className="relative h-[300px] lg:h-[330px]">
                <MapView
                  markers={markers}
                  routeStops={markers}
                  route={points}
                  activeId={activeStopId}
                  onMarkerClick={(placeId) => setActiveStopId(placeId)}
                  className="h-full"
                  showLocate={false}
                />
                <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-full border border-white/10 bg-surface/90 px-2.5 py-1.5 backdrop-blur-md">
                  <RouteIcon size={10} className="text-accent" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/45">
                    {pluralizeStops(route.stops.length)} · {route.distanceKm} {tr(" км ")}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[9px] text-white/25">{tr("линия маршрута · OpenStreetMap")}</span>
                <Link to="/map" className="text-[9px] text-accent transition-opacity hover:opacity-70">
                  {tr(" карта города → ")}</Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.022] p-4">
              <p className="eyebrow">{tr("детали сценария")}</p>
              <dl className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between text-[10.5px]">
                  <dt className="text-white/30">{tr("Остановок")}</dt>
                  <dd className="text-white/65">{route.stops.length}</dd>
                </div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <dt className="text-white/30">{tr("Длительность")}</dt>
                  <dd className="text-white/65">{durationLabel(route.durationMin)}</dd>
                </div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <dt className="text-white/30">{tr("Дистанция")}</dt>
                  <dd className="text-white/65">≈ {route.distanceKm} {tr(" км")}</dd>
                </div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <dt className="text-white/30">{tr("Категории")}</dt>
                  <dd className="max-w-[60%] text-right text-white/65">
                    {route.categories.map((category) => categoryMap[category].shortLabel).join(", ")}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center gap-2 border-t border-white/7 pt-3">
                <Check size={11} className="text-emerald-300/60" />
                <p className="text-[9px] leading-relaxed text-white/30">
                  {tr(" Места и адреса — по данным OpenStreetMap. Фотографии могут быть иллюстративными. ")}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">{tr("дальше")}</p>
              <h2 className="mt-2 font-display text-2xl font-light tracking-[-0.03em] text-primary">
                {tr(" Похожие маршруты ")}</h2>
            </div>
            <Link to="/routes" className="text-[10.5px] text-white/35 transition-colors hover:text-white">
              {tr(" Все маршруты → ")}</Link>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <RouteCard key={item.id} route={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
