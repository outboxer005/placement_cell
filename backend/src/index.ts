import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./db";
import { authRoutes } from "./routes/auth";
import { adminsRoutes } from "./routes/admins";
import { adminRoutes } from "./routes/admin";
import { studentsRoutes } from "./routes/students";
import { companiesRoutes } from "./routes/companies";
import { drivesRoutes } from "./routes/drives";
import { applicationsRoutes } from "./routes/applications";
import { notificationsRoutes } from "./routes/notifications";
import { reportsRoutes } from "./routes/reports";
import { settingsRoutes } from "./routes/settings";
import { hashPassword } from "./utils/password";
import { initializeFirebase } from "./services/fcm-service";

// Initialize Firebase Admin SDK for push notifications
initializeFirebase();

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  // Admin login is handled via database check.
  // Make sure to run 'npm run seed:admin' to create the initial admin account.

  app.get("/api/health", async (_req, res) => {
    try {
      // Test Supabase connection
      const { error } = await supabase.from("admins").select("id").limit(1);
      if (error) {
        return res.status(503).json({
          ok: false,
          error: "Database connection failed",
          message: error.message
        });
      }
      res.json({
        ok: true,
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(503).json({
        ok: false,
        error: "Health check failed",
        message: err.message
      });
    }
  });

  // API Routes
  app.use("/api/auth", authRoutes(supabase));
  app.use("/api/admin", adminRoutes(supabase)); // New admin-specific routes
  app.use("/api/admins", adminsRoutes(supabase));
  app.use("/api/students", studentsRoutes(supabase));
  app.use("/api/companies", companiesRoutes(supabase));
  app.use("/api/drives", drivesRoutes(supabase));
  app.use("/api/applications", applicationsRoutes(supabase));
  app.use("/api/notifications", notificationsRoutes(supabase));
  app.use("/api/reports", reportsRoutes(supabase));
  app.use("/api/settings", settingsRoutes(supabase));

  // Global error handler (last)
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("Unhandled error:", err?.stack || err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  });

  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '0.0.0.0';
  app.listen(port, host, () => console.log(`API server listening on ${host}:${port}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

