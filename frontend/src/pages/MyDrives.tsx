import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    FolderKanban,
    Search,
    Edit2,
    Trash2,
    Eye,
    Calendar,
    Building2,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Filter,
    Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { FieldSelectorDialog } from "@/components/FieldSelectorDialog";
import { exportToExcel, transformers, type FieldConfig } from "@/lib/exportUtils";

type Drive = {
    id: number;
    title: string;
    description?: string;
    company_id?: number;
    status: "draft" | "published" | "closed";
    eligibility?: {
        min_cgpa?: number;
        branches?: string[];
        location?: string;
    };
    created_at?: string;
    publish_date?: string;
    updated_at?: string;
};

type DriveWithStats = Drive & {
    companyName?: string;
    totalApplications?: number;
    pendingCount?: number;
    acceptedCount?: number;
    rejectedCount?: number;
};

type EditFormData = {
    title: string;
    description: string;
    company_id: string;
    min_cgpa: string;
    branches: string;
    location: string;
};

const STATUS_STYLES = {
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-slate-100 text-slate-700 border-slate-300",
};

export default function MyDrives() {
    const navigate = useNavigate();
    const [drives, setDrives] = useState<DriveWithStats[]>([]);
    const [companies, setCompanies] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingDrive, setEditingDrive] = useState<Drive | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({
        title: "",
        description: "",
        company_id: "none",
        min_cgpa: "7",
        branches: "",
        location: "",
    });
    const [saving, setSaving] = useState(false);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingDrive, setDeletingDrive] = useState<Drive | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    const myDriveFields: FieldConfig[] = [
        { key: "title", label: "Drive Title", defaultSelected: true },
        { key: "companyName", label: "Company Name", defaultSelected: true },
        { key: "status", label: "Status", defaultSelected: true },
        { key: "totalApplications", label: "Total Applications", defaultSelected: true, transform: transformers.number },
        { key: "pendingCount", label: "Pending", transform: transformers.number },
        { key: "acceptedCount", label: "Accepted", transform: transformers.number },
        { key: "rejectedCount", label: "Rejected", transform: transformers.number },
        { key: "eligibility.min_cgpa", label: "Minimum CGPA", transform: transformers.number },
        { key: "eligibility.branches", label: "Eligible Branches", transform: transformers.array },
        { key: "created_at", label: "Created Date", transform: transformers.date },
        { key: "publish_date", label: "Published Date", transform: transformers.date },
    ];

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            // Load companies
            const companiesRes = await api.companies.list();
            if (companiesRes.ok) {
                const companyMap: Record<number, string> = {};
                ((companiesRes.data as any[]) || []).forEach((c) => {
                    if (c.id) companyMap[Number(c.id)] = c.name ?? `Company #${c.id}`;
                });
                setCompanies(companyMap);
            }

            // Load drives
            const drivesRes = await api.drives.list();
            if (!drivesRes.ok) throw new Error("Failed to load drives");
            const drivesData = (drivesRes.data as Drive[]) || [];

            // Load applications to get stats
            const appsRes = await api.applications.list({ expand: false });
            const applications = (appsRes.ok ? (appsRes.data as any[]) : []) || [];

            // Calculate stats for each drive
            const drivesWithStats: DriveWithStats[] = drivesData.map((drive) => {
                const driveApps = applications.filter((app: any) => app.drive_id === drive.id);
                return {
                    ...drive,
                    companyName: drive.company_id ? companies[drive.company_id] : undefined,
                    totalApplications: driveApps.length,
                    pendingCount: driveApps.filter((a: any) => a.status === "pending").length,
                    acceptedCount: driveApps.filter((a: any) => a.status === "accepted").length,
                    rejectedCount: driveApps.filter((a: any) => a.status === "rejected").length,
                };
            });

            setDrives(drivesWithStats);
        } catch (error: any) {
            toast.error(error.message || "Failed to load drives");
        } finally {
            setLoading(false);
        }
    }

    const filteredDrives = useMemo(() => {
        return drives.filter((drive) => {
            const matchesSearch = drive.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || drive.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [drives, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: drives.length,
            draft: drives.filter((d) => d.status === "draft").length,
            published: drives.filter((d) => d.status === "published").length,
            closed: drives.filter((d) => d.status === "closed").length,
            totalApplications: drives.reduce((sum, d) => sum + (d.totalApplications || 0), 0),
        };
    }, [drives]);

    function openEditDialog(drive: Drive) {
        setEditingDrive(drive);
        setEditForm({
            title: drive.title,
            description: drive.description || "",
            company_id: drive.company_id ? String(drive.company_id) : "none",
            min_cgpa: String(drive.eligibility?.min_cgpa || 7),
            branches: (drive.eligibility?.branches || []).join(", "),
            location: drive.eligibility?.location || "",
        });
        setEditDialogOpen(true);
    }

    async function handleSaveEdit() {
        if (!editingDrive || !editForm.title.trim()) {
            toast.error("Title is required");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: editForm.title.trim(),
                description: editForm.description.trim() || undefined,
                company_id: editForm.company_id !== "none" ? Number(editForm.company_id) : null,
                eligibility: {
                    min_cgpa: Number(editForm.min_cgpa) || 0,
                    branches: editForm.branches
                        .split(",")
                        .map((b) => b.trim())
                        .filter(Boolean),
                    location: editForm.location.trim() || undefined,
                },
            };

            const res = await api.drives.update(String(editingDrive.id), payload);
            if (!res.ok) throw new Error((res.data as any)?.error || "Failed to update drive");

            toast.success("Drive updated successfully");
            setEditDialogOpen(false);
            await loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to update drive");
        } finally {
            setSaving(false);
        }
    }

    function openDeleteDialog(drive: Drive) {
        setDeletingDrive(drive);
        setDeleteDialogOpen(true);
    }

    async function handleDelete() {
        if (!deletingDrive) return;

        setDeleting(true);
        try {
            const res = await api.drives.delete(String(deletingDrive.id));
            if (!res.ok) {
                const errorData = res.data as any;
                if (errorData?.applicationCount) {
                    throw new Error(`Cannot delete drive with ${errorData.applicationCount} existing applications`);
                }
                throw new Error(errorData?.error || "Failed to delete drive");
            }

            toast.success("Drive deleted successfully");
            setDeleteDialogOpen(false);
            await loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete drive");
        } finally {
            setDeleting(false);
        }
    }

    function handleExport(selectedFields: FieldConfig[]) {
        try {
            exportToExcel(filteredDrives, "my_drives", selectedFields);
            toast.success(`Exported ${filteredDrives.length} drives to Excel`);
        } catch (error: any) {
            toast.error(error.message || "Failed to export data");
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <FolderKanban className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">My Drives</h1>
                </div>
                <p className="text-foreground/80">
                    Manage all your placement drives, track applications, and update details.
                </p>
                <Button
                    variant="outline"
                    onClick={() => setExportDialogOpen(true)}
                    disabled={filteredDrives.length === 0}
                    className="mt-2"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Total Drives" value={stats.total} icon={FolderKanban} />
                <StatCard label="Published" value={stats.published} icon={CheckCircle2} color="success" />
                <StatCard label="Drafts" value={stats.draft} icon={Clock} color="warning" />
                <StatCard label="Closed" value={stats.closed} icon={XCircle} color="muted" />
                <StatCard label="Applications" value={stats.totalApplications} icon={Users} color="info" />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search drives by title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-500" />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Drive List */}
            {loading ? (
                <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <Card key={idx} className="h-48 animate-pulse bg-slate-100" />
                    ))}
                </div>
            ) : filteredDrives.length === 0 ? (
                <Card className="border-dashed border-slate-300 bg-slate-50">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FolderKanban className="h-16 w-16 text-slate-300 mb-4" />
                        <CardTitle className="text-foreground mb-2">No drives found</CardTitle>
                        <CardDescription>
                            {searchQuery || statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "Create your first drive to get started"}
                        </CardDescription>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredDrives.map((drive) => (
                        <Card key={drive.id} className="bg-white border-slate-200 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-foreground">{drive.title}</h3>
                                            <Badge className={`${STATUS_STYLES[drive.status]} border`}>
                                                {drive.status}
                                            </Badge>
                                        </div>
                                        {drive.companyName && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                                <Building2 className="h-4 w-4" />
                                                {drive.companyName}
                                            </div>
                                        )}
                                        <p className="text-slate-600 text-sm line-clamp-2">
                                            {drive.description || "No description provided"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/drives/${drive.id}`)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEditDialog(drive)}
                                        >
                                            <Edit2 className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => openDeleteDialog(drive)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                {/* Drive Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <div className="text-xs">
                                            <p className="text-slate-500">Created</p>
                                            <p className="font-medium text-slate-700">
                                                {drive.created_at
                                                    ? new Date(drive.created_at).toLocaleDateString()
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        <div className="text-xs">
                                            <p className="text-slate-500">Applications</p>
                                            <p className="font-semibold text-blue-700">{drive.totalApplications || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                        <div className="text-xs">
                                            <p className="text-slate-500">Pending</p>
                                            <p className="font-semibold text-amber-700">{drive.pendingCount || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <div className="text-xs">
                                            <p className="text-slate-500">Accepted</p>
                                            <p className="font-semibold text-green-700">{drive.acceptedCount || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        <div className="text-xs">
                                            <p className="text-slate-500">Rejected</p>
                                            <p className="font-semibold text-red-700">{drive.rejectedCount || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Drive</DialogTitle>
                        <DialogDescription>Update drive details and eligibility criteria</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="Drive title"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company</label>
                            <Select
                                value={editForm.company_id}
                                onValueChange={(value) => setEditForm({ ...editForm, company_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Company</SelectItem>
                                    {Object.entries(companies).map(([id, name]) => (
                                        <SelectItem key={id} value={id}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Min CGPA</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={editForm.min_cgpa}
                                    onChange={(e) => setEditForm({ ...editForm, min_cgpa: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Input
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    placeholder="Location/Mode"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Eligible Branches (comma separated)</label>
                            <Input
                                value={editForm.branches}
                                onChange={(e) => setEditForm({ ...editForm, branches: e.target.value })}
                                placeholder="CSE, ECE, IT"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                rows={4}
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Drive description..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Drive</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deletingDrive?.title}"?
                            {deletingDrive && drives.find((d) => d.id === deletingDrive.id)?.totalApplications ? (
                                <span className="block mt-2 text-amber-600 font-medium">
                                    ⚠️ This drive has {drives.find((d) => d.id === deletingDrive.id)?.totalApplications} application(s).
                                    Deletion will fail if applications exist.
                                </span>
                            ) : null}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <FieldSelectorDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                fields={myDriveFields}
                onExport={handleExport}
                title="Export My Drives to Excel"
                description="Select which drive fields and statistics to include in the export"
            />
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color = "default",
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color?: "default" | "success" | "warning" | "muted" | "info";
}) {
    const colorClasses = {
        default: "bg-white border-slate-200 text-slate-900",
        success: "bg-emerald-50 border-emerald-200 text-emerald-900",
        warning: "bg-amber-50 border-amber-200 text-amber-900",
        muted: "bg-slate-50 border-slate-200 text-slate-700",
        info: "bg-blue-50 border-blue-200 text-blue-900",
    };

    return (
        <Card className={colorClasses[color]}>
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
