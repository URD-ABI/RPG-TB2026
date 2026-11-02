export const SKIN_TONES = Object.freeze([
  { id: 'tone-1', label: 'Carnation 1', color: '#f7d8bd' },
  { id: 'tone-2', label: 'Carnation 2', color: '#edbc98' },
  { id: 'tone-3', label: 'Carnation 3', color: '#d99c75' },
  { id: 'tone-4', label: 'Carnation 4', color: '#b97a56' },
  { id: 'tone-5', label: 'Carnation 5', color: '#925d43' },
  { id: 'tone-6', label: 'Carnation 6', color: '#674333' }
]);

export const DEFAULT_SKIN_TONE = 'tone-2';

export function skinTone(id) {
  return SKIN_TONES.find(tone => tone.id === id) || null;
}
