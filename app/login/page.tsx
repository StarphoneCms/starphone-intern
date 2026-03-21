"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  function validate() {
    const eMail = email.trim();
    const pw = password.trim();
    if (!eMail || !pw) { setMsg("Bitte E-Mail und Passwort ausfüllen."); return null; }
    if (pw.length < 6) { setMsg("Passwort muss mindestens 6 Zeichen haben."); return null; }
    return { eMail, pw };
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const v = validate();
    if (!v) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: v.eMail, password: v.pw });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    window.location.href = "/dashboard";
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const v = validate();
    if (!v) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: v.eMail, password: v.pw });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setMsg("Account erstellt. Bitte E-Mail bestätigen und dann einloggen.");
  }

  return (
    <main className="min-h-screen bg-[#0d0f14] flex items-center justify-center px-4">
      {/* Hintergrund Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 mb-4">
            <span className="text-2xl font-black text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Starphone Intern</h1>
          <p className="mt-1 text-sm text-slate-500">Werkstatt · Kunden · Aufträge</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-6 shadow-2xl shadow-black/40">

          {/* Tab Toggle */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setMsg(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Einloggen
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setMsg(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Registrieren
            </button>
          </div>

          <form onSubmit={mode === "login" ? signIn : signUp} className="space-y-4">
            {/* E-Mail */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@starphone.de"
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:bg-white/8 transition"
              />
            </div>

            {/* Passwort */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:bg-white/8 transition"
              />
            </div>

            {/* Fehler / Erfolg */}
            {msg && (
              <div className={`rounded-xl px-4 py-3 text-xs ${
                msg.includes("erstellt")
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border border-rose-500/20 bg-rose-500/10 text-rose-300"
              }`}>
                {msg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 hover:shadow-violet-500/30 disabled:opacity-50 mt-2"
            >
              {loading
                ? mode === "login" ? "Einloggen..." : "Registrieren..."
                : mode === "login" ? "Einloggen" : "Account erstellen"
              }
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Nur für autorisierte Mitarbeiter
        </p>
      </div>
    </main>
  );
}