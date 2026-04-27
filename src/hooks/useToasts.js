import { useCallback, useMemo, useState } from 'react'

function makeId() {
  return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    ({ type = 'info', title, message, ttlMs }) => {
      const effectiveTtlMs =
        ttlMs !== undefined
          ? ttlMs
          : type === 'error'
            ? 20000
            : 2400
      const id = makeId()
      const next = { id, type, title, message }
      setToasts((prev) => [next, ...prev].slice(0, 4))
      if (effectiveTtlMs !== Infinity) {
        window.setTimeout(() => removeToast(id), effectiveTtlMs)
      }
    },
    [removeToast],
  )

  return useMemo(
    () => ({ toasts, pushToast, removeToast }),
    [pushToast, removeToast, toasts],
  )
}

