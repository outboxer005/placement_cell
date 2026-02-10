import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Plus,
  Globe,
  Users,
  Target,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FieldSelectorDialog } from "@/components/FieldSelectorDialog";
import { exportToExcel, transformers, type FieldConfig } from "@/lib/exportUtils";

type RawCompany = {
  id: number;
  name: string;
  info?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

type CompanyView = {
  id: number;
  name: string;
  industry: string;
  location: string;
  status: string;
  avgPackage?: string;
  roles?: string;
  placements?: number;
  contacts?: string;
  website?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

const STATUS_VARIANTS: Record<string, string> = {
  "Active Partner": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Prospect: "bg-amber-50 text-amber-700 border border-amber-200",
  Dormant: "bg-slate-100 text-slate-700 border border-slate-300",
};

const DEFAULT_FORM = {
  name: "",
  industry: "",
  location: "",
  status: "Active Partner",
  avgPackage: "",
  roles: "",
  placements: "",
  contacts: "",
  website: "",
  notes: "",
};

function hydrateCompany(row: RawCompany): CompanyView {
  const info = (row.info || {}) as Record<string, any>;
  return {
    id: row.id,
    name: row.name ?? "Untitled company",
    industry: info.industry || "General",
    location: info.location || "Not specified",
    status: info.status || "Prospect",
    avgPackage: info.avgPackage ?? info.avg_package ?? "",
    roles: info.roles ?? info.open_roles ?? "",
    placements: Number(info.placements ?? info.hires ?? 0) || undefined,
    contacts: info.contacts ?? info.hr_contact ?? "",
    website: info.website ?? info.career_site ?? "",
    notes: info.notes ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export default function Companies() {
  const [companies, setCompanies] = useState<CompanyView[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const companyFields: FieldConfig[] = [
    { key: "name", label: "Company Name", defaultSelected: true },
    { key: "industry", label: "Industry", defaultSelected: true },
    { key: "location", label: "Location", defaultSelected: true },
    { key: "status", label: "Status", defaultSelected: true },
    { key: "avgPackage", label: "Average Package", transform: transformers.currency },
    { key: "roles", label: "Primary Roles" },
    { key: "placements", label: "Placements Count", transform: transformers.number },
    { key: "contacts", label: "HR Contact" },
    { key: "website", label: "Website" },
    { key: "notes", label: "Notes" },
    { key: "updated_at", label: "Last Updated", transform: transformers.date },
  ];

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const term = search.toLowerCase();
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(term) ||
        company.industry.toLowerCase().includes(term) ||
        company.location.toLowerCase().includes(term),
    );
  }, [companies, search]);

  const summary = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === "Active Partner").length;
    const prospects = companies.filter((c) => c.status === "Prospect").length;
    return { total, active, prospects };
  }, [companies]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.companies.list();
      if (!res.ok) throw new Error((res.data as any)?.error || "Failed to load companies");
      const rows = (res.data as RawCompany[]) || [];
      setCompanies(rows.map(hydrateCompany));
    } catch (error: any) {
      toast.error(error.message || "Unable to fetch companies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!form.name.trim()) return toast.error("Company name is required");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        info: {
          industry: form.industry.trim() || undefined,
          location: form.location.trim() || undefined,
          status: form.status,
          avgPackage: form.avgPackage.trim() || undefined,
          roles: form.roles.trim() || undefined,
          placements: form.placements ? Number(form.placements) : undefined,
          contacts: form.contacts.trim() || undefined,
          website: form.website.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
      };
      const res = await api.companies.create(payload);
      if (!res.ok) throw new Error((res.data as any)?.error || "Failed to save company");
      toast.success("Company saved");
      setDialogOpen(false);
      setForm(DEFAULT_FORM);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Failed to save company");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExport(selectedFields: FieldConfig[]) {
    try {
      exportToExcel(filteredCompanies, "companies", selectedFields);
      toast.success(`Exported ${filteredCompanies.length} companies to Excel`);
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Recruitment Partners</h1>
          <p className="text-foreground/80 mt-2">
            Track partner readiness, compensation benchmarks and how many students each company hired.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Input
            placeholder="Search by name, industry or location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border-slate-300 focus:border-primary focus:ring-primary"
          />
          <Button variant="outline" onClick={() => setExportDialogOpen(true)} disabled={filteredCompanies.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary h-12 px-6">
                <Plus className="h-4 w-4 mr-2" />
                New partner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add recruitment partner</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label>Company name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Infosys" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Industry</Label>
                    <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="IT Services" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Location / Region</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Hyderabad, IN" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active Partner">Active Partner</SelectItem>
                        <SelectItem value="Prospect">Prospect</SelectItem>
                        <SelectItem value="Dormant">Dormant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Average package (CTC)</Label>
                    <Input value={form.avgPackage} onChange={(e) => setForm({ ...form, avgPackage: e.target.value })} placeholder="₹7.5 LPA" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Primary roles / stack</Label>
                    <Input value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} placeholder="Full Stack, QA, Data" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last placements count</Label>
                    <Input type="number" value={form.placements} onChange={(e) => setForm({ ...form, placements: e.target.value })} placeholder="5" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>HR contact / email</Label>
                    <Input value={form.contacts} onChange={(e) => setForm({ ...form, contacts: e.target.value })} placeholder="hr@company.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Website or drive link</Label>
                    <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://careers.company.com" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Eligibility conditions, hiring feedback..." />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="gradient-primary" onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Saving..." : "Save partner"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-600">Total partners</CardDescription>
            <CardTitle className="text-3xl text-foreground">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700">Active partners</CardDescription>
            <CardTitle className="text-3xl text-emerald-900">{summary.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-amber-50 border-amber-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700">Prospects to nurture</CardDescription>
            <CardTitle className="text-3xl text-amber-900">{summary.prospects}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="h-48 animate-pulse bg-slate-100 border-slate-200" />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50 text-center py-16">
          <CardHeader>
            <CardTitle className="text-foreground">No partners found</CardTitle>
            <CardDescription>Try a different search keyword or add a new company.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="bg-white border-slate-200 hover:border-primary/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl text-foreground">{company.name}</CardTitle>
                    <p className="text-sm text-slate-600">{company.industry}</p>
                  </div>
                  <Badge className={cn("text-xs px-3 py-1 rounded-full", STATUS_VARIANTS[company.status] ?? "bg-primary/10 text-primary border border-primary/20")}>
                    {company.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  {company.location}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Avg package</p>
                    <p className="text-lg font-semibold text-foreground">{company.avgPackage || "–"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Recent hires</p>
                    <p className="text-lg font-semibold text-foreground">{company.placements ?? "–"}</p>
                  </div>
                </div>
                {company.roles && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Briefcase className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{company.roles}</span>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {company.contacts && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="h-4 w-4 text-slate-500" />
                      {company.contacts}
                    </div>
                  )}
                  {company.website && (
                    <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <Globe className="h-4 w-4" />
                      {company.website}
                    </a>
                  )}
                </div>
                {company.notes && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    {company.notes}
                  </div>
                )}
                <Separator className="bg-slate-200" />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Updated {company.updated_at ? new Date(company.updated_at).toLocaleDateString() : "—"}</span>
                  <div className="inline-flex items-center gap-1 text-primary text-xs">
                    <Target className="h-3.5 w-3.5" />
                    {company.status === "Active Partner" ? "Engaged" : "Nurture"}
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
        fields={companyFields}
        onExport={handleExport}
        title="Export Companies to Excel"
        description="Select which company fields to include in the export"
      />
    </div>
  );
}
