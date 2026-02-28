interface TagChipProps {
  name: string;
  category?: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  technique: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  tool: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  concept: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  organism: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

export function TagChip({
  name,
  category,
  count,
  selected,
  onClick,
}: TagChipProps) {
  const colorClass =
    CATEGORY_COLORS[category ?? ""] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all
        ${colorClass}
        ${selected ? "ring-2 ring-emerald-500 ring-offset-1" : ""}
        ${onClick ? "cursor-pointer hover:opacity-80" : "cursor-default"}
      `}
    >
      {name}
      {count !== undefined && (
        <span className="text-[10px] opacity-60">({count})</span>
      )}
    </button>
  );
}
