"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const INITIAL_PW = "Starphone2026!";

export default function SetupPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState<string>("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user || cancel) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", auth.user.id)
        .single();
      if (!cancel && data?.display_name) setDisplayName(data.display_name);
    })();
    return () => { cancel = true; };
  }, [supabase]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (pw1.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (pw1 === INITIAL_PW) {
      setError("Bitte ein neues Passwort wählen (nicht das Initialpasswort).");
      return;
    }
    if (pw1 !== pw2) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    const { error: pwError } = await supabase.auth.updateUser({ password: pw1 });
    if (pwError) {
      setLoading(false);
      setError(pwError.message || "Passwort konnte nicht gesetzt werden.");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setLoading(false);
      setError("Session abgelaufen. Bitte erneut anmelden.");
      return;
    }

    const { error: flagError } = await supabase
      .from("profiles")
      .update({ needs_password_setup: false })
      .eq("id", auth.user.id);

    setLoading(false);

    if (flagError) {
      setError(flagError.message);
      return;
    }

    router.push("/");
    router.refresh();
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
          <h1 className="text-[18px] font-semibold text-slate-900">Passwort festlegen</h1>
          <p className="text-[12px] text-slate-400 mt-1">
            {displayName ? `Willkommen, ${displayName}` : "Erstmaliger Login"}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <p className="text-[12px] text-slate-500">
            Bitte lege ein neues, persönliches Passwort fest. Mindestens 8 Zeichen,
            nicht das Initialpasswort.
          </p>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Neues Passwort
            </label>
            <input
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              autoComplete="new-password"
              className="w-full h-10 px-3 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
              className="w-full h-10 px-3 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Speichern…" : "Passwort speichern"}
          </button>
        </form>
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
