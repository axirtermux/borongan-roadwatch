import { cn } from "@/lib/utils";
import { severityLabel, statusLabel, type ReportStatus, type SeverityLevel } from "@/lib/domain";

const severityClasses: Record<SeverityLevel, string> = {
  low: "bg-severity-low/15 text-severity-low border-severity-low/30",
  medium: "bg-severity-medium/20 text-severity-medium-foreground border-severity-medium/50",
  high: "bg-severity-high/15 text-severity-high border-severity-high/35",
  critical: "bg-severity-critical/15 text-severity-critical border-severity-critical/35",
};

const statusClasses: Record<ReportStatus, string> = {
  submitted: "bg-muted text-muted-foreground border-border",
  under_review: "bg-accent text-accent-foreground border-accent",
  verified: "bg-primary-soft text-primary border-primary/25",
  scheduled: "bg-severity-medium/20 text-severity-medium-foreground border-severity-medium/45",
  in_progress: "bg-severity-high/15 text-severity-high border-severity-high/35",
  completed: "bg-severity-low/15 text-severity-low border-severity-low/30",
  rejected: "bg-severity-critical/12 text-severity-critical border-severity-critical/30",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

export function SeverityBadge({
  severity,
  className,
}: {
  severity: SeverityLevel;
  className?: string;
}) {
  return (
    <span className={cn(base, severityClasses[severity], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {severityLabel(severity)}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  return <span className={cn(base, statusClasses[status], className)}>{statusLabel(status)}</span>;
}
