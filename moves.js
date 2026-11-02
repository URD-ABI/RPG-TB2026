export const MAX_CHARGE = 5;

export function gaugeForLevel(level) {
  if (level <= 10) return { max: 2, initial: 1 };
  if (level <= 25) return { max: 3, initial: 1 };
  if (level <= 35) return { max: 4, initial: 2 };
  return { max: 5, initial: 2 };
}

export const SPECIAL_MOVES = Object.freeze([
  { action: 'skill_spatula', label: 'Percussion de spatule', kind: 'physical', source: 'level', requiredLevel: 2, cost: 1, scaling: { attack: 1.5 }, description: 'Une frappe de paillasse précise.' },
  { action: 'skill_arc', label: 'Arc électrostatique', kind: 'magic', source: 'level', requiredLevel: 3, cost: 1, scaling: { magic: 1.5 }, description: 'Une décharge d’énergie concentrée.' },
  { action: 'skill_calibration', label: 'Clé de calibration', kind: 'physical', source: 'level', requiredLevel: 6, cost: 1, scaling: { attack: 1.2 }, effect: 'defenseDown', description: 'Réduit la Défense adverse de 20 % pendant deux tours.' },
  { action: 'skill_solvent', label: 'Brume de solvant', kind: 'magic', source: 'level', requiredLevel: 8, cost: 1, scaling: { magic: 1.2 }, effect: 'auraDown', description: 'Réduit l’Aura adverse de 20 % pendant deux tours.' },
  { action: 'skill_catalyst', label: 'Choc catalytique', kind: 'physical', source: 'level', requiredLevel: 14, cost: 2, scaling: { attack: 1.9 }, description: 'Un impact physique amplifié.' },
  { action: 'skill_plasma', label: 'Onde plasma', kind: 'magic', source: 'level', requiredLevel: 14, cost: 2, scaling: { magic: 1.9 }, description: 'Une vague d’énergie magique.' },
  { action: 'skill_crossed', label: 'Réaction croisée', kind: 'mixed', source: 'shop', price: 3000, requiredLevel: 16, cost: 2, scaling: { attack: 1.1, magic: 1.1 }, description: 'Combine Attaque et Intelligence.' },
  { action: 'skill_regen', label: 'Extraction régénérante', kind: 'physical', source: 'level', requiredLevel: 20, cost: 2, scaling: { attack: 1.4 }, effect: 'heal', description: 'Soigne 20 % des dégâts réellement infligés.' },
  { action: 'skill_barrier', label: 'Champ de confinement', kind: 'magic', source: 'level', requiredLevel: 20, cost: 2, scaling: { magic: 1.3 }, effect: 'fortify', description: 'Augmente Défense et Aura de 10 % jusqu’à la fin du combat.' },
  { action: 'skill_reactor', label: 'Impact de réacteur', kind: 'physical', source: 'level', requiredLevel: 28, cost: 3, scaling: { attack: 2.6 }, description: 'La puissance mécanique du réacteur.' },
  { action: 'skill_spectrum', label: 'Spectre ionisant', kind: 'magic', source: 'level', requiredLevel: 28, cost: 3, scaling: { magic: 2.6 }, description: 'Un rayon issu de l’analyse spectrale.' },
  { action: 'skill_protocol', label: 'Protocole de survie', kind: 'mixed', source: 'shop', price: 7000, requiredLevel: 32, cost: 3, scaling: { vitality: 1.5, defense: 1.5, aura: 1.5 }, description: 'Convertit Vitalité, Défense et Aura en dégâts.' },
  { action: 'skill_overload', label: 'Surcharge du grand réacteur', kind: 'physical', source: 'level', requiredLevel: 40, cost: 4, scaling: { attack: 3.8 }, description: 'La frappe physique ultime du laboratoire.' },
  { action: 'skill_quantum', label: 'Rupture quantique', kind: 'magic', source: 'level', requiredLevel: 40, cost: 4, scaling: { magic: 3.8 }, description: 'La décharge magique ultime du laboratoire.' }
]);

export function moveDamage(move, powers) {
  return Object.entries(move.scaling).reduce((sum, [stat, factor]) => sum + (powers[stat] || 0) * factor, 0);
}
