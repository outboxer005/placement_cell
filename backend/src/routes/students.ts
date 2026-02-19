import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import multer from "multer";
import {
  addressSchema,
  educationSchema,
  cleanText,
  parseFlexibleDate,
  formatDateISO,
  upsertAddress,
  upsertEducation,
} from "../utils/student-data";
import { parseCSV, parseExcel } from "../utils/bulk-upload";
import { generateStudentPassword } from "../utils/password-generator";
import { hashPassword } from "../utils/password";

const studentSelfSchema = z.object({
  first_name: z.string().min(1).max(60).optional(),
  last_name: z.string().max(60).optional(),
  email: z.string().email().max(200).optional(),
  altEmail: z.union([z.string().email().max(200), z.literal('')]).optional(),
  phone: z.string().min(7).max(20).optional(),
  altPhone: z.union([z.string().min(7).max(20), z.literal('')]).optional(),
  resume_url: z.union([z.string().url(), z.literal('')]).optional(),
  aadhar_number: z.union([z.string().length(12).regex(/^\d{12}$/), z.literal('')]).optional(),
  pan_card: z.union([z.string().length(10).regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/), z.literal('')]).optional(),
  permanentAddress: addressSchema.optional(),
  presentAddress: addressSchema.optional(),
  degree: educationSchema.optional(),
  inter: educationSchema.optional(),
  ssc: educationSchema.optional(),
  breakInStudies: z.boolean().optional(),
  hasBacklogs: z.boolean().optional(),
});

const studentAdminSchema = studentSelfSchema.extend({
  fatherName: z.string().max(120).optional(),
  branch: z.string().max(40).optional(),
  cgpa: z.union([z.number(), z.string()]).optional(),
  year: z.string().max(10).optional(),
  section: z.string().max(10).optional(),
  current_year: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  nationality: z.string().max(100).optional(),
  college: z.string().max(200).optional(),
  dob: z.string().optional(),
});

const studentCreateSchema = studentAdminSchema.extend({
  regdId: z.string().min(3),
});

type StudentSelfInput = z.infer<typeof studentSelfSchema>;
type StudentAdminInput = z.infer<typeof studentAdminSchema>;
type StudentCreateInput = z.infer<typeof studentCreateSchema>;

export function studentsRoutes(db: SupabaseClient) {
  const r = Router();
  r.use(requireAuth);

  r.get("/me", async (req, res) => {
    const user = (req as any).user as { role: string; sub: string };
    if (user?.role !== "student") return res.status(403).json({ error: "Forbidden" });
    const detail = await fetchStudentDetail(db, Number(user.sub));
    if (!detail) return res.status(404).json({ error: "Not found" });
    res.json(detail);
  });

  r.put("/me", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; sub: string };
      if (user?.role !== "student") return res.status(403).json({ error: "Forbidden" });
      const parsed = studentSelfSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      await applyStudentUpdate(db, Number(user.sub), parsed.data, {});
      const detail = await fetchStudentDetail(db, Number(user.sub));
      return res.json(detail);
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Update failed" });
    }
  });

  r.get("/", async (req, res) => {
    const user = (req as any).user as { role: string; branch?: string | null };
    const limit = Math.min(Number(req.query.limit ?? 200) || 200, 500);
    const offset = Number(req.query.offset ?? 0) || 0;
    const branchQ = (req.query.branch as string | undefined)?.trim();
    const yearQ = (req.query.year as string | undefined)?.trim();
    const minCgpaQ = req.query.minCgpa ? Number(req.query.minCgpa) : undefined;
    const maxCgpaQ = req.query.maxCgpa ? Number(req.query.maxCgpa) : undefined;
    const hasBacklogsQ = req.query.hasBacklogs === "true" ? true : req.query.hasBacklogs === "false" ? false : undefined;
    const branchFilter = user?.role === "branch-admin" && user?.branch ? user.branch : branchQ || null;

    let query = db
      .from("students")
      .select("id, regd_id, first_name, last_name, email, phone, branch, cgpa, year, resume_url, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (branchFilter) query = query.eq("branch", branchFilter);
    if (yearQ) query = query.eq("year", yearQ);
    if (minCgpaQ !== undefined && !isNaN(minCgpaQ)) query = query.gte("cgpa", minCgpaQ);
    if (maxCgpaQ !== undefined && !isNaN(maxCgpaQ)) query = query.lte("cgpa", maxCgpaQ);
    if (hasBacklogsQ !== undefined) query = query.eq("has_backlogs", hasBacklogsQ);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Compute full_name for each student
    const studentsWithFullName = data?.map(student => ({
      ...student,
      full_name: student.last_name
        ? `${student.first_name || ''} ${student.last_name}`.trim()
        : (student.first_name || '').trim(),
      name: student.last_name
        ? `${student.first_name || ''} ${student.last_name}`.trim()
        : (student.first_name || '').trim()
    })) || [];

    res.json(studentsWithFullName);
  });

  r.post("/import-cgpa", async (req, res) => {
    try {
      const body = req.body || {};
      let rows: Array<{ regd?: string; regd_id?: string; registration?: string; cgpa?: number; cpga?: number }>;
      if (Array.isArray(body.rows)) {
        rows = body.rows;
      } else if (typeof body.csv === "string") {
        rows = parseSimpleCSV(body.csv);
      } else {
        return res.status(400).json({ ok: false, error: "Provide rows[] or csv" });
      }

      const updates = rows
        .map((r) => {
          const regd = String(r.regd ?? r.regd_id ?? r.registration ?? "").trim();
          const cg = r.cgpa ?? (r as any).cpga;
          const cgpa = typeof cg === "string" ? parseFloat(cg) : cg;
          if (!regd || Number.isNaN(Number(cgpa))) return null;
          return { regd_id: regd, cgpa: Number(cgpa) };
        })
        .filter(Boolean) as Array<{ regd_id: string; cgpa: number }>;

      if (!updates.length) return res.status(400).json({ ok: false, error: "No valid rows" });
      const user = (req as any).user as { role: string; branch?: string | null };
      let updated = 0;
      for (const u of updates) {
        let updateQuery = db.from("students").update({ cgpa: u.cgpa, updated_at: new Date().toISOString() }).eq("regd_id", u.regd_id);
        if (user?.role === "branch-admin" && user?.branch) {
          updateQuery = updateQuery.eq("branch", user.branch);
        }
        const { data, error } = await updateQuery.select("id");
        if (error) return res.status(500).json({ ok: false, error: error.message });
        updated += data?.length ?? 0;
      }
      res.json({ ok: true, received: updates.length, updated });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message || "Import failed" });
    }
  });

  // Bulk upload students from CSV or Excel file
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.csv') || file.originalname.endsWith('.xlsx')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV and Excel files are allowed'));
      }
    }
  });

  r.post("/bulk-upload", upload.single('file'), async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      if (user?.role !== "main-admin" && user?.role !== "branch-admin") {
        return res.status(403).json({ error: "Admin access required for bulk upload" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse file based on type
      let parseResult;
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        parseResult = await parseCSV(file.buffer);
      } else {
        parseResult = await parseExcel(file.buffer);
      }

      if (!parseResult.success && parseResult.errors.length > 0) {
        return res.status(400).json({
          error: "File parsing failed",
          details: parseResult.errors
        });
      }

      const results = {
        total: parseResult.data.length,
        created: 0,
        updated: 0,
        failed: 0,
        errors: [] as Array<{ row: number; username: string; error: string }>
      };

      // Process each student credential
      for (let i = 0; i < parseResult.data.length; i++) {
        const { username, password } = parseResult.data[i];
        const rowNumber = i + 2; // Account for header row

        try {
          if (!username || !password) {
            results.failed++;
            results.errors.push({ row: rowNumber, username, error: 'Both username and password are required' });
            continue;
          }

          // Check if student exists in students table
          const { data: student, error: studentError } = await db
            .from("students")
            .select("id")
            .eq("regd_id", username)
            .maybeSingle();

          if (studentError && studentError.code !== "PGRST116") {
            results.failed++;
            results.errors.push({ row: rowNumber, username, error: studentError.message });
            continue;
          }

          let studentId: number;

          if (!student) {
            // Create new student record with minimal data
            const { data: inserted, error: insertError } = await db
              .from("students")
              .insert({
                regd_id: username,
                updated_at: new Date().toISOString()
              })
              .select("id")
              .single();

            if (insertError) {
              results.failed++;
              results.errors.push({ row: rowNumber, username, error: insertError.message });
              continue;
            }

            studentId = inserted.id;
          } else {
            studentId = student.id;
          }

          // Hash password and set in student_auth table
          try {
            const passwordHash = await hashPassword(password);

            // Check if auth record exists
            const { data: existingAuth } = await db
              .from("student_auth")
              .select("student_id")
              .eq("student_id", studentId)
              .maybeSingle();

            if (existingAuth) {
              // Update existing password
              const { error: updateError } = await db
                .from("student_auth")
                .update({ password_hash: passwordHash })
                .eq("student_id", studentId);

              if (updateError) {
                results.failed++;
                results.errors.push({ row: rowNumber, username, error: `Failed to update password: ${updateError.message}` });
                continue;
              }
              results.updated++;
            } else {
              // Insert new auth record
              const { error: insertError } = await db
                .from("student_auth")
                .insert({
                  student_id: studentId,
                  password_hash: passwordHash,
                });

              if (insertError) {
                results.failed++;
                results.errors.push({ row: rowNumber, username, error: `Failed to create auth: ${insertError.message}` });
                continue;
              }
              results.created++;
            }

          } catch (pwdError: any) {
            results.failed++;
            results.errors.push({ row: rowNumber, username, error: `Password error: ${pwdError.message}` });
          }

        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            username,
            error: error.message || "Unknown error"
          });
        }
      }

      res.json({
        ok: true,
        summary: {
          total: results.total,
          created: results.created,
          updated: results.updated,
          failed: results.failed
        },
        errors: results.errors.slice(0, 50) // Limit error details to first 50
      });

    } catch (e: any) {
      res.status(500).json({ error: e.message || "Bulk upload failed" });
    }
  });


  r.post("/", async (req, res) => {
    const user = (req as any).user as { role: string; branch?: string | null };
    const parsed = studentCreateSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const payload = parsed.data;
    if (user?.role === "branch-admin" && user?.branch) payload.branch = user.branch;

    const { data: existing, error: existingError } = await db
      .from("students")
      .select("id")
      .eq("regd_id", payload.regdId)
      .maybeSingle();
    if (existingError && existingError.code !== "PGRST116") return res.status(500).json({ error: existingError.message });

    let studentId: number;
    if (existing) {
      studentId = existing.id;
    } else {
      const { data, error } = await db
        .from("students")
        .insert({
          regd_id: payload.regdId,
          branch: payload.branch ?? undefined,
          first_name: payload.first_name ?? undefined,
          last_name: payload.last_name ?? undefined,
          email: payload.email ?? undefined,
          phone: payload.phone ?? undefined,
        })
        .select("id")
        .single();
      if (error) return res.status(500).json({ error: error.message });
      studentId = data.id;
    }

    await applyStudentUpdate(db, studentId, payload, { branchLock: user?.role === "branch-admin" ? user.branch ?? null : null });
    const detail = await fetchStudentDetail(db, studentId);
    res.status(existing ? 200 : 201).json(detail);
  });

  r.get("/:id", async (req, res) => {
    const user = (req as any).user as { role: string; branch?: string | null };
    const studentId = Number(req.params.id);
    const detail = await fetchStudentDetail(db, studentId);
    if (!detail) return res.status(404).json({ error: "Not found" });
    if (user?.role === "branch-admin" && user.branch && detail.branch && detail.branch !== user.branch) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(detail);
  });

  r.put("/:id", async (req, res) => {
    const user = (req as any).user as { role: string; branch?: string | null };
    const parsed = studentAdminSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const studentId = Number(req.params.id);
    const detail = await fetchStudentDetail(db, studentId);
    if (!detail) return res.status(404).json({ error: "Not found" });
    if (user?.role === "branch-admin" && user.branch && detail.branch && detail.branch !== user.branch) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await applyStudentUpdate(db, studentId, parsed.data, { branchLock: user?.role === "branch-admin" ? user.branch ?? null : null });
    const updated = await fetchStudentDetail(db, studentId);
    res.json(updated);
  });

  r.post("/device-token", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; sub: string };
      if (user?.role !== "student") return res.status(403).json({ error: "Forbidden" });

      const { token, platform } = req.body || {};
      if (!token || !platform) {
        return res.status(400).json({ error: "Token and platform required" });
      }

      const studentId = Number(user.sub);

      // Upsert device token
      const { error } = await db.from("device_tokens").upsert({
        student_id: studentId,
        device_token: token,
        platform: platform,
        updated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: "student_id,device_token"
      });

      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to save device token" });
    }
  });

  r.post("/:id/request-data", async (req, res) => {
    const user = (req as any).user as { role: string; branch?: string | null };
    const studentId = Number(req.params.id);
    const detail = await fetchStudentDetail(db, studentId);
    if (!detail) return res.status(404).json({ error: "Not found" });
    if (user?.role === "branch-admin" && user.branch && detail.branch && detail.branch !== user.branch) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const fields = req.body?.fields ?? [];
    const { error } = await db.from("notifications").insert({
      student_id: studentId,
      type: "data_request",
      payload: fields,
      title: "Data Request",
      message: "Please provide requested information",
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  r.delete("/:id", async (req, res) => {
    try {
      const user = (req as any).user as { role: string; branch?: string | null };
      if (user?.role !== "main-admin" && user?.role !== "branch-admin") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const studentId = Number(req.params.id);
      if (isNaN(studentId)) return res.status(400).json({ error: "Invalid student ID" });

      // Fetch student to check branch restriction
      const detail = await fetchStudentDetail(db, studentId);
      if (!detail) return res.status(404).json({ error: "Student not found" });

      // Branch admin can only delete students from their branch
      if (user?.role === "branch-admin" && user.branch && detail.branch && detail.branch !== user.branch) {
        return res.status(403).json({ error: "Forbidden: Cannot delete student from another branch" });
      }

      // Delete related records first (addresses, education, applications, notifications)
      await Promise.all([
        db.from("addresses").delete().eq("student_id", studentId),
        db.from("education_records").delete().eq("student_id", studentId),
        db.from("applications").delete().eq("student_id", studentId),
        db.from("notifications").delete().eq("student_id", studentId),
        db.from("device_tokens").delete().eq("student_id", studentId),
      ]);

      // Delete the student
      const { error } = await db.from("students").delete().eq("id", studentId);
      if (error) return res.status(500).json({ error: error.message });

      res.json({ ok: true, message: "Student deleted successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to delete student" });
    }
  });

  return r;
}

function parseSimpleCSV(csv: string) {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [] as any[];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const data = [] as any[];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const row: any = {};
    header.forEach((h, idx) => {
      row[h] = cols[idx];
    });
    data.push(row);
  }
  return data;
}

async function fetchStudentDetail(db: SupabaseClient, studentId: number) {
  const { data: student, error } = await db.from("students").select("*").eq("id", studentId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!student) return null;

  const [{ data: addresses, error: addrError }, { data: education, error: eduError }] = await Promise.all([
    db.from("addresses").select("*").eq("student_id", studentId),
    db.from("education_records").select("*").eq("student_id", studentId),
  ]);
  if (addrError) throw new Error(addrError.message);
  if (eduError) throw new Error(eduError.message);

  const payload: any = { ...student };
  payload.dob = formatDateISO(parseFlexibleDate(student.dob));

  // Compute full_name from first_name and last_name
  const firstName = student.first_name || '';
  const lastName = student.last_name || '';
  payload.full_name = lastName
    ? `${firstName} ${lastName}`.trim()
    : firstName.trim();
  // Set legacy 'name' field for backward compatibility
  payload.name = payload.full_name;

  payload.permanent_address = addresses?.find((a) => a.type === "permanent") || null;
  payload.present_address = addresses?.find((a) => a.type === "present") || null;
  payload.education = {
    degree: education?.find((e) => e.level === "degree") || null,
    inter: education?.find((e) => e.level === "inter") || null,
    ssc: education?.find((e) => e.level === "ssc") || null,
  };
  return payload;
}

async function applyStudentUpdate(
  db: SupabaseClient,
  studentId: number,
  payload: StudentAdminInput | StudentSelfInput,
  opts: { branchLock?: string | null }
) {
  const normalized = normalizeProfilePayload(payload);
  if (opts.branchLock) normalized.branch = opts.branchLock;
  const updates: Record<string, any> = {};
  Object.entries(normalized).forEach(([key, value]) => {
    if (value !== null && value !== undefined) updates[key] = value;
  });
  updates.updated_at = new Date().toISOString();
  const { error } = await db.from("students").update(updates).eq("id", studentId);
  if (error) throw new Error(error.message);

  await upsertAddress(db, studentId, "permanent", (payload as StudentAdminInput).permanentAddress);
  await upsertAddress(db, studentId, "present", (payload as StudentAdminInput).presentAddress);
  await upsertEducation(db, studentId, "degree", (payload as StudentAdminInput).degree);
  await upsertEducation(db, studentId, "inter", (payload as StudentAdminInput).inter);
  await upsertEducation(db, studentId, "ssc", (payload as StudentAdminInput).ssc);
}

function normalizeProfilePayload(payload: StudentAdminInput | StudentSelfInput) {
  const firstName = cleanText(payload.first_name);
  const lastName = cleanText(payload.last_name);

  return {
    // Database uses snake_case, not camelCase!
    first_name: firstName,
    last_name: lastName,
    father_name: "fatherName" in payload ? cleanText(payload.fatherName) : null,
    email: cleanText(payload.email),
    alt_email: "altEmail" in payload ? cleanText(payload.altEmail) : null,
    phone: cleanText(payload.phone),
    alt_phone: "altPhone" in payload ? cleanText(payload.altPhone) : null,
    branch: "branch" in payload ? cleanText(payload.branch) : null,
    cgpa: parseCgpa((payload as StudentAdminInput).cgpa),
    year: "year" in payload ? cleanText(payload.year) : null,
    section: "section" in payload ? cleanText(payload.section) : null,
    current_year: "current_year" in payload ? cleanText(payload.current_year) : null,
    gender: "gender" in payload ? cleanText(payload.gender) : null,
    resume_url: formatResumeUrl(payload.resume_url),
    nationality: "nationality" in payload ? cleanText(payload.nationality) : null,
    college: "college" in payload ? cleanText(payload.college) : null,
    dob: "dob" in payload ? formatDateISO(parseFlexibleDate(payload.dob)) : null,
    break_in_studies: "breakInStudies" in payload ? payload.breakInStudies ?? null : null,
    has_backlogs: "hasBacklogs" in payload ? payload.hasBacklogs ?? null : null,
    aadhar_number: "aadhar_number" in payload ? cleanText(payload.aadhar_number) : null,
    pan_card: "pan_card" in payload ? cleanText(payload.pan_card)?.toUpperCase() : null,
  };
}

function parseCgpa(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string") {
    const num = Number(value.trim());
    return Number.isNaN(num) ? null : num;
  }
  return null;
}

function formatResumeUrl(value?: string | null) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return `https://${cleaned}`;
}

