import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export function companiesRoutes(db: SupabaseClient) {
  const r = Router();
  r.use(requireAuth);

  r.get("/", async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 200) || 200, 500);
    const offset = Number(req.query.offset ?? 0) || 0;
    const { data, error } = await db
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  r.post("/", async (req, res) => {
    const body = req.body || {};
    const payload = {
      name: body.name,
      info: body.info ?? {},
    };
    const { data, error } = await db
      .from("companies")
      .upsert(payload, { onConflict: "name" })
      .select("*")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  });

  r.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const updates: Record<string, any> = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.info) updates.info = req.body.info;
    if (!Object.keys(updates).length) return res.json({ ok: true });
    const { error } = await db.from("companies").update(updates).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  r.delete("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid company ID" });

      // Check if company has any drives
      const { count } = await db
        .from("drives")
        .select("id", { count: "exact" })
        .eq("company_id", id);

      if (count && count > 0) {
        return res.status(400).json({
          error: "Cannot delete company with existing drives",
          driveCount: count
        });
      }

      const { error } = await db.from("companies").delete().eq("id", id);
      if (error) return res.status(500).json({ error: error.message });

      res.json({ ok: true, message: "Company deleted successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to delete company" });
    }
  });

  return r;
}

