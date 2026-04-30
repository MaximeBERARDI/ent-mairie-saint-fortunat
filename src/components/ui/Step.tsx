interface StepProps {
  steps: string[]
  current: number
}

export function Step({ steps, current }: StepProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= current ? '#6ab123' : '#e2e6e3',
              border: `2px solid ${i <= current ? '#6ab123' : '#e2e6e3'}`,
            }}>
              {i < current
                ? <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>✓</span>
                : <span style={{ fontSize: 11, color: i === current ? '#fff' : '#94aab7', fontWeight: 600 }}>{i + 1}</span>
              }
            </div>
            <span style={{ fontSize: 9, color: i === current ? '#6ab123' : '#94aab7', fontWeight: i === current ? 600 : 400, whiteSpace: 'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#6ab123' : '#e2e6e3', margin: '0 4px', marginBottom: 16 }} />
          )}
        </div>
      ))}
    </div>
  )
}
