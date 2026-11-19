import type { FileStatus } from "@/generated/prisma/enums";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: FileStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
