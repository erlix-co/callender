import { createClient } from '@supabase/supabase-js'

function readStored(key) {
  try {
    return (localStorage.getItem(key) || '').trim()
  } catch {
    return ''
  }
}

export const SUPABASE_STORAGE_KEYS = {
  url: 'expense-control.supabase.url',
  anonKey: 'expense-control.supabase.anonKey',
}

const url =
  ((import.meta.env.VITE_SUPABASE_URL || '') + '').trim() || readStored(SUPABASE_STORAGE_KEYS.url)
const anonKey =
  ((import.meta.env.VITE_SUPABASE_ANON_KEY || '') + '').trim() ||
  readStored(SUPABASE_STORAGE_KEYS.anonKey)

export const supabaseEnvStatus = {
  hasUrl: !!url,
  hasAnonKey: !!anonKey,
  mode: import.meta.env.MODE,
}

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false },
      })
    : null

