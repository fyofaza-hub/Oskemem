import type { User } from "@/types";
import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  user?: User | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizes = {
  xs: "h-6 w-6 text-[11px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
  "2xl": "h-24 w-24 text-3xl",
};

export function Avatar({ user, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-display font-semibold text-white",
        sizes[size],
        className,
      )}
      style={{ background: user?.avatarColor ?? "rgb(var(--sunken))" }}
      aria-hidden="true"
    >
      {user?.avatar ? (
        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
      ) : user ? (
        initials(user.name)
      ) : (
        <span className="text-muted">?</span>
      )}
    </span>
  );
}
