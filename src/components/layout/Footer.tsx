import { useState } from "react";
import { Link } from "react-router-dom";
import { photoCredits, unsplashNote } from "@/data/credits";
import { tr } from "@/i18n/runtime";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

const footerLinks = [
  { label: tr("Куда сходить"), to: "/plan" },
  { label: tr("Гид"), to: "/guide" },
  { label: tr("Карта"), to: "/map" },
  { label: tr("Маршруты"), to: "/routes" },
  { label: tr("События"), to: "/events" },
  { label: tr("Лента"), to: "/feed" },
];

export function Footer() {
  const [creditsOpen, setCreditsOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-10 pb-28 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 lg:pb-10">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-meta leading-relaxed text-muted">
              {tr("Социальный гид по Өскемену: места, события и маршруты, собранные людьми. Прототип, а не официальный городской сервис.")}
            </p>
          </div>
          <nav aria-label={tr("Разделы сайта")} className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-sm sm:grid-cols-3">
            {footerLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-muted transition-colors hover:text-fg">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 py-4 text-meta text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>{tr("© 2026 Oskemen Culture · Өскемен, Казахстан")}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <button
                type="button"
                onClick={() => setCreditsOpen(true)}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
              >
                <Icon name="image" size={14} />
                {tr("Фото и данные")}
              </button>
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
              >
                <Icon name="link" size={14} />
                OpenStreetMap
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Modal
        open={creditsOpen}
        onClose={() => setCreditsOpen(false)}
        title={tr("Фотографии и данные")}
        description={tr("Часть изображений — реальные кадры Өскемена, часть — иллюстративные.")}
        size="lg"
      >
        <div className="space-y-5 p-5 sm:p-6">
          <p className="rounded-xl bg-sunken p-4 text-sm leading-relaxed text-muted">
            {tr("Адреса и координаты мест сверены с OpenStreetMap. Мы не публикуем выдуманные часы работы, цены и точные адреса — их стоит уточнять у самого места.")}
          </p>

          <ul className="space-y-2">
            {photoCredits.map((credit) => (
              <li
                key={credit.image}
                className="flex items-center gap-3 rounded-xl border border-line p-2.5"
              >
                <img src={credit.image} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{tr(credit.title)}</p>
                  <p className="mt-0.5 truncate text-meta text-muted">
                    {credit.author} · {credit.source} · {credit.license}
                  </p>
                </div>
                <a
                  href={credit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-soft"
                >
                  {tr("Источник")}
                </a>
              </li>
            ))}
          </ul>

          <p className="text-meta leading-relaxed text-muted">{unsplashNote}</p>
        </div>
      </Modal>
    </>
  );
}
