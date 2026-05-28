'use client'

// Rapport de gestion communale — document HTML imprimable, 100% déterministe
// (assemble les vraies données de la base). Reprend le design system de la
// présentation (docs/presentation) : palette vert/slate/terra, titres en serif
// éditorial (Playfair Display → fallback Georgia, auto-hébergé/RGPD), cartes & KPI.
// Page autonome (hors Shell) pour une impression / export PDF propre.

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { useFactures } from '@/hooks/useFactures'
import { useEcritures } from '@/hooks/useEcritures'
import { useProjets, projeterProjet, combinerProjections } from '@/hooks/useProjets'
import { useSubventions } from '@/hooks/useSubventions'
import { useEmployees } from '@/hooks/useEmployees'
import { useHistorique } from '@/hooks/useHistorique'
import { useMeetings } from '@/hooks/useMeetings'
import { useCommissions } from '@/hooks/useCommissions'
import { useDeliberations } from '@/hooks/useDeliberations'
import { useTasks } from '@/hooks/useTasks'
import { useTeam } from '@/hooks/useTeam'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { computeRatios } from '@/lib/ratios'
import type { ProjectionAnnuelle } from '@/lib/types'

// ─── Palette (tokens présentation) ─────────────────────────────────
const T = {
  green: '#6ab123', green700: '#416d11', slate900: '#111820', slate800: '#1f2a31',
  slate500: '#4d5e6c', slate300: '#94aab7', terra: '#c4793a', terra700: '#8a4c1e',
  border: '#dde4e9', bg: '#f4f6f1', surface: '#ffffff', fg: '#1f2a31',
  fgMuted: '#4d5e6c', fgSubtle: '#6e8899', success: '#2d9c6e', warning: '#d4860a',
  danger: '#c4393a', info: '#2563a8',
}

const eur = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
const num = (v: number) => new Intl.NumberFormat('fr-FR').format(v)
const dateLong = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

export default function RapportPage() {
  const { postes, hydrated: budgetHydrated, computePosteWithConsumption } = useBudget()
  const { factures, hydrated: facHydrated } = useFactures()
  const { ecritures } = useEcritures()
  const { projets } = useProjets()
  const { subventions } = useSubventions()
  const { records } = useEmployees()
  const { exercices } = useHistorique()
  const { meetings } = useMeetings()
  const { commissions } = useCommissions()
  const { deliberations } = useDeliberations()
  const { tasks } = useTasks()
  const { people, hydrated: teamHydrated } = useTeam()
  const { currentUser } = useCurrentUser()

  // Population & encours dette saisis dans le module Finances (localStorage).
  const [population, setPopulation] = useState(900)
  const [encoursDette, setEncoursDette] = useState(0)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('ent-mairie:ratios-cfg:v1')
      if (raw) {
        const p = JSON.parse(raw)
        if (typeof p.population === 'number') setPopulation(p.population)
        if (typeof p.encoursDette === 'number') setEncoursDette(p.encoursDette)
      }
    } catch {}
  }, [])

  const enriched = useMemo(
    () => postes.map(p => computePosteWithConsumption(p, factures, ecritures)),
    [postes, factures, ecritures, computePosteWithConsumption],
  )
  const ratios = useMemo(
    () => computeRatios(enriched, population, encoursDette || undefined),
    [enriched, population, encoursDette],
  )

  const budget = useMemo(() => {
    const a = { fRecVote: 0, fRecReal: 0, fDepVote: 0, fDepReal: 0, iRecVote: 0, iRecReal: 0, iDepVote: 0, iDepReal: 0 }
    enriched.forEach(p => {
      const vote = p.budgetAlloue, real = p.consommationTotale
      if (p.section === 'fonctionnement') {
        if (p.sens === 'R') { a.fRecVote += vote; a.fRecReal += real } else { a.fDepVote += vote; a.fDepReal += real }
      } else {
        if (p.sens === 'R') { a.iRecVote += vote; a.iRecReal += real } else { a.iDepVote += vote; a.iDepReal += real }
      }
    })
    return a
  }, [enriched])

  const postesEnAlerte = useMemo(
    () => enriched.filter(p => p.enAlerte).sort((x, y) => y.pctConsomme - x.pctConsomme),
    [enriched],
  )

  const today = new Date().toISOString().slice(0, 10)
  const facEnAttente = factures.filter(f => f.statut === 'En attente validation')
  // « Imputées » = validées ou payées (les deux ont passé la validation budgétaire)
  const facValidees = factures.filter(f => f.statut === 'Validée' || f.statut === 'Payée')
  const facEnAttenteMontant = facEnAttente.reduce((s, f) => s + f.montantTTC, 0)
  const facValideesMontant = facValidees.reduce((s, f) => s + f.montantTTC, 0)

  const masseMensuelle = records.reduce((s, r) => s + r.salaireBrut + (r.primes ?? 0) + (r.ifse ?? 0), 0)
  const masseAnnuelle = masseMensuelle * 12

  const projection = useMemo<ProjectionAnnuelle[]>(() => {
    if (projets.length === 0) return []
    return combinerProjections(projets.map(p => projeterProjet(p, ratios, 5)))
  }, [projets, ratios])

  const subTotDemande = subventions.reduce((s, x) => s + x.montantDemande, 0)
  const subTotAccorde = subventions.reduce((s, x) => s + (x.montantAccorde ?? 0), 0)
  const subTotVerse = subventions.reduce((s, x) => s + (x.montantVerse ?? 0), 0)

  const commName = (id?: string) => commissions.find(c => c.id === id)?.name ?? 'Commission'
  const upcoming = [...meetings].filter(m => m.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8)
  const recentDelibs = [...deliberations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const histSorted = [...exercices].sort((a, b) => a.exercice - b.exercice)

  const activeTasks = tasks.filter(t => t.status !== 'Terminé')
  const lateTasks = activeTasks.filter(t => !!t.dueDate && t.dueDate < today)

  const elus = people.filter(p => p.active && p.role !== 'agent')
  const agents = people.filter(p => p.active && p.role === 'agent')
  const maire = people.find(p => p.role === 'maire')

  const ready = budgetHydrated && facHydrated && teamHydrated

  const totalRecettes = budget.fRecReal
  const totalDepenses = budget.fDepReal
  const sante: { label: string; color: string } =
    ratios.capaciteDesendettement > 0 && ratios.capaciteDesendettement <= 8 && ratios.tauxEpargneBrute >= 8
      ? { label: 'saine', color: T.success }
      : ratios.tauxEpargneBrute >= 5
        ? { label: 'à surveiller', color: T.warning }
        : { label: 'sous tension', color: T.danger }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: "'DM Sans', sans-serif", color: T.fgSubtle }}>
        Préparation du rapport…
      </div>
    )
  }

  return (
    <div className="rpt-root">
      <style>{REPORT_CSS}</style>

      {/* Barre d'actions — masquée à l'impression */}
      <div className="rpt-actions">
        <Link href="/dashboard" className="rpt-btn rpt-btn-ghost">← Retour</Link>
        <span className="rpt-actions-title">Rapport de gestion communale</span>
        <button onClick={() => window.print()} className="rpt-btn rpt-btn-primary">Imprimer / Exporter en PDF</button>
      </div>

      <div className="rpt-doc">
        {/* ─── Couverture ─── */}
        <header className="rpt-cover">
          <div className="rpt-kicker">Commune de Saint-Fortunat-sur-Eyrieux · Ardèche</div>
          <h1>Rapport de gestion communale</h1>
          <p className="rpt-cover-sub">État de pilotage global — exercice {new Date().getFullYear()}</p>
          <div className="rpt-cover-meta">
            <span>Édité le <b>{dateLong(today)}</b></span>
            {currentUser && <span>Par <b>{currentUser.prenom} {currentUser.nom}</b> · {currentUser.poste}</span>}
            <span>Population : <b>{num(population)} hab.</b></span>
          </div>
        </header>

        {/* ─── Propos liminaire ─── */}
        <section className="rpt-section">
          <h2>Propos liminaire</h2>
          <p className="rpt-lead">
            Saint-Fortunat-sur-Eyrieux est une commune rurale de l&apos;Ardèche d&apos;environ {num(population)} habitants.
            Le présent rapport dresse un état complet de la gestion communale à des fins de pilotage interne :
            situation financière, grands projets d&apos;investissement, ressources humaines, vie institutionnelle
            et perspectives pluriannuelles.
          </p>
          <p className="rpt-text">
            Le conseil municipal compte <b>{elus.length} élus</b>{maire ? <> sous l&apos;autorité du maire, <b>{maire.prenom} {maire.nom}</b></> : null},
            appuyés par <b>{agents.length} agents</b> municipaux. L&apos;activité s&apos;organise autour de <b>{commissions.filter(c => c.id !== 'conseil-municipal').length} commissions</b> thématiques.
            La santé financière de la commune est jugée <b style={{ color: sante.color }}>{sante.label}</b> au regard
            de la capacité d&apos;épargne et du niveau d&apos;endettement (détaillés ci-après).
          </p>
        </section>

        {/* ─── Synthèse / chiffres clés ─── */}
        <section className="rpt-section">
          <h2>Chiffres clés</h2>
          <div className="rpt-kpis">
            <Kpi label="Recettes de fonctionnement" value={eur(totalRecettes)} sub="réalisé" />
            <Kpi label="Dépenses de fonctionnement" value={eur(totalDepenses)} sub="réalisé" />
            <Kpi label="CAF brute" value={eur(ratios.cafBrute)} sub={`épargne ${ratios.tauxEpargneBrute} %`} color={ratios.cafBrute >= 0 ? T.green700 : T.danger} />
            <Kpi label="Capacité de désendettement" value={`${ratios.capaciteDesendettement} ans`} sub={ratios.capaciteDesendettement <= 8 ? 'seuil < 8 ans' : 'au-delà du seuil'} color={ratios.capaciteDesendettement <= 8 ? T.green700 : T.danger} />
            <Kpi label="Encours de dette" value={eur(ratios.encoursDette)} sub={`${ratios.ratio11_detteSurRrf} % des RRF`} color={T.terra700} />
            <Kpi label="Masse salariale" value={eur(masseAnnuelle)} sub="annuelle (brut chargé estimé)" color={T.slate800} />
            <Kpi label="Tâches actives" value={num(activeTasks.length)} sub={lateTasks.length > 0 ? `${lateTasks.length} en retard` : 'aucune en retard'} color={lateTasks.length > 0 ? T.danger : T.slate800} />
            <Kpi label="Factures à valider" value={num(facEnAttente.length)} sub={eur(facEnAttenteMontant)} color={facEnAttente.length > 0 ? T.warning : T.slate800} />
          </div>
        </section>

        {/* ─── Gestion financière ─── */}
        <section className="rpt-section">
          <h2>Gestion financière</h2>

          <h3>Équilibre budgétaire</h3>
          <table className="rpt-table">
            <thead>
              <tr><th>Section</th><th className="r">Recettes (réalisé)</th><th className="r">Dépenses (réalisé)</th><th className="r">Solde</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Fonctionnement</td>
                <td className="r">{eur(budget.fRecReal)}</td>
                <td className="r">{eur(budget.fDepReal)}</td>
                <td className="r" style={{ color: budget.fRecReal - budget.fDepReal >= 0 ? T.success : T.danger, fontWeight: 700 }}>{eur(budget.fRecReal - budget.fDepReal)}</td>
              </tr>
              <tr>
                <td>Investissement</td>
                <td className="r">{eur(budget.iRecReal)}</td>
                <td className="r">{eur(budget.iDepReal)}</td>
                <td className="r" style={{ color: budget.iRecReal - budget.iDepReal >= 0 ? T.success : T.danger, fontWeight: 700 }}>{eur(budget.iRecReal - budget.iDepReal)}</td>
              </tr>
            </tbody>
          </table>

          <h3>Indicateurs financiers (R. 2313-1 & DGFiP)</h3>
          <div className="rpt-ratios">
            <Ratio label="CAF brute" value={eur(ratios.cafBrute)} />
            <Ratio label="CAF nette" value={eur(ratios.cafNette)} />
            <Ratio label="Taux d'épargne brute" value={`${ratios.tauxEpargneBrute} %`} hint="≥ 8 % sain" />
            <Ratio label="Capacité de désendettement" value={`${ratios.capaciteDesendettement} ans`} hint="< 8 ans sain" />
            <Ratio label="DRF / habitant" value={eur(ratios.ratio1_drfParHab)} />
            <Ratio label="RRF" value={eur(ratios.rrf)} />
            <Ratio label="DRF" value={eur(ratios.drf)} />
            <Ratio label="Dette / RRF" value={`${ratios.ratio11_detteSurRrf} %`} />
          </div>

          <h3>Postes budgétaires sous tension {postesEnAlerte.length > 0 ? `(${postesEnAlerte.length})` : ''}</h3>
          {postesEnAlerte.length === 0 ? (
            <p className="rpt-muted">Aucun poste au-delà de 80 % de consommation. Le budget est maîtrisé.</p>
          ) : (
            <table className="rpt-table">
              <thead><tr><th>Compte</th><th>Libellé</th><th className="r">Alloué</th><th className="r">Réalisé</th><th className="r">%</th></tr></thead>
              <tbody>
                {postesEnAlerte.slice(0, 10).map(p => (
                  <tr key={p.code}>
                    <td className="mono">{p.code}</td>
                    <td>{p.label}</td>
                    <td className="r">{eur(p.budgetAlloue)}</td>
                    <td className="r">{eur(p.consommationTotale)}</td>
                    <td className="r" style={{ color: p.pctConsomme > 100 ? T.danger : T.warning, fontWeight: 700 }}>{p.pctConsomme} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Factures</h3>
          <p className="rpt-text">
            <b>{facEnAttente.length}</b> facture(s) en attente de validation pour <b>{eur(facEnAttenteMontant)}</b>,
            et <b>{facValidees.length}</b> facture(s) validée(s) imputées au budget pour <b>{eur(facValideesMontant)}</b>.
          </p>
        </section>

        {/* ─── Grands projets & subventions ─── */}
        <section className="rpt-section">
          <h2>Grands projets d&apos;investissement</h2>
          {projets.length === 0 ? (
            <p className="rpt-muted">Aucun projet d&apos;investissement enregistré.</p>
          ) : (
            <table className="rpt-table">
              <thead><tr><th>Projet</th><th className="r">Coût total</th><th className="r">Début</th><th className="r">Étalement</th></tr></thead>
              <tbody>
                {projets.map(p => (
                  <tr key={p.id}>
                    <td>{p.nom}</td>
                    <td className="r">{eur(p.coutTotal)}</td>
                    <td className="r">{p.anneeDebut}</td>
                    <td className="r">{p.anneesEtalement} an(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Subventions</h3>
          {subventions.length === 0 ? (
            <p className="rpt-muted">Aucune demande de subvention en suivi.</p>
          ) : (
            <>
              <div className="rpt-kpis">
                <Kpi label="Sollicité" value={eur(subTotDemande)} />
                <Kpi label="Accordé" value={eur(subTotAccorde)} color={T.success} />
                <Kpi label="Versé" value={eur(subTotVerse)} color={T.green700} />
              </div>
              <table className="rpt-table">
                <thead><tr><th>Intitulé</th><th>Financeur</th><th>Statut</th><th className="r">Demandé</th><th className="r">Accordé</th></tr></thead>
                <tbody>
                  {subventions.map(s => (
                    <tr key={s.id}>
                      <td>{s.intitule}</td>
                      <td>{s.organisme}</td>
                      <td>{s.statut}</td>
                      <td className="r">{eur(s.montantDemande)}</td>
                      <td className="r">{s.montantAccorde != null ? eur(s.montantAccorde) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        {/* ─── Projection pluriannuelle ─── */}
        {projection.length > 0 && (
          <section className="rpt-section">
            <h2>Projection pluriannuelle (impact des projets)</h2>
            <p className="rpt-text">
              Trajectoire estimée sur 5 ans à partir de la situation actuelle, intégrant les dépenses
              d&apos;équipement, les financements (emprunts, subventions, FCTVA) et leur effet sur la CAF et la dette.
            </p>
            <table className="rpt-table">
              <thead><tr><th>Année</th><th className="r">CAF brute</th><th className="r">Encours dette</th><th className="r">Désendettement</th></tr></thead>
              <tbody>
                {projection.map(a => (
                  <tr key={a.annee}>
                    <td>{a.annee}</td>
                    <td className="r">{eur(a.cafBrute)}</td>
                    <td className="r">{eur(a.encoursDetteEndAnnee)}</td>
                    <td className="r" style={{ color: a.capaciteDesendettement > 8 ? T.danger : T.success, fontWeight: 700 }}>{a.capaciteDesendettement} ans</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ─── Rappel pluriannuel (historique) ─── */}
        {histSorted.length > 0 && (
          <section className="rpt-section">
            <h2>Rappel pluriannuel</h2>
            <table className="rpt-table">
              <thead><tr><th>Exercice</th><th className="r">RRF</th><th className="r">DRF</th><th className="r">CAF brute</th><th className="r">Encours dette</th></tr></thead>
              <tbody>
                {histSorted.map(e => (
                  <tr key={e.id}>
                    <td>{e.exercice}</td>
                    <td className="r">{eur(e.rrf)}</td>
                    <td className="r">{eur(e.drf)}</td>
                    <td className="r">{eur(e.rrf - e.drf)}</td>
                    <td className="r">{eur(e.encoursDette)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ─── Ressources humaines ─── */}
        <section className="rpt-section">
          <h2>Ressources humaines</h2>
          <div className="rpt-kpis">
            <Kpi label="Agents municipaux" value={num(agents.length)} />
            <Kpi label="Masse salariale mensuelle" value={eur(masseMensuelle)} sub="brut chargé estimé" />
            <Kpi label="Masse salariale annuelle" value={eur(masseAnnuelle)} color={T.slate800} />
            <Kpi label="Part dans les DRF" value={`${ratios.drf > 0 ? Math.round((masseAnnuelle / ratios.drf) * 100) : 0} %`} />
          </div>
        </section>

        {/* ─── Vie institutionnelle ─── */}
        <section className="rpt-section">
          <h2>Vie institutionnelle</h2>

          <h3>Prochaines réunions</h3>
          {upcoming.length === 0 ? (
            <p className="rpt-muted">Aucune réunion planifiée à venir.</p>
          ) : (
            <table className="rpt-table">
              <thead><tr><th>Date</th><th>Instance</th><th>Objet</th><th>Lieu</th></tr></thead>
              <tbody>
                {upcoming.map(m => (
                  <tr key={m.id}>
                    <td>{dateLong(m.date)}{m.heure ? ` · ${m.heure}` : ''}</td>
                    <td>{commName(m.commissionId)}</td>
                    <td>{m.titre ?? '—'}</td>
                    <td>{m.lieu ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Délibérations récentes du conseil municipal</h3>
          {recentDelibs.length === 0 ? (
            <p className="rpt-muted">Aucune délibération enregistrée.</p>
          ) : (
            <table className="rpt-table">
              <thead><tr><th>N°</th><th>Date</th><th>Objet</th><th>Statut</th><th className="r">Vote (P/C/A)</th></tr></thead>
              <tbody>
                {recentDelibs.map(d => (
                  <tr key={d.id}>
                    <td className="mono">{d.numero}</td>
                    <td>{dateLong(d.date)}</td>
                    <td>{d.objet}</td>
                    <td>{d.statut}</td>
                    <td className="r">{d.votePour}/{d.voteContre}/{d.voteAbstention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Commissions</h3>
          <table className="rpt-table">
            <thead><tr><th>Commission</th><th className="r">Tâches actives</th><th className="r">Membres</th></tr></thead>
            <tbody>
              {commissions.filter(c => c.id !== 'conseil-municipal').map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="r">{c.tasks}</td>
                  <td className="r">{c.members}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="rpt-foot">
          <span>Mairie de Saint-Fortunat-sur-Eyrieux — document interne de pilotage</span>
          <span>Généré automatiquement le {dateLong(today)} · données issues de l&apos;ENT</span>
        </footer>
      </div>
    </div>
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

// ─── Styles (design system présentation, scoping .rpt-*) ────────────

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
