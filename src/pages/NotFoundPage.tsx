import { Link } from "react-router-dom";
import { ArrowLeft, Compass, MapPin, Route as RouteIcon } from "lucide-react";
import { tr } from "@/i18n/runtime";

export function NotFoundPage() {
  return (
    <div className="page-wrap">
      <section className="relative overflow-hidden rounded-[32px] border border-white/9 bg-surface px-6 py-20 text-center sm:px-10 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_360px_at_50%_0%,rgba(77,141,255,0.12),transparent_65%)]" />
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 text-white/[0.055] sm:block"
          viewBox="0 0 620 420"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 330C120 300 90 160 220 140c130-20 120 130 240 80 70-29 80-120 140-170"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="4 10"
          />
          <circle cx="20" cy="330" r="4" fill="currentColor" />
          <circle cx="220" cy="140" r="4" fill="currentColor" />
          <circle cx="460" cy="220" r="4" fill="currentColor" />
          <circle cx="600" cy="50" r="4" fill="#4D8DFF" />
        </svg>

        <div className="relative">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent">
            {tr(" ошибка 404 · этой точки нет на карте ")}</p>
          <h1 className="display-title mx-auto mt-6 max-w-4xl text-[clamp(5.5rem,18vw,12rem)] uppercase leading-[0.8]">
            <span className="text-outline">404</span>
          </h1>
          <h2 className="mx-auto mt-6 max-w-lg font-display text-[clamp(1.8rem,4vw,2.8rem)] font-light leading-[1.05] tracking-[-0.045em] text-primary">
            {tr(" Похоже, мы свернули не туда ")}<span className="text-accent">.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-relaxed text-white/42">
            {tr(" Страница могла переехать, а ссылка — потеряться. Вернитесь на главную или продолжите путь по городу с гида или карты. ")}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link to="/" className="btn btn-primary btn-md gap-2">
              <ArrowLeft size={14} /> {tr(" На главную ")}</Link>
            <Link to="/guide" className="btn btn-secondary btn-md gap-2">
              <Compass size={14} /> {tr(" Открыть гид ")}</Link>
            <Link to="/map" className="btn btn-secondary btn-md gap-2">
              <MapPin size={14} /> {tr(" Карта города ")}</Link>
          </div>

          <div className="mx-auto mt-12 flex max-w-md flex-wrap justify-center gap-2 border-t border-white/8 pt-6">
            <Link to="/routes/route-saturday" className="pill transition-colors hover:text-white">
              <RouteIcon size={12} className="text-accent" />
              {tr(" Суббота на левом берегу ")}</Link>
            <Link to="/events" className="pill transition-colors hover:text-white">
              {tr(" Афиша событий ")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
