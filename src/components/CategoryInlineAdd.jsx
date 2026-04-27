import { useMemo, useState } from 'react'

const ICONS = [
  { id: 'utensils', label: 'מזון', glyph: '🍽️' },
  { id: 'car', label: 'תחבורה', glyph: '🚗' },
  { id: 'receipt', label: 'חשבונות', glyph: '🧾' },
  { id: 'sparkles', label: 'בילויים', glyph: '✨' },
  { id: 'heart', label: 'בריאות', glyph: '❤️' },
  { id: 'bag', label: 'קניות', glyph: '🛍️' },
  { id: 'home', label: 'בית', glyph: '🏠' },
]

export default function CategoryInlineAdd({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#60a5fa')
  const [icon, setIcon] = useState('receipt')

  const canSubmit = useMemo(() => name.trim().length >= 2, [name])

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">קטגוריה חדשה</div>
        <button
          type="button"
          className="btn rounded-lg px-2 py-1 text-xs text-[color:var(--muted)]"
          onClick={onClose}
        >
          סגור
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="text-xs text-[color:var(--muted)]">
          שם
          <input
            className="input mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: חינוך"
            required
          />
        </label>
        <label className="text-xs text-[color:var(--muted)]">
          צבע
          <input
            className="input mt-1 h-[42px] w-full rounded-xl px-2 py-2"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            required
          />
        </label>
        <fieldset className="text-xs text-[color:var(--muted)] sm:col-span-3">
          <legend>אייקון</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ICONS.map((i) => {
              const selected = icon === i.id
              return (
                <button
                  key={i.id}
                  type="button"
                  className={[
                    'btn inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm',
                    selected ? 'btnPrimary' : '',
                  ].join(' ')}
                  onClick={() => setIcon(i.id)}
                  aria-pressed={selected}
                >
                  <span className="text-base" aria-hidden="true">
                    {i.glyph}
                  </span>
                  <span className="text-xs">{i.label}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn btnPrimary rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-50"
          disabled={!canSubmit}
          onClick={() => {
            if (!canSubmit) return
            onAdd({ name: name.trim(), color, icon })
            setName('')
          }}
        >
          הוסף
        </button>
      </div>
    </div>
  )
}

