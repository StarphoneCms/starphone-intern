"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard"   },
  { href: "/repairs",   label: "Reparaturen" },
  { href: "/customers", label: "Kunden"      },
  { href: "/inventory", label: "Inventar"    },
  { href: "/prices",    label: "Preisliste"  },
  { href: "/labels",    label: "Etiketten"   },
];

export default function AppHeader() {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userEmail,    setUserEmail]    = useState<string | null>(null);

  // ── E-Mail aus aktiver Session laden ──
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

  // Initialen aus E-Mail
  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "SP";

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-12 bg-white border-b border-gray-100">
        <div className="flex items-center h-full px-4 gap-5 max-w-[1600px] mx-auto">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center shrink-0">
            <img src="/icons/logo.png" alt="Starphone" style={{ height: 28, width: "auto" }} />
          </Link>

          <div className="h-4 w-px shrink-0" style={{ background: "#e9e9e9" }} />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 min-w-0">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={[
                    "relative h-7 px-2.5 rounded-md text-[12.5px] font-medium transition-colors",
                    "flex items-center whitespace-nowrap",
                    active
                      ? "text-black bg-gray-100"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
                  ].join(" ")}>
                  {item.label}
                  {active && (
                    <span className="absolute rounded-full bg-black"
                      style={{ bottom: 3, left: "50%", transform: "translateX(-50%)", width: 3, height: 3 }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <Link href="/repairs/new"
              className="hidden sm:flex h-7 items-center gap-1.5 px-3 rounded-md bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="5" y1="1" x2="5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="1" y1="5" x2="9" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Neuer Auftrag
            </Link>

            {/* User Avatar + Dropdown */}
            <div className="relative">
              <button onClick={() => setUserMenuOpen((v) => !v)}
                className="h-7 w-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-[9px] font-semibold hover:bg-gray-700 transition-colors">
                {initials}
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-gray-50">
                      <p className="text-[11px] text-gray-400">Angemeldet als</p>
                      <p className="text-[12px] font-medium text-gray-900 truncate">
                        {userEmail ?? "—"}
                      </p>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] text-red-600 hover:bg-red-50 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M5 2H2.5A1.5 1.5 0 001 3.5v5A1.5 1.5 0 002.5 10H5"
                          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="8" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        <polyline points="9.5,4.5 11,6 9.5,7.5" stroke="currentColor"
                          strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Abmelden
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <button className="md:hidden h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)} aria-label="Navigation">
              {mobileOpen ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <line x1="2" y1="2" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="11" y1="2" x2="2" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <line x1="2" y1="3.5" x2="11" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="6.5" x2="11" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="fixed top-12 inset-x-0 z-40 bg-white border-b border-gray-100 shadow-sm md:hidden">
          <nav className="flex flex-col px-3 py-2 gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={[
                    "h-10 px-3 rounded-md text-[13px] font-medium flex items-center transition-colors",
                    active ? "text-black bg-gray-100" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
                  ].join(" ")}>
                  {item.label}
                </Link>
              );
            })}
            <div className="h-px bg-gray-100 my-1" />
            <Link href="/repairs/new" onClick={() => setMobileOpen(false)}
              className="h-10 px-3 rounded-md text-[13px] font-medium flex items-center gap-2 bg-black text-white hover:bg-gray-900 transition-colors mb-1">
              + Neuer Auftrag
            </Link>
            <button onClick={handleLogout}
              className="h-10 px-3 rounded-md text-[13px] font-medium flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors mb-1">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M5 2H2.5A1.5 1.5 0 001 3.5v5A1.5 1.5 0 002.5 10H5"
                  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="8" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <polyline points="9.5,4.5 11,6 9.5,7.5" stroke="currentColor"
                  strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Abmelden
            </button>
          </nav>
        </div>
      )}

      <div className="h-12" />
    </>
  );
}