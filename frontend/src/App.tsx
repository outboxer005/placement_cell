import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Drives from "./pages/Drives";
import DriveDetail from "./pages/DriveDetail";
import MyDrives from "./pages/MyDrives";
import Companies from "./pages/Companies";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import AdminManagement from "./pages/AdminManagement";
import Announcements from "./pages/Announcements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { role } = useAuth();
  const resolvedRole: "main-admin" | "branch-admin" = role === "branch-admin" ? "branch-admin" : "main-admin";
  const isMainAdmin = resolvedRole === "main-admin";
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <Dashboard />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/students"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <Students />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/drives"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <Drives />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/drives/:id"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <DriveDetail />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/my-drives"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <MyDrives />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/companies"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <Companies />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/reports"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <Reports />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/announcements"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <Announcements />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <Notifications />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <DashboardLayout userRole={resolvedRole}>
              <Settings />
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin-management"
        element={
          <RequireAuth>
            {isMainAdmin ? (
              <DashboardLayout userRole="main-admin"><AdminManagement /></DashboardLayout>
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
