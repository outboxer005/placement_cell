import { useEffect, useMemo, useState } from "react";
import { Plus, CheckCircle2, Clock, CalendarRange, Building2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { FieldSelectorDialog } from "@/components/FieldSelectorDialog";
import { exportToExcel, transformers, type FieldConfig } from "@/lib/exportUtils";

type RawDrive = {
  id: number;
  title: string;
  description?: string;
  company_id?: number;
  status: "draft" | "published" | "closed";
  eligibility?: {
    min_cgpa?: number;
    branches?: string[];
    required_docs?: string[];
    location?: string;
  };
  created_at?: string;
  publish_date?: string;
};

type DriveView = RawDrive & { companyName?: string };

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border border-amber-200",
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border border-slate-300",
};

type StatTone = "default" | "success" | "warning";

const DEFAULT_FORM = {
  title: "",
  companyId: "none",
  description: "",
  minCgpa: "7",
  branchesText: "CSE,ECE",
  location: "",
  totalRounds: "1",
  roundNames: [] as string[],
};

export default function Drives() {
  const [drives, setDrives] = useState<DriveView[]>([]);
  const [companies, setCompanies] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const driveFields: FieldConfig[] = [
    { key: "title", label: "Drive Title", defaultSelected: true },
    { key: "companyName", label: "Company Name", defaultSelected: true },
    { key: "description", label: "Description" },
    { key: "status", label: "Status", defaultSelected: true },
    { key: "eligibility.min_cgpa", label: "Minimum CGPA", transform: transformers.number },
    { key: "eligibility.branches", label: "Eligible Branches", transform: transformers.array },
    { key: "eligibility.location", label: "Location/Mode" },
    { key: "created_at", label: "Created Date", transform: transformers.date },
    { key: "publish_date", label: "Published Date", transform: transformers.date },
  ];

  const summary = useMemo(() => {
    const total = drives.length;
    const draft = drives.filter((drive) => drive.status === "draft").length;
    const published = drives.filter((drive) => drive.status === "published").length;
    return { total, draft, published };
  }, [drives]);

  async function loadDrives() {
    setLoading(true);
    try {
      const res = await api.drives.list();
      if (!res.ok) throw new Error((res.data as any)?.error || "Failed to load drives");
      const rows = (res.data as RawDrive[]) || [];
      setDrives(
        rows.map((drive) => ({
          ...drive,
          companyName: drive.company_id ? companies[drive.company_id] : undefined,
        })),
      );
    } catch (error: any) {
      toast.error(error.message || "Unable to fetch drives");
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanies() {
    const res = await api.companies.list();
    if (!res.ok) return;
    const map: Record<number, string> = {};
    ((res.data as any[]) || []).forEach((company) => {
      if (company.id) map[Number(company.id)] = company.name ?? `Company #${company.id}`;
    });
    setCompanies(map);
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadDrives();
  }, [Object.keys(companies).length]);

  async function createDrive() {
    if (!form.title.trim()) return toast.error("Title is required");
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        company_id: form.companyId && form.companyId !== "none" ? Number(form.companyId) : undefined,
        description: form.description.trim() || undefined,
        eligibility: {
          min_cgpa: Number(form.minCgpa) || 0,
          branches: form.branchesText
            .split(",")
            .map((branch) => branch.trim())
            .filter(Boolean),
          location: form.location.trim() || undefined,
          required_docs: [],
        },
        total_rounds: Number(form.totalRounds) || 1,
        round_names: form.roundNames.filter(Boolean),
      };
      const res = await api.drives.create(payload);
      if (!res.ok) throw new Error((res.data as any)?.error || "Failed to create drive");
      toast.success("Drive created");
      setForm(DEFAULT_FORM);
      await loadDrives();
    } catch (error: any) {
      toast.error(error.message || "Unable to create drive");
    } finally {
      setCreating(false);
    }
  }

  async function publish(id: number) {
    try {
      const res = await api.drives.publish(String(id));
      if (!res.ok) throw new Error((res.data as any)?.error || "Failed to publish drive");
      const notified = (res.data as any)?.notified ?? 0;
      toast.success(`Drive published · ${notified} students notified`);
      await loadDrives();
    } catch (error: any) {
      toast.error(error.message || "Publish failed");
    }
  }

  function handleExport(selectedFields: FieldConfig[]) {
    try {
      exportToExcel(drives, "placement_drives", selectedFields);
      toast.success(`Exported ${drives.length} drives to Excel`);
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">Placement Drives</CardTitle>
              <CardDescription>Publish opportunities, track eligibility and notify students when a drive goes live.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setExportDialogOpen(true)} disabled={drives.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Create a drive</CardTitle>
          <CardDescription>Students see published drives instantly in the mobile app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Drive title</label>
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Full Stack Interns – Winter 2025"
                className="border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Company</label>
              <Select value={form.companyId} onValueChange={(value) => setForm({ ...form, companyId: value })}>
                <SelectTrigger className="border-slate-300 focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Select company (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Unlisted</SelectItem>
                  {Object.entries(companies).map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Minimum CGPA</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={form.minCgpa}
                onChange={(event) => setForm({ ...form, minCgpa: event.target.value })}
                className="border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Eligible branches (comma separated)</label>
              <Input
                value={form.branchesText}
                onChange={(event) => setForm({ ...form, branchesText: event.target.value })}
                placeholder="CSE, ECE, IT"
                className="border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Drive description</label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Role summary, rounds, stipend, deadlines..."
              className="border-slate-300 focus:border-primary focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Location / Mode</label>
            <Input
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="On-campus · Guntur"
              className="border-slate-300 focus:border-primary focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Number of Recruitment Rounds</label>
            <Input
              type="number"
              min="1"
              max="10"
              value={form.totalRounds}
              onChange={(event) => {
                const val = event.target.value;
                setForm({ ...form, totalRounds: val, roundNames: [] });
              }}
              className="border-slate-300 focus:border-primary focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">Default is 1 round. Set multiple rounds for Aptitude → Technical → HR flow.</p>
          </div>
          {Number(form.totalRounds) > 1 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Round Names (Optional)</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: Number(form.totalRounds) }).map((_, i) => (
                  <Input
                    key={i}
                    placeholder={`Round ${i + 1}`}
                    value={form.roundNames[i] || ''}
                    onChange={(e) => {
                      const names = [...form.roundNames];
                      names[i] = e.target.value;
                      setForm({ ...form, roundNames: names });
                    }}
                    className="border-slate-300 focus:border-primary focus:ring-primary"
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">E.g., "Aptitude Test", "Technical Interview", "HR Round"</p>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={createDrive} disabled={creating} className="gradient-primary px-8 h-12 shadow-md hover:shadow-lg">
              {creating ? "Saving..." : "Save as draft"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total drives" value={summary.total} icon={CalendarRange} />
        <StatCard label="Published" value={summary.published} icon={CheckCircle2} tone="success" />
        <StatCard label="Drafts" value={summary.draft} icon={Clock} tone="warning" />
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="h-40 animate-pulse bg-slate-100 border-slate-200" />
          ))}
        </div>
      ) : drives.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50 text-center py-16">
          <CardHeader>
            <CardTitle className="text-foreground">No drives yet</CardTitle>
            <CardDescription>Create your first drive to notify students.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drives.map((drive) => (
            <Card key={drive.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl text-foreground">{drive.title}</CardTitle>
                    {drive.companyName && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        {drive.companyName}
                      </div>
                    )}
                  </div>
                  <Badge className={STATUS_STYLES[drive.status] || "bg-primary/10 text-primary border border-primary/20"}>
                    {drive.status}
                  </Badge>
                </div>
                <p className="text-slate-600 text-sm">{drive.description || "No description added yet."}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3 text-sm">
                  <InfoPill label="Min CGPA" value={drive.eligibility?.min_cgpa?.toFixed?.(2) ?? drive.eligibility?.min_cgpa ?? "—"} />
                  <InfoPill label="Branches" value={(drive.eligibility?.branches || []).join(", ") || "All"} />
                  <InfoPill label="Mode" value={drive.eligibility?.location || "Not specified"} />
                </div>
                <Separator className="bg-slate-200" />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Created {drive.created_at ? new Date(drive.created_at).toLocaleDateString() : "—"}</span>
                  {drive.publish_date && <span>Published {new Date(drive.publish_date).toLocaleDateString()}</span>}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/drives/${drive.id}`}
                    >
                      View Details
                    </Button>
                    {drive.status === "draft" && (
                      <Button size="sm" variant="secondary" onClick={() => publish(drive.id)}>
                        Publish now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FieldSelectorDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        fields={driveFields}
        onExport={handleExport}
        title="Export Drives to Excel"
        description="Select which drive fields to include in the export"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: StatTone;
}) {
  const toneClasses: Record<StatTone, string> = {
    default: "bg-white border-slate-200 text-slate-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };

  return (
    <Card className={toneClasses[tone]}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 opacity-70" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">{label}</p>
      <p className="text-base font-semibold text-foreground mt-1 break-words">{value}</p>
    </div>
  );
}
