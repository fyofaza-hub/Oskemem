import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Post, User } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { PageHeader } from "@/components/ui/Bits";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Bits";

type Tab = "posts" | "users" | "settings";

export function AdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentUser,
    isAdmin,
    users,
    posts,
    siteSettings,
    approvePost,
    rejectPost,
    deletePost,
    setUserRole,
    banUser,
    updateSiteSettings,
  } = useApp();

  const [tab, setTab] = useState<Tab>("posts");
  const [query, setQuery] = useState("");
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
        {(["posts", "users", "settings"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setTab(item);
              setQuery("");
            }}
            className={cn(
              "chip",
              tab === item && "chip-active",
            )}
          >
            {item === "posts" ? tr("Публикации") : item === "users" ? tr("Пользователи") : tr("Настройки")}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <div className="mt-6 space-y-3">
          <Input
            leadingIcon="search"
            placeholder={tr("Поиск по публикациям")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {filteredPosts.length ? (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <article key={post.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{post.title}</p>
                      <p className="mt-1 text-meta text-muted">
                        {post.userId} · {post.category} · {new Date(post.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{post.text}</p>
                    </div>
                    <span className={cn("badge", post.approved || post.demo ? "bg-accent-soft text-accent-ink" : "bg-danger-soft text-danger-ink")}>
                      {post.approved || post.demo ? tr("Одобрено") : tr("На проверке")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
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
              ))}
            </div>
          ) : (
            <EmptyState icon="feed" title={tr("Публикаций нет")} description={tr("Новых материалов для модерации нет.")} />
          )}
        </div>
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