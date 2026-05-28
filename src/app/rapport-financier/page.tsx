'use client'

// Rapport Financier complet — page HTML imprimable, accessible depuis
// Finances → Budget → bouton « Rapport financier ». Sections cochables
// via query params (?sec=att,bud,...) + destinataire libre.
//
// Réutilise le design system du rapport général /rapport (typo Georgia,
// classes .rpt-*) pour cohérence visuelle.

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useFactures } from '@/hooks/useFactures'
import { useFournisseurs } from '@/hooks/useFournisseurs'
import { useBudget } from '@/hooks/useBudget'
import { useEcritures } from '@/hooks/useEcritures'
import { useHistorique } from '@/hooks/useHistorique'
import { useParcImmobilier } from '@/hooks/useParcImmobilier'
import { useEmployees } from '@/hooks/useEmployees'
import { useBulletins } from '@/hooks/useBulletins'
import { useProjets, projeterProjet, combinerProjections } from '@/hooks/useProjets'
import { useSubventions } from '@/hooks/useSubventions'
import { useTeam } from '@/hooks/useTeam'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { computeRatios } from '@/lib/ratios'
import {
  computeTresorerie, computeFactureControle, computeTopFournisseurs,
  computePatrimoineControle, computeRHControle, computePluriannuel,
  computePointsAttention, alertPoste,
  fmtMontantInt, fmtMontantDec, fmtPct, fmtDateFR,
} from '@/lib/rapport-financier'

const SECTION_KEYS = ['att', 'bud', 'rat', 'evo', 'tre', 'fou', 'loc', 'rh', 'prj', 'sub', 'pr5'] as const
type SectionKey = (typeof SECTION_KEYS)[number]

export default function RapportFinancierPage() {
  return (
    <Suspense fallback={<p style={{ padding: 40, fontSize: 14, color: '#5e7480', textAlign: 'center' }}>Préparation du rapport…</p>}>
      <RapportFinancierContent />
    </Suspense>
  )
}

function RapportFinancierContent() {
  const params = useSearchParams()
  const destinataire = params.get('dest') ?? ''
  const sectionsRaw = params.get('sec') ?? SECTION_KEYS.join(',')
  const activeSections = new Set(sectionsRaw.split(',').filter((s): s is SectionKey => SECTION_KEYS.includes(s as SectionKey)))

  const { factures, hydrated: hFactures } = useFactures()
  const { fournisseurs, hydrated: hFournisseurs } = useFournisseurs()
  const { postes, computePosteWithConsumption, hydrated: hBudget } = useBudget()
  const { ecritures, hydrated: hEcritures } = useEcritures()
  const { exercices, hydrated: hHistorique } = useHistorique()
  const parc = useParcImmobilier()
  const { records, hydrated: hEmployees } = useEmployees()
  const { bulletins, hydrated: hBulletins } = useBulletins()
  const { projets, hydrated: hProjets } = useProjets()
  const { subventions, hydrated: hSubventions } = useSubventions()
  const { people } = useTeam()
  const { currentUser } = useCurrentUser()

  const allHydrated = hFactures && hFournisseurs && hBudget && hEcritures && hHistorique && parc.hydrated && hEmployees && hBulletins && hProjets && hSubventions

  const enriched = useMemo(() => postes.map((p) => computePosteWithConsumption(p, factures, ecritures)),
    [postes, factures, ecritures, computePosteWithConsumption])

  const exerciceN = new Date().getFullYear()
  const ratios = useMemo(() => computeRatios(enriched, 900, 0), [enriched])

  const tresorerie = useMemo(() => computeTresorerie(ecritures, ratios.drf), [ecritures, ratios.drf])
  const controle = useMemo(() => computeFactureControle(factures, new Date().toISOString().slice(0, 10)), [factures])
  const topFournisseurs = useMemo(() => computeTopFournisseurs(fournisseurs, factures, 10), [fournisseurs, factures])
  const patrimoine = useMemo(() => computePatrimoineControle(parc.biens, parc.locataires, parc.quittances, exerciceN), [parc.biens, parc.locataires, parc.quittances, exerciceN])
  const rh = useMemo(() => computeRHControle(records, bulletins, ratios.rrf), [records, bulletins, ratios.rrf])
  const pluriannuel = useMemo(() => computePluriannuel(ratios, exercices, exerciceN), [ratios, exercices, exerciceN])
  const projection = useMemo(() => projets.length > 0 ? combinerProjections(projets.map((p) => projeterProjet(p, ratios, 5))) : [], [projets, ratios])
  const pointsAttention = useMemo(() => computePointsAttention(ratios, enriched, controle, patrimoine, rh), [ratios, enriched, controle, patrimoine, rh])

  if (!allHydrated) {
    return <p style={{ padding: 40, fontSize: 14, color: '#5e7480', textAlign: 'center' }}>Préparation du rapport…</p>
  }

  // Numérotation des sections rendues (auto)
  let numero = 0
  const num = () => ++numero

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />
      <div className="rpt-root">
        <div className="rpt-actions">
          <div className="rpt-actions-title">Rapport financier — exercice {exerciceN}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="rpt-btn rpt-btn-ghost" href="/finances">← Retour</a>
            <button className="rpt-btn rpt-btn-primary" onClick={() => window.print()}>🖨 Imprimer / PDF</button>
          </div>
        </div>
        <div className="rpt-doc">
          {/* Couverture (obligatoire) */}
          <div className="rpt-cover">
            <div className="rpt-kicker">Mairie de Saint-Fortunat-sur-Eyrieux · Ardèche</div>
            <h1>Rapport financier</h1>
            <p className="rpt-cover-sub">État de la santé financière de la commune — exercice {exerciceN}</p>
            <div className="rpt-cover-meta">
              <div><b>Exercices couverts</b> · {exerciceN - 2} → {exerciceN}</div>
              <div><b>Date d&apos;édition</b> · {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              {destinataire && <div><b>Destinataire</b> · {destinataire}</div>}
              {currentUser && <div><b>Édité par</b> · {currentUser.fullName}</div>}
            </div>
          </div>

          {/* Synthèse exécutive (obligatoire) */}
          <section className="rpt-section">
            <h2>{num()}. Synthèse exécutive</h2>
            <p className="rpt-lead">
              Vue d&apos;ensemble des indicateurs clés de la commune pour l&apos;exercice en cours.
              Ces chiffres sont les marqueurs habituels suivis par la DGFiP et les organismes financeurs.
            </p>
            <div className="rpt-kpis">
              <Kpi label="Recettes réelles fonctionnement" value={fmtMontantInt(ratios.rrf)} sub="RRF" />
              <Kpi label="Dépenses réelles fonctionnement" value={fmtMontantInt(ratios.drf)} sub="DRF" />
              <Kpi label="CAF brute" value={fmtMontantInt(ratios.cafBrute)} sub="capacité d'autofinancement" color={ratios.cafBrute >= 0 ? '#2d9c6e' : '#c43c2f'} />
              <Kpi label="CAF nette" value={fmtMontantInt(ratios.cafNette)} sub="après remboursement capital" color={ratios.cafNette >= 0 ? '#2d9c6e' : '#c43c2f'} />
              <Kpi label="Encours de la dette" value={fmtMontantInt(ratios.encoursDette)} sub={`${Math.round(ratios.encoursDette / 900)} €/hab`} />
              <Kpi label="Capacité de désendettement" value={`${ratios.capaciteDesendettement.toFixed(1)} ans`} sub="CAF brute → dette" color={ratios.capaciteDesendettement >= 12 ? '#c43c2f' : ratios.capaciteDesendettement >= 10 ? '#d4860a' : '#2d9c6e'} />
            </div>
          </section>

          {/* Points d'attention */}
          {activeSections.has('att') && pointsAttention.length > 0 && (
            <section className="rpt-section">
              <h2>{num()}. Points d&apos;attention</h2>
              <p className="rpt-lead">Alertes automatiques calculées selon les seuils standards DGFiP.</p>
              <div className="rpt-attention-list">
                {pointsAttention.map((pt, i) => (
                  <div key={i} className={`rpt-attention rpt-attention-${pt.niveau}`}>
                    <span className="rpt-attention-tag">{pt.niveau === 'critical' ? 'Critique' : 'Vigilance'}</span>
                    <span className="rpt-attention-dom">{pt.domaine}</span>
                    <span className="rpt-attention-msg">{pt.message}</span>
                  </div>
                ))}
              </div>
              {pointsAttention.length === 0 && (
                <p className="rpt-muted">Aucune alerte automatique. Tous les ratios sont dans les seuils acceptables.</p>
              )}
            </section>
          )}

          {/* Section budgétaire */}
          {activeSections.has('bud') && (
            <section className="rpt-section">
              <h2>{num()}. Exécution budgétaire</h2>
              <p className="rpt-lead">Budget alloué vs réalisé, par section et par sens.</p>
              <BudgetExecutionTable postes={enriched} />
              <h3>Postes en alerte (≥ 80 % du budget consommé)</h3>
              <PostesEnAlerte postes={enriched} />
            </section>
          )}

          {/* Ratios DGFiP & R. 2313-1 */}
          {activeSections.has('rat') && (
            <section className="rpt-section">
              <h2>{num()}. Ratios DGFiP & R. 2313-1</h2>
              <p className="rpt-lead">Indicateurs réglementaires de pilotage financier.</p>
              <div className="rpt-ratios">
                <Ratio label="Taux d'épargne brute" value={fmtPct(ratios.tauxEpargneBrute)} hint="CAF brute / RRF" />
                <Ratio label="Capacité de désendettement" value={`${ratios.capaciteDesendettement.toFixed(1)} ans`} hint="Dette / CAF brute" />
                <Ratio label="DRF / habitant (1)" value={fmtMontantInt(ratios.ratio1_drfParHab)} />
                <Ratio label="Produit impôts directs / habitant (2)" value={fmtMontantInt(ratios.ratio2_produitImpotsDirectsParHab)} />
                <Ratio label="RRF / habitant (3)" value={fmtMontantInt(ratios.ratio3_rrfParHab)} />
                <Ratio label="Dépenses équipement / habitant (4)" value={fmtMontantInt(ratios.ratio4_equipementParHab)} />
                <Ratio label="Encours dette / habitant (5)" value={fmtMontantInt(ratios.ratio5_encoursDetteParHab)} />
                <Ratio label="DGF / habitant (6)" value={fmtMontantInt(ratios.ratio6_dgfParHab)} />
                <Ratio label="Dépenses personnel / DRF (7)" value={fmtPct(ratios.ratio7_personnelSurDrf)} />
                <Ratio label="Rigidité des charges (9)" value={fmtPct(ratios.ratio9_rigidite)} hint="DRF + capital / RRF" />
                <Ratio label="Dépenses équipement / RRF (10)" value={fmtPct(ratios.ratio10_equipementSurRrf)} />
                <Ratio label="Encours dette / RRF (11)" value={fmtPct(ratios.ratio11_detteSurRrf)} />
              </div>
            </section>
          )}

          {/* Évolution pluriannuelle */}
          {activeSections.has('evo') && (
            <section className="rpt-section">
              <h2>{num()}. Évolution pluriannuelle ({exerciceN - 2} → {exerciceN})</h2>
              <p className="rpt-lead">Évolution des grands postes sur 3 exercices.</p>
              <PluriannuelTable lignes={pluriannuel} anneeN={exerciceN} />
              {pluriannuel.some((l) => l.N_1 === null || l.N_2 === null) && (
                <p className="rpt-muted">
                  Données pluriannuelles incomplètes — saisir les exercices N-1 et N-2 dans Finances → Historique pour un comparatif complet.
                </p>
              )}
            </section>
          )}

          {/* Trésorerie */}
          {activeSections.has('tre') && (
            <section className="rpt-section">
              <h2>{num()}. Trésorerie</h2>
              <p className="rpt-lead">Solde du compte Banque (515) et évolution mensuelle.</p>
              <div className="rpt-kpis">
                <Kpi label="Solde de trésorerie" value={fmtMontantInt(tresorerie.soldeActuel)} sub="compte 515 — Banque" color={tresorerie.soldeActuel >= 0 ? '#2d9c6e' : '#c43c2f'} />
                <Kpi label="Durée de couverture" value={`${tresorerie.dureeCouvertureMois.toFixed(1)} mois`} sub="solde / DRF mensuelle" color={tresorerie.dureeCouvertureMois >= 3 ? '#2d9c6e' : tresorerie.dureeCouvertureMois >= 1 ? '#d4860a' : '#c43c2f'} />
              </div>
              {tresorerie.historiqueMensuel.length > 0 ? (
                <table className="rpt-table" style={{ marginTop: 14 }}>
                  <thead><tr><th>Mois</th><th className="r">Entrées (€)</th><th className="r">Sorties (€)</th><th className="r">Solde fin de mois (€)</th></tr></thead>
                  <tbody>
                    {tresorerie.historiqueMensuel.map((m) => (
                      <tr key={m.mois}>
                        <td className="mono">{m.mois}</td>
                        <td className="r">{fmtMontantInt(m.entrees)}</td>
                        <td className="r">{fmtMontantInt(m.sorties)}</td>
                        <td className="r"><b>{fmtMontantInt(m.soldeFinDeMois)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="rpt-muted">Aucun mouvement enregistré sur le compte 515 sur la période.</p>
              )}
            </section>
          )}

          {/* Contrôle paiements fournisseurs */}
          {activeSections.has('fou') && (
            <section className="rpt-section">
              <h2>{num()}. Contrôle des paiements fournisseurs</h2>
              <p className="rpt-lead">Suivi du circuit facture → validation → mandatement.</p>
              <div className="rpt-kpis">
                <Kpi label="En attente validation" value={String(controle.enAttenteValidation.count)} sub={fmtMontantInt(controle.enAttenteValidation.montant)} color="#d4860a" />
                <Kpi label="Validées non payées" value={String(controle.valideesNonPayees.count)} sub={fmtMontantInt(controle.valideesNonPayees.montant)} />
                <Kpi label="Payées" value={String(controle.payees.count)} sub={fmtMontantInt(controle.payees.montant)} color="#2d9c6e" />
                <Kpi label="Délai moyen de paiement" value={controle.delaiMoyenPaiementJours !== null ? `${controle.delaiMoyenPaiementJours} j` : '—'} sub="entre facturation et paiement" />
              </div>
              <h3>Factures en retard de paiement ({controle.enRetardPaiement.length})</h3>
              {controle.enRetardPaiement.length > 0 ? (
                <table className="rpt-table">
                  <thead><tr><th>N° facture</th><th>Fournisseur</th><th>Date facture</th><th>Échéance</th><th className="r">Montant TTC</th></tr></thead>
                  <tbody>
                    {controle.enRetardPaiement.map((f) => {
                      const four = fournisseurs.find((x) => x.id === f.fournisseurId)
                      return (
                        <tr key={f.id}>
                          <td className="mono">{f.numero}</td>
                          <td>{four?.nom ?? '—'}</td>
                          <td>{fmtDateFR(f.dateFacture)}</td>
                          <td>{fmtDateFR(f.dateEcheance ?? '')}</td>
                          <td className="r">{fmtMontantDec(f.montantTTC)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="rpt-muted">Aucune facture en retard de paiement. Excellent suivi.</p>
              )}
              <h3>Top 10 fournisseurs par engagement</h3>
              {topFournisseurs.length > 0 ? (
                <table className="rpt-table">
                  <thead><tr><th>Rang</th><th>Fournisseur</th><th>Catégorie</th><th className="r">Engagé</th><th className="r">Part</th><th className="r">Nb factures</th></tr></thead>
                  <tbody>
                    {topFournisseurs.map((tf, i) => (
                      <tr key={tf.fournisseur.id}>
                        <td className="mono">{i + 1}</td>
                        <td>{tf.fournisseur.nom}</td>
                        <td>{tf.fournisseur.categorie}</td>
                        <td className="r">{fmtMontantInt(tf.totalEngage)}</td>
                        <td className="r">{fmtPct(tf.partPct)}</td>
                        <td className="r">{tf.nbFactures}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="rpt-muted">Aucun engagement fournisseur enregistré.</p>
              )}
            </section>
          )}

          {/* Patrimoine & revenus locatifs */}
          {activeSections.has('loc') && (
            <section className="rpt-section">
              <h2>{num()}. Patrimoine & revenus locatifs</h2>
              <p className="rpt-lead">Suivi du parc immobilier communal et du recouvrement des loyers.</p>
              <div className="rpt-kpis">
                <Kpi label="Biens" value={String(patrimoine.nbBiens)} sub="parc immobilier" />
                <Kpi label="Locataires" value={String(patrimoine.nbLocataires)} sub="baux en cours" />
                <Kpi label="Loyers attendus" value={fmtMontantInt(patrimoine.loyersAttendusAnnuels)} sub={`exercice ${exerciceN}`} />
                <Kpi label="Taux de recouvrement" value={fmtPct(patrimoine.tauxRecouvrement)} sub={`${fmtMontantInt(patrimoine.loyersEncaissesAnnuels)} encaissés`} color={patrimoine.tauxRecouvrement >= 95 ? '#2d9c6e' : patrimoine.tauxRecouvrement >= 80 ? '#d4860a' : '#c43c2f'} />
              </div>
              <h3>Quittances impayées ({patrimoine.quittancesImpayees.length})</h3>
              {patrimoine.quittancesImpayees.length > 0 ? (
                <table className="rpt-table">
                  <thead><tr><th>N° quittance</th><th>Locataire</th><th>Bien</th><th>Mois</th><th>Statut</th><th className="r">Montant</th></tr></thead>
                  <tbody>
                    {patrimoine.quittancesImpayees.map((q) => {
                      const bail = parc.baux.find((b) => b.id === q.bailId)
                      const loc = bail ? parc.locataires.find((l) => l.id === bail.locataireId) : null
                      const bien = bail ? parc.biens.find((b) => b.id === bail.bienId) : null
                      return (
                        <tr key={q.id}>
                          <td className="mono">{q.numero}</td>
                          <td>{loc?.fullName ?? '—'}</td>
                          <td>{bien?.nom ?? '—'}</td>
                          <td className="mono">{q.mois}</td>
                          <td>{q.statut}</td>
                          <td className="r">{fmtMontantDec(q.total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="rpt-muted">Aucune quittance impayée sur l&apos;exercice.</p>
              )}
            </section>
          )}

          {/* RH / masse salariale */}
          {activeSections.has('rh') && (
            <section className="rpt-section">
              <h2>{num()}. Ressources humaines & masse salariale</h2>
              <p className="rpt-lead">Effectifs, masse salariale et poids sur les recettes de fonctionnement.</p>
              <div className="rpt-kpis">
                <Kpi label="Agents" value={String(rh.nbAgents)} sub="effectif total" />
                <Kpi label="Masse salariale mensuelle" value={fmtMontantInt(rh.masseSalarialeMensuelle)} sub={rh.moisReference ? `réf. ${rh.moisReference}` : 'aucun bulletin'} />
                <Kpi label="Masse salariale annuelle" value={fmtMontantInt(rh.masseSalarialeAnnuelleProjetee)} sub="projection × 12 mois" />
                <Kpi label="MS / RRF" value={fmtPct(rh.ratioMasseSalarialeRRF)} sub="seuil de vigilance : 60 %" color={rh.ratioMasseSalarialeRRF > 70 ? '#c43c2f' : rh.ratioMasseSalarialeRRF > 60 ? '#d4860a' : '#2d9c6e'} />
              </div>
              <h3>Détail par agent (effectifs)</h3>
              <table className="rpt-table">
                <thead><tr><th>Agent</th><th>Poste</th><th>Grade</th><th>Contrat</th><th className="r">Salaire brut</th></tr></thead>
                <tbody>
                  {records.map((r) => {
                    const p = people.find((x) => x.id === r.personId)
                    return (
                      <tr key={r.personId}>
                        <td>{p?.fullName ?? '—'}</td>
                        <td>{p?.poste ?? '—'}</td>
                        <td>{r.grade ?? '—'}</td>
                        <td>{r.contrat ?? '—'}</td>
                        <td className="r">{fmtMontantInt(r.salaireBrut ?? 0)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )}

          {/* Projets d'investissement & dette */}
          {activeSections.has('prj') && (
            <section className="rpt-section">
              <h2>{num()}. Projets d&apos;investissement & dette</h2>
              <p className="rpt-lead">Projets en cours, plan de financement et impact sur la dette.</p>
              {projets.length > 0 ? (
                <table className="rpt-table">
                  <thead><tr><th>Projet</th><th>Période</th><th className="r">Coût total</th><th className="r">Emprunt</th><th className="r">Subventions</th><th className="r">Autofin.</th></tr></thead>
                  <tbody>
                    {projets.map((p) => {
                      const emprunt = p.financements.filter((f) => f.source === 'Emprunt').reduce((acc, f) => acc + f.montant, 0)
                      const subv = p.financements.filter((f) => f.source !== 'Emprunt' && f.source !== 'Autofinancement' && f.source !== 'FCTVA').reduce((acc, f) => acc + f.montant, 0)
                      const autofin = p.financements.filter((f) => f.source === 'Autofinancement').reduce((acc, f) => acc + f.montant, 0)
                      return (
                        <tr key={p.id}>
                          <td>{p.nom}</td>
                          <td className="mono">{p.anneeDebut} → {p.anneeDebut + p.anneesEtalement - 1}</td>
                          <td className="r">{fmtMontantInt(p.coutTotal)}</td>
                          <td className="r">{fmtMontantInt(emprunt)}</td>
                          <td className="r">{fmtMontantInt(subv)}</td>
                          <td className="r">{fmtMontantInt(autofin)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="rpt-muted">Aucun projet d&apos;investissement enregistré.</p>
              )}
            </section>
          )}

          {/* Subventions */}
          {activeSections.has('sub') && (
            <section className="rpt-section">
              <h2>{num()}. Subventions</h2>
              <p className="rpt-lead">Demandes de subvention déposées, accordées, versées.</p>
              {subventions.length > 0 ? (
                <table className="rpt-table">
                  <thead><tr><th>Référence</th><th>Intitulé</th><th>Source</th><th>Statut</th><th className="r">Demandé</th><th className="r">Accordé</th><th className="r">Versé</th></tr></thead>
                  <tbody>
                    {subventions.map((s) => (
                      <tr key={s.id}>
                        <td className="mono">{s.reference}</td>
                        <td>{s.intitule}</td>
                        <td>{s.source}</td>
                        <td>{s.statut}</td>
                        <td className="r">{fmtMontantInt(s.montantDemande)}</td>
                        <td className="r">{s.montantAccorde !== undefined ? fmtMontantInt(s.montantAccorde) : '—'}</td>
                        <td className="r">{s.montantVerse !== undefined ? fmtMontantInt(s.montantVerse) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="rpt-muted">Aucune demande de subvention enregistrée.</p>
              )}
            </section>
          )}

          {/* Projection N+5 */}
          {activeSections.has('pr5') && projection.length > 0 && (
            <section className="rpt-section">
              <h2>{num()}. Projection à 5 ans</h2>
              <p className="rpt-lead">Impact pluriannuel des projets sur la capacité financière.</p>
              <table className="rpt-table">
                <thead><tr><th>Année</th><th className="r">Dépenses équipement</th><th className="r">CAF brute</th><th className="r">Encours dette</th><th className="r">Désendettement</th></tr></thead>
                <tbody>
                  {projection.map((a) => (
                    <tr key={a.annee}>
                      <td className="mono">{a.annee}</td>
                      <td className="r">{fmtMontantInt(a.depEquipement)}</td>
                      <td className="r">{fmtMontantInt(a.cafBrute)}</td>
                      <td className="r">{fmtMontantInt(a.encoursDetteEndAnnee)}</td>
                      <td className="r">{a.capaciteDesendettement.toFixed(1)} ans</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Signature (obligatoire) */}
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
            <span>ENT Mairie de Saint-Fortunat-sur-Eyrieux · Rapport financier {exerciceN}</span>
            <span>{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Sous-composants ───────────────────────────────────────────────

function Kpi({ label, value, sub, color = '#1f2a31' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rpt-kpi">
      <div className="rpt-kpi-lbl">{label}</div>
      <div className="rpt-kpi-val" style={{ color }}>{value}</div>
      {sub && <div className="rpt-kpi-sub">{sub}</div>}
    </div>
  )
}

function Ratio({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rpt-ratio">
      <span className="rpt-ratio-lbl">{label}{hint ? <em> · {hint}</em> : null}</span>
      <span className="rpt-ratio-val">{value}</span>
    </div>
  )
}

function BudgetExecutionTable({ postes }: { postes: ReturnType<typeof useBudget>['postes'] extends infer P ? (P extends Array<infer X> ? Array<X & { consommationTotale: number; pctConsomme: number; reste: number }> : never) : never }) {
  // Agrège par section × sens
  const groupes = useMemo(() => {
    const m = new Map<string, { budget: number; realise: number }>()
    for (const p of postes) {
      const key = `${p.section}|${p.sens}`
      const cur = m.get(key) ?? { budget: 0, realise: 0 }
      cur.budget += p.budgetAlloue
      cur.realise += p.consommationTotale
      m.set(key, cur)
    }
    return Array.from(m.entries()).map(([k, v]) => {
      const [section, sens] = k.split('|')
      return { section, sens, ...v, pct: v.budget > 0 ? (v.realise / v.budget) * 100 : 0 }
    })
  }, [postes])

  return (
    <table className="rpt-table">
      <thead><tr><th>Section</th><th>Sens</th><th className="r">Budget alloué</th><th className="r">Réalisé</th><th className="r">Reste</th><th className="r">% consommé</th></tr></thead>
      <tbody>
        {groupes.map((g, i) => (
          <tr key={i}>
            <td>{g.section === 'fonctionnement' ? 'Fonctionnement' : 'Investissement'}</td>
            <td>{g.sens === 'D' ? 'Dépenses' : 'Recettes'}</td>
            <td className="r">{fmtMontantInt(g.budget)}</td>
            <td className="r">{fmtMontantInt(g.realise)}</td>
            <td className="r">{fmtMontantInt(g.budget - g.realise)}</td>
            <td className="r"><b>{fmtPct(g.pct, 0)}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PostesEnAlerte({ postes }: { postes: ReturnType<typeof useBudget>['postes'] extends infer P ? (P extends Array<infer X> ? Array<X & { consommationTotale: number; pctConsomme: number; reste: number; budgetAlloue: number; label: string; code: string }> : never) : never }) {
  const enAlerte = postes.filter((p) => alertPoste(p.pctConsomme) !== 'ok').sort((a, b) => b.pctConsomme - a.pctConsomme).slice(0, 15)
  if (enAlerte.length === 0) {
    return <p className="rpt-muted">Aucun poste en dépassement (seuil 80 %).</p>
  }
  return (
    <table className="rpt-table">
      <thead><tr><th>Compte</th><th>Libellé</th><th className="r">Budget</th><th className="r">Consommé</th><th className="r">%</th></tr></thead>
      <tbody>
        {enAlerte.map((p) => (
          <tr key={p.code}>
            <td className="mono">{p.code}</td>
            <td>{p.label}</td>
            <td className="r">{fmtMontantInt(p.budgetAlloue)}</td>
            <td className="r">{fmtMontantInt(p.consommationTotale)}</td>
            <td className="r"><b style={{ color: alertPoste(p.pctConsomme) === 'critical' ? '#c43c2f' : '#d4860a' }}>{p.pctConsomme} %</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PluriannuelTable({ lignes, anneeN }: { lignes: ReturnType<typeof computePluriannuel>; anneeN: number }) {
  return (
    <table className="rpt-table">
      <thead>
        <tr>
          <th>Indicateur</th>
          <th className="r">{anneeN - 2}</th>
          <th className="r">{anneeN - 1}</th>
          <th className="r">{anneeN}</th>
          <th className="r">Évol. N-1 → N</th>
        </tr>
      </thead>
      <tbody>
        {lignes.map((l, i) => (
          <tr key={i}>
            <td>{l.label}</td>
            <td className="r">{l.N_2 !== null ? (l.unite === '%' ? fmtPct(l.N_2, 0) : fmtMontantInt(l.N_2)) : '—'}</td>
            <td className="r">{l.N_1 !== null ? (l.unite === '%' ? fmtPct(l.N_1, 0) : fmtMontantInt(l.N_1)) : '—'}</td>
            <td className="r"><b>{l.unite === '%' ? fmtPct(l.N, 0) : fmtMontantInt(l.N)}</b></td>
            <td className="r">{l.evolutionN_1 !== null ? <span style={{ color: l.evolutionN_1 >= 0 ? '#2d9c6e' : '#c43c2f' }}>{l.evolutionN_1 >= 0 ? '+' : ''}{l.evolutionN_1.toFixed(1)} %</span> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Styles (cohérent avec /rapport) ────────────

const REPORT_CSS = `
.rpt-root{--g:#6ab123;--g7:#416d11;--s8:#1f2a31;--s5:#4d5e6c;--sub:#6e8899;--bd:#dde4e9;--bg:#f4f6f1;--terra:#8a4c1e;
  font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--s8);background:var(--bg);min-height:100vh}
.rpt-doc{max-width:900px;margin:0 auto;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.10);}
.rpt-actions{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;justify-content:space-between;
  background:var(--s8);color:#fff;padding:10px 20px}
.rpt-actions-title{font-weight:600;font-size:14px;opacity:.9}
.rpt-btn{font-family:inherit;font-size:13px;font-weight:600;border-radius:8px;padding:8px 14px;cursor:pointer;border:none;text-decoration:none}
.rpt-btn-primary{background:var(--g);color:#fff}
.rpt-btn-ghost{background:rgba(255,255,255,.12);color:#fff}
.rpt-cover{background:radial-gradient(900px 400px at 90% -20%,rgba(106,177,35,.30),transparent 60%),linear-gradient(135deg,#1f2a31,#111820);
  color:#fff;padding:56px 48px}
.rpt-kicker{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#9fd35f;margin-bottom:14px}
.rpt-cover h1{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:40px;line-height:1.08;letter-spacing:-.01em;margin:0 0 10px}
.rpt-cover-sub{font-size:17px;color:rgba(255,255,255,.82);margin:0 0 26px}
.rpt-cover-meta{display:flex;flex-wrap:wrap;gap:8px 26px;font-size:13px;color:rgba(255,255,255,.72)}
.rpt-cover-meta b{color:#fff;font-weight:600}
.rpt-section{padding:30px 48px;border-bottom:1px solid var(--bd)}
.rpt-section h2{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:23px;color:var(--s8);margin:0 0 16px;
  padding-bottom:8px;border-bottom:2px solid var(--g)}
.rpt-section h3{font-size:14px;font-weight:700;color:var(--s8);margin:22px 0 10px;text-transform:uppercase;letter-spacing:.04em}
.rpt-lead{font-size:16px;line-height:1.6;color:var(--s5);margin:0 0 14px}
.rpt-text{font-size:14px;line-height:1.6;color:var(--s5);margin:0 0 10px}
.rpt-muted{font-size:14px;color:var(--sub);font-style:italic;margin:6px 0}
.rpt-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:6px 0 4px}
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
.rpt-ratios{display:grid;grid-template-columns:repeat(2,1fr);gap:8px 24px;margin:6px 0}
.rpt-ratio{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--bd)}
.rpt-ratio-lbl{font-size:13px;color:var(--s5)}
.rpt-ratio-lbl em{color:var(--sub);font-style:normal;font-size:12px}
.rpt-ratio-val{font-size:14px;font-weight:700;color:var(--s8)}
.rpt-attention-list{display:flex;flex-direction:column;gap:8px}
.rpt-attention{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;font-size:13px}
.rpt-attention-warning{background:#fef3e0;border-left:4px solid #d4860a}
.rpt-attention-critical{background:#fde8e6;border-left:4px solid #c43c2f}
.rpt-attention-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:4px;background:rgba(0,0,0,.08)}
.rpt-attention-dom{font-weight:600;color:var(--s8);min-width:90px}
.rpt-attention-msg{color:var(--s5);flex:1}
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
  .rpt-ratios{grid-template-columns:1fr}
  .rpt-section,.rpt-cover,.rpt-foot{padding-left:22px;padding-right:22px}
}
`
