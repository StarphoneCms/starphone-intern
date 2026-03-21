"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const eMail = email.trim();
    const pw = password.trim();

    if (!eMail || !pw) {
      setMsg("Bitte E-Mail und Passwort ausfüllen.");
      return null;
    }

    if (pw.length < 6) {
      setMsg("Passwort muss mindestens 6 Zeichen haben.");
      return null;
    }

    return { eMail, pw };
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const v = validate();
    if (!v) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: v.eMail,
      password: v.pw,
    });

    setLoading(false);

    if (error) {
      setMsg(`${error.name}: ${error.message}`);
      return;
    }

    window.location.href = "/dashboard";
  }

  async function signUp() {
    setMsg(null);

    const v = validate();
    if (!v) return;

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: v.eMail,
      password: v.pw,
    });

    setLoading(false);

    if (error) {
      setMsg(`${error.name}: ${error.message}`);
      return;
    }

    setMsg("Account erstellt. Falls E-Mail-Bestätigung aktiv ist, bitte erst bestätigen und dann einloggen.");
  }

  return (
    <main className="min-h-screen bg-[#11131a] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-slate-700/60 bg-[#181c24] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="mb-6">
            <div className="inline-flex rounded-full border border-slate-600/60 bg-slate-700/30 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
              STARPHONE · INTERN
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Login</h1>
            <p className="mt-2 text-sm text-slate-400">
              Interner Zugriff für Dashboard, Reparaturen und Werkstatt-Board.
            </p>
          </div>

          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">E-Mail</label>
              <input
                placeholder="name@starphone.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Passwort</label>
              <input
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Einloggen..." : "Einloggen"}
            </button>

            <button
              disabled={loading}
              type="button"
              onClick={signUp}
              className="w-full rounded-xl border border-slate-700/60 bg-[#12161d] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-[#171c25] disabled:opacity-60"
            >
              Account anlegen
            </button>

            {msg ? (
              <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {msg}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </main>
  );
}