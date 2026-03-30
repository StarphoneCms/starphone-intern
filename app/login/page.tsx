"use client";

// Pfad: src/app/login/page.tsx

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";

const CHARS = ["S", "P", "0", "1", "◈", "△", "◻", "⬡", "∞", "⊕", "◇", "⬟"];

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 60;
    const particles = Array.from({ length: COUNT }, () => ({
      x:     Math.random() * canvas!.width,
      y:     Math.random() * canvas!.height,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      char:  CHARS[Math.floor(Math.random() * CHARS.length)],
      size:  10 + Math.random() * 10,
      alpha: 0.07 + Math.random() * 0.16,
      pulse: Math.random() * Math.PI * 2,
    }));

    let animId: number;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.011;
        if (p.x < -20) p.x = canvas!.width + 20;
        if (p.x > canvas!.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas!.height + 20;
        if (p.y > canvas!.height + 20) p.y = -20;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx!.save();
        ctx!.globalAlpha = a;
        ctx!.font = `${p.size}px monospace`;
        ctx!.fillStyle = "#ffffff";
        ctx!.fillText(p.char, p.x, p.y);
        ctx!.restore();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx!.save();
            ctx!.globalAlpha = (1 - dist / 100) * 0.10;
            ctx!.strokeStyle = "#ffffff";
            ctx!.lineWidth = 0.5;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
            ctx!.restore();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

export default function LoginPage() {
  const supabase = createClient();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [msg,      setMsg]      = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState<"login" | "signup">("login");

  function validate() {
    const eMail = email.trim(), pw = password.trim();
    if (!eMail || !pw) { setMsg("Bitte E-Mail und Passwort ausfüllen."); return null; }
    if (pw.length < 6) { setMsg("Passwort muss mindestens 6 Zeichen haben."); return null; }
    return { eMail, pw };
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const v = validate(); if (!v) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: v.eMail, password: v.pw });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    window.location.href = "/dashboard";
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const v = validate(); if (!v) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: v.eMail, password: v.pw });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setMsg("Account erstellt. Bitte E-Mail bestätigen und dann einloggen.");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 40, padding: "0 12px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, color: "white", fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      <style>{`
        header, header + .h-12 { display: none !important; }

        /* Fix iOS/Chrome Autofill hellblauer Hintergrund */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 100px rgba(30, 30, 50, 0.95) inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 10px !important;
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, background: "#09090f", zIndex: -1 }} />
      <ParticleCanvas />

      <main style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 16, position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* Logo */}
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <img src="/icons/logo.png" alt="Starphone"
              style={{ height: 36, width: "auto", margin: "0 auto 16px", filter: "invert(1)", display: "block" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "white", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              Starphone Intern
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Werkstatt · Kunden · Aufträge
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, overflow: "hidden",
          }}>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {(["login", "signup"] as const).map((m) => (
                <button key={m} type="button" onClick={() => { setMode(m); setMsg(null); }}
                  style={{
                    flex: 1, padding: "12px 0", background: "none", border: "none",
                    borderBottom: mode === m ? "2px solid white" : "2px solid transparent",
                    color: mode === m ? "white" : "rgba(255,255,255,0.35)",
                    fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "color 0.15s",
                  }}>
                  {m === "login" ? "Einloggen" : "Registrieren"}
                </button>
              ))}
            </div>

            <div style={{ padding: "20px 20px 24px" }}>
              <form onSubmit={mode === "login" ? signIn : signUp}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "block", fontSize: 10, fontWeight: 600,
                    color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
                    letterSpacing: "0.08em", marginBottom: 6,
                  }}>E-Mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@starphone.de" style={inputStyle} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "block", fontSize: 10, fontWeight: 600,
                    color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
                    letterSpacing: "0.08em", marginBottom: 6,
                  }}>Passwort</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" style={inputStyle} />
                </div>

                {msg && (
                  <div style={{
                    marginBottom: 14, padding: "10px 12px", borderRadius: 10, fontSize: 12,
                    background: msg.includes("erstellt") ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                    border: `1px solid ${msg.includes("erstellt") ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    color: msg.includes("erstellt") ? "#6ee7b7" : "#fca5a5",
                  }}>{msg}</div>
                )}

                <button type="submit" disabled={loading} style={{
                  width: "100%", height: 42, background: "white", border: "none",
                  borderRadius: 10, color: "#111", fontSize: 13, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1, transition: "opacity 0.15s",
                }}>
                  {loading
                    ? mode === "login" ? "Einloggen…" : "Registrieren…"
                    : mode === "login" ? "Einloggen"  : "Account erstellen"}
                </button>
              </form>
            </div>
          </div>

          <p style={{ marginTop: 20, textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.2)" }}>
            Nur für autorisierte Mitarbeiter
          </p>
        </div>
      </main>
    </>
  );
}