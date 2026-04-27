export default function ThemeToggle({ value, onChange }) {
  const isDark = value !== 'light'

  return (
    <button
      type="button"
      className="btn glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm"
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      aria-label="החלפת מצב תצוגה"
    >
      <span
        className="inline-flex h-7 w-12 items-center rounded-full border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.06)] p-1"
        aria-hidden="true"
      >
        <span
          className={[
            'h-5 w-5 rounded-full bg-[color:var(--card2)] shadow',
            'transition-transform duration-200',
            isDark ? 'translate-x-0' : '-translate-x-5',
          ].join(' ')}
        />
      </span>
      <span className="text-[color:var(--muted)]">
        {isDark ? 'כהה' : 'בהיר'}
      </span>
    </button>
  )
}

