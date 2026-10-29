import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CategoryId, Companion, Place, PlaceInput, Post, PriceLevel, User } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { cn, compressImage, validateImageFile } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { PageHeader } from "@/components/ui/Bits";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Bits";
import { Modal } from "@/components/ui/Modal";
import { categories, categoryMap, companionOptions } from "@/data/categories";
import { categoryIconNames } from "@/components/ui/Category";
import { MapView } from "@/components/map/MapView";
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
  editPlace: (id: string, patch: Partial<PlaceInput>) => { ok: boolean; error?: string };
  query: string;
  onQueryChange: (value: string) => void;
}

const ADMIN_CITY_CENTER: [number, number] = [49.9481, 82.6286];

const adminPriceOptions: Array<{ value: PriceLevel; label: string; hint: string }> = [
  { value: 0, label: tr("Бесплатно"), hint: tr("парк, набережная, прогулка") },
  { value: 1, label: "₸", hint: tr("кофе или перекус") },
  { value: 2, label: "₸₸", hint: tr("ужин или билет") },
  { value: 3, label: "₸₸₸", hint: tr("премиум-вечер") },
];

const adminDistrictOptions = [tr("Центр"), tr("Стрелка"), tr("Студгородок"), tr("Шмелёв Лог"), tr("Левый берег"), tr("Октябрьский")];

const defaultCompanions: Companion[] = ["solo", "couple", "friends", "family"];

interface PlaceFormState {
  name: string;
  category: CategoryId;
  district: string;
  address: string;
  description: string;
  shortDescription: string;
  tags: string;
  priceLevel: PriceLevel;
  companions: Companion[];
  coords: [number, number] | null;
  image: string | null;
}

/**
 * Шаг 3: полное управление локациями из базы данных.
 * • все поля карточки: название, категория, район, адрес, точка на карте,
 *   описание, теги, ценник и «с кем хорошо»;
 * • фото — файлом или ссылкой, с мгновенным превью;
 * • для seed-мест и мест из базы правки сохраняются в localStorage,
 *   а при настроенном Supabase дублируются в public.places;
 * • после сохранения изменения сразу видны в гиде, на карте и на главной.
 */
function AdminPlaces({ places, editPlace, query, onQueryChange }: AdminPlacesProps) {
  const { toast } = useToast();
  const [editorId, setEditorId] = useState<string | null>(null);
  const [form, setForm] = useState<PlaceFormState | null>(null);
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

  const patchForm = (patch: Partial<PlaceFormState>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const openEditor = (place: Place) => {
    setEditorId(place.id);
    setForm({
      name: place.name,
      category: place.category,
      district: place.district,
      address: place.address,
      description: place.description,
      shortDescription: place.shortDescription,
      tags: place.tags.join(", "),
      priceLevel: place.priceLevel,
      companions: place.companions.length ? [...place.companions] : [...defaultCompanions],
      coords: [...place.coords] as [number, number],
      image: place.image || null,
    });
    setFileUrl("");
  };

  const closeEditor = () => {
    setEditorId(null);
    setForm(null);
    setFileUrl("");
  };

  const handlePickFile = async (file: File | undefined) => {
    if (!file || !form) return;
    if (!validateImageFile(file)) {
      toast({ title: tr("Файл не поддерживается"), description: tr("Форматы JPG/PNG/WebP до 8 МБ."), variant: "error" });
      return;
    }
    setBusy(true);
    try {
      const compressed = await compressImage(file, 1600);
      patchForm({ image: compressed });
      if (supabaseConfigured && editorId) {
        // В продакшене (Supabase): заливаем в бакет под уникальным именем.
        const publicUrl = await uploadPlaceImage(editorId, file)
          .catch((error) => { toast({ title: tr("Ошибка загрузки"), description: String(error), variant: "error" }); return null; });
        if (publicUrl) patchForm({ image: publicUrl });
      }
    } finally {
      setBusy(false);
    }
  };

  const applyUrl = () => {
    const clean = fileUrl.trim();
    if (!clean) return;
    patchForm({ image: clean.includes("?") || clean.startsWith("data:") ? clean : `${clean}?v=${Date.now()}` });
    setFileUrl("");
  };

  const save = () => {
    if (!form || !selected) return;
    if (form.name.trim().length < 2) {
      toast({ title: tr("Как называется место?"), variant: "error" });
      return;
    }
    if (!form.coords) {
      toast({ title: tr("Поставьте точку на карте"), variant: "error" });
      return;
    }
    if (form.description.trim().length < 12) {
      toast({
        title: tr("Добавьте пару слов о месте"),
        description: tr("Хотя бы одно предложение — чем оно особенное."),
        variant: "error",
      });
      return;
    }
    const result = editPlace(selected.id, {
      name: form.name.trim(),
      category: form.category,
      district: form.district.trim() || tr("Өскемен"),
      address: form.address.trim() || tr("Точка на карте"),
      description: form.description.trim(),
      shortDescription:
        form.shortDescription.trim() ||
        `${form.description.trim().slice(0, 92)}${form.description.trim().length > 92 ? "…" : ""}`,
      coords: form.coords,
      image: form.image ?? "",
      tags: form.tags.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean).slice(0, 6),
      priceLevel: form.priceLevel,
      companions: form.companions.length ? form.companions : [...defaultCompanions],
    });
    if (!result.ok) {
      toast({ title: tr("Не удалось сохранить место"), description: result.error, variant: "error" });
      return;
    }
    closeEditor();
    toast({
      title: tr("Место обновлено"),
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
                icon="edit"
                label={tr("Редактировать место")}
                size="sm"
                onClick={() => openEditor(place)}
              />
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="gallery" title={tr("Мест не найдено")} description={tr("Попробуйте изменить запрос.")} />
      )}

      {/* Редактор карточки места */}
      <Modal
        open={Boolean(selected) && Boolean(form)}
        onClose={closeEditor}
        title={tr("Редактор места")}
        description={selected?.name}
        size="xl"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-meta text-muted">
              <Icon name="info" size={14} className="shrink-0" />
              {tr("Правки сразу применяются в гиде, на карте, в ленте и на главной.")}
            </p>
            <div className="flex gap-2 sm:shrink-0">
              <Button variant="secondary" onClick={closeEditor} className="flex-1 sm:flex-none">
                {tr("Отмена")}
              </Button>
              <Button variant="primary" icon="check" onClick={save} disabled={busy} className="flex-1 sm:flex-none">
                {busy ? tr("Сохраняем…") : tr("Сохранить")}
              </Button>
            </div>
          </div>
        }
      >
        {selected && form ? (
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative h-[260px] overflow-hidden rounded-2xl border border-line sm:h-[300px]">
                  <MapView
                    markers={[]}
                    center={form.coords ?? ADMIN_CITY_CENTER}
                    zoom={form.coords ? 16 : 13}
                    fitToMarkers={false}
                    showLocate={false}
                    className="h-full"
                    onMapClick={(value) => patchForm({ coords: value })}
                    pickMarker={form.coords ? { coords: form.coords, label: form.name || selected.name } : null}
                  />
                  {form.coords ? (
                    <div className="absolute inset-x-3 bottom-3 z-[65] flex items-center justify-between gap-2 rounded-xl bg-surface/95 px-3 py-2 shadow-card">
                      <span className="flex items-center gap-1.5 text-meta font-medium text-accent-ink">
                        <Icon name="check" size={14} />
                        {tr("Точка выбрана")}
                      </span>
                      <span className="tabular-nums text-meta text-muted">
                        {form.coords[0].toFixed(5)}, {form.coords[1].toFixed(5)}
                      </span>
                    </div>
                  ) : null}
                </div>
                {form.coords ? (
                  <Button variant="ghost" size="sm" icon="close" onClick={() => patchForm({ coords: null })}>
                    {tr("Переставить точку")}
                  </Button>
                ) : (
                  <p className="text-meta text-muted">
                    {tr("Нажмите на карту, чтобы переставить координаты места.")}
                  </p>
                )}
              </div>

              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-sunken">
                {form.image ? (
                  <img src={form.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                    <Icon name="camera" size={24} />
                    <p className="text-sm">{tr("Фото не выбрано")}</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                id="admin-place-photo"
                onChange={(event) => void handlePickFile(event.target.files?.[0])}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="upload"
                  loading={busy}
                  onClick={() => document.getElementById("admin-place-photo")?.click()}
                  className="flex-1"
                >
                  {busy ? tr("Обрабатываем…") : tr("Заменить фото")}
                </Button>
                {form.image ? (
                  <IconButton icon="close" label={tr("Убрать фото")} variant="bordered" size="sm" onClick={() => patchForm({ image: null })} />
                ) : null}
              </div>
              {!supabaseConfigured ? (
                <p className="text-meta text-muted">
                  {tr("Файл будет сохранён локально: подключите Supabase, чтобы фото загружалось в бакет guide-images.")}
                </p>
              ) : null}

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
            </div>

            <div className="min-w-0 space-y-5">
              <Field id="admin-place-name" label={tr("Название места")}>
                <Input
                  id="admin-place-name"
                  value={form.name}
                  onChange={(event) => patchForm({ name: event.target.value })}
                  maxLength={70}
                />
              </Field>

              <div>
                <p className="field-label">{tr("Категория")}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {categories.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={form.category === item.id}
                      onClick={() => patchForm({ category: item.id })}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition-colors",
                        form.category === item.id
                          ? "border-accent bg-accent-soft text-accent-ink"
                          : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                      )}
                    >
                      <Icon name={categoryIconNames[item.id]} size={16} className="shrink-0" />
                      <span className="truncate">{item.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="admin-place-district" label={tr("Район")}>
                  <Input
                    id="admin-place-district"
                    value={form.district}
                    onChange={(event) => patchForm({ district: event.target.value })}
                    list="admin-place-districts"
                    maxLength={40}
                  />
                  <datalist id="admin-place-districts">
                    {adminDistrictOptions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </Field>
                <Field id="admin-place-address" label={tr("Адрес или ориентир")}>
                  <Input
                    id="admin-place-address"
                    value={form.address}
                    onChange={(event) => patchForm({ address: event.target.value })}
                    maxLength={90}
                    placeholder={tr("Улица, дом")}
                  />
                </Field>
              </div>

              <Field id="admin-place-description" label={tr("Описание")} hint={`${form.description.length}/700 · ${tr("Минимум одно предложение")}`}>
                <Textarea
                  id="admin-place-description"
                  value={form.description}
                  onChange={(event) => patchForm({ description: event.target.value })}
                  maxLength={700}
                  rows={4}
                />
              </Field>

              <Field id="admin-place-short" label={tr("Краткое описание")} hint={tr("Показывается в карточках и списке гида")}>
                <Input
                  id="admin-place-short"
                  value={form.shortDescription}
                  onChange={(event) => patchForm({ shortDescription: event.target.value })}
                  maxLength={160}
                />
              </Field>

              <div>
                <p className="field-label">{tr("Бюджет")}</p>
                <div className="grid grid-cols-4 gap-2">
                  {adminPriceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={form.priceLevel === option.value}
                      title={option.hint}
                      onClick={() => patchForm({ priceLevel: option.value })}
                      className={cn(
                        "h-10 rounded-xl border text-sm font-medium transition-colors",
                        form.priceLevel === option.value
                          ? "border-accent bg-accent-soft text-accent-ink"
                          : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="field-hint">{adminPriceOptions.find((option) => option.value === form.priceLevel)?.hint}</p>
              </div>

              <div>
                <p className="field-label">{tr("С кем хорошо")}</p>
                <div className="flex flex-wrap gap-2">
                  {companionOptions.map((option) => (
                    <Chip
                      key={option.id}
                      aria-pressed={form.companions.includes(option.id)}
                      active={form.companions.includes(option.id)}
                      onClick={() =>
                        patchForm({
                          companions: form.companions.includes(option.id)
                            ? form.companions.filter((item) => item !== option.id)
                            : [...form.companions, option.id],
                        })
                      }
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <Field id="admin-place-tags" label={tr("Теги через запятую")}>
                <Input
                  id="admin-place-tags"
                  value={form.tags}
                  onChange={(event) => patchForm({ tags: event.target.value })}
                  maxLength={90}
                  placeholder={tr("кофе, вид, тихо")}
                />
              </Field>
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
    editPlace,
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
          editPlace={editPlace}
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