import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { isValidEmail } from "@/lib/validation";
import { getSupabaseClient, supabaseConfigured, signInWithGoogle } from "@/lib/supabase";
import { tr } from "@/i18n/runtime";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Field, Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { requestTour } from "@/components/onboarding/Onboarding";
import { track } from "@/lib/analytics";

type AuthMode = "login" | "register";

const demoRoute = [
  { time: "16:30", label: tr("Набережная Иртыша") },
  { time: "18:00", label: tr("Кофе на левом берегу") },
  { time: "19:30", label: tr("Закат у Абзала") },
];

export function AuthPage() {
  const { currentUser, login, register, savedRouteIds, draft, places, routes, events } = useApp();
  const { isLight, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const stateFrom = (location.state as { from?: string } | null)?.from;
  const from = searchParams.get("from") ?? stateFrom ?? "";
  const target =
    from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/auth") ? from : "/";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setError("");
  }, [mode]);

  const finish = (isLogin: boolean) => {
    track(isLogin ? "auth_login" : "auth_register");
    toast({
      title: isLogin ? tr("С возвращением") : tr("Аккаунт создан"),
      description: `${
        isLogin ? tr("Вы вошли в локальный профиль.") : tr("Добро пожаловать в Oskemen Culture.")
      } ${isLogin ? "" : tr("Начнём с короткого обучения.")}`,
    });
    if (!isLogin) {
      // После регистрации сразу открываем раздел «Навигация по сайту» с обучением
      // и закладываем флаг: на главной стартует интерактивный тур по разделам.
      requestTour();
      navigate("/navigation", { replace: true, state: { welcome: true } });
      return;
    }
    navigate(target, { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    if (mode === "register" && name.trim().length < 2) {
      setError(tr("Укажите имя — хотя бы два символа"));
      return;
    }
    if (!email.trim()) {
      setError(tr("Введите почту"));
      return;
    }
    if (!isValidEmail(email)) {
      setError(tr("Проверьте формат почты"));
      return;
    }
    if (password.length < 8 || !/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(password)) {
      setError(tr("Пароль должен содержать только латиницу, цифры и символы, минимум 8 символов"));
      return;
    }

    const result = mode === "login" ? await login(email, password) : await register(name, email, password);
    if (!result.ok) {
      setError(result.error ?? tr("Не удалось выполнить действие"));
      setBusy(false);
      return;
    }

    finish(mode === "login");
  };

  return (
    <div className="min-h-[100svh] bg-canvas">
      <div className="grid min-h-[100svh] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden flex-col overflow-hidden border-r border-line bg-surface lg:flex">
          <div className="relative flex items-center justify-between border-b border-line px-8 py-5 xl:px-10">
            <Logo />
            <div className="flex items-center gap-3">
              <span className="badge">{tr("социальный гид по Өскемену")}</span>
              <LanguageSwitcher />
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-center px-8 py-8 xl:px-10">
            <h1 className="max-w-xl font-display text-[clamp(2.6rem,4.2vw,4.2rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-fg">
              {tr("Город начинается с вас")}
              <span className="text-accent">.</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              {tr("Места, события и маршруты, собранные людьми, которые здесь живут. Войдите, чтобы сохранять любимое и планировать вечера.")}
            </p>

            <div className="relative mt-8 overflow-hidden rounded-2xl border border-line">
              <img
                src="/images/embankment.webp"
                alt={tr("Набережная Өскемена")}
                className="h-56 w-full object-cover xl:h-64"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-scrim/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/75">
                  {tr("вечер в городе")}
                </p>
                <div className="mt-2.5 space-y-2">
                  {demoRoute.map((stop) => (
                    <div key={stop.label} className="flex items-center gap-2.5">
                      <span className="w-11 text-[12px] tabular-nums text-white/60">{stop.time}</span>
                      <span className="h-px flex-1 border-t border-dashed border-white/25" />
                      <span className="text-sm text-white">{stop.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {[
                { value: places.length, label: tr("мест в гиде") },
                { value: routes.length, label: tr("маршрутов") },
                { value: events.length, label: tr("событий в афише") },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface px-4 py-3">
                  <p className="font-display text-xl font-semibold text-fg">{stat.value}</p>
                  <p className="mt-0.5 text-meta text-muted">{stat.label}</p>
                </div>
              ))}
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-meta text-muted">
              <li className="inline-flex items-center gap-1.5">
                <Icon name="shield" size={14} className="text-accent-ink" />
                {tr("локальные данные")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="heart" size={14} className="text-accent-ink" />
                {tr("без рекламы")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="location" size={14} className="text-accent-ink" />
                {tr("сделано в Өскемене")}
              </li>
            </ul>
          </div>
        </section>

        <section className="flex min-h-[100svh] flex-col">
          <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher />
              <IconButton
                icon={isLight ? "moon" : "sun"}
                label={isLight ? tr("Включить тёмную тему") : tr("Включить светлую тему")}
                variant="bordered"
                onClick={toggleTheme}
              />
              <ButtonLink to="/" variant="ghost" size="sm" icon="arrowLeft" aria-label={tr("На главную")} className="px-2.5 sm:px-3">
                <span className="sr-only sm:not-sr-only">{tr("На главную")}</span>
              </ButtonLink>
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-2 sm:px-8 lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[420px]"
            >
              {currentUser ? (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-accent/25 bg-accent-soft p-3.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-accent-ink">
                    <Icon name="check" size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-fg">{tr("Вы уже вошли как")} {currentUser.name}</p>
                    <p className="mt-0.5 text-meta leading-relaxed text-muted">
                      {tr("Можно продолжить или войти в другой локальный аккаунт.")}
                    </p>
                  </div>
                  <Link
                    to={target}
                    className="shrink-0 text-sm font-medium text-accent-ink hover:underline"
                  >
                    {tr("Продолжить")}
                  </Link>
                </div>
              ) : null}

              <h2 className="font-display text-[30px] font-semibold leading-tight tracking-[-0.025em] text-fg sm:text-[36px]">
                {mode === "login" ? tr("С возвращением") : tr("Присоединяйтесь")}
                <span className="text-accent">.</span>
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                {mode === "login"
                  ? tr("Войдите, чтобы вернуться к избранным местам, сохранённым маршрутам и своему профилю.")
                  : tr("Создайте локальный профиль, чтобы собирать маршруты, публиковать находки и сохранять события.")}
              </p>

              <div className="segmented mt-5 w-full" role="group" aria-label={tr("Режим входа")}>
                {(["login", "register"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    aria-pressed={mode === item}
                    className={`segmented-item flex-1 ${mode === item ? "segmented-item-active" : ""}`}
                  >
                    {item === "login" ? tr("Вход") : tr("Регистрация")}
                  </button>
                ))}
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
                {mode === "register" ? (
                  <Field id="auth-name" label={tr("Имя")}>
                    <Input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={tr("Как вас зовут?")}
                      leadingIcon="user"
                      autoComplete="name"
                      maxLength={50}
                    />
                  </Field>
                ) : null}

                <Field id="auth-email" label={tr("Почта")}>
                  <Input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@oskemen.kz"
                    leadingIcon="mail"
                    autoComplete="email"
                    inputMode="email"
                  />
                </Field>

                <Field id="auth-password" label={tr("Пароль")}>
                  <Input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={tr("Не короче 6 символов")}
                    leadingIcon="lock"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    trailing={
                      <IconButton
                        icon={showPassword ? "eyeOff" : "eye"}
                        label={showPassword ? tr("Скрыть пароль") : tr("Показать пароль")}
                        size="sm"
                        onClick={() => setShowPassword((value) => !value)}
                      />
                    }
                  />
                </Field>

                {error ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-3 text-sm leading-relaxed text-danger-ink"
                  >
                    <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                ) : null}

                <Button type="submit" variant="primary" fullWidth iconRight="arrowRight" loading={busy}>
                  {mode === "login" ? tr("Войти") : tr("Создать профиль")}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-meta text-faint">{tr("или")}</span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <button
                type="button"
                onClick={async () => {
                  const result = await signInWithGoogle(target || window.location.origin + "/");
                  if (result?.error) setError(result.error);
                }}
                disabled={!supabaseConfigured}
                className="card flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:border-line-strong hover:bg-sunken disabled:opacity-50"
                title={supabaseConfigured ? tr("Google OAuth включён") : tr("Укажите VITE_SUPABASE_URL, чтобы включить")}
              >
                {/* Фирменный логотип Google (4 цвета) */}
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
                  <path fill="#FFC107" d="M43.6 20.1H24v7.9h11.3C33.7 33.4 29.3 36.5 24 36.5c-6.9 0-12.5-5.6-12.5-12.5S17.1 11.5 24 11.5c3.2 0 6.1 1.2 8.3 3.2l5.7-5.7C34.5 5.6 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11.2 0 19.5-8.1 19.5-20.5 0-1.3-.1-2.6-.4-3.9z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 14.1 19 11.5 24 11.5c3.2 0 6.1 1.2 8.3 3.2l5.7-5.7C34.5 5.6 29.5 3.5 24 3.5 16.3 3.5 9.7 8 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44.5c5.4 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.5 35.4 26.9 36.5 24 36.5c-5.2 0-9.6-3.1-11.2-7.5l-6.6 5.1C9.7 40.3 16.3 44.5 24 44.5z"/>
                  <path fill="#1976D2" d="M43.1 20.1H24v7.9h11.3c-.5 2.9-2 5.3-4.2 7l6.5 5.5c3.7-3.4 5.9-8.6 5.9-14.7 0-2-.3-3.9-.4-5.6z"/>
                </svg>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">{tr("Войти через Google")}</span>
                  <span className="mt-0.5 block text-meta text-muted">
                    {supabaseConfigured
                      ? tr("Работает через Supabase Auth: профиль создастся автоматически.")
                      : tr("Требуется настроить Supabase (см. VITE_SUPABASE_URL).")}
                  </span>
                </span>
              </button>

              {draft || savedRouteIds.length ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-meta text-faint">
                  {draft ? <span>{tr("черновик маршрута сохранён")}</span> : null}
                  {savedRouteIds.length ? (
                    <span>{tr("Сохранённые маршруты")}: {savedRouteIds.length}</span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-sunken px-3.5 py-3">
                <Icon name="shield" size={15} className="mt-0.5 shrink-0 text-muted" />
                <p className="text-meta leading-relaxed text-muted">
                  {tr("Почта, пароль и действия хранятся только в этом браузере и не отправляются в сеть. Это позволяет открыть приложение без дополнительной настройки.")}
                </p>
              </div>

              <Link
                to="/guide"
                className="mt-4 flex items-center justify-center gap-1.5 text-meta text-muted transition-colors hover:text-fg"
              >
                {tr("Сначала посмотреть гид")}
                <Icon name="arrowRight" size={13} />
              </Link>
            </motion.div>
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-line px-5 py-4 text-meta text-faint sm:px-8 lg:px-10">
            <span>{new Date().getFullYear()} · Oskemen Culture</span>
            <span>{tr("сделано в Өскемене")}</span>
          </footer>
        </section>
      </div>
    </div>
  );
}
