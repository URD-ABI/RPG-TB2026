import { monsterArt } from './monster-art.js?v=20261106-new-creatures';
import { bossArt } from './boss-art.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function bestiaryCounts(monsters) {
  return {
    total: monsters.length,
    discovered: monsters.filter(monster => monster.discovered).length,
    defeated: monsters.filter(monster => monster.defeated).length
  };
}

export function bestiaryCards(monsters, category) {
  return monsters.filter(monster => monster.category === category).map(monster => {
    const hidden = !monster.discovered;
    if (category === 'boss') {
      const art = bossArt(monster.chapter, hidden ? null : monster.portraitUrl, hidden ? null : monster.name);
      const details = monster.stats && monster.rewards ? `<div class="bestiary-mastery"><div class="bestiary-stats"><span>Vit ${monster.stats.vitality}</span><span>Force ${monster.stats.attack}</span><span>Déf ${monster.stats.defense}</span><span>Int ${monster.stats.intelligence}</span><span>Aura ${monster.stats.aura}</span></div><span>${monster.rewards.xp} XP · ${monster.rewards.coins} pièces</span></div>` : '';
      return `<article class="bestiary-card paper-card ${hidden ? 'bestiary-card--hidden' : ''}"><div class="bestiary-art">${art}</div><div class="bestiary-card-copy"><span class="eyebrow">BOSS ${monster.chapter} · NIV. ${monster.minLevel ?? '?'} · ${escapeHtml(monster.location)}</span><h2>${hidden ? 'Organisateur mystère' : escapeHtml(monster.name)}</h2><p>${hidden ? 'Son identité sera révélée après la victoire collective.' : escapeHtml(monster.description)}</p>${monster.ability ? `<div class="bestiary-facts"><span>${escapeHtml(monster.ability)}</span></div>` : ''}${details}</div></article>`;
    }
    if (category === 'room') {
      const details = monster.stats && monster.rewards
        ? `<div class="bestiary-mastery"><div class="bestiary-stats"><span>Vit ${monster.stats.vitality}</span><span>Force ${monster.stats.attack}</span><span>Déf ${monster.stats.defense}</span><span>Int ${monster.stats.intelligence}</span><span>Aura ${monster.stats.aura}</span></div><span>${monster.rewards.xp} XP · ${monster.rewards.coins} pièces</span></div>`
        : hidden ? '' : '<small>Remportez ce combat pour connaître ses statistiques et récompenses.</small>';
      return `<article class="bestiary-card bestiary-card--room paper-card ${hidden ? 'bestiary-card--hidden' : ''}"><div class="bestiary-art">${monsterArt(monster.artId, hidden, monster.name)}</div><div class="bestiary-card-copy"><span class="eyebrow">ÉVÉNEMENT ${monster.eventIndex}${hidden ? '' : ` · ${escapeHtml(monster.location)}`}</span><h2>${hidden ? 'Créature de lieu inconnue' : escapeHtml(monster.name)}</h2><p>${hidden ? 'Rencontrez cette créature lors d’un événement de salle pour révéler sa fiche.' : escapeHtml(monster.description)}</p>${monster.preview ? '' : monster.victories ? `<small>${monster.victories} victoire${monster.victories > 1 ? 's' : ''}</small>` : ''}${details}</div></article>`;
    }
    const name = hidden ? 'Créature inconnue' : monster.name;
    const victories = monster.victories === 1 ? '1 victoire' : `${monster.victories} victoires`;
    const discovery = hidden ? '<p>Rencontrez cette créature pour compléter sa fiche.</p>'
      : `<p>${escapeHtml(monster.description)}</p><div class="bestiary-facts"><span>${escapeHtml(monster.archetype)} · ${monster.style === 'magic' ? '✦ Magique' : monster.style === 'physical' ? '⚔ Physique' : '⚔ ✦ Mixte'}</span>${monster.preview ? '' : `<span>${victories}</span>`}</div>`;
    const mastery = monster.defeated ? `<div class="bestiary-mastery"><div class="bestiary-stats"><span>Vit ${monster.stats.vitality}</span><span>Force ${monster.stats.attack}</span><span>Déf ${monster.stats.defense}</span><span>Int ${monster.stats.intelligence}</span><span>Aura ${monster.stats.aura}</span></div><span>${monster.rewards.xp} XP · ${monster.rewards.coins} pièces</span></div>`
      : hidden ? '' : '<small>Remportez un combat pour connaître ses statistiques et récompenses.</small>';
    return `<article class="bestiary-card paper-card ${hidden ? 'bestiary-card--hidden' : ''}"><div class="bestiary-art">${monsterArt(monster.artId, hidden, monster.name, monster.tier)}</div><div class="bestiary-card-copy"><span class="eyebrow">NIV. ${monster.minLevel} · ${escapeHtml(monster.location)}</span><h2>${escapeHtml(name)}</h2>${discovery}${mastery}</div></article>`;
  }).join('');
}
