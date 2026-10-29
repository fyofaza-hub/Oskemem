import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { tr } from "@/i18n/runtime";
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
    </div>
  );
}
