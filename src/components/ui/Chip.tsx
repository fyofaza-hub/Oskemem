import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: IconName;
  count?: number;
}

/** Фильтр-чип. Для переключателей передавайте aria-pressed, для вкладок role="tab" и aria-selected. */
export function Chip({ active = false, icon, count, className, children, type = "button", ...props }: ChipProps) {
  return (
    <button type={type} className={cn("chip", active && "chip-active", className)} {...props}>
      {icon ? <Icon name={icon} size={15} /> : null}
      {children}
      {count !== undefined ? (
        <span className={cn("tabular-nums text-[12px]", active ? "text-accent-ink/80" : "text-faint")}>
          {count}
        </span>
      ) : null}
    </button>
  );
}
