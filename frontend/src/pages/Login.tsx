import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getAuth, setAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // If already logged in, redirect

  useEffect(() => {
    const a = getAuth();
    if (a.token) navigate("/dashboard", { replace: true });
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await api.login(trimmedEmail, password);
      if (!res.ok) throw new Error((res.data as any)?.error || "Login failed");
      const { token, role, name, branch } = res.data as any;
      setAuth({ token, role, name, email: trimmedEmail, branch });
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.3em] uppercase text-slate-500">Vignan</p>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  Placement<br />Command
                </h1>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="bg-white shadow-2xl rounded-3xl border border-orange-100">
              <CardHeader className="space-y-3 text-center pt-12 pb-6">
                <div className="flex justify-center mb-2">
                  <div className="p-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                    <Lock className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-slate-800">Admin Portal</CardTitle>
                <CardDescription className="text-base text-slate-600">
                  Sign in to continue
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8 pb-10">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@vignan.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        className="pl-12 h-14 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-14 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mt-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Vignan</p>
                <h2 className="text-xl font-bold text-slate-800">Placement Command</h2>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
