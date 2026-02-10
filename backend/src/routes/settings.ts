import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export function settingsRoutes(db: SupabaseClient) {
  const r = Router();
  r.use(requireAuth);

  r.get("/branch-thresholds", async (_req, res) => {
    const { data, error } = await db.from("settings").select("value").eq("key", "branch_thresholds").maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.value || { type: "branch_thresholds", thresholds: {} });
  });

  r.put("/branch-thresholds", async (req, res) => {
    const thresholds = req.body?.thresholds || {};
    const { error } = await db
      .from("settings")
      .upsert(
        { key: "branch_thresholds", value: { thresholds }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
    );
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  return r;
}

