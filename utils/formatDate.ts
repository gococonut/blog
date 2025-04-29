export function formatDate(date: string, locale?: string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}
