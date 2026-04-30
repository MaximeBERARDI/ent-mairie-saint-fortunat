interface ProgressProps {
  pct: number
  color?: string
  height?: number
}

export function Progress({ pct, color, height = 6 }: ProgressProps) {
  const c = color ?? (pct > 85 ? '#c4393a' : pct > 65 ? '#d4860a' : '#6ab123')
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, background: '#e2e6e3', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: c, borderRadius: height / 2, transition: 'width 0.3s' }} />
    </div>
  )
}
