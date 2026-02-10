import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: "primary" | "success" | "warning" | "accent";
}

export function StatCard({ title, value, icon: Icon, trend, color = "primary" }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <Card className="hover-lift transition-smooth overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            {trend && (
              <p className="text-xs text-muted-foreground">
                <span className={trend.value >= 0 ? "text-success" : "text-destructive"}>
                  {trend.value >= 0 ? "+" : ""}{trend.value}%
                </span>{" "}
                {trend.label}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]} transition-transform group-hover:scale-110 transition-smooth`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
