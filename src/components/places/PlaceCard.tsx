import { useNavigate } from "react-router-dom";
import type { Place } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn, priceLabel } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { tr } from "@/i18n/runtime";
import { onboardingGate } from "@/components/onboarding/Onboarding";
import { categoryMap } from "@/data/categories";
import { CategoryIcon } from "@/components/ui/Category";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Heart } from "lucide-react";

interface PlaceCardProps {
  place: Place;
  onOpen?: (place: Place) => void;
  variant?: "default" | "compact" | "editorial";
  index?: number;
}

/**
 * Карточка места. Весь блок открывает подробности, а кнопки действий стоят
 * над ним (z-index), поэтому их можно нажимать независимо.
 */
export function PlaceCard({ place, onOpen, variant = "default", index }: PlaceCardProps) {
  const { favorites, toggleFavorite, draft, addPlaceToDraft } = useApp();
  const { toast } = useToast();
  
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const favorite = favorites.includes(place.id);
  const inDraft = Boolean(draft?.stops.some((stop) => stop.placeId === place.id));
  const editorial = variant === "editorial";

  const handleFavorite = () => {
    requireAuth(() => {
      if (!onboardingGate.gate()) return;
      toggleFavorite(place.id);
      track("place_favorite", { place_id: place.id, saved: !favorite });
      toast({
        title: favorite ? tr("Убрано из избранного") : tr("Сохранено в избранное"),
        description: place.name,
        variant: favorite ? "info" : "success",
      });
    });
  };

  const handleAddRoute = () => {
    requireAuth(() => {
      if (!onboardingGate.gate()) return;
      const result = addPlaceToDraft(place.id);
      if (result === "exists") {
        toast({ title: tr("Место уже в маршруте"), description: tr("Откройте конструктор, чтобы изменить порядок."), variant: "info" });
        return;
      }
      track("place_in_route", { place_id: place.id });
      toast({
        title: tr("Добавлено в маршрут"),
        description: place.name,
        action: { label: tr("Открыть конструктор"), onClick: () => navigate("/routes/new") },
      });
    }, tr("Войдите, чтобы добавлять места в маршрут"));
  };

  if (variant === "compact") {
    return (
      <div className="group relative flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition-colors hover:border-line-strong">
        <button
          type="button"
          onClick={() => onOpen?.(place)}
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={tr("Открыть место") + ": " + place.name}
        />
        <img src={place.image} alt="" className="pointer-events-none h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
        <div className="pointer-events-none min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">{place.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-meta text-muted">
            <CategoryIcon category={place.category} size={13} />
            {categoryMap[place.category].shortLabel} · {place.district}
          </p>
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={favorite ? tr("Убрать из избранного") : tr("В избранное")}
          className={cn("relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors", favorite ? "text-danger hover:text-danger" : "text-muted hover:text-fg")}
        >
          {favorite ? <Heart size={16} fill="currentColor" strokeWidth={0} /> : <Icon name="heart" size={16} />}
        </button>
      </div>
    );
  }

  return (
    <article className="card card-interactive group relative flex h-full flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => onOpen?.(place)}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={tr("Открыть место") + ": " + place.name}
      />
      <div className={cn("pointer-events-none relative overflow-hidden bg-sunken", editorial ? "aspect-[5/4]" : "aspect-[4/3]")}>
        <img
          src={place.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 ease-smooth group-hover:scale-[1.03]"
          loading="lazy"
        />
        {editorial ? (
          <span
            aria-hidden="true"
            className="absolute left-3 top-3 z-10 flex h-7 min-w-7 items-center justify-center rounded-full border border-white/15 bg-black/45 px-2 font-mono text-[9px] uppercase tracking-[0.1em] text-white/70 backdrop-blur-md"
          >
            {String((index ?? 0) + 1).padStart(2, "0")}
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={favorite ? tr("Убрать из избранного") : tr("В избранное")}
          className={cn(
            "pointer-events-auto absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-card backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-900",
            favorite && "text-danger hover:text-danger",
          )}
        >
          {favorite ? <Heart size={16} fill="currentColor" strokeWidth={0} /> : <Icon name="heart" size={16} />}
        </button>
      </div>

      <div className="pointer-events-none relative z-0 flex flex-1 flex-col gap-2 p-4">
        <p className="flex items-center gap-1.5 text-meta text-muted">
          <CategoryIcon category={place.category} size={14} />
          <span className="truncate">
            {categoryMap[place.category].shortLabel} · {place.district}
          </span>
        </p>
        <h3 className="font-display text-[17px] font-semibold leading-snug tracking-[-0.01em] text-fg">{place.name}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{place.shortDescription}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-meta font-medium text-muted">{priceLabel(place.priceLevel)}</span>
          <Button
            size="sm"
            variant="secondary"
            icon={inDraft ? "check" : "plus"}
            onClick={handleAddRoute}
            className={cn(
              "pointer-events-auto relative z-10",
              inDraft && "border-accent/30 bg-accent-soft text-accent-ink hover:border-accent/50 hover:bg-accent-soft",
            )}
          >
            {inDraft ? tr("В маршруте") : tr("В маршрут")}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function PlaceCardSkeleton({
  compact = false,
  editorial = false,
}: {
  compact?: boolean;
  editorial?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
        <div className="skeleton h-14 w-14 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <div className={cn("skeleton rounded-none", editorial ? "aspect-[5/4]" : "aspect-[4/3]")} />
        {editorial ? <div className="skeleton absolute left-3 top-3 h-7 w-7 rounded-full" /> : null}
      </div>
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
      </div>
    </div>
  );
}
