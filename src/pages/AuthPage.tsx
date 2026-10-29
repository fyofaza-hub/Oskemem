import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  MapPin,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { demoAccount } from "@/data/users";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { Logo } from "@/components/ui/Logo";
import { tr } from "@/i18n/runtime";

type AuthMode = "login" | "register";

const demoRoute = [
  { time: "16:30", label: tr("Набережная Иртыша"), accent: true },
  { time: "18:00", label: tr("Кофе на левом берегу"), accent: false },
  { time: "19:30", label: tr("Закат у Абзала"), accent: false },
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

  const finish = (modeLabel: string) => {
    toast({
      title: modeLabel === tr("Вход") ? tr("С возвращением") : tr("Аккаунт создан"),
      description: `${
        modeLabel === tr("Вход") ? tr("Вы вошли в локальный профиль.") : tr("Добро пожаловать в Oskemen Culture.")
      } Все данные остаются в этом браузере.`,
    });
    navigate(target, { replace: true });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (mode === "register") {
      if (name.trim().length < 2) {
        setError(tr("Укажите имя — хотя бы два символа"));
        return;
      }
    }

    if (!email.trim()) {
      setError(tr("Введите почту"));
      return;
    }
    if (password.length < 6) {
      setError(tr("Пароль должен быть не короче 6 символов"));
      return;
    }

    const result =
      mode === "login"
        ? login(email, password)
        : register(name, email, password);

    if (!result.ok) {
      setError(result.error ?? tr("Не удалось выполнить действие"));
      return;
    }

    finish(mode === "login" ? tr("Вход") : tr("Регистрация"));
  };

  const handleDemo = () => {
    setError("");
    setBusy(true);
    const result = login(demoAccount.email, demoAccount.password);
    setBusy(false);
    if (!result.ok) {
      setError(
        result.error ??
          tr("Профиль недоступен. Попробуйте сбросить данные в настройках профиля."),
      );
      return;
    }
    toast({
      title: tr("Вы вошли"),
      description: tr("Профиль Алины открыт. Все изменения сохранятся только в этом браузере."),
    });
    navigate(target, { replace: true });
  };

  const fillDemoCredentials = () => {
    setMode("login");
    setEmail(demoAccount.email);
    setPassword(demoAccount.password);
    setError("");
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-app">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_600px_at_82%_-5%,rgba(77,141,255,0.11),transparent_60%)]" />
      <div className="relative grid min-h-[100svh] lg:grid-cols-[1.06fr_0.94fr]">
        {/* Editorial side */}
        <section className="on-media relative hidden overflow-hidden border-r border-white/8 lg:flex lg:flex-col">
          <img
            src="/images/panorama.webp"
            alt={tr("Панорама Өскемена")}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b10]/55 via-[#080b10]/35 to-[#0b0e13]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b10] via-transparent to-[#080b10]/40" />

          <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
            <Logo />

            <div className="mt-auto max-w-[590px] pb-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent">
                  01
                </span>
                <span className="h-px w-9 bg-white/25" />
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/55">
                  {tr(" социальный гид по Өскемену ")}</span>
              </div>

              <h1 className="display-title text-[clamp(3rem,5.5vw,5.2rem)] uppercase text-primary">
                {tr(" Город ")}<br />
                <span className="text-outline">{tr("начинается")}</span>
                <br />
                {tr(" с вас")}<span className="text-accent">.</span>
              </h1>

              <p className="mt-5 max-w-md text-[13px] leading-[1.8] text-white/55">
                {tr(" Места, события и маршруты, собранные людьми, которые здесь живут. Войдите, чтобы сохранять любимое и планировать вечера. ")}</p>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/12 backdrop-blur-md">
                {[
                  { value: places.length, label: tr("мест в гиде") },
                  { value: routes.length, label: tr("маршрутов") },
                  { value: events.length, label: tr("событий в афише") },
                ].map((stat) => (
                  <div key={stat.label} className="bg-black/[0.42] px-4 py-3.5">
                    <p className="font-display text-[23px] font-light text-primary">
                      {stat.value}
                    </p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-white/35">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 max-w-md rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/40">
                    {tr(" вечер в городе ")}</p>
                  <MapPin size={10} className="text-accent" />
                </div>
                <div className="mt-3 space-y-2.5">
                  {demoRoute.map((stop) => (
                    <div key={stop.label} className="flex items-center gap-2.5">
                      <span className="font-mono text-[8.5px] text-white/35">{stop.time}</span>
                      <span className="h-px flex-1 border-t border-dashed border-white/15" />
                      <span className="text-[10px] text-white/65">{stop.label}</span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          stop.accent ? "bg-accent" : "bg-white/25"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex items-center gap-5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/28">
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-300/70" />
                  {tr(" локальные данные ")}</span>
                <span>{tr("без рекламы")}</span>
                <span>{tr("сделано в Өскемене")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Form side */}
        <section className="relative flex min-h-[100svh] flex-col">
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="icon-btn h-8 w-8"
                aria-label={isLight ? tr("Включить тёмную тему") : tr("Включить светлую тему")}
                title={isLight ? tr("Тёмная тема") : tr("Светлая тема")}
              >
                {isLight ? <Moon size={14} /> : <Sun size={14} />}
              </button>
              <Link
                to="/"
                className="group flex items-center gap-1.5 text-[10px] text-white/35 transition-colors hover:text-white/75"
              >
                <ArrowLeft
                  size={12}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
                {tr(" На главную ")}</Link>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-4 sm:px-8 lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[430px]"
            >
              {currentUser ? (
                <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/[0.06] p-3.5">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Check size={11} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-white/70">
                        {tr(" Вы уже вошли как ")}{currentUser.name}
                      </p>
                      <p className="mt-0.5 text-[9.5px] leading-relaxed text-white/35">
                        {tr(" Можно продолжить или войти в другой локальный аккаунт. ")}</p>
                    </div>
                    <Link
                      to={target}
                      className="shrink-0 text-[10px] font-medium text-accent hover:opacity-75"
                    >
                      {tr(" Продолжить → ")}</Link>
                  </div>
                </div>
              ) : null}

              <p className="eyebrow">{mode === "login" ? tr("вход в пространство") : tr("новый профиль")}</p>
              <h2 className="mt-3 font-display text-[34px] font-light leading-[1.03] tracking-[-0.045em] text-primary sm:text-[40px]">
                {mode === "login" ? (
                  <>
                    {tr(" С возвращением ")}<span className="text-accent">.</span>
                  </>
                ) : (
                  <>
                    {tr(" Присоединяйтесь ")}<span className="text-accent">.</span>
                  </>
                )}
              </h2>
              <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-white/42">
                {mode === "login"
                  ? tr("Войдите, чтобы вернуться к избранным местам, сохранённым маршрутам и своему профилю.")
                  : tr("Создайте локальный профиль, чтобы собирать маршруты, публиковать находки и сохранять события.")}
              </p>

              <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.025] p-1">
                {(["login", "register"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`h-8 rounded-full px-4 text-[11px] transition-all duration-200 ${
                      mode === item
                        ? "bg-primary text-app shadow-[0_5px_18px_rgba(0,0,0,0.25)]"
                        : "text-white/40 hover:text-white/75"
                    }`}
                  >
                    {item === "login" ? tr("Вход") : tr("Регистрация")}
                  </button>
                ))}
              </div>

              <form className="mt-5 space-y-3.5" onSubmit={handleSubmit} noValidate>
                {mode === "register" ? (
                  <div>
                    <label className="field-label" htmlFor="auth-name">
                      {tr(" Имя ")}</label>
                    <div className="relative">
                      <UserRound
                        size={15}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
                      />
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="field pl-10"
                        placeholder={tr("Как вас зовут?")}
                        autoComplete="name"
                        maxLength={50}
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="field-label" htmlFor="auth-email">
                    {tr(" Почта ")}</label>
                  <div className="relative">
                    <AtSign
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
                    />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="field pl-10"
                      placeholder="you@oskemen.kz"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="auth-password">
                    {tr(" Пароль ")}</label>
                  <div className="relative">
                    <LockKeyhole
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
                    />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="field px-10"
                      placeholder={tr("Не короче 6 символов")}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/5 hover:text-white/70"
                      aria-label={showPassword ? tr("Скрыть пароль") : tr("Показать пароль")}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/20 bg-red-500/[0.07] px-3.5 py-2.5 text-[11px] leading-relaxed text-red-200/85"
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary btn-md w-full gap-2"
                >
                  {mode === "login" ? tr("Войти") : tr("Создать профиль")}
                  <ArrowRight size={14} />
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/8" />
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">
                  {tr(" или ")}</span>
                <span className="h-px flex-1 bg-white/8" />
              </div>

              <button
                type="button"
                onClick={handleDemo}
                disabled={busy}
                className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left transition-all duration-300 hover:border-accent/30 hover:bg-accent/[0.06] disabled:opacity-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Sparkles size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium text-primary">
                    {tr(" Войти в готовый профиль ")}</span>
                  <span className="mt-0.5 block text-[10px] text-white/35">
                    {tr(" Профиль Алины · всё готово к просмотру ")}</span>
                </span>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </button>

              <button
                type="button"
                onClick={fillDemoCredentials}
                className="mt-2.5 w-full text-center font-mono text-[8.5px] uppercase tracking-[0.1em] text-white/25 transition-colors hover:text-white/50"
              >
                {tr(" Быстрый вход в профиль Алины · подставить данные ")}</button>

              {draft || savedRouteIds.length ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[9px] text-white/28">
                  {draft ? <span>{tr("черновик маршрута сохранён")}</span> : null}
                  {savedRouteIds.length ? (
                    <span>{savedRouteIds.length} {tr(" сохранённых маршрутов ждут")}</span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-7 flex items-start gap-2 rounded-xl border border-white/7 bg-white/[0.018] px-3.5 py-3">
                <ShieldCheck size={13} className="mt-0.5 shrink-0 text-white/25" />
                <p className="text-[9.5px] leading-relaxed text-white/30">
                  {tr(" Почта, пароль и действия хранятся только в этом браузере и не отправляются в сеть. Это позволяет открыть приложение без дополнительной настройки. ")}</p>
              </div>
            </motion.div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/8 px-5 py-4 text-[9px] text-white/25 sm:px-8 lg:px-10">
            <span className="font-mono uppercase tracking-[0.12em]">
              {new Date().getFullYear()} · Oskemen Culture
            </span>
            <Link to="/guide" className="transition-colors hover:text-white/55">
              {tr(" Сначала посмотреть гид → ")}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
