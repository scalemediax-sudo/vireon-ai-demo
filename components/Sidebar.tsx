"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex flex-col min-h-screen shrink-0" style={{
      background: "var(--surface)",
      borderRight: "1px solid var(--border-light)",
    }}>
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--blue)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Vireon AI</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Clinic Assistant</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: active ? "var(--blue-light)" : "transparent",
                color: active ? "var(--blue)" : "var(--text-secondary)",
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-light)" }}>
        <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>Groq · WhatsApp · Google Calendar</p>
      </div>
    </aside>
  );
}
