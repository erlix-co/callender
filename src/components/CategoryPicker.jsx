import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function getLabel(categories, id, allLabel) {
  if (id === 'all') return allLabel || 'הכל'
  return categories.find((c) => c.id === id)?.name || 'בחר קטגוריה'
}

export default function CategoryPicker({
  categories,
  value,
  onChange,
  allOption = false,
  allLabel = 'הכל',
  required = false,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const [menuStyle, setMenuStyle] = useState(null)

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!rootRef.current) return
      const insideTrigger = rootRef.current.contains(e.target)
      const insideMenu = menuRef.current?.contains?.(e.target)
      if (!insideTrigger && !insideMenu) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    if (!open) return

    function update() {
      const btn = rootRef.current?.querySelector('button')
      if (!btn) return
      const r = btn.getBoundingClientRect()
      setMenuStyle({
        position: 'fixed',
        top: Math.round(r.bottom + 8),
        left: Math.round(r.left),
        width: Math.round(r.width),
        zIndex: 9999,
      })
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  const selected = useMemo(
    () => getLabel(categories, value, allLabel),
    [allLabel, categories, value],
  )

  const menu = open ? (
    <div
      ref={menuRef}
      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)] p-2 shadow-[var(--shadow)]"
      style={menuStyle || undefined}
      role="listbox"
    >
      <div className="max-h-60 overflow-auto">
        {allOption ? (
          <button
            type="button"
            className={[
              'btn w-full rounded-xl px-3 py-2 text-right text-sm hover:bg-[color:var(--card2)]',
              value === 'all' ? 'btnPrimary' : '',
            ].join(' ')}
            onClick={() => {
              onChange('all')
              setOpen(false)
            }}
          >
            {allLabel}
          </button>
        ) : null}

        {categories.map((c) => {
          const active = value === c.id
          return (
            <button
              key={c.id}
              type="button"
              className={[
                'btn mt-1 w-full rounded-xl px-3 py-2 text-right text-sm hover:bg-[color:var(--card2)]',
                active ? 'btnPrimary' : '',
              ].join(' ')}
              onClick={() => {
                onChange(c.id)
                setOpen(false)
              }}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ background: c.color || '#60a5fa' }}
                  aria-hidden="true"
                />
                <span>{c.name}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  ) : null

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="input mt-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected}</span>
        <span className="text-xs text-[color:var(--muted)]" aria-hidden="true">
          ▾
        </span>
      </button>

      {required ? (
        <input
          tabIndex={-1}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={value || ''}
          onChange={() => {}}
          required
        />
      ) : null}

      {menu ? createPortal(menu, document.body) : null}
    </div>
  )
}

