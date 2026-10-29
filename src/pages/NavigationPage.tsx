import { useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { tr } from "@/i18n/runtime";
import { PageHeader } from "@/components/ui/Bits";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";

/** Разделы сайта: что это, зачем и что там можно сделать — простыми словами. */
interface Section {
  to: string;
  title: string;
  icon: IconName;
  summary: string;
  tips: string[];
}

const sections: Section[] = [
  {
    to: "/",
    title: tr("Главная"),
    icon: "home",
    summary: tr("Витрина сайта: чем живёт город, что посмотреть в первую очередь."),
    tips: [
      tr("Свежие подборки мест и событий — просто листайте вниз."),
      tr("Нажмите на любую картинку — откроется место с описанием и адресом."),
    ],
  },
  {
    to: "/guide",
    title: tr("Гид"),
    icon: "guide",
    summary: tr("Каталог интересных мест Өскемена: музеи, парки, кофейни, спорт — как справочник, только живой."),
    tips: [
      tr("Кнопки сверху сужают список: нажмите «Природа» — останутся только парки и скверы."),
      tr("У каждого места есть адрес, примерный ценник (₸) и фото."),
      tr("Понравилось место — нажмите сердечко, чтобы не потерять."),
    ],
  },
  {
    to: "/map",
    title: tr("Карта"),
    icon: "map",
    summary: tr("Все места сразу на карте города. Отлично, если хотите понять, что рядом с домом."),
    tips: [
      tr("Нажмите на кружок на карте — откроется карточка места с описанием."),
      tr("Список мест слева — удобная подсказка: можно листать его вместо карты."),
      tr("Кнопка «Добавить место» — для вашей находки, которой на карте ещё нет."),
    ],
  },
  {
    to: "/routes",
    title: tr("Маршруты"),
    icon: "routes",
    summary: tr("Готовые прогулки по городу: что посмотреть, за сколько времени и в каком порядке."),
    tips: [
      tr("Хочется такую же прогулку, но по-своему? Скопируйте маршрут и спокойно меняйте точки."),
      tr("Маршрут можно сохранить в избранное и вернуться к нему в день прогулки."),
    ],
  },
  {
    to: "/events",
    title: tr("События"),
    icon: "events",
    summary: tr("Афиша города на ближайшие дни: выставки, вечера, встречи."),
    tips: [
      tr("Выбирайте день — покажем, что происходит именно тогда."),
      tr("Бесплатные события легко найти по значку ₸ возле них."),
    ],
  },
  {
    to: "/feed",
    title: tr("Лента"),
    icon: "feed",
    summary: tr("Мини-соцсеть города: люди рассказывают о местах и делятся находками."),
    tips: [
      tr("Поставьте лайк публикации — автору приятно, а вам легче вернуться к ней потом."),
      tr("Свой пост можно написать через кнопку создания публикации вверху ленты."),
    ],
  },
  {
    to: "/plan",
    title: tr("Куда сходить"),
    icon: "plan",
    summary: tr("Свободен вечер, но не знаете, чем занять? Здесь собраны готовые идеи."),
    tips: [
      tr("Выбирайте настроение: кофе, прогулка, музей — сайт предложит план с временем."),
      tr("Идею можно сохранить или пересобрать под себя."),
    ],
  },
];

/** Пять простых шагов для человека, который открыл сайт впервые. */
interface Step {
  title: string;
  description: string;
  to: string;
  label: string;
  icon: IconName;
}

const steps: Step[] = [
  {
    title: tr("Войдите в аккаунт"),
    description: tr(
      "Нажмите «Войти» наверху и зарегистрируйтесь по почте и паролю. Это займёт минуту и нужно, чтобы сайт запоминал ваши находки.",
    ),
    to: "/auth",
    label: tr("Войти"),
    icon: "user",
  },
  {
    title: tr("Полистайте гид"),
    description: tr(
      "Посмотрите каталог мест. Нажимайте кнопки со словами «Природа», «Кофе» и другие — список станет короче и понятнее.",
    ),
    to: "/guide",
    label: tr("Открыть гид"),
    icon: "guide",
  },
  {
    title: tr("Сохраняйте сердечком"),
    description: tr(
      "Понравилось место, событие или маршрут — нажмите сердечко рядом с ними. Потом откройте «Избранное» в профиле: там всё, что вы отметили.",
    ),
    to: "/profile?tab=favorites",
    label: tr("Моё избранное"),
    icon: "heart",
  },
  {
    title: tr("Соберите вечер"),
    description: tr(
      "В разделе «Куда сходить» или на карте соберите свой маршрут из нескольких мест. Можно взять готовый маршрут и поменять в нём пару точек.",
    ),
    to: "/plan",
    label: tr("Спланировать"),
    icon: "plan",
  },
  {
    title: tr("Расскажите о находке"),
    description: tr(
      "Нашли классное место, которого на сайте нет? Нажмите «Добавить место» на карте — оно появится в гиде вместе с вашим фото.",
    ),
    to: "/map",
    label: tr("Добавить место"),
    icon: "plus",
  },
];

/** Частые вопросы — коротко и по делу. */
interface Faq {
  question: string;
  answer: string;
}

const faq: Faq[] = [
  {
    question: tr("Где найти всё, что я сохранил?"),
    answer: tr(
      "Вверху справа — ваш аватар (кружок с буквами). Нажмите на него и выберите «Профиль». Там будет вкладка «Избранное»: все сердечки собраны в одном месте.",
    ),
  },
  {
    question: tr("Я вышел из аккаунта, а места пропали. Куда они делись?"),
    answer: tr("Спокойно: они на месте. Войдите под той же почтой и паролем — избранное, маршруты и черновики вернутся."),
  },
  {
    question: tr("Как быстро найти конкретное место?"),
    answer: tr(
      "Наверху есть строка поиска с лупой. Нажмите на неё и начните печатать: «музей» или «кофе». Если удобно работать с клавиатурой — просто нажмите Ctrl+K, поиск откроется сам.",
    ),
  },
  {
    question: tr("Говорить удобнее, чем печатать. Есть кнопка?"),
    answer: tr(
      "Да, рядом с поиском — микрофон. Нажмите и скажите, чего хочется: «кофе на двоих» или «прогулка рядом».",
    ),
  },
  {
    question: tr("Что значат знаки ₸ возле места?"),
    answer: tr(
      "Это примерно денег на вечер: ₸ — кофе или перекус, ₸₸ — ужин или билет, ₸₸₸ — особый дорогой вечер. Точные цены лучше уточнить у самого места: мы не придумываем их за них.",
    ),
  },
  {
    question: tr("Кто-нибудь ещё видит мои находки?"),
    answer: tr("Нет. Всё, что вы сохраняете, остаётся только в вашем браузере: избранное и черновики никуда не отправляются."),
  },
  {
    question: tr("Сайт вдруг затормозил или что-то отображается странно. Что делать?"),
    answer: tr(
      "Обновите страницу: на компьютере клавиша F5, на телефоне потяните страницу вниз или нажмите круглую стрелку в браузере. Это решает большинство мелких заминок.",
    ),
  },
  {
    question: tr("Как сменить тему или язык сайта?"),
    answer: tr(
      "Наверху: солнышко и луна переключают светлую и тёмную тему, а кнопка с глобусом меняет язык — русский, казахский или английский.",
    ),
  },
];

/** Один раскрытый вопрос. */
function FaqItem({ question, answer }: Faq) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left text-sm font-medium text-fg"
      >
        <Icon name="comment" size={16} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1">{question}</span>
        <Icon name="chevronDown" size={16} className={cn("shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <p className="mt-3 pl-7 text-sm leading-relaxed text-muted">{answer}</p>
      ) : null}
    </div>
  );
}

/** Раздел «Навигация по сайту»: подробный и простой учебник по сайту. */
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
              {tr("Профиль создан. Прочитайте короткий разбор — и вы уже всё умеете.")}
            </p>
          </div>
        </div>
      ) : null}

      <PageHeader
        title={tr("Навигация по сайту")}
        description={tr("Объяснение каждой кнопки и раздела — так, чтобы было понятно и школьнику, и бабушке.")}
        actions={
          <ButtonLink to="/guide" variant="primary" size="md" icon="guide">
            {tr("Начать с гида")}
          </ButtonLink>
        }
      />

      {/* Что это за сайт — коротко и человеческим языком */}
      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-fg">
          {tr("О чём вообще этот сайт?")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-[15px]">
          {tr(
            "Oskemen Culture — справочник по Өскемену для тех, кто хочет интересно провести вечер или выходной: места, события и маршруты, собранные людьми, которые здесь живут. Задача простая: не бегать по разным спискам, а быстро найти подходящее место, сохранить его и отправиться туда.",
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge">{tr("180+ мест города")}</span>
          <span className="badge">{tr("афиша событий")}</span>
          <span className="badge">{tr("готовые маршруты")}</span>
        </div>
      </section>

      {/* Шаги первого знакомства */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-fg">
          {tr("Открываете первый раз? Пять простых шагов")}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {tr("Нет обязательного порядка: каждый шаг заканчивается одной понятной кнопкой.")}
        </p>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={tr("Шаги знакомства с сайтом")}>
          {steps.map((step, index) => (
            <li key={step.to + step.title}>
              <div className="card card-interactive flex h-full flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                    <Icon name={step.icon} size={19} />
                  </span>
                  <span className="font-display text-meta font-semibold tabular-nums text-muted">
                    {tr("Шаг {n}", { n: index + 1 })}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-fg">{step.title}</h3>
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
      </section>

      {/* Разделы сайта подробно */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-fg">
          {tr("Все разделы — что в них и зачем")}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {tr("Каждый раздел — как комната в доме: в одной ищем место, в другой собираем маршрут, в третьей смотрим, что происходит в городе.")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <article key={section.to} className="card flex h-full flex-col p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                  <Icon name={section.icon} size={20} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold text-fg">{section.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-fg">{section.summary}</p>
              <ul className="mt-3 flex-1 space-y-2">
                {section.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                    <Icon name="check" size={14} className="mt-1 shrink-0 text-accent" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <ButtonLink to={section.to} variant="secondary" size="sm" iconRight="arrowRight">
                  {tr("Открыть раздел")}
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Удобства в шапке, которые легко не заметить */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-fg">
          {tr("Полезные мелочи в шапке сайта")}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: "search" as IconName,
              title: tr("Поиск — строка с лупой наверху"),
              text: tr("Печатаете «кофе» или «музей» — сайт сразу показывает подходящие места и события. Быстрее всего открыть поиск клавишами Ctrl+K."),
            },
            {
              icon: "mic" as IconName,
              title: tr("Голосовой поиск — микрофон"),
              text: tr("Не хочется печатать? Нажмите на микрофон и просто скажите, чего хочется, — например, «прогулка по набережной»."),
            },
            {
              icon: "heart" as IconName,
              title: tr("Сердечко = «запомнить»"),
              text: tr("Один клик — и место, событие или маршрут попадает в «Избранное» в вашем профиле. Ничего не теряется."),
            },
            {
              icon: "sun" as IconName,
              title: tr("Тема и язык"),
              text: tr("Солнышко/луна переключают светлую и тёмную тему. Кнопка с глобусом меняет язык сайта."),
            },
            {
              icon: "user" as IconName,
              title: tr("Ваш аватар наверху справа"),
              text: tr("Профиль, избранное и выход из аккаунта живут в этом меню. Вы случайно вышли? Вернитесь по той же почте и паролю."),
            },
            {
              icon: "clipboard" as IconName,
              title: tr("Полоска сборки маршрута внизу"),
              text: tr("Когда добавляете места в свой маршрут, внизу появляется полоска с ними. Из неё маршрут собирается одной кнопкой."),
            },
          ].map((item) => (
            <div key={item.title} className="card flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                <Icon name={item.icon} size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-fg">
          {tr("Частые вопросы")}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {tr("Самые живые вопросы от пользователей. Найдёте здесь — не придётся никуда писать.")}
        </p>
        <div className="mt-4 space-y-3">
          {faq.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      {/* Если совсем запутались */}
      <div className="card mt-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Icon name="shield" size={17} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-muted">
            {tr("Запутались и не хочется разбираться дальше? Нажмите «Главная» в меню слева и начните сначала — сайт не сложнее, чем интернет-магазин.")}
          </p>
        </div>
        <div className="hidden h-8 w-px shrink-0 bg-line sm:block" />
        <ButtonLink to="/" variant="secondary" size="sm" icon="home">
          {tr("На главную")}
        </ButtonLink>
      </div>
    </div>
  );
}
