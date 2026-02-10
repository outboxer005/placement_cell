import { User, Lock, Bell, Shield, Monitor, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import { toast } from "sonner";


function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Select disabled value="system">
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  const getThemeIcon = (t: string | undefined) => {
    if (t === "light") return <Sun className="h-4 w-4" />;
    if (t === "dark") return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getThemeLabel = (t: string | undefined) => {
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "System";
  };

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          {getThemeIcon(theme)}
          <SelectValue placeholder="Theme" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function BranchThresholdsForm() {
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [newBranch, setNewBranch] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    (async () => {
      const res = await api.settings.getBranchThresholds();
      if (res.ok && res.data) {
        const payload = (res.data as any)?.thresholds || (res.data as any);
        setThresholds(payload || {});
      }
    })();
  }, []);

  async function save() {
    setLoading(true);
    try {
      const res = await api.settings.setBranchThresholds(thresholds);
      if (!res.ok) throw new Error("Save failed");
      toast.success("Thresholds updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function addBranch() {
    const key = newBranch.trim().toUpperCase();
    if (!key || !newValue) return toast.error("Branch and CGPA required");
    const value = Number(newValue);
    if (Number.isNaN(value)) return toast.error("Enter a valid number");
    setThresholds((prev) => ({ ...prev, [key]: value }));
    setNewBranch("");
    setNewValue("");
  }

  const entries = Object.entries(thresholds);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No branches configured yet.</p>}
        {entries.map(([branch, value]) => (
          <div key={branch} className="space-y-2 rounded-xl border p-4 bg-muted/30">
            <Label htmlFor={`th-${branch}`}>{branch}</Label>
            <Input
              id={`th-${branch}`}
              type="number"
              step="0.1"
              value={value ?? 0}
              onChange={(e) => setThresholds({ ...thresholds, [branch]: parseFloat(e.target.value) })}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_150px_auto]">
        <div className="space-y-2">
          <Label htmlFor="branch-name">Branch code</Label>
          <Input
            id="branch-name"
            placeholder="e.g., CSE"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-value">CGPA</Label>
          <Input
            id="branch-value"
            type="number"
            step="0.1"
            placeholder="7.0"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={addBranch} className="w-full">
            Add branch
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={loading} className="gradient-primary">
          {loading ? "Saving..." : "Save thresholds"}
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-foreground/80 mt-2">
          Manage your account preferences and system configurations
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="branch" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="h-4 w-4 mr-2" />
            Branch CGPA
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal and professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter last name" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@vignan.edu"
                  className="border-slate-300 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+91 XXXXX XXXXX" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" placeholder="Role" disabled />
              </div>

              <Button className="gradient-primary">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>

              <Button className="gradient-primary">Update Password</Button>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">Secure your account with two-factor authentication</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates about placements</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Drive Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming placement drives</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Student Updates</p>
                  <p className="text-sm text-muted-foreground">Alerts when students update their profiles</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>

                  <p className="text-sm text-muted-foreground">Receive weekly placement statistics</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="branch" className="space-y-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Branch CGPA Thresholds</CardTitle>
              <CardDescription>Set minimum CGPA per branch for eligibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BranchThresholdsForm />
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="system" className="space-y-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>Choose your preferred color theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Theme</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Select light, dark, or system theme</p>
                </div>
                <ThemeSelector />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-approve Eligibility</p>

                  <p className="text-sm text-muted-foreground">Automatically approve eligible students for drives</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Reminders</p>
                  <p className="text-sm text-muted-foreground">Send automated email reminders to students</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Export</p>
                  <p className="text-sm text-muted-foreground">Allow data export in CSV/Excel format</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
