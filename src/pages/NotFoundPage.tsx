import { Link } from "react-router-dom";
import { tr } from "@/i18n/runtime";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const suggestions = [
  { to: "/guide", label: tr("Гид по местам"), description: tr("Кафе, парки, музеи и виды города"), icon: "guide" as const },
  { to: "/routes", label: tr("Маршруты"), description: tr("Готовые сценарии прогулок"), icon: "routes" as const },
  { to: "/events", label: tr("Афиша"), description: tr("Что происходит в городе"), icon: "events" as const },
];

export function NotFoundPage() {
  return (
    <div className="page-wrap">
      <section className="mx-auto max-w-2xl text-center">
        <p className="font-display text-[72px] font-semibold leading-none tracking-[-0.04em] text-accent sm:text-[112px]">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-3xl">
          {tr("Такой страницы нет")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          {tr("Возможно, ссылка устарела или в адресе опечатка. Но в городе точно есть куда сходить.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink to="/" variant="primary" icon="home">
            {tr("На главную")}
          </ButtonLink>
          <ButtonLink to="/guide" variant="secondary" icon="guide">
            {tr("Открыть гид")}
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
        {suggestions.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card flex items-start gap-3 p-4 text-left transition-colors hover:border-line-strong hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <Icon name={item.icon} size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">{item.label}</span>
              <span className="mt-0.5 block text-meta leading-relaxed text-muted">{item.description}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
