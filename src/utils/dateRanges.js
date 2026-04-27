function startOfDayLocal(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfToday() {
  return startOfDayLocal(new Date())
}

export function startOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

export function monthlyWindow11To10() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  // Window: 11th (00:00) -> 10th next month (23:59:59.999)
  const startMonth = d >= 11 ? m : m - 1
  const start = new Date(y, startMonth, 11, 0, 0, 0, 0)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 10, 23, 59, 59, 999)

  return { start, end }
}

export function startOfJewishWeekSunday() {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  const d = new Date(now)
  d.setDate(now.getDate() - day)
  return startOfDayLocal(d)
}

export function toMs(isoDate) {
  if (typeof isoDate !== 'string') return new Date(isoDate).getTime()

  // Support YYYY-MM-DD (local date)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [y, m, d] = isoDate.split('-').map((x) => Number(x))
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
  }

  return new Date(isoDate).getTime()
}

export function isInRange(isoDate, start, end = new Date()) {
  const t = toMs(isoDate)
  return t >= start.getTime() && t <= end.getTime()
}

