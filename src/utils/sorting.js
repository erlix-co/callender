import { toMs } from './dateRanges'

export const SORT_OPTIONS = [
  { id: 'date_desc', label: 'תאריך (חדש→ישן)' },
  { id: 'date_asc', label: 'תאריך (ישן→חדש)' },
  { id: 'amount_desc', label: 'סכום (גבוה→נמוך)' },
  { id: 'amount_asc', label: 'סכום (נמוך→גבוה)' },
  { id: 'store_asc', label: 'חנות (א-ת)' },
  { id: 'product_asc', label: 'מוצר (א-ת)' },
]

export function sortExpenses(expenses, sortId) {
  const arr = [...expenses]

  switch (sortId) {
    case 'date_asc':
      // oldest -> newest
      arr.sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt))
      return arr
    case 'amount_desc':
      // high -> low
      arr.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      return arr
    case 'amount_asc':
      // low -> high
      arr.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
      return arr
    case 'store_asc':
      // user expectation: א -> ת
      arr.sort((a, b) =>
        String(a.store || '').localeCompare(String(b.store || ''), 'he'),
      )
      return arr
    case 'product_asc':
      arr.sort((a, b) =>
        String(a.product || '').localeCompare(String(b.product || ''), 'he'),
      )
      return arr
    case 'date_desc':
    default:
      // newest -> oldest
      arr.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      return arr
  }
}

