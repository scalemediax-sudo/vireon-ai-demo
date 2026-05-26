interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color: "blue" | "green" | "orange" | "red" | "purple" | "yellow" | "gray";
  icon: React.ReactNode;
}

const colorMap = {
  blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
  green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
  orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400",
  red: "from-red-500/20 to-red-600/5 border-red-500/30 text-red-400",
  purple: "from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400",
  yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 text-yellow-400",
  gray: "from-slate-500/20 to-slate-600/5 border-slate-500/30 text-slate-400",
};

const iconBg = {
  blue: "bg-blue-500/20",
  green: "bg-emerald-500/20",
  orange: "bg-orange-500/20",
  red: "bg-red-500/20",
  purple: "bg-violet-500/20",
  yellow: "bg-yellow-500/20",
  gray: "bg-slate-500/20",
};

export default function MetricCard({ title, value, subtitle, color, icon }: MetricCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-white text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/40 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`${iconBg[color]} p-2.5 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}
