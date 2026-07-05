interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  valueClassName?: string;
}

export function StatCard({ label, value, hint, valueClassName = "" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-[18px] shadow-card">
      <div className="mb-2.5 text-[13px] text-text-2">{label}</div>
      <div className={`text-[28px] font-bold ${valueClassName}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-text-3">{hint}</div>}
    </div>
  );
}
