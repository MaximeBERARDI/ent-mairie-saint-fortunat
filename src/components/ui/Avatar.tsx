interface AvatarProps {
  initials: string
  color?: string
  size?: number
  photo?: string | null
  alt?: string
}

export function Avatar({ initials, color = '#c4793a', size = 28, photo, alt }: AvatarProps) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={alt ?? initials}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
        }}
      />
    )
  }
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
