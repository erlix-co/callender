import { useMemo, useState } from 'react'
import CategoryPicker from './CategoryPicker'

function formatIls(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function formatDate(iso) {
  try {
    // if YYYY-MM-DD, display as date only
    if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short' }).format(
        new Date(iso + 'T00:00:00'),
      )
    }

    return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

function categoryById(categories) {
  const m = new Map()
  for (const c of categories) m.set(c.id, c)
  return m
}

function paymentLabel(method) {
  if (method === 'credit') return '💳 אשראי'
  if (method === 'other') return '🧾 אחר'
  return '💵 מזומן'
}

function EditableRow({ expense, categories, onUpdate, onDelete, readonly }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => ({
    updaterName: expense.updaterName || '',
    amount: String(expense.amount ?? ''),
    categoryId: expense.categoryId || '',
    product: expense.product || '',
    store: expense.store || '',
    paymentMethod: expense.paymentMethod || 'cash',
    createdAt:
      typeof expense.createdAt === 'string' && expense.createdAt.length >= 10
        ? expense.createdAt.slice(0, 10)
        : '',
  }))

  function reset() {
    setDraft({
      updaterName: expense.updaterName || '',
      amount: String(expense.amount ?? ''),
      categoryId: expense.categoryId || '',
      product: expense.product || '',
      store: expense.store || '',
      paymentMethod: expense.paymentMethod || 'cash',
      createdAt:
        typeof expense.createdAt === 'string' && expense.createdAt.length >= 10
          ? expense.createdAt.slice(0, 10)
          : '',
    })
    setEditing(false)
  }

  const canSave =
    draft.updaterName.trim().length >= 2 &&
    draft.product.trim().length >= 1 &&
    draft.store.trim().length >= 1 &&
    Number(draft.amount) > 0 &&
    !!draft.categoryId &&
    (draft.paymentMethod === 'cash' ||
      draft.paymentMethod === 'credit' ||
      draft.paymentMethod === 'other') &&
    /^\d{4}-\d{2}-\d{2}$/.test(draft.createdAt)

  return (
    <div
      className="glass rounded-2xl p-3"
      style={
        expense.paymentMethod === 'other'
          ? { background: 'rgba(148, 163, 184, 0.12)' }
          : undefined
      }
      onDoubleClick={() => {
        if (!readonly) setEditing(true)
      }}
    >
      {!editing ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
          <div className="sm:col-span-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold">{expense.product}</div>
              {expense.categoryName ? (
                <span
                  className="inline-flex items-center rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[11px] text-[color:var(--muted)]"
                  style={{
                    background: `${expense.categoryColor || '#60a5fa'}22`,
                    borderColor: `${expense.categoryColor || '#60a5fa'}55`,
                  }}
                >
                  {expense.categoryName}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-[color:var(--muted)]">
              {expense.store} • {expense.updaterName}
            </div>
          </div>
          <div className="sm:col-span-3 text-xs text-[color:var(--muted)]">
            {formatDate(expense.createdAt)} •{' '}
            {paymentLabel(expense.paymentMethod)}
          </div>
          <div className="sm:col-span-3 text-sm font-semibold">
            {formatIls(Number(expense.amount) || 0)}
          </div>
          {!readonly ? (
            <div className="flex gap-2 sm:col-span-2 sm:justify-end">
              <button
                type="button"
                className="btn rounded-xl px-3 py-2 text-xs"
                onClick={() => setEditing(true)}
              >
                עריכה
              </button>
              <button
                type="button"
                className="btn btnDanger rounded-xl px-3 py-2 text-xs"
                onClick={() => onDelete(expense)}
              >
                מחיקה
              </button>
            </div>
          ) : (
            <div className="sm:col-span-2" />
          )}
        </div>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSave) return
            onUpdate(expense.id, {
              updaterName: draft.updaterName.trim(),
              amount: draft.amount,
              categoryId: draft.categoryId,
              product: draft.product.trim(),
              store: draft.store.trim(),
              paymentMethod: draft.paymentMethod,
              createdAt: draft.createdAt,
            })
            setEditing(false)
          }}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              className="input w-full rounded-xl px-3 py-2 text-sm outline-none"
              value={draft.product}
              onChange={(e) => setDraft((d) => ({ ...d, product: e.target.value }))}
              placeholder="מוצר/שירות"
              required
            />
            <input
              className="input w-full rounded-xl px-3 py-2 text-sm outline-none"
              value={draft.store}
              onChange={(e) => setDraft((d) => ({ ...d, store: e.target.value }))}
              placeholder="חנות/ספק"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            <input
              className="input w-full rounded-xl px-3 py-2 text-sm outline-none"
              type="date"
              value={draft.createdAt}
              onChange={(e) => setDraft((d) => ({ ...d, createdAt: e.target.value }))}
              required
            />
            <input
              className="input w-full rounded-xl px-3 py-2 text-sm outline-none"
              value={draft.updaterName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, updaterName: e.target.value }))
              }
              placeholder="שם מעדכן"
              required
            />
            <input
              className="input w-full rounded-xl px-3 py-2 text-sm outline-none"
              value={draft.amount}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  amount: e.target.value.replace(/[^\d]/g, ''),
                }))
              }
              placeholder="סכום"
              inputMode="numeric"
              pattern="[0-9]*"
              required
            />
            <div className="sm:col-span-1">
              <CategoryPicker
                categories={categories}
                value={draft.categoryId}
                onChange={(id) => setDraft((d) => ({ ...d, categoryId: id }))}
                required
              />
            </div>
          </div>
          <fieldset className="text-xs text-[color:var(--muted)]">
            <legend>איך שולם</legend>
            <div className="mt-2 flex flex-nowrap items-center gap-2">
              <label className="btn inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
                <input
                  type="radio"
                  name={`paymentMethod_${expense.id}`}
                  value="cash"
                  checked={draft.paymentMethod === 'cash'}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, paymentMethod: e.target.value }))
                  }
                  required
                />
                <span aria-hidden="true">💵</span>
                מזומן
              </label>
              <label className="btn inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
                <input
                  type="radio"
                  name={`paymentMethod_${expense.id}`}
                  value="credit"
                  checked={draft.paymentMethod === 'credit'}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, paymentMethod: e.target.value }))
                  }
                  required
                />
                <span aria-hidden="true">💳</span>
                אשראי
              </label>
              <label className="btn inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
                <input
                  type="radio"
                  name={`paymentMethod_${expense.id}`}
                  value="other"
                  checked={draft.paymentMethod === 'other'}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, paymentMethod: e.target.value }))
                  }
                  required
                />
                <span aria-hidden="true">🧾</span>
                אחר
              </label>
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn btnPrimary rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
              disabled={!canSave}
            >
              שמירה
            </button>
            <button
              type="button"
              className="btn rounded-xl px-3 py-2 text-xs"
              onClick={reset}
            >
              ביטול
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function ExpenseList({
  expenses,
  categories,
  onUpdateExpense,
  onDeleteExpense,
  readonly = false,
}) {
  const catMap = useMemo(() => categoryById(categories), [categories])

  if (!expenses.length) {
    return (
      <div className="glass rounded-2xl p-4 text-sm text-[color:var(--muted)]">
        אין הוצאות להצגה.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {expenses.map((e) => {
        const cat = catMap.get(e.categoryId)
        return (
          <div key={e.id}>
            <EditableRow
              expense={{
                ...e,
                categoryName: cat?.name,
                categoryColor: cat?.color,
              }}
              categories={categories}
              onUpdate={onUpdateExpense}
              onDelete={onDeleteExpense}
              readonly={readonly}
            />
          </div>
        )
      })}
    </div>
  )
}

