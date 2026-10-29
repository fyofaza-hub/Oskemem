import { useNavigate } from "react-router-dom";
import type { Place } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn, priceLabel } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { categoryMap } from "@/data/categories";
import { CategoryIcon } from "@/components/ui/Category";
import { Button, IconButton } from "@/components/ui/Button";

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
      toggleFavorite(place.id);
      toast({
        title: favorite ? tr("Убрано из избранного") : tr("Сохранено в избранное"),
        description: place.name,
        variant: favorite ? "info" : "success",
      });
    });
  };

  const handleAddRoute = () => {
    requireAuth(() => {
      const result = addPlaceToDraft(place.id);
      if (result === "exists") {
        toast({ title: tr("Место уже в маршруте"), description: tr("Откройте конструктор, чтобы изменить порядок."), variant: "info" });
        return;
      }
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
        <IconButton
          icon="heart"
          label={favorite ? tr("Убрать из избранного") : tr("В избранное")}
          size="sm"
          active={favorite}
          onClick={handleFavorite}
          className="relative z-10"
        />
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
        <IconButton
          icon="heart"
          label={favorite ? tr("Убрать из избранного") : tr("В избранное")}
          variant="media"
          active={favorite}
          onClick={handleFavorite}
          className="pointer-events-auto absolute right-3 top-3 z-10"
        />
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
