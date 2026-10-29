import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Camera,
  Check,
  Compass,
  Heart,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  RefreshCcw,
  Route as RouteIcon,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
import type { CategoryId, CityEvent, Place, Post } from "@/types";
import { categoryMap, categories } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import {
  compressImage,
  fileToDataUrl,
  formatDate,
  normalize,
  pluralizePlaces,
  validateImageFile,
} from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Bits";
import { Modal } from "@/components/ui/Modal";
import { PostCard } from "@/components/feed/PostCard";
import { PostDetailModal } from "@/components/feed/PostDetailModal";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceDetail } from "@/components/places/PlaceDetail";
import { RouteCard } from "@/components/routes/RouteCard";
import { EventCard } from "@/components/events/EventCard";
import { EventDetailModal } from "@/components/events/EventDetailModal";
import { CategoryIcon } from "@/components/ui/Category";
import { tr } from "@/i18n/runtime";

type ProfileTab = "posts" | "routes" | "favorites" | "saved" | "settings";

const tabs: Array<{ id: ProfileTab; label: string; icon: typeof UserRound }> = [
  { id: "posts", label: tr("Публикации"), icon: UserRound },
  { id: "routes", label: tr("Маршруты"), icon: RouteIcon },
  { id: "favorites", label: tr("Избранное"), icon: Heart },
  { id: "saved", label: tr("Сохранённое"), icon: Bookmark },
  { id: "settings", label: tr("Настройки"), icon: Settings2 },
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
        <div className="mx-auto max-w-xl rounded-[28px] border border-white/9 bg-surface p-7 text-center sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent">
            <UserRound size={24} strokeWidth={1.5} />
          </span>
          <p className="eyebrow mt-5">{tr("профиль")}</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-[-0.04em] text-primary">
            {tr(" Войдите, чтобы собрать свой город ")}</h1>
          <p className="mx-auto mt-3 max-w-sm text-[12px] leading-relaxed text-white/40">
            {tr(" Избранные места, сохранённые маршруты, комментарии и публикации привязаны к аккаунту в этом браузере. Вход занимает одно нажатие. ")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/auth?from=/profile" className="btn btn-primary btn-md">
              {tr(" Войти в аккаунт ")}</Link>
            <Link to="/guide" className="btn btn-secondary btn-md">
              {tr(" Сначала посмотреть гид ")}</Link>
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

  const copyCountLabel = (count: number, one: string, few: string, many: string) => {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  };

  return (
    <div className="page-wrap">
      <section className="overflow-hidden rounded-[28px] border border-white/9 bg-surface">
        <div className="on-media relative h-[180px] overflow-hidden sm:h-[220px]">
          <img src="/images/panorama.webp" alt="" className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e13] via-[#0b0e13]/40 to-black/20" />
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <span className="hidden h-8 items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 font-mono text-[8px] uppercase tracking-[0.1em] text-white/55 backdrop-blur-md sm:flex">
              <span className="h-1 w-1 rounded-full bg-emerald-300/70" />
              {tr(" профиль сообщества ")}</span>
            <button
              type="button"
              onClick={() => setTab("settings")}
              className="flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 text-[10px] text-white/65 backdrop-blur-md transition-colors hover:bg-black/55 hover:text-white"
            >
              <Pencil size={11} /> {tr(" Редактировать ")}</button>
          </div>
          <div className="absolute bottom-4 right-5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
            {tr(" Өскемен · Казахстан ")}</div>
        </div>

        <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar
                  user={{ ...currentUser, avatar, avatarColor }}
                  size="2xl"
                  className="border-4 border-card shadow-[0_18px_50px_rgba(0,0,0,0.4)]"
                />
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-300" />
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[26px] font-light leading-none tracking-[-0.04em] text-primary sm:text-[32px]">
                    {currentUser.name}
                  </h1>
                </div>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                  @{currentUser.username}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pb-1">
              <Link to="/routes/new" className="btn btn-primary btn-sm gap-1.5">
                <Plus size={13} /> {tr(" Новый маршрут ")}</Link>
              <button
                type="button"
                onClick={() => setTab("settings")}
                className="btn btn-secondary btn-sm gap-1.5"
              >
                <Settings2 size={13} /> {tr(" Настройки ")}</button>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-[12px] leading-relaxed text-white/50">{currentUser.bio}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-white/30">
            <span className="flex items-center gap-1.5">
              <MapPin size={10} /> {currentUser.city}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={10} /> {tr(" с")}{" "}
              {formatDate(currentUser.joinedAt, { month: "long", year: "numeric" })}
            </span>
            {currentUser.interests.length ? (
              <span className="flex items-center gap-1.5">
                <Compass size={10} />{" "}
                {currentUser.interests.map((id) => categoryMap[id].shortLabel).join(" · ")}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 sm:grid-cols-4">
            {[
              { value: myPosts.length, label: tr("публикаций") },
              { value: myRoutes.length, label: tr("маршрутов") },
              { value: favorites.length, label: tr("в избранном") },
              { value: savedTotal, label: tr("сохранено") },
            ].map((stat) => (
              <div key={stat.label} className="bg-elevated px-4 py-3.5">
                <p className="font-display text-[22px] font-light text-primary">{stat.value}</p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/25">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/8 bg-surface">
        <div className="no-scrollbar flex overflow-x-auto border-b border-white/8">
          {tabs.map((tab) => {
            const count =
              tab.id === "posts"
                ? myPosts.length
                : tab.id === "routes"
                  ? myRoutes.length
                  : tab.id === "favorites"
                    ? favorites.length
                    : tab.id === "saved"
                      ? savedTotal
                      : undefined;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`relative flex h-12 shrink-0 items-center gap-2 px-4 text-[11.5px] transition-colors sm:px-5 ${
                  activeTab === tab.id ? "text-primary" : "text-white/35 hover:text-white/70"
                }`}
              >
                <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                {tab.label}
                {count !== undefined ? (
                  <span
                    className={`font-mono text-[8px] ${
                      activeTab === tab.id ? "text-accent" : "text-white/20"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
                {activeTab === tab.id ? (
                  <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-accent shadow-[0_0_10px_rgba(77,141,255,0.7)]" />
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
                icon={Pencil}
                title={tr("Здесь будут ваши публикации")}
                description={tr("Расскажите об одном месте так, как умеете только вы. Публикация появится в ленте, здесь и в избранном читателей.")}
                action={
                  <Link to="/feed?create=1" className="btn btn-primary btn-sm gap-1.5">
                    <Plus size={12} /> {tr(" Создать публикацию ")}</Link>
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
                icon={RouteIcon}
                title={tr("Маршруты пока не собраны")}
                description={tr("Добавьте два места, расставьте порядок и время. Мы сохраним маршрут, покажем его на карте и дадим ссылку.")}
                action={
                  <Link to="/routes/new" className="btn btn-primary btn-sm gap-1.5">
                    <Plus size={12} /> {tr(" Собрать маршрут ")}</Link>
                }
              />
            )
          ) : null}

          {activeTab === "favorites" ? (
            favoritePlaces.length ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-white/35">
                    {pluralizePlaces(favoritePlaces.length)} {tr(" · сохраняются локально ")}</p>
                  <Link
                    to="/map"
                    className="flex items-center gap-1.5 text-[10px] text-accent transition-opacity hover:opacity-70"
                  >
                    <MapPin size={10} /> {tr(" Показать на карте ")}</Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {favoritePlaces.map((place) => (
                    <PlaceCard key={place.id} place={place} onOpen={setSelectedPlace} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Heart}
                title={tr("Избранное пока пустое")}
                description={tr("Нажимайте на сердечко у мест в гиде, чтобы вернуться к ним позже. Избранное видно только вам.")}
                action={
                  <Link to="/guide" className="btn btn-primary btn-sm gap-1.5">
                    <Compass size={12} /> {tr(" Открыть гид ")}</Link>
                }
              />
            )
          ) : null}

          {activeTab === "saved" ? (
            savedTotal ? (
              <div className="space-y-8">
                {savedPosts.length ? (
                  <section>
                    <div className="mb-3 flex items-center justify-between border-b border-white/8 pb-2">
                      <p className="flex items-center gap-2 text-[11.5px] text-white/60">
                        <Bookmark size={12} className="text-accent" /> {tr(" Публикации ")}<span className="font-mono text-[9px] text-white/25">{savedPosts.length}</span>
                      </p>
                      <Link to="/feed" className="text-[9.5px] text-white/25 hover:text-white">
                        {tr(" в ленту → ")}</Link>
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
                    <div className="mb-3 flex items-center justify-between border-b border-white/8 pb-2">
                      <p className="flex items-center gap-2 text-[11.5px] text-white/60">
                        <Bookmark size={12} className="text-accent" /> {tr(" Маршруты ")}<span className="font-mono text-[9px] text-white/25">{savedRoutes.length}</span>
                      </p>
                      <Link to="/routes" className="text-[9.5px] text-white/25 hover:text-white">
                        {tr(" все маршруты → ")}</Link>
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
                    <div className="mb-3 flex items-center justify-between border-b border-white/8 pb-2">
                      <p className="flex items-center gap-2 text-[11.5px] text-white/60">
                        <Bookmark size={12} className="text-accent" /> {tr(" События ")}<span className="font-mono text-[9px] text-white/25">{savedEvents.length}</span>
                      </p>
                      <Link to="/events" className="text-[9.5px] text-white/25 hover:text-white">
                        {tr(" вся афиша → ")}</Link>
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
                icon={Bookmark}
                title={tr("Сохранённое пока пустое")}
                description={tr("Сохраняйте публикации, маршруты и события закладкой — всё соберётся здесь, в одном месте.")}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link to="/feed" className="btn btn-secondary btn-sm">
                      {tr(" Смотреть ленту ")}</Link>
                    <Link to="/events" className="btn btn-primary btn-sm">
                      {tr(" Открыть афишу ")}</Link>
                  </div>
                }
              />
            )
          ) : null}

          {activeTab === "settings" ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="eyebrow">{tr("редактирование")}</p>
                    <h2 className="mt-2 font-display text-2xl font-light tracking-[-0.03em] text-primary">
                      {tr(" Ваш профиль ")}</h2>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Avatar
                      user={{ ...currentUser, avatar, avatarColor }}
                      size="xl"
                      className="border-2 border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-card bg-primary text-app transition-transform hover:scale-105"
                      aria-label={tr("Загрузить фото профиля")}
                    >
                      <Camera size={12} />
                    </button>
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
                          className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                            avatarColor === color ? "border-white" : "border-transparent"
                          }`}
                          style={{ background: color }}
                          aria-label={tr("Выбрать цвет аватара")}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-[9px] text-white/25">
                      {tr(" Фото сжимается локально. Можно обойтись цветным аватаром. ")}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="profile-name">
                      {tr(" Имя ")}</label>
                    <input
                      id="profile-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={50}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="profile-username">
                      Username
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/25">
                        @
                      </span>
                      <input
                        id="profile-username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        maxLength={24}
                        className="field pl-8"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="profile-city">
                      {tr(" Город ")}</label>
                    <input
                      id="profile-city"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      maxLength={40}
                      className="field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="profile-bio">
                      {tr(" О себе ")}</label>
                    <textarea
                      id="profile-bio"
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      rows={4}
                      maxLength={220}
                      className="field resize-none leading-relaxed"
                      placeholder={tr("Что вы любите в городе и какие места ищете?")}
                    />
                    <p className="mt-1 text-right font-mono text-[8px] text-white/20">
                      {bio.length}/220
                    </p>
                  </div>
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
                          className={`chip ${active ? "chip-active" : ""}`}
                        >
                          <CategoryIcon category={category.id} size={12} />
                          {category.shortLabel}
                          {active ? <Check size={10} /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary btn-md gap-2"
                  >
                    <Check size={14} /> {saving ? tr("Сохраняем…") : tr("Сохранить изменения")}
                  </button>
                  <button type="button" onClick={() => setTab("posts")} className="btn btn-secondary btn-md">
                    {tr(" Отмена ")}</button>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[9px] text-white/25">
                  <span className="h-1 w-1 rounded-full bg-emerald-300/60" />
                  {tr(" Данные профиля хранятся в этом браузере и не отправляются на сервер. ")}</p>
              </div>

              <aside className="space-y-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.022] p-4">
                  <p className="eyebrow">{tr("аккаунт")}</p>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/30">{tr("Почта")}</span>
                      <span className="text-white/60">{currentUser.email ?? tr("не указана")}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/30">{tr("Публикаций")}</span>
                      <span className="text-white/60">{myPosts.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/30">{tr("Маршрутов")}</span>
                      <span className="text-white/60">{myRoutes.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/30">{tr("В сообществе")}</span>
                      <span className="text-white/60">{users.length} {tr(" профилей")}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.018] px-4 py-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.035]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40">
                    <RefreshCcw size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] text-white/60">{tr("Сбросить данные")}</span>
                    <span className="mt-0.5 block text-[9px] text-white/25">
                      {tr(" вернуть исходные данные ")}</span>
                  </span>
                  <ArrowRight size={12} className="text-white/20" />
                </button>

                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.018] px-4 py-3 text-left transition-colors hover:border-red-400/20 hover:bg-red-500/[0.04]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40">
                    <LogOut size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] text-white/60">{tr("Выйти из профиля")}</span>
                    <span className="mt-0.5 block text-[9px] text-white/25">
                      {tr(" вернуться на экран входа ")}</span>
                  </span>
                  <ArrowRight size={12} className="text-white/20" />
                </button>
              </aside>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4 text-[9px] text-white/25">
        <span className="flex items-center gap-2">
          <Users size={10} /> {tr(" Профили и публикации — часть городского сообщества ")}</span>
        <span>{tr("Данные не отправляются на сервер")}</span>
      </div>

      <PlaceDetail place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={tr("Сбросить данные?")} size="sm">
        <div className="p-5">
          <p className="text-[12px] leading-relaxed text-white/50">
            {tr(" Вернутся исходные публикации, маршруты, избранное и профиль Алины. Ваши созданные записи и загруженные фото будут удалены. ")}</p>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => setResetOpen(false)} className="btn btn-secondary btn-sm flex-1">
              {tr(" Отмена ")}</button>
            <button
              type="button"
              onClick={() => {
                resetDemo();
                setResetOpen(false);
                setTab("posts");
                toast({ title: tr("Данные сброшены"), description: tr("Снова открыт профиль Алины.") });
              }}
              className="btn btn-sm flex-1 bg-red-500/15 text-red-200 hover:bg-red-500/25"
            >
              {tr(" Сбросить ")}</button>
          </div>
        </div>
      </Modal>

      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)} title={tr("Выйти из профиля?")} size="sm">
        <div className="p-5">
          <p className="text-[12px] leading-relaxed text-white/50">
            {tr(" Избранное и черновики останутся в браузере и вернутся после следующего входа. ")}</p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setLogoutOpen(false)}
              className="btn btn-secondary btn-sm flex-1"
            >
              {tr(" Остаться ")}</button>
            <button
              type="button"
              onClick={() => {
                logout();
                setLogoutOpen(false);
                navigate("/auth");
                toast({ title: tr("Вы вышли из профиля"), variant: "info" });
              }}
              className="btn btn-sm flex-1 bg-red-500/15 text-red-200 hover:bg-red-500/25"
            >
              {tr(" Выйти ")}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
