import { SPECIAL_MOVES, gaugeForLevel } from './moves.js';
import { gearArt } from './gear-art.js';
import { monsterArt } from './monster-art.js';
import { bossArt } from './boss-art.js';
import { bossBanner, formatBossCountdown } from './boss-banner.js';
import { renderRoomActivities, shopkeeperPortraits } from './room-activities.js';
import { bestiaryCards, bestiaryCounts } from './bestiary-view.js';
import { portraitIdFromUrl, portraitPoseStyle } from './portrait-poses.js';
import { SKIN_TONES, DEFAULT_SKIN_TONE } from './skin-tones.js';
import { applyOutfitSkin } from './outfit-skin.js';
import { browserSupabaseApi } from './supabase-api.js';
import { turnFeedback } from './combat-feedback.js?v=2';

const app = document.querySelector('#app');
const remoteApi = browserSupabaseApi();
const state = { me: null, fight: null, turnPlayback: null, gear: null, portraits: [], shopkeepers: {}, skills: null, world: null, locations: [], access: null, event: null, secretEvent: null, specialEvent: null, florentEvent: null, training: null, roomTab: 'combat', roomNotice: null, bestiary: [], bestiaryCategory: 'common', leaderboard: [], selectedFloor: 'rdc', selectedLocation: null, screen: 'loading', equipmentReturn: 'map' };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

async function api(url, options = {}) {
  if (remoteApi) return remoteApi.request(url, options);
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(data?.error || `Erreur ${response.status}`);
  return data;
}

function errorLine(error) {
  const line = app.querySelector('[data-error]');
  if (line) { line.textContent = error.message || String(error); line.hidden = false; }
}

function itemIcon(item) {
  const symbols = { spatula: '⚗', reactor: '⚗', pipette: '⚗', flask: '⚗', wrench: '🔧', condenser: '⌁', stirrer: '◉', burette: '⌁', saber: '☠', book: '▣', sceptre: '♜', electrode: 'ϟ', glassrod: '✧', goggles: '◉', gloves: '✋', coffee: '☕', mask: '◈', firstaid: '✚', dosimeter: '◫', watch: '◉' };
  return `<span class="item-symbol item-symbol--${escapeHtml(item?.icon || 'outfit')}" aria-hidden="true">${symbols[item?.icon] || '♜'}</span>`;
}

function itemBonuses(item) {
  const labels = { vitality: 'Vit', attack: 'Att', defense: 'Déf', intelligence: 'Int', aura: 'Aur', health: 'PV' };
  const flat = Object.entries(labels).filter(([stat]) => item[stat] > 0).map(([stat, label]) => `<span>+${item[stat]} ${label}</span>`);
  const percent = Object.entries(labels).filter(([stat]) => item[`${stat}Percent`] > 0)
    .map(([stat, label]) => `<span>+${item[`${stat}Percent`]} % ${label}</span>`);
  return [...flat, ...percent].join('');
}

function itemArt(item) {
  if (item.slot === 'outfit') {
    const appearance = item.appearance?.[state.me.presentation];
    const source = `./assets/${escapeHtml(appearance)}.png`;
    return `<span class="item-outfit-frame"><img class="item-outfit-image ${appearance?.endsWith('-pair') ? `item-outfit-image--pair ${state.me.presentation === 'feminine' ? 'item-outfit-image--right' : ''}` : ''}" src="${source}" data-skin-source="${source}" alt="" loading="lazy"></span>`;
  }
  const art = gearArt(item.id);
  if (!art) return itemIcon(item);
  if (art.kind === 'single') return `<img class="item-single-art" src="./assets/${art.file}.png" alt="${escapeHtml(item.name)}" loading="lazy">`;
  return `<span class="item-sprite" role="img" aria-label="${escapeHtml(item.name)}" style="background-image:url('./assets/${art.file}.png');background-size:${art.rows === 3 ? '315% 315%' : '315% 210%'};background-position:${art.column * 50}% ${art.row * (art.rows === 3 ? 50 : 100)}%"></span>`;
}

function avatar(presentation, portraitUrl, extraClass = '', outfit = 'labcoat', equipped = {}) {
  const kind = presentation === 'feminine' ? 'feminine' : 'masculine';
  const item = state.gear?.catalog.find(entry => entry.id === outfit);
  const appearance = item?.appearance?.[kind] || 'labcoat-pair';
  const paired = appearance.endsWith('-pair');
  const portraitId = portraitIdFromUrl(portraitUrl);
  const illustrated = !!portraitId;
  const poseStyle = illustrated ? portraitPoseStyle(portraitId, outfit, kind) : '';
  const head = portraitUrl
    ? `<img class="avatar-head ${illustrated ? 'avatar-head--illustrated' : 'avatar-head--legacy'}" src="${escapeHtml(portraitUrl)}" alt="Visage du personnage"${poseStyle ? ` style="${poseStyle}"` : ''}>`
    : '<span class="avatar-head avatar-head--fallback" aria-label="Choisissez une tête">?</span>';
  const bodySource = `./assets/${escapeHtml(appearance)}.png`;
  const body = paired ? `<span class="avatar-body-frame"><img class="avatar-body avatar-body--pair ${kind === 'feminine' ? 'avatar-body--right' : ''}" src="${bodySource}" data-skin-source="${bodySource}" alt="${escapeHtml(item?.name || 'Blouse de chercheur')}"></span>`
    : `<img class="avatar-body" src="${bodySource}" data-skin-source="${bodySource}" alt="${escapeHtml(item?.name || 'Tenue du personnage')}">`;
  const weapon = state.gear?.catalog.find(entry => entry.id === equipped.weapon);
  const accessory = state.gear?.catalog.find(entry => entry.id === equipped.accessory);
  return `<div class="avatar ${extraClass} ${paired ? 'avatar--paired' : 'avatar--single'} avatar--${kind} outfit-${escapeHtml(outfit)}">${body}${head}${weapon ? `<span class="avatar-gear avatar-gear--weapon" aria-label="${escapeHtml(weapon.name)}">${itemArt(weapon)}</span>` : ''}${accessory ? `<span class="avatar-gear avatar-gear--accessory" aria-label="${escapeHtml(accessory.name)}">${itemArt(accessory)}</span>` : ''}</div>`;
}

function skinToneChoices(selected) {
  return `<fieldset class="skin-tone-fieldset"><legend>Carnation visible sur les tenues</legend>
    <div class="skin-tone-options">${SKIN_TONES.map(tone => `<label class="skin-tone-choice"><input type="radio" name="skinTone" value="${tone.id}" ${selected === tone.id ? 'checked' : ''} required><span class="skin-tone-swatch" style="background:${tone.color}"></span><span>${tone.label}</span></label>`).join('')}</div>
    <small>La photo de votre tête conserve sa couleur d’origine.</small></fieldset>`;
}

async function loadGear() { state.gear = await api('/api/gear'); }
async function loadPortraits() {
  const result = await api('/api/portraits');
  state.portraits = result.portraits;
  state.shopkeepers = result.shopkeepers || {};
}
async function loadSkills() { state.skills = await api('/api/skills'); }
async function loadWorld() {
  const [world, map, access] = await Promise.all([api('/api/bosses'), api('/api/locations'), api('/api/map/access')]);
  state.world = world; state.locations = map.locations; state.access = access;
}
function chapterInfo(chapter) { return state.world?.chapters.find(item => item.chapter === chapter) || { name: 'Laboratoire de chimie', image: 'labo-chimie.png' }; }
function locationBySlug(slug) { return state.locations.find(item => item.slug === slug) || null; }
function locationByActivity(id) { return state.locations.find(item => item.activityId === id) || null; }
function roomRoute(slug) { return `#/lieu/${slug}`; }
function setRoute(hash) { if (window.location.hash !== hash) window.location.hash = hash; }

async function syncRoute() {
  if (window.location.hash === '#/classement') {
    state.leaderboard = (await api('/api/leaderboard')).players;
    state.screen = 'leaderboard';
    render();
    return;
  }
  if (window.location.hash === '#/bestiaire') {
    state.bestiary = (await api('/api/bestiary')).monsters;
    state.screen = 'bestiary';
    render();
    return;
  }
  const slug = /^#\/lieu\/([a-z-]+)$/.exec(window.location.hash)?.[1];
  const room = slug && locationBySlug(slug);
  if (room?.requiresMagnien && !state.access.unlocked) { setRoute(roomRoute('aile-magnien')); return; }
  if (room?.requiresQuentinVictory && !state.access.basementUnlocked) { setRoute(roomRoute('edb')); return; }
  if (room) {
    state.selectedLocation = room.slug;
    state.selectedFloor = room.floor;
    [state.secretEvent, state.specialEvent, state.training, state.florentEvent] = await Promise.all([
      room.requiresMysteryKey && !state.access.edbUnlocked ? null : api(`/api/locations/${room.slug}/secret`),
      room.specialEvent ? api(`/api/locations/${room.slug}/enter`, { method: 'POST' }) : null,
      room.slug === 'gym' ? api('/api/locations/gym/training') : null,
      room.florentEvent ? api('/api/locations/bureau-florent/event') : null
    ]);
    state.event = null;
    state.roomTab = 'combat';
    state.roomNotice = null;
    state.screen = 'room';
  } else {
    state.selectedFloor = window.location.hash === '#/carte/first' ? 'first' : 'rdc';
    state.screen = 'map';
  }
  render();
}

async function openRoom(slug) {
  const room = locationBySlug(slug);
  if (!room) return;
  if (room.requiresMagnien && !state.access.unlocked) { await openRoom('aile-magnien'); return; }
  if (room.requiresQuentinVictory && !state.access.basementUnlocked) { await openRoom('edb'); return; }
  if (window.location.hash === roomRoute(slug)) await syncRoute();
  else setRoute(roomRoute(slug));
}

function shell(content, subtitle = '') {
  app.innerHTML = `<header class="site-header"><div class="brand"><span class="brand-mark">✦</span> TB<span class="brand-year">2026</span></div>
    <span class="header-subtitle">${escapeHtml(subtitle)}</span>
    ${state.me?.nickname ? `<span class="header-player">${escapeHtml(state.me.nickname)} <b>Niv. ${state.me.progression.level}</b> <b>🪙 ${state.me.coins}</b></span>` : ''}</header>
    <main class="page-shell">${content}</main><footer class="site-footer">Une aventure collective dans nos laboratoires · TB2026</footer>`;
  applyOutfitSkin(app, state.me?.skinTone || DEFAULT_SKIN_TONE);
}

function loginScreen() {
  shell(`<section class="welcome-card paper-card"><span class="eyebrow">L’AVENTURE COMMENCE</span><h1>Les mystères des laboratoires</h1>
    <p>Créez votre personnage, affrontez les créatures du labo et préparez-vous à découvrir les organisateurs.</p>
    <form id="login" class="form-stack"><label for="code">Votre code personnel</label>
    <input id="code" name="code" autocomplete="one-time-code" required placeholder="Coller le code reçu">
    <button class="primary-button" type="submit">Entrer dans le jeu →</button></form>
    <p data-error class="form-error" hidden role="alert"></p>
    <p class="small-note">Le même code permet de reprendre votre aventure sur un autre appareil.</p></section>`, 'Jeu de rôle collectif');
  app.querySelector('#login').addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button'); button.disabled = true;
    try {
      await api('/api/session', { method: 'POST', body: JSON.stringify({ code: event.currentTarget.elements.code.value.trim() }) });
      state.me = await api('/api/me'); await loadGear(); await loadPortraits(); await loadWorld();
      if (state.me.nickname) await syncRoute(); else { state.screen = 'character'; render(); }
    } catch (error) { errorLine(error); button.disabled = false; }
  });
}

function progressionCard() {
  const progress = state.me.progression;
  const start = progress.currentLevelXp;
  const end = progress.nextLevelXp;
  const percent = end === null ? 100 : Math.max(0, Math.min(100, 100 * (progress.xp - start) / (end - start)));
  const groups = [
    { title: 'COMBAT', entries: [
      { id: 'vitality', label: 'Vitalité', effect: '+4 PV par point', total: `${progress.combat.health} PV` },
      { id: 'attack', label: 'Attaque', effect: '+1 dégât physique par point', total: `${progress.combat.attack} dégâts` },
      { id: 'defense', label: 'Défense', effect: '-1 dégât physique reçu par point', total: `${progress.combat.defense} protection` }
    ] },
    { title: 'MAGIE', entries: [
      { id: 'intelligence', label: 'Intelligence (Int)', effect: '+1 dégât magique par point', total: `Bonus +${progress.combat.magic - 12}` },
      { id: 'aura', label: 'Aura (Aur)', effect: '-1 dégât magique reçu par point', total: `${progress.combat.aura} protection` }
    ] }
  ];
  const classOptions = (tier, options) => options.map(item => `<button type="button" class="class-option" data-class-tier="${tier}" data-class-id="${item.id}"><strong>${escapeHtml(item.name)}</strong><small>${Object.entries(item.bonuses).map(([stat, value]) => `+${value} ${escapeHtml({ attack: 'Attaque', vitality: 'Vitalité', defense: 'Défense', intelligence: 'Intelligence', aura: 'Aura' }[stat])}`).join(' · ')}</small></button>`).join('');
  const classes = progress.classes;
  const stage = (tier, required, selected, options) => `<div class="class-stage"><div><b>Niveau ${required}</b><span>${selected ? 'Choix effectué · bonus conservés' : progress.level < required ? `Disponible au niveau ${required}` : tier === 'advanced' && !classes.specialization ? 'Choisissez d’abord une spécialisation' : 'Choisissez une classe'}</span></div>${options.length ? `<div class="class-options">${classOptions(tier, options)}</div>` : ''}${tier === 'advanced' && classes.lockedSecrets ? `<small>${classes.lockedSecrets} spécialités secrètes restent à découvrir dans le bâtiment.</small>` : ''}</div>`;
  return `<section class="progression-card paper-card" aria-label="Progression du personnage"><div class="progression-heading"><div><span class="eyebrow">PROGRESSION · ${escapeHtml(classes.title)}</span><h2>Niveau ${progress.level}</h2></div><span class="point-badge">${progress.availablePoints ? `${progress.availablePoints} point${progress.availablePoints > 1 ? 's' : ''} à répartir` : 'Points répartis'}</span></div>
    <div class="xp-label"><strong>${end === null ? `${progress.xp} XP` : `${progress.xp - start} / ${end - start} XP`}</strong><span>${end === null ? 'Niveau maximum' : `${progress.xp} XP cumulés · niveau suivant à ${end}`}</span></div>
    <div class="xp-track" role="progressbar" aria-label="Expérience du niveau" aria-valuemin="${start}" aria-valuemax="${end ?? start}" aria-valuenow="${progress.xp}"><i style="width:${percent}%"></i></div>
    <div class="stat-list">${groups.map(group => `<section class="stat-group"><h3>${group.title}</h3>${group.entries.map(item => `<div class="stat-row"><div><strong>${item.label} <span>+${progress.stats[item.id]}</span></strong><small>${item.effect}</small></div><b>${item.total}</b><button type="button" class="stat-add" data-stat="${item.id}" data-spent="${progress.spentPoints}" aria-label="Ajouter un point en ${item.label}" ${progress.availablePoints === 0 ? 'disabled' : ''}>+</button></div>`).join('')}</section>`).join('')}</div>
    <div class="class-roadmap"><h3>Parcours de chercheur</h3><p>Chaque palier accorde deux bonus permanents, une tenue et une arme offertes. Les anciens objets restent dans votre sac. Un seul choix est possible par palier.</p>${stage('specialization', 20, classes.specialization, classes.specializationOptions)}${stage('advanced', 35, classes.advanced, classes.advancedOptions)}</div>
    <p class="progression-note">Chaque statistique commence à 1 et vous recevez 5 points libres à la création. Vous pouvez concentrer tous vos points dans une seule statistique. Les totaux incluent l’équipement et les bonus de classe. Les changements s’appliquent au prochain combat.</p></section>`;
}

function refreshProgressionCard() {
  app.querySelector('.progression-card').outerHTML = progressionCard();
  attachStatButtons();
  attachClassButtons();
  const header = app.querySelector('.header-player');
  if (header) header.innerHTML = `${escapeHtml(state.me.nickname)} <b>Niv. ${state.me.progression.level}</b> <b>🪙 ${state.me.coins}</b>`;
}

function attachClassButtons() {
  app.querySelectorAll('[data-class-id]').forEach(button => button.addEventListener('click', async () => {
    app.querySelectorAll('[data-class-id]').forEach(item => { item.disabled = true; });
    try {
      state.me = await api('/api/me/class', { method: 'POST', body: JSON.stringify({ tier: button.dataset.classTier, classId: button.dataset.classId }) });
      await loadGear(); render();
    } catch (error) {
      state.me = await api('/api/me');
      refreshProgressionCard();
      errorLine(error);
    }
  }));
}

function attachStatButtons() {
  app.querySelectorAll('[data-stat]').forEach(button => button.addEventListener('click', async () => {
    app.querySelectorAll('[data-stat]').forEach(item => { item.disabled = true; });
    const previousSpent = Number(button.dataset.spent);
    try {
      state.me = await api('/api/me/stats', { method: 'POST', body: JSON.stringify({ stat: button.dataset.stat, expectedSpent: previousSpent }) });
      refreshProgressionCard();
    } catch (error) {
      try {
        state.me = await api('/api/me');
        refreshProgressionCard();
        if (state.me.progression.spentPoints === previousSpent) errorLine(error);
      } catch {
        errorLine(error);
        app.querySelectorAll('[data-stat]').forEach(item => {
          item.disabled = state.me.progression.availablePoints === 0;
        });
      }
    }
  }));
}

function characterScreen() {
  const kind = state.me?.presentation || 'masculine';
  const currentOutfit = state.me?.outfitId || 'labcoat';
  const outfitName = escapeHtml(state.gear?.catalog.find(item => item.id === currentOutfit)?.name.toUpperCase() || 'BLOUSE DE CHERCHEUR');
  if (state.me?.nickname) {
    shell(`<section class="character-layout"><div class="character-copy"><span class="eyebrow">VOTRE PERSONNAGE</span>
      <h1>${escapeHtml(state.me.nickname)}</h1><p>Chaque statistique commence à 1. Répartissez vos points libres pour préparer les prochains combats.</p>
      ${state.me.skinTone ? '' : `<form id="skin-tone-once" class="paper-card skin-tone-once"><h2>Choisissez votre carnation</h2><p>Votre personnage a été créé avant ce choix. Vous pouvez le définir une fois.</p>${skinToneChoices(DEFAULT_SKIN_TONE)}<button class="secondary-button" type="submit">Confirmer la carnation</button></form>`}
      ${progressionCard()}<div class="character-actions"><button id="back-map" class="primary-button" type="button">Retour à la carte</button></div>
      <p data-error class="form-error" hidden role="alert"></p></div>
      <div class="character-visual"><div class="character-preview character-preview--equipped paper-card"><span class="preview-label">TENUE ÉQUIPÉE · ${outfitName}</span>
      ${avatar(kind, state.me.portraitUrl, '', currentOutfit, state.gear?.inventory.equipped)}</div><button id="open-wardrobe" class="secondary-button equipment-cta" type="button">Équipement</button></div></section>`, 'Votre personnage');
    attachStatButtons();
    attachClassButtons();
    app.querySelectorAll('#skin-tone-once input[name="skinTone"]').forEach(radio => radio.addEventListener('change', () => applyOutfitSkin(app, radio.value)));
    app.querySelector('#skin-tone-once')?.addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button[type="submit"]'); button.disabled = true;
      try {
        state.me = await api('/api/me/skin-tone', { method: 'PUT', body: JSON.stringify({ skinTone: event.currentTarget.elements.skinTone.value }) });
        render();
      } catch (error) { errorLine(error); button.disabled = false; }
    });
    app.querySelector('#back-map').addEventListener('click', () => { state.screen = 'map'; setRoute(`#/carte/${state.selectedFloor}`); render(); });
    app.querySelector('#open-wardrobe').addEventListener('click', () => { state.equipmentReturn = 'character'; state.screen = 'wardrobe'; render(); });
    return;
  }
  shell(`<section class="character-layout"><div class="character-copy"><span class="eyebrow">VOTRE PERSONNAGE</span>
    <h1>Créez votre héros</h1>
    <p>Choisissez votre nom pour retrouver votre tête illustrée sur toutes les tenues.</p>
    <form id="character" class="form-stack"><label for="nickname">Pseudo</label>
    <input id="nickname" name="nickname" minlength="2" maxlength="30" required value="${escapeHtml(state.me?.nickname || '')}" placeholder="Votre nom d’aventurier">
    <fieldset class="choice-fieldset"><legend>Silhouette du personnage</legend>
    <label class="radio-card"><input type="radio" name="presentation" value="masculine" ${kind === 'masculine' ? 'checked' : ''}> Masculine</label>
    <label class="radio-card"><input type="radio" name="presentation" value="feminine" ${kind === 'feminine' ? 'checked' : ''}> Féminine</label></fieldset>
    ${skinToneChoices(DEFAULT_SKIN_TONE)}
    <p>Votre aventure commence avec une blouse blanche, 1 point dans chaque statistique et 5 points à répartir librement. Vous gagnerez d’autres tenues en jouant.</p>
    <label for="portrait-id">Votre tête illustrée</label>
    <select id="portrait-id" name="portraitId" required ${state.portraits.length ? '' : 'disabled'}><option value="">Choisissez votre nom</option>${state.portraits.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select>
    ${state.portraits.length ? '' : '<p>Aucune tête n’est disponible actuellement. L’administrateur doit activer les personnes qui souhaitent jouer.</p>'}
    <button class="primary-button" type="submit" ${state.portraits.length ? '' : 'disabled'}>Créer mon personnage →</button></form>
    <p data-error class="form-error" hidden role="alert"></p></div>
    <div class="character-preview paper-card"><span class="preview-label">TENUE DE DÉPART · ${outfitName}</span>
    ${avatar(kind, null, '', currentOutfit, state.gear?.inventory.equipped)}<p>Votre tête sera intégrée à la tenue choisie.</p></div></section>`, 'Création de personnage');
  const updateCharacterPreview = () => {
    const selected = app.querySelector('#portrait-id').value;
    const presentation = app.querySelector('input[name="presentation"]:checked').value;
    const url = selected ? state.portraits.find(item => item.id === selected)?.url
      || `/api/portraits/${selected}.png` : null;
    app.querySelector('.character-preview .avatar').outerHTML = avatar(presentation, url, '', currentOutfit, state.gear?.inventory.equipped);
    applyOutfitSkin(app.querySelector('.character-preview'), app.querySelector('input[name="skinTone"]:checked')?.value || DEFAULT_SKIN_TONE);
  };
  app.querySelectorAll('input[name="presentation"]').forEach(radio => radio.addEventListener('change', () => {
    updateCharacterPreview();
  }));
  app.querySelector('#portrait-id').addEventListener('change', updateCharacterPreview);
  app.querySelectorAll('#character input[name="skinTone"]').forEach(radio => radio.addEventListener('change', updateCharacterPreview));
  app.querySelector('#character').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const fields = event.currentTarget.elements;
      await api('/api/me', { method: 'PUT', body: JSON.stringify({ nickname: fields.nickname.value, presentation: fields.presentation.value, portraitId: fields.portraitId.value, skinTone: fields.skinTone.value }) });
      state.me = await api('/api/me'); await loadGear(); state.screen = 'character'; render();
    } catch (error) {
      try {
        state.me = await api('/api/me');
        if (state.me.nickname) {
          await loadGear(); state.screen = 'character'; render();
          return;
        }
      } catch { /* afficher l’erreur initiale */ }
      if (/tête est indisponible/.test(error.message)) {
        try {
          await loadPortraits();
          const select = app.querySelector('#portrait-id');
          select.innerHTML = `<option value="">Choisissez votre nom</option>${state.portraits.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}`;
          select.value = '';
          select.disabled = !state.portraits.length;
        } catch { /* conserver l’erreur de disponibilité */ }
      }
      errorLine(error); button.disabled = !state.portraits.length;
    }
  });
}

function mapRoomPin(room) {
  const magnienLocked = room.requiresMagnien && !state.access.unlocked;
  const mysteryLocked = room.requiresMysteryKey && !state.access.edbUnlocked;
  const label = escapeHtml(room.name).replace(/^Bureau /, 'Bureau<br>');
  return `<button type="button" class="map-pin ${room.slug.startsWith('bureau-') ? 'map-pin--office' : ''} ${room.isToll ? 'map-pin--toll' : ''} ${magnienLocked || mysteryLocked ? 'map-pin--locked' : ''}" data-room="${room.slug}" style="left:${room.x}%;top:${room.y}%" aria-label="${escapeHtml(room.name)}${magnienLocked ? ', accès verrouillé, péage Aile Magnien' : mysteryLocked ? ', accès verrouillé, Clé Mystère requise' : ''}" ${magnienLocked ? 'disabled' : ''}>${magnienLocked || mysteryLocked ? '🔒 ' : room.isToll ? '◆ ' : ''}${label}</button>`;
}

function mapScreen() {
  const floor = state.selectedFloor;
  const rooms = state.locations.filter(item => item.floor === floor && item.mapVisible !== false);
  const revealed = state.world.bosses.filter(item => item.status === 'revealed');
  shell(`<section class="map-intro"><div><span class="eyebrow">EXPLORATION · TB2026</span><h1>Carte des laboratoires</h1><p>Choisissez une salle sur le plan. Les lieux peuvent être explorés à votre rythme ; les organisateurs apparaissent quand l’équipe les annonce.</p></div>
    <div class="map-controls"><button id="edit-character" class="secondary-button">Mon personnage${state.me.progression.availablePoints ? ` · ${state.me.progression.availablePoints} point${state.me.progression.availablePoints > 1 ? 's' : ''}` : ''}</button><button id="open-wardrobe" class="secondary-button">Équipement</button><button id="open-bestiary" class="secondary-button">Bestiaire</button><button id="open-leaderboard" class="secondary-button">Classement</button><button id="logout" class="text-button">Changer de code</button></div></section>
    <div class="floor-tabs" role="group" aria-label="Étage du bâtiment"><button data-floor="rdc" class="${floor === 'rdc' ? 'active' : ''}" aria-pressed="${floor === 'rdc'}">RDC</button><button data-floor="first" class="${floor === 'first' ? 'active' : ''}" aria-pressed="${floor === 'first'}">1er étage</button></div>
    <section class="building-map-card paper-card" aria-label="Plan du ${floor === 'rdc' ? 'rez-de-chaussée' : 'premier étage'}"><div class="building-map-scroll"><div class="building-map" style="aspect-ratio:${floor === 'rdc' ? '1000 / 760' : '1000 / 700'}"><img src="./maps/${floor === 'rdc' ? 'rdc' : 'first-floor'}.svg" alt="Plan illustré du ${floor === 'rdc' ? 'rez-de-chaussée' : 'premier étage'}"><div class="map-hotspots">${rooms.map(mapRoomPin).join('')}</div></div></div></section>
    <section class="map-location-list"><span class="eyebrow">SALLES DU ${floor === 'rdc' ? 'RDC' : '1ER ÉTAGE'}</span><div>${rooms.map(room => `<button class="secondary-button" data-room="${room.slug}" ${room.requiresMagnien && !state.access.unlocked ? 'disabled' : ''}>${escapeHtml(room.name)}${room.requiresMagnien && !state.access.unlocked ? ' · péage Aile Magnien' : room.requiresMysteryKey && !state.access.edbUnlocked ? ' · Clé Mystère requise' : ''}</button>`).join('')}</div></section>
    ${bossBanner(state.world)}
    ${revealed.map(item => `<section class="reveal-card paper-card">${bossArt(item.chapter, item.identity.portraitUrl, item.identity.name)}<div><span class="eyebrow">ORGANISATEUR RÉVÉLÉ · BOSS ${item.chapter}</span><h2>${escapeHtml(item.identity.name)}</h2><p>${escapeHtml(item.identity.role)}</p><p>${escapeHtml(item.identity.message)}</p></div></section>`).join('')}
    <p data-error class="form-error" hidden role="alert"></p>`, 'Carte des laboratoires');
  app.querySelector('#edit-character').addEventListener('click', () => { state.screen = 'character'; render(); });
  app.querySelector('#open-wardrobe').addEventListener('click', () => { state.equipmentReturn = 'map'; state.screen = 'wardrobe'; render(); });
  app.querySelector('#open-bestiary').addEventListener('click', () => setRoute('#/bestiaire'));
  app.querySelector('#open-leaderboard').addEventListener('click', () => setRoute('#/classement'));
  app.querySelector('#logout').addEventListener('click', async () => {
    try { await api('/api/session', { method: 'DELETE' }); state.me = null; state.fight = null; state.gear = null; state.world = null; state.screen = 'login'; render(); }
    catch (error) { errorLine(error); }
  });
  app.querySelectorAll('[data-floor]').forEach(button => button.addEventListener('click', () => {
    state.selectedFloor = button.dataset.floor; setRoute(`#/carte/${state.selectedFloor}`); render();
  }));
  app.querySelectorAll('[data-room]').forEach(button => button.addEventListener('click', async () => {
    try { await openRoom(button.dataset.room); } catch (error) { errorLine(error); }
  }));
  app.querySelector('#start-boss')?.addEventListener('click', event => beginFight(event, '/api/bosses/encounter'));
}

function roomScreen() {
  const room = locationBySlug(state.selectedLocation);
  if (!room) { state.screen = 'map'; mapScreen(); return; }
  const locked = room.requiresMagnien && !state.access.unlocked;
  const mysteryLocked = room.requiresMysteryKey && !state.access.edbUnlocked;
  const image = room.image ? `<img src="./assets/${escapeHtml(room.image)}" alt="${escapeHtml(room.name)} illustré à partir d’une photo du lieu">` : `<div class="room-illustration" role="img" aria-label="Illustration provisoire de ${escapeHtml(room.name)}"><span aria-hidden="true">✦</span><strong>${escapeHtml(room.name)}</strong><small>Décor à venir</small></div>`;
  const toll = room.isToll || locked ? `<section class="toll-card paper-card"><span class="eyebrow">PÉAGE DE L’AILE MAGNIEN</span><h2>${state.access.unlocked ? 'Passage ouvert' : 'Débloquer les salles de l’Aile Magnien'}</h2><p>${state.access.unlocked ? 'Votre accès est permanent. Vous pouvez désormais entrer dans la Salle de réunion et le Bureau Kévin.' : `Le passage coûte ${state.access.price} pièces une seule fois. Votre solde : ${state.access.coins} pièces.`}</p>${state.access.unlocked ? '<div class="toll-actions"><button id="go-meeting" class="primary-button">Entrer dans la Salle de réunion</button><button id="go-kevin" class="secondary-button">Entrer dans le Bureau Kévin</button></div>' : `<button id="pay-toll" class="primary-button" ${state.access.coins < state.access.price ? 'disabled' : ''}>Payer ${state.access.price} pièces</button>${state.access.coins < state.access.price ? '<p>Gagnez encore des pièces dans les laboratoires pour ouvrir ce passage.</p>' : ''}`}</section>` : '';
  const mysteryGate = mysteryLocked ? `<section class="toll-card paper-card"><span class="eyebrow">ACCÈS VERROUILLÉ · EDB</span><h2>La Clé Mystère</h2><p>${state.access.mysteryKeyOwned ? 'Vous possédez la Clé Mystère. Utilisez-la pour ouvrir cette salle définitivement.' : 'Achetez la Clé Mystère pour 500 pièces dans la Boutique de Bibi et Bobo, au Bureau Thésards.'}</p>${state.access.mysteryKeyOwned ? '<button id="use-mystery-key" class="primary-button">Utiliser la Clé Mystère</button>' : '<button id="go-thesards" class="secondary-button">Voir le Bureau Thésards</button>'}</section>` : '';
  const activities = locked || mysteryLocked ? '' : renderRoomActivities(room, {
    activeTab: state.roomTab, specialEvent: state.specialEvent, training: state.training, florentEvent: state.florentEvent,
    edbAccess: state.access, mageRobeOwned: state.gear?.inventory?.owned.includes('mage-noir'),
    shopkeepers: state.shopkeepers
  });
  const secret = state.secretEvent?.available && !locked && !mysteryLocked ? `<section class="secret-card paper-card"><span class="eyebrow">DÉCOUVERTE CACHÉE</span><h2>${escapeHtml(state.secretEvent.title)}</h2><p>${state.secretEvent.discovered ? `Vous avez découvert ${escapeHtml(state.secretEvent.className)}. Cette classe est proposée au niveau 35 si ce palier est encore libre.` : escapeHtml(state.secretEvent.prompt)}</p>${state.secretEvent.discovered ? '' : `<div class="secret-choices">${state.secretEvent.choices.map(choice => `<button type="button" class="secondary-button" data-secret-choice="${choice.id}">${escapeHtml(choice.label)}</button>`).join('')}</div><p class="event-result" id="secret-result" aria-live="polite"></p>`}</section>` : '';
  shell(`<section class="room-intro"><button id="back-map" class="text-button">← Retour à la carte</button><span class="eyebrow">${room.floor === 'rdc' ? 'REZ-DE-CHAUSSÉE' : '1ER ÉTAGE'}</span><h1>${escapeHtml(room.name)}</h1><p>${escapeHtml(room.description || (room.isToll ? 'Le passage de l’Aile Magnien mène à la Salle de réunion et au Bureau Kévin.' : room.slug === 'bureau-thesards' ? 'La Boutique de Bibi et Bobo vous attend dans ce bureau.' : 'Explorez le lieu, entraînez-vous et préparez-vous à la prochaine révélation.'))}</p></section>${mysteryLocked ? '' : `<section class="room-art paper-card">${image}</section>`}${toll}${mysteryGate}${activities}${state.roomNotice ? `<p class="event-result" role="status">${escapeHtml(state.roomNotice)}</p>` : ''}${secret}${bossBanner(state.world)}<p data-error class="form-error" hidden role="alert"></p>`, room.name);
  app.querySelector('#back-map').addEventListener('click', () => { state.screen = 'map'; setRoute(`#/carte/${room.floor}`); render(); });
  app.querySelector('#go-meeting')?.addEventListener('click', () => openRoom('salle-reunion').catch(errorLine));
  app.querySelector('#go-kevin')?.addEventListener('click', () => openRoom('bureau-kevin').catch(errorLine));
  app.querySelector('#go-thesards')?.addEventListener('click', () => openRoom('bureau-thesards').catch(errorLine));
  app.querySelector('#use-mystery-key')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { state.access = await api('/api/map/unlock-edb', { method: 'POST' }); render(); }
    catch (error) { errorLine(error); event.currentTarget.disabled = false; }
  });
  app.querySelector('#enter-cebb-basement')?.addEventListener('click', () => openRoom('sous-sol-cebb').catch(errorLine));
  app.querySelector('#start-edb-fight')?.addEventListener('click', event => beginFight(event, '/api/locations/edb/event/encounter'));
  app.querySelector('#claim-mage-robe')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { await api('/api/locations/sous-sol-cebb/claim-outfit', { method: 'POST' }); await loadGear(); render(); }
    catch (error) { errorLine(error); event.currentTarget.disabled = false; }
  });
  app.querySelector('#pay-toll')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { state.access = await api('/api/map/unlock-magnien', { method: 'POST' }); state.me = await api('/api/me'); render(); }
    catch (error) { errorLine(error); event.currentTarget.disabled = false; }
  });
  app.querySelector('#start-fight')?.addEventListener('click', event => {
    if (room.combatNotice) app.querySelector('#room-combat-notice').textContent = room.combatNotice;
    else beginFight(event, `/api/locations/${room.slug}/encounter`);
  });
  app.querySelector('#start-florent-fight')?.addEventListener('click', event => beginFight(event, '/api/locations/bureau-florent/event/encounter'));
  app.querySelector('#start-boss')?.addEventListener('click', event => beginFight(event, '/api/bosses/encounter'));
  app.querySelectorAll('[data-room-tab]').forEach(button => button.addEventListener('click', async () => {
    const tab = button.dataset.roomTab;
    if (tab === 'special' && !state.specialEvent?.opened) {
      button.disabled = true;
      try { state.specialEvent = await api(`/api/locations/${room.slug}/special/open`, { method: 'POST' }); }
      catch (error) { errorLine(error); button.disabled = false; return; }
    }
    state.roomTab = tab;
    render();
  }));
  app.querySelector('#kevin-interview')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      state.specialEvent = await api('/api/locations/bureau-kevin/special/answer', {
        method: 'POST', body: JSON.stringify({ answer: Number(form.elements.salary.value) })
      });
      if (state.specialEvent.completed) await loadGear();
      render();
    } catch (error) { errorLine(error); button.disabled = false; }
  });
  app.querySelector('#matthieu-dream')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      state.specialEvent = await api('/api/locations/bureau-matthieu/special/answer', {
        method: 'POST', body: JSON.stringify({ answer: form.elements.answer.value })
      });
      if (state.specialEvent.completed) await loadGear();
      render();
    } catch (error) { errorLine(error); button.disabled = false; }
  });
  app.querySelectorAll('[data-coa-choice]').forEach(button => button.addEventListener('click', async () => {
    app.querySelectorAll('[data-coa-choice]').forEach(item => { item.disabled = true; });
    try {
      const result = await api('/api/locations/bureau-coa/special/answer', {
        method: 'POST', body: JSON.stringify({ choice: button.dataset.coaChoice })
      });
      state.specialEvent = result;
      if (result.fight) { state.fight = result.fight; state.screen = 'combat'; }
      else if (!result.offered) { state.roomTab = 'combat'; state.roomNotice = result.message; }
      render();
    } catch (error) { errorLine(error); app.querySelectorAll('[data-coa-choice]').forEach(item => { item.disabled = false; }); }
  }));
  app.querySelectorAll('[data-server-choice]').forEach(button => button.addEventListener('click', async () => {
    app.querySelectorAll('[data-server-choice]').forEach(item => { item.disabled = true; });
    try {
      const result = await api('/api/locations/serveur/special/answer', {
        method: 'POST', body: JSON.stringify({ choice: button.dataset.serverChoice })
      });
      state.specialEvent = result;
      if (result.coinsGained) { state.me = await api('/api/me'); await loadWorld(); }
      if (result.fight) {
        state.fight = { ...result.fight, message: `${result.message} ${result.fight.message}` };
        state.screen = 'combat';
      } else if (!result.offered) {
        state.roomTab = 'combat';
        state.roomNotice = result.message;
      }
      render();
    } catch (error) { errorLine(error); app.querySelectorAll('[data-server-choice]').forEach(item => { item.disabled = false; }); }
  }));
  app.querySelector('#start-training')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try {
      state.training = await api('/api/locations/gym/training', { method: 'POST' });
      state.me = await api('/api/me');
      render();
      const result = app.querySelector('#training-result');
      if (result) result.textContent = `Entraînement terminé : +${state.training.xpGained} XP !`;
    } catch (error) { errorLine(error); event.currentTarget.disabled = false; }
  });
  app.querySelector('#open-shop')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { await loadSkills(); state.screen = 'shop'; render(); }
    catch (error) { errorLine(error); event.currentTarget.disabled = false; }
  });
  app.querySelectorAll('[data-secret-choice]').forEach(button => button.addEventListener('click', async () => {
    app.querySelectorAll('[data-secret-choice]').forEach(item => { item.disabled = true; });
    try {
      const result = await api(`/api/locations/${room.slug}/secret/answer`, { method: 'POST', body: JSON.stringify({ choiceId: button.dataset.secretChoice }) });
      if (result.unlocked) {
        state.secretEvent = await api(`/api/locations/${room.slug}/secret`);
        state.me = await api('/api/me');
        render();
      } else {
        app.querySelector('#secret-result').textContent = result.message;
        app.querySelectorAll('[data-secret-choice]').forEach(item => { item.disabled = false; });
      }
    } catch (error) {
      errorLine(error);
      app.querySelectorAll('[data-secret-choice]').forEach(item => { item.disabled = false; });
    }
  }));
}

async function beginFight(event, url) {
  event.currentTarget.disabled = true;
  try { state.fight = await api(url, { method: 'POST' }); state.screen = 'combat'; render(); }
  catch (error) { errorLine(error); event.currentTarget.disabled = false; }
}

function bestiaryScreen() {
  const monsters = state.bestiary;
  const overall = bestiaryCounts(monsters);
  const groups = [
    ['common', 'Communes'], ['room', 'Créatures de lieu'], ['boss', 'Boss']
  ];
  const category = state.bestiaryCategory;
  shell(`<section class="bestiary-intro"><button id="back-map" class="text-button">← Retour à la carte</button><span class="eyebrow">EXPLORATION · TB2026</span><h1>Bestiaire des laboratoires</h1><p>Les créatures communes parcourent tout le bâtiment. Les quatre créatures de lieu sont liées aux événements des salles ; les boss ne révèlent leur identité qu’après leur défaite collective.</p><div class="bestiary-progress"><strong>${overall.discovered} / ${overall.total}</strong><span>fiches révélées</span><small>${overall.defeated} adversaire${overall.defeated > 1 ? 's' : ''} vaincu${overall.defeated > 1 ? 's' : ''}</small></div></section><div class="bestiary-tabs" role="group" aria-label="Catégories du bestiaire">${groups.map(([id, label]) => { const count = bestiaryCounts(monsters.filter(monster => monster.category === id)); return `<button type="button" class="${category === id ? 'active' : ''}" data-bestiary-category="${id}" aria-pressed="${category === id}">${label} <small>${count.discovered}/${count.total}</small></button>`; }).join('')}</div><section class="bestiary-grid" aria-label="Fiches des créatures">${bestiaryCards(monsters, category)}</section><p data-error class="form-error" hidden role="alert"></p>`, 'Bestiaire');
  app.querySelector('#back-map').addEventListener('click', () => setRoute(`#/carte/${state.selectedFloor}`));
  app.querySelectorAll('[data-bestiary-category]').forEach(button => button.addEventListener('click', () => {
    state.bestiaryCategory = button.dataset.bestiaryCategory;
    render();
  }));
}

function leaderboardScreen() {
  const rows = state.leaderboard;
  shell(`<section class="bestiary-intro"><button id="back-map" class="text-button">← Retour à la carte</button><span class="eyebrow">LES CHERCHEURS · TB2026</span><h1>Classement des joueurs</h1><p>Classement par niveau, puis par expérience cumulée. Les nouveaux résultats apparaissent à chaque ouverture de cette page.</p></section><section class="leaderboard" aria-label="Classement des joueurs">${rows.length ? rows.map(row => `<div class="leaderboard-row ${row.isSelf ? 'leaderboard-row--self' : ''}"><strong class="leaderboard-rank">#${row.rank}</strong><span class="leaderboard-name">${escapeHtml(row.nickname)}${row.isSelf ? ' <small>Vous</small>' : ''}</span><span class="leaderboard-level">Niv. ${row.level}</span><span class="leaderboard-xp">${row.xp.toLocaleString('fr-FR')} XP</span></div>`).join('') : '<p>Aucun personnage créé pour le moment.</p>'}</section><p data-error class="form-error" hidden role="alert"></p>`, 'Classement');
  app.querySelector('#back-map').addEventListener('click', () => setRoute(`#/carte/${state.selectedFloor}`));
}

function wardrobeScreen() {
  const { catalog: items, inventory: bag } = state.gear;
  const order = ['outfit', 'weapon', 'accessory'];
  const labels = { outfit: 'Tenues', weapon: 'Armes', accessory: 'Accessoires' };
  const ownedItems = items.filter(item => bag.owned.includes(item.id));
  const returnToCharacter = state.equipmentReturn === 'character';
  shell(`<section class="map-intro"><div><span class="eyebrow">VOTRE INVENTAIRE</span><h1>Équipement</h1><p>Choisissez parmi les tenues, armes et accessoires que vous avez débloqués. Les bonus en % s’appliquent après les autres bonus et sont arrondis au point supérieur.</p></div><button id="back-equipment" class="secondary-button">Retour ${returnToCharacter ? 'au personnage' : 'à la carte'}</button></section>
    <section class="wardrobe-layout"><div class="wardrobe-preview paper-card"><span class="eyebrow">APERÇU DU PERSONNAGE</span>${avatar(state.me.presentation, state.me.portraitUrl, '', bag.equipped.outfit, bag.equipped)}<p><b>${escapeHtml(state.me.nickname)}</b></p></div>
    <div class="wardrobe-list">${order.map(slot => { const slotItems = ownedItems.filter(item => item.slot === slot); return `<section><h2>${labels[slot]}</h2>${slotItems.length ? `<div class="item-grid">${slotItems.map(item => {
      const equipped = bag.equipped[slot] === item.id;
      const locked = !!item.minLevel && state.me.progression.level < item.minLevel;
      const source = item.source === 'class' ? 'Classe' : item.source === 'combat' ? 'Combat' : item.source === 'starter' ? 'Départ' : item.source === 'shop-combat' ? 'Boutique ou combat' : 'Boutique';
      const picture = itemArt(item);
      return `<article class="item-card paper-card"><div class="item-art">${picture}</div><span class="item-origin">${source}</span><h3>${escapeHtml(item.name)}</h3><div class="item-bonuses">${itemBonuses(item) || '<span>Aucun bonus</span>'}</div><p>${escapeHtml(item.description)}</p>${item.minLevel ? `<span class="item-level${locked ? ' item-level--locked' : ''}">Niveau ${item.minLevel} requis</span>` : ''}<button class="secondary-button" data-item="${item.id}" data-action="equip" ${equipped || locked ? 'disabled' : ''}>${equipped ? 'Équipé' : locked ? `Disponible au niveau ${item.minLevel}` : 'Équiper'}</button></article>`;
    }).join('')}</div>` : `<p class="wardrobe-empty">Aucun ${slot === 'outfit' ? 'autre objet' : slot === 'weapon' ? 'arme' : 'accessoire'} débloqué pour le moment.</p>`}</section>`; }).join('')}</div></section><p data-error class="form-error" hidden role="alert"></p>`, 'Équipement');
  app.querySelector('#back-equipment').addEventListener('click', () => { state.screen = returnToCharacter ? 'character' : 'map'; if (!returnToCharacter) setRoute(`#/carte/${state.selectedFloor}`); render(); });
  app.querySelectorAll('[data-item]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await api(`/api/gear/${button.dataset.action}`, { method: 'POST', body: JSON.stringify({ itemId: button.dataset.item }) });
      await loadGear(); state.me = await api('/api/me'); render();
    } catch (error) { errorLine(error); button.disabled = false; }
  }));
}

const skillIcon = kind => kind === 'physical' ? '⚔' : kind === 'magic' ? '✦' : '⚗';
const skillFormula = move => Object.entries(move.scaling).map(([stat, factor]) => `${Math.round(factor * 100)} % ${({ attack: 'Attaque', magic: 'Intelligence', vitality: 'Vitalité', defense: 'Défense', aura: 'Aura' })[stat]}`).join(' + ');

function shopScreen() {
  const slotOrder = { outfit: 0, weapon: 1, accessory: 2 };
  const shopGear = state.gear.catalog.filter(item => ['shop', 'shop-combat'].includes(item.source))
    .sort((a, b) => slotOrder[a.slot] - slotOrder[b.slot] || (a.minLevel || 0) - (b.minLevel || 0));
  const level = state.me.progression.level;
  shell(`<section class="map-intro shop-intro"><div><span class="eyebrow">BUREAU THÉSARDS</span><h1>Boutique de Bibi et Bobo</h1><p>Vos pièces : <b>${state.me.coins} 🪙</b>. Les compétences achetées restent disponibles lors des prochains combats.</p></div>${shopkeeperPortraits(state.shopkeepers)}<button id="back-shop" class="secondary-button">← Retour au bureau</button></section>
    <section class="shop-section"><h2>Compétences mixtes</h2><div class="item-grid">${state.skills.shop.map(move => {
      const owned = state.skills.owned.includes(move.action);
      const locked = level < move.requiredLevel;
      return `<article class="item-card paper-card"><div class="shop-skill-icon" aria-hidden="true">${skillIcon(move.kind)}</div><span class="item-origin">Compétence mixte · niveau ${move.requiredLevel}</span><h3>${escapeHtml(move.label)}</h3><div class="item-bonuses"><span>${skillFormula(move)}</span><span>${move.cost} jauges</span></div><p>${escapeHtml(move.description)}</p><p class="shop-price">Prix : ${move.price} pièces</p><button class="secondary-button" data-buy-skill="${move.action}" ${owned || locked || state.me.coins < move.price ? 'disabled' : ''}>${owned ? 'Acquise' : locked ? `Niveau ${move.requiredLevel} requis` : `Acheter · ${move.price} pièces`}</button></article>`;
    }).join('')}</div></section>
    <section class="shop-section"><h2>Objet spécial</h2><div class="item-grid"><article class="item-card paper-card"><div class="shop-skill-icon" aria-hidden="true">⚿</div><span class="item-origin">Clé · accès permanent</span><h3>Clé Mystère</h3><p>Ouvre la salle EDB lorsque vous l'utilisez sur sa porte.</p><p class="shop-price">Prix : 500 pièces</p><button class="secondary-button" data-buy-mystery-key ${state.access.edbUnlocked || state.access.mysteryKeyOwned || state.me.coins < 500 ? 'disabled' : ''}>${state.access.edbUnlocked ? 'EDB ouvert' : state.access.mysteryKeyOwned ? 'Possédée' : 'Acheter · 500 pièces'}</button></article></div></section>
    <section class="shop-section"><h2>Équipement</h2><div class="item-grid">${shopGear.map(item => {
      const owned = state.gear.inventory.owned.includes(item.id);
      return `<article class="item-card paper-card"><div class="item-art">${itemArt(item)}</div><span class="item-origin">${item.slot === 'outfit' ? 'Tenue' : item.slot === 'weapon' ? 'Arme' : 'Accessoire'}${item.minLevel ? ` · niveau ${item.minLevel}` : ''}</span><h3>${escapeHtml(item.name)}</h3><div class="item-bonuses">${itemBonuses(item)}</div><p>${escapeHtml(item.description)}</p><p class="shop-price">Prix : ${item.price} pièces</p><button class="secondary-button" data-buy-item="${item.id}" ${owned || state.me.coins < item.price ? 'disabled' : ''}>${owned ? 'Possédé' : `Acheter · ${item.price} pièces`}</button></article>`;
    }).join('')}</div></section><p data-error class="form-error" hidden role="alert"></p>`, 'Boutique de Bibi et Bobo');
  app.querySelector('#back-shop').addEventListener('click', () => { state.screen = 'room'; render(); });
  app.querySelectorAll('[data-buy-skill], [data-buy-item], [data-buy-mystery-key]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      if (button.dataset.buySkill) await api('/api/skills/buy', { method: 'POST', body: JSON.stringify({ action: button.dataset.buySkill }) });
      else if (button.hasAttribute('data-buy-mystery-key')) state.access = await api('/api/map/buy-mystery-key', { method: 'POST' });
      else await api('/api/gear/buy', { method: 'POST', body: JSON.stringify({ itemId: button.dataset.buyItem }) });
      [state.me, state.gear, state.skills] = await Promise.all([api('/api/me'), api('/api/gear'), api('/api/skills')]);
      render();
    } catch (error) { errorLine(error); button.disabled = false; }
  }));
}

function eventScreen() {
  const item = state.event;
  shell(`<section class="welcome-card paper-card event-card"><span class="eyebrow">ÉVÉNEMENT SPÉCIAL · ${escapeHtml(locationBySlug(state.selectedLocation)?.name || 'LABORATOIRE')}</span><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.prompt)}</p>
    ${item.completed ? `<p class="event-result">${escapeHtml(item.hint)}</p>` : `<div class="event-choices">${item.choices.map(choice => `<button class="secondary-button" data-choice="${choice.id}">${escapeHtml(choice.label)}</button>`).join('')}</div><p id="event-result" class="event-result" aria-live="polite"></p>`}
    <button id="back-room" class="text-button">Retour à la salle</button><p data-error class="form-error" hidden role="alert"></p></section>`, 'Événement du laboratoire');
  app.querySelector('#back-room').addEventListener('click', () => { state.screen = 'room'; render(); });
  app.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const answer = await api(`/api/locations/${item.locationId}/event/answer`, { method: 'POST', body: JSON.stringify({ choiceId: button.dataset.choice }) });
      if (answer.correct) { state.me = await api('/api/me'); state.event = await api(`/api/locations/${item.locationId}/event`); render(); }
      else { app.querySelector('#event-result').textContent = answer.message; button.disabled = false; }
    } catch (error) { errorLine(error); button.disabled = false; }
  }));
}

function combatScreen() {
  const fight = state.fight;
  const playback = state.turnPlayback?.fightId === fight.id && state.turnPlayback?.turn === fight.turn ? state.turnPlayback : null;
  const revealingPlayer = playback?.phase === 'player';
  const shownFight = revealingPlayer ? { ...fight, playerHp: playback.feedback.playerHpAfterAction, status: 'active' } : fight;
  const done = fight.status !== 'active' && !revealingPlayer;
  const moveLocked = move => fight.level !== undefined && fight.level < move.requiredLevel;
  const moveUnavailable = move => moveLocked(move) || (move.source === 'shop' && !fight.unlockedSkills?.includes(move.action)) || fight.charge < move.cost;
  const visibleMoves = SPECIAL_MOVES.filter(move => !moveLocked(move));
  const knownMoves = visibleMoves.filter(move => move.source !== 'shop' || fight.unlockedSkills?.includes(move.action));
  const moveMenu = `<div class="move-menu move-menu--skills" data-move-menu="skills" hidden>${visibleMoves.length ? visibleMoves.map(move => {
    const detail = move.source === 'shop' && !fight.unlockedSkills?.includes(move.action) ? 'À acheter au Bureau Thésards' : `${skillFormula(move)} · ${move.cost} jauge${move.cost > 1 ? 's' : ''}`;
    return `<button type="button" data-action="${move.action}" class="move-option" ${moveUnavailable(move) ? 'disabled' : ''}><strong><span class="skill-kind" aria-label="${move.kind === 'physical' ? 'Physique' : move.kind === 'magic' ? 'Magique' : 'Mixte'}">${skillIcon(move.kind)}</span> ${escapeHtml(move.label)}</strong><span>${detail}</span><small>${escapeHtml(move.description)}</small></button>`;
  }).join('') : '<p>Première compétence débloquée au niveau 2.</p>'}</div>`;
  const gaugeMax = fight.maxCharge ?? gaugeForLevel(fight.level ?? 1).max;
  const gauge = `<div class="charge-meter" role="meter" aria-label="Jauge de compétences" aria-valuemin="0" aria-valuemax="${gaugeMax}" aria-valuenow="${fight.charge}"><span>Jauge ${fight.charge}/${gaugeMax}</span><div class="charge-pips">${Array.from({ length: gaugeMax }, (_, index) => `<i style="--fill:${Math.max(0, Math.min(100, (fight.charge - index) * 100))}%"></i>`).join('')}</div></div>`;
  const place = fight.kind === 'boss' ? { name: 'Défi collectif', floor: state.selectedFloor }
    : locationBySlug(fight.roomSlug) || locationByActivity(fight.chapter) || chapterInfo(fight.chapter);
  const collectiveFinale = fight.kind === 'boss' && fight.status === 'won' && state.world?.bosses.some(item => item.chapter === fight.bossChapter && item.status === 'revealed');
  const result = fight.status === 'won' ? `${fight.message} Vous gagnez ${fight.coinsGained ?? (fight.kind === 'boss' ? 8 : 5)} pièces${fight.xpGained ? ` et ${fight.xpGained} XP` : ''}.` : fight.message;
  shell(`<section class="combat-heading"><div><span class="eyebrow">COMBAT AU TOUR PAR TOUR · ${escapeHtml(place.name)}${fight.kind === 'boss' ? ` · BOSS NIV. ${fight.monsterLevel}` : ''}</span><h1>${escapeHtml(fight.monsterName)}</h1>${fight.kind === 'boss' ? `<small class="combat-boss-ability">${escapeHtml(fight.bossAbilityLabel)}</small>` : ''}</div>
    <span class="turn-tag">Tour ${fight.turn + 1}</span></section>
    <section class="battle-panel ${shownFight.status} ${fight.kind === 'event' ? 'battle-panel--event' : ''} ${collectiveFinale ? 'collective-finale' : ''}" ${place.image ? `style="background-image:linear-gradient(180deg,#0f2f3719 25%,#152b3569 100%),url('./assets/${escapeHtml(place.image)}')"` : ''} aria-label="Combat dans ${escapeHtml(place.name)}">
      <div class="battle-top"><div class="combatant-health"><b>${escapeHtml(state.me.nickname)}</b><span>${shownFight.playerHp} / ${fight.playerMaxHp} PV</span>
      <div class="health-track"><i style="width:${100 * shownFight.playerHp / fight.playerMaxHp}%"></i></div>${gauge}${fight.playerDefenseBuff || fight.playerAuraBuff ? '<small class="combat-status">◆ Défense et Aura +10 %</small>' : ''}${fight.playerDebuffTurns > 0 ? `<small class="combat-status">◆ Défense et Aura −20 % · ${fight.playerDebuffTurns} tours</small>` : ''}</div>
      <div class="combatant-health enemy-health"><b>${escapeHtml(fight.monsterName)}</b><span>${fight.monsterHp} / ${fight.monsterMaxHp} PV</span>
      <div class="health-track"><i style="width:${100 * fight.monsterHp / fight.monsterMaxHp}%"></i></div>${fight.bossShieldTurns > 0 ? '<small class="combat-status">◆ Bouclier : prochains dégâts reçus −50 %</small>' : ''}${fight.monsterDefenseDebuffTurns > 0 ? `<small class="combat-status">⚔ Défense −20 % · ${fight.monsterDefenseDebuffTurns} tours</small>` : ''}${fight.monsterAuraDebuffTurns > 0 ? `<small class="combat-status">✦ Aura −20 % · ${fight.monsterAuraDebuffTurns} tours</small>` : ''}</div></div>
      <div class="battle-actors">${avatar(state.me.presentation, state.me.portraitUrl, 'battle-avatar', state.me.outfitId, state.gear?.inventory.equipped)}
      ${fight.kind === 'boss' ? bossArt(fight.bossChapter, collectiveFinale ? state.world?.bosses.find(item => item.chapter === fight.bossChapter)?.identity?.portraitUrl : null, collectiveFinale ? state.world?.bosses.find(item => item.chapter === fight.bossChapter)?.identity?.name : null) : fight.monsterId ? `<div class="battle-monster${fight.kind === 'event' ? ' battle-monster--event' : ''}${(fight.monsterArtId || fight.monsterId).startsWith('event-octopus') ? ' battle-monster--wide' : ''}">${monsterArt(fight.monsterArtId || fight.monsterId, false, fight.monsterName, fight.monsterTier)}</div>` : '<div class="blob" role="img" aria-label="Monstre du laboratoire"><span>••<br>◡</span></div>'}</div>
      ${collectiveFinale ? '<div class="finale-banner" role="status"><span class="finale-sparks" aria-hidden="true">✦ ✦ ✦</span><strong>Attaque finale collective !</strong><small>Les contributions de l’équipe révèlent l’organisateur.</small></div>' : ''}
      <div class="battle-bottom">${playback ? `<div class="turn-feedback" aria-live="polite"><div class="turn-feedback-step turn-feedback-step--player"><strong>Votre action · ${escapeHtml(playback.feedback.action)}</strong><span>${playback.feedback.playerDamage ? `−${playback.feedback.playerDamage} PV au monstre` : 'Vous vous protégez ou vous préparez votre action.'}</span></div>${!revealingPlayer && playback.feedback.enemyActed ? `<div class="turn-feedback-step turn-feedback-step--enemy"><strong>Riposte de ${escapeHtml(fight.monsterName)}</strong><span>${playback.feedback.enemyDamage ? `−${playback.feedback.enemyDamage} PV pour vous` : 'Aucun dégât reçu'}</span><small>${escapeHtml(playback.feedback.enemyAction)}</small></div>` : ''}</div>${revealingPlayer && playback.feedback.enemyActed ? '<p class="battle-intention">La riposte arrive…</p>' : done ? `<p class="battle-intention">${escapeHtml(result)}</p>` : `<p class="battle-intention">${escapeHtml(fight.intention)}</p>`}` : `<p class="battle-message" aria-live="polite">${escapeHtml(done ? result : fight.message)}</p><p class="battle-intention">${done ? 'Combat terminé' : escapeHtml(fight.intention)}</p>`}</div></section>
    ${revealingPlayer ? '<div class="battle-actions battle-actions--finished"><span class="turn-wait">La riposte arrive…</span></div>' : done ? `<div class="battle-actions battle-actions--finished">${collectiveFinale || fight.kind === 'event' ? '' : '<button id="retry-fight" class="primary-button">Nouveau combat</button>'}<button id="back-map" class="secondary-button">${collectiveFinale ? 'Voir la révélation' : fight.kind === 'event' ? 'Retour à la salle' : 'Retour à la carte'}</button></div>`
      : `<div class="battle-actions" role="group" aria-label="Actions de combat">
      <button data-menu="attack" class="action-button attack" aria-expanded="false" aria-controls="attack-menu"><span aria-hidden="true">⚔</span><strong>Attaque</strong><small>Physique ou magique · +0,5 jauge</small></button>
      <button data-menu="skills" class="action-button technique" aria-expanded="false" aria-controls="skills-menu"><span aria-hidden="true">✦</span><strong>Compétences</strong><small>${knownMoves.length} débloquée${knownMoves.length > 1 ? 's' : ''}</small></button>
      <button data-action="guard" class="action-button guard"><span aria-hidden="true">◆</span><strong>Défense</strong><small>Protège · +1 jauge</small></button>
      <button id="retreat" class="action-button retreat"><span aria-hidden="true">↩</span><strong>Fuite</strong><small>${fight.kind === 'boss' ? 'Le boss bloque la sortie' : fight.unavoidable ? 'La créature bloque la sortie' : 'Quitter le combat'}</small></button></div>
      <div id="attack-menu" class="move-menu-wrap"><div class="move-menu" data-move-menu="attack" hidden><button type="button" data-action="attack_physical" class="move-option"><strong>⚔ Frappe Physique</strong><span>Basée sur l’Attaque · +0,5 jauge</span></button><button type="button" data-action="attack_magic" class="move-option"><strong>✦ Tir Magique</strong><span>Basé sur l’Intelligence · +0,5 jauge</span></button></div></div><div id="skills-menu" class="move-menu-wrap">${moveMenu}</div>`}
    <p data-error class="form-error" hidden role="alert"></p>`, place.name);
  app.querySelectorAll('[data-menu]').forEach(button => button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    app.querySelectorAll('[data-menu]').forEach(item => { item.setAttribute('aria-expanded', 'false'); item.classList.remove('selected'); });
    app.querySelectorAll('[data-move-menu]').forEach(item => { item.hidden = true; });
    if (!isOpen) {
      button.setAttribute('aria-expanded', 'true');
      button.classList.add('selected');
      app.querySelector(`[data-move-menu="${button.dataset.menu}"]`).hidden = false;
    }
  }));
  app.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', async () => {
    const actionLabel = button.querySelector('strong')?.textContent.trim() || button.textContent.trim();
    app.querySelectorAll('[data-action]').forEach(item => { item.disabled = true; });
    app.querySelectorAll('[data-menu], #retreat').forEach(item => { item.disabled = true; });
    try {
      state.fight = await api(`/api/encounters/${fight.id}/turn`, { method: 'POST', body: JSON.stringify({ turn: fight.turn, action: button.dataset.action }) });
      if (state.fight.status !== 'active') { state.me = await api('/api/me'); await loadGear(); await loadWorld(); }
      state.turnPlayback = { fightId: state.fight.id, turn: state.fight.turn, phase: 'player',
        feedback: turnFeedback(fight, state.fight, actionLabel) };
      render();
      const completedTurn = state.fight.turn;
      setTimeout(() => {
        if (state.screen === 'combat' && state.fight?.id === fight.id && state.fight.turn === completedTurn
          && state.turnPlayback?.phase === 'player') {
          state.turnPlayback.phase = 'settled';
          render();
        }
      }, 1100);
    } catch (error) {
      errorLine(error);
      app.querySelectorAll('[data-action]').forEach(item => {
        const move = SPECIAL_MOVES.find(entry => entry.action === item.dataset.action);
        item.disabled = !!move && moveUnavailable(move);
      });
      app.querySelectorAll('[data-menu], #retreat').forEach(item => { item.disabled = false; });
    }
  }));
  app.querySelector('#retry-fight')?.addEventListener('click', async () => {
    try { state.fight = await api(fight.kind === 'boss' ? '/api/bosses/encounter' : ['bureau-florent', 'edb'].includes(fight.roomSlug) ? `/api/locations/${fight.roomSlug}/event/encounter` : fight.roomSlug ? `/api/locations/${fight.roomSlug}/encounter` : `/api/locations/${fight.chapter}/encounter`, { method: 'POST' }); render(); }
    catch (error) { errorLine(error); }
  });
  app.querySelector('#retreat')?.addEventListener('click', async () => {
    try { await api(`/api/encounters/${fight.id}/retreat`, { method: 'POST' }); await loadWorld(); state.fight = null; setRoute(`#/carte/${place.floor || state.selectedFloor || 'rdc'}`); await syncRoute(); }
    catch (error) { if (fight.kind === 'boss' || fight.unavoidable) app.querySelector('.battle-message').textContent = error.message; errorLine(error); }
  });
  app.querySelector('#back-map')?.addEventListener('click', async () => { await loadWorld(); state.fight = null; setRoute(fight.kind === 'event' ? roomRoute(fight.roomSlug) : `#/carte/${place.floor || state.selectedFloor || 'rdc'}`); await syncRoute(); });
}

function render() {
  if (state.screen === 'login') loginScreen();
  else if (state.screen === 'character') characterScreen();
  else if (state.screen === 'map') mapScreen();
  else if (state.screen === 'room') roomScreen();
  else if (state.screen === 'wardrobe' && state.gear) wardrobeScreen();
  else if (state.screen === 'shop' && state.skills) shopScreen();
  else if (state.screen === 'event' && state.event) eventScreen();
  else if (state.screen === 'bestiary') bestiaryScreen();
  else if (state.screen === 'leaderboard') leaderboardScreen();
  else if (state.screen === 'combat' && state.fight) combatScreen();
  else shell('<section class="welcome-card paper-card"><h1>Chargement de l’aventure…</h1></section>');
  window.scrollTo(0, 0);
}

async function boot() {
  render();
  try {
    state.me = await api('/api/me'); await loadGear(); await loadPortraits(); await loadWorld();
    if (state.me.nickname) await syncRoute(); else state.screen = 'character';
    if (state.me.nickname) {
      state.fight = await api('/api/encounters/active');
      if (state.fight) state.screen = 'combat';
    }
  } catch { state.screen = 'login'; }
  render();
}

boot();
let bossRefreshPending = false;
setInterval(async () => {
  if (state.screen !== 'map' && state.screen !== 'room') return;
  const timer = app.querySelector('[data-boss-countdown]');
  if (!timer) return;
  const startsAt = Number(timer.dataset.bossCountdown);
  timer.textContent = formatBossCountdown(startsAt);
  if (Date.now() < startsAt || bossRefreshPending) return;
  bossRefreshPending = true;
  try { await loadWorld(); render(); }
  catch { /* réessayer à la prochaine seconde */ }
  finally { bossRefreshPending = false; }
}, 1000);
window.addEventListener('hashchange', () => {
  if (state.me?.nickname && state.world && state.screen !== 'combat' && state.screen !== 'event') {
    syncRoute().catch(errorLine);
  }
});
setInterval(async () => {
  if (state.screen !== 'map' && state.screen !== 'room') return;
  try {
    const previous = JSON.stringify(state.world?.bosses);
    const previousAccess = JSON.stringify(state.access);
    await loadWorld();
    if (state.me) state.me.coins = state.access.coins;
    if (JSON.stringify(state.world.bosses) !== previous || JSON.stringify(state.access) !== previousAccess) render();
  } catch { /* retry on the next interval */ }
}, 15000);
