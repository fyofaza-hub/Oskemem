import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Post } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn, shareLink, timeAgo } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Field";

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
}

export function PostDetailModal({ post, onClose }: PostDetailModalProps) {
  const { currentUser, getUser, toggleLike, toggleSavePost, savedPostIds, addComment, placeMap } = useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const [comment, setComment] = useState("");

  useEffect(() => {
    setComment("");
  }, [post?.id]);

  if (!post) return null;

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
    if (result === "copied") toast({ title: tr("Ссылка скопирована") });
    if (result === "failed") toast({ title: tr("Не удалось скопировать ссылку"), variant: "error" });
  };

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) return;
    requireAuth(() => {
      addComment(post.id, comment);
      setComment("");
      toast({ title: tr("Комментарий добавлен") });
    }, tr("Войдите, чтобы комментировать"));
  };

  return (
    <Modal open={!!post} onClose={onClose} size="lg">
      <div className="relative aspect-[16/9] max-h-[320px] w-full overflow-hidden bg-sunken">
        <img src={post.image} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="space-y-6 p-5 sm:p-7">
        <header className="flex items-center gap-3">
          <Avatar user={author} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{author?.name ?? tr("Гость")}</p>
            <p className="text-meta text-muted">
              {author ? `@${author.username} · ` : ""}
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </header>

        <div>
          <h2 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[28px]">
            {post.title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.7] text-fg/90">{post.text}</p>
        </div>

        {place ? (
          <Link
            to={`/guide?place=${place.id}`}
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-line-strong"
          >
            <img src={place.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">{place.name}</span>
              <span className="block truncate text-meta text-muted">{place.address}</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-accent-ink">{tr("Открыть место")}</span>
          </Link>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-y border-line py-3">
          <Button
            variant="secondary"
            size="sm"
            icon="heart"
            onClick={handleLike}
            aria-pressed={liked}
            className={cn(liked && "border-accent/30 bg-accent-soft text-accent-ink")}
          >
            {likes}
          </Button>
          <Button variant="secondary" size="sm" icon="share" onClick={handleShare}>
            {tr("Поделиться")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon="bookmark"
            onClick={handleSave}
            aria-pressed={saved}
            className={cn("ml-auto", saved && "border-accent/30 bg-accent-soft text-accent-ink")}
          >
            {saved ? tr("Сохранено") : tr("Сохранить")}
          </Button>
        </div>

        <section className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-fg">
            {tr("Комментарии")} <span className="tabular-nums text-muted">{post.comments.length}</span>
          </h3>

          {post.comments.length ? (
            <ul className="space-y-4">
              {post.comments.map((item) => {
                const commentAuthor = getUser(item.userId);
                return (
                  <li key={item.id} className="flex gap-3">
                    <Avatar user={commentAuthor} size="sm" />
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-sunken px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="text-sm font-semibold text-fg">{commentAuthor?.name ?? tr("Гость")}</span>
                        <span className="text-meta text-muted">{timeAgo(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-fg/90">{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl bg-sunken px-4 py-5 text-center text-sm text-muted">
              {tr("Начните разговор — комментарий появится сразу.")}
            </p>
          )}

          {currentUser ? (
            <form onSubmit={submitComment} className="flex items-center gap-2">
              <Avatar user={currentUser} size="sm" />
              <Input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={300}
                placeholder={tr("Написать комментарий…")}
                aria-label={tr("Написать комментарий…")}
                wrapperClassName="flex-1"
                className="h-10 rounded-full"
                trailing={
                  <IconButton
                    type="submit"
                    icon="send"
                    label={tr("Отправить комментарий")}
                    size="sm"
                    variant="bordered"
                    disabled={!comment.trim()}
                    className="mr-0.5 h-8 w-8 border-0 bg-accent text-white hover:bg-accent-hover hover:text-white disabled:bg-sunken disabled:text-faint"
                  />
                }
              />
            </form>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">{tr("Войдите, чтобы комментировать")}</p>
              <Link to="/auth" onClick={onClose} className="btn btn-secondary btn-sm">
                <Icon name="user" size={15} />
                {tr("Войти")}
              </Link>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
