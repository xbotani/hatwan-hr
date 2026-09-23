export type NecessityLevel = 'LOW' | 'MEDIUM' | 'CRITICAL'

export interface NecessityOption {
  value: NecessityLevel
  rating: number
  labelKey: string
}

// The employee "Zen" form presents urgency as Low / Medium / Critical, which
// we map onto the existing Int `necessityRating` column (1-10).
export const NECESSITY_OPTIONS: NecessityOption[] = [
  { value: 'LOW', rating: 3, labelKey: 'necessity.low' },
  { value: 'MEDIUM', rating: 6, labelKey: 'necessity.medium' },
  { value: 'CRITICAL', rating: 9, labelKey: 'necessity.critical' }
]

export function necessityLabelKey(rating: number): string {
  if (rating >= 8) return 'necessity.critical'
  if (rating >= 5) return 'necessity.medium'
  return 'necessity.low'
}

export function necessityBadgeColor(rating: number): 'red' | 'yellow' | 'green' {
  if (rating >= 8) return 'red'
  if (rating >= 5) return 'yellow'
  return 'green'
}
