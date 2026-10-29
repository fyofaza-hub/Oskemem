import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { CategoryId, CityEvent, Place, Post } from "@/types";
import { categoryMap, categories } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import {
  compressImage,
  formatJoinedDate,
  pluralizePlaces,
  validateImageFile,
} from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { CategoryIcon } from "@/components/ui/Category";
import { Modal } from "@/components/ui/Modal";
import { PostCard } from "@/components/feed/PostCard";
import { PostDetailModal } from "@/components/feed/PostDetailModal";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceDetail } from "@/components/places/PlaceDetail";
import { RouteCard } from "@/components/routes/RouteCard";
import { EventCard } from "@/components/events/EventCard";
import { EventDetailModal } from "@/components/events/EventDetailModal";

type ProfileTab = "posts" | "routes" | "favorites" | "saved" | "settings";

const tabs: Array<{ id: ProfileTab; label: string; icon: IconName }> = [
  { id: "posts", label: tr("Публикации"), icon: "feed" },
  { id: "routes", label: tr("Маршруты"), icon: "routes" },
  { id: "favorites", label: tr("Избранное"), icon: "heart" },
  { id: "saved", label: tr("Сохранённое"), icon: "bookmark" },
  { id: "settings", label: tr("Настройки"), icon: "settings" },
];

const avatarColors = [
  "linear-gradient(135deg, #4D8DFF 0%, #1C4CA8 100%)",
  "linear-gradient(135deg, #6BB7A0 0%, #1E5147 100%)",
  "linear-gradient(135deg, #B49CFF 0%, #4E3A8E 100%)",
  "linear-gradient(135deg, #E8B06B 0%, #7A4A1E 100%)",
  "linear-gradient(135deg, #5ED0E8 0%, #1B6374 100%)",
  "linear-gradient(135deg, #F28C9C 0%, #8F3249 100%)",
];

export function ProfilePage() {
  const {
    currentUser,
    profileUser,
    users,
    posts,
    routes,
    events,
    favorites,
    savedPostIds,
    savedRouteIds,
    savedEventIds,
    updateProfile,
    resetDemo,
    logout,
    places,
  } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CityEvent | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const tabParam = searchParams.get("tab") as ProfileTab | null;
  const activeTab: ProfileTab = tabs.some((tab) => tab.id === tabParam) ? tabParam! : "posts";

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [avatarColor, setAvatarColor] = useState(avatarColors[0]);
  const [interests, setInterests] = useState<CategoryId[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profileUser) return;
    setName(profileUser.name);
    setUsername(profileUser.username);
    setBio(profileUser.bio);
    setCity(profileUser.city);
    setAvatar(profileUser.avatar);
    setAvatarColor(profileUser.avatarColor);
    setInterests(profileUser.interests);
  }, [profileUser]);

  const myPosts = useMemo(
    () => (currentUser ? posts.filter((post) => post.userId === currentUser.id) : []),
    [posts, currentUser],
  );
  const myRoutes = useMemo(
    () => (currentUser ? routes.filter((route) => route.authorId === currentUser.id) : []),
    [routes, currentUser],
  );
  const savedPosts = posts.filter((post) => savedPostIds.includes(post.id));
  const savedRoutes = routes.filter((route) => savedRouteIds.includes(route.id));
  const savedEvents = events.filter((event) => savedEventIds.includes(event.id));
  const favoritePlaces = places.filter((place) => favorites.includes(place.id));
  const savedTotal = savedPosts.length + savedRoutes.length + savedEvents.length;

  const setTab = (tab: ProfileTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "posts") next.delete("tab");
        else next.set("tab", tab);
        return next;
      },
      { replace: false },
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!currentUser) {
    return (
      <div className="page-wrap">
        <div className="mx-auto max-w-xl">
          <div className="card p-7 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <Icon name="user" size={24} />
            </span>
            <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-3xl">
              {tr("Войдите, чтобы собрать свой город")}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
              {tr("Избранные места, сохранённые маршруты, комментарии и публикации привязаны к аккаунту в этом браузере. Вход занимает одно нажатие.")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <ButtonLink to="/auth?from=/profile" variant="primary" icon="user">
                {tr("Войти в аккаунт")}
              </ButtonLink>
              <ButtonLink to="/guide" variant="secondary" icon="guide">
                {tr("Сначала посмотреть гид")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    setSaving(true);
    const result = updateProfile({ name, username, bio, city, avatar, avatarColor, interests });
    setSaving(false);
    if (!result.ok) {
      toast({ title: tr("Не удалось сохранить профиль"), description: result.error, variant: "error" });
      return;
    }
    toast({
      title: tr("Профиль обновлён"),
      description: tr("Изменения сохранены в этом браузере."),
    });
  };

  const handleAvatar = async (file: File | undefined) => {
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast({ title: error, variant: "error" });
      return;
    }
    try {
      const compressed = await compressImage(file, 480, 0.82);
      setAvatar(compressed);
      toast({ title: tr("Фото готово"), description: tr("Не забудьте сохранить профиль.") });
    } catch {
      toast({ title: tr("Не удалось обработать изображение"), variant: "error" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const tabCount = (id: ProfileTab) =>
    id === "posts"
      ? myPosts.length
      : id === "routes"
        ? myRoutes.length
        : id === "favorites"
          ? favorites.length
          : id === "saved"
            ? savedTotal
            : undefined;

  return (
    <div className="page-wrap">
      <section className="card overflow-hidden">
        <div className="relative h-28 overflow-hidden bg-sunken sm:h-36">
          <img src="/images/panorama.webp" alt="" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/25 to-transparent" />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span className="badge bg-surface/95 text-fg shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {tr("профиль сообщества")}
            </span>
            <Button variant="secondary" size="sm" icon="edit" onClick={() => setTab("settings")}>
              {tr("Редактировать")}
            </Button>
          </div>
        </div>

        <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
          <div className="-mt-11 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar
                  user={{ ...currentUser, avatar, avatarColor }}
                  size="2xl"
                  className="border-4 border-surface shadow-card"
                />
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-surface bg-accent" />
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate font-display text-[24px] font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[30px]">
                  {currentUser.name}
                </h1>
                <p className="mt-1 text-sm text-muted">@{currentUser.username}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pb-1">
              <ButtonLink to="/routes/new" variant="primary" size="sm" icon="plus">
                {tr("Новый маршрут")}
              </ButtonLink>
              <Button variant="secondary" size="sm" icon="settings" onClick={() => setTab("settings")}>
                {tr("Настройки")}
              </Button>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{currentUser.bio}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-meta text-muted">
            <span className="flex items-center gap-1.5">
              <Icon name="location" size={14} /> {currentUser.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="calendarDays" size={14} />
              {formatJoinedDate(currentUser.joinedAt)}
            </span>
            {currentUser.interests.length ? (
              <span className="flex items-center gap-1.5">
                <Icon name="heart" size={14} />
                {currentUser.interests.map((id) => categoryMap[id].shortLabel).join(" · ")}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {[
              { value: myPosts.length, label: tr("публикаций") },
              { value: myRoutes.length, label: tr("маршрутов") },
              { value: favorites.length, label: tr("в избранном") },
              { value: savedTotal, label: tr("сохранено") },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface px-4 py-3">
                <p className="font-display text-xl font-semibold text-fg">{stat.value}</p>
                <p className="mt-0.5 text-meta text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="card mt-5 overflow-hidden">
        <div className="no-scrollbar flex overflow-x-auto border-b border-line" role="tablist" aria-label={tr("Разделы профиля")}>
          {tabs.map((tab) => {
            const count = tabCount(tab.id);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tab.id)}
                className={`relative flex h-12 shrink-0 items-center gap-2 px-4 text-sm font-medium transition-colors sm:px-5 ${
                  active ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                <Icon name={tab.icon} size={16} />
                {tab.label}
                {count !== undefined ? (
                  <span className={active ? "text-meta text-accent-ink" : "text-meta text-faint"}>{count}</span>
                ) : null}
                {active ? (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "posts" ? (
            myPosts.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {myPosts.map((post) => (
                  <PostCard key={post.id} post={post} onOpen={setSelectedPost} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="edit"
                title={tr("Здесь будут ваши публикации")}
                description={tr("Расскажите об одном месте так, как умеете только вы. Публикация появится в ленте, здесь и в избранном читателей.")}
                action={
                  <ButtonLink to="/feed?create=1" variant="primary" icon="plus">
                    {tr("Создать публикацию")}
                  </ButtonLink>
                }
              />
            )
          ) : null}

          {activeTab === "routes" ? (
            myRoutes.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {myRoutes.map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="routes"
                title={tr("Маршруты пока не собраны")}
                description={tr("Добавьте два места, расставьте порядок и время. Мы сохраним маршрут, покажем его на карте и дадим ссылку.")}
                action={
                  <ButtonLink to="/routes/new" variant="primary" icon="plus">
                    {tr("Собрать маршрут")}
                  </ButtonLink>
                }
              />
            )
          ) : null}

          {activeTab === "favorites" ? (
            favoritePlaces.length ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted">
                    {pluralizePlaces(favoritePlaces.length)} · {tr("сохраняются локально")}
                  </p>
                  <ButtonLink to="/map" variant="ghost" size="sm" icon="map">
                    {tr("Показать на карте")}
                  </ButtonLink>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {favoritePlaces.map((place) => (
                    <PlaceCard key={place.id} place={place} onOpen={setSelectedPlace} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon="heart"
                title={tr("Избранное пока пустое")}
                description={tr("Нажимайте на сердечко у мест в гиде, чтобы вернуться к ним позже. Избранное видно только вам.")}
                action={
                  <ButtonLink to="/guide" variant="primary" icon="guide">
                    {tr("Открыть гид")}
                  </ButtonLink>
                }
              />
            )
          ) : null}

          {activeTab === "saved" ? (
            savedTotal ? (
              <div className="space-y-8">
                {savedPosts.length ? (
                  <section>
                    <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                      <p className="flex items-center gap-2 text-sm font-medium text-fg">
                        <Icon name="bookmark" size={15} className="text-accent-ink" />
                        {tr("Публикации")}
                        <span className="text-faint">{savedPosts.length}</span>
                      </p>
                      <ButtonLink to="/feed" variant="ghost" size="sm" iconRight="arrowRight">
                        {tr("В ленту")}
                      </ButtonLink>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {savedPosts.map((post) => (
                        <PostCard key={post.id} post={post} onOpen={setSelectedPost} variant="compact" />
                      ))}
                    </div>
                  </section>
                ) : null}

                {savedRoutes.length ? (
                  <section>
                    <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                      <p className="flex items-center gap-2 text-sm font-medium text-fg">
                        <Icon name="bookmark" size={15} className="text-accent-ink" />
                        {tr("Маршруты")}
                        <span className="text-faint">{savedRoutes.length}</span>
                      </p>
                      <ButtonLink to="/routes" variant="ghost" size="sm" iconRight="arrowRight">
                        {tr("Все маршруты")}
                      </ButtonLink>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {savedRoutes.map((route) => (
                        <RouteCard key={route.id} route={route} variant="compact" />
                      ))}
                    </div>
                  </section>
                ) : null}

                {savedEvents.length ? (
                  <section>
                    <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                      <p className="flex items-center gap-2 text-sm font-medium text-fg">
                        <Icon name="bookmark" size={15} className="text-accent-ink" />
                        {tr("События")}
                        <span className="text-faint">{savedEvents.length}</span>
                      </p>
                      <ButtonLink to="/events" variant="ghost" size="sm" iconRight="arrowRight">
                        {tr("Вся афиша")}
                      </ButtonLink>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {savedEvents.map((event) => (
                        <EventCard key={event.id} event={event} onOpen={setSelectedEvent} variant="row" />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon="bookmark"
                title={tr("Сохранённое пока пустое")}
                description={tr("Сохраняйте публикации, маршруты и события закладкой — всё соберётся здесь, в одном месте.")}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <ButtonLink to="/feed" variant="secondary">
                      {tr("Смотреть ленту")}
                    </ButtonLink>
                    <ButtonLink to="/events" variant="primary">
                      {tr("Открыть афишу")}
                    </ButtonLink>
                  </div>
                }
              />
            )
          ) : null}

          {activeTab === "settings" ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                <div>
                  <h2 className="section-title">{tr("Ваш профиль")}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {tr("Имя, город и интересы видны в публикациях и маршрутах.")}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative w-fit">
                    <Avatar
                      user={{ ...currentUser, avatar, avatarColor }}
                      size="xl"
                      className="border-2 border-line"
                    />
                    <IconButton
                      icon="camera"
                      label={tr("Загрузить фото профиля")}
                      size="sm"
                      variant="bordered"
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 rounded-full shadow-card"
                    />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleAvatar(event.target.files?.[0])}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="field-label">{tr("Цвет аватара")}</p>
                    <div className="flex flex-wrap gap-2">
                      {avatarColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setAvatarColor(color)}
                          className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                            avatarColor === color ? "border-fg" : "border-transparent"
                          }`}
                          style={{ background: color }}
                          aria-label={tr("Выбрать цвет аватара")}
                          aria-pressed={avatarColor === color}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-meta text-muted">
                      {tr("Фото сжимается локально. Можно обойтись цветным аватаром.")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field id="profile-name" label={tr("Имя")}>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={50}
                      autoComplete="name"
                    />
                  </Field>
                  <Field id="profile-username" label="Username">
                    <Input
                      id="profile-username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      maxLength={24}
                      leadingIcon="user"
                      autoComplete="username"
                    />
                  </Field>
                  <Field id="profile-city" label={tr("Город")} className="sm:col-span-2">
                    <Input
                      id="profile-city"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      maxLength={40}
                      leadingIcon="location"
                    />
                  </Field>
                  <Field id="profile-bio" label={tr("О себе")} className="sm:col-span-2">
                    <Textarea
                      id="profile-bio"
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      rows={4}
                      maxLength={220}
                      placeholder={tr("Что вы любите в городе и какие места ищете?")}
                    />
                    <p className="mt-1 text-right text-[11px] tabular-nums text-faint">{bio.length}/220</p>
                  </Field>
                </div>

                <div className="mt-5">
                  <p className="field-label">{tr("Интересы")}</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const active = interests.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            setInterests((prev) =>
                              active ? prev.filter((id) => id !== category.id) : [...prev, category.id],
                            )
                          }
                          aria-pressed={active}
                          className={`chip ${active ? "chip-active" : ""}`}
                        >
                          <CategoryIcon category={category.id} size={14} />
                          {category.shortLabel}
                          {active ? <Icon name="check" size={12} /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button variant="primary" icon="check" onClick={handleSave} loading={saving}>
                    {saving ? tr("Сохраняем…") : tr("Сохранить изменения")}
                  </Button>
                  <Button variant="secondary" onClick={() => setTab("posts")}>
                    {tr("Отмена")}
                  </Button>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-meta text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {tr("Данные профиля хранятся в этом браузере и не отправляются на сервер.")}
                </p>
              </div>

              <aside className="space-y-3">
                <div className="card p-5">
                  <h2 className="text-sm font-semibold text-fg">{tr("Аккаунт")}</h2>
                  <dl className="mt-3 space-y-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <dt className="text-muted">{tr("Почта")}</dt>
                      <dd className="truncate font-medium text-fg">{currentUser.email ?? tr("не указана")}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <dt className="text-muted">{tr("Публикаций")}</dt>
                      <dd className="font-medium text-fg">{myPosts.length}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <dt className="text-muted">{tr("Маршрутов")}</dt>
                      <dd className="font-medium text-fg">{myRoutes.length}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
                      <dt className="text-muted">{tr("В сообществе")}</dt>
                      <dd className="font-medium text-fg">
                        {users.length} {tr("профилей")}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="card flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:border-line-strong hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-muted">
                    <Icon name="refresh" size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{tr("Сбросить данные")}</span>
                    <span className="mt-0.5 block text-meta text-muted">{tr("вернуть исходные данные")}</span>
                  </span>
                  <Icon name="chevronRight" size={15} className="shrink-0 text-faint" />
                </button>

                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  className="card flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:border-danger/30 hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger-ink">
                    <Icon name="logout" size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{tr("Выйти из профиля")}</span>
                    <span className="mt-0.5 block text-meta text-muted">{tr("вернуться на экран входа")}</span>
                  </span>
                  <Icon name="chevronRight" size={15} className="shrink-0 text-faint" />
                </button>
              </aside>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-meta text-faint">
        <span className="flex items-center gap-2">
          <Icon name="users" size={14} /> {tr("Профили и публикации — часть городского сообщества")}
        </span>
        <span>{tr("Данные не отправляются на сервер")}</span>
      </div>

      <PlaceDetail place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={tr("Сбросить данные?")} size="sm">
        <div className="p-5">
          <p className="text-sm leading-relaxed text-muted">
            {tr("Вернутся исходные публикации, маршруты, избранное и профиль Алины. Ваши созданные записи и загруженные фото будут удалены.")}
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setResetOpen(false)}>
              {tr("Отмена")}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                resetDemo();
                setResetOpen(false);
                setTab("posts");
                toast({ title: tr("Данные сброшены"), description: tr("Снова открыт профиль Алины.") });
              }}
            >
              {tr("Сбросить")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)} title={tr("Выйти из профиля?")} size="sm">
        <div className="p-5">
          <p className="text-sm leading-relaxed text-muted">
            {tr("Избранное и черновики останутся в браузере и вернутся после следующего входа.")}
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setLogoutOpen(false)}>
              {tr("Остаться")}
            </Button>
            <Button
              variant="danger"
              fullWidth
              icon="logout"
              onClick={() => {
                logout();
                setLogoutOpen(false);
                navigate("/auth");
                toast({ title: tr("Вы вышли из профиля"), variant: "info" });
              }}
            >
              {tr("Выйти")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
