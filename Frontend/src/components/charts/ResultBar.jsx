export default function ResultBar({ label, count, percentage }) {
  const safePercent = Math.min(Number(percentage) || 0, 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="shrink-0 font-semibold text-slate-950">
          {count} votes · {safePercent}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${safePercent}%` }} />
      </div>
    </div>
  )
}
