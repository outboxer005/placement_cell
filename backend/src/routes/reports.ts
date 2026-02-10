import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export function reportsRoutes(db: SupabaseClient) {
  const r = Router();
  r.use(requireAuth);

  r.get("/summary", async (req, res) => {
    const user = (req as any).user as { role: string; branch?: string | null };
    const branchFilter = user?.role === "branch-admin" && user?.branch ? user.branch : null;

    // Build queries with optional branch filtering
    let studentsQuery = db.from("students").select("id", { count: "exact" });
    let placedQuery = db.from("students").select("id", { count: "exact" }).eq("placed", true);

    if (branchFilter) {
      studentsQuery = studentsQuery.eq("branch", branchFilter);
      placedQuery = placedQuery.eq("branch", branchFilter);
    }

    // For applications, if branch admin, first get student IDs then filter
    let applicationsCount = 0;
    if (branchFilter) {
      const { data: branchStudents } = await db.from("students").select("id").eq("branch", branchFilter);
      const studentIds = branchStudents?.map(s => s.id) || [];
      if (studentIds.length > 0) {
        const { count } = await db.from("applications").select("id", { count: "exact" }).in("student_id", studentIds);
        applicationsCount = count || 0;
      }
    } else {
      const { count } = await db.from("applications").select("id", { count: "exact" });
      applicationsCount = count || 0;
    }

    const [{ count: students, error: studentsError }, { count: placed, error: placedError }, { count: drives, error: drivesError }] = await Promise.all([
      studentsQuery,
      placedQuery,
      db.from("drives").select("id", { count: "exact" }).neq("status", "draft"),
    ]);

    if (studentsError) return res.status(500).json({ error: studentsError.message });
    if (placedError) return res.status(500).json({ error: placedError.message });
    if (drivesError) return res.status(500).json({ error: drivesError.message });

    res.json({ students, placed, drives, applications: applicationsCount });
  });

  // Branch-wise statistics
  r.get("/branch-stats", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      const branchFilter = user?.role === "branch-admin" && user?.branch ? user.branch : null;

      // Get student counts by branch
      let studentsQuery = db.from("students").select("branch");
      if (branchFilter) {
        studentsQuery = studentsQuery.eq("branch", branchFilter);
      }

      const { data: studentsByBranch, error: studentsError } = await studentsQuery;

      if (studentsError) return res.status(500).json({ error: studentsError.message });

      // Count students per branch
      const branchCounts: Record<string, number> = {};
      studentsByBranch?.forEach((s) => {
        const branch = s.branch || "Unknown";
        branchCounts[branch] = (branchCounts[branch] || 0) + 1;
      });

      // Get placed students by branch
      let placedQuery = db.from("students").select("branch").eq("placed", true);
      if (branchFilter) {
        placedQuery = placedQuery.eq("branch", branchFilter);
      }

      const { data: placedByBranch, error: placedError } = await placedQuery;

      if (placedError) return res.status(500).json({ error: placedError.message });

      const placedCounts: Record<string, number> = {};
      placedByBranch?.forEach((s) => {
        const branch = s.branch || "Unknown";
        placedCounts[branch] = (placedCounts[branch] || 0) + 1;
      });

      // Calculate placement percentage per branch
      const branchStats = Object.keys(branchCounts).map((branch) => ({
        branch,
        total: branchCounts[branch],
        placed: placedCounts[branch] || 0,
        placementRate: branchCounts[branch] > 0
          ? Math.round(((placedCounts[branch] || 0) / branchCounts[branch]) * 100)
          : 0,
      }));

      res.json({ branches: branchStats });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch branch statistics" });
    }
  });

  // Application analytics
  r.get("/application-analytics", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      const branchFilter = user?.role === "branch-admin" && user?.branch ? user.branch : null;

      // Get application counts by status
      let appsQuery = db.from("applications").select("status, drive_id");

      if (branchFilter) {
        // Filter applications by students from branch admin's branch
        const { data: branchStudents } = await db.from("students").select("id").eq("branch", branchFilter);
        const studentIds = branchStudents?.map(s => s.id) || [];
        if (studentIds.length > 0) {
          appsQuery = appsQuery.in("student_id", studentIds);
        } else {
          // No students in this branch, return empty results
          return res.json({
            byStatus: { pending: 0, accepted: 0, rejected: 0 },
            totalApplications: 0,
            acceptanceRate: 0,
            driveApplicationCounts: {},
          });
        }
      }

      const { data: applications, error: appsError } = await appsQuery;

      if (appsError) return res.status(500).json({ error: appsError.message });

      const statusCounts: Record<string, number> = {
        pending: 0,
        accepted: 0,
        rejected: 0,
      };

      applications?.forEach((app) => {
        const status = app.status || "pending";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Get drive-wise application counts
      const driveApplications: Record<string, number> = {};
      applications?.forEach((app) => {
        const driveId = String(app.drive_id);
        driveApplications[driveId] = (driveApplications[driveId] || 0) + 1;
      });

      res.json({
        byStatus: statusCounts,
        totalApplications: applications?.length || 0,
        acceptanceRate: applications?.length
          ? Math.round((statusCounts.accepted / applications.length) * 100)
          : 0,
        driveApplicationCounts: driveApplications,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch application analytics" });
    }
  });

  // Drive analytics - individual drive performance
  r.get("/drive-analytics/:id", async (req, res) => {
    try {
      const driveId = Number(req.params.id);

      // Get drive details
      const { data: drive, error: driveError } = await db
        .from("drives")
        .select("*, company:company_id(name)")
        .eq("id", driveId)
        .single();

      if (driveError) return res.status(500).json({ error: driveError.message });
      if (!drive) return res.status(404).json({ error: "Drive not found" });

      // Get applications for this drive
      const { data: applications, error: appsError } = await db
        .from("applications")
        .select("id, status, student_id, created_at")
        .eq("drive_id", driveId);

      if (appsError) return res.status(500).json({ error: appsError.message });

      const statusBreakdown = {
        pending: applications?.filter((a) => a.status === "pending").length || 0,
        accepted: applications?.filter((a) => a.status === "accepted").length || 0,
        rejected: applications?.filter((a) => a.status === "rejected").length || 0,
      };

      res.json({
        drive: {
          id: drive.id,
          title: drive.title,
          company: (drive.company as any)?.name || "Unknown",
          status: drive.status,
          created_at: drive.created_at,
        },
        totalApplications: applications?.length || 0,
        statusBreakdown,
        acceptanceRate: applications?.length
          ? Math.round((statusBreakdown.accepted / applications.length) * 100)
          : 0,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch drive analytics" });
    }
  });

  // Company analytics
  r.get("/company-analytics", async (_req, res) => {
    try {
      // Get all companies with their drive counts
      const { data: companies, error: companiesError } = await db
        .from("companies")
        .select("id, name");

      if (companiesError) return res.status(500).json({ error: companiesError.message });

      // Get drives per company
      const { data: drives, error: drivesError } = await db
        .from("drives")
        .select("company_id, status");

      if (drivesError) return res.status(500).json({ error: drivesError.message });

      const companyDriveCounts: Record<number, number> = {};
      drives?.forEach((d) => {
        if (d.company_id) {
          companyDriveCounts[d.company_id] = (companyDriveCounts[d.company_id] || 0) + 1;
        }
      });

      const companyStats = companies?.map((company) => ({
        id: company.id,
        name: company.name,
        totalDrives: companyDriveCounts[company.id] || 0,
      })) || [];

      // Sort by drive count
      companyStats.sort((a, b) => b.totalDrives - a.totalDrives);

      res.json({
        companies: companyStats,
        totalCompanies: companies?.length || 0,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch company analytics" });
    }
  });

  // Student analytics - detailed breakdown
  r.get("/student-analytics", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      const branchFilter = user?.role === "branch-admin" && user?.branch ? user.branch : null;

      let studentsQuery = db.from("students").select("branch, year, cgpa, break_in_studies, has_backlogs, placed");

      if (branchFilter) {
        studentsQuery = studentsQuery.eq("branch", branchFilter);
      }

      const { data: students, error } = await studentsQuery;

      if (error) return res.status(500).json({ error: error.message });

      // Year-wise distribution
      const yearCounts: Record<string, number> = {};
      students?.forEach((s) => {
        const year = s.year || "Unknown";
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });

      // CGPA distribution (ranges)
      const cgpaRanges = {
        below6: 0,
        "6to7": 0,
        "7to8": 0,
        "8to9": 0,
        above9: 0,
      };

      students?.forEach((s) => {
        const cgpa = Number(s.cgpa) || 0;
        if (cgpa < 6) cgpaRanges.below6++;
        else if (cgpa < 7) cgpaRanges["6to7"]++;
        else if (cgpa < 8) cgpaRanges["7to8"]++;
        else if (cgpa < 9) cgpaRanges["8to9"]++;
        else cgpaRanges.above9++;
      });

      // Count students with breaks and backlogs
      const withBreaks = students?.filter((s) => s.break_in_studies === true).length || 0;
      const withBacklogs = students?.filter((s) => s.has_backlogs === true).length || 0;

      res.json({
        total: students?.length || 0,
        byYear: yearCounts,
        cgpaDistribution: cgpaRanges,
        withBreaks,
        withBacklogs,
        eligibilityImpacted: withBreaks + withBacklogs,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch student analytics" });
    }
  });

  return r;
}

