export function normalizeStoreName(s) {
  return String(s || '').trim().replace(/\s+/g, ' ')
}

export function normalizeStoreKey(s) {
  return normalizeStoreName(s).toLowerCase()
}

