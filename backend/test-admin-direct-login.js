#!/usr/bin/env node

/**
 * Quick test script for main admin login (bypassing database)
 */

const adminEmail = "admin@vignan.edu";
const adminPassword = "ChangeMe123";

async function testAdminLogin() {
    try {
        console.log("🧪 Testing main admin login...");
        console.log("   Email:", adminEmail);

        const response = await fetch("http://localhost:4000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: adminEmail,
                password: adminPassword,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("\n✅ SUCCESS! Main admin logged in!");
            console.log("   Token:", data.token?.substring(0, 50) + "...");
            console.log("   Role:", data.role);
            console.log("   Name:", data.name);
            console.log("   Email:", data.email);
            console.log("\n🎉 Admin login working perfectly (bypassed database)!");
        } else {
            console.log("\n❌ FAILED!");
            console.log("   Status:", response.status);
            console.log("   Error:", data.error || data);
        }
    } catch (error) {
        console.error("\n❌ Request failed:", error.message);
        console.log("   Make sure backend is running on http://localhost:4000");
    }
}

testAdminLogin();
