// Kurdish (Sorani) number & date formatting helpers for the print document.
// Uses Arabic-Indic digits (٠–٩) to match the rest of the ckb localization.

const KURDISH_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

export function toKurdishDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => KURDISH_DIGITS[Number(d)])
}

/** Formats an ISO date as DD/MM/YYYY using Kurdish numerals. */
export function formatKurdishDate(iso: string | undefined): string {
  if (!iso) return '__________'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '__________'
  const day = toKurdishDigits(String(d.getDate()).padStart(2, '0'))
  const month = toKurdishDigits(String(d.getMonth() + 1).padStart(2, '0'))
  const year = toKurdishDigits(String(d.getFullYear()))
  return `${day}/${month}/${year}`
}

/** Formats an amount in Iraqi Dinar with Kurdish digits, 0 fraction digits and the د.ع symbol. */
export function formatKurdishNumber(value: number): string {
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
  const digits = toKurdishDigits(grouped).replace(/,/g, '٬')
  return `${digits} د.ع`
}

/** Formats a necessity rating as "٨ / ١٠". */
export function formatKurdishRating(value: number): string {
  return `${toKurdishDigits(value)} / ${toKurdishDigits(10)}`
}
