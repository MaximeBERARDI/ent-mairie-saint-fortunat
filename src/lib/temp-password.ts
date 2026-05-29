import { randomInt } from 'node:crypto'

// Mot de passe temporaire lisible (dicté/transmis à l'oral) : alphabet sans
// caractères ambigus (pas de I, O, 0, 1), deux blocs de 5 séparés d'un tiret.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function genTempPassword(): string {
  const block = () =>
    Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `${block()}-${block()}`
}
