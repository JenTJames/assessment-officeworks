import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusPanelProps = {
  icon: LucideIcon;
  title: string;
  message: ReactNode;
  role?: "alert" | "status";
  tone?: "neutral" | "destructive";
  action?: ReactNode;
};

export function StatusPanel({
  icon: Icon,
  title,
  message,
  role = "status",
  tone = "neutral",
  action,
}: StatusPanelProps) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center"
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-12 items-center justify-center rounded-full bg-muted",
          tone === "destructive" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <Icon className="size-6" />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
