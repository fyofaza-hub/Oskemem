import { Link, useNavigate } from "react-router-dom";
import type { Place } from "@/types";
import { categoryMap, companionOptions } from "@/data/categories";
import { photoCredits } from "@/data/credits";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { priceLabel, shareLink, timeAgo } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Modal } from "@/components/ui/Modal";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CategoryIcon } from "@/components/ui/Category";
import { Avatar } from "@/components/ui/Avatar";
import { MapView } from "@/components/map/MapView";
import { PlaceCard } from "@/components/places/PlaceCard";

interface PlaceDetailProps {
  place: Place | null;
  onClose: () => void;
  onSelectPlace?: (place: Place) => void;
}

export function PlaceDetail({ place, onClose, onSelectPlace }: PlaceDetailProps) {
  const { favorites, toggleFavorite, draft, addPlaceToDraft, posts, places, currentUser, deletePlace, getUser } =
    useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  if (!place) return null;

  const favorite = favorites.includes(place.id);
  const inDraft = Boolean(draft?.stops.some((stop) => stop.placeId === place.id));
  const related = places
    .filter((item) => item.id !== place.id && item.category === place.category)
    .slice(0, 3);
  const placePosts = posts.filter((post) => post.placeId === place.id);
  const credit = photoCredits.find((item) => item.image === place.image);
  const companions = companionOptions.filter((option) => place.companions.includes(option.id));
  const isCommunityPlace = place.source === "community";
  const canDelete = isCommunityPlace && currentUser?.id === place.createdBy;

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
    if (inDraft) {
      onClose();
      navigate("/routes/new");
      return;
    }
    requireAuth(() => {
      const result = addPlaceToDraft(place.id);
      if (result === "exists") {
        toast({ title: tr("Место уже в маршруте"), variant: "info" });
        return;
      }
      toast({
        title: tr("Добавлено в маршрут"),
        description: place.name,
        action: { label: tr("Открыть конструктор"), onClick: () => navigate("/routes/new") },
      });
    }, tr("Войдите, чтобы добавлять места в маршрут"));
  };

  const handleShare = async () => {
    const result = await shareLink({
      title: place.name,
      text: `${place.name} — ${place.shortDescription}`,
      url: `${window.location.origin}/guide?place=${place.id}`,
    });
    if (result === "copied") {
      toast({ title: tr("Ссылка скопирована"), description: tr("Ею можно поделиться в мессенджере.") });
    } else if (result === "failed") {
      toast({ title: tr("Не удалось скопировать ссылку"), variant: "error" });
    }
  };

  const handleDelete = () => {
    const result = deletePlace(place.id);
    if (!result.ok) {
      toast({ title: tr("Не удалось удалить"), description: result.error, variant: "error" });
      return;
    }
    toast({ title: tr("Место удалено"), description: place.name, variant: "info" });
    onClose();
  };

  return (
    <Modal open={!!place} onClose={onClose} size="xl">
      <div className="relative aspect-[16/9] max-h-[300px] w-full overflow-hidden bg-sunken sm:max-h-[360px]">
        <img src={place.image} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-meta text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CategoryIcon category={place.category} size={14} />
              {categoryMap[place.category].label}
            </span>
            <span aria-hidden="true">·</span>
            <span>{place.district}</span>
            {isCommunityPlace ? <span className="badge badge-accent">{tr("Добавлено сообществом")}</span> : null}
          </div>

          <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[30px]">
            {place.name}
          </h2>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted">
            <Icon name="location" size={16} className="mt-0.5 shrink-0" />
            {place.address}
          </p>

          <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.7] text-fg/90">{place.description}</p>

          {place.tags.length ? (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {place.tags.map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {canDelete ? (
            <Button variant="soft-danger" size="sm" icon="trash" className="mt-6" onClick={handleDelete}>
              {tr("Удалить моё место")}
            </Button>
          ) : null}
        </div>

        <aside className="space-y-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl border border-line p-4">
            <div>
              <dt className="text-meta text-muted">{tr("Бюджет")}</dt>
              <dd className="mt-0.5 text-sm font-medium text-fg">{priceLabel(place.priceLevel)}</dd>
            </div>
            <div>
              <dt className="text-meta text-muted">{tr("Район")}</dt>
              <dd className="mt-0.5 text-sm font-medium text-fg">{place.district}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-meta text-muted">{tr("С кем хорошо")}</dt>
              <dd className="mt-0.5 text-sm font-medium text-fg">{companions.map((item) => item.label).join(" · ")}</dd>
            </div>
          </dl>

          <div className="grid gap-2">
            <Button variant="primary" size="lg" icon={inDraft ? "check" : "routes"} fullWidth onClick={handleAddRoute}>
              {inDraft ? tr("В маршруте") : tr("Добавить в маршрут")}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" icon="heart" onClick={handleFavorite} className={favorite ? "border-accent/30 bg-accent-soft text-accent-ink" : undefined}>
                {favorite ? tr("В избранном") : tr("В избранное")}
              </Button>
              <Button variant="secondary" icon="share" onClick={handleShare}>
                {tr("Поделиться")}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-48 overflow-hidden rounded-2xl border border-line">
              <MapView
                markers={[{ id: place.id, name: place.name, coords: place.coords, category: place.category }]}
                activeId={place.id}
                zoom={15}
                className="h-full"
                showLocate={false}
                interactive={false}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-meta text-muted">{tr("Адрес и координаты: OpenStreetMap")}</p>
              <ButtonLink to={`/map?place=${place.id}`} variant="ghost" size="sm" iconRight="arrowRight" onClick={onClose}>
                {tr("На карте")}
              </ButtonLink>
            </div>
          </div>

          {credit ? (
            <p className="text-meta leading-relaxed text-muted">
              {tr("Фото")}: {credit.author} · {credit.source} · {credit.license}
              {place.illustrativePhoto ? ` · ${tr("Иллюстративное фото")}` : ""}
            </p>
          ) : null}
        </aside>
      </div>

      <div className="grid gap-8 border-t border-line bg-sunken/50 p-5 sm:p-7 md:grid-cols-2">
        <section className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-fg">{tr("В ленте города")}</h3>
          {placePosts.length ? (
            <ul className="mt-3 space-y-2">
              {placePosts.slice(0, 2).map((post) => {
                const author = getUser(post.userId);
                return (
                  <li key={post.id}>
                    <Link
                      to={`/feed?post=${post.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition-colors hover:border-line-strong"
                    >
                      <Avatar user={author} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{post.title}</span>
                        <span className="block truncate text-meta text-muted">
                          {author?.name ?? tr("Гость")} · {timeAgo(post.createdAt)}
                        </span>
                      </span>
                      <Icon name="chevronRight" size={15} className="shrink-0 text-faint" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {tr("Пока никто не написал об этом месте. Ваше открытие может стать первым.")}
            </p>
          )}
          <ButtonLink to="/feed?create=1" variant="secondary" size="sm" icon="plus" className="mt-3" onClick={onClose}>
            {tr("Поделиться местом")}
          </ButtonLink>
        </section>

        <section className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-fg">{tr("Похожие места")}</h3>
          <div className="mt-3 space-y-2">
            {related.map((item) => (
              <PlaceCard key={item.id} place={item} variant="compact" onOpen={(value) => onSelectPlace?.(value)} />
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
