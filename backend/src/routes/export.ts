import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

export function exportRoutes(db: SupabaseClient) {
    const r = Router();
    r.use(requireAuth);

    // Export students to Excel
    r.get("/students/export", async (req, res) => {
        try {
            const user = (req as any).user as { role: string; branch?: string | null };

            // Get query parameters for filtering
            const branch = req.query.branch as string | undefined;
            const year = req.query.year as string | undefined;
            const minCgpa = req.query.minCgpa ? Number(req.query.minCgpa) : undefined;
            const maxCgpa = req.query.maxCgpa ? Number(req.query.maxCgpa) : undefined;

            // Build query
            let query = db.from("students").select(`
        *,
        addresses(*),
        education_records(*)
      `);

            // Apply filters
            if (user?.role === "branch-admin" && user?.branch) {
                query = query.eq("branch", user.branch);
            } else if (branch) {
                query = query.eq("branch", branch);
            }

            if (year) query = query.eq("year", year);
            if (minCgpa !== undefined) query = query.gte("cgpa", minCgpa);
            if (maxCgpa !== undefined) query = query.lte("cgpa", maxCgpa);

            const { data: students, error } = await query;

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Students");

            // Define columns
            worksheet.columns = [
                { header: "Regd ID", key: "regd_id", width: 15 },
                { header: "First Name", key: "first_name", width: 20 },
                { header: "Last Name", key: "last_name", width: 20 },
                { header: "Full Name", key: "full_name", width: 30 },
                { header: "Email", key: "email", width: 30 },
                { header: "Phone", key: "phone", width: 15 },
                { header: "Alt Email", key: "alt_email", width: 30 },
                { header: "Alt Phone", key: "alt_phone", width: 15 },
                { header: "Branch", key: "branch", width: 10 },
                { header: "CGPA", key: "cgpa", width: 10 },
                { header: "Year", key: "year", width: 10 },
                { header: "Gender", key: "gender", width: 10 },
                { header: "DOB", key: "dob", width: 15 },
                { header: "Father's Name", key: "father_name", width: 30 },
                { header: "Nationality", key: "nationality", width: 15 },
                { header: "College", key: "college", width: 30 },
                { header: "Resume URL", key: "resume_url", width: 40 },
                { header: "Break in Studies", key: "break_in_studies", width: 15 },
                { header: "Has Backlogs", key: "has_backlogs", width: 15 },
            ];

            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            };

            // Add data rows
            students?.forEach((student: any) => {
                worksheet.addRow({
                    regd_id: student.regd_id,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    full_name: student.full_name || student.name,
                    email: student.email,
                    phone: student.phone,
                    alt_email: student.alt_email,
                    alt_phone: student.alt_phone,
                    branch: student.branch,
                    cgpa: student.cgpa,
                    year: student.year,
                    gender: student.gender,
                    dob: student.dob,
                    father_name: student.father_name,
                    nationality: student.nationality,
                    college: student.college,
                    resume_url: student.resume_url,
                    break_in_studies: student.break_in_studies ? "Yes" : "No",
                    has_backlogs: student.has_backlogs ? "Yes" : "No",
                });
            });

            // Set response headers for file download
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=students_export_${new Date().toISOString().split("T")[0]}.xlsx`
            );

            // Write to response
            await workbook.xlsx.write(res);
            res.end();
        } catch (e: any) {
            console.error("Export error:", e);
            res.status(500).json({ error: e.message || "Export failed" });
        }
    });

    return r;
}
