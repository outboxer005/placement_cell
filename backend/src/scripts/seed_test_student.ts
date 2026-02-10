import "dotenv/config";
import { supabase } from "../db";
import { dobPassword, parseFlexibleDate, ensureStudentPassword } from "../utils/student-data";

async function main() {
  const regd = (process.argv[2] || process.env.REGD || "VU2025001").trim();
  const name = process.env.NAME || "Test Student";
  const branch = process.env.BRANCH || "CSE";
  const cgpaFinal = Number(process.env.CGPA || 8.2);
  const dobString = process.env.DOB || "01-01-2000"; // Default DOB for password
  const password = process.env.PASSWORD; // Optional explicit password

  if (!regd) throw new Error("Provide regd as argv[2] or REGD env");

  const dobDate = parseFlexibleDate(dobString);
  if (!dobDate) throw new Error("Invalid DOB format for seeding");
  const dobPg = dobDate.toISOString().slice(0, 10); // Format for Postgres date type
  const passwordSeed = password || dobPassword(dobDate);

  const { data: existing, error: existingError } = await supabase
    .from("students")
    .select("id")
    .eq("regd_id", regd)
    .maybeSingle();
  if (existingError && existingError.code !== "PGRST116") throw new Error(existingError.message);

  let studentId: number;
  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("students")
      .update({
        full_name: name,
        branch: branch,
        cgpa: cgpaFinal,
        dob: dobPg,
        updated_at: new Date().toISOString(),
      })
      .eq("regd_id", regd)
      .select("id")
      .single();
    if (updateError) throw new Error(updateError.message);
    studentId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("students")
      .insert({
      regd_id: regd,
        full_name: name,
        branch: branch,
        cgpa: cgpaFinal,
        dob: dobPg,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);
    studentId = inserted.id;
  }

  await ensureStudentPassword(supabase, studentId, passwordSeed);

  const { data: exists, error: fetchError } = await supabase
    .from("students")
    .select("id, regd_id, full_name, branch, cgpa, dob")
    .eq("id", studentId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);

  console.log("Seeded/updated student:", exists);
  console.log("Use this regdId to login via mobile app:", regd);
  console.log("Default password (if not set via env) is DOB in DDMMYYYY format:", dobPassword(dobDate));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

