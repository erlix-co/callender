import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExpenseList from '../components/ExpenseList'
import { monthlyWindow11To10, toMs } from '../utils/dateRanges'

function formatIls(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function ymd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function cycleFromStart(start) {
  const s = new Date(start.getFullYear(), start.getMonth(), 11, 0, 0, 0, 0)
  const e = new Date(s.getFullYear(), s.getMonth() + 1, 10, 23, 59, 59, 999)
  return { start: s, end: e }
}

function cycleStartFromDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  const startMonth = day >= 11 ? m : m - 1
  return new Date(y, startMonth, 11, 0, 0, 0, 0)
}

function monthTitle(start) {
  return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(
    start,
  )
}

export default function CyclesPage({
  expenses,
  categories,
  includeOtherInTotals = false,
}) {
  const { startYmd } = useParams()
  const navigate = useNavigate()

  const cycles = useMemo(() => {
    const list = []
    const window = monthlyWindow11To10()
    const latestStart = window.start

    const earliestExpense = (expenses || []).reduce((min, e) => {
      const t = toMs(e?.createdAt)
      if (!Number.isFinite(t)) return min
      if (!min || t < min) return t
      return min
    }, null)

    // If no expenses yet, show only the current cycle.
    const firstStart = earliestExpense ? cycleStartFromDate(new Date(earliestExpense)) : latestStart

    for (let cursor = new Date(latestStart); cursor >= firstStart; ) {
      const { start, end } = cycleFromStart(cursor)
      const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      const label = `11 ל${monthTitle(start)} - 10 ל${monthTitle(nextMonth)}`
      list.push({ start, end, label, id: ymd(start) })

      // move one cycle back
      cursor = new Date(start.getFullYear(), start.getMonth() - 1, 11, 0, 0, 0, 0)
    }
    return list
  }, [expenses])

  const active = useMemo(() => {
    if (!startYmd) return null
    const [y, m, d] = startYmd.split('-').map((x) => Number(x))
    if (!y || !m || !d) return null
    const start = new Date(y, m - 1, d, 0, 0, 0, 0)
    return { ...cycleFromStart(start), id: startYmd }
  }, [startYmd])

  const expensesInActive = useMemo(() => {
    if (!active) return []
    const startMs = active.start.getTime()
    const endMs = active.end.getTime()
    return (expenses || []).filter((e) => {
      const t = toMs(e.createdAt)
      return t >= startMs && t <= endMs
    })
  }, [active, expenses])

  const counted = useMemo(() => {
    if (includeOtherInTotals) return expensesInActive
    return expensesInActive.filter((e) => e?.paymentMethod !== 'other')
  }, [expensesInActive, includeOtherInTotals])

  const total = useMemo(
    () => counted.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [counted],
  )

  return (
    <main className="mx-auto mt-6 w-full max-w-6xl space-y-6">
      <section className="glass rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold">מחזורים חודשיים (11→10)</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cycles.map((c) => (
            <button
              key={c.id}
              className="btn glass rounded-2xl px-4 py-4 text-right"
              type="button"
              onClick={() => {
                if (startYmd === c.id) navigate('/cycles')
                else navigate(`/cycles/${c.id}`)
              }}
            >
              <div className="text-sm font-semibold">{c.label}</div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">לחץ לצפייה</div>
            </button>
          ))}
        </div>
      </section>

      {active ? (
        <section className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">נתונים למחזור שנבחר</h3>
              <div className="mt-1 text-sm text-[color:var(--muted)]">
                {cycles.find((c) => c.id === active.id)?.label || active.id}
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs text-[color:var(--muted)]">סה״כ</div>
              <div className="mt-1 text-lg font-semibold">{formatIls(total)}</div>
            </div>
          </div>

          <div className="mt-4">
            <ExpenseList
              expenses={expensesInActive}
              categories={categories}
              readonly
              onUpdateExpense={() => {}}
              onDeleteExpense={() => {}}
            />
          </div>
        </section>
      ) : null}
    </main>
  )
}

