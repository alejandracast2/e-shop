export function parseProductTags(value) {
  return [...new Set(
    String(value || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  )]
}

export function formatProductTags(tags) {
  return Array.isArray(tags) ? tags.filter(Boolean).join(', ') : ''
}
