import { useEffect, useMemo, useState } from 'react'

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json)
    return v ?? fallback
  } catch {
    return fallback
  }
}

export function useLocalStorageState(key, initialValue) {
  const initial = useMemo(() => {
    const fromStorage = localStorage.getItem(key)
    if (fromStorage !== null) return safeParse(fromStorage, initialValue)
    return typeof initialValue === 'function' ? initialValue() : initialValue
  }, [initialValue, key])

  const [value, setValue] = useState(initial)

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

