const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
})

export const formatDate = (value) => {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha invalida'
  return dateFormatter.format(date)
}

export const formatDateTime = (value) => {
  if (!value) return 'Sin registro'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha invalida'
  return dateTimeFormatter.format(date)
}

export const shortId = (value) => {
  if (!value) return '--'
  return `${value.slice(0, 8)}...`
}
