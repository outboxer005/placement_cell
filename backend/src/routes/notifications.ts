import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export function notificationsRoutes(db: SupabaseClient) {
  const r = Router();
  r.use(requireAuth);

  r.get("/", async (req, res) => {
    const user = (req as any).user as { role?: string; sub?: string };
    const studentId = req.query.studentId as string | undefined;
    const me = req.query.me === "1" || req.query.me === "true";
    const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);
    const offset = Number(req.query.offset ?? 0) || 0;

    let query = db.from("notifications").select("*").order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    if (user?.role === "student" && user?.sub) {
      query = query.eq("student_id", Number(user.sub));
    } else if (me && user?.sub) {
      query = query.eq("student_id", Number(user.sub));
    } else if (studentId) {
      query = query.eq("student_id", Number(studentId));
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  r.post("/:id/read", async (req, res) => {
    const id = Number(req.params.id);
    const { error } = await db.from("notifications").update({ read: true }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  r.post("/broadcast", async (req, res) => {
    const user = (req as any).user as { role: string; branch?: string | null };

    const schema = z.object({
      title: z.string().max(200).optional(),
      message: z.string().min(1).max(2000),
      audience: z
        .object({
          all: z.boolean().optional(),
          branches: z.array(z.string()).optional(),
          regdIds: z.array(z.string()).optional(),
          status: z.enum(["pending", "accepted", "rejected"]).optional(),
        })
        .partial()
        .default({}),
      driveId: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });
    const { title: t, message, audience, driveId } = parsed.data;
    const title = t || "Announcement";

    const studentIds = new Set<number>();
    const enforceBranch = user?.role === "branch-admin" ? user.branch : null;

    const selectStudents = async (filters: any) => {
      let studentQuery = db.from("students").select("id");
      if (filters.branch) studentQuery = studentQuery.in("branch", filters.branch);
      if (filters.regd_id) studentQuery = studentQuery.in("regd_id", filters.regd_id);

      const { data, error } = await studentQuery;
      if (error) throw new Error(error.message);
      data?.forEach((row) => studentIds.add(Number(row.id)));
    };

    if (audience.all) {
      await selectStudents(enforceBranch ? { branch: [enforceBranch] } : {});
    }

    if (Array.isArray(audience.branches) && audience.branches.length) {
      const branches = enforceBranch ? [enforceBranch] : audience.branches;
      await selectStudents({ branch: branches });
    }

    if (Array.isArray(audience.regdIds) && audience.regdIds.length) {
      await selectStudents(
        enforceBranch
          ? { regd_id: audience.regdIds, branch: [enforceBranch] }
          : { regd_id: audience.regdIds }
      );
    }

    if (driveId) {
      let appQuery = db.from("applications").select("student_id").eq("drive_id", Number(driveId));
      if (audience.status) appQuery = appQuery.eq("status", audience.status);
      const { data: apps, error: appError } = await appQuery;
      if (appError) throw new Error(appError.message);

      const ids = apps?.map((a) => Number(a.student_id)) ?? [];
      if (enforceBranch) {
        if (ids.length) {
          const { data: filtered, error: filterError } = await db
            .from("students")
            .select("id")
            .in("id", ids)
            .eq("branch", enforceBranch);
          if (filterError) throw new Error(filterError.message);
          filtered?.forEach((row) => studentIds.add(Number(row.id)));
        }
      } else {
        ids.forEach((id) => studentIds.add(id));
      }
    }

    if (!studentIds.size) return res.json({ ok: true, targeted: 0, inserted: 0 });

    const docs = Array.from(studentIds).map((sid) => ({
      student_id: sid,
      type: "announcement",
      title,
      message,
      payload: driveId ? { drive_id: Number(driveId) } : {},
      read: false,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await db.from("notifications").insert(docs);
    if (insertError) return res.status(500).json({ error: insertError.message });

    // Send push notifications to all targeted students
    const { sendPushToStudents } = await import("../services/fcm-service");
    sendPushToStudents(
      db,
      Array.from(studentIds),
      title,
      message,
      driveId ? { drive_id: driveId.toString(), type: "announcement" } : { type: "announcement" }
    ).catch(err => console.error("Failed to send push notifications:", err));

    res.json({ ok: true, targeted: studentIds.size, inserted: docs.length });
  });

  r.put("/:id", async (req, res) => {
    try {
      const user = (req as any).user as { role: string };
      if (!user?.role || !["main-admin", "branch-admin"].includes(user.role)) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const notificationId = Number(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      const { title, message, payload } = req.body || {};
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (message !== undefined) updates.message = message;
      if (payload !== undefined) updates.payload = payload;

      if (!Object.keys(updates).length) {
        return res.json({ ok: true, message: "No updates provided" });
      }

      const { data, error } = await db
        .from("notifications")
        .update(updates)
        .eq("id", notificationId)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to update notification" });
    }
  });

  // DELETE endpoint - Allow admins to delete notifications
  r.delete("/:id", async (req, res) => {
    try {
      const user = (req as any).user as { role: string };

      // Only admins can delete notifications
      if (!user?.role || !["main-admin", "branch-admin"].includes(user.role)) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const notificationId = Number(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      // Delete the notification
      const { error } = await db
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ ok: true, message: "Notification deleted successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to delete notification" });
    }
  });

  r.delete("/bulk", async (req, res) => {
    try {
      const user = (req as any).user as { role: string };
      if (!user?.role || !["main-admin", "branch-admin"].includes(user.role)) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter((id: number) => !isNaN(id)) : [];
      if (!ids.length) {
        return res.status(400).json({ error: "No valid IDs provided" });
      }

      const { error } = await db.from("notifications").delete().in("id", ids);
      if (error) return res.status(500).json({ error: error.message });

      res.json({ ok: true, message: `${ids.length} notifications deleted`, count: ids.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to bulk delete notifications" });
    }
  });

  return r;
}

