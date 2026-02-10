import "dotenv/config";
import { supabase } from "./db";
import { hashPassword } from "./utils/password";

async function resetStudentPassword() {
    const regdId = "231FA04G32";
    const dob = "2005-07-06"; // From database

    // Calculate password as DDMMYYYY from DOB
    const dobDate = new Date(dob);
    const dd = String(dobDate.getUTCDate()).padStart(2, "0");
    const mm = String(dobDate.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = String(dobDate.getUTCFullYear());
    const password = `${dd}${mm}${yyyy}`;

    console.log(`Resetting password for student: ${regdId}`);
    console.log(`DOB: ${dob}`);
    console.log(`Calculated password: ${password}`);

    // Get student ID
    const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("regd_id", regdId)
        .single();

    if (studentError || !student) {
        console.error("Student not found:", studentError?.message);
        process.exit(1);
    }

    console.log(`Student ID: ${student.id}`);

    // Hash password
    const passwordHash = await hashPassword(password);
    console.log(`Password hash: ${passwordHash.substring(0, 20)}...`);

    // Update student_auth table
    const { error } = await supabase
        .from("student_auth")
        .upsert(
            {
                student_id: student.id,
                password_hash: passwordHash
            },
            { onConflict: "student_id" }
        );

    if (error) {
        console.error("Failed to update password:", error.message);
        process.exit(1);
    }

    console.log("✅ Password reset successfully!");
    console.log(`\nYou can now login with:`);
    console.log(`  Registration ID: ${regdId}`);
    console.log(`  Password: ${password}`);

    process.exit(0);
}

resetStudentPassword();
