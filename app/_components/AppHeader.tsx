"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
    </svg>
  )},
  { href: "/customers", label: "Kunden", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
    </svg>
  )},
  { href: "/repairs", label: "Reparaturen", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12 4l4 4-8 8-4-4 8-8z" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"/>
      <path d="M14 2l4 4-1.5 1.5L12.5 3.5 14 2z" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"/>
      <path d="M3 17l1-4 3 3-4 1z" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"/>
    </svg>
  )},
  { href: "/prices", label: "Preisliste", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <line x1="7" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
      <line x1="7" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
    </svg>
  )},
  { href: "/inventory", label: "Inventar", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
    </svg>
  )},
  { href: "/documents", label: "Dokumente", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 3h7l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"/>
      <path d="M12 3v4h4" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"/>
      <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
      <line x1="7" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
    </svg>
  )},
  { href: "/labels", label: "Etiketten", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 4a1 1 0 011-1h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-5.586 5.586a1 1 0 01-1.414 0L3.293 10.293A1 1 0 013 9.586V4z" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
    </svg>
  )},
  { href: "/staff-planning", label: "Personalplanung", icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <circle cx="14" cy="6" r="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
      <path d="M2 16c0-2.21 2.239-4 5-4s5 1.79 5 4" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
      <path d="M12 12.5c1.1-.5 2.3-.5 3.5 0 1.7.7 2.5 2 2.5 3.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
    </svg>
  )},
];

export default function AppHeader() {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userEmail,    setUserEmail]    = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
  }, [supabase]);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  async function handleLogout() {
    setUserMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "SP";

  return (
    <>
      {/* ── Desktop / iPad Header (md+) ── */}
      {/* ── Desktop Header (md+) ── */}
      <header className="fixed top-0 inset-x-0 z-50 h-12 bg-white border-b border-gray-100 hidden md:flex items-center w-full">
        <div className="flex items-center h-full px-4 gap-5 max-w-[1600px] mx-auto">

          <Link href="/dashboard" className="flex items-center shrink-0">
            <img src="/icons/logo.png" alt="Starphone" style={{ height: 28, width: "auto" }} />
          </Link>
          <div className="h-4 w-px shrink-0 bg-gray-200" />

          <nav className="flex items-center gap-0.5 flex-1 min-w-0">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={["relative h-7 px-2.5 rounded-md text-[12.5px] font-medium transition-colors flex items-center whitespace-nowrap",
                    active ? "text-black bg-gray-100" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"].join(" ")}>
                  {item.label}
                  {active && <span className="absolute rounded-full bg-black" style={{ bottom: 3, left: "50%", transform: "translateX(-50%)", width: 3, height: 3 }} />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <Link href="/repairs/new"
              className="flex h-7 items-center gap-1.5 px-3 rounded-md bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Neuer Auftrag
            </Link>

            <div className="relative">
              <button onClick={() => setUserMenuOpen(v => !v)}
                className="h-7 w-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-[9px] font-semibold hover:bg-gray-700 transition-colors">
                {initials}
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-gray-50">
                      <p className="text-[11px] text-gray-400">Angemeldet als</p>
                      <p className="text-[12px] font-medium text-gray-900 truncate">{userEmail ?? "—"}</p>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] text-red-600 hover:bg-red-50 transition-colors">
                      Abmelden
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Top Bar (< md, nicht auf Login) ── */}
      {pathname !== "/login" && (
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-white border-b border-gray-100 flex md:hidden items-center px-4 justify-between">
        <Link href="/dashboard">
          <img src="/icons/logo.png" alt="Starphone" style={{ height: 24, width: "auto" }} />
        </Link>
        <span className="text-[14px] font-semibold text-gray-900">
          {NAV_ITEMS.find(n => isActive(n.href))?.label ?? "Starphone"}
        </span>
        <div className="flex items-center gap-2">
          <Link href="/repairs/new"
            className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>
          <div className="relative">
            <button onClick={() => setUserMenuOpen(v => !v)}
              className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-semibold">
              {initials}
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-gray-50">
                    <p className="text-[11px] text-gray-400">Angemeldet als</p>
                    <p className="text-[12px] font-medium text-gray-900 truncate">{userEmail ?? "—"}</p>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] text-red-600 hover:bg-red-50 transition-colors">
                    Abmelden
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      )}

      {/* ── Einziger Spacer für fixed Header ── */}
      {pathname !== "/login" && (
        <>
          <div className="h-14 md:h-12" />
        </>
      )}

      {/* ── Mobile Bottom Tab Bar (nicht auf Login-Seite) ── */}
      {pathname !== "/login" && (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {NAV_ITEMS.filter((item) => ["/dashboard", "/customers", "/repairs", "/prices", "/inventory"].includes(item.href)).map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={["flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative",
                  active ? "text-black" : "text-gray-400"].join(" ")}>
                {item.icon(active)}
                <span className={["text-[10px] font-medium leading-none",
                  active ? "text-black" : "text-gray-400"].join(" ")}>
                  {item.label}
                </span>
                {active && <span className="absolute bottom-0 w-8 h-0.5 bg-black rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>
      )}

      {/* ── Spacer für Bottom Tab Bar (nicht auf Login) ── */}
    </>
  );
}