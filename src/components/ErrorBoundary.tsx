import { Component, type ErrorInfo, type ReactNode } from "react";
import { tr } from "@/i18n/runtime";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Oskemen Culture render error", error, info);
  }

  handleResetLocal = () => {
    try {
      window.localStorage.removeItem("oskemen-culture-state-v1");
    } catch {
      // Хранилище может быть недоступно в приватном режиме.
    }
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-canvas px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger-ink">
            <Icon name="warning" size={22} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-fg">
            {tr("Интерфейс споткнулся, но город на месте")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {tr("Обычно помогает обновить страницу. Если ошибка повторяется, можно сбросить локальные данные — публикации, маршруты и профиль вернутся к исходным.")}
          </p>
          {import.meta.env.DEV && this.state.error ? (
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-sunken p-3 font-mono text-[12px] leading-relaxed text-danger-ink">
              {this.state.error.message}
            </pre>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" icon="refresh" onClick={() => window.location.reload()}>
              {tr("Обновить страницу")}
            </Button>
            <Button variant="secondary" onClick={this.handleResetLocal}>
              {tr("Сбросить данные")}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
