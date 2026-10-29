import { Link } from "react-router-dom";
import type { Post } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn, shareLink, timeAgo } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface PostCardProps {
  post: Post;
  onOpen?: (post: Post) => void;
  variant?: "default" | "compact";
}

export function PostCard({ post, onOpen, variant = "default" }: PostCardProps) {
  const { getUser, currentUser, toggleLike, toggleSavePost, savedPostIds, placeMap } = useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const author = getUser(post.userId);
  const place = placeMap[post.placeId];
  const liked = currentUser ? post.likedBy.includes(currentUser.id) : false;
  const saved = savedPostIds.includes(post.id);
  const likes = post.baseLikes + post.likedBy.length;

  const handleLike = () => {
    requireAuth(() => toggleLike(post.id), tr("Войдите, чтобы реагировать на публикации"));
  };

  const handleSave = () => {
    requireAuth(() => {
      toggleSavePost(post.id);
      toast({
        title: saved ? tr("Убрано из сохранённого") : tr("Публикация сохранена"),
        description: post.title,
        variant: saved ? "info" : "success",
      });
    });
  };

  const handleShare = async () => {
    const result = await shareLink({
      title: post.title,
      text: `${post.title} — ${post.text.slice(0, 120)}`,
      url: `${window.location.origin}/feed?post=${post.id}`,
    });
    if (result === "copied") toast({ title: tr("Ссылка на публикацию скопирована") });
    if (result === "failed") toast({ title: tr("Не удалось скопировать ссылку"), variant: "error" });
  };

  if (variant === "compact") {
    return (
      <article className="card group relative flex gap-3 p-3 transition-colors hover:border-line-strong">
        <button
          type="button"
          onClick={() => onOpen?.(post)}
          className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={tr("Открыть публикацию") + ": " + post.title}
        />
        <img src={post.image} alt="" className="pointer-events-none h-20 w-24 shrink-0 rounded-xl object-cover" loading="lazy" />
        <div className="pointer-events-none min-w-0 flex-1 py-0.5">
          <h3 className="line-clamp-1 font-display text-[15px] font-semibold text-fg">{post.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{post.text}</p>
          <p className="mt-1.5 truncate text-meta text-muted">
            {author?.name ?? tr("Гость")} · {timeAgo(post.createdAt)}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="card overflow-hidden">
      <header className="flex items-center gap-3 px-4 pt-4 sm:px-5">
        <Avatar user={author} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{author?.name ?? tr("Гость")}</p>
          <p className="text-meta text-muted">{timeAgo(post.createdAt)}</p>
        </div>
      </header>

      <div className="px-4 pb-4 pt-3 sm:px-5">
        <button type="button" onClick={() => onOpen?.(post)} className="block w-full text-left">
          <h3 className="font-display text-xl font-semibold leading-snug tracking-[-0.015em] text-fg hover:text-accent-ink">
            {post.title}
          </h3>
        </button>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted">{post.text}</p>
      </div>

      <button
        type="button"
        onClick={() => onOpen?.(post)}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        aria-label={tr("Открыть публикацию") + ": " + post.title}
      >
        <img
          src={post.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 ease-smooth hover:scale-[1.02]"
          loading="lazy"
        />
      </button>

      <footer className="flex items-center justify-between gap-2 px-2 py-2 sm:px-3">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            icon="heart"
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? tr("Убрать лайк") : tr("Поставить лайк")}
            className={cn(liked && "text-accent-ink hover:text-accent-ink")}
          >
            <span className="tabular-nums">{likes}</span>
          </Button>
          <Button variant="ghost" size="sm" icon="comment" onClick={() => onOpen?.(post)} aria-label={tr("Комментарии")}>
            <span className="tabular-nums">{post.comments.length}</span>
          </Button>
          <IconButton icon="share" label={tr("Поделиться публикацией")} size="sm" onClick={handleShare} />
        </div>
        <IconButton
          icon="bookmark"
          label={saved ? tr("Убрать из сохранённого") : tr("Сохранить публикацию")}
          active={saved}
          onClick={handleSave}
        />
      </footer>

      {place ? (
        <Link
          to={`/guide?place=${place.id}`}
          className="flex items-center gap-2 border-t border-line px-4 py-3 text-sm text-muted transition-colors hover:bg-sunken hover:text-fg sm:px-5"
        >
          <Icon name="location" size={15} className="shrink-0 text-accent-ink" />
          <span className="min-w-0 flex-1 truncate">{place.name}</span>
          <span className="shrink-0 font-medium text-accent-ink">{tr("В гид")}</span>
        </Link>
      ) : null}
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="card overflow-hidden p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-36" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="skeleton mt-4 h-5 w-3/4" />
      <div className="skeleton mt-3 h-3.5 w-full" />
      <div className="skeleton mt-2 h-3.5 w-4/5" />
      <div className="skeleton mt-4 aspect-[16/10] w-full rounded-xl" />
    </div>
  );
}
