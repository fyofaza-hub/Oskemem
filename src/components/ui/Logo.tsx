import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";

interface LogoProps {
  compact?: boolean;
  className?: string;
  linkTo?: string;
}

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={cn("shrink-0 rounded-[10px] object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Logo({ compact = false, className, linkTo = "/" }: LogoProps) {
  return (
    <Link
      to={linkTo}
      className={cn("inline-flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", className)}
      aria-label={tr("Oskemen Culture — на главную")}
    >
      <LogoMark size={32} />
      {!compact ? (
        <span className="truncate font-display text-[15px] font-semibold leading-none tracking-[-0.01em] text-fg">
          Oskemen <span className="font-medium text-muted">Culture</span>
        </span>
      ) : null}
    </Link>
  );
}
