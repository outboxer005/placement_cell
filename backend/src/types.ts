import { z } from "zod";

export const AdminRole = z.enum(["main-admin", "branch-admin"]);
export type AdminRole = z.infer<typeof AdminRole>;

export const AdminSchema = z.object({
  id: z.number().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  password_hash: z.string(),
  role: AdminRole,
  branch: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  created_at: z.date().default(() => new Date()),
});
export type Admin = z.infer<typeof AdminSchema>;

export const StudentSchema = z.object({
  id: z.number().optional(),
  regd_id: z.string(),
  full_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  branch: z.string().optional(),
  cgpa: z.number().optional(),
  year: z.string().optional(),
  resume_url: z.string().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});
export type Student = z.infer<typeof StudentSchema>;

export const CompanySchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  info: z.any().optional(),
  created_at: z.date().default(() => new Date()),
});
export type Company = z.infer<typeof CompanySchema>;

export const DriveSchema = z.object({
  id: z.number().optional(),
  company_id: z.number().nullable(),
  title: z.string(),
  description: z.string().optional(),
  publish_date: z.date().optional(),
  eligibility: z.object({
    min_cgpa: z.number().default(7),
    branches: z.array(z.string()).default([]),
  }),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});
export type Drive = z.infer<typeof DriveSchema>;

export const ApplicationSchema = z.object({
  id: z.number().optional(),
  drive_id: z.number(),
  student_id: z.number(),
  applied_at: z.date().default(() => new Date()),
  status: z.string().default("pending"),
  status_history: z.array(z.any()).default([]),
});
export type Application = z.infer<typeof ApplicationSchema>;

export const NotificationSchema = z.object({
  id: z.number().optional(),
  student_id: z.number(),
  type: z.string(),
  payload: z.any().optional(),
  read: z.boolean().default(false),
  created_at: z.date().default(() => new Date()),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const BranchThresholdsSchema = z.object({
  id: z.number().optional(),
  thresholds: z.record(z.number()).default({}),
  updated_at: z.date().default(() => new Date()),
});
export type BranchThresholds = z.infer<typeof BranchThresholdsSchema>;

