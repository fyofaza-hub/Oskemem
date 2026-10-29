import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoader } from "@/components/ui/PageLoader";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

// Страницы отправляются браузеру только по требованию (React.lazy):
// стартовый чанк остаётся компактным, а leaflet, конструктор маршрутов
// и админка не попадают в первый paint.
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const AuthPage = lazy(() => import("@/pages/AuthPage").then((m) => ({ default: m.AuthPage })));
const EventsPage = lazy(() => import("@/pages/EventsPage").then((m) => ({ default: m.EventsPage })));
const FeedPage = lazy(() => import("@/pages/FeedPage").then((m) => ({ default: m.FeedPage })));
const GuidePage = lazy(() => import("@/pages/GuidePage").then((m) => ({ default: m.GuidePage })));
const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const MapPage = lazy(() => import("@/pages/MapPage").then((m) => ({ default: m.MapPage })));
const NavigationPage = lazy(() =>
  import("@/pages/NavigationPage").then((m) => ({ default: m.NavigationPage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);
const PlanPage = lazy(() => import("@/pages/PlanPage").then((m) => ({ default: m.PlanPage })));
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const RouteBuilderPage = lazy(() =>
  import("@/pages/RouteBuilderPage").then((m) => ({ default: m.RouteBuilderPage })),
);
const RouteDetailPage = lazy(() =>
  import("@/pages/RouteDetailPage").then((m) => ({ default: m.RouteDetailPage })),
);
const RoutesPage = lazy(() => import("@/pages/RoutesPage").then((m) => ({ default: m.RoutesPage })));

/** Обёртка ленивого маршрута: единый fallback для всех страниц. */
const route = (page: ReactNode) => <Suspense fallback={<PageLoader />}>{page}</Suspense>;

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ToastProvider>
              <AppProvider>
                <Routes>
                  <Route path="/auth" element={route(<AuthPage />)} />
                  <Route element={<AppShell />}>
                    <Route index element={route(<HomePage />)} />
                    <Route path="feed" element={route(<FeedPage />)} />
                    <Route path="guide" element={route(<GuidePage />)} />
                    <Route path="map" element={route(<MapPage />)} />
                    <Route path="routes" element={route(<RoutesPage />)} />
                    <Route path="routes/new" element={route(<RouteBuilderPage />)} />
                    <Route path="routes/:id" element={route(<RouteDetailPage />)} />
                    <Route path="events" element={route(<EventsPage />)} />
                    <Route path="admin" element={route(<AdminPage />)} />
                    <Route path="profile" element={route(<ProfilePage />)} />
                    <Route path="plan" element={route(<PlanPage />)} />
                    <Route path="navigation" element={route(<NavigationPage />)} />
                    <Route path="*" element={route(<NotFoundPage />)} />
                  </Route>
                </Routes>
              </AppProvider>
            </ToastProvider>
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
