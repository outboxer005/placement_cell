import { Users, Briefcase, Building2, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [summary, setSummary] = useState<any>({});
  useEffect(() => {
    (async () => {
      const res = await api.reports.summary();
      if (res.ok) setSummary(res.data as any);
    })();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Dashboard</CardTitle>
          <p className="text-muted-foreground">Live overview of placements</p>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={String(summary.students || 0)} icon={Users} trend={{ value: 0, label: "" }} color="primary" />
        <StatCard title="Active Drives" value={String(summary.drives || 0)} icon={Briefcase} trend={{ value: 0, label: "" }} color="accent" />
        <StatCard title="Applications" value={String(summary.applications || 0)} icon={Building2} trend={{ value: 0, label: "" }} color="success" />
        <StatCard title="Placed Students" value={String(summary.placed || 0)} icon={TrendingUp} trend={{ value: 0, label: "" }} color="warning" />
      </div>
    </div>
  );
}
