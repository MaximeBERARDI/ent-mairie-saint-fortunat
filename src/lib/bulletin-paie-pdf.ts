// Génération d'un bulletin de paie imprimable au format fonction publique.
// Ouvre une nouvelle fenêtre avec le HTML mis en forme et déclenche
// l'impression. L'utilisateur peut "Enregistrer en PDF" depuis la
// boîte de dialogue d'impression de son navigateur.

import type { BulletinPaie } from './types'

const fmtMontant = (v: number | undefined) => {
  if (v == null) return ''
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

const fmtTaux = (v: number | undefined) => {
  if (v == null) return ''
  return `${v.toFixed(2)}%`
}

const fmtMois = (mois: string) => {
  const [y, m] = mois.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function debutDuMois(mois: string): string {
  return fmtDate(`${mois}-01`)
}

function finDuMois(mois: string): string {
  const [y, m] = mois.split('-').map(Number)
  const d = new Date(y, m, 0)
  return fmtDate(d.toISOString().slice(0, 10))
}

export function buildBulletinPaieHtml(bulletin: BulletinPaie): string {
  const s = bulletin.snapshot
  const remunerations = bulletin.lignes.filter(l => l.category === 'remuneration')
  const cotSalariales = bulletin.lignes.filter(l => l.category === 'cotisation-salariale')
  const cotPatronales = bulletin.lignes.filter(l => l.category === 'cotisation-patronale')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Bulletin de paie ${escape(bulletin.numero)} — ${escape(s.fullName)}</title>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm; }
  body {
    font-family: 'Arial', 'Helvetica', sans-serif;
    font-size: 9pt;
    color: #1a1a1a;
    line-height: 1.35;
    margin: 0;
  }
  .actions {
    position: fixed;
    top: 12px; right: 12px;
    display: flex; gap: 8px;
    z-index: 100;
  }
  .actions button {
    padding: 8px 14px;
    border-radius: 6px;
    border: 1px solid #ccc;
    background: #fff;
    cursor: pointer;
    font-family: system-ui;
    font-size: 12px;
  }
  .actions button.primary {
    background: #6ab123;
    color: #fff;
    border-color: #6ab123;
  }
  @media print {
    .no-print { display: none !important; }
  }

  .titre-doc {
    text-align: center;
    margin-bottom: 8px;
  }
  .titre-doc h1 {
    margin: 0;
    font-size: 13pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .titre-doc .periode {
    font-size: 10pt;
    color: #555;
    margin-top: 2px;
  }

  .header-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid #1a1a1a;
    margin-bottom: 6px;
  }
  .header-grid > div {
    padding: 8px 10px;
    border-right: 1px solid #1a1a1a;
  }
  .header-grid > div:last-child { border-right: none; }
  .header-grid h2 {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 4px;
    color: #555;
  }
  .header-grid p { margin: 1px 0; font-size: 9pt; }
  .header-grid .name { font-weight: 700; font-size: 10pt; }

  .info-bar {
    border: 1px solid #1a1a1a;
    border-top: none;
    padding: 4px 10px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
  }
  .info-bar > div { flex: 1; }
  .info-bar .label { color: #888; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-bar .value { font-weight: 600; }

  .tableau {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
  }
  .tableau th {
    background: #2c4a3a;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 5px 8px;
    font-size: 8pt;
    font-weight: 600;
    text-align: left;
    border: 1px solid #1a1a1a;
  }
  .tableau td {
    padding: 3px 8px;
    border: 1px solid #d0d0d0;
    font-size: 8.5pt;
  }
  .tableau td.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .tableau td.lib { width: 38%; }
  .tableau td.center { text-align: center; }

  .tableau tr.section-title td {
    background: #f5f5f0;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #2c4a3a;
    border-top: 2px solid #2c4a3a;
    font-size: 8.5pt;
    padding: 5px 8px;
  }

  .tableau tr.total td {
    background: #f5f5f0;
    font-weight: 700;
    border-top: 1px solid #1a1a1a;
  }

  .tableau tr.net-payer td {
    background: #2c4a3a;
    color: #fff;
    font-weight: 700;
    font-size: 10pt;
    padding: 7px 8px;
  }

  .footer {
    margin-top: 12px;
    border-top: 1px solid #888;
    padding-top: 6px;
    font-size: 7.5pt;
    color: #666;
    line-height: 1.5;
  }
  .footer .legal {
    text-align: center;
    margin-top: 4px;
    font-style: italic;
    color: #888;
  }

  .signature {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
    font-size: 9pt;
  }
  .signature .bloc {
    width: 200px;
    text-align: center;
  }
  .signature .ligne {
    margin-top: 40px;
    border-top: 1px solid #1a1a1a;
    padding-top: 4px;
    font-style: italic;
    font-size: 8pt;
  }
</style>
</head>
<body>
  <div class="actions no-print">
    <button onclick="window.close()">Fermer</button>
    <button class="primary" onclick="window.print()">🖨 Imprimer / PDF</button>
  </div>

  <div class="titre-doc">
    <h1>Bulletin de paie</h1>
    <div class="periode">Période du ${escape(debutDuMois(bulletin.mois))} au ${escape(finDuMois(bulletin.mois))}</div>
  </div>

  <div class="header-grid">
    <div>
      <h2>Employeur</h2>
      <p class="name">${escape(s.employeurNom)}</p>
      <p>${escape(s.employeurAdresse)}</p>
      ${s.employeurSiret ? `<p>SIRET : ${escape(s.employeurSiret)}</p>` : ''}
    </div>
    <div>
      <h2>Salarié</h2>
      <p class="name">${escape(s.fullName)}</p>
      <p>${escape(s.poste)}</p>
      ${s.grade ? `<p>${escape(s.grade)}${s.cadre ? ` — Catégorie ${s.cadre}` : ''}${s.echelon != null ? ` — Échelon ${s.echelon}` : ''}</p>` : s.cadre ? `<p>Catégorie ${escape(s.cadre)}</p>` : ''}
    </div>
  </div>

  <div class="info-bar">
    <div><span class="label">Matricule</span><br /><span class="value">${escape(s.numAgent)}</span></div>
    <div><span class="label">Contrat</span><br /><span class="value">${escape(s.contrat)}</span></div>
    <div><span class="label">Temps de travail</span><br /><span class="value">${s.tempsTravailHeures}h hebdo</span></div>
    <div><span class="label">Date d'entrée</span><br /><span class="value">${escape(fmtDate(s.dateEmbauche))}</span></div>
    <div><span class="label">N° bulletin</span><br /><span class="value">${escape(bulletin.numero)}</span></div>
  </div>

  <table class="tableau">
    <thead>
      <tr>
        <th>Libellé</th>
        <th style="text-align:right;">Base (€)</th>
        <th style="text-align:right;">Taux</th>
        <th style="text-align:right;">À payer (€)</th>
        <th style="text-align:right;">À déduire (€)</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section-title"><td colspan="5">A — Rémunérations brutes</td></tr>
      ${remunerations.map(l => `
        <tr>
          <td class="lib">${escape(l.libelle)}</td>
          <td class="num">${l.base != null ? fmtMontant(l.base) : ''}</td>
          <td class="num">${l.taux != null ? fmtTaux(l.taux) : ''}</td>
          <td class="num">${fmtMontant(l.aPayer)}</td>
          <td></td>
        </tr>`).join('')}
      <tr class="total">
        <td class="lib">Brut total</td>
        <td class="num"></td>
        <td class="num"></td>
        <td class="num">${fmtMontant(bulletin.brutTotal)}</td>
        <td></td>
      </tr>

      <tr class="section-title"><td colspan="5">B — Cotisations &amp; contributions salariales</td></tr>
      ${cotSalariales.map(l => `
        <tr>
          <td class="lib">${escape(l.libelle)}</td>
          <td class="num">${l.base != null ? fmtMontant(l.base) : ''}</td>
          <td class="num">${l.taux != null ? fmtTaux(l.taux) : ''}</td>
          <td></td>
          <td class="num">${fmtMontant(l.aDeduire)}</td>
        </tr>`).join('')}
      <tr class="total">
        <td class="lib">Total cotisations salariales</td>
        <td class="num"></td>
        <td class="num"></td>
        <td></td>
        <td class="num">${fmtMontant(bulletin.cotisationsSalariales)}</td>
      </tr>

      <tr class="total">
        <td class="lib">Net imposable</td>
        <td class="num"></td>
        <td class="num"></td>
        <td class="num">${fmtMontant(bulletin.netImposable)}</td>
        <td></td>
      </tr>
      <tr class="net-payer">
        <td class="lib">NET À PAYER AVANT IMPÔT</td>
        <td class="num"></td>
        <td class="num"></td>
        <td class="num">${fmtMontant(bulletin.netAPayer)} €</td>
        <td></td>
      </tr>

      <tr class="section-title"><td colspan="5">C — Cotisations patronales (information)</td></tr>
      ${cotPatronales.map(l => `
        <tr style="color:#666;">
          <td class="lib">${escape(l.libelle)}</td>
          <td class="num">${l.base != null ? fmtMontant(l.base) : ''}</td>
          <td class="num">${l.taux != null ? fmtTaux(l.taux) : ''}</td>
          <td></td>
          <td class="num">${fmtMontant(l.aDeduire)}</td>
        </tr>`).join('')}
      <tr class="total">
        <td class="lib">Total cotisations patronales</td>
        <td class="num"></td>
        <td class="num"></td>
        <td></td>
        <td class="num">${fmtMontant(bulletin.cotisationsPatronales)}</td>
      </tr>
      <tr class="total">
        <td class="lib">Coût total employeur</td>
        <td class="num"></td>
        <td class="num"></td>
        <td class="num">${fmtMontant(bulletin.coutEmployeur)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="signature">
    <div class="bloc">
      <p>Le ${escape(fmtDate(bulletin.emisAt))}</p>
      <p class="ligne">Signature et cachet de l'employeur</p>
    </div>
  </div>

  <div class="footer">
    <p>
      <strong>Mentions légales :</strong> Bulletin établi conformément aux dispositions du Code général
      de la fonction publique. Conservation recommandée sans limitation de durée.
      Les cotisations sociales servent au financement de la protection sociale (santé, retraite,
      famille, chômage). Pour plus d'informations : <em>service-public.fr</em>.
    </p>
    <p class="legal">
      Document à conserver sans limitation de durée — N° bulletin : ${escape(bulletin.numero)}
    </p>
  </div>
</body>
</html>`
}

/** Ouvre le bulletin dans un nouvel onglet pour aperçu / impression. */
export function openBulletinPreview(bulletin: BulletinPaie) {
  const html = buildBulletinPaieHtml(bulletin)
  const win = window.open('', '_blank', 'width=900,height=1100')
  if (!win) {
    alert("Veuillez autoriser les fenêtres pop-up pour générer le bulletin.")
    return
  }
  win.document.write(html)
  win.document.close()
}

/** Construit un mailto: pré-rempli pour envoyer le bulletin à l'agent. */
export function buildBulletinMailto(bulletin: BulletinPaie, email: string): string {
  const sujet = `Bulletin de paie ${fmtMois(bulletin.mois)} — ${bulletin.snapshot.fullName}`
  const corps = `Bonjour,

Veuillez trouver ci-joint votre bulletin de paie du mois de ${fmtMois(bulletin.mois)}.

Récapitulatif :
- Brut : ${fmtMontant(bulletin.brutTotal)} €
- Cotisations salariales : ${fmtMontant(bulletin.cotisationsSalariales)} €
- Net imposable : ${fmtMontant(bulletin.netImposable)} €
- Net à payer avant impôt : ${fmtMontant(bulletin.netAPayer)} €

Conservation recommandée sans limitation de durée.

Cordialement,

${bulletin.snapshot.employeurNom}`

  return `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
}
