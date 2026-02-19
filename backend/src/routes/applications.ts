import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

function toId(value: string | number) {
  return typeof value === "string" ? Number(value) : value;
}

export function applicationsRoutes(db: SupabaseClient) {
  const r = Router();
  r.use(requireAuth);

  r.get("/", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null; sub?: string };
      const driveId = req.query.drive_id as string | undefined;
      const status = req.query.status as string | undefined;
      const branchQ = req.query.branch as string | undefined;
      const expand = req.query.expand === "1" || req.query.expand === "true";
      const limit = Math.min(Number(req.query.limit ?? 100) || 100, 500);
      const offset = Number(req.query.offset ?? 0) || 0;

      let query = db.from("applications").select("*");

      if (driveId) query = query.eq("drive_id", Number(driveId));
      if (status) query = query.eq("status", status);
      if (user?.role === "student" && user?.sub) {
        query = query.eq("student_id", toId(user.sub));
      }

      query = query.order("applied_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      // If expand is true, manually fetch student and drive data
      if (expand && data && data.length > 0) {
        const studentIds = [...new Set(data.map((app: any) => app.student_id))];
        const driveIds = [...new Set(data.map((app: any) => app.drive_id))];

        const [{ data: students }, { data: drives }] = await Promise.all([
          db.from("students").select("id, first_name, last_name, regd_id, branch, cgpa").in("id", studentIds),
          db.from("drives").select("id, title").in("id", driveIds),
        ]);

        const studentMap = new Map(students?.map((s: any) => [s.id, s]) || []);
        const driveMap = new Map(drives?.map((d: any) => [d.id, d]) || []);

        const expandedData = data.map((app: any) => {
          const student = studentMap.get(app.student_id);
          const drive = driveMap.get(app.drive_id);

          if (student) {
            const firstName = student.first_name || '';
            const lastName = student.last_name || '';
            student.full_name = lastName ? `${firstName} ${lastName}`.trim() : firstName.trim();
            student.name = student.full_name;
          }

          return {
            ...app,
            student: student || null,
            drive: drive || null,
          };
        });

        return res.json(expandedData);
      }

      res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to fetch applications" });
    }
  });

  r.post("/", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; sub: string };
      const body = req.body || {};
      if (!body.drive_id) return res.status(400).json({ error: "Missing drive_id" });
      if (user?.role === "student") {
        body.student_id = toId(user.sub);
      } else if (!body.student_id) {
        return res.status(400).json({ error: "Missing student_id" });
      }
      const driveIdNum = Number(body.drive_id);
      const studentIdNum = toId(body.student_id);

      const { data: driveRows, error: driveError } = await db.from("drives").select("*").eq("id", driveIdNum).maybeSingle();
      if (driveError) return res.status(500).json({ error: driveError.message });
      if (!driveRows) return res.status(404).json({ error: "Drive not found" });

      const { data: studentRows, error: studentError } = await db.from("students").select("*").eq("id", studentIdNum).maybeSingle();
      if (studentError) return res.status(500).json({ error: studentError.message });
      if (!studentRows) return res.status(404).json({ error: "Student not found" });

      const drive = driveRows;
      const student = studentRows;
      const eligibility = drive.eligibility || {};
      const minCg = typeof eligibility.min_cgpa === "number" ? eligibility.min_cgpa : undefined;
      const allowedBranches: string[] | undefined = Array.isArray(eligibility.branches) ? eligibility.branches : undefined;
      if (allowedBranches && allowedBranches.length && student.branch && !allowedBranches.includes(student.branch)) {
        return res.status(403).json({ error: "Not eligible: branch" });
      }
      if (typeof minCg === "number" && typeof student.cgpa === "number" && student.cgpa < minCg) {
        return res.status(403).json({ error: "Not eligible: CGPA" });
      }

      const statusValue = body.status || "pending";
      const history = [
        {
          status: statusValue,
          changed_at: new Date().toISOString(),
          changed_by: user?.role === "student" ? Number(user.sub) : null,
        },
      ];

      const { data: inserted, error: insertError } = await db
        .from("applications")
        .insert({
          drive_id: driveIdNum,
          student_id: studentIdNum,
          status: statusValue,
          status_history: history,
          applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (insertError) {
        if (insertError.code === "23505") return res.status(409).json({ error: "Already applied" });
        throw new Error(insertError.message);
      }
      return res.status(201).json(inserted);
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Apply failed" });
    }
  });

  // Student stats — must come before /:id routes
  r.get("/me/stats", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; sub?: string };
      if (user?.role !== "student" || !user?.sub) {
        return res.status(403).json({ error: "Student access only" });
      }
      const studentId = Number(user.sub);
      const { data, error } = await db
        .from("applications")
        .select("status")
        .eq("student_id", studentId);
      if (error) return res.status(500).json({ error: error.message });
      const rows = data ?? [];
      return res.json({
        total: rows.length,
        pending: rows.filter((r: any) => r.status === "pending").length,
        accepted: rows.filter((r: any) => r.status === "accepted").length,
        rejected: rows.filter((r: any) => r.status === "rejected").length,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to fetch stats" });
    }
  });

  r.put("/:id/status", async (req, res) => {

    try {
      const user = (req as any).user as { role: string; sub?: string };
      if (user?.role !== "main-admin" && user?.role !== "branch-admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const id = Number(req.params.id);
      const status = (req.body?.status as string | undefined)?.trim();
      if (!id || !status) return res.status(400).json({ error: "Missing id/status" });
      const allowed = new Set(["pending", "accepted", "rejected"]);
      if (!allowed.has(status)) return res.status(400).json({ error: "Invalid status" });

      const { data: appRows, error: fetchError } = await db.from("applications").select("*").eq("id", id).maybeSingle();
      if (fetchError) return res.status(500).json({ error: fetchError.message });
      if (!appRows) return res.status(404).json({ error: "Not found" });

      const history = Array.isArray(appRows.status_history) ? appRows.status_history : [];
      const entry = { status, changed_at: new Date().toISOString(), changed_by: user?.sub ? Number(user.sub) : null };
      history.push(entry);

      const { error: updateError } = await db
        .from("applications")
        .update({ status, status_history: history, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) return res.status(500).json({ error: updateError.message });

      try {
        const { data: drive, error: driveFetchError } = await db.from("drives").select("title").eq("id", appRows.drive_id).maybeSingle();
        if (driveFetchError) console.error("Failed to fetch drive for notification:", driveFetchError.message);

        const { error: notifError } = await db.from("notifications").insert({
          student_id: appRows.student_id,
          type: "application_status",
          title: "Application Status Updated",
          message: `Your application for ${drive?.title || "drive"} is now ${status}`,
          payload: { application_id: id, drive_id: appRows.drive_id, status },
          read: false,
          created_at: new Date().toISOString(),
        });
        if (notifError) console.error("Failed to create notification for status update:", notifError.message);

        // Send push notification
        const { sendPushToStudent } = await import("../services/fcm-service");
        sendPushToStudent(
          db,
          appRows.student_id,
          "Application Status Updated",
          `Your application for ${drive?.title || "a drive"} is now ${status}`,
          {
            application_id: id.toString(),
            drive_id: appRows.drive_id.toString(),
            type: "application_status",
            status
          }
        ).catch((err: any) => console.error("Failed to send push notification:", err));
      } catch (notifError) {
        console.error("Failed to create notification for status update:", notifError);
      }

      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Update failed" });
    }
  });

  // Update round status for multi-round recruitment
  r.put("/:id/round-status", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; sub?: string };
      if (user?.role !== "main-admin" && user?.role !== "branch-admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const id = Number(req.params.id);
      const roundNumber = Number(req.body?.round);
      const roundStatus = (req.body?.status as string | undefined)?.trim();

      if (!id || !roundNumber || !roundStatus) {
        return res.status(400).json({ error: "Missing id/round/status" });
      }

      const allowedStatus = new Set(["accepted", "rejected"]);
      if (!allowedStatus.has(roundStatus)) {
        return res.status(400).json({ error: "Invalid round status. Use 'accepted' or 'rejected'" });
      }

      // Fetch application first, then fetch the drive for that application
      const { data: appRows, error: fetchError } = await db.from("applications").select("*").eq("id", id).maybeSingle();

      if (fetchError) return res.status(500).json({ error: fetchError.message });
      if (!appRows) return res.status(404).json({ error: "Application not found" });

      const drive = await db.from("drives").select("total_rounds, round_names, title").eq("id", appRows.drive_id).maybeSingle();
      const totalRounds = drive.data?.total_rounds || 1;
      const roundNames = drive.data?.round_names || [];

      if (roundNumber < 1 || roundNumber > totalRounds) {
        return res.status(400).json({ error: `Invalid round number. Drive has ${totalRounds} rounds` });
      }

      // Update round status array
      const roundStatusArray = Array.isArray(appRows.round_status) ? appRows.round_status : [];
      const roundName = roundNames[roundNumber - 1] || `Round ${roundNumber}`;

      const newRoundEntry = {
        round: roundNumber,
        status: roundStatus,
        round_name: roundName,
        updated_at: new Date().toISOString(),
        updated_by: user?.sub ? Number(user.sub) : null,
      };

      roundStatusArray.push(newRoundEntry);

      // Determine overall application status and next round
      let newCurrentRound = appRows.current_round;
      let newOverallStatus = appRows.status;

      if (roundStatus === "rejected") {
        // Rejected in any round = overall rejected
        newOverallStatus = "rejected";
      } else if (roundStatus === "accepted") {
        if (roundNumber >= totalRounds) {
          // Accepted in final round = overall accepted
          newOverallStatus = "accepted";
        } else {
          // Move to next round
          newCurrentRound = roundNumber + 1;
        }
      }

      // Update application
      const { error: updateError } = await db
        .from("applications")
        .update({
          current_round: newCurrentRound,
          round_status: roundStatusArray,
          status: newOverallStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) return res.status(500).json({ error: updateError.message });

      // Send notification
      try {
        const statusText = roundStatus === "accepted" ? "Accepted" : "Rejected";
        const title = `${roundName} ${statusText}`;
        const message = `You have been ${roundStatus} in ${roundName} for ${drive.data?.title || "the drive"}`;

        await db.from("notifications").insert({
          student_id: appRows.student_id,
          type: "round_update",
          title,
          message,
          payload: {
            application_id: id,
            drive_id: appRows.drive_id,
            round: roundNumber,
            round_status: roundStatus,
            overall_status: newOverallStatus
          },
          read: false,
          created_at: new Date().toISOString(),
        });

        // Send push notification
        const { sendPushToStudent } = await import("../services/fcm-service");
        sendPushToStudent(
          db,
          appRows.student_id,
          title,
          message,
          {
            application_id: id.toString(),
            drive_id: appRows.drive_id.toString(),
            type: "round_update",
            round: roundNumber.toString(),
            status: roundStatus
          }
        ).catch((err: any) => console.error("Failed to send push notification:", err));
      } catch (notifError) {
        console.error("Failed to create notification for round update:", notifError);
      }

      return res.json({
        ok: true,
        current_round: newCurrentRound,
        overall_status: newOverallStatus
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Round update failed" });
    }
  });

  r.delete("/:id", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; sub: string; branch?: string | null };
      const id = Number(req.params.id);

      const { data: app, error: fetchError } = await db
        .from("applications")
        .select("*, student:students(branch)")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) return res.status(500).json({ error: fetchError.message });
      if (!app) return res.status(404).json({ error: "Not found" });

      // Students can only delete their own pending applications
      if (user?.role === "student") {
        const studentId = Number(user.sub);
        if (app.student_id !== studentId) return res.status(403).json({ error: "Forbidden" });
        if (app.status !== "pending") return res.status(400).json({ error: "Only pending applications can be withdrawn" });
      }

      // Branch admin can only delete applications from their branch students
      if (user?.role === "branch-admin" && user.branch) {
        const studentBranch = (app as any).student?.branch;
        if (studentBranch && studentBranch !== user.branch) {
          return res.status(403).json({ error: "Forbidden: Cannot delete application from another branch" });
        }
      }

      // Main admin can delete any application
      if (user?.role !== "main-admin" && user?.role !== "branch-admin" && user?.role !== "student") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { error: deleteError } = await db.from("applications").delete().eq("id", id);
      if (deleteError) return res.status(500).json({ error: deleteError.message });
      return res.json({ ok: true, message: "Application deleted successfully" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Delete failed" });
    }
  });

  r.put("/bulk-status", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; sub?: string };
      if (user?.role !== "main-admin" && user?.role !== "branch-admin") return res.status(403).json({ error: "Forbidden" });
      const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : [];
      const status = (req.body?.status as string | undefined)?.trim();
      if (!ids.length || !status) return res.status(400).json({ error: "Missing ids/status" });
      const allowed = new Set(["pending", "accepted", "rejected"]);
      if (!allowed.has(status)) return res.status(400).json({ error: "Invalid status" });

      const now = new Date().toISOString();
      const { data: updatedApps, error: fetchUpdatedError } = await db.from("applications").select("*").in("id", ids);
      if (fetchUpdatedError) return res.status(500).json({ error: fetchUpdatedError.message });

      const updatePromises =
        updatedApps?.map(async (app) => {
          const history = Array.isArray(app.status_history) ? app.status_history : [];
          const entry = { status, changed_at: now, changed_by: user?.sub ? Number(user.sub) : null };
          history.push(entry);
          return db.from("applications").update({ status, status_history: history, updated_at: now }).eq("id", app.id);
        }) ?? [];

      const results = await Promise.all(updatePromises);
      const errors = results.filter((r) => r.error).map((r) => r.error?.message);
      if (errors.length) console.error("Bulk update errors:", errors);

      try {
        for (const app of updatedApps ?? []) {
          try {
            const { data: drive, error: driveFetchError } = await db.from("drives").select("title").eq("id", app.drive_id).maybeSingle();
            if (driveFetchError) console.error("Failed to fetch drive for notification:", driveFetchError.message);

            await db.from("notifications").insert({
              student_id: app.student_id,
              type: "application_status",
              title: "Application Status Updated",
              message: `Your application for ${drive?.title || "drive"} is now ${status}`,
              payload: { application_id: app.id, drive_id: app.drive_id, status },
              read: false,
              created_at: now,
            });
          } catch (notifError) {
            console.error("Failed to create notification for app", app.id, notifError);
          }
        }

        // Send push notifications to all affected students
        const { sendPushToStudents } = await import("../services/fcm-service");
        const studentIds = updatedApps?.map(app => app.student_id) ?? [];
        if (studentIds.length > 0) {
          sendPushToStudents(
            db,
            studentIds,
            "Application Status Updated",
            `Your application status has been updated to ${status}`,
            { type: "application_status", status }
          ).catch((err: any) => console.error("Failed to send push notifications:", err));
        }
      } catch (error) {
        console.error("Failed to create notifications for bulk update:", error);
      }

      return res.json({ ok: true, modified: results.filter((r) => !r.error).length });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Bulk update failed" });
    }
  });

  r.get("/me/stats", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; sub: string };
      if (user?.role !== "student") return res.status(403).json({ error: "Forbidden" });
      const studentId = Number(user.sub);

      const { data, error } = await db
        .from("applications")
        .select("status", { count: "exact" })
        .eq("student_id", studentId);
      if (error) return res.status(500).json({ error: error.message });

      const out: any = { pending: 0, accepted: 0, rejected: 0 };
      data?.forEach((app: any) => {
        if (app.status in out) out[app.status]++;
      });
      out.total = data?.length ?? 0;
      return res.json(out);
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Stats failed" });
    }
  });

  return r;
}

