import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api, apiFetch } from "@/lib/api";
import { ArrowLeft, Users, CheckCircle2, XCircle, Clock, Download, Target } from "lucide-react";
import { FieldSelectorDialog } from "@/components/FieldSelectorDialog";
import { exportToExcel, transformers, type FieldConfig } from "@/lib/exportUtils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Drive = {
    id: number;
    title: string;
    description?: string;
    company_id?: number;
    status: string;
    eligibility?: {
        min_cgpa?: number;
        branches?: string[];
        location?: string;
    };
    total_rounds?: number;
    round_names?: string[];
    created_at?: string;
    publish_date?: string;
};

type Application = {
    id: number;
    student_id: number;
    drive_id: number;
    status: "pending" | "accepted" | "rejected";
    current_round?: number;
    round_status?: Array<{
        round: number;
        status: string;
        round_name?: string;
        updated_at?: string;
    }>;
    created_at: string;
    student?: {
        id: number;
        regd_id: string;
        name: string;
        email: string;
        branch?: string;
        cgpa?: number;
        phone?: string;
    };
};

const STATUS_COLORS = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function DriveDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [drive, setDrive] = useState<Drive | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [roundDialogOpen, setRoundDialogOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [selectedRoundStatus, setSelectedRoundStatus] = useState<"accepted" | "rejected">("accepted");

    const applicationFields: FieldConfig[] = [
        { key: "student.regd_id", label: "Registration ID", defaultSelected: true },
        { key: "student.name", label: "Student Name", defaultSelected: true },
        { key: "student.email", label: "Email", defaultSelected: true },
        { key: "student.phone", label: "Phone", defaultSelected: true },
        { key: "student.branch", label: "Branch", defaultSelected: true },
        { key: "student.cgpa", label: "CGPA", defaultSelected: true, transform: transformers.number },
        { key: "status", label: "Application Status", defaultSelected: true },
        { key: "created_at", label: "Applied Date", defaultSelected: true, transform: transformers.date },
    ];

    useEffect(() => {
        loadDriveDetails();
    }, [id]);

    async function loadDriveDetails() {
        if (!id) return;
        setLoading(true);
        try {
            // Load drive details
            const driveRes = await api.drives.detail(id);
            if (driveRes.ok) {
                setDrive(driveRes.data as Drive);
            }

            // Load applications for this drive
            const appsRes = await api.applications.list({ driveId: id, expand: true });
            if (appsRes.ok) {
                setApplications((appsRes.data as Application[]) || []);
            }
        } catch (error: any) {
            toast.error("Failed to load drive details");
        } finally {
            setLoading(false);
        }
    }

    async function updateApplicationStatus(appId: number, status: "pending" | "accepted" | "rejected") {
        try {
            const res = await api.applications.updateStatus(String(appId), status);
            if (!res.ok) throw new Error("Failed to update status");
            toast.success(`Application ${status}`);
            await loadDriveDetails();
        } catch (error) {
            toast.error("Failed to update application");
        }
    }

    async function updateRoundStatus() {
        if (!selectedApp) return;
        try {
            const currentRound = selectedApp.current_round || 1;

            const res = await apiFetch(`/applications/${selectedApp.id}/round-status`, {
                method: "PUT",
                body: JSON.stringify({
                    round: currentRound,
                    status: selectedRoundStatus,
                }),
            });

            if (!res.ok) throw new Error((res.data as any)?.error || "Failed to update round status");

            toast.success(`Round ${currentRound} ${selectedRoundStatus}`);
            setRoundDialogOpen(false);
            setSelectedApp(null);
            await loadDriveDetails();
        } catch (error: any) {
            toast.error(error.message || "Failed to update round status");
        }
    }

    function handleExport(selectedFields: FieldConfig[]) {
        try {
            const filename = `${drive?.title?.replace(/\s+/g, '_')}_applications` || "drive_applications";
            exportToExcel(applications, filename, selectedFields);
            toast.success(`Exported ${applications.length} applications to Excel`);
        } catch (error: any) {
            toast.error(error.message || "Failed to export data");
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/drives")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                </div>
                <Card className="h-60 animate-pulse bg-slate-100" />
            </div>
        );
    }

    if (!drive) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/drives")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Drive not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const stats = {
        total: applications.length,
        pending: applications.filter((a) => a.status === "pending").length,
        accepted: applications.filter((a) => a.status === "accepted").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/drives")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Drives
                </Button>
            </div>

            {/* Drive Information */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-3xl">{drive.title}</CardTitle>
                            <CardDescription className="mt-2">{drive.description || "No description available"}</CardDescription>
                        </div>
                        <Badge className={`${drive.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {drive.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Min CGPA</p>
                            <p className="text-2xl font-bold">{drive.eligibility?.min_cgpa || "Any"}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Eligible Branches</p>
                            <p className="text-lg font-semibold">{drive.eligibility?.branches?.join(", ") || "All"}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="text-lg font-semibold">{drive.eligibility?.location || "Not specified"}</p>
                        </div>
                    </div>
                    {drive.total_rounds && drive.total_rounds > 1 && (
                        <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                <p className="text-sm font-semibold text-blue-900">Multi-Round Recruitment</p>
                            </div>
                            <p className="text-lg font-bold text-blue-700">{drive.total_rounds} Rounds</p>
                            {drive.round_names && drive.round_names.length > 0 && (
                                <div className="flex gap-2 flex-wrap mt-3">
                                    {drive.round_names.map((name, i) => (
                                        <Badge key={i} variant="outline" className="bg-white">
                                            R{i + 1}: {name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Application Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard icon={Users} label="Total Applications" value={stats.total} color="bg-blue-500" />
                <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-amber-500" />
                <StatCard icon={CheckCircle2} label="Accepted" value={stats.accepted} color="bg-green-500" />
                <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="bg-red-500" />
            </div>

            {/* Registered Students */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Registered Students</CardTitle>
                            <CardDescription>{applications.length} student(s) have applied to this drive</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExportDialogOpen(true)}
                            disabled={applications.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Applications
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {applications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="mx-auto h-12 w-12 mb-4 opacity-20" />
                            <p>No applications yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((app) => (
                                <div key={app.id} className="p-4 border rounded-lg hover:bg-slate-50 transition">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{app.student?.name || "Unknown Student"}</h3>
                                                <Badge className={STATUS_COLORS[app.status]}>{app.status.toUpperCase()}</Badge>
                                                {drive?.total_rounds && drive.total_rounds > 1 && (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        Round {app.current_round || 1}/{drive.total_rounds}
                                                    </Badge>
                                                )}
                                            </div>
                                            {/* Show round progress */}
                                            {drive?.total_rounds && drive.total_rounds > 1 && app.round_status && app.round_status.length > 0 && (
                                                <div className="flex gap-2 flex-wrap mb-2">
                                                    {app.round_status.map((rs) => (
                                                        <Badge
                                                            key={rs.round}
                                                            className={rs.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                                                        >
                                                            {rs.round_name || `R${rs.round}`}: {rs.status}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="grid gap-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Regd ID:</span>
                                                    <span>{app.student?.regd_id || "N/A"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Email:</span>
                                                    <span>{app.student?.email || "N/A"}</span>
                                                </div>
                                                {app.student?.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Phone:</span>
                                                        <span>{app.student.phone}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-4">
                                                    {app.student?.branch && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">Branch:</span>
                                                            <span>{app.student.branch}</span>
                                                        </div>
                                                    )}
                                                    {app.student?.cgpa && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">CGPA:</span>
                                                            <span>{app.student.cgpa}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Applied:</span>
                                                    <span>{new Date(app.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {drive?.total_rounds && drive.total_rounds > 1 && app.status === "pending" && (
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    onClick={() => {
                                                        setSelectedApp(app);
                                                        setRoundDialogOpen(true);
                                                    }}
                                                >
                                                    Update Round
                                                </Button>
                                            )}
                                            {(!drive?.total_rounds || drive.total_rounds === 1) && app.status === "pending" && (
                                                <>
                                                    <Button size="sm" variant="default" onClick={() => updateApplicationStatus(app.id, "accepted")}>
                                                        Accept
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus(app.id, "rejected")}>
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {app.status === "accepted" && (
                                                <Button size="sm" variant="outline" onClick={() => updateApplicationStatus(app.id, "pending")}>
                                                    Reset
                                                </Button>
                                            )}
                                            {app.status === "rejected" && (
                                                <Button size="sm" variant="outline" onClick={() => updateApplicationStatus(app.id, "pending")}>
                                                    Reset
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <FieldSelectorDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                fields={applicationFields}
                onExport={handleExport}
                title="Export Student Applications"
                description={`Export applications for "${drive?.title}" drive`}
            />

            {/* Round Status Update Dialog */}
            <Dialog open={roundDialogOpen} onOpenChange={setRoundDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Round Status</DialogTitle>
                        <DialogDescription>
                            {selectedApp && (
                                <span>
                                    Updating round {selectedApp.current_round || 1} for{" "}
                                    <strong>{selectedApp.student?.name}</strong>
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedApp && drive && (
                            <div className="space-y-3">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Current Round</p>
                                    <p className="text-lg font-semibold">
                                        Round {selectedApp.current_round || 1} of {drive.total_rounds}
                                        {drive.round_names && drive.round_names[(selectedApp.current_round || 1) - 1] && (
                                            <span className="text-sm font-normal text-muted-foreground"> — {drive.round_names[(selectedApp.current_round || 1) - 1]}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Round Result</Label>
                                    <Select value={selectedRoundStatus} onValueChange={(v: "accepted" | "rejected") => setSelectedRoundStatus(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="accepted">✓ Accept</SelectItem>
                                            <SelectItem value="rejected">✗ Reject</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedRoundStatus === "accepted" && selectedApp.current_round && selectedApp.current_round < (drive.total_rounds || 1) && (
                                    <p className="text-sm text-blue-600">
                                        → Student will advance to Round {(selectedApp.current_round || 1) + 1}
                                    </p>
                                )}
                                {selectedRoundStatus === "accepted" && selectedApp.current_round === (drive.total_rounds || 1) && (
                                    <p className="text-sm text-green-600">
                                        → Student will be ACCEPTED (final round)
                                    </p>
                                )}
                                {selectedRoundStatus === "rejected" && (
                                    <p className="text-sm text-red-600">
                                        → Application will be REJECTED
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRoundDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={updateRoundStatus}>
                            Confirm
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
    return (
        <Card>
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
