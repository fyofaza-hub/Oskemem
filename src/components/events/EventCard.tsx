import type { CityEvent } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { eventDateBadge, formatDate, formatEventRange, formatWeekday } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/Button";
import { CategoryLabel } from "@/components/ui/Category";

interface EventCardProps {
  event: CityEvent;
  onOpen: (event: CityEvent) => void;
  variant?: "default" | "row";
}

export function EventCard({ event, onOpen, variant = "default" }: EventCardProps) {
  const { savedEventIds, toggleSaveEvent, placeMap } = useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const saved = savedEventIds.includes(event.id);
  const place = placeMap[event.placeId];
  const date = eventDateBadge(event.dateISO);
  const placeName = place?.name ?? tr("Өскемен");

  const handleSave = () => {
    requireAuth(() => {
      toggleSaveEvent(event.id);
      toast({
        title: saved ? tr("Событие убрано") : tr("Событие сохранено"),
        description: event.title,
        variant: saved ? "info" : "success",
      });
    });
  };

  if (variant === "row") {
    return (
      <article className="group relative flex min-w-0 items-center gap-3.5 rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-line-strong">
        <button
          type="button"
          onClick={() => onOpen(event)}
          className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={tr("Открыть событие") + ": " + event.title}
        />
        <div className="pointer-events-none flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
          <span className="font-display text-xl font-semibold leading-none">{date.day}</span>
          <span className="mt-1 text-[12px] font-medium leading-none">{date.month}</span>
        </div>
        <div className="pointer-events-none min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-fg">{event.title}</p>
          <p className="mt-0.5 truncate text-meta text-muted">
            {date.weekday}, {formatEventRange(event.dateISO, event.endTime)} · {placeName}
          </p>
        </div>
        <IconButton
          icon="bookmark"
          label={saved ? tr("Убрать событие из сохранённых") : tr("Сохранить событие")}
          size="sm"
          active={saved}
          onClick={handleSave}
          className="relative z-10"
        />
      </article>
    );
  }

  return (
    <article className="card card-interactive group relative flex h-full flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => onOpen(event)}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={tr("Открыть событие") + ": " + event.title}
      />
      <div className="pointer-events-none relative aspect-[16/9] overflow-hidden bg-sunken">
        <img
          src={event.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 ease-smooth group-hover:scale-[1.03]"
          loading="lazy"
        />
        <span className="badge absolute left-3 top-3 bg-surface/95 text-fg shadow-card">
          <Icon name="calendarDays" size={14} />
          {formatDate(event.dateISO, { day: "numeric", month: "long" })}
        </span>
        <IconButton
          icon="bookmark"
          label={saved ? tr("Убрать событие из сохранённых") : tr("Сохранить событие")}
          variant="media"
          active={saved}
          onClick={handleSave}
          className="pointer-events-auto absolute right-3 top-3 z-10"
        />
      </div>

      <div className="pointer-events-none relative z-0 flex flex-1 flex-col gap-2 p-4">
        <p className="flex items-center gap-1.5 text-meta text-muted">
          <Icon name="clock" size={14} />
          {formatWeekday(event.dateISO)}, {formatEventRange(event.dateISO, event.endTime)}
        </p>
        <h3 className="font-display text-[17px] font-semibold leading-snug tracking-[-0.01em] text-fg">
          {event.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Icon name="location" size={14} className="shrink-0" />
          <span className="truncate">{placeName}</span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex min-w-0 items-center gap-1.5 text-meta text-muted">
            <Icon name="ticket" size={14} className="shrink-0" />
            <span className="truncate">{event.priceLabel}</span>
          </span>
          <CategoryLabel category={event.category} />
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/9] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-2/5" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
      </div>
    </div>
  );
}
