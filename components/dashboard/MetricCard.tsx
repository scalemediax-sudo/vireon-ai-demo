interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  accent: string;
  accentLight: string;
  icon: React.ReactNode;
  trend?: number;
}

export default function MetricCard({ title, value, subtitle, accent, accentLight, icon, trend }: MetricCardProps) {
  return (
    <div
      className="rounded-2xl p-5 transition-shadow duration-200 hover:shadow-md"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accentLight }}
        >
          <div style={{ color: accent }}>{icon}</div>
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: trend >= 0 ? "var(--green-light)" : "var(--red-light)",
              color: trend >= 0 ? "var(--green)" : "var(--red)",
            }}
          >
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
        {value}
      </p>
      <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{subtitle}</p>}
    </div>
  );
}
