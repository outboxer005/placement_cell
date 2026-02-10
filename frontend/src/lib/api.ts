const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";

function getToken(): string | null {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  try {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("auth_name");
      localStorage.removeItem("auth_email");
      localStorage.removeItem("auth_branch");
      window.location.href = "/";
      throw new Error("Unauthorized");
    }
    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
    } catch {
      return { ok: res.ok, status: res.status, data: text };
    }
  } catch (error: any) {
    if (error.message === "Unauthorized") throw error;
    // Provide user-friendly error messages
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to server. Please check your internet connection.");
    }
    throw new Error(error.message || "An unexpected error occurred. Please try again.");
  }
}

export const api = {
  login: (email: string, password: string) => apiFetch(`/auth/login`, { method: "POST", body: JSON.stringify({ email, password }) }),
  admins: {
    list: () => apiFetch(`/admins`),
    create: (body: any) => apiFetch(`/admins`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch(`/admins/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    updatePassword: (id: string, password: string) => apiFetch(`/admins/${id}/password`, { method: "PATCH", body: JSON.stringify({ password }) }),
    updateStatus: (id: string, status: "active" | "inactive") => apiFetch(`/admins/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    remove: (id: string) => apiFetch(`/admins/${id}`, { method: "DELETE" }),
  },
  students: {
    list: (params: { branch?: string; year?: string; minCgpa?: number; maxCgpa?: number; hasBacklogs?: boolean } = {}) => {
      const q = new URLSearchParams();
      if (params.branch && params.branch.trim()) q.set("branch", params.branch.trim());
      if (params.year && params.year.trim()) q.set("year", params.year.trim());
      if (params.minCgpa !== undefined) q.set("minCgpa", String(params.minCgpa));
      if (params.maxCgpa !== undefined) q.set("maxCgpa", String(params.maxCgpa));
      if (params.hasBacklogs !== undefined) q.set("hasBacklogs", String(params.hasBacklogs));
      const qs = q.toString();
      return apiFetch(`/students${qs ? `?${qs}` : ""}`);
    },
    detail: (id: string) => apiFetch(`/students/${id}`),
    create: (body: any) => apiFetch(`/students`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch(`/students/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch(`/students/${id}`, { method: "DELETE" }),
    requestData: (id: string, fields: string[]) => apiFetch(`/students/${id}/request-data`, { method: "POST", body: JSON.stringify({ fields }) }),
    importCgpa: (rows: Array<{ regd_id: string; cgpa: number }>) => apiFetch(`/students/import-cgpa`, { method: "POST", body: JSON.stringify({ rows }) }),
  },
  drives: {
    list: () => apiFetch(`/drives`),
    detail: (id: string) => apiFetch(`/drives/${id}`),
    create: (payload: any) => apiFetch(`/drives`, { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, body: any) => apiFetch(`/drives/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch(`/drives/${id}`, { method: "DELETE" }),
    publish: (id: string) => apiFetch(`/drives/${id}/publish`, { method: "POST" }),
  },
  companies: {
    list: () => apiFetch(`/companies`),
    create: (body: any) => apiFetch(`/companies`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: any) => apiFetch(`/companies/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: number) => apiFetch(`/companies/${id}`, { method: "DELETE" }),
  },
  applications: {
    list: (filters?: { driveId?: string; studentId?: string; expand?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.driveId) params.set('drive_id', filters.driveId);
      if (filters?.studentId) params.set('student_id', filters.studentId);
      if (filters?.expand) params.set('expand', 'true');
      return apiFetch(`/applications?${params}`);
    },
    updateStatus: (id: string, status: string) =>
      apiFetch(`/applications/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
    bulkUpdateStatus: (ids: string[], status: "pending" | "accepted" | "rejected") =>
      apiFetch(`/applications/bulk-status`, { method: "PUT", body: JSON.stringify({ ids, status }) }),
    delete: (id: string) => apiFetch(`/applications/${id}`, { method: "DELETE" }),
  },
  notifications: {
    list: (params?: { type?: string; startDate?: string; endDate?: string; branch?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set("type", params.type);
      if (params?.startDate) q.set("startDate", params.startDate);
      if (params?.endDate) q.set("endDate", params.endDate);
      if (params?.branch) q.set("branch", params.branch);
      const qs = q.toString();
      return apiFetch(`/notifications${qs ? `?${qs}` : ""}`);
    },
    markRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "POST" }),
    update: (id: string, body: { title?: string; message?: string; payload?: any }) =>
      apiFetch(`/notifications/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch(`/notifications/${id}`, { method: "DELETE" }),
    bulkDelete: (ids: number[]) => apiFetch(`/notifications/bulk`, { method: "DELETE", body: JSON.stringify({ ids }) }),
    broadcast: (body: { title?: string; message: string; audience: any; driveId?: string }) =>
      apiFetch(`/notifications/broadcast`, { method: "POST", body: JSON.stringify(body) }),
  },
  reports: {
    summary: () => apiFetch(`/reports/summary`),
    branchStats: () => apiFetch(`/reports/branch-stats`),
    applicationAnalytics: () => apiFetch(`/reports/application-analytics`),
    driveAnalytics: (id: string) => apiFetch(`/reports/drive-analytics/${id}`),
    companyAnalytics: () => apiFetch(`/reports/company-analytics`),
    studentAnalytics: () => apiFetch(`/reports/student-analytics`),
  },
  settings: {
    getBranchThresholds: () => apiFetch(`/settings/branch-thresholds`),
    setBranchThresholds: (thresholds: Record<string, number>) => apiFetch(`/settings/branch-thresholds`, { method: "PUT", body: JSON.stringify({ thresholds }) }),
  },
};

