import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Notification = {
  id: number;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  created_at?: string;
};

const TYPE_COLORS: Record<string, string> = {
  drive_published: "bg-primary/10 text-primary border border-primary/20",
  announcement: "bg-amber-50 text-amber-700 border border-amber-200",
  reminder: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.notifications.list();
      if (!res.ok) throw new Error((res.data as any)?.error || "Failed to load notifications");
      setItems((res.data as Notification[]) || []);
    } catch (error: any) {
      toast.error(error.message || "Unable to fetch notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: number) {
    const res = await api.notifications.markRead(String(id));
    if (res.ok) {
      toast.success("Marked as read");
      load();
    } else {
      toast.error("Failed to update notification");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.notifications.delete(String(deleteId));
      if (res.ok) {
        toast.success("Notification deleted successfully");
        setDeleteId(null);
        load();
      } else {
        toast.error((res.data as any)?.error || "Failed to delete notification");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete notification");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Notifications log</h1>
        <p className="text-foreground/80">Every broadcast and automated alert recorded for compliance.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="h-32 animate-pulse bg-slate-100 border-slate-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50 text-center py-16">
          <CardHeader>
            <CardTitle className="text-foreground">No notifications yet</CardTitle>
            <CardDescription>Broadcast a message or publish a drive to see notifications roll in.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((notification) => {
            const created = notification.created_at ? new Date(notification.created_at).toLocaleString() : "—";
            const badgeClass = TYPE_COLORS[notification.type || ""] || "bg-slate-100 text-slate-700";
            return (
              <Card
                key={notification.id}
                className={`bg-white border-slate-200 transition hover:border-primary/40 hover:shadow-md ${notification.read ? "opacity-80" : "shadow-sm"}`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold flex items-center gap-3 text-foreground">
                        {notification.title || notification.type || "Notification"}
                        {!notification.read && <Badge className="bg-primary/10 text-primary border border-primary/20">New</Badge>}
                      </h3>
                      <p className="text-sm text-foreground/80 mt-1">{notification.message || "No message provided."}</p>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button variant="secondary" size="sm" onClick={() => markRead(notification.id)}>
                          Mark read
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(notification.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{created}</span>
                    <Badge className={badgeClass}>{notification.type || "general"}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
