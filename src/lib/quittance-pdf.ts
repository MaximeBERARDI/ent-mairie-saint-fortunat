// Génération d'une quittance de loyer imprimable (PDF via window.print()).
// Ouvre une nouvelle fenêtre avec le HTML mis en forme et déclenche
// l'impression. L'utilisateur peut "Enregistrer en PDF" depuis la
// boîte de dialogue d'impression de son navigateur.

import type { Quittance, Bail, BienImmobilier, Locataire } from './types'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const fmtMois = (mois: string) => {
  const [y, m] = mois.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// Convertit un montant numérique en lettres (français, simplifié pour la démo).
function numberToLettersFr(n: number): string {
  // Pour un MVP, on se contente de retourner le format chiffré.
  // Une vraie implémentation utilise une lib (write-fr-numbers).
  return fmtMontant(n)
}

interface QuittanceContext {
  quittance: Quittance
  bail: Bail
  bien: BienImmobilier
  locataire: Locataire
  emetteur: {
    nom: string                 // ex: 'Mairie de Saint-Fortunat-sur-Eyrieux'
    adresse: string             // ex: 'Place de la Mairie, 07360...'
    siret?: string
    email?: string
  }
}

const DEFAULT_EMETTEUR = {
  nom: 'Mairie de Saint-Fortunat-sur-Eyrieux',
  adresse: 'Place de la Mairie, 07360 Saint-Fortunat-sur-Eyrieux',
  email: 'mairie@saint-fortunat.fr',
}

/** Construit le HTML complet (avec styles inline) d'une quittance de loyer. */
export function buildQuittanceHtml(ctx: QuittanceContext): string {
  const { quittance, bail, bien, locataire, emetteur } = ctx
  const totalLettres = numberToLettersFr(quittance.total)
  const datePaiement = quittance.payeeAt ? fmtDate(quittance.payeeAt) : '___ / ___ / ____'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Quittance ${quittance.numero}</title>
<style>
  @page { size: A4; margin: 24mm; }
  body {
    font-family: 'Times New Roman', Georgia, serif;
    font-size: 12pt;
    color: #1a1a1a;
    line-height: 1.5;
    margin: 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 2px solid #1a1a1a;
  }
  .header .emetteur {
    width: 50%;
  }
  .header .destinataire {
    width: 45%;
    text-align: right;
  }
  .header h1 {
    margin: 0 0 8px;
    font-size: 13pt;
    font-weight: 700;
  }
  .header p {
    margin: 2px 0;
    font-size: 10pt;
  }
  .titre {
    text-align: center;
    margin: 24px 0 32px;
  }
  .titre h2 {
    font-size: 18pt;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0 0 4px;
  }
  .titre .periode {
    font-size: 13pt;
    text-transform: capitalize;
    color: #555;
  }
  .corps {
    margin-bottom: 28px;
  }
  .corps p {
    margin: 12px 0;
    text-align: justify;
  }
  .corps strong { font-weight: 700; }
  .montant-bloc {
    margin: 20px 0 24px;
    padding: 14px 18px;
    border: 1px solid #1a1a1a;
    background: #f5f5f0;
  }
  .montant-bloc table {
    width: 100%;
    border-collapse: collapse;
  }
  .montant-bloc td {
    padding: 4px 0;
    font-size: 12pt;
  }
  .montant-bloc td:first-child { font-style: italic; }
  .montant-bloc td:last-child { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  .montant-bloc tr.total td {
    border-top: 1px solid #1a1a1a;
    padding-top: 8px;
    margin-top: 8px;
    font-size: 13pt;
    font-weight: 700;
  }
  .signature {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    font-size: 11pt;
  }
  .signature .lieu-date { width: 48%; }
  .signature .signature-bloc {
    width: 48%;
    text-align: center;
  }
  .signature-bloc .ligne {
    margin-top: 60px;
    border-top: 1px solid #1a1a1a;
    padding-top: 4px;
    font-size: 10pt;
    font-style: italic;
  }
  .footer {
    position: fixed;
    bottom: 12mm;
    left: 24mm;
    right: 24mm;
    text-align: center;
    font-size: 9pt;
    color: #888;
    padding-top: 8px;
    border-top: 1px solid #ddd;
  }
  @media print {
    .no-print { display: none; }
  }
  .actions {
    position: fixed;
    top: 12px; right: 12px;
    display: flex; gap: 8px;
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
</style>
</head>
<body>
  <div class="actions no-print">
    <button onclick="window.close()">Fermer</button>
    <button class="primary" onclick="window.print()">🖨 Imprimer / PDF</button>
  </div>

  <div class="header">
    <div class="emetteur">
      <h1>${escape(emetteur.nom)}</h1>
      <p>${escape(emetteur.adresse)}</p>
      ${emetteur.siret ? `<p>SIRET : ${escape(emetteur.siret)}</p>` : ''}
      ${emetteur.email ? `<p>${escape(emetteur.email)}</p>` : ''}
    </div>
    <div class="destinataire">
      <h1>${escape(locataire.fullName)}</h1>
      <p>${escape(bail.bienId === bien.id ? bien.adresse : (locataire.adresseFacturation ?? bien.adresse))}</p>
      ${locataire.email ? `<p>${escape(locataire.email)}</p>` : ''}
    </div>
  </div>

  <div class="titre">
    <h2>Quittance de loyer</h2>
    <p class="periode">Période : ${fmtMois(quittance.mois)}</p>
    <p style="font-size: 10pt; color:#888; margin-top:4px;">N° ${escape(quittance.numero)}</p>
  </div>

  <div class="corps">
    <p>
      Je soussigné(e), représentant la <strong>${escape(emetteur.nom)}</strong>, propriétaire du logement
      désigné ci-dessous, déclare avoir reçu de <strong>${escape(locataire.fullName)}</strong> la somme de
      <strong>${escape(totalLettres)}</strong>, au titre du loyer et des charges du
      logement qu'il/elle occupe au <strong>${escape(bien.adresse)}</strong>
      pour la période du <strong>${escape(fmtMois(quittance.mois))}</strong> et lui en donne quittance,
      sous réserve de tous mes droits.
    </p>
  </div>

  <div class="montant-bloc">
    <table>
      <tr><td>Loyer hors charges</td><td>${escape(fmtMontant(quittance.loyerHC))}</td></tr>
      <tr><td>Provisions sur charges</td><td>${escape(fmtMontant(quittance.charges))}</td></tr>
      <tr class="total"><td>TOTAL ENCAISSÉ</td><td>${escape(fmtMontant(quittance.total))}</td></tr>
    </table>
    ${quittance.modeReglement ? `<p style="margin: 8px 0 0; font-size: 10pt; color:#555;">Mode de règlement : ${escape(quittance.modeReglement)}</p>` : ''}
    ${quittance.payeeAt ? `<p style="margin: 4px 0 0; font-size: 10pt; color:#555;">Paiement reçu le ${escape(datePaiement)}</p>` : ''}
  </div>

  <div class="signature">
    <div class="lieu-date">
      <p>Fait à <strong>Saint-Fortunat-sur-Eyrieux</strong>,</p>
      <p>Le ${escape(quittance.payeeAt ? datePaiement : fmtDate(new Date().toISOString()))}</p>
    </div>
    <div class="signature-bloc">
      <p>Le bailleur,</p>
      <p class="ligne">Signature et cachet</p>
    </div>
  </div>

  <div class="footer">
    Cette quittance annule et remplace tous reçus précédents pour la même période. À conserver pendant 3 ans.
  </div>

  <script>
    window.addEventListener('load', () => {
      // Ouvre auto la boîte d'impression après chargement.
      // Désactivé par défaut pour laisser l'utilisateur prévisualiser.
      // setTimeout(() => window.print(), 300)
    })
  </script>
</body>
</html>`
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Ouvre la quittance dans un nouvel onglet pour aperçu / impression. */
export function openQuittancePreview(ctx: Omit<QuittanceContext, 'emetteur'> & { emetteur?: QuittanceContext['emetteur'] }) {
  const html = buildQuittanceHtml({ ...ctx, emetteur: ctx.emetteur ?? DEFAULT_EMETTEUR })
  const win = window.open('', '_blank', 'width=900,height=1100')
  if (!win) {
    alert("Veuillez autoriser les fenêtres pop-up pour générer la quittance.")
    return
  }
  win.document.write(html)
  win.document.close()
}

/**
 * Construit un mailto: pré-rempli pour envoyer la quittance au locataire.
 * L'utilisateur joindra le PDF généré séparément (limite des protocoles mail).
 */
export function buildMailto(quittance: Quittance, bien: BienImmobilier, locataire: Locataire): string {
  if (!locataire.email) return ''
  const sujet = `Quittance de loyer ${fmtMois(quittance.mois)} — ${bien.nom}`
  const corps = `Bonjour ${locataire.prenom},

Veuillez trouver ci-joint votre quittance de loyer du mois de ${fmtMois(quittance.mois)} pour le logement situé ${bien.adresse}.

Détail :
- Loyer hors charges : ${fmtMontant(quittance.loyerHC)}
- Provisions sur charges : ${fmtMontant(quittance.charges)}
- Total : ${fmtMontant(quittance.total)}

${quittance.statut === 'Payée'
  ? `Nous accusons bonne réception de votre paiement le ${quittance.payeeAt ? fmtDate(quittance.payeeAt) : ''}.`
  : 'Merci de procéder au règlement avant le 10 du mois en cours.'}

Cordialement,

Mairie de Saint-Fortunat-sur-Eyrieux
mairie@saint-fortunat.fr`

  return `mailto:${locataire.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
}

/** Construit un mailto: pour relance de paiement. */
export function buildRelanceMailto(quittance: Quittance, bien: BienImmobilier, locataire: Locataire): string {
  if (!locataire.email) return ''
  const sujet = `Relance — Loyer impayé ${fmtMois(quittance.mois)} — ${bien.nom}`
  const corps = `Bonjour ${locataire.prenom},

Sauf erreur de notre part, le règlement de votre loyer du mois de ${fmtMois(quittance.mois)} ne nous est pas parvenu.

Détail dû :
- Loyer hors charges : ${fmtMontant(quittance.loyerHC)}
- Provisions sur charges : ${fmtMontant(quittance.charges)}
- Total impayé : ${fmtMontant(quittance.total)}

Nous vous remercions de bien vouloir régulariser cette situation dans les meilleurs délais.

Si le règlement a déjà été effectué, merci de bien vouloir nous transmettre la preuve de virement / l'avis d'opération afin que nous mettions à jour nos comptes.

Cordialement,

Mairie de Saint-Fortunat-sur-Eyrieux
mairie@saint-fortunat.fr`

  return `mailto:${locataire.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
}
