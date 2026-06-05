"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setEmailSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/matches");
    }
    setLoading(false);
  }

  if (emailSent) {
    return (
      <div className="max-w-sm mx-auto mt-16 text-center space-y-3">
        <div className="text-4xl">📬</div>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-gray-500">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.</p>
        <button onClick={() => setMode("login")} className="text-sm text-[#1D9E75] hover:underline">Back to login</button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-[#1D9E75] text-white text-xl flex items-center justify-center mx-auto mb-3">⚽</div>
        <h1 className="text-xl font-semibold">PoolFC</h1>
        <p className="text-sm text-gray-500 mt-1">{mode === "login" ? "Sign in to your account" : "Create your account"}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marco Rodriguez"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          className="text-[#1D9E75] hover:underline font-medium"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
