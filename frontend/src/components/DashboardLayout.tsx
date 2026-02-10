import { useState } from "react";
import { Bell, Menu, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationPermission } from "@/components/NotificationPermission";
import { getAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: "main-admin" | "branch-admin";
  userName?: string;
}

export function DashboardLayout({ children, userRole = "main-admin", userName }: DashboardLayoutProps) {
  const a = getAuth();
  const name = userName || a.name || a.email || "Admin";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden">
      {/* Desktop sidebar - FIXED, full height, independently scrollable */}
      <div className="hidden lg:flex lg:w-72 xl:w-80 shadow-lg border-r border-border flex-shrink-0 h-screen overflow-y-auto">
        <AppSidebar userRole={userRole} userName={name} />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 border-r border-border bg-background">
          <AppSidebar userRole={userRole} userName={name} onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area - INDEPENDENTLY scrollable */}
      <div className="flex-1 flex flex-col bg-background h-screen overflow-hidden">
        {/* Header - FIXED at top */}
        <header className="flex-shrink-0 border-b border-border bg-card/95 backdrop-blur-sm shadow-sm">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold tracking-tight">Admin Portal</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[120px]">{name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole.replace("-", " ")}</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-primary/70 opacity-60" />
                <span className="absolute top-2 right-2 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  try {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("auth_role");
                    localStorage.removeItem("auth_name");
                    localStorage.removeItem("auth_email");
                    localStorage.removeItem("auth_branch");
                  } finally {
                    window.location.href = "/";
                  }
                }}
                title="Sign Out"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content - SCROLLABLE area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            {children}
          </div>
        </main>
      </div>
      <NotificationPermission />
    </div>
  );
}
