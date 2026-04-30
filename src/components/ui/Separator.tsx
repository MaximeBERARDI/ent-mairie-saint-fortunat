interface SeparatorProps {
  my?: number
}

export function Separator({ my = 10 }: SeparatorProps) {
  return <div style={{ height: 1, background: 'var(--card-border)', margin: `${my}px 0` }} />
}
