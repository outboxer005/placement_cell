import { z } from "zod";
import type { Supabase } from "../db";
import { hashPassword } from "./password";

export const addressSchema = z.object({
  house: z.string().max(200).optional(),
  street: z.string().max(200).optional(),
  area: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(120).optional(),
});

export const educationSchema = z.object({
  courseName: z.string().max(200).optional(),
  durationFrom: z.string().max(40).optional(),
  durationTo: z.string().max(40).optional(),
  courseType: z.string().max(50).optional(),
  institute: z.string().max(200).optional(),
  board: z.string().max(200).optional(),
  specialization: z.string().max(200).optional(),
  marksObtained: z.string().max(50).optional(),
  totalMarks: z.string().max(50).optional(),
  percentage: z.string().max(50).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type EducationInput = z.infer<typeof educationSchema>;

export function parseFlexibleDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  const normalized = cleaned.replace(/[/.]/g, "-");
  const parts = normalized.split("-").map((part) => part.trim()).filter(Boolean);
  let year: number;
  let month: number;
  let day: number;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else if (parts[2].length === 4) {
      year = Number(parts[2]);
      month = Number(parts[1]);
      day = Number(parts[0]);
    } else {
      return null;
    }
    if ([year, month, day].some((n) => Number.isNaN(n))) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const fallback = new Date(cleaned);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDateISO(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export function dobPassword(date: Date): string {
  const dd = `${date.getUTCDate()}`.padStart(2, "0");
  const mm = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const yyyy = `${date.getUTCFullYear()}`;
  return `${dd}${mm}${yyyy}`;
}

export function cleanText(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function upsertAddress(db: Supabase, studentId: number, type: "permanent" | "present", payload?: AddressInput) {
  if (!payload) return;
  const house = cleanText(payload.house);
  const street = cleanText(payload.street);
  const area = cleanText(payload.area);
  const city = cleanText(payload.city);
  const state = cleanText(payload.state);
  const postalCode = cleanText(payload.postalCode);
  const country = cleanText(payload.country);
  const hasValue = [house, street, area, city, state, postalCode, country].some(Boolean);
  if (!hasValue) return;
  await db.from("addresses").delete().eq("student_id", studentId).eq("type", type);
  const { error } = await db.from("addresses").insert({
    student_id: studentId,
    type,
    house,
    street,
    area,
    city,
    state,
    postal_code: postalCode,
    country,
  });
  if (error) throw new Error(`Failed to upsert address: ${error.message}`);
}

export async function upsertEducation(
  db: Supabase,
  studentId: number,
  level: "degree" | "inter" | "ssc",
  payload?: EducationInput
) {
  if (!payload) return;
  const courseName = cleanText(payload.courseName);
  const courseType = cleanText(payload.courseType);
  const institute = cleanText(payload.institute);
  const board = cleanText(payload.board);
  const specialization = cleanText(payload.specialization);
  const marksObtained = cleanText(payload.marksObtained);
  const totalMarks = cleanText(payload.totalMarks);
  const rawPercentage = payload.percentage
    ? Number(payload.percentage.replace("%", "").trim())
    : null;
  const percentage = rawPercentage !== null && !Number.isNaN(rawPercentage) ? rawPercentage : null;
  const durationFrom = formatDateISO(parseFlexibleDate(payload.durationFrom));
  const durationTo = formatDateISO(parseFlexibleDate(payload.durationTo));
  const hasValue = [
    courseName,
    courseType,
    institute,
    board,
    specialization,
    marksObtained,
    totalMarks,
    durationFrom,
    durationTo,
    percentage,
  ].some((val) => val !== null && val !== undefined);
  if (!hasValue) return;
  await db.from("education_records").delete().eq("student_id", studentId).eq("level", level);
  const { error } = await db.from("education_records").insert({
    student_id: studentId,
    level,
    course_name: courseName,
    duration_from: durationFrom,
    duration_to: durationTo,
    course_type: courseType,
    institute,
    board,
    specialization,
    marks_obtained: marksObtained,
    total_marks: totalMarks,
    percentage,
  });
  if (error) throw new Error(`Failed to upsert education: ${error.message}`);
}

export async function ensureStudentPassword(db: Supabase, studentId: number, plain: string) {
  if (!plain) return;
  const hashed = await hashPassword(plain);
  const { error } = await db.from("student_auth").upsert(
    { student_id: studentId, password_hash: hashed },
    { onConflict: "student_id" }
  );
  if (error) throw new Error(`Failed to ensure password: ${error.message}`);
}

