const singles = new Set([
  'pipette', 'sceptre-cellulaire', 'sabre-flibustier', 'sceptre-direction',
  'lame-ionique', 'baguette-spectrale', 'cle-calibree', 'micropipette-avancee', 'reacteur-prototype',
  'agitateur-precision', 'montre-connectee', 'shield', 'bracelet-equilibre',
  'lance-prototype', 'marteau-strategique', 'grimoire-noir', 'ampoule-renforcee',
  'burette-synchronisee', 'anneau-secours', 'prisme-aura'
]);

const sheets = [
  ['weapons-a', ['pipette', 'lame-catalyse', 'cle-dynamometrique', 'sceptre-cellulaire', 'lance-prototype', 'marteau-strategique']],
  ['weapons-b', ['baton-coordination', null, 'grimoire-noir', 'sceptre-direction', 'lame-ionique', 'baguette-spectrale']],
  ['weapons-c', ['spatule', 'ampoule-renforcee', 'cle-calibree', 'micropipette-avancee', 'reacteur-prototype', 'agitateur-precision', 'burette-synchronisee', 'sabre-flibustier', null]],
  ['accessories', ['shield', 'badge-force', 'broche-intelligence', 'bracelet-equilibre', 'anneau-secours', 'prisme-aura']]
];

export function gearArt(itemId) {
  if (singles.has(itemId)) return { kind: 'single', file: itemId };
  for (const [file, entries] of sheets) {
    const index = entries.indexOf(itemId);
    if (index >= 0) return { kind: 'sprite', file, column: index % 3, row: Math.floor(index / 3), rows: file === 'weapons-c' ? 3 : 2 };
  }
  return null;
}
