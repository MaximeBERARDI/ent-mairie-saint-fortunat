interface TagProps {
  label: string
  color?: string
  /** Si true, la balise peut tronquer avec "…" quand le parent contraint la largeur */
  truncate?: boolean
}

export function Tag({ label, color = '#6ab123', truncate }: TagProps) {
  return (
    <span
      title={truncate ? label : undefined}
      style={{
        display: 'inline-block',
        maxWidth: '100%',
        padding: '2px 7px',
        borderRadius: 3,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        fontSize: 11,
        fontWeight: 600,
        color,
        whiteSpace: 'nowrap',
        overflow: truncate ? 'hidden' : undefined,
        textOverflow: truncate ? 'ellipsis' : undefined,
        verticalAlign: 'middle',
      }}
    >
      {label}
    </span>
  )
}
