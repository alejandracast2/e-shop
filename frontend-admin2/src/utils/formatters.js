export const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`

export const formatAmountWithCurrency = (amount, currency = 'USD') =>
  `${currency} ${Number(amount || 0).toFixed(2)}`

export const formatDateTime = (value, locale = 'es-CO') => {
  if (!value) return '--'

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const shortId = (value, size = 8) => {
  if (!value) return '--'
  return String(value).slice(0, size)
}
