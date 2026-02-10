import "dotenv/config";
import { supabase } from "../db";
import { hashPassword } from "../utils/password";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file before syncing the main admin.");
  }

  const name = process.env.ADMIN_NAME || "Main Admin";
  const branch = process.env.ADMIN_BRANCH || null;
  const hashed = await hashPassword(password);

  console.log(`Syncing main admin for ${email}`);

  const { data, error } = await supabase
    .from("admins")
    .upsert(
      {
        email,
        name,
        branch,
        password_hash: hashed,
        role: "main-admin",
        status: "active",
      },
      { onConflict: "email" }
    )
    .select("id, email")
    .single();

  if (error) {
    throw new Error(`Failed to sync admin: ${error.message}`);
  }

  console.log(`Main admin synced successfully (id: ${data.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

