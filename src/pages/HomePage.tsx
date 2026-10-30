import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CityEvent, Place, Post } from "@/types";
import { categories } from "@/data/categories";
import { useApp } from "@/context/AppContext";
import { useDelayedReady } from "@/hooks/useDelayedReady";
import { greeting, getFirstName } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/Bits";
import { CategoryDot } from "@/components/ui/Category";
import { Icon } from "@/components/ui/Icon";
import { PlaceCard, PlaceCardSkeleton } from "@/components/places/PlaceCard";
import { PlaceDetail } from "@/components/places/PlaceDetail";
import { PostCard, PostCardSkeleton } from "@/components/feed/PostCard";
import { PostDetailModal } from "@/components/feed/PostDetailModal";
import { RouteCard, RouteCardSkeleton } from "@/components/routes/RouteCard";
import { EventCard, EventCardSkeleton } from "@/components/events/EventCard";
import { EventDetailModal } from "@/components/events/EventDetailModal";

const featuredOrder = ["place-embankment", "place-history-museum", "place-theatre", "place-qurt-wine"];
const routeOrder = ["route-saturday", "route-culture", "route-evening-light"];

/**
 * Фон иммерсивного баннера: закат над Иртышом с набережной (автор Bok, CC BY 4.0,
 * кредит уже в src/data/credits.ts). Самый атмосферный кадр проекта.
 */
const HERO_IMAGE = "/images/embankment.webp";

const planSteps = [
  { icon: "users" as const, label: tr("Компания") },
  { icon: "coins" as const, label: tr("Бюджет") },
  { icon: "heart" as const, label: tr("Интересы") },
  { icon: "routes" as const, label: tr("Маршрут") },
];

export function HomePage() {
  const { routes, events, posts, currentUser, places, getRoute } = useApp();
  const ready = useDelayedReady(350);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CityEvent | null>(null);

  const featured = useMemo(
    () =>
      featuredOrder
        .map((id) => places.find((place) => place.id === id))
        .filter((place): place is Place => Boolean(place)),
    [places],
  );
  const homeRoutes = useMemo(
    () =>
      routeOrder
        .map((id) => getRoute(id))
        .filter((route): route is NonNullable<typeof route> => Boolean(route)),
    [getRoute],
  );
  const homePosts = posts.slice(0, 2);
  const homeEvents = events.slice(0, 4);
  const firstName = currentUser ? getFirstName(currentUser.name) : null;

  return (
    <div className="page-wrap">
      {/* Иммерсивный баннер: установка «I love Oskemen», тёмная растушёвка, контент поверх */}
      <section
        data-reveal
        className="group relative isolate overflow-hidden rounded-3xl border border-line/60 shadow-raised"
      >
        <img
          src={HERO_IMAGE}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-100 object-cover object-center transition-transform duration-700 ease-smooth group-hover:scale-[1.03]"
        />
        {/* Тёмная растушёвка для контраста текста: слева плотнее, к правому краю прозрачнее */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/5" />
        {/* Верх и низ — лёгкое затемнение, чтобы текст держался на любом кадре */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

        <div className="relative z-10 flex min-h-[440px] flex-col justify-center gap-4 px-6 py-14 sm:min-h-[480px] sm:px-10 sm:py-16 lg:min-h-[520px] lg:px-14 lg:py-20">
          <p className="text-meta font-medium uppercase tracking-[0.16em] text-white/70">
            {greeting()}
            {firstName ? ", " + firstName : ""}
          </p>
          <h1 className="max-w-xl font-display text-[44px] font-semibold leading-[1.04] tracking-[-0.03em] text-white drop-shadow-sm sm:text-[56px] lg:text-[68px]">
            {tr("Открой свой город")}
          </h1>
          <p className="max-w-md text-[17px] leading-relaxed text-white/85">
            {tr("Места, события и маршруты Өскемена — от людей, которые здесь живут.")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3" data-tour="plan-cta">
            <ButtonLink to="/plan" variant="primary" size="lg" icon="plan" className="px-6">
              {tr("Куда сходить?")}
            </ButtonLink>
            <ButtonLink
              to="/guide"
              variant="secondary"
              size="lg"
              icon="guide"
              className="border-white/25 bg-white/10 text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/20"
            >
              {tr("Смотреть места")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <nav aria-label={tr("Категории")} className="no-scrollbar -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-12 sm:flex-wrap sm:px-0">
        {categories.map((category) => (
          <Link key={category.id} to={`/guide?category=${category.id}`} className="chip">
            <CategoryDot category={category.id} />
            {category.label}
          </Link>
        ))}
      </nav>

      <section data-reveal className="mt-14 sm:mt-16">
        <SectionHeading
          title={tr("С чего начать")}
          description={tr("Места, которые стоит увидеть в первую очередь.")}
          action={{ label: tr("Все места"), to: "/guide" }}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ready
            ? featured.map((place) => <PlaceCard key={place.id} place={place} onOpen={setSelectedPlace} />)
            : Array.from({ length: 4 }).map((_, index) => <PlaceCardSkeleton key={index} />)}
        </div>
      </section>

      <section data-reveal className="mt-14 flex flex-col gap-6 rounded-3xl border border-line bg-surface p-6 shadow-card sm:mt-16 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-xl">
          <h2 className="section-title">{tr("Не знаете, куда пойти?")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {tr("Ответьте на несколько вопросов о компании, бюджете и настроении — подберём места и соберём маршрут.")}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {planSteps.map((step) => (
              <li key={step.label} className="badge gap-2">
                <Icon name={step.icon} size={14} />
                {step.label}
              </li>
            ))}
          </ul>
        </div>
        <ButtonLink to="/plan" variant="primary" size="lg" iconRight="arrowRight" className="shrink-0">
          {tr("Подобрать вечер")}
        </ButtonLink>
      </section>

      <section data-reveal className="mt-14 sm:mt-16">
        <SectionHeading
          title={tr("Готовые маршруты")}
          description={tr("Время и расстояние ориентировочные.")}
          action={{ label: tr("Все маршруты"), to: "/routes" }}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ready
            ? homeRoutes.map((route) => <RouteCard key={route.id} route={route} />)
            : Array.from({ length: 3 }).map((_, index) => <RouteCardSkeleton key={index} />)}
        </div>
      </section>

      <section data-reveal className="mt-14 sm:mt-16">
        <SectionHeading
          title={tr("Ближайшие события")}
          description={tr("Даты считаются от сегодняшнего дня. Программу уточняйте у организатора.")}
          action={{ label: tr("Вся афиша"), to: "/events" }}
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ready
            ? homeEvents.map((event) => <EventCard key={event.id} event={event} onOpen={setSelectedEvent} variant="row" />)
            : Array.from({ length: 4 }).map((_, index) => <EventCardSkeleton key={index} />)}
        </div>
      </section>

      <section data-reveal className="mt-14 grid gap-8 sm:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
        <div className="min-w-0">
          <SectionHeading
            title={tr("Из ленты")}
            description={tr("Личные находки жителей: свет, кофе, маршруты.")}
            action={{ label: tr("Вся лента"), to: "/feed" }}
          />
          <div className="mt-6 space-y-3">
            {ready
              ? homePosts.map((post) => <PostCard key={post.id} post={post} onOpen={setSelectedPost} variant="compact" />)
              : Array.from({ length: 2 }).map((_, index) => <PostCardSkeleton key={index} />)}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col justify-between gap-6 rounded-3xl bg-sunken p-6 sm:p-7">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent-ink">
              <Icon name="plus" size={20} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-fg">
              {tr("Знаете место, которым хочется поделиться?")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {tr("Одно фото, пара строк и точка на карте — и чей-то вечер станет лучше.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/feed?create=1" variant="primary" icon="plus">
              {tr("Поделиться открытием")}
            </ButtonLink>
            <ButtonLink to="/map?add=1" variant="secondary" icon="location">
              {tr("Добавить место")}
            </ButtonLink>
          </div>
        </aside>
      </section>

      <PlaceDetail place={selectedPlace} onClose={() => setSelectedPlace(null)} onSelectPlace={setSelectedPlace} />
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

