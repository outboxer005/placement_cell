import { useEffect, useState } from "react";

export type Role = "main-admin" | "branch-admin" | null;

export function getAuth() {
  const token = localStorage.getItem("auth_token");
  const role = (localStorage.getItem("auth_role") as Role) || null;
  const name = localStorage.getItem("auth_name");
  const email = localStorage.getItem("auth_email");
  const branch = localStorage.getItem("auth_branch");
  return { token, role, name, email, branch };
}

export function setAuth(data: { token: string; role: string; name?: string; email?: string; branch?: string | null }) {
  localStorage.setItem("auth_token", data.token);
  localStorage.setItem("auth_role", data.role);
  if (data.name) localStorage.setItem("auth_name", data.name);
  if (data.email) localStorage.setItem("auth_email", data.email);
  if (data.branch !== undefined && data.branch !== null) localStorage.setItem("auth_branch", data.branch);
}

export function clearAuth() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_role");
  localStorage.removeItem("auth_name");
  localStorage.removeItem("auth_email");
  localStorage.removeItem("auth_branch");
}

export function useAuth() {
  // Initialize synchronously from localStorage to avoid redirect flicker/loops
  const initial = getAuth();
  const [token, setToken] = useState<string | null>(initial.token);
  const [role, setRole] = useState<Role>(initial.role);
  const [branch, setBranch] = useState<string | null>(initial.branch || null);

  // In case something else updates storage, sync once on mount
  useEffect(() => {
    const a = getAuth();
    if (a.token !== token) setToken(a.token);
    if (a.role !== role) setRole(a.role);
    if (a.branch !== branch) setBranch(a.branch || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    token,
    role,
    branch,
    isAuthed: Boolean(token),
    logout: () => {
      clearAuth();
      setToken(null);
      setRole(null);
      setBranch(null);
    },
  };
}

