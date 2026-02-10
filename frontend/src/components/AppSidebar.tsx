import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  FileText,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  Shield,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Role = "main-admin" | "branch-admin";
type Section = "overview" | "operations" | "system";

const SECTION_LABELS: Record<Section, string> = {
  overview: "Overview",
  operations: "Operations",
  system: "System",
};

const NAV_ITEMS: Array<{
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  section: Section;
  roles: Role[];
  description?: string;
}> = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      section: "overview",
      roles: ["main-admin", "branch-admin"],
      description: "Live stats & quick actions",
    },
    {
      title: "Students",
      url: "/students",
      icon: Users,
      section: "overview",
      roles: ["main-admin", "branch-admin"],
      description: "Profiles, filters & data requests",
    },
    {
      title: "Placement Drives",
      url: "/drives",
      icon: Briefcase,
      section: "operations",
      roles: ["main-admin", "branch-admin"],
      description: "Create, publish & track drives",
    },
    {
      title: "My Drives",
      url: "/my-drives",
      icon: FolderKanban,
      section: "operations",
      roles: ["main-admin", "branch-admin"],
      description: "Manage & track your drives",
    },
    {
      title: "Announcements",
      url: "/announcements",
      icon: Bell,
      section: "operations",
      roles: ["main-admin", "branch-admin"],
      description: "Broadcast updates & reminders",
    },
    {
      title: "Companies",
      url: "/companies",
      icon: Building2,
      section: "operations",
      roles: ["main-admin", "branch-admin"],
      description: "Partner info & requirements",
    },
    {
      title: "Admin Management",
      url: "/admin-management",
      icon: Shield,
      section: "operations",
      roles: ["main-admin"],
      description: "Approve & manage admin access",
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
      section: "overview",
      roles: ["main-admin", "branch-admin"],
      description: "Placement metrics & exports",
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      section: "operations",
      roles: ["main-admin", "branch-admin"],
      description: "Student level alerts history",
    },
  ];

interface AppSidebarProps {
  userRole?: Role;
  userName?: string;
  onNavigate?: () => void;
}

export function AppSidebar({ userRole = "main-admin", userName = "Admin User", onNavigate }: AppSidebarProps) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  const sectionOrder: Section[] = ["overview", "operations", "system"];
  const initials =
    userName
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "VU";

  return (
    <div className="flex h-full w-full flex-col bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 pt-8 pb-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-sidebar-primary flex items-center justify-center shadow-md">
            <GraduationCap className="h-7 w-7 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-base uppercase tracking-[0.4em] text-muted-foreground">Vignan</p>
            <h2 className="text-2xl font-semibold">Placement Command</h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2.5">
        {items.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/20 border shadow-sm",
                "bg-card text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-md",
                isActive && "bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/30 shadow-md",
                !isActive && "border-border"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold text-base">{item.title}</p>
              {item.description && <span className="text-sm text-muted-foreground block mt-0.5">{item.description}</span>}
            </div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
