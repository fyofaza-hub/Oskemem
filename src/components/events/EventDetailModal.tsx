import { useNavigate } from "react-router-dom";
import type { CityEvent } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { downloadEventIcs } from "@/lib/calendar";
import { eventDateBadge, formatDate, formatEventRange, shareLink } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Modal } from "@/components/ui/Modal";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CategoryLabel } from "@/components/ui/Category";
import { MapView } from "@/components/map/MapView";

interface EventDetailModalProps {
  event: CityEvent | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const { savedEventIds, toggleSaveEvent, placeMap } = useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  if (!event) return null;

  const place = placeMap[event.placeId];
  const saved = savedEventIds.includes(event.id);
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

  const handleShare = async () => {
    const result = await shareLink({
      title: event.title,
      text: `${event.title} · ${formatDate(event.dateISO)} · ${placeName}`,
      url: `${window.location.origin}/events?event=${event.id}`,
    });
    if (result === "copied") toast({ title: tr("Ссылка на событие скопирована") });
    if (result === "failed") toast({ title: tr("Не удалось скопировать ссылку"), variant: "error" });
  };

  const addToCalendar = () => {
    downloadEventIcs(event, placeName);
    toast({
      title: tr("Файл календаря скачан"),
      description: tr("Событие отмечено как предварительное — проверьте программу у организатора."),
    });
  };

  return (
    <Modal
      open={!!event}
      onClose={onClose}
      size="lg"
      footer={
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <Button variant="primary" icon="bookmark" onClick={handleSave} aria-pressed={saved}>
            {saved ? tr("Сохранено") : tr("Сохранить событие")}
          </Button>
          <Button variant="secondary" icon="calendarAdd" onClick={addToCalendar} aria-label={tr("Добавить в календарь")}>
            <span className="sr-only sm:not-sr-only">{tr("В календарь")}</span>
          </Button>
          <Button variant="secondary" icon="share" onClick={handleShare} aria-label={tr("Поделиться событием")}>
            <span className="sr-only sm:not-sr-only">{tr("Поделиться")}</span>
          </Button>
        </div>
      }
    >
      <div className="relative aspect-[16/9] max-h-[300px] w-full overflow-hidden bg-sunken">
        <img src={event.image} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
              <span className="font-display text-2xl font-semibold leading-none">{date.day}</span>
              <span className="mt-1 text-[12px] font-medium leading-none">{date.month}</span>
            </div>
            <div className="min-w-0 flex-1">
              <CategoryLabel category={event.category} />
              <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[28px]">
                {event.title}
              </h2>
            </div>
          </div>

          <p className="text-[15px] leading-[1.7] text-fg/90">{event.description}</p>

          <dl className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <Icon name="calendarDays" size={18} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <dt className="text-meta text-muted">{tr("Дата")}</dt>
                <dd className="mt-0.5 text-sm font-medium text-fg">
                  {formatDate(event.dateISO, { day: "numeric", month: "long", weekday: "long" })}
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Icon name="clock" size={18} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <dt className="text-meta text-muted">{tr("Время")}</dt>
                <dd className="mt-0.5 text-sm font-medium text-fg">{formatEventRange(event.dateISO, event.endTime)}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Icon name="ticket" size={18} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <dt className="text-meta text-muted">{tr("Условия")}</dt>
                <dd className="mt-0.5 text-sm font-medium text-fg">{event.priceLabel}</dd>
              </div>
            </div>
          </dl>

          <p className="flex items-start gap-2 text-meta leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            {tr("Название, программа, время и условия могут меняться. Перед посещением проверяйте информацию у организатора.")}
          </p>
        </div>

        <aside className="space-y-3">
          {place ? (
            <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
              <img src={place.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{place.name}</p>
                <p className="truncate text-meta text-muted">{place.address}</p>
              </div>
            </div>
          ) : null}
          <div className="h-52 overflow-hidden rounded-2xl border border-line">
            {place ? (
              <MapView
                markers={[{ id: place.id, name: place.name, coords: place.coords, category: place.category }]}
                activeId={place.id}
                zoom={15}
                className="h-full"
                showLocate={false}
                interactive={false}
              />
            ) : null}
          </div>
          {place ? (
            <ButtonLink
              to={`/map?place=${place.id}`}
              variant="secondary"
              size="sm"
              icon="map"
              fullWidth
              onClick={onClose}
            >
              {tr("Открыть место на карте")}
            </ButtonLink>
          ) : null}
          <p className="text-meta leading-relaxed text-muted">
            {tr("Место и адрес — по данным OpenStreetMap. Фото может быть иллюстративным.")}
          </p>
          {place ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/guide?place=${place.id}`);
              }}
              className="text-sm font-medium text-accent-ink hover:underline"
            >
              {tr("Подробнее о месте")}
            </button>
          ) : null}
        </aside>
      </div>
    </Modal>
  );
}
