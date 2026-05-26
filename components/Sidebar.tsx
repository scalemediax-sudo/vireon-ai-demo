"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MessageCircle, CalendarCheck,
  BarChart2, Zap, Settings,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/whatsapp",     label: "WhatsApp",     icon: MessageCircle },
  { href: "/appointments", label: "Appointments", icon: CalendarCheck },
];

const SECONDARY_NAV = [
  { href: "/analytics",   label: "Analytics",   icon: BarChart2 },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/settings",    label: "Settings",    icon: Settings },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
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
}

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex flex-col min-h-screen shrink-0"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border-light)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--blue)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        {PRIMARY_NAV.map(item => <NavItem key={item.href} {...item} />)}

        <div className="pt-4 pb-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-tertiary)" }}>
            Insights
          </p>
        </div>

        {SECONDARY_NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* AI status pill */}
      <div className="px-3 pb-3">
        <div className="px-3 py-2.5 rounded-xl" style={{ background: "var(--green-light)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
            <p className="text-xs font-semibold" style={{ color: "var(--green)" }}>AI Agent Active</p>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: "#1a9e42" }}>Handling WhatsApp 24/7</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-light)" }}>
        <p className="text-[10px] text-center" style={{ color: "var(--text-tertiary)" }}>
          Groq · WhatsApp · Google Calendar
        </p>
      </div>
    </aside>
  );
}
