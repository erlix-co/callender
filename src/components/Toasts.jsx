export default function Toasts({ toasts, onDismiss }) {
  if (!toasts?.length) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 flex w-[min(92vw,420px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass rounded-xl border border-[color:var(--border)] px-3 py-2"
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{t.title}</div>
              {t.message ? (
                <div className="mt-0.5 text-xs text-[color:var(--muted)]">
                  {t.message}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="btn rounded-lg px-2 py-1 text-xs text-[color:var(--muted)]"
              onClick={() => onDismiss(t.id)}
            >
              סגור
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

