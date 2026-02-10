import "dotenv/config";
import { supabase } from "../db";
import { hashPassword } from "../utils/password";

async function seedAdmin() {
    const email = process.env.SEED_ADMIN_EMAIL || "admin@vignan.edu";
    const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123";
    const name = process.env.SEED_ADMIN_NAME || "Main Admin";

    console.log(`Seeding admin: ${email}`);

    // Check if admin exists
    const { data: existing, error: findError } = await supabase
        .from("admins")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    if (findError) {
        console.error("Error checking admin:", findError.message);
        process.exit(1);
    }

    if (existing) {
        console.log("Admin already exists. Skipping.");
        return;
    }

    // Create admin
    const passwordHash = await hashPassword(password);
    const { error: createError } = await supabase.from("admins").insert({
        email,
        password_hash: passwordHash,
        name,
        role: "main-admin",
        status: "active"
    });

    if (createError) {
        console.error("Failed to create admin:", createError.message);
        process.exit(1);
    }

    console.log("✅ Admin created successfully.");
}

seedAdmin().catch(console.error);
