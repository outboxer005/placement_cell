import { Router } from "express";
import jwt from "jsonwebtoken";
import { comparePassword, hashPassword } from "../utils/password";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addressSchema,
  educationSchema,
  parseFlexibleDate,
  formatDateISO,
  dobPassword,
  upsertAddress,
  upsertEducation,
  ensureStudentPassword,
} from "../utils/student-data";

export function authRoutes(db: SupabaseClient) {
  const r = Router();

  // Login schema
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  r.post("/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const { email, password } = parsed.data;

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET not set in environment");
        return res.status(500).json({ error: "Server configuration error" });
      }

      // ===== MAIN ADMIN LOGIN & OTHERS - CHECK DATABASE =====



      let { data: admin, error } = await db
        .from("admins")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Supabase query error in login:", error);
        return res.status(500).json({ error: "Database connection error. Please check server configuration." });
      }

      if (!admin) {
        const { count, error: countError } = await db.from("admins").select("*", { count: "exact", head: true });
        if (countError) {
          console.error("Supabase count error:", countError);
          return res.status(500).json({ error: "Database connection error. Please check server configuration." });
        }
        if (!count) {
          const { data: created, error: createError } = await db
            .from("admins")
            .insert({
              email: email.toLowerCase().trim(),
              name: "Main Admin",
              password_hash: await hashPassword(password),
              role: "main-admin",
              status: "active",
            })
            .select("*")
            .single();
          if (createError) {
            console.error("Supabase insert error:", createError);
            return res.status(500).json({ error: "Failed to create admin account. Please check database configuration." });
          }
          admin = created;
        } else {
          return res.status(401).json({ error: "Invalid email or password. Please check your credentials and try again." });
        }
      }

      const ok = await comparePassword(password, admin.password_hash as string);
      if (!ok) return res.status(401).json({ error: "Invalid email or password. Please check your credentials and try again." });

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("JWT_SECRET not set in environment");
        return res.status(500).json({ error: "Server configuration error" });
      }

      const token = jwt.sign(
        { sub: String(admin.id), role: admin.role, email: admin.email, branch: admin.branch || null },
        secret,
        { expiresIn: "8h" }
      );
      res.json({ token, role: admin.role, name: admin.name, email: admin.email, branch: admin.branch || null });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: err.message || "Internal server error during login" });
    }
  });

  r.post("/student/login", async (req, res) => {
    try {
      const regdId = (req.body?.regdId || req.body?.regd_id || "").trim();
      const password = (req.body?.password || "").toString().trim();
      if (!regdId || !password) return res.status(400).json({ error: "Please provide both registration ID and password" });

      const { data: student, error } = await db
        .from("students")
        .select("id, branch, dob")
        .eq("regd_id", regdId)
        .maybeSingle();
      if (error) return res.status(500).json({ error: "Database error. Please try again later." });
      if (!student) return res.status(401).json({ error: "Invalid registration ID or password. Please check your credentials." });

      const { data: authRow, error: authError } = await db
        .from("student_auth")
        .select("password_hash")
        .eq("student_id", student.id)
        .maybeSingle();
      if (authError) return res.status(500).json({ error: authError.message });

      let passwordHash = authRow?.password_hash as string | null;
      if (!passwordHash) {
        const dob = parseFlexibleDate(student.dob);
        if (!dob) return res.status(400).json({ error: "This account is missing a password. Please re-register." });
        const fallback = dobPassword(dob);
        passwordHash = await hashPassword(fallback);
        const { error: ensureError } = await db
          .from("student_auth")
          .upsert({ student_id: student.id, password_hash: passwordHash }, { onConflict: "student_id" });
        if (ensureError) return res.status(500).json({ error: ensureError.message });
      }

      if (!passwordHash) return res.status(400).json({ error: "Password not set. Please contact your administrator to reset your password." });
      const match = await comparePassword(password, passwordHash);
      if (!match) return res.status(401).json({ error: "Invalid registration ID or password. Please check your credentials." });

      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ error: "Server configuration error" });

      const token = jwt.sign(
        { sub: String(student.id), role: "student", branch: student.branch || null },
        secret,
        { expiresIn: "30d" }
      );
      return res.json({ token, role: "student", student_id: String(student.id), branch: student.branch || null });
    } catch (e: any) {
      console.error("student login error", e);
      return res.status(500).json({ error: e.message || "Login failed" });
    }
  });

  r.post("/student/register", async (req, res) => {
    try {
      const schema = z.object({
        regdId: z.string().min(3),
        first_name: z.string().min(1).max(60),
        last_name: z.string().max(60).optional(),
        fatherName: z.string().max(120).optional(),
        email: z.string().email().max(200),
        altEmail: z.string().email().max(200).optional(),
        phone: z.string().min(7).max(20),
        altPhone: z.string().min(7).max(20).optional(),
        branch: z.string().min(2).max(40),
        cgpa: z.number().min(0).max(10).optional(),
        year: z.string().max(10).optional(),
        gender: z.string().max(20).optional(),
        nationality: z.string().max(100).optional(),
        college: z.string().max(200).optional(),
        dob: z.string().min(4),
        password: z.string().min(6).max(100).optional(),
        resume_url: z.string().url().optional(),
        permanentAddress: addressSchema.optional(),
        presentAddress: addressSchema.optional(),
        degree: educationSchema.optional(),
        inter: educationSchema.optional(),
        ssc: educationSchema.optional(),
        breakInStudies: z.boolean().optional(),
        hasBacklogs: z.boolean().optional(),
      });
      const parsed = schema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const body = parsed.data;

      const dobDate = parseFlexibleDate(body.dob);
      if (!dobDate) return res.status(400).json({ error: "Invalid date of birth format" });
      const dobPg = formatDateISO(dobDate);
      const passwordSeed = (body.password?.trim().length ?? 0) >= 6 ? body.password!.trim() : dobPassword(dobDate);
      const cgpaVal = typeof body.cgpa === "number" ? body.cgpa : null;
      const resumeVal = body.resume_url ?? null;
      const breakFlag = typeof body.breakInStudies === "boolean" ? body.breakInStudies : null;
      const backlogFlag = typeof body.hasBacklogs === "boolean" ? body.hasBacklogs : null;

      let studentId: number | null = null;
      const { data: existing, error: existingError } = await db
        .from("students")
        .select("id")
        .eq("regd_id", body.regdId)
        .maybeSingle();
      if (existingError && existingError.code !== "PGRST116") return res.status(500).json({ error: existingError.message });

      const payload = {
        regd_id: body.regdId,
        first_name: body.first_name,
        last_name: body.last_name ?? null,
        father_name: body.fatherName ?? null,
        email: body.email,
        alt_email: body.altEmail ?? null,
        phone: body.phone,
        alt_phone: body.altPhone ?? null,
        branch: body.branch,
        cgpa: cgpaVal,
        year: body.year ?? null,
        gender: body.gender ?? null,
        resume_url: resumeVal,
        nationality: body.nationality ?? null,
        college: body.college ?? null,
        dob: dobPg,
        break_in_studies: breakFlag ?? false,
        has_backlogs: backlogFlag ?? false,
      };

      if (existing) {
        const { data: updated, error: updateError } = await db
          .from("students")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select("id")
          .single();
        if (updateError) return res.status(500).json({ error: updateError.message });
        studentId = updated.id;
      } else {
        const { data: inserted, error: insertError } = await db
          .from("students")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) return res.status(500).json({ error: insertError.message });
        studentId = inserted.id;
      }

      if (!studentId) throw new Error("Unable to persist student record");

      await upsertAddress(db, studentId, "permanent", body.permanentAddress);
      await upsertAddress(db, studentId, "present", body.presentAddress);
      await upsertEducation(db, studentId, "degree", body.degree);
      await upsertEducation(db, studentId, "inter", body.inter);
      await upsertEducation(db, studentId, "ssc", body.ssc);
      await ensureStudentPassword(db, studentId, passwordSeed);

      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ error: "Server configuration error" });

      const token = jwt.sign(
        { sub: String(studentId), role: "student", branch: body.branch || null },
        secret,
        { expiresIn: "30d" }
      );
      return res.json({ token, role: "student", student_id: String(studentId), branch: body.branch || null });
    } catch (e: any) {
      console.error("student register error", e);
      return res.status(500).json({ error: e.message || "Registration failed" });
    }
  });

  r.get("/me", (req, res) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) return res.json({ ok: false });
      const secret = process.env.JWT_SECRET;
      if (!secret) return res.json({ ok: false, error: "Server configuration error" });
      const payload = jwt.verify(token, secret);
      return res.json({ ok: true, user: payload });
    } catch {
      return res.json({ ok: false });
    }
  });

  return r;
}

