'use client'

// Rapport de suivi des loyers — page HTML imprimable.
// Accessible depuis Finances → Parc immobilier → bouton « 📰 Rapport loyers ».
// Sections cochables via ?sec=..., période via ?p=12mois|exercice|tout,
// destinataire libre via ?dest=..., analyse IA optionnelle via ?analyse=1.

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useParcImmobilier } from '@/hooks/useParcImmobilier'
import { useRelances } from '@/hooks/useRelances'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  computePeriode, filterQuittancesPourRapport,
  computeKpis, computeDashboardLocataires, computeSyntheseBiens,
  computeSyntheseMois, computeMatriceCharge, computeRelancesHistorique,
  computeFichesDetaillees,
  fmtMontantInt, fmtMontantDec, fmtPct, fmtMois, fmtMoisCourt, fmtDateFR,
  type PeriodeRapport,
} from '@/lib/rapport-loyers'
import { buildLoyersAnalysePayload, type LoyersAnalyseResponse, type LoyersSectionKey } from '@/lib/rapport-loyers-analyse'

const SECTION_KEYS = ['dash', 'biens', 'mois', 'ordures', 'gaz', 'relances', 'fiches'] as const
type SectionKey = (typeof SECTION_KEYS)[number]

export default function RapportLoyersPage() {
  return (
    <Suspense fallback={<p style={{ padding: 40, fontSize: 14, color: '#5e7480', textAlign: 'center' }}>Préparation du rapport…</p>}>
      <RapportLoyersContent />
    </Suspense>
  )
}

function RapportLoyersContent() {
  const params = useSearchParams()
  const destinataire = params.get('dest') ?? ''
  const periodeType = (params.get('p') as PeriodeRapport | null) ?? '12mois'
  const analyseEnabled = params.get('analyse') === '1'
  const sectionsRaw = params.get('sec') ?? SECTION_KEYS.join(',')
  const activeSections = new Set(sectionsRaw.split(',').filter((s): s is SectionKey => SECTION_KEYS.includes(s as SectionKey)))

  const parc = useParcImmobilier()
  const { relances, hydrated: relHydr } = useRelances()
  const { currentUser } = useCurrentUser()

  const allHydrated = parc.hydrated && relHydr
  const periode = useMemo(() => computePeriode(periodeType), [periodeType])
  const periodeLabel = periodeType === 'exercice'
    ? `Exercice ${new Date().getFullYear()}`
    : periodeType === 'tout'
      ? "Tout l'historique des impayés"
      : '12 derniers mois glissants'

  const quittancesPeriode = useMemo(
    () => filterQuittancesPourRapport(parc.quittances, periode),
    [parc.quittances, periode],
  )
  const kpis = useMemo(() => computeKpis(quittancesPeriode, relances), [quittancesPeriode, relances])
  const dashboard = useMemo(
    () => computeDashboardLocataires(parc.locataires, parc.baux, parc.biens, quittancesPeriode, relances),
    [parc.locataires, parc.baux, parc.biens, quittancesPeriode, relances],
  )
  const syntheseBiens = useMemo(
    () => computeSyntheseBiens(parc.biens, parc.locataires, parc.baux, quittancesPeriode),
    [parc.biens, parc.locataires, parc.baux, quittancesPeriode],
  )
  const syntheseMois = useMemo(
    () => computeSyntheseMois(quittancesPeriode, periode.labels),
    [quittancesPeriode, periode.labels],
  )
  const matriceOrdures = useMemo(
    () => computeMatriceCharge(parc.locataires, parc.baux, parc.biens, quittancesPeriode, periode.labels, 'chargesOrdures'),
    [parc.locataires, parc.baux, parc.biens, quittancesPeriode, periode.labels],
  )
  const matriceGaz = useMemo(
    () => computeMatriceCharge(parc.locataires, parc.baux, parc.biens, quittancesPeriode, periode.labels, 'chargesGaz'),
    [parc.locataires, parc.baux, parc.biens, quittancesPeriode, periode.labels],
  )
  const relancesHistorique = useMemo(
    () => computeRelancesHistorique(relances, parc.quittances, parc.baux, parc.biens, parc.locataires, periode),
    [relances, parc.quittances, parc.baux, parc.biens, parc.locataires, periode],
  )
  const fiches = useMemo(
    () => computeFichesDetaillees(parc.locataires, parc.baux, parc.biens, quittancesPeriode, relances, periode.labels),
    [parc.locataires, parc.baux, parc.biens, quittancesPeriode, relances, periode.labels],
  )

  // Analyse IA
  const [analyse, setAnalyse] = useState<LoyersAnalyseResponse | string | null | undefined>(analyseEnabled ? undefined : null)
  useEffect(() => {
    if (!analyseEnabled || !allHydrated) return
    let cancelled = false
    const payload = buildLoyersAnalysePayload({
      periodeLabel,
      moisDebut: periode.moisDebut,
      moisFin: periode.moisFin,
      sections: Array.from(activeSections) as LoyersSectionKey[],
      kpis,
      dashboard: activeSections.has('dash') ? dashboard : undefined,
      biens: activeSections.has('biens') ? syntheseBiens : undefined,
      mois: activeSections.has('mois') ? syntheseMois : undefined,
      ordures: activeSections.has('ordures') ? matriceOrdures : undefined,
      gaz: activeSections.has('gaz') ? matriceGaz : undefined,
      relances: activeSections.has('relances') ? relancesHistorique : undefined,
    })
    fetch('/api/rapport-loyers/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }))
          throw new Error(err.error ?? 'Erreur inconnue.')
        }
        return r.json() as Promise<LoyersAnalyseResponse>
      })
      .then((data) => { if (!cancelled) setAnalyse(data) })
      .catch((e) => { if (!cancelled) setAnalyse(e instanceof Error ? e.message : 'Erreur d\'analyse.') })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyseEnabled, allHydrated])

  if (!allHydrated) {
    return <p style={{ padding: 40, fontSize: 14, color: '#5e7480', textAlign: 'center' }}>Préparation du rapport…</p>
  }

  let numero = 0
  const num = () => ++numero
  const sectionAnalyse = (key: LoyersSectionKey) => {
    if (!analyseEnabled || !analyse || typeof analyse === 'string') return null
    const txt = analyse.commentaires[key]
    if (!txt) return null
    return (
      <div className="rpt-analyse-block rpt-analyse-comment">
        <p className="rpt-analyse-label">📝 Analyse</p>
        <p className="rpt-analyse-text">{txt}</p>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />
      <div className="rpt-root">
        <div className="rpt-actions">
          <div className="rpt-actions-title">Rapport loyers — {periodeLabel}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="rpt-btn rpt-btn-ghost" href="/finances">← Retour</a>
            <button className="rpt-btn rpt-btn-primary" onClick={() => window.print()}>🖨 Imprimer / PDF</button>
          </div>
        </div>
        <div className="rpt-doc">
          {/* Couverture */}
          <div className="rpt-cover">
            <div className="rpt-kicker">Mairie de Saint-Fortunat-sur-Eyrieux · Patrimoine locatif</div>
            <h1>Suivi des loyers et charges</h1>
            <p className="rpt-cover-sub">État des paiements, impayés et relances — {periodeLabel}</p>
            <div className="rpt-cover-meta">
              <div><b>Période</b> · {fmtMois(periode.moisDebut)} → {fmtMois(periode.moisFin)}</div>
              <div><b>Date d&apos;édition</b> · {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              {destinataire && <div><b>Destinataire</b> · {destinataire}</div>}
              {currentUser && <div><b>Édité par</b> · {currentUser.fullName}</div>}
            </div>
          </div>

          {/* Analyse globale IA */}
          {analyseEnabled && (
            <section className="rpt-section rpt-analyse-section">
              <h2>{num()}. Synthèse de l&apos;analyse</h2>
              {analyse === undefined && (
                <p className="rpt-muted">Génération de l&apos;analyse par l&apos;assistant IA en cours… (5 à 15 secondes)</p>
              )}
              {typeof analyse === 'string' && (
                <p className="rpt-muted">Analyse IA indisponible : {analyse}</p>
              )}
              {analyse && typeof analyse === 'object' && (
                <>
                  <div className="rpt-analyse-block">
                    <p className="rpt-analyse-text">{analyse.synthese}</p>
                  </div>
                  <p className="rpt-muted" style={{ fontSize: 11 }}>
                    Synthèse générée par Claude (Anthropic) à partir des chiffres réels. À relire avant transmission externe.
                  </p>
                </>
              )}
            </section>
          )}

          {/* Synthèse exécutive (obligatoire) */}
          <section className="rpt-section">
            <h2>{num()}. Synthèse exécutive</h2>
            <p className="rpt-lead">Indicateurs clés du suivi des loyers sur la période.</p>
            <div className="rpt-kpis">
              <Kpi label="Quittances émises" value={String(kpis.nbQuittances)} sub={`sur ${periode.labels.length} mois`} />
              <Kpi label="Loyers attendus" value={fmtMontantInt(kpis.loyersAttendus)} sub="loyer + charges" />
              <Kpi label="Loyers encaissés" value={fmtMontantInt(kpis.loyersEncaisses)} sub={`${fmtPct(kpis.tauxRecouvrement)} recouvrés`} color={kpis.tauxRecouvrement >= 95 ? '#2d9c6e' : kpis.tauxRecouvrement >= 85 ? '#d4860a' : '#c43c2f'} />
              <Kpi label="Impayés" value={fmtMontantInt(kpis.loyersImpayes)} sub={`${kpis.nbImpayes} quittance(s) due(s)`} color={kpis.nbImpayes === 0 ? '#2d9c6e' : kpis.loyersImpayes > kpis.loyersAttendus * 0.15 ? '#c43c2f' : '#d4860a'} />
              <Kpi label="Relances envoyées" value={String(kpis.nbRelances)} sub="trace administrative" />
              <Kpi label="Ancienneté moyenne" value={kpis.nbImpayes > 0 ? `${kpis.ageImpayeMoyenMois.toFixed(1)} mois` : '—'} sub="des impayés en cours" color={kpis.ageImpayeMoyenMois >= 3 ? '#c43c2f' : '#1f2a31'} />
            </div>
          </section>

          {/* Tableau de bord par locataire */}
          {activeSections.has('dash') && (
            <section className="rpt-section">
              <h2>{num()}. Tableau de bord des impayés</h2>
              <p className="rpt-lead">Locataires avec quittances impayées, classés par ancienneté puis montant.</p>
              {dashboard.length === 0 ? (
                <p className="rpt-muted">Aucun impayé sur la période. Excellent suivi.</p>
              ) : (
                <table className="rpt-table">
                  <thead><tr>
                    <th>Locataire</th>
                    <th>Bien</th>
                    <th>Mois impayés</th>
                    <th className="r">Montant dû</th>
                    <th className="r">Relances</th>
                    <th>Dernière relance</th>
                    <th>Résultat</th>
                    <th className="r">Ancienneté</th>
                  </tr></thead>
                  <tbody>
                    {dashboard.map((r) => (
                      <tr key={r.locataire.id}>
                        <td>{r.locataire.fullName}</td>
                        <td>{r.bien?.nom ?? '—'}</td>
                        <td><MoisList mois={r.moisImpayes} /></td>
                        <td className="r"><b>{fmtMontantDec(r.montantDu)}</b></td>
                        <td className="r">{r.nbRelances}</td>
                        <td>{r.dateDerniereRelance ? fmtDateFR(r.dateDerniereRelance) : '—'}</td>
                        <td>{r.dernierResultat ?? '—'}</td>
                        <td className="r" style={{ color: r.ageImpayeMoisLePlusVieux >= 3 ? '#c43c2f' : '#1f2a31' }}>{r.ageImpayeMoisLePlusVieux} mois</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {sectionAnalyse('dash')}
            </section>
          )}

          {/* Synthèse par bien */}
          {activeSections.has('biens') && (
            <section className="rpt-section">
              <h2>{num()}. Synthèse par bien</h2>
              <p className="rpt-lead">Performance locative et impayés en cours, par bien immobilier.</p>
              <table className="rpt-table">
                <thead><tr>
                  <th>Réf.</th>
                  <th>Bien</th>
                  <th>Locataire actuel</th>
                  <th className="r">Loyer mensuel</th>
                  <th className="r">Attendus</th>
                  <th className="r">Encaissés</th>
                  <th className="r">Taux</th>
                  <th className="r">Impayés</th>
                </tr></thead>
                <tbody>
                  {syntheseBiens.map((r) => (
                    <tr key={r.bien.id}>
                      <td className="mono">{r.bien.reference}</td>
                      <td>{r.bien.nom}</td>
                      <td>{r.occupe ? (r.locataire?.fullName ?? '—') : <i>vacant</i>}</td>
                      <td className="r">{r.loyerMensuel > 0 ? fmtMontantInt(r.loyerMensuel) : '—'}</td>
                      <td className="r">{fmtMontantInt(r.loyersAttendus)}</td>
                      <td className="r">{fmtMontantInt(r.loyersEncaisses)}</td>
                      <td className="r" style={{ color: r.tauxRecouvrement >= 95 ? '#2d9c6e' : r.tauxRecouvrement >= 85 ? '#d4860a' : '#c43c2f' }}>{r.loyersAttendus > 0 ? fmtPct(r.tauxRecouvrement, 0) : '—'}</td>
                      <td className="r"><b>{r.nbImpayesEnCours}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sectionAnalyse('biens')}
            </section>
          )}

          {/* Synthèse par mois */}
          {activeSections.has('mois') && (
            <section className="rpt-section">
              <h2>{num()}. Synthèse mensuelle</h2>
              <p className="rpt-lead">Évolution mensuelle des encaissements sur la période.</p>
              <table className="rpt-table">
                <thead><tr>
                  <th>Mois</th>
                  <th className="r">Émises</th>
                  <th className="r">Payées</th>
                  <th className="r">Impayées</th>
                  <th className="r">Attendu</th>
                  <th className="r">Encaissé</th>
                  <th className="r">Taux</th>
                </tr></thead>
                <tbody>
                  {syntheseMois.map((r) => (
                    <tr key={r.mois}>
                      <td className="mono">{fmtMoisCourt(r.mois)}</td>
                      <td className="r">{r.nbEmises}</td>
                      <td className="r" style={{ color: '#2d9c6e' }}>{r.nbPayees}</td>
                      <td className="r" style={{ color: r.nbImpayees > 0 ? '#c43c2f' : '#5e7480' }}>{r.nbImpayees}</td>
                      <td className="r">{fmtMontantInt(r.totalAttendu)}</td>
                      <td className="r">{fmtMontantInt(r.totalEncaisse)}</td>
                      <td className="r">{r.totalAttendu > 0 ? fmtPct(r.tauxRecouvrement, 0) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sectionAnalyse('mois')}
            </section>
          )}

          {/* Suivi ordures ménagères */}
          {activeSections.has('ordures') && (
            <section className="rpt-section">
              <h2>{num()}. Suivi des ordures ménagères (TEOM)</h2>
              <p className="rpt-lead">Montants TEOM facturés et recouvrés, par locataire et par mois.</p>
              {matriceOrdures.totalGeneral.attendu === 0 ? (
                <p className="rpt-muted">Aucun montant TEOM facturé sur la période (ventilation non saisie dans les baux ?).</p>
              ) : (
                <ChargeMatrixTable matrice={matriceOrdures} labels={periode.labels} />
              )}
              {sectionAnalyse('ordures')}
            </section>
          )}

          {/* Suivi gaz */}
          {activeSections.has('gaz') && (
            <section className="rpt-section">
              <h2>{num()}. Suivi du gaz / chauffage</h2>
              <p className="rpt-lead">Quote-parts de gaz facturées et recouvrées, par locataire et par mois.</p>
              {matriceGaz.totalGeneral.attendu === 0 ? (
                <p className="rpt-muted">Aucun montant gaz facturé sur la période.</p>
              ) : (
                <ChargeMatrixTable matrice={matriceGaz} labels={periode.labels} />
              )}
              {sectionAnalyse('gaz')}
            </section>
          )}

          {/* Historique des relances */}
          {activeSections.has('relances') && (
            <section className="rpt-section">
              <h2>{num()}. Historique des relances</h2>
              <p className="rpt-lead">Toutes les relances envoyées sur la période, chronologiquement.</p>
              {relancesHistorique.length === 0 ? (
                <p className="rpt-muted">Aucune relance enregistrée sur la période.</p>
              ) : (
                <table className="rpt-table">
                  <thead><tr>
                    <th>Date</th>
                    <th>Locataire</th>
                    <th>Quittance</th>
                    <th>Canal</th>
                    <th>Résultat</th>
                    <th>Note</th>
                  </tr></thead>
                  <tbody>
                    {relancesHistorique.map((l) => (
                      <tr key={l.relance.id}>
                        <td className="mono">{fmtDateFR(l.relance.date)}</td>
                        <td>{l.locataire?.fullName ?? '—'}</td>
                        <td className="mono">{l.quittance?.numero ?? '—'}</td>
                        <td>{l.relance.canal}</td>
                        <td>{l.relance.resultat ?? '—'}</td>
                        <td style={{ fontSize: 12 }}>{l.relance.contenu ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {sectionAnalyse('relances')}
            </section>
          )}

          {/* Fiches détaillées par locataire */}
          {activeSections.has('fiches') && (
            <section className="rpt-section">
              <h2>{num()}. Fiches détaillées par locataire</h2>
              <p className="rpt-lead">Une fiche par locataire avec historique, solde et relances.</p>
              {fiches.length === 0 ? (
                <p className="rpt-muted">Aucun locataire avec mouvement sur la période.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {fiches.map((f) => (
                    <FicheLocataireBlock key={f.locataire.id} fiche={f} />
                  ))}
                </div>
              )}
              {sectionAnalyse('fiches')}
            </section>
          )}

          {/* Signature */}
          <section className="rpt-section">
            <h2>{num()}. Signature</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginTop: 12 }}>
              <div>
                <p className="rpt-text"><b>Fait à Saint-Fortunat-sur-Eyrieux,</b></p>
                <p className="rpt-text">le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="rpt-text"><b>Le Maire,</b></p>
                <div style={{ height: 80, borderBottom: '1px solid #dde4e9', marginTop: 8 }} />
                <p className="rpt-muted" style={{ marginTop: 8 }}>Signature</p>
              </div>
            </div>
          </section>

          <div className="rpt-foot">
            <span>ENT Mairie de Saint-Fortunat-sur-Eyrieux · Rapport loyers {new Date().getFullYear()}</span>
            <span>{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────

function Kpi({ label, value, sub, color = '#1f2a31' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rpt-kpi">
      <div className="rpt-kpi-lbl">{label}</div>
      <div className="rpt-kpi-val" style={{ color }}>{value}</div>
      {sub && <div className="rpt-kpi-sub">{sub}</div>}
    </div>
  )
}

function MoisList({ mois }: { mois: string[] }) {
  // Affiche compactement la liste des mois (max 3 visibles + "+N")
  const visible = mois.slice(0, 3).map(fmtMoisCourt).join(', ')
  const rest = mois.length - 3
  return <span style={{ fontSize: 12 }}>{visible}{rest > 0 && <span style={{ color: '#5e7480' }}> +{rest}</span>}</span>
}

function ChargeMatrixTable({ matrice, labels }: { matrice: ReturnType<typeof computeMatriceCharge>; labels: string[] }) {
  // Pour rester lisible à l'impression, on limite à ~6 mois affichés et on
  // résume le reste dans une colonne "Total période".
  const moisAffiches = labels.slice(-6)
  return (
    <table className="rpt-table">
      <thead>
        <tr>
          <th>Locataire</th>
          {moisAffiches.map((m) => <th key={m} className="r">{fmtMoisCourt(m)}</th>)}
          <th className="r">Total attendu</th>
          <th className="r">Total encaissé</th>
        </tr>
      </thead>
      <tbody>
        {matrice.rows.map((r) => (
          <tr key={r.locataire.id}>
            <td>{r.locataire.fullName}</td>
            {moisAffiches.map((m) => {
              const cell = r.parMois.get(m)
              if (!cell || cell.montant === 0) return <td key={m} className="r" style={{ color: '#9eb3bd' }}>—</td>
              return (
                <td key={m} className="r" style={{ color: cell.payee ? '#2d9c6e' : '#c43c2f' }}>
                  {fmtMontantInt(cell.montant)}
                </td>
              )
            })}
            <td className="r"><b>{fmtMontantInt(r.totalAttendu)}</b></td>
            <td className="r" style={{ color: r.totalAttendu === r.totalEncaisse ? '#2d9c6e' : '#c43c2f' }}>
              {fmtMontantInt(r.totalEncaisse)}
            </td>
          </tr>
        ))}
        <tr style={{ borderTop: '2px solid #dde4e9', fontWeight: 700 }}>
          <td>TOTAL</td>
          {moisAffiches.map((m) => {
            const tot = matrice.totalParMois.get(m)
            return <td key={m} className="r">{tot ? fmtMontantInt(tot.attendu) : '—'}</td>
          })}
          <td className="r">{fmtMontantInt(matrice.totalGeneral.attendu)}</td>
          <td className="r">{fmtMontantInt(matrice.totalGeneral.encaisse)}</td>
        </tr>
      </tbody>
    </table>
  )
}

function FicheLocataireBlock({ fiche }: { fiche: ReturnType<typeof computeFichesDetaillees>[number] }) {
  return (
    <div style={{ breakInside: 'avoid', border: '1px solid #dde4e9', borderRadius: 8, padding: 14, background: '#fcfdfb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div>
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 16, fontWeight: 700, color: '#1f2a31', margin: 0 }}>
            {fiche.locataire.fullName}
          </p>
          <p style={{ fontSize: 12, color: '#5e7480', marginTop: 4 }}>
            {fiche.bien?.nom ?? '—'} · {fiche.locataire.email ?? 'pas d\'email'} · {fiche.locataire.phone ?? 'pas de téléphone'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#5e7480', textTransform: 'uppercase', letterSpacing: '.04em' }}>Solde</p>
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 20, fontWeight: 700, color: fiche.solde > 0 ? '#c43c2f' : '#2d9c6e' }}>
            {fiche.solde > 0 ? '+ ' : ''}{fmtMontantDec(fiche.solde)}
          </p>
          <p style={{ fontSize: 11, color: '#5e7480' }}>{fiche.solde > 0 ? 'dû à la commune' : 'à jour'}</p>
        </div>
      </div>
      <table className="rpt-table" style={{ marginBottom: 10 }}>
        <thead><tr><th>Mois</th><th className="r">Loyer + charges</th><th>Statut</th></tr></thead>
        <tbody>
          {fiche.lignesMensuelles.map((l) => (
            <tr key={l.mois}>
              <td className="mono">{fmtMoisCourt(l.mois)}</td>
              <td className="r">{l.quittance ? fmtMontantDec(l.quittance.total) : '—'}</td>
              <td style={{ color: l.statutEffectif === 'Payée' ? '#2d9c6e' : (l.statutEffectif === 'Impayée' || l.statutEffectif === 'Relancée') ? '#c43c2f' : '#5e7480' }}>{l.statutEffectif}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {fiche.relances.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: '#5e7480', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>
            Relances ({fiche.relances.length})
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#1f2a31', lineHeight: 1.6 }}>
            {fiche.relances.slice(0, 5).map((r) => (
              <li key={r.id}>
                <b>{fmtDateFR(r.date)}</b> — {r.canal}
                {r.resultat && <> · <i>{r.resultat}</i></>}
                {r.contenu && <> — {r.contenu}</>}
              </li>
            ))}
            {fiche.relances.length > 5 && <li style={{ color: '#5e7480' }}>+ {fiche.relances.length - 5} relance(s) antérieure(s)</li>}
          </ul>
        </>
      )}
    </div>
  )
}

// ─── Styles (cohérent avec /rapport-financier) ──────────────────

const REPORT_CSS = `
.rpt-root{--g:#6ab123;--g7:#416d11;--s8:#1f2a31;--s5:#4d5e6c;--sub:#6e8899;--bd:#dde4e9;--bg:#f4f6f1;--terra:#c4793a;
  font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--s8);background:var(--bg);min-height:100vh}
.rpt-doc{max-width:900px;margin:0 auto;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.10);}
.rpt-actions{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;justify-content:space-between;
  background:var(--s8);color:#fff;padding:10px 20px}
.rpt-actions-title{font-weight:600;font-size:14px;opacity:.9}
.rpt-btn{font-family:inherit;font-size:13px;font-weight:600;border-radius:8px;padding:8px 14px;cursor:pointer;border:none;text-decoration:none}
.rpt-btn-primary{background:var(--g);color:#fff}
.rpt-btn-ghost{background:rgba(255,255,255,.12);color:#fff}
.rpt-cover{background:radial-gradient(900px 400px at 90% -20%,rgba(196,121,58,.30),transparent 60%),linear-gradient(135deg,#1f2a31,#111820);
  color:#fff;padding:56px 48px}
.rpt-kicker{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#e0b48e;margin-bottom:14px}
.rpt-cover h1{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:40px;line-height:1.08;letter-spacing:-.01em;margin:0 0 10px}
.rpt-cover-sub{font-size:17px;color:rgba(255,255,255,.82);margin:0 0 26px}
.rpt-cover-meta{display:flex;flex-wrap:wrap;gap:8px 26px;font-size:13px;color:rgba(255,255,255,.72)}
.rpt-cover-meta b{color:#fff;font-weight:600}
.rpt-section{padding:30px 48px;border-bottom:1px solid var(--bd)}
.rpt-section h2{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:23px;color:var(--s8);margin:0 0 16px;
  padding-bottom:8px;border-bottom:2px solid var(--terra)}
.rpt-section h3{font-size:14px;font-weight:700;color:var(--s8);margin:22px 0 10px;text-transform:uppercase;letter-spacing:.04em}
.rpt-lead{font-size:16px;line-height:1.6;color:var(--s5);margin:0 0 14px}
.rpt-text{font-size:14px;line-height:1.6;color:var(--s5);margin:0 0 10px}
.rpt-muted{font-size:14px;color:var(--sub);font-style:italic;margin:6px 0}
.rpt-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:6px 0 4px}
.rpt-kpi{border:1px solid var(--bd);border-radius:12px;padding:14px 16px;background:#fff}
.rpt-kpi-lbl{font-size:11px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--sub);margin-bottom:8px}
.rpt-kpi-val{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:24px;line-height:1}
.rpt-kpi-sub{font-size:12px;color:var(--sub);margin-top:7px}
.rpt-table{width:100%;border-collapse:collapse;margin:6px 0 4px;font-size:13px}
.rpt-table th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--sub);
  padding:8px 10px;border-bottom:2px solid var(--bd)}
.rpt-table td{padding:8px 10px;border-bottom:1px solid var(--bd);color:var(--s8)}
.rpt-table th.r,.rpt-table td.r{text-align:right}
.rpt-table td.mono{font-family:'JetBrains Mono','Courier New',monospace;color:var(--s5);font-size:12px}
.rpt-analyse-section{background:linear-gradient(180deg,#f8f7f1,#fdfcf6);}
.rpt-analyse-block{background:#fefdf8;border:1px solid #e8e4d4;border-left:4px solid var(--terra);border-radius:8px;padding:14px 18px;margin:10px 0}
.rpt-analyse-comment{margin-top:14px}
.rpt-analyse-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--terra);margin:0 0 6px}
.rpt-analyse-text{font-size:14px;line-height:1.65;color:var(--s8);margin:0;text-align:justify;font-family:Georgia,'Times New Roman',serif}
.rpt-foot{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;
  padding:20px 48px;font-size:12px;color:var(--sub)}
@media print{
  .rpt-actions{display:none}
  .rpt-root{background:#fff}
  .rpt-doc{box-shadow:none;max-width:none;margin:0}
  .rpt-section{break-inside:avoid;padding:18px 0}
  .rpt-cover{padding:36px 0}
  .rpt-foot{padding:16px 0}
  @page{margin:14mm}
}
@media(max-width:720px){
  .rpt-kpis{grid-template-columns:repeat(2,1fr)}
  .rpt-section,.rpt-cover,.rpt-foot{padding-left:22px;padding-right:22px}
}
`
