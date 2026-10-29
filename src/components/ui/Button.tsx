import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft-danger" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  "soft-danger": "btn-soft-danger",
  inverse: "btn-inverse",
};

export const buttonClass = (
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string,
) => cn("btn", sizeClasses[size], variantClasses[variant], className);

const iconSizes: Record<ButtonSize, number> = { sm: 15, md: 16, lg: 18 };

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Основная кнопка. Состояния hover / active / focus-visible / disabled
 * заданы в index.css; loading блокирует повторные нажатия без затемнения.
 */
export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const iconSize = iconSizes[size];
  return (
    <button
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? undefined : onClick}
      className={cn(
        buttonClass(variant, size, className),
        fullWidth && "w-full",
        loading && "pointer-events-none",
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  className?: string;
};

/** Ссылка, оформленная как кнопка. Используется для переходов внутри приложения. */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  const iconSize = iconSizes[size];
  return (
    <Link
      className={cn(buttonClass(variant, size, className), fullWidth && "w-full")}
      {...props}
    >
      {icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Обязательная подпись: используется как aria-label и всплывающая подсказка (title). */
  label: string;
  size?: "sm" | "md";
  variant?: "plain" | "bordered" | "media";
  active?: boolean;
}

export function IconButton({
  icon,
  label,
  size = "md",
  variant = "plain",
  active = false,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "icon-btn",
        size === "sm" && "icon-btn-sm",
        variant === "bordered" && "icon-btn-bordered",
        variant === "media" && "icon-btn-on-media",
        active && variant === "plain" && "bg-accent-soft text-accent-ink hover:bg-accent-soft hover:text-accent-ink",
        active && variant === "media" && "bg-accent text-white hover:bg-accent-hover hover:text-white",
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={size === "sm" ? 16 : 18} />
    </button>
  );
}
