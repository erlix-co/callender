import CategoryPicker from './CategoryPicker'
import { SORT_OPTIONS } from '../utils/sorting'

export default function ExpenseFilters({
  categories,
  query,
  onQueryChange,
  categoryFilterId,
  onCategoryFilterIdChange,
  sortId,
  onSortIdChange,
  filteredTotal,
}) {
  const formatted = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(filteredTotal || 0)

  return (
    <div className="glass rounded-2xl p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <label className="text-xs text-[color:var(--muted)] sm:col-span-2">
          חיפוש (חנות / מוצר / מעדכן)
          <input
            className="input mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="הקלד כדי לסנן..."
          />
        </label>

        <label className="text-xs text-[color:var(--muted)]">
          קטגוריה
          <CategoryPicker
            categories={categories}
            value={categoryFilterId}
            onChange={onCategoryFilterIdChange}
            allOption
            allLabel="הכל"
          />
        </label>

        <label className="text-xs text-[color:var(--muted)]">
          מיון
          <CategoryPicker
            categories={SORT_OPTIONS.map((o) => ({
              id: o.id,
              name: o.label,
              color: '#60a5fa',
            }))}
            value={sortId}
            onChange={onSortIdChange}
            required
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-[color:var(--muted)]">סכום מסונן</div>
        <div className="font-semibold">{formatted}</div>
      </div>
    </div>
  )
}

