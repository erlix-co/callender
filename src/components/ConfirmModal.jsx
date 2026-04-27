export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'אישור',
  danger = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.()
        if (e.key === 'Enter') onConfirm?.()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="glass w-full max-w-md rounded-2xl p-4 sm:p-5">
        <div className="text-lg font-semibold">{title}</div>
        {description ? (
          <div className="mt-2 text-sm text-[color:var(--muted)]">
            {description}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn rounded-xl px-3 py-2 text-sm"
            onClick={onClose}
          >
            ביטול
          </button>
          <button
            type="button"
            className={[
              danger ? 'btnDanger' : 'btnPrimary',
              'btn rounded-xl px-3 py-2 text-sm font-medium',
            ].join(' ')}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

