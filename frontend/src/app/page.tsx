"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "../api/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('token')) router.push('/dashboard');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter email and password"); return; }

    setLoading(true); setError("");

    try {
      const loginData = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('token', loginData.token);
      router.push('/dashboard');
    } catch (loginErr: any) {
      if (loginErr.message === 'Invalid credentials') {
        try {
          const registerData = await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, full_name: 'Admin User', masjid_name: 'My Masjid' }) });
          localStorage.setItem('token', registerData.token);
          router.push('/dashboard');
        } catch (regErr: any) { setError(regErr.message); }
      } else { setError(loginErr.message); }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Floating Shapes */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur shadow-2xl mb-4">
            <span className="text-5xl">🕌</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Masjid ERP</h1>
          <p className="text-white/70 mt-2">Complete Mosque Management System</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl border-0 backdrop-blur bg-white/95 dark:bg-slate-900/95">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="admin@masjid.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-lg gap-2">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Please wait...</> : "Continue →"}
              </Button>
            </form>

            <p className="text-center text-muted-foreground text-xs mt-6">
              New users are automatically registered. First user becomes Chairman.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-white/50 text-sm mt-6">
          © 2026 Masjid ERP. Built with ❤️ for the Ummah
        </p>
      </div>
    </div>
  );
}
