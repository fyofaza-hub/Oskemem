import { useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { tr } from "@/i18n/runtime";
import { PageHeader } from "@/components/ui/Bits";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";

interface Step {
  title: string;
  description: string;
  to: string;
  label: string;
  icon: IconName;
}

/** Три понятных шага вместо подробной инструкции. */
const steps: Step[] = [
  {
    title: tr("Смотрите места"),
    description: tr("Музеи, парки и кофейни Өскемена — в гиде. Есть фильтры: категория, район, бюджет."),
    to: "/guide",
    label: tr("Открыть гид"),
    icon: "guide",
  },
  {
    title: tr("Сохраняйте сердечком"),
    description: tr("Нажмите ♥ у места, события или маршрута — потом всё найдёте в «Избранном» в профиле."),
    to: "/profile?tab=favorites",
    label: tr("Открыть избранное"),
    icon: "heart",
  },
  {
    title: tr("Соберите вечер"),
    description: tr("В «Куда сходить» — готовые идеи вечера, а из мест в гиде можно собрать свой маршрут."),
    to: "/plan",
    label: tr("Куда сходить"),
    icon: "plan",
  },
];

/** Раздел «Навигация по сайту»: короткое обучение в три шага. */
export function NavigationPage() {
  const { currentUser } = useApp();
  const location = useLocation();
  const fromAuth = (location.state as { welcome?: boolean } | null)?.welcome === true;

  return (
    <div className="page-wrap">
      {fromAuth ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent-soft p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent-ink">
            <Icon name="check" size={18} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-fg">
              {currentUser ? tr("Добро пожаловать, {name}!", { name: currentUser.name }) : tr("Добро пожаловать в Oskemen Culture.")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {tr("Профиль создан. Три шага ниже — и вы знаете всё, что нужно.")}
            </p>
          </div>
        </div>
      ) : null}

      <PageHeader
        title={tr("Навигация по сайту")}
        description={tr("Короткое обучение: три шага от первого входа до первого маршрута.")}
        actions={
          <ButtonLink to="/guide" variant="primary" size="md" icon="guide">
            {tr("Начать с гида")}
          </ButtonLink>
        }
      />

      <ol className="mt-6 grid gap-4 lg:grid-cols-3" aria-label={tr("Три шага")}>
        {steps.map((step, index) => (
          <li key={step.to}>
            <div className="card card-interactive flex h-full flex-col p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                  <Icon name={step.icon} size={19} />
                </span>
                <span className="font-display text-meta font-semibold tabular-nums text-muted">
                  {tr("Шаг {n}", { n: index + 1 })}
                </span>
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-fg">{step.title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{step.description}</p>
              <div className="mt-4">
                <ButtonLink to={step.to} variant="secondary" size="sm" iconRight="arrowRight">
                  {step.label}
                </ButtonLink>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Icon name="mic" size={17} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-muted">
            {tr("Не хочется искать руками? Нажмите на микрофон в шапке и скажите, чего хочется: «кофе на двоих». Место подберётся под запрос и ваши интересы.")}
          </p>
        </div>
        <div className="hidden h-8 w-px shrink-0 bg-line sm:block" />
        <div className="flex items-start gap-3">
          <Icon name="lock" size={17} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-muted">
            {tr("Все данные остаются в этом браузере.")}
          </p>
        </div>
      </div>
    </div>
  );
}
