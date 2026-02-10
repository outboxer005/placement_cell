import { useEffect, useState } from "react";
import { UserPlus, Shield, Trash2, Mail, Lock, Building, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { FieldSelectorDialog } from "@/components/FieldSelectorDialog";
import { exportToExcel, type FieldConfig } from "@/lib/exportUtils";

export default function AdminManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "branch-admin", branch: "" });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const adminFields: FieldConfig[] = [
    { key: "name", label: "Name", defaultSelected: true },
    { key: "email", label: "Email", defaultSelected: true },
    { key: "role", label: "Role", defaultSelected: true },
    { key: "branch", label: "Branch", defaultSelected: true },
    { key: "status", label: "Status", defaultSelected: true },
  ];

  async function loadAdmins() {
    const res = await api.admins.list();
    if (res.ok) setAdmins(res.data as any[]);
  }

  useEffect(() => { loadAdmins(); }, []);

  const handleCreateAdmin = async () => {
    if (!formData.name || !formData.email || !formData.password) return toast.error("Fill all fields");
    if (formData.role === "branch-admin" && !formData.branch) return toast.error("Branch required");
    const trimmedEmail = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await api.admins.create({ ...formData, email: trimmedEmail });
      if (!res.ok) throw new Error((res.data as any)?.error || "Failed");
      toast.success("Admin created");
      setIsDialogOpen(false);
      setFormData({ name: "", email: "", password: "", role: "branch-admin", branch: "" });
      loadAdmins();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const handleDeleteAdmin = async (id: string) => {
    const res = await api.admins.remove(id);
    if (res.ok) { toast.success("Removed"); loadAdmins(); } else toast.error("Failed");
  };

  function handleExport(selectedFields: FieldConfig[]) {
    try {
      exportToExcel(admins, "admin_list", selectedFields);
      toast.success(`Exported ${admins.length} administrators to Excel`);
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Admin Management</h1>
          <p className="text-foreground/80 mt-2">Only main admin can create branch admins</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(true)} disabled={admins.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary"><UserPlus className="h-4 w-4 mr-2" />Create Admin</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Administrator</DialogTitle>
                <DialogDescription>Main admin only</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input id="email" type="email" className="pl-10 border-slate-300 focus:border-primary focus:ring-primary" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.trim().toLowerCase() })} placeholder="admin@vignan.edu" /></div></div>
                <div className="grid gap-2"><Label htmlFor="password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" /><Input id="password" type="password" className="pl-10" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div></div>
                <div className="grid gap-2"><Label>Role</Label><Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="branch-admin">Branch Admin</SelectItem><SelectItem value="main-admin">Main Admin</SelectItem></SelectContent></Select></div>
                {formData.role === "branch-admin" && (<div className="grid gap-2"><Label>Branch</Label><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" /><Select value={formData.branch} onValueChange={(v) => setFormData({ ...formData, branch: v })}><SelectTrigger className="pl-10"><SelectValue placeholder="Select branch" /></SelectTrigger><SelectContent><SelectItem value="CSE">CSE</SelectItem><SelectItem value="ECE">ECE</SelectItem><SelectItem value="IT">IT</SelectItem><SelectItem value="MECH">MECH</SelectItem><SelectItem value="CIVIL">CIVIL</SelectItem><SelectItem value="EEE">EEE</SelectItem></SelectContent></Select></div></div>)}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAdmin} disabled={loading} className="gradient-primary">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="hover-lift">
        <CardHeader><CardTitle>Administrators</CardTitle><CardDescription>Manage all administrator accounts</CardDescription></CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id ?? a.email}>
                    <TableCell className="font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />{a.name}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell><Badge variant={a.role === "main-admin" ? "default" : "outline"}>{a.role}</Badge></TableCell>
                    <TableCell>{a.branch || "-"}</TableCell>
                    <TableCell><Badge variant={a.status === "active" ? "default" : "destructive"}>{a.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {a.role !== "main-admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (!a.id) return toast.error("Unable to delete this admin (missing id)");
                            handleDeleteAdmin(String(a.id));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <FieldSelectorDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        fields={adminFields}
        onExport={handleExport}
        title="Export Admin List to Excel"
        description="Select which admin fields to include in the export"
      />
    </div>
  );
}
