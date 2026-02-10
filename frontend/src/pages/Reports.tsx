import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { TrendingUp, Users, Briefcase, Building2, Award, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldSelectorDialog } from "@/components/FieldSelectorDialog";
import { exportToExcel, transformers, type FieldConfig } from "@/lib/exportUtils";

type BranchStat = {
  branch: string;
  total: number;
  placed: number;
  placementRate: number;
};

type CompanyStat = {
  id: number;
  name: string;
  totalDrives: number;
};

export default function Reports() {
  const [summary, setSummary] = useState<any>({});
  const [branchStats, setBranchStats] = useState<BranchStat[]>([]);
  const [appAnalytics, setAppAnalytics] = useState<any>({});
  const [companyStats, setCompanyStats] = useState<CompanyStat[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState<string | null>(null);

  const branchFields: FieldConfig[] = [
    { key: "branch", label: "Branch", defaultSelected: true },
    { key: "total", label: "Total Students", defaultSelected: true, transform: transformers.number },
    { key: "placed", label: "Placed Students", defaultSelected: true, transform: transformers.number },
    { key: "placementRate", label: "Placement Rate (%)", defaultSelected: true, transform: transformers.number },
  ];

  const companyPerformanceFields: FieldConfig[] = [
    { key: "name", label: "Company Name", defaultSelected: true },
    { key: "totalDrives", label: "Total Drives", defaultSelected: true, transform: transformers.number },
  ];

  useEffect(() => {
    loadAllReports();
  }, []);

  async function loadAllReports() {
    setLoading(true);
    try {
      const [summaryRes, branchRes, appRes, companyRes, studentRes] = await Promise.all([
        api.reports.summary(),
        api.reports.branchStats(),
        api.reports.applicationAnalytics(),
        api.reports.companyAnalytics(),
        api.reports.studentAnalytics(),
      ]);

      if (summaryRes.ok) setSummary(summaryRes.data as any);
      if (branchRes.ok) setBranchStats((branchRes.data as any)?.branches || []);
      if (appRes.ok) setAppAnalytics(appRes.data as any);
      if (companyRes.ok) setCompanyStats((companyRes.data as any)?.companies || []);
      if (studentRes.ok) setStudentAnalytics(studentRes.data as any);
    } catch (error: any) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }

  function handleExportBranches(selectedFields: FieldConfig[]) {
    try {
      exportToExcel(branchStats, "branch_statistics", selectedFields);
      toast.success("Branch statistics exported to Excel");
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    }
  }

  function handleExportCompanies(selectedFields: FieldConfig[]) {
    try {
      exportToExcel(companyStats, "company_performance", selectedFields);
      toast.success("Company performance exported to Excel");
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    }
  }

  const COLORS = ['#FF6600', '#FFB380', '#6FA8DC', '#002B5B', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-24 bg-slate-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const applicationStatusData = [
    { name: 'Pending', value: appAnalytics?.byStatus?.pending || 0, color: '#F59E0B' },
    { name: 'Accepted', value: appAnalytics?.byStatus?.accepted || 0, color: '#10B981' },
    { name: 'Rejected', value: appAnalytics?.byStatus?.rejected || 0, color: '#EF4444' },
  ];

  const cgpaDistData = studentAnalytics?.cgpaDistribution ? [
    { range: '< 6.0', count: studentAnalytics.cgpaDistribution.below6 },
    { range: '6.0-7.0', count: studentAnalytics.cgpaDistribution['6to7'] },
    { range: '7.0-8.0', count: studentAnalytics.cgpaDistribution['7to8'] },
    { range: '8.0-9.0', count: studentAnalytics.cgpaDistribution['8to9'] },
    { range: '> 9.0', count: studentAnalytics.cgpaDistribution.above9 },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-foreground/80 mt-2">Comprehensive placement insights and statistics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value={summary.students || 0} color="bg-blue-500" />
        <StatCard icon={Award} label="Placed" value={summary.placed || 0} color="bg-green-500" />
        <StatCard icon={Briefcase} label="Active Drives" value={summary.drives || 0} color="bg-orange-500" />
        <StatCard icon={TrendingUp} label="Applications" value={summary.applications || 0} color="bg-purple-500" />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Application Status Pie Chart */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Application Status Distribution</CardTitle>
                <CardDescription>Breakdown of all applications by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Total Applications: {appAnalytics?.totalApplications || 0}
                  </p>
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    Acceptance Rate: {appAnalytics?.acceptanceRate || 0}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Branch Placement Stats */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Branch-wise Placement Rate</CardTitle>
                <CardDescription>Placement percentages across branches</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchStats}>
                    <XAxis dataKey="branch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="placementRate" fill="#FF6600" name="Placement Rate %" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {branchStats.slice(0, 3).map((branch, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-medium">{branch.branch}</span>
                      <span className="text-muted-foreground">
                        {branch.placed}/{branch.total} ({branch.placementRate}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Placements Tab */}
        <TabsContent value="placements" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Branch-wise Statistics</CardTitle>
                    <CardDescription>Detailed placement data by branch</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setExportDialogOpen('branches')} disabled={branchStats.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branchStats.map((branch, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">{branch.branch}</h3>
                        <span className="text-2xl font-bold text-primary">{branch.placementRate}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Students</p>
                          <p className="font-medium text-lg">{branch.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Placed</p>
                          <p className="font-medium text-lg text-green-600">{branch.placed}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Application Metrics</CardTitle>
                <CardDescription>Overall application statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <MetricBox label="Total Applications" value={appAnalytics?.totalApplications || 0} />
                  <MetricBox label="Acceptance Rate" value={`${appAnalytics?.acceptanceRate || 0}%`} />
                  <MetricBox label="Pending" value={appAnalytics?.byStatus?.pending || 0} color="text-amber-600" />
                  <MetricBox label="Accepted" value={appAnalytics?.byStatus?.accepted || 0} color="text-green-600" />
                  <MetricBox label="Rejected" value={appAnalytics?.byStatus?.rejected || 0} color="text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-6">
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Company Performance</CardTitle>
                  <CardDescription>Top companies by recruitment drives</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setExportDialogOpen('companies')} disabled={companyStats.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companyStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No company data available</p>
                ) : (
                  companyStats.slice(0, 10).map((company, idx) => (
                    <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">Rank #{idx + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{company.totalDrives}</p>
                        <p className="text-xs text-muted-foreground">Drives</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* CGPA Distribution */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>CGPA Distribution</CardTitle>
                <CardDescription>Student performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cgpaDistData}>
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6FA8DC" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Eligibility Issues */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Eligibility Overview</CardTitle>
                <CardDescription>Students with eligibility concerns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-lg">{studentAnalytics?.withBreaks || 0}</p>
                    <p className="text-sm text-muted-foreground">Students with study breaks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="font-semibold text-lg">{studentAnalytics?.withBacklogs || 0}</p>
                    <p className="text-sm text-muted-foreground">Students with backlogs</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Impacted</p>
                  <p className="text-2xl font-bold">{studentAnalytics?.eligibilityImpacted || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Year-wise Distribution */}
          {studentAnalytics?.byYear && (
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Year-wise Student Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(studentAnalytics.byYear).map(([year, count]: [string, any]) => (
                    <div key={year} className="p-4 border rounded-lg text-center">
                      <p className="text-muted-foreground text-sm">Year {year}</p>
                      <p className="text-3xl font-bold text-primary mt-2">{count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <FieldSelectorDialog
        open={exportDialogOpen === 'branches'}
        onOpenChange={(open) => setExportDialogOpen(open ? 'branches' : null)}
        fields={branchFields}
        onExport={handleExportBranches}
        title="Export Branch Statistics"
        description="Select which branch statistics to include in the export"
      />

      <FieldSelectorDialog
        open={exportDialogOpen === 'companies'}
        onOpenChange={(open) => setExportDialogOpen(open ? 'companies' : null)}
        fields={companyPerformanceFields}
        onExport={handleExportCompanies}
        title="Export Company Performance"
        description="Select which company fields to include in the export"
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="hover-lift">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricBox({ label, value, color = "text-foreground" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
}
