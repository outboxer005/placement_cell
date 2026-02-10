import type { SupabaseClient } from "@supabase/supabase-js";

export async function eligibleStudentIdsForDrive(db: SupabaseClient, driveId: number) {
  const { data: drive, error: driveError } = await db.from("drives").select("eligibility").eq("id", driveId).maybeSingle();
  if (driveError) throw new Error(driveError.message);
  if (!drive) return [];

  const eligibility = drive.eligibility || {};
  const minCgpa = typeof eligibility.min_cgpa === "number" ? eligibility.min_cgpa : 0;
  const branches: string[] = Array.isArray(eligibility.branches) ? eligibility.branches : [];

  let query = db.from("students").select("id");

  if (minCgpa > 0) {
    query = query.gte("cgpa", minCgpa);
  }
  if (branches.length > 0) {
    query = query.in("branch", branches);
  }

  const { data: rows, error: studentError } = await query;
  if (studentError) throw new Error(studentError.message);

  return rows?.map((row) => Number(row.id)) ?? [];
}

