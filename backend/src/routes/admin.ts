import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin-specific routes for student and branch management
 * Access control enforced via middleware and query filtering
 */
export function adminRoutes(db: SupabaseClient) {
    const r = Router();
    r.use(requireAuth);

    /**
     * GET /api/admin/students
     * List all students with branch filtering
     * Main admin: Can see all branches (optional filter)
     * Branch admin: Only sees their branch
     */
    r.get("/students", async (req, res) => {
        try {
            const user = (req as any).user as { role: string; branch?: string | null };
            const { branch, search, sort = 'first_name', order = 'asc', limit = 100, offset = 0 } = req.query;

            let query = db.from("students").select("*", { count: "exact" });

            // Branch admin: filter by their branch only
            if (user.role === 'branch-admin' && user.branch) {
                query = query.eq("branch", user.branch);
            }
            // Main admin: optional branch filter
            else if (branch && typeof branch === 'string') {
                query = query.eq("branch", branch);
            }

            // Search by name, email, or registration ID
            if (search && typeof search === 'string') {
                const searchTerm = search.trim();
                query = query.or(
                    `first_name.ilike.%${searchTerm}%,` +
                    `last_name.ilike.%${searchTerm}%,` +
                    `email.ilike.%${searchTerm}%,` +
                    `regd_id.ilike.%${searchTerm}%`
                );
            }

            // Sort
            const validSorts = ['first_name', 'last_name', 'cgpa', 'branch', 'created_at', 'email'];
            const sortField = validSorts.includes(sort as string) ? (sort as string) : 'first_name';
            const ascending = order === 'asc';
            query = query.order(sortField, { ascending });

            // Pagination
            const limitNum = Math.min(Number(limit) || 100, 500);
            const offsetNum = Number(offset) || 0;
            query = query.range(offsetNum, offsetNum + limitNum - 1);

            const { data, error, count } = await query;
            if (error) return res.status(500).json({ error: error.message });

            res.json({ students: data, total: count, limit: limitNum, offset: offsetNum });
        } catch (e: any) {
            res.status(500).json({ error: e.message || "Failed to fetch students" });
        }
    });

    /**
     * GET /api/admin/students/available/:driveId
     * Get students eligible for a drive who haven't applied yet
     */
    r.get("/students/available/:driveId", async (req, res) => {
        try {
            const user = (req as any).user as { role: string; branch?: string | null };
            const driveId = Number(req.params.driveId);

            if (isNaN(driveId)) {
                return res.status(400).json({ error: "Invalid drive ID" });
            }

            // Get drive details
            const { data: drive, error: driveError } = await db
                .from("drives")
                .select("eligibility")
                .eq("id", driveId)
                .single();

            if (driveError) return res.status(500).json({ error: driveError.message });
            if (!drive) return res.status(404).json({ error: "Drive not found" });

            const eligibility = drive.eligibility || {};
            const branches = Array.isArray(eligibility.branches) ? eligibility.branches : [];
            const minCgpa = eligibility.min_cgpa || 0;

            // Build student query
            let query = db.from("students").select("*");

            // Branch filtering
            if (user.role === 'branch-admin' && user.branch) {
                // Branch admin can only see their branch students
                query = query.eq("branch", user.branch);
            } else if (branches.length > 0) {
                // Filter by drive's eligible branches
                query = query.in("branch", branches);
            }

            // CGPA filter
            if (minCgpa > 0) {
                query = query.gte("cgpa", minCgpa);
            }

            // Profile completion filter
            if (eligibility.profileCompleteRequired) {
                query = query.eq("profile_completed", true);
            }

            // No backlogs filter
            if (eligibility.noBacklogsRequired) {
                query = query.eq("has_backlogs", false);
            }

            const { data: allEligible, error } = await query;
            if (error) return res.status(500).json({ error: error.message });

            // Get students who already applied
            const { data: applications } = await db
                .from("applications")
                .select("student_id")
                .eq("drive_id", driveId);

            const appliedIds = new Set(applications?.map(a => a.student_id) || []);
            const available = allEligible?.filter(s => !appliedIds.has(s.id)) || [];

            res.json({ students: available, total: available.length });
        } catch (e: any) {
            res.status(500).json({ error: e.message || "Failed to fetch available students" });
        }
    });

    /**
     * GET /api/admin/students/applied/:driveId
     * Get students who have applied to a specific drive
     */
    r.get("/students/applied/:driveId", async (req, res) => {
        try {
            const user = (req as any).user as { role: string; branch?: string | null };
            const driveId = Number(req.params.driveId);
            const { status } = req.query;

            if (isNaN(driveId)) {
                return res.status(400).json({ error: "Invalid drive ID" });
            }

            let query = db
                .from("applications")
                .select("*, student:students(*)")
                .eq("drive_id", driveId);

            // Filter by application status if provided
            if (status && typeof status === 'string') {
                query = query.eq("status", status);
            }

            const { data: applications, error } = await query;
            if (error) return res.status(500).json({ error: error.message });

            // Filter by branch for branch admin
            let filtered = applications;
            if (user.role === 'branch-admin' && user.branch) {
                filtered = applications?.filter(app => app.student?.branch === user.branch) || [];
            }

            res.json({ applications: filtered, total: filtered?.length || 0 });
        } catch (e: any) {
            res.status(500).json({ error: e.message || "Failed to fetch applied students" });
        }
    });

    /**
     * GET /api/admin/branches
     * List all branches with statistics
     * Main admin only
     */
    r.get("/branches", async (req, res) => {
        try {
            const user = (req as any).user as { role: string; branch?: string | null };

            // Branch admin can only see their own branch
            if (user.role === 'branch-admin' && user.branch) {
                const { count: studentCount } = await db
                    .from("students")
                    .select("id", { count: "exact" })
                    .eq("branch", user.branch);

                return res.json([{
                    branch: user.branch,
                    studentCount: studentCount || 0,
                    isOwn: true,
                    isMain: user.branch === 'CSE'
                }]);
            }

            // Main admin can see all branches
            // Get unique branches from students
            const { data: students } = await db.from("students").select("branch");
            const uniqueBranches = [...new Set(students?.map(s => s.branch).filter(Boolean))];

            // Get statistics for each branch
            const branchStats = await Promise.all(
                uniqueBranches.map(async (branch) => {
                    const { count: studentCount } = await db
                        .from("students")
                        .select("id", { count: "exact" })
                        .eq("branch", branch);

                    const { data: admins } = await db
                        .from("admins")
                        .select("name, email, status")
                        .eq("branch", branch)
                        .eq("role", "branch-admin")
                        .eq("status", "active");

                    return {
                        branch,
                        studentCount: studentCount || 0,
                        admins: admins || [],
                        isMain: branch === 'CSE' // Highlight CSE as main branch
                    };
                })
            );

            // Sort with CSE first, then alphabetically
            branchStats.sort((a, b) => {
                if (a.isMain) return -1;
                if (b.isMain) return 1;
                return (a.branch || '').localeCompare(b.branch || '');
            });

            res.json({ branches: branchStats, total: branchStats.length });
        } catch (e: any) {
            res.status(500).json({ error: e.message || "Failed to fetch branches" });
        }
    });

    /**
     * GET /api/admin/dashboard/stats
     * Get dashboard statistics
     */
    r.get("/dashboard/stats", async (req, res) => {
        try {
            const user = (req as any).user as { role: string; branch?: string | null };

            let studentQuery = db.from("students").select("id", { count: "exact" });
            let drivesQuery = db.from("drives").select("id", { count: "exact" });
            let applicationsQuery = db.from("applications").select("id", { count: "exact" });

            // Branch admin: filter by their branch
            if (user.role === 'branch-admin' && user.branch) {
                studentQuery = studentQuery.eq("branch", user.branch);

                // For drives and applications, need to filter by branch-eligible drives
                const { data: branchDrives } = await db
                    .from("drives")
                    .select("id, eligibility");

                const eligibleDriveIds = branchDrives
                    ?.filter(d => {
                        const branches = d.eligibility?.branches || [];
                        return branches.length === 0 || branches.includes(user.branch!);
                    })
                    .map(d => d.id) || [];

                if (eligibleDriveIds.length > 0) {
                    drivesQuery = drivesQuery.in("id", eligibleDriveIds);
                    applicationsQuery = applicationsQuery.in("drive_id", eligibleDriveIds);
                } else {
                    // No eligible drives for this branch
                    return res.json({
                        totalStudents: 0,
                        totalDrives: 0,
                        totalApplications: 0,
                        pendingApplications: 0,
                        branches: user.branch ? [user.branch] : []
                    });
                }
            }

            const [
                { count: totalStudents },
                { count: totalDrives },
                { count: totalApplications },
                { count: pendingApplications }
            ] = await Promise.all([
                studentQuery,
                drivesQuery,
                applicationsQuery,
                applicationsQuery.eq("status", "pending")
            ]);

            res.json({
                totalStudents: totalStudents || 0,
                totalDrives: totalDrives || 0,
                totalApplications: totalApplications || 0,
                pendingApplications: pendingApplications || 0,
                branches: user.branch ? [user.branch] : undefined
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message || "Failed to fetch dashboard stats" });
        }
    });

    return r;
}
