interface TagProps {
  label: string
  color?: string
}

export function Tag({ label, color = '#6ab123' }: TagProps) {
  return (
    <span style={{
      padding: '2px 7px',
      borderRadius: 3,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      fontSize: 10,
      fontWeight: 600,
      color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
