import { EstadoPlanilla } from "@prisma/client";
import { ESTADO_COLORS, ESTADO_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EstadoBadgeProps {
  estado: EstadoPlanilla;
  className?: string;
}

export function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        ESTADO_COLORS[estado],
        className
      )}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}
