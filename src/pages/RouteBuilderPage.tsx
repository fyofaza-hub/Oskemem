import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CategoryId, Place } from "@/types";
import { categoryMap, countPlacesByCategory } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { cartesianRoute, cn, durationLabel, normalize, pluralizeStops, shareLink } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Bits";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { CategoryIcon } from "@/components/ui/Category";
import { Modal } from "@/components/ui/Modal";
import { TimeField } from "@/components/ui/TimeField";
import { MapView } from "@/components/map/MapView";
import { CategoryFilter } from "@/components/places/CategoryFilter";

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

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    return places.filter((place) => {
      if (category !== "all" && place.category !== category) return false;
      if (!normalized) return true;
      return normalize(
        [place.name, place.address, place.district, place.shortDescription, ...place.tags].join(" "),
      ).includes(normalized);
    });
  }, [places, query, category]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr("Добавить место")}
      description={tr("Выбирайте точки — черновик обновляется автоматически. Можно добавить несколько.")}
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            {tr("Выбрано")}: <span className="font-medium text-fg">{selectedIds.length}</span>
          </span>
          <Button variant="primary" icon="check" onClick={onClose}>
            {tr("Готово")}
          </Button>
        </div>
      }
    >
      <div className="p-4 sm:p-5">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tr("Название, район или настроение…")}
          leadingIcon="search"
          aria-label={tr("Поиск мест")}
          autoFocus
          trailing={
            query ? (
              <IconButton
                icon="close"
                label={tr("Очистить")}
                size="sm"
                onClick={() => setQuery("")}
              />
            ) : null
          }
        />
        <div className="mt-3">
          <CategoryFilter value={category} onChange={setCategory} counts={counts} />
        </div>

        <div className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto pr-1">
          {filtered.map((place) => {
            const selected = selectedIds.includes(place.id);
            return (
              <div
                key={place.id}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sunken"
              >
                <img
                  src={place.image}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{place.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-meta text-muted">
                    <CategoryIcon category={place.category} size={12} />
                    {place.district} · {place.address}
                  </p>
                </div>
                <Button
                  variant={selected ? "secondary" : "primary"}
                  size="sm"
                  icon={selected ? "check" : "plus"}
                  onClick={() => onAdd(place)}
                  disabled={selected}
                  aria-label={selected ? tr("Уже в маршруте") : `${tr("Добавить")}: ${place.name}`}
                >
                  {selected ? tr("В маршруте") : tr("Добавить")}
                </Button>
              </div>
            );
          })}
          {!filtered.length ? (
            <EmptyState
              icon="search"
              title={tr("Ничего не нашлось")}
              description={tr("Попробуйте другой запрос или категорию.")}
              className="mt-2 border-0 bg-transparent py-8"
            />
          ) : null}
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
          icon="routePlanner"
          title={tr("Войдите, чтобы собрать маршрут")}
          description={tr("Черновики хранятся в аккаунте этого браузера. Вход не требует почты — достаточно одного нажатия.")}
          action={
            <ButtonLink to="/auth?from=/routes/new" variant="primary" icon="user">
              {tr("Войти в аккаунт")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="page-wrap">
        <div className="space-y-4">
          <div className="skeleton h-10 w-56" />
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="skeleton h-[440px] rounded-2xl" />
            <div className="skeleton h-[440px] rounded-2xl" />
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
      <PageHeader
        title={tr("Конструктор маршрута")}
        description={tr("Соберите сценарий из мест гида: порядок, время и короткие заметки. Черновик сохраняется автоматически.")}
        actions={
          <>
            <IconButton
              icon="trash"
              label={tr("Очистить черновик")}
              variant="bordered"
              onClick={() => setClearOpen(true)}
              className="text-danger-ink hover:bg-danger-soft hover:text-danger-ink"
            />
            <Button variant="secondary" icon="share" onClick={() => handleSave(true)} loading={saving} className="px-3 sm:px-4">
              <span className="hidden sm:inline">{tr("Сохранить и поделиться")}</span>
              <span className="sm:hidden">{tr("Поделиться")}</span>
            </Button>
            <Button variant="primary" icon="save" onClick={() => handleSave(false)} loading={saving}>
              {saving ? tr("Сохраняем…") : tr("Сохранить")}
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
        <div className="min-w-0 space-y-5">
          <section className="card p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-sunken sm:h-28 sm:w-36">
                {stops[0] ? (
                  <>
                    <img src={stops[0].place.image} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-x-2 bottom-2 rounded-md bg-scrim/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                      {tr("обложка · первая точка")}
                    </span>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-faint">
                    <Icon name="image" size={20} />
                    <span className="text-[11px] leading-snug">{tr("появится с первой точкой")}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Field id="route-title" label={tr("Название маршрута")} error={errors.title}>
                  <Input
                    id="route-title"
                    value={draft.title}
                    onChange={(event) => {
                      updateDraft({ title: event.target.value });
                      setErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    maxLength={90}
                    placeholder={tr("Например: вечер на левом берегу")}
                    invalid={Boolean(errors.title)}
                  />
                </Field>
                <p className="mt-1.5 text-meta text-muted">
                  {tr("Короткое название увидят те, кому вы отправите ссылку.")}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Field id="route-description" label={tr("Описание")}>
                <Textarea
                  id="route-description"
                  value={draft.description}
                  onChange={(event) => updateDraft({ description: event.target.value })}
                  rows={3}
                  maxLength={600}
                  placeholder={tr("Почему этот маршрут хорош, для кого он и что взять с собой…")}
                />
              </Field>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-fg">{tr("Точки маршрута")}</h2>
                <p className="mt-0.5 text-meta text-muted">
                  {pluralizeStops(draft.stops.length)}
                  {draft.stops.length ? tr(" · порядок можно менять") : tr(" · начните с любого места")}
                </p>
              </div>
              <Button variant="primary" size="sm" icon="plus" onClick={() => setAddOpen(true)}>
                {tr("Добавить точку")}
              </Button>
            </div>

            {stops.length ? (
              <div className="p-3 sm:p-4">
                {stops.map(({ stop, place }, index) => (
                  <div
                    key={place.id}
                    className={cn(
                      "relative rounded-xl border p-2.5 transition-colors sm:p-3",
                      index === 0
                        ? "border-accent/30 bg-accent-soft/30"
                        : "border-transparent hover:border-line hover:bg-sunken/60",
                    )}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="flex w-6 shrink-0 flex-col items-center gap-1 pt-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[12px] font-semibold text-white">
                          {index + 1}
                        </span>
                        {index < stops.length - 1 ? (
                          <span className="h-full min-h-[40px] w-px border-l border-dashed border-line-strong" />
                        ) : null}
                      </div>

                      <img
                        src={place.image}
                        alt=""
                        className="h-[74px] w-[74px] shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
                        loading="lazy"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 pr-16 sm:pr-20">
                          <Link
                            to={`/guide?place=${place.id}`}
                            className="max-w-full truncate font-display text-[15px] font-semibold text-fg transition-colors hover:text-accent-ink"
                          >
                            {place.name}
                          </Link>
                          <span className="badge">{categoryMap[place.category].shortLabel}</span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-meta text-muted">
                          <Icon name="location" size={12} className="shrink-0" />
                          {place.address}
                        </p>

                        <div className="mt-2 grid gap-2 sm:grid-cols-[92px_1fr]">
                          <div>
                            <label className="sr-only" htmlFor={`time-${place.id}`}>
                              {tr("Время")}
                            </label>
                            <TimeField
                              id={`time-${place.id}`}
                              value={stop.time}
                              onChange={(time) => updateStop(place.id, { time })}
                              aria-label={tr("Время остановки")}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div>
                            <label className="sr-only" htmlFor={`note-${place.id}`}>
                              {tr("Заметка")}
                            </label>
                            <input
                              id={`note-${place.id}`}
                              value={stop.note ?? ""}
                              onChange={(event) => updateStop(place.id, { note: event.target.value })}
                              placeholder={tr("Заметка: что здесь сделать")}
                              maxLength={100}
                              className="field h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="absolute right-2 top-2.5 flex items-center">
                        <IconButton
                          icon="arrowUp"
                          label={tr("Переместить выше")}
                          size="sm"
                          disabled={index === 0}
                          onClick={() => reorderStops(index, index - 1)}
                        />
                        <IconButton
                          icon="arrowDown"
                          label={tr("Переместить ниже")}
                          size="sm"
                          disabled={index === stops.length - 1}
                          onClick={() => reorderStops(index, index + 1)}
                        />
                        <IconButton
                          icon="trash"
                          label={tr("Удалить точку")}
                          size="sm"
                          onClick={() => {
                            removeStop(place.id);
                            toast({ title: tr("Точка удалена"), description: place.name, variant: "info" });
                          }}
                          className="hover:bg-danger-soft hover:text-danger-ink"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="secondary"
                  icon="plus"
                  fullWidth
                  onClick={() => setAddOpen(true)}
                  className="mt-2 border-dashed text-muted"
                >
                  {tr("Добавить ещё одну точку")}
                </Button>
              </div>
            ) : (
              <div className="p-5">
                <EmptyState
                  icon="location"
                  title={tr("Пока пустой маршрут")}
                  description={tr("Добавьте минимум две точки. Это могут быть набережная, музей, кофейня — что угодно, что сложится в хороший вечер.")}
                  className="border-0 bg-transparent py-8"
                  action={
                    <Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>
                      {tr("Добавить первую точку")}
                    </Button>
                  }
                />
              </div>
            )}

            {errors.stops ? (
              <p role="alert" className="border-t border-danger/20 bg-danger-soft px-5 py-2.5 text-sm text-danger-ink">
                {errors.stops}
              </p>
            ) : null}
          </section>

          <div className="flex items-start gap-2.5 rounded-2xl bg-sunken px-4 py-3.5">
            <Icon name="info" size={16} className="mt-0.5 shrink-0 text-accent-ink" />
            <p className="text-sm leading-relaxed text-muted">
              {tr("Время и порядок здесь — ваш план, а не подтверждённое расписание. Карта покажет точки, а ссылкой можно поделиться после сохранения.")}
            </p>
          </div>
        </div>

        <aside className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-[88px]">
            <div className="card overflow-hidden">
              <div className="relative h-[320px]">
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
                  center={[49.9481, 82.6286]}
                  zoom={13}
                  fitToMarkers={stops.length > 1}
                  className="h-full"
                  showLocate={false}
                />
                {!stops.length ? (
                  <div className="pointer-events-none absolute inset-x-4 top-1/2 z-[65] -translate-y-1/2 rounded-2xl border border-line bg-surface/95 p-4 text-center shadow-card backdrop-blur-md">
                    <Icon name="location" size={18} className="mx-auto text-accent-ink" />
                    <p className="mt-2 text-sm font-medium text-fg">{tr("Здесь появится ваш маршрут")}</p>
                    <p className="mt-1 text-meta text-muted">{tr("Добавьте первую точку из гида")}</p>
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
                <div className="px-3 py-2.5">
                  <p className="text-meta text-muted">{tr("точек")}</p>
                  <p className="mt-0.5 text-sm font-medium text-fg">{stops.length}</p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-meta text-muted">{tr("время")}</p>
                  <p className="mt-0.5 text-sm font-medium text-fg">
                    {duration ? durationLabel(duration) : "—"}
                  </p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-meta text-muted">{tr("дистанция")}</p>
                  <p className="mt-0.5 text-sm font-medium text-fg">
                    {distance ? `≈ ${distance} ${tr("км")}` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-fg">{tr("Как это работает")}</h2>
              <ol className="mt-3 space-y-2.5">
                {[
                  tr("Добавьте две или больше точек"),
                  tr("Расставьте порядок и время"),
                  tr("Сохраните и отправьте ссылку"),
                ].map((text, index) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                        stops.length > index
                          ? "border-accent/30 bg-accent-soft text-accent-ink"
                          : "border-line text-faint",
                      )}
                    >
                      {stops.length > index ? <Icon name="check" size={11} /> : index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-muted">{text}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-meta text-faint">{tr("черновик сохранён в браузере")}</span>
              </div>
            </div>

            <Link
              to="/plan"
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-line-strong hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                <Icon name="plan" size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">{tr("Не хватает идеи?")}</span>
                <span className="mt-0.5 block text-meta text-muted">
                  {tr("Откройте гид или подбор вечера")}
                </span>
              </span>
              <Icon name="arrowRight" size={15} className="shrink-0 text-faint" />
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

      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title={tr("Очистить черновик?")} size="sm">
        <div className="p-5">
          <p className="text-sm leading-relaxed text-muted">
            {tr("Все добавленные точки и подписи исчезнут. Это действие нельзя отменить.")}
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setClearOpen(false)}>
              {tr("Оставить")}
            </Button>
            <Button variant="danger" fullWidth icon="trash" onClick={handleClear}>
              {tr("Очистить")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
