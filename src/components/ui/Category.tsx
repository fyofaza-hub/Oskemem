import type { CategoryId } from "@/types";
import { categoryMap } from "@/data/categories";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

export const categoryIconNames: Record<CategoryId, IconName> = {
  food: "coffee",
  nature: "tree",
  entertainment: "film",
  culture: "museum",
  sport: "running",
  landmark: "landmark",
  leisure: "wave",
};

export function CategoryIcon({
  category,
  size = 15,
  className,
}: {
  category: CategoryId;
  size?: number;
  className?: string;
}) {
  return <Icon name={categoryIconNames[category]} size={size} className={className} />;
}

export function CategoryDot({ category, className }: { category: CategoryId; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: categoryMap[category].accent }}
    />
  );
}

export function CategoryLabel({ category, className }: { category: CategoryId; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-meta text-muted", className)}>
      <CategoryIcon category={category} size={14} />
      {categoryMap[category].shortLabel}
    </span>
  );
}
