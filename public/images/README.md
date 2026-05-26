# Images locales — `public/images`

## Photo de la page de connexion

Le fichier `saint-fortunat-placeholder.svg` est une **illustration de
remplacement** (paysage stylisé) pour la page `/login`. Elle est servie tant
qu'il n'y a pas de photo réelle dans ce dossier.

### Pour passer à une vraie photo de la commune

1. Vous procurer une photo libre de droits (ou une photo prise par un agent
   municipal et explicitement cédée à la commune).
2. La nommer `saint-fortunat.jpg` (ou `.webp`).
3. La placer dans `public/images/`.
4. Mettre à jour `src/app/login/page.tsx` :
   ```ts
   const COMMUNE_PHOTO = '/images/saint-fortunat.jpg'
   ```

Avant l'ancien code chargeait l'image depuis
`www.saint-fortunat-sur-eyrieux.fr/wp-content/uploads/...` — un hotlink
externe avec deux problèmes :

- **Disponibilité** : si le site mairie tombe ou que l'image est déplacée,
  la page de connexion casse.
- **RGPD** : un appel sortant (même vers un autre site de la mairie) crée
  une dépendance externe non maîtrisée. Une fonte ou image servie depuis
  un CDN tiers a déjà coûté des sanctions CNIL à des organismes publics.

## Format recommandé

- JPEG ou WebP, < 200 Ko.
- Largeur 1200-1600 px (le panneau gauche du login fait ~45 % de la
  viewport, soit 600-900 px sur un écran 1920 px).
- Ratio paysage 16:10 ou 3:2.
- Sujet : vue d'ensemble du village, pont sur l'Eyrieux, vallée, ou
  bâtiment de la mairie. Pas de personnes identifiables.
