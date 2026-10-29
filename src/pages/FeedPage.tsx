import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CategoryId, Post } from "@/types";
import { categoryMap } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import { normalize, pluralizeComments, pluralizePosts } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { PostCard, PostCardSkeleton } from "@/components/feed/PostCard";
import { PostDetailModal } from "@/components/feed/PostDetailModal";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import { CategoryFilter } from "@/components/places/CategoryFilter";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Bits";
import { Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

type FeedSort = "new" | "popular" | "discussed";

const sortOptions: Array<{ value: FeedSort; label: string }> = [
  { value: "new", label: tr("Сначала новые") },
  { value: "popular", label: tr("Популярные") },
  { value: "discussed", label: tr("Обсуждаемые") },
];

export function FeedPage() {
  const { posts, users, currentUser, getUser, placeMap } = useApp();
  const ready = useDelayedReady(420);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [authorId, setAuthorId] = useState("all");
  const [sort, setSort] = useState<FeedSort>("new");

  const selectedPost = posts.find((post) => post.id === searchParams.get("post")) ?? null;
  const createOpen = searchParams.get("create") === "1";

  const openPost = (post: Post) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("post", post.id);
        next.delete("create");
        return next;
      },
      { replace: false },
    );
  };

  const closePost = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("post");
        return next;
      },
      { replace: false },
    );
  };

  const openCreate = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("create", "1");
        return next;
      },
      { replace: false },
    );
  };

  const closeCreate = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("create");
        return next;
      },
      { replace: false },
    );
  };

  const commentsCount = posts.reduce((total, post) => total + post.comments.length, 0);
  const authorsCount = new Set(posts.map((post) => post.userId)).size;

  const counts: Record<CategoryId | "all", number> = useMemo(
    () => ({
      all: posts.length,
      food: posts.filter((post) => post.category === "food").length,
      nature: posts.filter((post) => post.category === "nature").length,
      entertainment: posts.filter((post) => post.category === "entertainment").length,
      culture: posts.filter((post) => post.category === "culture").length,
      sport: posts.filter((post) => post.category === "sport").length,
      landmark: posts.filter((post) => post.category === "landmark").length,
      leisure: posts.filter((post) => post.category === "leisure").length,
    }),
    [posts],
  );

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    const result = posts.filter((post) => {
      if (category !== "all" && post.category !== category) return false;
      if (authorId !== "all" && post.userId !== authorId) return false;
      if (!normalized) return true;
      const author = getUser(post.userId);
      const place = placeMap[post.placeId];
      return normalize(
        [post.title, post.text, author?.name ?? "", place?.name ?? "", ...post.comments.map((c) => c.text)].join(" "),
      ).includes(normalized);
    });

    if (sort === "popular") {
      return [...result].sort(
        (a, b) => b.baseLikes + b.likedBy.length - (a.baseLikes + a.likedBy.length),
      );
    }
    if (sort === "discussed") {
      return [...result].sort((a, b) => b.comments.length - a.comments.length);
    }
    return [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [posts, category, authorId, query, sort, getUser, placeMap]);

  const activeFilterCount =
    (query ? 1 : 0) + (category !== "all" ? 1 : 0) + (authorId !== "all" ? 1 : 0);

  const topPlaces = useMemo(() => {
    const countsByPlace = new Map<string, number>();
    posts.forEach((post) => {
      countsByPlace.set(post.placeId, (countsByPlace.get(post.placeId) ?? 0) + 1);
    });
    return Array.from(countsByPlace.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([placeId, count]) => ({ place: placeMap[placeId], count }))
      .filter((item) => Boolean(item.place));
  }, [posts, placeMap]);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setAuthorId("all");
  };

  return (
    <div className="page-wrap">
      <PageHeader
        title={tr("Лента города")}
        description={tr("Личные находки жителей: свет, кофе, прогулки и маршруты. Читайте, сохраняйте, делитесь своим.")}
        actions={
          <Button variant="primary" icon="plus" onClick={openCreate}>
            {tr("Поделиться открытием")}
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="feed" size={15} /> {pluralizePosts(posts.length)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="comment" size={15} /> {pluralizeComments(commentsCount)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="users" size={15} /> {authorsCount} {tr("авторов")}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <section className="card p-3.5 sm:p-4" aria-label={tr("Поиск и фильтры")}>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tr("Найти публикацию, место или автора…")}
                leadingIcon="search"
                className="pr-12"
                wrapperClassName="flex-1"
                aria-label={tr("Поиск по ленте")}
                trailing={
                  query ? (
                    <IconButton icon="close" label={tr("Очистить поиск")} size="sm" onClick={() => setQuery("")} />
                  ) : null
                }
              />
              <div className="flex gap-2">
                <Select
                  value={authorId}
                  onChange={(event) => setAuthorId(event.target.value)}
                  aria-label={tr("Фильтр по автору")}
                  className="h-11 min-w-0 flex-1 sm:w-[160px]"
                >
                  <option value="all">{tr("Все авторы")}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as FeedSort)}
                  aria-label={tr("Сортировка ленты")}
                  className="h-11 min-w-0 flex-1 sm:w-[160px]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <CategoryFilter value={category} onChange={setCategory} counts={counts} />
            </div>
          </section>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {activeFilterCount ? (
                <>
                  {tr("Отфильтровано")}: <span className="font-medium text-fg">{filtered.length}</span> {tr("из")}{" "}
                  {posts.length}
                </>
              ) : (
                <>{tr("Вся лента сообщества")}</>
              )}
            </p>
            {activeFilterCount ? (
              <Button variant="ghost" size="sm" icon="refresh" onClick={resetFilters}>
                {tr("Сбросить")}
              </Button>
            ) : null}
          </div>

          <div className="mt-4 space-y-5">
            {!ready ? (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
            ) : filtered.length ? (
              filtered.map((post) => <PostCard key={post.id} post={post} onOpen={openPost} />)
            ) : (
              <EmptyState
                icon="feed"
                title={tr("В такой ленте пока тихо")}
                description={tr("Ничего не совпало с поиском или фильтрами. Сбросьте их или станьте первым, кто расскажет об этом городе.")}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" size="sm" onClick={resetFilters}>
                      {tr("Сбросить фильтры")}
                    </Button>
                    <Button variant="primary" size="sm" icon="plus" onClick={openCreate}>
                      {tr("Новая публикация")}
                    </Button>
                  </div>
                }
              />
            )}
          </div>

          {filtered.length ? (
            <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong px-5 py-6 text-center">
              <p className="max-w-lg text-sm text-muted">
                {tr("Это вся лента сообщества. Ваши публикации сохраняются в браузере и появляются в начале ленты.")}
              </p>
              <Button variant="secondary" size="sm" icon="plus" onClick={openCreate}>
                {tr("Добавить своё открытие")}
              </Button>
            </div>
          ) : null}
        </div>

        <aside className="hidden space-y-4 lg:block">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">{tr("Сообщество города")}</h2>
              <Icon name="users" size={17} className="text-faint" />
            </div>
            <div className="mt-4 flex items-center">
              {users.slice(0, 5).map((user, index) => (
                <span key={user.id} className={index > 0 ? "-ml-2.5" : ""}>
                  <Avatar user={user} size="sm" className="border-2 border-surface" />
                </span>
              ))}
              <span className="ml-auto text-meta text-muted">{users.length} {tr("профилей")}</span>
            </div>
            <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">
              {tr("Пять профилей уже делятся городскими находками. Аккаунт можно создать за пару секунд.")}
            </p>
            {currentUser ? (
              <Link
                to="/profile"
                className="mt-4 flex items-center gap-2.5 rounded-xl border border-line p-2.5 transition-colors hover:bg-sunken"
              >
                <Avatar user={currentUser} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{currentUser.name}</span>
                  <span className="block truncate text-meta text-muted">@{currentUser.username}</span>
                </span>
                <Icon name="chevronRight" size={15} className="text-faint" />
              </Link>
            ) : (
              <ButtonLink to="/auth" variant="primary" size="sm" fullWidth className="mt-4">
                {tr("Войти в аккаунт")}
              </ButtonLink>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">{tr("Чаще всего в ленте")}</h2>
              <Icon name="heart" size={16} className="text-faint" />
            </div>
            <div className="mt-3 space-y-1">
              {topPlaces.map(({ place, count }) => (
                <Link
                  key={place.id}
                  to={`/guide?place=${place.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sunken"
                >
                  <img src={place.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{place.name}</span>
                    <span className="block text-meta text-muted">{pluralizePosts(count)}</span>
                  </span>
                  <Icon name="chevronRight" size={14} className="text-faint" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-accent-soft p-5">
            <Icon name="plan" size={19} className="text-accent-ink" />
            <h2 className="mt-3 font-display text-lg font-semibold text-fg">{tr("Не хочется выбирать?")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {tr("Ответьте на несколько вопросов — соберём маршрут на вечер.")}
            </p>
            <ButtonLink to="/plan" variant="primary" size="sm" fullWidth className="mt-4">
              {tr("Подобрать вечер")}
            </ButtonLink>
          </div>
        </aside>
      </div>

      <PostDetailModal post={selectedPost} onClose={closePost} />
      <CreatePostModal
        open={createOpen}
        onClose={closeCreate}
        initialPlaceId={query ? posts.find((post) => normalize(post.title).includes(normalize(query)))?.placeId : undefined}
        onCreated={(post) => {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("create");
              next.set("post", post.id);
              return next;
            },
            { replace: true },
          );
        }}
      />
    </div>
  );
}
