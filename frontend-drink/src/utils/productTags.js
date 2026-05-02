export function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []

  return [...new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean))]
}

export function getDiscountTag(tags) {
  const normalizedTags = normalizeTags(tags)
  const discountPercent = resolveDiscountPercent(normalizedTags)

  if (!discountPercent) return ''

  return normalizedTags.find((tag) => resolveDiscountPercent([tag]) === discountPercent) || ''
}

export function resolveDiscountPercent(tags) {
  return normalizeTags(tags).reduce((highest, tag) => {
    const match = tag.match(/(\d{1,2}(?:[.,]\d+)?)\s*%/)
    if (!match) return highest

    const percent = Number(match[1].replace(',', '.'))
    if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return highest

    return Math.max(highest, percent)
  }, 0)
}

export function calculateDiscountedPrice(price, tags) {
  const basePrice = Number(price || 0)
  const discountPercent = resolveDiscountPercent(tags)

  if (!discountPercent) return basePrice

  return Math.round(basePrice * (1 - discountPercent / 100))
}

export function hasStatusTag(tags, status) {
  const expected = String(status || '').trim().toLowerCase()
  return normalizeTags(tags).some((tag) => tag.toLowerCase() === expected)
}
