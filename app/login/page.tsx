"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const GENERIC_AUTH_ERROR = "Benutzername oder Passwort falsch";

function sanitizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

function validate(username: string, password: string): string | null {
  if (username.length < 2) {
    return "Benutzername muss mindestens 2 Zeichen lang sein.";
  }
  if (password.length < 6) {
    return "Passwort muss mindestens 6 Zeichen lang sein.";
  }
  return null;
}

function LoginForm() {
  const search = useSearchParams();
  const preError = search.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(
    preError === "deactivated" ? "Dieser Account wurde deaktiviert." : null
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const uname = sanitizeUsername(username);
    const validationError = validate(uname, password);
    if (validationError) {
      setMsg(validationError);
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/auth/resolve-username", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: uname }),
      });

      if (resp.status === 404) {
        setMsg(GENERIC_AUTH_ERROR);
        return;
      }
      if (!resp.ok) {
        setMsg("Anmeldung derzeit nicht möglich. Bitte später erneut versuchen.");
        return;
      }

      const { email } = (await resp.json()) as { email?: string };
      if (!email) {
        setMsg(GENERIC_AUTH_ERROR);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setMsg(GENERIC_AUTH_ERROR);
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("needs_password_setup")
          .eq("id", uid)
          .maybeSingle();
        if (profile?.needs_password_setup) {
          window.location.href = "/setup-password";
          return;
        }
      }
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/icons/logo.png"
            alt="Starphone"
            width={140}
            height={40}
            priority
            className="h-10 w-auto mb-4"
          />
          <h1 className="text-[18px] font-semibold text-slate-900">Starphone Intern</h1>
          <p className="text-[12px] text-slate-400 mt-1">Werkstatt · Kunden · Aufträge</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              placeholder="Benutzername"
              className="w-full h-10 px-3 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full h-10 px-3 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {msg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Anmelden…" : "Anmelden"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Nur für autorisierte Mitarbeiter
        </p>
      </div>

      <style jsx global>{`
        header,
        nav[class*="md:hidden fixed bottom-0"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
