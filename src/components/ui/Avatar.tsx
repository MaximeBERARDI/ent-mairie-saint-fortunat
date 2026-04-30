interface AvatarProps {
  initials: string
  color?: string
  size?: number
}

export function Avatar({ initials, color = '#c4793a', size = 28 }: AvatarProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: size * 0.35, color: '#fff', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
        {initials}
      </span>
    </div>
  )
}
