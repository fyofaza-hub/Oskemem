import type { ReactNode } from "react";
import type { CategoryId } from "@/types";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Chip } from "@/components/ui/Chip";
import { categoryIconNames } from "@/components/ui/Category";

interface CategoryFilterProps {
  value: CategoryId | "all";
  onChange: (value: CategoryId | "all") => void;
  counts?: Partial<Record<CategoryId | "all", number>>;
  className?: string;
  includeAll?: boolean;
  wrap?: boolean;
  showScrollbar?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  label?: string;
}

/** Выбор одной категории. На телефоне строка прокручивается, на десктопе переносится. */
export function CategoryFilter({
  value,
  onChange,
  counts,
  className,
  includeAll = true,
  wrap = true,
  showScrollbar = false,
  leading,
  trailing,
  label = tr("Категории мест"),
}: CategoryFilterProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:px-0",
        !showScrollbar && "no-scrollbar",
        wrap && "sm:flex-wrap sm:overflow-visible",
        className,
      )}
    >
      {leading}
      {includeAll ? (
        <Chip
          aria-pressed={value === "all"}
          active={value === "all"}
          icon="layers"
          count={counts?.all}
          onClick={() => onChange("all")}
        >
          {tr("Все")}
        </Chip>
      ) : null}
      {categories.map((category) => (
        <Chip
          key={category.id}
          aria-pressed={value === category.id}
          active={value === category.id}
          icon={categoryIconNames[category.id]}
          count={counts?.[category.id]}
          onClick={() => onChange(category.id)}
        >
          {category.shortLabel}
        </Chip>
      ))}
      {trailing}
    </div>
  );
}
