import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthPage } from "@/pages/AuthPage";
import { EventsPage } from "@/pages/EventsPage";
import { FeedPage } from "@/pages/FeedPage";
import { GuidePage } from "@/pages/GuidePage";
import { HomePage } from "@/pages/HomePage";
import { MapPage } from "@/pages/MapPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlanPage } from "@/pages/PlanPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RouteBuilderPage } from "@/pages/RouteBuilderPage";
import { RouteDetailPage } from "@/pages/RouteDetailPage";
import { RoutesPage } from "@/pages/RoutesPage";

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ToastProvider>
              <AppProvider>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route element={<AppShell />}>
                    <Route index element={<HomePage />} />
                    <Route path="feed" element={<FeedPage />} />
                    <Route path="guide" element={<GuidePage />} />
                    <Route path="map" element={<MapPage />} />
                    <Route path="routes" element={<RoutesPage />} />
                    <Route path="routes/new" element={<RouteBuilderPage />} />
                    <Route path="routes/:id" element={<RouteDetailPage />} />
                    <Route path="events" element={<EventsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="plan" element={<PlanPage />} />
                    <Route path="*" element={<NotFoundPage />} />
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
