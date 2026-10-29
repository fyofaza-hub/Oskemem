import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Clock3,
  Compass,
  GripVertical,
  MapPin,
  Plus,
  Route as RouteIcon,
  Save,
  Search,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { CategoryId, Place } from "@/types";
import { categoryMap, countPlacesByCategory } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import {
  cartesianRoute,
  cn,
  durationLabel,
  normalize,
  pluralizeStops,
  shareLink,
} from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { TimeField } from "@/components/ui/TimeField";
import { EmptyState } from "@/components/ui/Bits";
import { CategoryIcon } from "@/components/ui/Category";
import { MapView } from "@/components/map/MapView";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { tr } from "@/i18n/runtime";

interface AddPlaceModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onAdd: (place: Place) => void;
}

function AddPlaceModal({ open, onClose, selectedIds, onAdd }: AddPlaceModalProps) {
  const { places } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const counts = useMemo(() => countPlacesByCategory(places), [places]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCategory("all");
    }
  }, [open]);

  const filtered = places.filter((place) => {
    if (category !== "all" && place.category !== category) return false;
    if (!query.trim()) return true;
    return normalize(
      [place.name, place.address, place.district, place.shortDescription, ...place.tags].join(" "),
    ).includes(normalize(query));
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr("Добавить место")}
      description={tr("Выбирайте точки — черновик обновляется автоматически. Можно добавить несколько.")}
      size="lg"
    >
      <div className="p-4 sm:p-5">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("Название, район или настроение…")}
            className="field h-10 pl-10 pr-9 text-[12px]"
            autoFocus
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              aria-label={tr("Очистить")}
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
        <CategoryFilter value={category} onChange={setCategory} counts={counts} className="mt-3" />
        <div className="mt-3 h-px bg-white/7" />

        <div className="mt-2 max-h-[48vh] space-y-1 overflow-y-auto pr-1">
          {filtered.map((place) => {
            const selected = selectedIds.includes(place.id);
            return (
              <div
                key={place.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
              >
                <img
                  src={place.image}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-white/75">{place.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[9.5px] text-white/30">
                    <CategoryIcon category={place.category} size={9} />
                    {place.district} · {place.address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(place)}
                  disabled={selected}
                  className={cn(
                    "flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2.5 text-[9.5px] transition-colors",
                    selected
                      ? "bg-accent/10 text-accent"
                      : "border border-white/10 bg-white/[0.035] text-white/55 hover:border-accent/30 hover:bg-accent/10 hover:text-accent",
                  )}
                  aria-label={selected ? tr("Уже в маршруте") : `Добавить ${place.name}`}
                >
                  {selected ? <Check size={12} /> : <Plus size={12} />}
                  {selected ? tr("в маршруте") : tr("добавить")}
                </button>
              </div>
            );
          })}
          {!filtered.length ? (
            <div className="py-10 text-center">
              <Compass size={20} className="mx-auto text-white/20" />
              <p className="mt-2 text-[11.5px] text-white/40">{tr("Ничего не нашлось")}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
          <span className="text-[9.5px] text-white/25">{tr("Выбрано: ")}{selectedIds.length}</span>
          <button type="button" onClick={onClose} className="btn btn-primary btn-sm gap-1.5">
            {tr(" Готово ")}<Check size={12} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 12) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

export function RouteBuilderPage() {
  const {
    currentUser,
    draft,
    startDraft,
    updateDraft,
    addPlaceToDraft,
    removeStop,
    reorderStops,
    updateStop,
    clearDraft,
    saveDraftAsRoute,
    placeMap,
  } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; stops?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser && !draft) startDraft([]);
    // Черновик инициализируем один раз при входе в конструктор.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const stops = useMemo(() => {
    if (!draft) return [];
    return draft.stops.flatMap((stop) => {
      const place = placeMap[stop.placeId];
      return place ? [{ stop, place }] : [];
    });
  }, [draft, placeMap]);

  const points = stops.map(({ place }) => place.coords);
  const distance = cartesianRoute(points);
  const baseDuration = stops.length
    ? Math.max(30, toMinutes(stops[stops.length - 1].stop.time) - toMinutes(stops[0].stop.time))
    : 0;
  const duration = Math.max(baseDuration, stops.length * 30);

  if (!currentUser) {
    return (
      <div className="page-wrap">
        <EmptyState
          icon={RouteIcon}
          title={tr("Войдите, чтобы собрать маршрут")}
          description={tr("Черновики хранятся в аккаунте этого браузера. Вход не требует почты — достаточно одного нажатия.")}
          action={
            <Link to="/auth?from=/routes/new" className="btn btn-primary btn-sm">
              {tr(" Войти в аккаунт ")}</Link>
          }
        />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="page-wrap">
        <div className="grid gap-4">
          <div className="skeleton h-10 w-56" />
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="skeleton h-[440px] rounded-3xl" />
            <div className="skeleton h-[440px] rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const validate = () => {
    const nextErrors: { title?: string; stops?: string } = {};
    if (draft.title.trim().length < 3) nextErrors.title = tr("Дайте маршруту название или оставьте «Мой маршрут».");
    if (draft.stops.length < 2) nextErrors.stops = tr("Для маршрута нужно минимум две точки.");
    setErrors(nextErrors);
    if (nextErrors.title) {
      toast({ title: tr("Нужно название"), description: nextErrors.title, variant: "error" });
    }
    if (nextErrors.stops) {
      toast({
        title: tr("Слишком мало остановок"),
        description: nextErrors.stops,
        variant: "error",
      });
    }
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (share = false) => {
    if (!validate()) return;
    setSaving(true);
    const route = saveDraftAsRoute();
    setSaving(false);
    if (!route) {
      toast({
        title: tr("Не удалось сохранить маршрут"),
        description: tr("Проверьте название и количество остановок."),
        variant: "error",
      });
      return;
    }
    toast({
      title: tr("Маршрут сохранён"),
      description: `${route.title} · ${pluralizeStops(route.stops.length)}`,
    });
    if (share) {
      const result = await shareLink({
        title: route.title,
        text: `${route.title} · ${pluralizeStops(route.stops.length)} · ${durationLabel(duration)}`,
        url: `${window.location.origin}/routes/${route.id}`,
      });
      if (result === "copied") {
        toast({ title: tr("Ссылка на маршрут скопирована"), description: tr("Можно отправлять друзьям.") });
      }
    }
    navigate(`/routes/${route.id}`);
  };

  const handleAdd = (place: Place) => {
    const result = addPlaceToDraft(place.id);
    if (result === "exists") {
      toast({ title: tr("Место уже в маршруте"), variant: "info" });
      return;
    }
    setErrors((prev) => ({ ...prev, stops: undefined }));
    toast({ title: tr("Точка добавлена"), description: place.name, variant: "success" });
  };

  const handleClear = () => {
    clearDraft();
    setClearOpen(false);
    toast({ title: tr("Черновик очищен"), variant: "info" });
    navigate("/guide");
  };

  return (
    <div className="page-wrap">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3 text-[10px] text-white/30">
            <Link to="/routes" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <ArrowLeft size={12} /> {tr(" Маршруты ")}</Link>
            <span>/</span>
            <span className="text-white/50">{tr("конструктор")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent">05</span>
            <span className="h-px w-8 bg-white/15" />
            <span className="eyebrow">{tr("черновик сохраняется автоматически")}</span>
          </div>
          <h1 className="display-title mt-3 text-[clamp(2.3rem,4.5vw,3.8rem)] text-primary">
            {tr(" Конструктор ")}<span className="text-outline">{tr("маршрута")}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="icon-btn h-11 w-11 text-white/30 hover:text-red-300"
            aria-label={tr("Очистить черновик")}
          >
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="btn btn-secondary btn-md gap-2"
          >
            <Share2 size={14} /> {tr(" Сохранить и поделиться ")}</button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="btn btn-primary btn-md gap-2"
          >
            <Save size={14} /> {saving ? tr("Сохраняем…") : tr("Сохранить")}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
        <div className="min-w-0 space-y-5">
          <section className="card p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="on-media relative h-24 w-full shrink-0 overflow-hidden rounded-xl border border-white/8 bg-app-deep sm:h-28 sm:w-36">
                {stops[0] ? (
                  <>
                    <img src={stops[0].place.image} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <span className="absolute inset-x-2 bottom-2 font-mono text-[7px] uppercase tracking-[0.1em] text-white/60">
                      {tr(" обложка · первая точка ")}</span>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-white/20">
                    <RouteIcon size={20} />
                    <span className="px-3 text-center text-[8px] uppercase tracking-[0.1em]">
                      {tr(" появится с первой точкой ")}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label className="field-label" htmlFor="route-title">
                  {tr(" Название маршрута ")}</label>
                <input
                  id="route-title"
                  value={draft.title}
                  onChange={(event) => {
                    updateDraft({ title: event.target.value });
                    setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  maxLength={90}
                  placeholder={tr("Например: вечер на левом берегу")}
                  className={cn("field text-[14px]", errors.title && "border-red-400/50")}
                />
                {errors.title ? (
                  <p className="mt-1.5 text-[9.5px] text-red-300/70">{errors.title}</p>
                ) : (
                  <p className="mt-1.5 text-[9px] text-white/25">
                    {tr(" Короткое название увидят те, кому вы отправите ссылку. ")}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="field-label" htmlFor="route-description">
                {tr(" Описание ")}</label>
              <textarea
                id="route-description"
                value={draft.description}
                onChange={(event) => updateDraft({ description: event.target.value })}
                rows={3}
                maxLength={600}
                placeholder={tr("Почему этот маршрут хорош, для кого он и что взять с собой…")}
                className="field resize-none text-[12px] leading-relaxed"
              />
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3.5 sm:px-5">
              <div>
                <p className="eyebrow">{tr("точки маршрута")}</p>
                <p className="mt-1 text-[12px] text-white/60">
                  {pluralizeStops(draft.stops.length)}
                  {draft.stops.length ? tr(" · порядок можно менять") : tr(" · начните с любого места")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="btn btn-primary btn-sm gap-1.5"
              >
                <Plus size={13} /> {tr(" Добавить точку ")}</button>
            </div>

            {stops.length ? (
              <div className="p-3 sm:p-4">
                {stops.map(({ stop, place }, index) => (
                  <div
                    key={place.id}
                    className={cn(
                      "group relative rounded-2xl border p-2.5 transition-colors sm:p-3",
                      index === 0
                        ? "border-accent/20 bg-accent/[0.035]"
                        : "border-transparent hover:border-white/8 hover:bg-white/[0.02]",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex w-6 shrink-0 flex-col items-center gap-1 pt-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-mono text-[8px] text-accent">
                          {index + 1}
                        </span>
                        {index < stops.length - 1 ? (
                          <span className="h-full min-h-[40px] w-px border-l border-dashed border-white/10" />
                        ) : null}
                      </div>

                      <img
                        src={place.image}
                        alt=""
                        className="h-[74px] w-[74px] shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                        loading="lazy"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 pr-16 sm:pr-20">
                          <button
                            type="button"
                            onClick={() => navigate(`/guide?place=${place.id}`)}
                            className="max-w-full truncate text-left font-display text-[15px] text-primary hover:text-white"
                          >
                            {place.name}
                          </button>
                          <span className="rounded-full border border-white/8 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-white/30">
                            {categoryMap[place.category].shortLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[9px] text-white/25">
                          <MapPin size={9} /> {place.address}
                        </p>

                        <div className="mt-2 grid gap-2 sm:grid-cols-[96px_1fr]">
                          <div>
                            <label className="sr-only" htmlFor={`time-${place.id}`}>
                              {tr(" Время ")}</label>
                            <div className="relative">
                              <Clock3
                                size={11}
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"
                              />
                              <TimeField
                                id={`time-${place.id}`}
                                value={stop.time}
                                onChange={(time) => updateStop(place.id, { time })}
                                aria-label={tr("Время остановки")}
                                className="h-8 w-full py-0 pl-7 pr-1.5 text-[10px]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="sr-only" htmlFor={`note-${place.id}`}>
                              {tr(" Заметка ")}</label>
                            <input
                              id={`note-${place.id}`}
                              value={stop.note ?? ""}
                              onChange={(event) => updateStop(place.id, { note: event.target.value })}
                              placeholder={tr("Заметка: что здесь сделать")}
                              maxLength={100}
                              className="field h-8 py-0 text-[10px]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="absolute right-2 top-2.5 flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => reorderStops(index, index - 1)}
                          disabled={index === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-20"
                          aria-label={tr("Переместить выше")}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => reorderStops(index, index + 1)}
                          disabled={index === stops.length - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-20"
                          aria-label={tr("Переместить ниже")}
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeStop(place.id);
                            toast({ title: tr("Точка удалена"), description: place.name, variant: "info" });
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-300"
                          aria-label={tr("Удалить точку")}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10.5px] text-white/30 transition-colors hover:border-accent/35 hover:bg-accent/[0.03] hover:text-accent"
                >
                  <Plus size={13} /> {tr(" Добавить ещё одну точку ")}</button>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={MapPin}
                  title={tr("Пока пустой маршрут")}
                  description={tr("Добавьте минимум две точки. Это могут быть набережная, музей, кофейня — что угодно, что сложится в хороший вечер.")}
                  className="border-0 bg-transparent py-8"
                  action={
                    <button
                      type="button"
                      onClick={() => setAddOpen(true)}
                      className="btn btn-primary btn-sm gap-1.5"
                    >
                      <Plus size={12} /> {tr(" Добавить первую точку ")}</button>
                  }
                />
              </div>
            )}

            {errors.stops ? (
              <p className="border-t border-red-400/15 px-5 py-2 text-[9.5px] text-red-300/70">
                {errors.stops}
              </p>
            ) : null}
          </section>

          <div className="rounded-2xl border border-white/8 bg-white/[0.018] px-4 py-3">
            <div className="flex items-start gap-2.5">
              <Sparkles size={13} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[10px] leading-relaxed text-white/35">
                {tr(" Время и порядок здесь — ваш план, а не подтверждённое расписание. Карта покажет точки, а ссылкой можно поделиться после сохранения. ")}</p>
            </div>
          </div>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-[92px] space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/9 bg-surface">
              <div className="relative h-[320px]">
                {stops.length ? (
                  <MapView
                    markers={stops.map(({ place }) => ({
                      id: place.id,
                      name: place.name,
                      coords: place.coords,
                      category: place.category,
                    }))}
                    routeStops={stops.map(({ place }) => ({
                      id: place.id,
                      name: place.name,
                      coords: place.coords,
                      category: place.category,
                    }))}
                    route={points}
                    className="h-full"
                    showLocate={false}
                  />
                ) : (
                  <MapView
                    markers={[]}
                    center={[49.9481, 82.6286]}
                    zoom={13}
                    fitToMarkers={false}
                    className="h-full"
                    showLocate={false}
                  />
                )}
                {!stops.length ? (
                  <div className="pointer-events-none absolute inset-x-4 top-1/2 z-[500] -translate-y-1/2 rounded-2xl border border-white/10 bg-surface/90 p-4 text-center backdrop-blur-md">
                    <MapPin size={18} className="mx-auto text-accent/60" />
                    <p className="mt-2 text-[11px] text-white/60">{tr("Здесь появится ваш маршрут")}</p>
                    <p className="mt-1 text-[9px] text-white/30">
                      {tr(" Добавьте первую точку из гида ")}</p>
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/7 border-t border-white/8">
                <div className="px-3 py-2.5">
                  <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-white/25">
                    {tr(" точек ")}</p>
                  <p className="mt-1 text-[12px] text-white/70">{stops.length}</p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-white/25">
                    {tr(" время ")}</p>
                  <p className="mt-1 text-[12px] text-white/70">
                    {duration ? durationLabel(duration) : "—"}
                  </p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-white/25">
                    {tr(" дистанция ")}</p>
                  <p className="mt-1 text-[12px] text-white/70">
                    {distance ? `≈ ${distance} км` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.022] p-4">
              <div className="flex items-center justify-between">
                <p className="eyebrow">{tr("как это работает")}</p>
                <GripVertical size={13} className="text-white/20" />
              </div>
              <ol className="mt-3 space-y-2.5">
                {[
                  tr("Добавьте две или больше точек"),
                  tr("Расставьте порядок и время"),
                  tr("Сохраните и отправьте ссылку"),
                ].map((text, index) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border font-mono text-[7px]",
                        stops.length > index
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-white/10 text-white/25",
                      )}
                    >
                      {stops.length > index ? <Check size={8} /> : index + 1}
                    </span>
                    <span className="text-[10px] leading-relaxed text-white/35">{text}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex items-center gap-1.5 border-t border-white/7 pt-3">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-300/70" />
                <span className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-white/25">
                  {tr(" черновик сохранён в браузере ")}</span>
              </div>
            </div>

            <Link
              to="/plan"
              className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.018] px-4 py-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.035]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent">
                <Compass size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10.5px] text-white/60">{tr("Не хватает идеи?")}</span>
                <span className="mt-0.5 block text-[9px] text-white/25">
                  {tr(" Откройте гид или подбор вечера ")}</span>
              </span>
              <span className="text-[10px] text-accent">→</span>
            </Link>
          </div>
        </aside>
      </div>

      <AddPlaceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        selectedIds={draft.stops.map((stop) => stop.placeId)}
        onAdd={handleAdd}
      />

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title={tr("Очистить черновик?")}
        size="sm"
      >
        <div className="p-5">
          <p className="text-[12px] leading-relaxed text-white/50">
            {tr(" Все добавленные точки и подписи исчезнут. Это действие нельзя отменить. ")}</p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setClearOpen(false)}
              className="btn btn-secondary btn-sm flex-1"
            >
              {tr(" Оставить ")}</button>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-sm flex-1 bg-red-500/15 text-red-200 hover:bg-red-500/25"
            >
              {tr(" Очистить ")}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
