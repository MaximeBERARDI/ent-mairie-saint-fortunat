import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'

export default function EquipePage() {
  return (
    <Shell title="Équipe">
      <Card padding={24} style={{ textAlign: 'center', maxWidth: 400, margin: '60px auto' }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>👥</p>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Module Équipe</p>
        <p style={{ fontSize: 13, color: '#94aab7' }}>Ce module sera disponible dans une prochaine version.</p>
      </Card>
    </Shell>
  )
}
