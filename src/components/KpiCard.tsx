/**
 * AgentLens — KPI Card component
 */
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accentColor?: "primary" | "success" | "warning" | "destructive" | "secondary";
  loading?: boolean;
}

const ACCENT_CLASSES = {
  primary: "text-primary border-primary/20 bg-primary/5",
  success: "text-success border-success/20 bg-success/5",
  warning: "text-warning border-warning/20 bg-warning/5",
  destructive: "text-destructive border-destructive/20 bg-destructive/5",
  secondary: "text-secondary border-secondary/20 bg-secondary/5",
};

export function KpiCard({
  title,
  value,
  subValue,
  icon,
  trend,
  trendValue,
  accentColor = "primary",
  loading = false,
}: KpiCardProps) {
  const accentClass = ACCENT_CLASSES[accentColor];

  return (
    <div className="card-glow rounded-xl bg-background-card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${accentClass}`}>
            {icon}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-2/3 rounded-md bg-background-elevated animate-shimmer bg-[length:200%_100%]" />
          <div className="h-3 w-1/2 rounded bg-background-elevated animate-shimmer bg-[length:200%_100%]" />
        </div>
      ) : (
        <>
          <div>
            <p className={`text-3xl font-bold tracking-tight ${accentClass.split(" ")[0]}`}>
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-foreground-muted mt-1">{subValue}</p>
            )}
          </div>

          {trend && trendValue && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend === "up"
                  ? "text-success"
                  : trend === "down"
                  ? "text-destructive"
                  : "text-foreground-muted"
              }`}
            >
              {trend === "up" ? (
                <TrendingUp size={11} />
              ) : trend === "down" ? (
                <TrendingDown size={11} />
              ) : (
                <Minus size={11} />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
