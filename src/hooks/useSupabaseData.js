import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CATEGORIES } from '../data/defaultCategories'
import { STORAGE_KEYS } from '../utils/storageKeys'
import { supabase, supabaseEnvStatus } from '../utils/supabaseClient'

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json)
    return v ?? fallback
  } catch {
    return fallback
  }
}

function fromDbCategory(row) {
  return { id: row.id, name: row.name, color: row.color }
}

function fromDbExpense(row) {
  return {
    id: row.id,
    createdAt: row.created_at, // date string YYYY-MM-DD
    amount: Number(row.amount),
    categoryId: row.category_id,
    product: row.product,
    store: row.store,
    paymentMethod: row.payment_method || 'cash',
    updaterName: row.updater_name,
  }
}

function toDbExpense(payload) {
  return {
    id: payload.id,
    created_at: payload.createdAt,
    amount: Number(payload.amount),
    category_id: payload.categoryId,
    product: payload.product,
    store: payload.store,
    payment_method: payload.paymentMethod || 'cash',
    updater_name: payload.updaterName,
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function useSupabaseData() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)

  const [categories, setCategories] = useState(() => {
    const local = safeParse(localStorage.getItem(STORAGE_KEYS.categories), null)
    return Array.isArray(local) && local.length ? local : DEFAULT_CATEGORIES
  })
  const [expenses, setExpenses] = useState(() => {
    const local = safeParse(localStorage.getItem(STORAGE_KEYS.expenses), [])
    return Array.isArray(local) ? local : []
  })
  const [budgets, setBudgets] = useState(() => {
    const local = safeParse(localStorage.getItem(STORAGE_KEYS.budgets), { monthly: '' })
    return local && typeof local === 'object' ? local : { monthly: '' }
  })
  const [storeMemory, setStoreMemory] = useState(() => {
    const local = safeParse(localStorage.getItem(STORAGE_KEYS.storeMemory), {})
    return local && typeof local === 'object' ? local : {}
  })
  const [includeOtherInTotals, setIncludeOtherInTotals] = useState(() => {
    const local = safeParse(localStorage.getItem(STORAGE_KEYS.includeOtherInTotals), false)
    return !!local
  })
  const [outbox, setOutbox] = useState(() => {
    const local = safeParse(localStorage.getItem(STORAGE_KEYS.outbox), [])
    return Array.isArray(local) ? local : []
  })

  const initialImportDoneRef = useRef(false)
  const flushingRef = useRef(false)

  const canUseDb = !!supabase

  useEffect(() => persist(STORAGE_KEYS.categories, categories), [categories])
  useEffect(() => persist(STORAGE_KEYS.expenses, expenses), [expenses])
  useEffect(() => persist(STORAGE_KEYS.budgets, budgets), [budgets])
  useEffect(() => persist(STORAGE_KEYS.storeMemory, storeMemory), [storeMemory])
  useEffect(
    () => persist(STORAGE_KEYS.includeOtherInTotals, includeOtherInTotals),
    [includeOtherInTotals],
  )
  useEffect(() => persist(STORAGE_KEYS.outbox, outbox), [outbox])

  const enqueue = useCallback((item) => {
    setOutbox((prev) => [...(prev || []), item])
  }, [])

  const flushOutbox = useCallback(async () => {
    if (!canUseDb) return
    if (flushingRef.current) return
    if (!outbox.length) return
    flushingRef.current = true
    try {
      for (let i = 0; i < outbox.length; i++) {
        const it = outbox[i]
        if (!it?.op) continue
        if (it.op === 'addCategory') {
          const row = { id: it.data.id, name: it.data.name, color: it.data.color }
          const res = await supabase.from('categories').upsert([row], { onConflict: 'id' })
          if (res.error) throw res.error
        } else if (it.op === 'addExpense') {
          const res = await supabase.from('expenses').insert(toDbExpense(it.data))
          if (res.error) throw res.error
        } else if (it.op === 'updateExpense') {
          const patch = {}
          const u = it.updates || {}
          if (u.createdAt !== undefined) patch.created_at = u.createdAt
          if (u.amount !== undefined) patch.amount = Number(u.amount)
          if (u.categoryId !== undefined) patch.category_id = u.categoryId
          if (u.product !== undefined) patch.product = u.product
          if (u.store !== undefined) patch.store = u.store
          if (u.paymentMethod !== undefined) patch.payment_method = u.paymentMethod
          if (u.updaterName !== undefined) patch.updater_name = u.updaterName
          const res = await supabase.from('expenses').update(patch).eq('id', it.id)
          if (res.error) throw res.error
        } else if (it.op === 'deleteExpense') {
          const res = await supabase.from('expenses').delete().eq('id', it.id)
          if (res.error) throw res.error
        } else if (it.op === 'setBudgets') {
          const res = await supabase
            .from('budgets')
            .upsert({ id: 'main', monthly: it.data?.monthly ?? '' }, { onConflict: 'id' })
          if (res.error) throw res.error
        } else if (it.op === 'setStoreMemory') {
          const res = await supabase
            .from('store_memory')
            .upsert({ id: 'main', data: it.data || {} }, { onConflict: 'id' })
          if (res.error) throw res.error
        } else if (it.op === 'setIncludeOtherInTotals') {
          const res = await supabase
            .from('app_settings')
            .upsert(
              { id: 'main', include_other_in_totals: !!it.value },
              { onConflict: 'id' },
            )
          if (res.error) throw res.error
        }
      }
      setOutbox([])
    } catch (e) {
      setConnected(false)
      setError(e?.message || 'שגיאה בסנכרון אופליין ל-Supabase')
    } finally {
      flushingRef.current = false
    }
  }, [canUseDb, outbox])

  const refresh = useCallback(async () => {
    if (!canUseDb) {
      setReady(true)
      setConnected(false)
      setError(
        `חסרים משתני סביבה של Supabase. ודא שיש בקובץ .env את VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY והפעל מחדש.\n` +
          `אבחון: hasUrl=${supabaseEnvStatus.hasUrl ? 'yes' : 'no'}, hasAnonKey=${supabaseEnvStatus.hasAnonKey ? 'yes' : 'no'}, mode=${supabaseEnvStatus.mode}`,
      )
      return
    }

    setError('')

    try {
      const [catsRes, expRes, budgetsRes, storeMemRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('id', 'main').maybeSingle(),
        supabase.from('store_memory').select('*').eq('id', 'main').maybeSingle(),
        supabase.from('app_settings').select('*').eq('id', 'main').maybeSingle(),
      ])

      if (catsRes.error) throw catsRes.error
      if (expRes.error) throw expRes.error
      if (budgetsRes.error) throw budgetsRes.error
      if (storeMemRes.error) throw storeMemRes.error
      if (settingsRes.error) throw settingsRes.error

      const nextCats = (catsRes.data || []).map(fromDbCategory)
      const nextExpenses = (expRes.data || []).map(fromDbExpense)

      setCategories(nextCats.length ? nextCats : DEFAULT_CATEGORIES)
      setExpenses(nextExpenses)
      setBudgets(budgetsRes.data ? { monthly: budgetsRes.data.monthly ?? '' } : { monthly: '' })
      setStoreMemory(storeMemRes.data?.data || {})
      setIncludeOtherInTotals(!!settingsRes.data?.include_other_in_totals)

      // Seed default categories if empty
      if (!nextCats.length) {
        await supabase.from('categories').upsert(
          (DEFAULT_CATEGORIES || []).map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          })),
          { onConflict: 'id' },
        )
      }

      // One-time import from existing localStorage if DB has no expenses yet.
      if (!initialImportDoneRef.current && !nextExpenses.length) {
        initialImportDoneRef.current = true
        const local = safeParse(localStorage.getItem(STORAGE_KEYS.expenses), [])
        if (Array.isArray(local) && local.length) {
          const rows = local
            .filter((e) => e?.id && e?.createdAt && e?.categoryId)
            .map((e) =>
              toDbExpense({
                id: e.id,
                createdAt: typeof e.createdAt === 'string' ? e.createdAt.slice(0, 10) : e.createdAt,
                amount: e.amount,
                categoryId: e.categoryId,
                product: e.product || '',
                store: e.store || '',
                paymentMethod: e.paymentMethod || 'cash',
                updaterName: e.updaterName || '',
              }),
            )
          if (rows.length) {
            await supabase.from('expenses').upsert(rows, { onConflict: 'id' })
            const expAgain = await supabase
              .from('expenses')
              .select('*')
              .order('created_at', { ascending: false })
            if (!expAgain.error) setExpenses((expAgain.data || []).map(fromDbExpense))
          }
        }
      }

      setReady(true)
      setConnected(true)
      // after a successful refresh, try to push offline changes (if any)
      await flushOutbox()
    } catch (e) {
      setReady(true)
      setConnected(false)
      setError(e?.message || 'שגיאה בטעינת נתונים מ-Supabase')
    }
  }, [canUseDb, flushOutbox])

  useEffect(() => {
    // Avoid sync setState chain in effect body (eslint-plugin-react-hooks v7 rule).
    const t = window.setTimeout(() => {
      refresh()
    }, 0)
    return () => window.clearTimeout(t)
  }, [refresh])

  const api = useMemo(() => {
    return {
      ready,
      error,
      connected,
      outboxCount: outbox.length,
      categories,
      expenses,
      budgets,
      storeMemory,
      includeOtherInTotals,

      async addCategory(cat) {
        const row = { id: cat.id, name: cat.name, color: cat.color }
        setCategories((prev) => [row, ...prev])
        if (!canUseDb || !connected) {
          enqueue({ op: 'addCategory', data: row })
          return row
        }
        const res = await supabase.from('categories').upsert([row], { onConflict: 'id' })
        if (res.error) {
          enqueue({ op: 'addCategory', data: row })
          setConnected(false)
          throw res.error
        }
        return row
      },

      async addExpense(expense) {
        const optimistic = expense
        setExpenses((prev) => [optimistic, ...prev])
        if (!canUseDb || !connected) {
          enqueue({ op: 'addExpense', data: optimistic })
          return optimistic
        }
        const row = toDbExpense(optimistic)
        const res = await supabase.from('expenses').insert(row)
        if (res.error) {
          enqueue({ op: 'addExpense', data: optimistic })
          setConnected(false)
          throw res.error
        }
        return optimistic
      },

      async updateExpense(id, updates) {
        const prevSnapshot = expenses
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...updates,
                  amount:
                    updates.amount === undefined ? e.amount : Number(updates.amount),
                }
              : e,
          ),
        )
        if (!canUseDb || !connected) {
          enqueue({ op: 'updateExpense', id, updates })
          return
        }
        const patch = {}
        if (updates.createdAt !== undefined) patch.created_at = updates.createdAt
        if (updates.amount !== undefined) patch.amount = Number(updates.amount)
        if (updates.categoryId !== undefined) patch.category_id = updates.categoryId
        if (updates.product !== undefined) patch.product = updates.product
        if (updates.store !== undefined) patch.store = updates.store
        if (updates.paymentMethod !== undefined) patch.payment_method = updates.paymentMethod
        if (updates.updaterName !== undefined) patch.updater_name = updates.updaterName
        const res = await supabase.from('expenses').update(patch).eq('id', id)
        if (res.error) {
          setExpenses(prevSnapshot)
          enqueue({ op: 'updateExpense', id, updates })
          setConnected(false)
          throw res.error
        }
      },

      async deleteExpense(id) {
        const prevSnapshot = expenses
        setExpenses((prev) => prev.filter((e) => e.id !== id))
        if (!canUseDb || !connected) {
          enqueue({ op: 'deleteExpense', id })
          return
        }
        const res = await supabase.from('expenses').delete().eq('id', id)
        if (res.error) {
          setExpenses(prevSnapshot)
          enqueue({ op: 'deleteExpense', id })
          setConnected(false)
          throw res.error
        }
      },

      async setBudgets(next) {
        setBudgets(typeof next === 'function' ? next(budgets) : next)
        const value = typeof next === 'function' ? next(budgets) : next
        if (!canUseDb || !connected) {
          enqueue({ op: 'setBudgets', data: value })
          return
        }
        const res = await supabase
          .from('budgets')
          .upsert({ id: 'main', monthly: value?.monthly ?? '' }, { onConflict: 'id' })
        if (res.error) {
          enqueue({ op: 'setBudgets', data: value })
          setConnected(false)
          throw res.error
        }
      },

      async setStoreMemory(next) {
        const value = typeof next === 'function' ? next(storeMemory) : next
        setStoreMemory(value)
        if (!canUseDb || !connected) {
          enqueue({ op: 'setStoreMemory', data: value })
          return
        }
        const res = await supabase
          .from('store_memory')
          .upsert({ id: 'main', data: value || {} }, { onConflict: 'id' })
        if (res.error) {
          enqueue({ op: 'setStoreMemory', data: value })
          setConnected(false)
          throw res.error
        }
      },

      async setIncludeOtherInTotals(next) {
        const value = typeof next === 'function' ? next(includeOtherInTotals) : next
        setIncludeOtherInTotals(!!value)
        if (!canUseDb || !connected) {
          enqueue({ op: 'setIncludeOtherInTotals', value: !!value })
          return
        }
        const res = await supabase
          .from('app_settings')
          .upsert(
            { id: 'main', include_other_in_totals: !!value },
            { onConflict: 'id' },
          )
        if (res.error) {
          enqueue({ op: 'setIncludeOtherInTotals', value: !!value })
          setConnected(false)
          throw res.error
        }
      },

      refresh,
      flushOutbox,
    }
  }, [
    budgets,
    canUseDb,
    categories,
    connected,
    enqueue,
    error,
    expenses,
    includeOtherInTotals,
    outbox,
    ready,
    refresh,
    storeMemory,
    flushOutbox,
  ])

  return api
}

