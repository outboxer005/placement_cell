import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Announcements() {
  const { role, branch } = useAuth();
  const isMain = role === "main-admin";
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"all" | "branches" | "regdIds" | "driveApplicants">(isMain ? "all" : "driveApplicants");
  const [branches, setBranches] = useState("");
  const [regdIds, setRegdIds] = useState("");
  const [drives, setDrives] = useState<any[]>([]);
  const [driveId, setDriveId] = useState<string>("");
  const [status, setStatus] = useState<string>("any");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.drives.list();
      if (res.ok) setDrives(res.data as any[]);
    })();
  }, []);

  async function send() {
    try {
      setSending(true);
      const audience: any = {};
      if (mode === "all" && isMain) audience.all = true; // only main-admin can truly send to all
      if (mode === "branches") audience.branches = (isMain ? branches : branch || "").split(",").map(s => s.trim()).filter(Boolean);
      if (mode === "regdIds") audience.regdIds = regdIds.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
      if (mode === "driveApplicants") {
        audience.status = status && status !== "any" ? status : undefined;
      }
      const body: any = { title: title || "Announcement", message, audience };
      if (mode === "driveApplicants" && driveId) body.driveId = driveId;
      const res = await api.notifications.broadcast(body);
      if (!res.ok) throw new Error((res.data as any)?.error || "Failed to send");
      const d = res.data as any;
      toast.success(`Sent to ${d.inserted} recipients`);
      setMessage("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Notifications</h1>
        <p className="text-foreground/80 mt-2">
          {isMain ? "Send to all students, selected branches, regd IDs, or drive applicants." : `Send only to your branch (${branch || "-"}) or its applicants.`}
        </p>
      </div>

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                <SelectContent>
                  {isMain && <SelectItem value="all">All Students</SelectItem>}
                  <SelectItem value="branches">By Branches</SelectItem>
                  <SelectItem value="regdIds">By Regd IDs</SelectItem>
                  <SelectItem value="driveApplicants">Drive Applicants</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === "branches" && (
            <div className="space-y-2">
              <Label htmlFor="branches">{isMain ? "Branches (comma-separated)" : "Your Branch"}</Label>
              <Input id="branches" value={isMain ? branches : (branch || "")} onChange={(e) => isMain ? setBranches(e.target.value) : undefined} placeholder={isMain ? "CSE, ECE, IT" : ""} disabled={!isMain} />
            </div>
          )}

          {mode === "regdIds" && (
            <div className="space-y-2">
              <Label htmlFor="regdIds">Regd IDs (comma or newline separated)</Label>
              <Textarea id="regdIds" rows={4} value={regdIds} onChange={(e) => setRegdIds(e.target.value)} placeholder="20WH1A05A1, 20WH1A05B2\n20WH1A05C3" />
            </div>
          )}

          {mode === "driveApplicants" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Drive</Label>
                <Select value={driveId} onValueChange={setDriveId}>
                  <SelectTrigger><SelectValue placeholder="Select drive" /></SelectTrigger>
                  <SelectContent>
                    {drives
                      .filter((d) => d.id !== undefined && d.id !== null)
                      .map((d) => (
                        <SelectItem key={String(d.id)} value={String(d.id)}>
                          {d.title || `Drive #${d.id}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status (optional)</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." />
          </div>

          <div className="flex justify-end">
            <Button onClick={send} disabled={sending || !message} className="gradient-primary">{sending ? "Sending..." : "Send"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

