import { Router } from "express";
import { hashPassword } from "../utils/password";
import { requireAuth, requireMainAdmin } from "../middleware/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export function adminsRoutes(db: SupabaseClient) {
  const r = Router();
  r.use(requireAuth, requireMainAdmin);

  r.get("/", async (_req, res) => {
    const { data, error } = await db
      .from("admins")
      .select("id, name, email, role, branch, status, created_at")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  r.post("/", async (req, res) => {
    const { name, email, password, role, branch } = req.body || {};
    if (!name || !email || !password || !role) return res.status(400).json({ error: "Missing fields" });
    if (role === "branch-admin" && !branch) return res.status(400).json({ error: "Branch required" });
    const { data: existing, error: existingError } = await db.from("admins").select("id").eq("email", email).maybeSingle();
    if (existingError && existingError.code !== "PGRST116") return res.status(500).json({ error: existingError.message });
    if (existing) return res.status(409).json({ error: "Email already exists" });
    const password_hash = await hashPassword(password);
    const { data, error } = await db
      .from("admins")
      .insert({ name, email, password_hash, role, branch: branch ?? null, status: "active" })
      .select("id, name, email, role, branch, status")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  });

  r.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const user = (req as any).user as { sub: string };
    const { name, email, role, branch } = req.body || {};

    // Prevent admin from modifying their own role
    if (Number(user.sub) === id && role && role !== req.body.currentRole) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (branch !== undefined) updates.branch = role === "branch-admin" ? branch : null;

    if (!Object.keys(updates).length) return res.json({ ok: true });

    const { data, error } = await db.from("admins").update(updates).eq("id", id).select("id, name, email, role, branch, status").single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  r.patch("/:id/password", async (req, res) => {
    const id = Number(req.params.id);
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: "Password required" });

    const password_hash = await hashPassword(password);
    const { error } = await db.from("admins").update({ password_hash }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, message: "Password updated" });
  });

  r.patch("/:id/status", async (req, res) => {
    const id = Number(req.params.id);
    const user = (req as any).user as { sub: string };
    const { status } = req.body || {};

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'active' or 'inactive'" });
    }

    // Prevent admin from deactivating themselves
    if (Number(user.sub) === id) {
      return res.status(400).json({ error: "Cannot change your own status" });
    }

    const { error } = await db.from("admins").update({ status }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, message: `Admin ${status}` });
  });

  r.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { error } = await db.from("admins").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  return r;
}

