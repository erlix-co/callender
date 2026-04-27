import { useMemo, useState } from 'react'
import Dashboard from '../components/Dashboard'
import ExpenseFilters from '../components/ExpenseFilters'
import ExpenseList from '../components/ExpenseList'
import {
  monthlyWindow11To10,
  toMs,
} from '../utils/dateRanges'
import { sortExpenses } from '../utils/sorting'
const PROGRESS_GRADIENT = 'linear-gradient(90deg, #ef4444, #3b82f6)'

function formatIls(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function sumInWindow(expenses, start, end) {
  const startMs = start.getTime()
  const endMs = end.getTime()
  return expenses.reduce((sum, e) => {
    const t = toMs(e.createdAt)
    if (t >= startMs && t <= endMs) return sum + (Number(e.amount) || 0)
    return sum
  }, 0)
}

function groupByCategory(expenses, categories, start, end) {
  const map = new Map(categories.map((c) => [c.id, { ...c, total: 0 }]))
  for (const e of expenses) {
    const t = toMs(e.createdAt)
    if (t < start.getTime() || t > end.getTime()) continue
    const row = map.get(e.categoryId)
    if (!row) continue
    row.total += Number(e.amount) || 0
  }
  return [...map.values()].filter((x) => x.total > 0).sort((a, b) => b.total - a.total)
}

function paymentSplit(expenses, start, end) {
  const startMs = start.getTime()
  const endMs = end.getTime()
  let cash = 0
  let credit = 0
  let other = 0
  for (const e of expenses) {
    const t = toMs(e.createdAt)
    if (t < startMs || t > endMs) continue
    const amt = Number(e.amount) || 0
    if (e.paymentMethod === 'credit') credit += amt
    else if (e.paymentMethod === 'other') other += amt
    else cash += amt
  }
  return { cash, credit, other }
}

function startOfDayFromYmd(ymd) {
  // ymd: YYYY-MM-DD
  if (!ymd) return null
  const [y, m, d] = ymd.split('-').map((x) => Number(x))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export default function StatsPage({
  expenses,
  categories,
  budgets,
  onBudgetsChange,
  includeOtherInTotals = false,
  onIncludeOtherInTotalsChange,
}) {
  const monthWindow = monthlyWindow11To10()

  const [limitToToday, setLimitToToday] = useState(false)

  const activeMonthWindow = useMemo(() => {
    if (!limitToToday) return monthWindow
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return { start: monthWindow.start, end }
  }, [limitToToday, monthWindow.end, monthWindow.start])

  const countedExpenses = useMemo(() => {
    if (includeOtherInTotals) return expenses || []
    return (expenses || []).filter((e) => e?.paymentMethod !== 'other')
  }, [expenses, includeOtherInTotals])

  const monthTotal = sumInWindow(countedExpenses, activeMonthWindow.start, activeMonthWindow.end)

  const monthByCat = groupByCategory(countedExpenses, categories, activeMonthWindow.start, activeMonthWindow.end)
  const monthPay = paymentSplit(expenses, activeMonthWindow.start, activeMonthWindow.end)
  const monthPayTotal =
    (monthPay.cash || 0) +
    (monthPay.credit || 0) +
    (includeOtherInTotals ? monthPay.other || 0 : 0)

  // Budgeting (11->10 window)
  const monthlyBudget = Number(budgets?.monthly) || 0
  const monthlyPct = monthlyBudget > 0 ? monthTotal / monthlyBudget : 0

  const [searchDate, setSearchDate] = useState('')
  const [showDayDetails, setShowDayDetails] = useState(false)
  const [dayQuery, setDayQuery] = useState('')
  const [dayCategoryFilterId, setDayCategoryFilterId] = useState('all')
  const [daySortId, setDaySortId] = useState('date_desc')

  const dayWindow = useMemo(() => {
    const start = startOfDayFromYmd(searchDate)
    if (!start) return null
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [searchDate])

  const expensesForDay = useMemo(() => {
    if (!dayWindow) return []
    const startMs = dayWindow.start.getTime()
    const endMs = dayWindow.end.getTime()
    return (expenses || []).filter((e) => {
      const t = toMs(e.createdAt)
      return t >= startMs && t <= endMs
    })
  }, [dayWindow, expenses])

  const dayTotal = useMemo(
    () => expensesForDay.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [expensesForDay],
  )

  const filteredDayExpenses = useMemo(() => {
    const q = dayQuery.trim().toLowerCase()
    const base = expensesForDay.filter((e) => {
      const matchesCategory =
        dayCategoryFilterId === 'all' || e.categoryId === dayCategoryFilterId
      if (!matchesCategory) return false
      if (!q) return true
      const haystack = `${e.store} ${e.product} ${e.updaterName}`.toLowerCase()
      return haystack.includes(q)
    })
    return sortExpenses(base, daySortId)
  }, [dayCategoryFilterId, dayQuery, daySortId, expensesForDay])

  const filteredDayTotal = useMemo(
    () =>
      filteredDayExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [filteredDayExpenses],
  )

  return (
    <main className="mx-auto mt-6 w-full max-w-6xl space-y-6">
      <section className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">סטטיסטיקות</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn rounded-xl px-3 py-2 text-sm ${
                includeOtherInTotals ? 'btnPrimary' : ''
              }`}
              onClick={() => onIncludeOtherInTotalsChange?.((v) => !v)}
              title="ברירת מחדל: לא כולל הוצאות 'אחר'"
            >
              {includeOtherInTotals ? "כולל 'אחר' בסכומים" : "לא כולל 'אחר' בסכומים"}
            </button>
            <button
              type="button"
              className={`btn rounded-xl px-3 py-2 text-sm ${
                limitToToday ? 'btnPrimary' : ''
              }`}
              onClick={() => setLimitToToday((v) => !v)}
              title="מציג רק מה-11 של המחזור הנוכחי ועד היום"
            >
              {limitToToday ? 'מחזור (11→היום)' : 'מחזור (11→10)'}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <Dashboard
            expenses={expenses}
            budgets={budgets}
            includeOtherInTotals={includeOtherInTotals}
          />
        </div>
      </section>

      <section className="glass rounded-2xl p-4 sm:p-6">
        <h3 className="text-base font-semibold">תקציב (חודש 11→10)</h3>
        <div className="mt-3">
          <div className="glass rounded-2xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-[color:var(--muted)]">תקציב חודשי</div>
                <div className="mt-1 text-sm font-semibold">
                  {monthlyBudget > 0 ? formatIls(monthlyBudget) : 'לא הוגדר'}
                </div>
              </div>
              <div className="text-left">
                <label className="text-xs text-[color:var(--muted)]">
                  הגדרה
                  <input
                    className="input mt-1 w-40 rounded-xl px-3 py-2 text-sm outline-none"
                    value={budgets?.monthly ?? ''}
                    onChange={(e) =>
                      onBudgetsChange?.((prev) => ({
                        ...(prev || {}),
                        monthly: e.target.value.replace(/[^\d]/g, ''),
                      }))
                    }
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="לדוגמה: 5000"
                  />
                </label>
              </div>
            </div>

            {monthlyBudget > 0 ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span>נוצל</span>
                  <span>
                    {Math.round(Math.min(999, monthlyPct * 100))}% • {formatIls(monthTotal)}
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
        </div>
      </section>

      <section className="glass rounded-2xl p-4 sm:p-6">
        <h3 className="text-base font-semibold">חיפוש הוצאות לפי תאריך</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <label className="text-xs text-[color:var(--muted)]">
            תאריך
            <input
              className="input mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
              type="date"
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value)
                setShowDayDetails(false)
              }}
            />
          </label>
          <div className="glass rounded-2xl p-3 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-[color:var(--muted)]">סה״כ ליום</div>
                <div className="mt-1 text-lg font-semibold">{formatIls(dayTotal)}</div>
                <div className="mt-0.5 text-xs text-[color:var(--muted)]">
                  {searchDate
                    ? `${expensesForDay.length} הוצאות`
                    : 'בחר תאריך כדי לראות הוצאות'}
                </div>
              </div>
              <button
                type="button"
                className="btn rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                disabled={!searchDate || !expensesForDay.length}
                onClick={() => setShowDayDetails((v) => !v)}
              >
                {showDayDetails ? 'הסתר פירוט' : 'פירוט'}
              </button>
            </div>
          </div>
        </div>

        {searchDate && showDayDetails ? (
          <div className="mt-4 space-y-4">
            <ExpenseFilters
              categories={categories}
              query={dayQuery}
              onQueryChange={setDayQuery}
              categoryFilterId={dayCategoryFilterId}
              onCategoryFilterIdChange={setDayCategoryFilterId}
              sortId={daySortId}
              onSortIdChange={setDaySortId}
              filteredTotal={filteredDayTotal}
            />
            <ExpenseList
              expenses={filteredDayExpenses}
              categories={categories}
              readonly
              onUpdateExpense={() => {}}
              onDeleteExpense={() => {}}
            />
          </div>
        ) : searchDate && !expensesForDay.length ? (
          <div className="mt-4 text-sm text-[color:var(--muted)]">אין הוצאות ביום הזה.</div>
        ) : null}
      </section>

      <section className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">חלוקה לפי קטגוריות (חודש 11→10)</h3>
            <div className="mt-1 text-sm text-[color:var(--muted)]">
              מוצג רק קטגוריות עם סכום &gt; 0
            </div>
          </div>
        </div>

        {monthByCat.length ? (
          <div className="mt-4 space-y-2">
            {monthByCat.slice(0, 12).map((c) => {
              const pct = monthTotal ? Math.round((c.total / monthTotal) * 100) : 0
              return (
                <div key={c.id} className="glass rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="inline-flex h-2.5 w-2.5 rounded-full"
                        style={{ background: c.color || '#60a5fa' }}
                        aria-hidden="true"
                      />
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-[color:var(--muted)]">{pct}%</div>
                    </div>
                    <div className="text-sm font-semibold">{formatIls(c.total)}</div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-[color:var(--border)] bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, pct))}%`,
                        background: PROGRESS_GRADIENT,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 text-sm text-[color:var(--muted)]">אין נתונים לתקופה.</div>
        )}
      </section>

      <section className="glass rounded-2xl p-4 sm:p-6">
        <h3 className="text-base font-semibold">חלוקה לפי אמצעי תשלום (חודש 11→10)</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl p-3">
            <div className="text-xs text-[color:var(--muted)]">💵 מזומן</div>
            <div className="mt-1 text-lg font-semibold">{formatIls(monthPay.cash)}</div>
          </div>
          <div className="glass rounded-2xl p-3">
            <div className="text-xs text-[color:var(--muted)]">💳 אשראי</div>
            <div className="mt-1 text-lg font-semibold">{formatIls(monthPay.credit)}</div>
          </div>
          <div className="glass rounded-2xl p-3" style={{ background: 'rgba(148, 163, 184, 0.12)' }}>
            <div className="text-xs text-[color:var(--muted)]">🧾 אחר</div>
            <div className="mt-1 text-lg font-semibold">{formatIls(monthPay.other)}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-[color:var(--muted)]">
          סה״כ: <span className="font-semibold text-[color:var(--text)]">{formatIls(monthPayTotal)}</span>
        </div>
      </section>
    </main>
  )
}

