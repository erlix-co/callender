import {
  monthlyWindow11To10,
  startOfJewishWeekSunday,
  startOfToday,
  toMs,
} from '../utils/dateRanges'
const PROGRESS_GRADIENT = 'linear-gradient(90deg, #ef4444, #3b82f6)'

function formatIls(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function sumSince(expenses, start, includeOtherInTotals) {
  const startMs = start.getTime()
  return expenses.reduce((sum, e) => {
    if (!includeOtherInTotals && e?.paymentMethod === 'other') return sum
    const t = toMs(e.createdAt)
    if (t >= startMs) return sum + (Number(e.amount) || 0)
    return sum
  }, 0)
}

function sumInWindow(expenses, start, end, includeOtherInTotals) {
  const startMs = start.getTime()
  const endMs = end.getTime()
  return expenses.reduce((sum, e) => {
    if (!includeOtherInTotals && e?.paymentMethod === 'other') return sum
    const t = toMs(e.createdAt)
    if (t >= startMs && t <= endMs) return sum + (Number(e.amount) || 0)
    return sum
  }, 0)
}

export default function Dashboard({ expenses, budgets, includeOtherInTotals = false }) {
  const daily = sumSince(expenses, startOfToday(), includeOtherInTotals)
  const weekly = sumSince(expenses, startOfJewishWeekSunday(), includeOtherInTotals)
  const window = monthlyWindow11To10()
  const monthly = sumInWindow(expenses, window.start, window.end, includeOtherInTotals)

  const monthlyBudget = Number(budgets?.monthly) || 0
  const monthlyPct = monthlyBudget > 0 ? monthly / monthlyBudget : 0

  const items = [
    { label: 'היום', value: daily },
    { label: 'השבוע (מיום א׳)', value: weekly },
    { label: 'חודש (11→10)', value: monthly },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((it) => {
        const isMonthly = it.label === 'חודש (11→10)'
        return (
          <div key={it.label} className="glass rounded-2xl p-3">
            <div className="text-xs text-[color:var(--muted)]">{it.label}</div>
            <div className="mt-1 text-lg font-semibold">{formatIls(it.value)}</div>

            {isMonthly && monthlyBudget > 0 ? (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span>תקציב</span>
                  <span>
                    {Math.round(Math.min(999, monthlyPct * 100))}% •{' '}
                    {formatIls(monthlyBudget)}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full border border-[color:var(--border)] bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, monthlyPct * 100))}%`,
                      background: PROGRESS_GRADIENT,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

