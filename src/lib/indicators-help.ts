// Dictionnaire des explications pour les indicateurs financiers et ratios
// affichés dans le module Budget M14. Utilisé par <InfoTooltip> et autres.

export interface IndicatorExplanation {
  /** Court : 1-2 lignes, formule courte */
  formule: string
  /** Long : explication, source réglementaire, interprétation */
  description: string
  /** Seuils interprétatifs */
  seuils?: string
  /** Référence réglementaire si applicable */
  source?: string
}

export const INDICATORS: Record<string, IndicatorExplanation> = {
  // ─── Indicateurs d'analyse financière ────────────────────────
  rrf: {
    formule: 'Recettes Réelles de Fonctionnement = Σ chap. 70 + 73 + 74 + 75 + 76 + 77 (- chap. 013)',
    description: "Total des recettes courantes de la commune sur l'exercice : impôts et taxes, dotations de l'État, produits des services, revenus des immeubles, etc. Constitue les ressources dont dispose la commune pour son fonctionnement quotidien.",
  },
  drf: {
    formule: 'Dépenses Réelles de Fonctionnement = Σ chap. 011 + 012 + 014 + 65 + 66 + 67',
    description: "Total des dépenses courantes nécessaires au fonctionnement de la commune : charges de personnel, achats et services, contributions, intérêts d'emprunt, charges exceptionnelles. N'inclut pas les opérations d'investissement.",
  },
  epargneGestion: {
    formule: 'Épargne de gestion = (RRF - produits exceptionnels) - (DRF - charges except. - intérêts dette)',
    description: "Excédent dégagé par la gestion courante avant prise en compte des opérations exceptionnelles et du coût de la dette. Reflète la capacité « pure » de la commune à dégager un excédent sur son activité récurrente.",
  },
  cafBrute: {
    formule: 'CAF brute = RRF − DRF',
    description: "Capacité d'auto-financement brute. C'est l'excédent dégagé par la section de fonctionnement, qui peut être affecté à l'investissement ou au remboursement de la dette. Indicateur clé de la santé financière.",
    seuils: 'Doit être positive. Idéalement > 10% des RRF.',
  },
  cafNette: {
    formule: 'CAF nette = CAF brute − remboursement du capital de la dette',
    description: "Marge réellement disponible pour financer de nouveaux investissements après remboursement du capital des emprunts. Si négative, la commune n'a plus de marge d'investissement sans nouvel emprunt ou subvention.",
    seuils: 'Doit être positive. Si négative : situation préoccupante.',
  },
  tauxEpargneBrute: {
    formule: "Taux d'épargne brute = CAF brute / RRF",
    description: "Pourcentage des recettes de fonctionnement disponible pour l'investissement et la dette. Référence DGFiP pour évaluer la capacité d'autofinancement relative.",
    seuils: '> 12% : sain · 8-12% : à surveiller · < 8% : faible',
  },
  capaciteDesendettement: {
    formule: 'Capacité de désendettement = Encours de la dette / CAF brute',
    description: "Nombre théorique d'années nécessaires pour rembourser la totalité de la dette en y consacrant l'intégralité de l'épargne brute. C'est LE ratio surveillé par les préfectures et les agences de notation.",
    seuils: '< 8 ans : sain · 8-12 ans : surveillance · > 12 ans : critique (alerte préfectorale)',
    source: 'Loi de programmation des finances publiques 2018-2022',
  },
  encoursDette: {
    formule: 'Encours de dette = Solde des comptes 1641 + 165 au 31/12',
    description: "Capital restant dû sur les emprunts au 31/12. Doit être saisi explicitement dans la configuration des ratios — sinon estimé à 10× le remboursement annuel.",
  },

  // ─── Ratios obligatoires R. 2313-1 CGCT ────────────────────────
  ratio1_drfParHab: {
    formule: 'Ratio 1 = DRF / population',
    description: "Dépenses réelles de fonctionnement par habitant. Indicateur de la « charge » que représente le fonctionnement de la commune par citoyen. À comparer aux moyennes nationales (strate de population).",
    source: 'Article R. 2313-1 du CGCT',
    seuils: 'Communes 500-2000 hab. : moyenne ~ 700-900 €/hab. (DGCL)',
  },
  ratio2_produitImpotsDirectsParHab: {
    formule: 'Ratio 2 = Produit des impôts directs (compte 7311) / population',
    description: "Produit moyen par habitant des 4 taxes directes locales (taxe d'habitation, foncier bâti, foncier non bâti, CFE). Reflète la pression fiscale locale.",
    source: 'Article R. 2313-1 du CGCT',
  },
  ratio3_rrfParHab: {
    formule: 'Ratio 3 = RRF / population',
    description: "Recettes réelles de fonctionnement par habitant. Indique le niveau de ressources courantes par citoyen. Plus c'est élevé, plus la commune a de marge de manœuvre.",
    source: 'Article R. 2313-1 du CGCT',
  },
  ratio4_equipementParHab: {
    formule: "Ratio 4 = Dépenses d'équipement brut (chap. 20+21+23) / population",
    description: "Dépenses d'investissement par habitant sur l'exercice. Mesure l'effort d'équipement de la commune. Variable selon les projets en cours.",
    source: 'Article R. 2313-1 du CGCT',
  },
  ratio5_encoursDetteParHab: {
    formule: 'Ratio 5 = Encours de dette / population',
    description: "Dette par habitant. Indicateur de l'endettement relatif. À comparer aux moyennes nationales — communes de 500-2000 hab. : moyenne ~ 600-900 €/hab.",
    source: 'Article R. 2313-1 du CGCT',
    seuils: '< 700 €/hab. : faible · 700-1200 : moyen · > 1200 : élevé',
  },
  ratio6_dgfParHab: {
    formule: 'Ratio 6 = DGF (compte 7411) / population',
    description: "Dotation Globale de Fonctionnement par habitant. C'est la principale dotation versée par l'État. En diminution constante depuis la baisse des dotations 2014-2017.",
    source: 'Article R. 2313-1 du CGCT',
  },
  ratio7_personnelSurDrf: {
    formule: 'Ratio 7 = Charges de personnel (chap. 012) / DRF',
    description: "Part des dépenses de personnel dans les dépenses de fonctionnement. Au-delà de 60%, marge de manœuvre limitée pour absorber un imprévu ou financer des projets.",
    source: 'Article R. 2313-1 du CGCT (communes > 10 000 hab. uniquement, mais utile en deçà)',
    seuils: '< 50% : sain · 50-60% : à surveiller · > 60% : alerte',
  },
  ratio9_rigidite: {
    formule: 'Ratio 9 = (DRF + remboursement capital) / RRF',
    description: "Coefficient de rigidité des charges structurelles. Mesure la part des recettes pré-engagée sur des dépenses peu compressibles. Plus le ratio est élevé, moins la commune a de marge.",
    source: 'Article R. 2313-1 du CGCT',
    seuils: '< 80% : sain · 80-90% : à surveiller · > 90% : alerte',
  },
  ratio10_equipementSurRrf: {
    formule: "Ratio 10 = Dépenses d'équipement / RRF",
    description: "Part des recettes consacrée à l'investissement. Reflète l'effort d'investissement relatif.",
    source: 'Article R. 2313-1 du CGCT',
  },
  ratio11_detteSurRrf: {
    formule: 'Ratio 11 = Encours de dette / RRF',
    description: "Encours de dette ramené aux recettes annuelles. Indicateur complémentaire à la capacité de désendettement.",
    source: 'Article R. 2313-1 du CGCT',
    seuils: '< 70% : sain · 70-100% : à surveiller · > 100% : élevé',
  },
}
