import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Единый заголовок страницы: название, короткое пояснение и действия справа. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6", className)}>
      <div className="min-w-0 max-w-2xl">
        <h1 className="page-title">{title}</h1>
        {description ? <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: { label: string; to: string };
  className?: string;
}

export function SectionHeading({ title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action ? (
        <ButtonLink to={action.to} variant="ghost" size="sm" iconRight="arrowRight" className="hidden sm:inline-flex">
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  /** An Iconmind name or a Lucide component. */
  icon: IconName | LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}

/** Пустое состояние и состояние ошибки: иконка, короткий текст и одно понятное действие. */
export function EmptyState({ icon, title, description, action, tone = "neutral", className }: EmptyStateProps) {
  const Glyph = typeof icon === "string" ? null : icon;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
          tone === "danger" ? "bg-danger-soft text-danger-ink" : "bg-sunken text-muted",
        )}
      >
        {Glyph ? <Glyph size={22} strokeWidth={1.5} /> : <Icon name={icon as IconName} size={22} />}
      </span>
      <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
      {description ? <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
