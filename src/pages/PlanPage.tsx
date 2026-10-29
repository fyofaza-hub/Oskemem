import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CategoryId, Companion, Place } from "@/types";
import { budgetOptions, categories, categoryMap, companionOptions } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { cartesianRoute, cn, durationLabel, pluralizeStops, shareLink } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { CategoryIcon } from "@/components/ui/Category";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Bits";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { TimeField } from "@/components/ui/TimeField";
import { MapView } from "@/components/map/MapView";

const steps: Array<{ label: string; icon: IconName }> = [
  { label: tr("Компания"), icon: "users" },
  { label: tr("Бюджет"), icon: "wallet" },
  { label: tr("Интересы"), icon: "heart" },
  { label: tr("Маршрут"), icon: "routes" },
];

const companionIcons: Record<Companion, IconName> = {
  solo: "user",
  couple: "couple",
  friends: "friends",
  family: "family",
};

const companionHints: Record<Companion, string> = {
  solo: tr("свой темп и никаких компромиссов"),
  couple: tr("вечер на двоих, без спешки"),
  friends: tr("шумно, вкусно и вместе"),
  family: tr("спокойный сценарий для всех"),
};

const budgetIcons: Record<(typeof budgetOptions)[number]["id"], IconName> = {
  free: "wallet",
  moderate: "coins",
  any: "layers",
};

type BudgetId = (typeof budgetOptions)[number]["id"];

export function PlanPage() {
  const {
    currentUser,
    draft,
    favorites,
    toggleFavorite,
    startDraft,
    updateDraft,
    removeStop,
    reorderStops,
    saveDraftAsRoute,
    routes,
    places,
    placeMap,
  } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [budget, setBudget] = useState<BudgetId | null>(null);
  const [interests, setInterests] = useState<CategoryId[]>(
    currentUser?.interests?.length ? [currentUser.interests[0]] : ["food"],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [placeSearch, setPlaceSearch] = useState("");
  const [selectionError, setSelectionError] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [inspirationLoading, setInspirationLoading] = useState(false);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);
  const initialFavoritesRef = useRef<string[]>(favorites);

  useEffect(() => {
    if (step !== 2) return;
    setInspirationLoading(true);
    const timeout = window.setTimeout(() => setInspirationLoading(false), 420);
    return () => window.clearTimeout(timeout);
  }, [step, interests, budget]);

  const recommendations = useMemo(() => {
    if (!companion || !interests.length) return [];
    const budgetOk = (place: Place) =>
      budget === "free"
        ? place.priceLevel === 0
        : budget === "moderate"
          ? place.priceLevel <= 2
          : true;
    const matching = places.filter(
      (place) =>
        place.companions.includes(companion) &&
        interests.includes(place.category) &&
        budgetOk(place),
    );
    const byCategory = new Map<CategoryId, Place[]>(interests.map((id) => [id, []]));
    matching.forEach((place) => byCategory.get(place.category)?.push(place));

    const balanced: Place[] = [];
    for (let index = 0; ; index += 1) {
      let added = false;
      for (const categoryId of interests) {
        const place = byCategory.get(categoryId)?.[index];
        if (!place) continue;
        balanced.push(place);
        added = true;
      }
      if (!added) break;
    }
    return balanced;
  }, [companion, budget, interests, places]);

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => {
        const place = placeMap[id];
        if (!place) return false;
        if (!interests.includes(place.category)) return false;
        if (budget === "free" && place.priceLevel !== 0) return false;
        if (budget === "moderate" && place.priceLevel > 2) return false;
        return true;
      }),
    );
  }, [budget, interests, placeMap]);

  const filteredRecommendations = useMemo(() => {
    const query = placeSearch.trim().toLowerCase();
    if (!query) return recommendations;
    return recommendations.filter((place) =>
      [place.name, place.district, place.address].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [recommendations, placeSearch]);

  const selectedPlaces = selectedIds.map((id) => placeMap[id]).filter(Boolean);
  const draftStops = draft
    ? draft.stops
        .map((stop) => ({ stop, place: placeMap[stop.placeId] }))
        .filter((item) => Boolean(item.place))
    : [];
  const draftPoints = draftStops.map(({ place }) => place.coords);
  const savedRoute = savedRouteId ? routes.find((route) => route.id === savedRouteId) : null;

  const companionLabel =
    companionOptions.find((option) => option.id === companion)?.label ?? tr("не выбрано");
  const budgetLabel = budgetOptions.find((option) => option.id === budget)?.label ?? tr("не выбран");
  const interestsLabel = interests.length
    ? interests.map((id) => categoryMap[id].shortLabel).join(" · ")
    : tr("любое настроение");

  const toggleInterest = (categoryId: CategoryId) => {
    if (interests.includes(categoryId)) {
      if (interests.length === 1) {
        toast({
          title: tr("Оставьте хотя бы один раздел"),
          description: tr("Сначала добавьте другой, затем уберите этот."),
          variant: "info",
        });
        return;
      }
      setInterests(interests.filter((id) => id !== categoryId));
      return;
    }
    setInterests([...interests, categoryId]);
  };

  const allInterestsSelected = interests.length === categories.length;
  const toggleAllInterests = () => {
    setInterests(allInterestsSelected ? [categories[0].id] : categories.map((category) => category.id));
  };

  const togglePlace = (place: Place) => {
    const exists = selectedIds.includes(place.id);
    if (exists) {
      setSelectedIds((prev) => prev.filter((id) => id !== place.id));
      if (!initialFavoritesRef.current.includes(place.id) && favorites.includes(place.id)) {
        toggleFavorite(place.id);
      }
      return;
    }
    setSelectedIds((prev) => [...prev, place.id]);
    setSelectionError(false);
    if (!favorites.includes(place.id)) toggleFavorite(place.id);
  };

  const canGoNext = () => {
    if (step === 0) return Boolean(companion);
    if (step === 1) return Boolean(budget);
    if (step === 2) return interests.length > 0 && selectedIds.length >= 2;
    return true;
  };

  const buildRoute = () => {
    startDraft(selectedIds, {
      title: tr("Вечер, собранный по настроению"),
      description: `${companionLabel} · ${budgetLabel}. ${interestsLabel}.`,
    });
    setStep(3);
    setReplaceOpen(false);
    toast({
      title: tr("Маршрут собран"),
      description: `${pluralizeStops(selectedIds.length)} · ${tr("проверьте порядок и время.")}`,
      variant: "success",
    });
  };

  const goNext = () => {
    if (!canGoNext()) {
      if (step === 0) {
        toast({ title: tr("Выберите, с кем идёте"), variant: "info" });
      } else if (step === 1) {
        toast({ title: tr("Выберите бюджет"), variant: "info" });
      } else if (step === 2) {
        if (!interests.length) {
          toast({ title: tr("Выберите хотя бы одно настроение"), variant: "info" });
        } else {
          setSelectionError(true);
          toast({
            title: tr("Нужно минимум два места"),
            description: tr("Выберите две или больше точек — из них получится маршрут."),
            variant: "info",
          });
        }
      }
      return;
    }
    if (step === 2) {
      if (draft && draft.stops.length > 0) {
        setReplaceOpen(true);
        return;
      }
      buildRoute();
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const goBack = () => {
    if (step === 0) return;
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSaveRoute = () => {
    if (!currentUser) {
      toast({
        title: tr("Войдите, чтобы сохранить маршрут"),
        description: tr("Вход занимает пару секунд."),
        variant: "info",
        action: { label: tr("Войти"), onClick: () => navigate("/auth") },
      });
      return;
    }
    if (!draft || draft.stops.length < 2) {
      toast({
        title: tr("В маршруте меньше двух точек"),
        description: tr("Вернитесь к выбору мест и добавьте ещё одно."),
        variant: "error",
      });
      return;
    }
    if (!draft.title.trim()) {
      toast({ title: tr("Добавьте название маршрута"), variant: "error" });
      return;
    }
    const route = saveDraftAsRoute();
    if (!route) {
      toast({
        title: tr("Не удалось сохранить маршрут"),
        description: tr("Проверьте название и количество точек."),
        variant: "error",
      });
      return;
    }
    setSavedRouteId(route.id);
    toast({
      title: tr("Маршрут сохранён"),
      description: tr("Теперь им можно поделиться или открыть на карте."),
    });
  };

  const handleShareRoute = async () => {
    if (!savedRoute) return;
    const result = await shareLink({
      title: savedRoute.title,
      text: `${savedRoute.title} · ${pluralizeStops(savedRoute.stops.length)}`,
      url: `${window.location.origin}/routes/${savedRoute.id}`,
    });
    if (result === "copied") {
      toast({ title: tr("Ссылка на маршрут скопирована") });
    } else if (result === "failed") {
      toast({ title: tr("Не удалось скопировать ссылку"), variant: "error" });
    }
  };

  const resetPlan = () => {
    setStep(0);
    setCompanion(null);
    setBudget(null);
    setSelectedIds([]);
    setSelectionError(false);
    setSavedRouteId(null);
    setInterests(currentUser?.interests?.length ? [currentUser.interests[0]] : ["food"]);
    toast({ title: tr("Новый подбор"), description: tr("Начнём сначала."), variant: "info" });
  };

  return (
    <div className="page-wrap">
      <PageHeader
        title={tr("Куда сходить?")}
        description={tr("Несколько вопросов о компании, бюджете и настроении — и готовый план вечера.")}
        actions={
          step > 0 ? (
            <Button variant="ghost" size="sm" icon="refresh" onClick={resetPlan}>
              {tr("Начать заново")}
            </Button>
          ) : (
            <ButtonLink to="/guide" variant="secondary" size="sm" icon="guide">
              {tr("Смотреть гид")}
            </ButtonLink>
          )
        }
      />

      <ol className="mt-7 grid grid-cols-4 gap-2" aria-label={tr("Этапы подбора")}>
        {steps.map((item, index) => {
          const active = step === index;
          const passed = step > index;
          return (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  if (index < step) setStep(index);
                }}
                disabled={index > step}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors sm:flex-row sm:justify-center sm:gap-2.5 sm:px-3",
                  active && "bg-surface shadow-card",
                  passed && "text-accent-ink",
                  !active && !passed && "text-faint",
                  index < step && "hover:bg-sunken",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-medium",
                    active
                      ? "border-accent bg-accent text-white"
                      : passed
                        ? "border-accent/30 bg-accent-soft text-accent-ink"
                        : "border-line bg-surface text-faint",
                  )}
                >
                  {passed ? <Icon name="check" size={14} /> : <Icon name={item.icon} size={15} />}
                </span>
                <span className="text-[12px] font-medium sm:text-[13px]">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <section className="card p-5 sm:p-7">
            {step === 0 ? (
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-[28px]">
                  {tr("С кем хотите провести этот день?")}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {tr("От компании зависит темп и формат. Выберите один вариант — потом всё можно изменить.")}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {companionOptions.map((option) => {
                    const active = companion === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setCompanion(option.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                          active
                            ? "border-accent bg-accent-soft"
                            : "border-line bg-surface hover:border-line-strong hover:bg-sunken",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            active ? "bg-surface text-accent-ink" : "bg-sunken text-muted",
                          )}
                        >
                          <Icon name={companionIcons[option.id]} size={21} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-fg">{option.label}</span>
                          <span className="mt-0.5 block text-sm text-muted">
                            {companionHints[option.id]}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            active ? "border-accent bg-accent text-white" : "border-line-strong",
                          )}
                        >
                          {active ? <Icon name="check" size={12} /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-[28px]">
                  {tr("Сколько готовы потратить?")}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {tr("Без точных цен: в гиде только ориентир по уровню бюджета. Актуальные цены уточняйте у места.")}
                </p>

                <div className="mt-6 grid gap-3">
                  {budgetOptions.map((option) => {
                    const active = budget === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setBudget(option.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                          active
                            ? "border-accent bg-accent-soft"
                            : "border-line bg-surface hover:border-line-strong hover:bg-sunken",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            active ? "bg-surface text-accent-ink" : "bg-sunken text-muted",
                          )}
                        >
                          <Icon name={budgetIcons[option.id]} size={21} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-fg">{option.label}</span>
                          <span className="mt-0.5 block text-sm text-muted">{option.hint}</span>
                        </span>
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            active ? "border-accent bg-accent text-white" : "border-line-strong",
                          )}
                        >
                          {active ? <Icon name="check" size={12} /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-[28px]">
                      {tr("Что хочется почувствовать?")}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                      {tr("Выберите настроения и отметьте места, которые откликаются. Они станут основой маршрута.")}
                    </p>
                  </div>
                  <span className={cn("badge", selectedIds.length >= 2 && "badge-accent")}>
                    {tr("Выбрано")} {selectedIds.length} · {tr("минимум 2")}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleAllInterests}
                    aria-pressed={allInterestsSelected}
                    className={cn("chip", allInterestsSelected && "chip-active")}
                  >
                    <Icon name="layers" size={15} />
                    {tr("Все")}
                    {allInterestsSelected ? <Icon name="check" size={13} /> : null}
                  </button>
                  {categories.map((category) => {
                    const active = interests.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleInterest(category.id)}
                        aria-pressed={active}
                        className={cn("chip", active && "chip-active")}
                      >
                        <CategoryIcon category={category.id} size={15} />
                        {category.shortLabel}
                        {active ? <Icon name="check" size={13} /> : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-7 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-fg">
                    {tr("Подходящие места")}
                  </h3>
                  <span className="text-sm text-muted">
                    {companionLabel} · {budgetLabel}
                  </span>
                </div>

                <div className="mt-4">
                  <Input
                    leadingIcon="search"
                    placeholder={tr("Найти место, район, кофе, музей…")}
                    value={placeSearch}
                    onChange={(event) => setPlaceSearch(event.target.value)}
                  />
                </div>

                {inspirationLoading ? (
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                        <div className="skeleton h-16 w-16 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-3.5 w-3/4" />
                          <div className="skeleton h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredRecommendations.length ? (
                  <div className="mt-3 max-h-[420px] overflow-y-auto pr-1">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {filteredRecommendations.map((place) => {
                      const selected = selectedIds.includes(place.id);
                      return (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => togglePlace(place)}
                          aria-pressed={selected}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                            selected
                              ? "border-accent bg-accent-soft"
                              : "border-line bg-surface hover:border-line-strong hover:bg-sunken",
                          )}
                        >
                          <img
                            src={place.image}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-fg">{place.name}</span>
                              {selected ? (
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                                  <Icon name="check" size={10} />
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-1 block truncate text-meta text-muted">
                              {categoryMap[place.category].shortLabel} · {place.district}
                            </span>
                            <span className="mt-0.5 block text-meta text-faint">
                              {place.priceLevel === 0 ? tr("Бесплатно") : tr("по бюджету")}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                ) : recommendations.length ? (
                  <div className="mt-4">
                    <EmptyState
                      icon="search"
                      title={tr("Ничего не найдено")}
                      description={tr("Попробуйте другой запрос или сбросьте фильтр.")}
                    />
                  </div>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      icon="search"
                      title={tr("Под эти условия ничего не нашлось")}
                      description={tr("Добавьте ещё категорию или измените бюджет — подбор обновится.")}
                      action={
                        <Button variant="secondary" size="sm" onClick={() => setStep(1)}>
                          {tr("Изменить бюджет")}
                        </Button>
                      }
                    />
                  </div>
                )}

                {selectionError && selectedIds.length < 2 ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger-ink"
                  >
                    {tr("Нужно выбрать минимум два места — сейчас отмечено")} {selectedIds.length}.
                  </p>
                ) : (
                  <p className="mt-4 text-meta text-muted">
                    {tr("Подбор строится по реальным местам гида. Время и расстояние будут ориентировочными.")}
                  </p>
                )}
              </div>
            ) : null}

            {step === 3 ? (
              savedRoute ? (
                <div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                    <Icon name="check" size={24} />
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-[30px]">
                    {tr("Вечер собран")}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    {tr("Маршрут сохранён в профиле. Можно отправить ссылку друзьям или открыть его на карте.")}
                  </p>

                  <div className="mt-6 rounded-2xl border border-line bg-sunken/60 p-4 sm:p-5">
                    <p className="text-meta text-muted">{tr("Ваш маршрут")}</p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-fg">{savedRoute.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="routes" size={15} /> {pluralizeStops(savedRoute.stops.length)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="clock" size={15} /> {durationLabel(savedRoute.durationMin)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="distance" size={15} /> ≈ {savedRoute.distanceKm} {tr("км")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {savedRoute.stops.slice(0, 4).map((stop) => {
                      const place = placeMap[stop.placeId];
                      if (!place) return null;
                      return (
                        <div key={stop.placeId} className="overflow-hidden rounded-xl bg-sunken">
                          <img src={place.image} alt="" className="aspect-[4/3] w-full object-cover" />
                          <p className="truncate px-2 py-1.5 text-meta text-muted">{place.name}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <ButtonLink to={`/routes/${savedRoute.id}`} variant="primary" iconRight="arrowRight">
                      {tr("Открыть маршрут")}
                    </ButtonLink>
                    <Button variant="secondary" icon="share" onClick={handleShareRoute}>
                      {tr("Поделиться")}
                    </Button>
                    <Button variant="ghost" icon="refresh" onClick={resetPlan}>
                      {tr("Новый подбор")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-[28px]">
                    {tr("Ваш вечер, по порядку")}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    {tr("Порядок и время можно изменить. Название увидит тот, кому вы отправите ссылку.")}
                  </p>

                  <div className="mt-5">
                    <label className="field-label" htmlFor="plan-route-title">
                      {tr("Название")}
                    </label>
                    <input
                      id="plan-route-title"
                      value={draft?.title ?? ""}
                      onChange={(event) => updateDraft({ title: event.target.value })}
                      maxLength={90}
                      className="field max-w-xl"
                    />
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="min-w-0">
                      {draftStops.length ? (
                        <div>
                          {draftStops.map(({ stop, place }, index) => (
                            <div key={place.id} className="relative flex gap-3">
                              <div className="flex w-7 shrink-0 flex-col items-center">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-meta font-semibold text-accent-ink">
                                  {index + 1}
                                </span>
                                {index < draftStops.length - 1 ? (
                                  <span className="w-px flex-1 border-l border-dashed border-line-strong" />
                                ) : null}
                              </div>
                              <div className="mb-2 flex min-w-0 flex-1 flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5 sm:flex-nowrap">
                                <img
                                  src={place.image}
                                  alt=""
                                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                  loading="lazy"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-fg">{place.name}</p>
                                  <p className="mt-0.5 truncate text-meta text-muted">{place.district}</p>
                                </div>
                                <TimeField
                                  value={stop.time}
                                  onChange={(time) =>
                                    updateDraft({
                                      stops: draft!.stops.map((item) =>
                                        item.placeId === place.id ? { ...item, time } : item,
                                      ),
                                    })
                                  }
                                  aria-label={tr("Время остановки")}
                                  className="h-8 w-[72px] px-2 py-0 text-sm"
                                />
                                <div className="flex items-center">
                                  <IconButton
                                    icon="arrowUp"
                                    label={tr("Выше")}
                                    size="sm"
                                    disabled={index === 0}
                                    onClick={() => reorderStops(index, index - 1)}
                                  />
                                  <IconButton
                                    icon="arrowDown"
                                    label={tr("Ниже")}
                                    size="sm"
                                    disabled={index === draftStops.length - 1}
                                    onClick={() => reorderStops(index, index + 1)}
                                  />
                                  <IconButton
                                    icon="close"
                                    label={tr("Убрать из маршрута")}
                                    size="sm"
                                    onClick={() => removeStop(place.id)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon="location"
                          title={tr("В маршруте пока нет точек")}
                          description={tr("Вернитесь назад и выберите места для вечера.")}
                          action={
                            <Button variant="secondary" size="sm" onClick={() => setStep(2)}>
                              {tr("Выбрать места")}
                            </Button>
                          }
                        />
                      )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-line">
                      <MapView
                        markers={draftStops.map(({ place }) => ({
                          id: place.id,
                          name: place.name,
                          coords: place.coords,
                          category: place.category,
                        }))}
                        routeStops={draftStops.map(({ place }) => ({
                          id: place.id,
                          name: place.name,
                          coords: place.coords,
                          category: place.category,
                        }))}
                        route={draftPoints}
                        className="h-[240px]"
                        showLocate={false}
                      />
                      <div className="flex items-center justify-between border-t border-line px-3 py-2 text-meta text-muted">
                        <span>{pluralizeStops(draftStops.length)}</span>
                        <span>≈ {cartesianRoute(draftPoints)} {tr("км")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button variant="primary" icon="save" onClick={handleSaveRoute}>
                      {tr("Сохранить маршрут")}
                    </Button>
                    <ButtonLink to="/routes/new" variant="secondary" icon="routePlanner">
                      {tr("Открыть конструктор")}
                    </ButtonLink>
                    <span className="text-meta text-muted">
                      {currentUser ? tr("Ссылка появится после сохранения") : tr("Для сохранения нужен аккаунт")}
                    </span>
                  </div>
                </div>
              )
            ) : null}

            {step < 3 ? (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <Button
                  variant="ghost"
                  icon="arrowLeft"
                  onClick={goBack}
                  disabled={step === 0}
                >
                  {tr("Назад")}
                </Button>
                <div className="flex items-center gap-3">
                  <span className="hidden text-meta text-muted sm:block">
                    {tr("Шаг")} {step + 1} {tr("из")} {steps.length}
                  </span>
                  <Button
                    variant={canGoNext() ? "primary" : "secondary"}
                    iconRight="arrowRight"
                    onClick={goNext}
                  >
                    {step === 2 ? tr("Собрать маршрут") : tr("Дальше")}
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </main>

        <aside className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-[88px]">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-fg">{tr("Ваш сценарий")}</h2>
                <span className="badge">{step + 1} / {steps.length}</span>
              </div>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-meta text-muted">{tr("Компания")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-fg">{companionLabel}</dd>
                </div>
                <div>
                  <dt className="text-meta text-muted">{tr("Бюджет")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-fg">{budgetLabel}</dd>
                </div>
                <div>
                  <dt className="text-meta text-muted">{tr("Интересы")}</dt>
                  <dd className="mt-0.5 text-sm font-medium leading-relaxed text-fg">{interestsLabel}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <dt className="text-sm text-muted">{tr("Выбрано мест")}</dt>
                  <dd className="font-display text-xl font-semibold text-fg">{selectedIds.length}</dd>
                </div>
              </dl>
              {selectedPlaces.length ? (
                <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {selectedPlaces.slice(0, 4).map((place) => (
                    <li key={place.id} className="flex items-center gap-2.5">
                      <img src={place.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm text-fg">{place.name}</span>
                      <Icon name="check" size={14} className="text-accent-ink" />
                    </li>
                  ))}
                  {selectedPlaces.length > 4 ? (
                    <li className="text-meta text-muted">+{selectedPlaces.length - 4}</li>
                  ) : null}
                </ul>
              ) : null}
            </div>

            <div className="rounded-2xl bg-sunken p-5">
              <Icon name="info" size={18} className="text-accent-ink" />
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {tr("Все места отмечены в OpenStreetMap. Время и дистанция ориентировочные — проверяйте информацию перед выходом.")}
              </p>
              <ButtonLink to="/guide" variant="ghost" size="sm" iconRight="arrowRight" className="mt-3 -ml-2">
                {tr("Открыть гид")}
              </ButtonLink>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        title={tr("Заменить черновик?")}
        size="sm"
      >
        <div className="p-5">
          <p className="text-sm leading-relaxed text-muted">
            {tr("У вас уже есть черновик с точками. Новый подбор заменит его — текущие остановки и подписи не сохранятся.")}
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setReplaceOpen(false)}>
              {tr("Оставить черновик")}
            </Button>
            <Button variant="primary" className="flex-1" onClick={buildRoute}>
              {tr("Заменить")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
