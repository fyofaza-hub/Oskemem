import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { tr } from "@/i18n/runtime";
import { prefetchOnIdle } from "@/lib/prefetch";
import { AIChat } from "@/components/AIChat";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { DraftBar } from "@/components/layout/DraftBar";
import { Footer } from "@/components/layout/Footer";

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  // Плавное проявление контента (data-reveal): IntersectionObserver + MutationObserver,
  // чтобы охватить и элементы, появившиеся после скелетонов загрузки.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("main");
    if (!main) return;
    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
    const observeAll = () => {
      main.querySelectorAll("[data-reveal]").forEach((el) => {
        if (!el.classList.contains("reveal-in")) observer.observe(el);
      });
    };
    observeAll();
    const mutation = new MutationObserver(observeAll);
    mutation.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [location.pathname]);

  // Прогрев малых чанков вероятных переходов — навигация ощущается мгновенной.
  useEffect(() => {
    prefetchOnIdle();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-fg focus:shadow-raised"
      >
        {tr("Перейти к содержимому")}
      </a>
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar onSearch={openSearch} />
        <main id="main" tabIndex={-1} className="min-h-[calc(100svh-56px)] outline-none lg:min-h-[calc(100svh-64px)]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
        <Footer />
      </div>
      <MobileNav />
      <DraftBar />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
      {/* AI-гид: плавающий чат-виджет доступен со всех страниц приложения (кроме входа) */}
      <AIChat />
    </div>
  );
}
