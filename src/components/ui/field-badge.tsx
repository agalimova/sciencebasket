import { FIELDS, type FieldId } from "@/types/fields";

interface FieldBadgeProps {
  fieldId: FieldId;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export function FieldBadge({ fieldId, size = "md" }: FieldBadgeProps) {
  const field = FIELDS[fieldId];
  if (!field) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${SIZE_CLASSES[size]}`}
      style={{ backgroundColor: field.color }}
    >
      {field.name}
    </span>
  );
}
