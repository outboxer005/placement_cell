import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Eye, Send, Loader2, Download, Upload } from "lucide-react";
import { FieldSelectorDialog } from "@/components/FieldSelectorDialog";
import { exportToExcel, transformers, type FieldConfig } from "@/lib/exportUtils";
import { BulkUploadDialog } from "@/components/BulkUploadDialog";

export default function Students() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const { role } = useAuth();
  const isMain = role === "main-admin";
  const [branch, setBranch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  const studentFields: FieldConfig[] = [
    { key: "regd_id", label: "Registration ID", defaultSelected: true },
    { key: "full_name", label: "Full Name", defaultSelected: true, transform: (v) => v || "" },
    { key: "email", label: "Email", defaultSelected: true },
    { key: "alt_email", label: "Alternate Email" },
    { key: "phone", label: "Phone", defaultSelected: true },
    { key: "alt_phone", label: "Alternate Phone" },
    { key: "branch", label: "Branch", defaultSelected: true },
    { key: "cgpa", label: "CGPA", defaultSelected: true, transform: transformers.number },
    { key: "resume_url", label: "Resume URL" },
    { key: "break_in_studies", label: "Break in Studies", transform: transformers.boolean },
    { key: "has_backlogs", label: "Has Backlogs", transform: transformers.boolean },
  ];

  async function load() {
    const res = await api.students.list(isMain && branch.trim() ? { branch: branch.trim() } : {});
    if (res.ok) setStudents(res.data as any[]);
  }
  useEffect(() => {
    load(); // reload when branch or role changes (isMain)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, role]);

  async function requestData(id: string) {
    const res = await api.students.requestData(id, []);
    if (res.ok) toast.success("Request sent"); else toast.error("Failed");
  }

  async function onCsvSelected(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      // Parse simple CSV with header (regd,cgpa) — tolerate regd_id/registration and cpga typo
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) return toast.error("Empty CSV");
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows: Array<{ regd_id: string; cgpa: number }> = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const rec: any = {};
        header.forEach((h, idx) => rec[h] = cols[idx]);
        const regd = String(rec.regd ?? rec.regd_id ?? rec.registration ?? "").trim().toUpperCase();
        const cg = rec.cgpa ?? rec.cpga;
        const cgpa = typeof cg === 'string' ? parseFloat(cg) : cg;
        if (regd && !Number.isNaN(Number(cgpa))) rows.push({ regd_id: regd, cgpa: Number(cgpa) });
      }
      if (!rows.length) return toast.error("No valid rows found");
      const res = await api.students.importCgpa(rows);
      if (!res.ok) throw new Error((res.data as any)?.error || 'Import failed');
      const d = res.data as any;
      toast.success(`Imported ${d.updated} of ${d.received} rows`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to import CSV");
    }
  }

  async function openDetail(id: string) {
    setActiveStudentId(id);
    setDrawerOpen(true);
    setDetail(null);
    setDetailLoading(true);
    const res = await api.students.detail(id);
    if (res.ok) {
      setDetail(res.data as any);
    } else {
      toast.error("Failed to load student");
    }
    setDetailLoading(false);
  }

  async function saveDetail(payload: any) {
    if (!activeStudentId) return;
    try {
      setSavingDetail(true);
      const res = await api.students.update(activeStudentId, payload);
      if (!res.ok) throw new Error((res.data as any)?.error || "Update failed");
      toast.success("Student updated");
      setDetail(res.data as any);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    } finally {
      setSavingDetail(false);
    }
  }

  const filtered = students.filter((s) => `${s.regd_id ?? ''} ${s.name ?? ''} ${s.first_name ?? ''} ${s.last_name ?? ''} ${s.email ?? ''}`.toLowerCase().includes(query.toLowerCase()));

  function handleExport(selectedFields: FieldConfig[]) {
    try {
      exportToExcel(filtered, "students", selectedFields);
      toast.success(`Exported ${filtered.length} students to Excel`);
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">Students</CardTitle>
              <p className="text-muted-foreground mt-2">Manage student profiles, CGPA imports and requests</p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {isMain && (<Input className="w-40" placeholder="Branch (e.g., CSE)" value={branch} onChange={(e) => setBranch(e.target.value)} />)}
              <Input className="max-w-sm" placeholder="Search by name, regd id, email" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button onClick={() => setBulkUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              <Button variant="outline" onClick={() => setExportDialogOpen(true)} disabled={filtered.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <input type="file" accept=".csv,text/csv" onChange={(e) => onCsvSelected(e.target.files?.[0] ?? null)} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="hover-lift">
        <CardHeader><CardTitle>All Students</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Regd ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>CGPA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={String(s.id)}>
                    <TableCell className="font-medium">{s.regd_id}</TableCell>
                    <TableCell>{s.full_name || s.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.branch || 'NA'}</Badge>
                    </TableCell>
                    <TableCell>{s.cgpa ? Number(s.cgpa).toFixed(2) : '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(String(s.id))}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => requestData(String(s.id))}>
                        <Send className="h-4 w-4 mr-2" /> Request Data
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setDetail(null);
            setActiveStudentId(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Student Profile</SheetTitle>
          </SheetHeader>
          {detailLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!detailLoading && detail && (
            <StudentDetailPanel
              detail={detail}
              saving={savingDetail}
              onSave={saveDetail}
              onRequestData={() => requestData(String(detail.id))}
            />
          )}
        </SheetContent>
      </Sheet>

      <FieldSelectorDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        fields={studentFields}
        onExport={handleExport}
        title="Export Students to Excel"
        description="Select which student fields to include in the export"
      />

      <BulkUploadDialog
        open={bulkUploadDialogOpen}
        onOpenChange={setBulkUploadDialogOpen}
        onComplete={load}
      />
    </div>
  );
}

type DetailPanelProps = {
  detail: any;
  saving: boolean;
  onSave: (payload: any) => Promise<void> | void;
  onRequestData: () => void;
};

const StudentDetailPanel = ({ detail, saving, onSave, onRequestData }: DetailPanelProps) => {
  const [form, setForm] = useState(() => mapDetailToForm(detail));

  useEffect(() => {
    setForm(mapDetailToForm(detail));
  }, [detail]);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nameParts = form.name.trim().split(/\s+/);
    const first_name = nameParts[0] || "";
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    const payload = {
      first_name,
      last_name,
      email: form.email,
      altEmail: form.altEmail,
      phone: form.phone,
      altPhone: form.altPhone,
      branch: form.branch,
      cgpa: form.cgpa ? Number(form.cgpa) : undefined,
      resume_url: form.resumeUrl,
      breakInStudies: form.breakInStudies,
      hasBacklogs: form.hasBacklogs,
    };
    await onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
        </div>
        <div>
          <Label>Branch</Label>
          <Input value={form.branch} onChange={(e) => handleChange("branch", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
        </div>
        <div>
          <Label>Alternate Email</Label>
          <Input type="email" value={form.altEmail} onChange={(e) => handleChange("altEmail", e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
        </div>
        <div>
          <Label>Alternate Phone</Label>
          <Input value={form.altPhone} onChange={(e) => handleChange("altPhone", e.target.value)} />
        </div>
        <div>
          <Label>CGPA</Label>
          <Input value={form.cgpa} onChange={(e) => handleChange("cgpa", e.target.value)} />
        </div>
        <div>
          <Label>Resume URL</Label>
          <Input value={form.resumeUrl} onChange={(e) => handleChange("resumeUrl", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Break in studies</p>
              <p className="text-xs text-muted-foreground">Mark true if student has a documented gap.</p>
            </div>
            <Switch checked={form.breakInStudies} onCheckedChange={(v) => handleChange("breakInStudies", v)} />
          </div>
        </div>
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Pending backlogs</p>
              <p className="text-xs text-muted-foreground">Used to filter eligibility automatically.</p>
            </div>
            <Switch checked={form.hasBacklogs} onCheckedChange={(v) => handleChange("hasBacklogs", v)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-2 bg-muted/20">
        <p className="text-sm font-semibold">Addresses</p>
        <AddressSummary title="Permanent" data={detail.permanent_address} />
        <AddressSummary title="Present" data={detail.present_address} />
      </div>

      <div className="rounded-xl border p-4 space-y-3 bg-muted/10">
        <p className="text-sm font-semibold">Academic Highlights</p>
        <EducationSummary title="Degree" data={detail.education?.degree} />
        <EducationSummary title="Intermediate" data={detail.education?.inter} />
        <EducationSummary title="SSC" data={detail.education?.ssc} />
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onRequestData}>
          Request Document Update
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

const mapDetailToForm = (detail: any) => ({
  name: detail.full_name || "",
  email: detail.email || "",
  altEmail: detail.alt_email || "",
  phone: detail.phone || "",
  altPhone: detail.alt_phone || "",
  branch: detail.branch || "",
  cgpa: detail.cgpa?.toString() || "",
  resumeUrl: detail.resume_url || "",
  breakInStudies: detail.break_in_studies === true,
  hasBacklogs: detail.has_backlogs === true,
});

const AddressSummary = ({ title, data }: { title: string; data: any }) => {
  const lines = formatAddress(data);
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <p className="text-sm">{lines || "Not provided"}</p>
    </div>
  );
};

const EducationSummary = ({ title, data }: { title: string; data: any }) => {
  if (!data) return null;
  return (
    <div className="border rounded-lg p-3 text-sm bg-background">
      <p className="font-semibold mb-1">{title}</p>
      <p>{data.course_name || "Course not specified"}</p>
      {data.institute && <p className="text-muted-foreground">{data.institute}</p>}
      <p className="text-xs text-muted-foreground">
        {data.duration_from || "?"} → {data.duration_to || "?"} | {data.percentage ? `${data.percentage}%` : data.marks_obtained}
      </p>
    </div>
  );
};

const formatAddress = (data: any) => {
  if (!data) return "";
  const parts = [
    data.house,
    data.street,
    data.area,
    data.city,
    data.state,
    data.postal_code ?? data.postalCode,
    data.country,
  ]
    .filter(Boolean)
    .map((part: string) => part.trim())
    .filter(Boolean);
  return parts.join(", ");
};
