"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "px-3 py-2 rounded-xl border transition",
        active
          ? "border-white text-white"
          : "border-white/20 text-gray-300 hover:border-white/40",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  
  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#11131a]/90 backdrop-blur">
      <div className="w-full px-4 md:px-6 xl:px-8 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="font-bold tracking-wide text-white">STAR CMS</div>
          <div className="text-xs text-gray-400">by LuckyRoo</div>
        </div>

        <nav className="flex items-center gap-2">
          <NavItem href="/dashboard" label="Dashboard" />
          <NavItem href="/customers" label="Kunden" />
          <NavItem href="/repairs" label="Reparaturen" />
          <NavItem href="/repairs/new" label="Reparatur starten" />
          <NavItem href="/inventory" label="Geräte" />
          <NavItem href="/prices" label="Preisliste" />
          <NavItem href="/labels" label="Etiketten" />
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}