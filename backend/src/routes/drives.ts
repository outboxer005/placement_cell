import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eligibleStudentIdsForDrive } from "../services/eligibility";

export function drivesRoutes(db: SupabaseClient) {
  const r = Router();
  r.use(requireAuth);

  r.get("/", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      const status = req.query.status as string | undefined;
      const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);
      const offset = Number(req.query.offset ?? 0) || 0;

      let query = db
        .from("drives")
        .select(`
          *,
          company:companies(id, name, info)
        `)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      // Filter drives by branch for branch admins and students
      let filteredData = data;

      // Branch admin: only see drives for their branch
      if (user?.role === "branch-admin" && user?.branch && data) {
        filteredData = data.filter((drive: any) => {
          const eligibility = drive.eligibility || {};
          const allowedBranches = Array.isArray(eligibility.branches) ? eligibility.branches : [];
          return allowedBranches.length === 0 || allowedBranches.includes(user.branch!);
        });
      }

      // Student: only see drives for their branch
      if (user?.role === "student" && user?.branch && data) {
        filteredData = data.filter((drive: any) => {
          const eligibility = drive.eligibility || {};
          const allowedBranches = Array.isArray(eligibility.branches) ? eligibility.branches : [];
          // If no branches specified, drive is for all branches
          if (allowedBranches.length === 0) return true;
          // Check if student's branch is in the allowed branches
          return allowedBranches.includes(user.branch!);
        });
      }

      // Expand data for frontend compatibility
      const expandedData = filteredData?.map((drive: any) => {
        const eligibility = drive.eligibility || {};
        const companyInfo = drive.company?.info || {};

        return {
          ...drive,
          company: drive.company?.name || null,
          location: companyInfo.location || eligibility.location || null,
          salary: companyInfo.salary || eligibility.salary || null,
          experience_required: eligibility.experience_required || null,
          cgpa_required: eligibility.min_cgpa || null,
          branch: Array.isArray(eligibility.branches) && eligibility.branches.length > 0
            ? eligibility.branches.join(", ")
            : "Any",
          deadline: eligibility.deadline || null,
          drive_date: eligibility.drive_date || null,
        };
      });

      res.json(expandedData);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch drives" });
    }
  });

  r.get("/:id", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid drive ID" });
      }

      const { data: drive, error } = await db
        .from("drives")
        .select(`
          *,
          company:companies(id, name, info)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) return res.status(500).json({ error: error.message });
      if (!drive) return res.status(404).json({ error: "Not found" });

      // Check if branch admin has access to this drive
      if (user?.role === "branch-admin" && user?.branch) {
        const eligibility = drive.eligibility || {};
        const allowedBranches = Array.isArray(eligibility.branches) ? eligibility.branches : [];
        if (allowedBranches.length > 0 && !allowedBranches.includes(user.branch)) {
          return res.status(403).json({ error: "Forbidden: Drive not available for your branch" });
        }
      }

      // Expand data for frontend compatibility
      const eligibility = drive.eligibility || {};
      const companyInfo = drive.company?.info || {};

      const expandedDrive = {
        ...drive,
        company: drive.company?.name || null,
        location: companyInfo.location || eligibility.location || null,
        salary: companyInfo.salary || eligibility.salary || null,
        experience_required: eligibility.experience_required || null,
        cgpa_required: eligibility.min_cgpa || null,
        branch: Array.isArray(eligibility.branches) && eligibility.branches.length > 0
          ? eligibility.branches.join(", ")
          : "Any",
        deadline: eligibility.deadline || null,
        drive_date: eligibility.drive_date || null,
      };

      return res.json(expandedDrive);
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to fetch drive" });
    }
  });

  r.post("/", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      const body = req.body || {};

      // Branch admin can only create drives for their branch
      if (user.role === 'branch-admin' && user.branch) {
        const eligibility = body.eligibility || {};
        const branches = Array.isArray(eligibility.branches) ? eligibility.branches : [];
        if (!branches.includes(user.branch)) {
          branches.push(user.branch);
        }
        body.eligibility = { ...eligibility, branches };
      }

      const { data, error } = await db
        .from("drives")
        .insert({
          company_id: body.company_id || null,
          title: body.title?.trim() || "Untitled Drive",
          description: body.description?.trim() || null,
          status: "draft",
          eligibility: body.eligibility || {},
          total_rounds: body.total_rounds || 1,
          round_names: body.round_names || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to create drive" });
    }
  });

  r.post("/:id/publish", async (req, res) => {
    const id = Number(req.params.id);

    // Fetch drive details for notification
    const { data: drive } = await db
      .from("drives")
      .select("title")
      .eq("id", id)
      .single();

    const { error: updateError } = await db
      .from("drives")
      .update({ status: "published", publish_date: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) return res.status(500).json({ error: updateError.message });

    const studentIds = await eligibleStudentIdsForDrive(db, id);
    if (studentIds.length) {
      const notifs = studentIds.map((sid) => ({
        student_id: sid,
        type: "drive_published",
        payload: { drive_id: id },
        title: "New Drive Published",
        message: drive?.title ? `${drive.title} has been published. Check it out!` : "A new drive has been published. Check it out!",
        read: false,
        created_at: new Date().toISOString(),
      }));
      const { error: insertError } = await db.from("notifications").insert(notifs);
      if (insertError) console.error("Failed to create notifications:", insertError.message);

      // Send push notifications
      const { sendPushToStudents } = await import("../services/fcm-service");
      sendPushToStudents(
        db,
        studentIds,
        "New Drive Published",
        drive?.title ? `${drive.title} is now available!` : "A new placement drive is now available!",
        { drive_id: id.toString(), type: "drive_published" }
      ).catch(err => console.error("Failed to send push notifications:", err));
    }
    res.json({ ok: true, notified: studentIds.length });
  });

  r.put("/:id", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid drive ID" });

      // Check if branch admin has access to this drive
      if (user?.role === "branch-admin" && user?.branch) {
        const { data: existingDrive } = await db.from("drives").select("eligibility").eq("id", id).maybeSingle();
        if (existingDrive) {
          const eligibility = existingDrive.eligibility || {};
          const allowedBranches = Array.isArray(eligibility.branches) ? eligibility.branches : [];
          if (allowedBranches.length > 0 && !allowedBranches.includes(user.branch)) {
            return res.status(403).json({ error: "Forbidden: Cannot update drive not available for your branch" });
          }
        }
      }

      const body = req.body || {};
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only update fields that are provided
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.company_id !== undefined) updateData.company_id = body.company_id;
      if (body.status !== undefined) {
        if (!["draft", "published", "closed"].includes(body.status)) {
          return res.status(400).json({ error: "Invalid status value" });
        }
        updateData.status = body.status;
      }
      if (body.eligibility !== undefined) updateData.eligibility = body.eligibility;
      if (body.total_rounds !== undefined) updateData.total_rounds = body.total_rounds;
      if (body.round_names !== undefined) updateData.round_names = body.round_names;

      const { data, error } = await db
        .from("drives")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: "Drive not found" });

      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to update drive" });
    }
  });

  r.delete("/:id", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid drive ID" });

      // Check if branch admin has access to this drive
      if (user?.role === "branch-admin" && user?.branch) {
        const { data: existingDrive } = await db.from("drives").select("eligibility").eq("id", id).maybeSingle();
        if (existingDrive) {
          const eligibility = existingDrive.eligibility || {};
          const allowedBranches = Array.isArray(eligibility.branches) ? eligibility.branches : [];
          if (allowedBranches.length > 0 && !allowedBranches.includes(user.branch)) {
            return res.status(403).json({ error: "Forbidden: Cannot delete drive not available for your branch" });
          }
        }
      }

      // Check if drive has applications
      const { count } = await db
        .from("applications")
        .select("id", { count: "exact" })
        .eq("drive_id", id);

      if (count && count > 0) {
        return res.status(400).json({
          error: "Cannot delete drive with existing applications",
          applicationCount: count
        });
      }

      const { error } = await db.from("drives").delete().eq("id", id);
      if (error) return res.status(500).json({ error: error.message });

      res.json({ ok: true, message: "Drive deleted successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to delete drive" });
    }
  });

  return r;
}

