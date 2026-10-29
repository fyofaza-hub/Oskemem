import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Post, User, Place } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { cn, compressImage, validateImageFile } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { PageHeader } from "@/components/ui/Bits";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Bits";
import { Modal } from "@/components/ui/Modal";
import { categoryMap } from "@/data/categories";
import { uploadPlaceImage, supabaseConfigured } from "@/lib/supabase";

type Tab = "posts" | "places" | "users" | "settings";
type PostsFilter = "all" | "pending" | "approved";

const isPublished = (post: Post) => post.approved || post.demo;

interface AdminPostsProps {
  posts: Post[];
  approvePost: (id: string) => void;
  rejectPost: (id: string) => void;
  moderatePosts: (ids: string[], action: "approve" | "reject") => void;
  deletePost: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
}

/** Модерация публикаций: фильтр статусов, чекбоксы, массовые действия и превью. */
function AdminPosts({ posts, approvePost, rejectPost, moderatePosts, deletePost, query, onQueryChange }: AdminPostsProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<PostsFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Post | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const status = isPublished(post) ? "approved" : "pending";
      if (filter !== "all" && status !== filter) return false;
      if (!q) return true;
      return [post.title, post.text, post.id].some((value) => value.toLowerCase().includes(q));
    });
  }, [posts, filter, query]);

  const actionable = filtered.filter((post) => !post.demo);
  const allChecked = actionable.length > 0 && actionable.every((post) => selected.has(post.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) actionable.forEach((post) => next.delete(post.id));
      else actionable.forEach((post) => next.add(post.id));
      return next;
    });
  };

  const bulk = (action: "approve" | "reject") => {
    const ids = [...selected];
    moderatePosts(ids, action);
    setSelected(new Set());
    toast({
      title: action === "approve" ? tr("Выбранное одобрено") : tr("Выбранное отклонено"),
      description: tr("Публикаций в операции: {count}", { count: ids.length }),
      variant: action === "approve" ? "success" : "info",
    });
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", tr("Все")],
            ["pending", tr("На проверке")],
            ["approved", tr("Одобренные")],
          ] as Array<[PostsFilter, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilter(value);
              setSelected(new Set());
            }}
            className={cn("chip", filter === value && "chip-active")}
          >
            {label}
          </button>
        ))}
      </div>

      <Input
        leadingIcon="search"
        placeholder={tr("Поиск по публикациям")}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      {actionable.length ? (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
          <label className="flex items-center gap-2.5 text-sm text-fg">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-[rgb(var(--accent))]" />
            {tr("Выбрать всё")}
          </label>
          {selected.size ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-meta text-muted">
                {tr("Выбрано: {count}", { count: selected.size })}
              </span>
              <Button size="sm" variant="primary" icon="check" onClick={() => bulk("approve")}>
                {tr("Одобрить выбранные")}
              </Button>
              <Button size="sm" variant="secondary" icon="close" onClick={() => bulk("reject")}>
                {tr("Отклонить выбранные")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                {tr("Снять выделение")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((post) => {
            const published = isPublished(post);
            const selectable = !post.demo;
            return (
              <article key={post.id} className={cn("card p-4 transition-colors", selected.has(post.id) && "border-accent/40")}>
                <div className="flex items-start gap-3">
                  {selectable ? (
                    <input
                      type="checkbox"
                      checked={selected.has(post.id)}
                      onChange={() => toggle(post.id)}
                      aria-label={tr("Выбрать публикацию") + ": " + post.title}
                      className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{post.title}</p>
                    <p className="mt-1 text-meta text-muted">
                      {post.userId} · {categoryMap[post.category].shortLabel} · {new Date(post.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{post.text}</p>
                  </div>
                  <span className={cn("badge", published ? "bg-accent-soft text-accent-ink" : "bg-danger-soft text-danger-ink")}>
                    {published ? tr("Одобрено") : tr("На проверке")}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" icon="image" onClick={() => setPreview(post)}>
                    {tr("Превью")}
                  </Button>
                  {!post.approved && !post.demo ? (
                    <Button size="sm" variant="primary" onClick={() => approvePost(post.id)}>
                      {tr("Одобрить")}
                    </Button>
                  ) : null}
                  {post.approved && !post.demo ? (
                    <Button size="sm" variant="secondary" onClick={() => rejectPost(post.id)}>
                      {tr("Отклонить")}
                    </Button>
                  ) : null}
                  <Button size="sm" variant="danger" onClick={() => deletePost(post.id)}>
                    {tr("Удалить")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="feed" title={tr("Публикаций нет")} description={tr("Новых материалов для модерации нет.")} />
      )}

      {/* Превью карточки перед публикацией */}
      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={tr("Превью публикации")} size="lg">
        {preview ? (
          <div className="p-4 sm:p-5">
            <article className="card overflow-hidden">
              <img src={preview.image} alt="" className="aspect-[16/9] w-full object-cover" />
              <div className="p-4">
                <p className="text-meta text-muted">
                  {categoryMap[preview.category].shortLabel} · {new Date(preview.createdAt).toLocaleDateString()}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-fg">{preview.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{preview.text}</p>
              </div>
            </article>
            <div className="mt-4 flex flex-wrap gap-2">
              {!preview.demo ? (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    icon="check"
                    onClick={() => {
                      approvePost(preview.id);
                      setSelected((prev) => {
                        const next = new Set(prev);
                        next.delete(preview.id);
                        return next;
                      });
                      setPreview(null);
                      toast({ title: tr("Одобрено"), description: preview.title, variant: "success" });
                    }}
                  >
                    {tr("Одобрить и опубликовать")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon="close"
                    onClick={() => {
                      rejectPost(preview.id);
                      setSelected((prev) => {
                        const next = new Set(prev);
                        next.delete(preview.id);
                        return next;
                      });
                      setPreview(null);
                      toast({ title: tr("Отклонено"), description: preview.title, variant: "info" });
                    }}
                  >
                    {tr("Отклонить")}
                  </Button>
                </>
              ) : null}
              <Button variant="ghost" size="md" onClick={() => setPreview(null)}>
                {tr("Закрыть")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

interface AdminPlacesProps {
  places: Place[];
  setPlaceImage: (id: string, image: string) => { ok: boolean; error?: string };
  query: string;
  onQueryChange: (value: string) => void;
}

/**
 * Шаг 2: управление фотографиями мест.
 * • превью мгновенно после выбора файла или ссылки;
 * • сохранение: локально — оптимизированный dataURL,
 *   в Supabase — файл в бакет guide-images (только admin по RLS);
 * • после сохранения новая обложка сразу видна в гиде, на карте и на главной.
 */
function AdminPlaces({ places, setPlaceImage, query, onQueryChange }: AdminPlacesProps) {
  const { toast } = useToast();
  const [editorId, setEditorId] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter((place) =>
      [place.name, place.district, place.address, place.category]
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [places, query]);

  const selected = places.find((place) => place.id === editorId) ?? null;

  const openEditor = (placeId: string) => {
    const place = places.find((item) => item.id === placeId);
    setEditorId(placeId);
    setCandidate(place?.image ?? null);
    setFileUrl("");
  };

  const closeEditor = () => {
    setEditorId(null);
    setCandidate(null);
    setFileUrl("");
  };

  const handlePickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!validateImageFile(file)) {
      toast({ title: tr("Файл не поддерживается"), description: tr("Форматы JPG/PNG/WebP до 8 МБ."), variant: "error" });
      return;
    }
    setBusy(true);
    try {
      const compressed = await compressImage(file, 1600);
      setCandidate(compressed);
      if (supabaseConfigured) {
        // В продакшене (Supabase): заливаем в бакет под уникальным именем.
        const publicUrl = await uploadPlaceImage(editorId ?? "", file)
          .catch((error) => { toast({ title: tr("Ошибка загрузки"), description: String(error), variant: "error" }); return null; });
        if (publicUrl) setCandidate(publicUrl);
      }
    } finally {
      setBusy(false);
    }
  };

  const applyUrl = () => {
    const clean = fileUrl.trim();
    if (!clean) return;
    setCandidate(clean.includes("?") || clean.startsWith("data:") ? clean : `${clean}?v=${Date.now()}`);
    setFileUrl("");
  };

  const save = () => {
    if (!selected || !candidate) return;
    const result = setPlaceImage(selected.id, candidate);
    if (!result.ok) {
      toast({ title: tr("Не удалось сохранить фото"), description: result.error, variant: "error" });
      return;
    }
    closeEditor();
    toast({
      title: tr("Обложка обновлена"),
      description: `${selected.name} — ${tr("изменения уже видны в гиде, на карте и на главной.")}`,
      variant: "success",
    });
  };

  return (
    <div className="mt-6 space-y-3">
      <Input
        leadingIcon="search"
        placeholder={tr("Поиск по местам: название, район, адрес")}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {filteredPlaces.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredPlaces.slice(0, 150).map((place) => (
            <article key={place.id} className="card flex items-center gap-3 p-3">
              <img src={place.image} alt="" loading="lazy" className="h-14 w-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{place.name}</p>
                <p className="truncate text-meta text-muted">
                  {categoryMap[place.category].shortLabel} · {place.district}
                </p>
              </div>
              <IconButton
                icon="image"
                label={tr("Заменить фото")}
                size="sm"
                onClick={() => openEditor(place.id)}
              />
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="gallery" title={tr("Мест не найдено")} description={tr("Попробуйте изменить запрос.")} />
      )}

      {/* Редактор фотографии места */}
      <Modal
        open={Boolean(selected)}
        onClose={closeEditor}
        title={tr("Фотография места")}
        description={selected?.name}
        size="md"
      >
        {selected ? (
          <div className="space-y-4 p-4 sm:p-5">
            <div className="overflow-hidden rounded-2xl border border-line bg-sunken">
              {candidate ? (
                <img src={candidate} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center text-sm text-muted">
                  {tr("Фото не выбрано")}
                </div>
              )}
            </div>

            <div>
              <p className="field-label">{tr("Загрузить новое фото с компьютера")}</p>
              <label className="btn btn-secondary cursor-pointer">
                <Icon name="upload" size={16} />
                {busy ? tr("Обрабатываем…") : tr("Выбрать файл")}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => handlePickFile(event.target.files?.[0])}
                />
              </label>
              {!supabaseConfigured ? (
                <p className="mt-1.5 text-meta text-muted">
                  {tr("Файл будет сохранён локально: подключите Supabase, чтобы фото загружалось в бакет guide-images.")}
                </p>
              ) : null}
            </div>

            <div>
              <p className="field-label">{tr("Или укажите ссылку на изображение")}</p>
              <div className="flex gap-2">
                <Input
                  value={fileUrl}
                  onChange={(event) => setFileUrl(event.target.value)}
                  placeholder="https://…/photo.jpg"
                />
                <Button variant="secondary" size="md" onClick={applyUrl}>
                  {tr("Применить")}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="primary" size="md" icon="check" onClick={save} disabled={!candidate || busy}>
                {tr("Сохранить и заменить")}
              </Button>
              <Button variant="ghost" size="md" onClick={closeEditor}>
                {tr("Отмена")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentUser,
    isAdmin,
    users,
    posts,
    places,
    siteSettings,
    setPlaceImage,
    approvePost,
    rejectPost,
    moderatePosts,
    deletePost,
    setUserRole,
    banUser,
    updateSiteSettings,
  } = useApp();
  const [tab, setTab] = useState<Tab>("posts");
  const [query, setQuery] = useState("");
  const [placesQuery, setPlacesQuery] = useState("");
  const [settingsDraft, setSettingsDraft] = useState(siteSettings);

  useEffect(() => {
    setSettingsDraft(siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isAdmin) {
      toast({ title: tr("Доступ запрещён"), description: tr("Эта страница доступна только администраторам."), variant: "error" });
      navigate("/", { replace: true });
    }
  }, [currentUser, isAdmin, navigate, toast]);

  if (!currentUser || !isAdmin) {
    return (
      <div className="page-wrap">
        <EmptyState
          icon="shield"
          title={tr("Доступ запрещён")}
          description={tr("Эта страница доступна только администраторам.")}
          action={<ButtonLink to="/" variant="primary">{tr("На главную")}</ButtonLink>}
        />
      </div>
    );
  }

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (!q) return true;
      return [post.title, post.text, post.id].some((value) => value.toLowerCase().includes(q));
    });
  }, [posts, query]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (!q) return true;
      return [user.name, user.username, user.email ?? ""].some((value) => value.toLowerCase().includes(q));
    });
  }, [users, query]);

  return (
    <div className="page-wrap">
      <PageHeader
        title={tr("Админ-панель")}
        description={tr("Модерация контента, пользователи и параметры сайта.")}
      />

      <div className="mt-5 flex flex-wrap gap-2">
        {(["posts", "places", "users", "settings"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setTab(item);
              setPlacesQuery("");
              setQuery("");
            }}
            className={cn(
              "chip",
              tab === item && "chip-active",
            )}
          >
            {item === "posts" ? tr("Публикации") : item === "places" ? tr("Места") : item === "users" ? tr("Пользователи") : tr("Настройки")}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <AdminPosts
          posts={posts}
          approvePost={approvePost}
          rejectPost={rejectPost}
          moderatePosts={moderatePosts}
          deletePost={deletePost}
          query={query}
          onQueryChange={setQuery}
        />
      ) : null}

      {tab === "places" ? (
        <AdminPlaces
          places={places}
          setPlaceImage={setPlaceImage}
          query={placesQuery}
          onQueryChange={setPlacesQuery}
        />
      ) : null}

      {tab === "users" ? (
        <div className="mt-6 space-y-3">
          <Input
            leadingIcon="search"
            placeholder={tr("Поиск пользователей")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {filteredUsers.length ? (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div key={user.id} className="card flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{user.name}</p>
                    <p className="text-meta text-muted">
                      @{user.username} · {user.email} · {user.role ?? "user"}
                      {user.banned ? ` · ${tr("заблокирован")}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setUserRole(user.id, user.role === "admin" ? "user" : "admin")}
                      disabled={user.id === currentUser.id}
                    >
                      {user.role === "admin" ? tr("Снять админа") : tr("Сделать админом")}
                    </Button>
                    <Button
                      size="sm"
                      variant={user.banned ? "primary" : "danger"}
                      onClick={() => banUser(user.id, !user.banned)}
                      disabled={user.id === currentUser.id}
                    >
                      {user.banned ? tr("Разблокировать") : tr("Заблокировать")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="users" title={tr("Пользователей нет")} description={tr("Список пуст.")} />
          )}
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="mt-6 max-w-xl space-y-4">
          <div>
            <label className="field-label">{tr("Название сайта")}</label>
            <Input
              value={settingsDraft.siteTitle}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, siteTitle: event.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={settingsDraft.maintenanceMode}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, maintenanceMode: event.target.checked }))}
            />
            {tr("Режим обслуживания")}
          </label>
          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={settingsDraft.postingEnabled}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, postingEnabled: event.target.checked }))}
            />
            {tr("Разрешить публикации")}
          </label>
          <Button
            variant="primary"
            onClick={() => {
              updateSiteSettings(settingsDraft);
              toast({ title: tr("Настройки сохранены"), variant: "success" });
            }}
          >
            {tr("Сохранить")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}