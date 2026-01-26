"use client";

import { useState } from "react";
import { Lock, Mail, Loader2 } from "lucide-react";
import { api } from "../api/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Save token
      localStorage.setItem('token', data.token);

      // Redirect
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Quick Dev Helper: Create User if not exists
    const email = prompt("Enter Email to Register:");
    if (!email) return;
    const password = prompt("Enter Password:");

    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          full_name: 'Admin User',
          masjid_name: 'My Masjid'
        })
      });
      alert("Registered! You can now login.");
    } catch (err: any) {
      alert(err.message || "Registration Failed");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center flex-col gap-4">
      <div className="mx-auto w-full max-w-sm space-y-6 rounded-lg border bg-white p-6 shadow-md dark:bg-gray-950 dark:border-gray-800">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="text-gray-500 dark:text-gray-400">Enter your credentials to access the mosque dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10"
                id="email"
                placeholder="admin@masjid.com"
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10"
                id="password"
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign In
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-2 text-center mt-4">
        <button onClick={handleRegister} className="text-xs text-blue-500 hover:underline">
          Need an account? Helper: Click to Register
        </button>
        <button onClick={async () => {
          const res = await fetch('/api/health');
          const text = await res.text();
          alert("Server Status: " + res.status + "\nResponse: " + text);
        }} className="text-xs text-gray-400 hover:text-gray-600 underline">
          Debug: Test Server Connection
        </button>
      </div>
      );
}
