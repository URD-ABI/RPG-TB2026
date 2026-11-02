import { browserSupabaseApi } from './supabase-api.js';

const app = document.querySelector('#admin-app');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const remoteApi = browserSupabaseApi('admin');
let secret = remoteApi ? '' : sessionStorage.getItem('tb2026_admin_secret') || '';
let bossData = [];
let contentData = null;
let magnienPrice = 20;
let portraitData = null;
const localDateTime = value => value ? new Date(value - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';

async function adminApi(path, options = {}) {
  if (remoteApi) return remoteApi.request(path, options);
  const response = await fetch(path, { ...options, headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', ...options.headers } });
  const data = response.headers.get('content-type')?.includes('json') ? await response.json() : null;
  if (!response.ok) throw new Error(data?.error || `Erreur ${response.status}`);
  return data;
}

function message(value, error = false) {
  const box = app.querySelector('#admin-message');
  if (box) { box.textContent = value; box.className = error ? 'form-error' : 'event-result'; }
}

function login() {
  app.innerHTML = `<header class="site-header"><div class="brand">✦ TB<span class="brand-year">2026</span></div><span class="header-subtitle">Administration</span></header>
    <main class="page-shell"><section class="welcome-card paper-card"><span class="eyebrow">ACCÈS ORGANISATION</span><h1>Administration</h1><p>${remoteApi ? 'Connectez-vous avec votre compte administrateur TB2026.' : 'Saisissez le secret administrateur configuré sur le serveur.'}</p>
    <form id="admin-login" class="form-stack">${remoteApi ? '<label for="email">Adresse e-mail</label><input id="email" name="email" type="email" autocomplete="username" required>' : ''}<label for="secret">${remoteApi ? 'Mot de passe' : 'Secret administrateur'}</label><input id="secret" type="password" autocomplete="${remoteApi ? 'current-password' : 'off'}" required><button class="primary-button">Ouvrir</button></form>
    <p id="admin-message" role="alert"></p></section></main>`;
  app.querySelector('#admin-login').addEventListener('submit', async event => {
    event.preventDefault();
    if (!remoteApi) secret = app.querySelector('#secret').value;
    try {
      if (remoteApi) await remoteApi.signInAdmin(app.querySelector('#email').value, app.querySelector('#secret').value);
      await load();
      if (!remoteApi) sessionStorage.setItem('tb2026_admin_secret', secret);
      render();
    }
    catch (error) { message(error.message, true); }
  });
}

async function load() {
  const [bosses, content, toll, portraitSelection] = await Promise.all([
    adminApi('/api/admin/bosses'), adminApi('/api/admin/content'),
    adminApi('/api/admin/magnien-price'), adminApi('/api/admin/portraits')
  ]);
  bossData = bosses.bosses; contentData = content;
  magnienPrice = toll.price; portraitData = portraitSelection;
}

function render() {
  const nextBoss = bossData.find(boss => boss.status === 'scheduled') || bossData.find(boss => boss.status === 'locked' && (boss.chapter === 1 || bossData[boss.chapter - 2].status === 'revealed'));
  const mayActivate = !bossData.some(boss => boss.status === 'active');
  app.innerHTML = `<header class="site-header"><div class="brand">✦ TB<span class="brand-year">2026</span></div><span class="header-subtitle">Administration</span><button id="logout" class="secondary-button">Fermer</button></header>
    <main class="page-shell admin-page"><span class="eyebrow">ORGANISATION DU JEU</span><h1>Préparer l’aventure</h1><p id="admin-message" role="status"></p>
    <section class="paper-card admin-section"><h2>Invitations personnelles</h2><p>Créez jusqu’à 30 codes. Copiez les nouveaux codes dès leur affichage.</p><form id="invites-form" class="admin-inline"><label for="invite-count">Nombre de codes</label><input id="invite-count" type="number" min="1" max="30" value="1"><button class="primary-button">Créer</button></form><pre id="invite-results" hidden></pre></section>
    <section class="paper-card admin-section"><h2>Têtes disponibles à la création</h2><p>Cochez uniquement les personnes qui souhaitent jouer. La sélection enregistrée s’applique aux nouveaux personnages ; les joueurs déjà créés gardent leur tête.</p>${portraitData.configured ? '' : '<p>Aucune tête n’est disponible avant votre première sélection. Cochez les volontaires et enregistrez.</p>'}
      <form id="portrait-selection-form"><div class="admin-portrait-grid">${portraitData.portraits.map(portrait => `<label class="admin-portrait-choice"><input type="checkbox" name="portrait" value="${escapeHtml(portrait.id)}" ${portrait.enabled ? 'checked' : ''}><span>${escapeHtml(portrait.name)}</span></label>`).join('')}</div>
      <div class="admin-portrait-actions"><button type="button" class="secondary-button" id="clear-portraits">Tout désélectionner</button><button type="button" class="secondary-button" id="select-portraits">Tout sélectionner</button><button class="primary-button" type="submit">Enregistrer la sélection</button><span id="portrait-selected-count" role="status"></span></div></form></section>
    <section class="paper-card admin-section"><h2>Péage de l’Aile Magnien</h2><p>Prix payé une seule fois par participant pour ouvrir la Salle de réunion. Les accès déjà achetés restent valables.</p><form id="magnien-form" class="admin-inline"><label for="magnien-price">Prix en pièces</label><input id="magnien-price" type="number" min="0" max="1000" step="1" value="${magnienPrice}" required><button class="secondary-button">Enregistrer le prix</button></form></section>
    <section class="admin-section"><h2>Boss et révélations</h2><p>Configurez l’organisateur puis programmez son arrivée. Le compte à rebours et le combat seront accessibles dans toutes les salles. Chaque boss attend la victoire sur le précédent ; les identités restent cachées jusqu’à la victoire collective.</p><div class="admin-boss-grid">${bossData.map(boss => `<form class="paper-card admin-boss" data-chapter="${boss.chapter}"><span class="eyebrow">BOSS ${boss.chapter} · ${boss.status === 'revealed' ? 'révélé' : boss.status === 'active' ? 'en jeu' : boss.status === 'scheduled' ? 'programmé' : 'en attente'}</span><h3>Organisateur mystère</h3>
      <p class="admin-boss-profile"><b>Niv. ${boss.profile.level}</b> · Vit ${boss.profile.vitality} · Att ${boss.profile.attack} · Déf ${boss.profile.defense} · Int ${boss.profile.intelligence} · Aura ${boss.profile.aura}<br>${escapeHtml(boss.profile.abilityLabel)}<br>${boss.profile.xp} XP · ${boss.profile.coins} pièces par victoire individuelle</p>
      <label>Nom<input name="name" maxlength="80" required value="${escapeHtml(boss.identity.name)}"></label>
      <label>Rôle<input name="role" maxlength="80" value="${escapeHtml(boss.identity.role)}"></label>
      <label>Message<textarea name="message" maxlength="500" rows="3">${escapeHtml(boss.identity.message)}</textarea></label>
      <p>Visage révélé après la victoire collective : <b>${escapeHtml(boss.headName)}</b>.</p>
      <div class="admin-inline"><label>PV communs<input name="maxHp" type="number" min="25" max="1000" value="${boss.maxHp}"></label><label>Contributeurs requis<input name="minContributors" type="number" min="1" max="30" value="${boss.minContributors}"></label></div>
      <button class="primary-button">Enregistrer ce boss</button>
      ${boss.status === 'locked' || boss.status === 'scheduled' ? `<div class="admin-activation"><label>Arrivée prévue<input name="startsAt" type="datetime-local" required value="${localDateTime(boss.startsAt)}"></label><button type="button" class="secondary-button" data-activate ${!mayActivate || nextBoss?.chapter !== boss.chapter || !boss.identity.name ? 'disabled' : ''}>${boss.status === 'scheduled' ? 'Modifier l’heure' : 'Programmer ce boss'}</button>${boss.status === 'scheduled' ? `<small>Apparition prévue le ${new Date(boss.startsAt).toLocaleString('fr-FR')}.</small>` : ''}${!boss.identity.name ? '<small>Enregistrez d’abord son identité.</small>' : ''}</div>` : `<p class="admin-boss-location">${boss.status === 'active' ? 'Boss actif dans toutes les salles.' : 'Identité révélée.'}</p>`}</form>`).join('')}</div></section>
    <section class="paper-card admin-section"><h2>Événements spéciaux</h2><p>Un onglet rare peut apparaître au Bureau Kévin, au Bureau Matthieu ou au Bureau CoA avec 15 % de chance à chaque entrée. Au Bureau Kévin, une mauvaise réponse à l’entretien lance un délai de 24 h ; une bonne réponse accorde définitivement la tenue et l’arme du Directeur Adjoint. Au Bureau CoA, deux choix Oui/Non autour des dessins du tableau mènent à un combat spécial provisoire ; un refus ferme l’événement pendant 24 h. Au Bureau Matthieu, l’ouverture de l’onglet lance le délai de 24 h. Deux salles supplémentaires seront choisies plus tard.</p></section>
    <section class="admin-section"><h2>Objets et boutique</h2><div class="admin-boss-grid">${contentData.items.map(item => `<form class="paper-card admin-boss" data-content-item="${item.id}"><span class="eyebrow">${item.slot}</span>
      <label>Nom<input name="itemName" maxlength="80" required value="${escapeHtml(item.name)}"></label>
      <label>Description<input name="itemDescription" maxlength="160" required value="${escapeHtml(item.description)}"></label>
      <label>Prix en pièces<input name="itemPrice" type="number" min="${['shop','shop-combat'].includes(item.source) ? 1 : 0}" max="${['shop','shop-combat'].includes(item.source) ? 100000 : 0}" value="${item.price}"></label>
      ${[['vitality','Vitalité'],['attack','Attaque'],['defense','Défense'],['intelligence','Intelligence'],['aura','Aura']].map(([stat,label]) => `<label>Bonus ${label}<input name="${stat}" type="number" min="0" max="50" value="${item[stat] || 0}"></label>`).join('')}
      ${item.slot === 'accessory' ? [['vitality','Vitalité'],['attack','Attaque'],['defense','Défense'],['intelligence','Intelligence'],['aura','Aura']].map(([stat,label]) => `<label>Bonus % ${label}<input name="${stat}Percent" type="number" min="0" max="100" value="${item[`${stat}Percent`] || 0}"></label>`).join('') : ''}
      ${item.health ? `<label>Bonus PV hérité<input name="health" type="number" min="0" max="200" value="${item.health}"></label>` : ''}
      <button class="primary-button">Enregistrer cet objet</button></form>`).join('')}</div></section>
    <section class="paper-card admin-section"><h2>Portraits des participants</h2><button id="load-players" class="secondary-button">Afficher les participants</button><div id="players"></div></section></main>`;
  app.querySelector('#logout').addEventListener('click', async () => {
    if (remoteApi) await remoteApi.signOut();
    else { secret = ''; sessionStorage.removeItem('tb2026_admin_secret'); }
    login();
  });
  const portraitForm = app.querySelector('#portrait-selection-form');
  const portraitChecks = [...portraitForm.querySelectorAll('input[name="portrait"]')];
  const updatePortraitCount = () => { app.querySelector('#portrait-selected-count').textContent = `${portraitChecks.filter(input => input.checked).length} tête(s) sélectionnée(s)`; };
  portraitChecks.forEach(input => input.addEventListener('change', updatePortraitCount));
  app.querySelector('#clear-portraits').addEventListener('click', () => { portraitChecks.forEach(input => { input.checked = false; }); updatePortraitCount(); });
  app.querySelector('#select-portraits').addEventListener('click', () => { portraitChecks.forEach(input => { input.checked = true; }); updatePortraitCount(); });
  portraitForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      portraitData = await adminApi('/api/admin/portraits', { method: 'PUT', body: JSON.stringify({ enabledIds: portraitChecks.filter(input => input.checked).map(input => input.value) }) });
      message(`${portraitData.portraits.filter(portrait => portrait.enabled).length} tête(s) disponible(s) à la création.`);
    } catch (error) { message(error.message, true); }
  });
  updatePortraitCount();
  app.querySelector('#invites-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const count = Number(app.querySelector('#invite-count').value);
      const result = await adminApi('/api/admin/invites', { method: 'POST', body: JSON.stringify({ count }) });
      const output = app.querySelector('#invite-results'); output.hidden = false;
      output.textContent = result.invites.map(item => `Participant ${item.participantId} : ${item.code}`).join('\n');
      message(`${result.invites.length} code(s) créés. Copiez-les maintenant.`);
    } catch (error) { message(error.message, true); }
  });
  app.querySelector('#magnien-form').addEventListener('submit', async event => {
    event.preventDefault();
    try { await adminApi('/api/admin/magnien-price', { method: 'PUT', body: JSON.stringify({ price: Number(app.querySelector('#magnien-price').value) }) }); await load(); render(); message('Prix du péage enregistré.'); }
    catch (error) { message(error.message, true); }
  });
  app.querySelectorAll('.admin-boss[data-chapter]').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    const chapter = Number(form.dataset.chapter), fields = form.elements;
    try {
      await adminApi(`/api/admin/bosses/${chapter}`, { method: 'PUT', body: JSON.stringify({ name: fields.name.value, role: fields.role.value, message: fields.message.value, maxHp: Number(fields.maxHp.value), minContributors: Number(fields.minContributors.value) }) });
      await load(); render(); message(`Boss du chapitre ${chapter} enregistré.`);
    } catch (error) { message(error.message, true); }
  }));
  app.querySelectorAll('[data-activate]').forEach(button => button.addEventListener('click', async () => {
    const form = button.closest('[data-chapter]');
    const chapter = Number(form.dataset.chapter);
    const startsAt = new Date(form.elements.startsAt.value).getTime();
    try {
      await adminApi(`/api/admin/bosses/${chapter}/activate`, { method: 'POST', body: JSON.stringify({ startsAt }) });
      await load(); render(); message(`Arrivée du boss ${chapter} programmée.`);
    } catch (error) { message(error.message, true); }
  }));
  app.querySelectorAll('[data-content-item]').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = form.dataset.contentItem, item = contentData.items.find(entry => entry.id === id), f = form.elements;
    const payload = { name: f.itemName.value, description: f.itemDescription.value, price: Number(f.itemPrice.value),
      ...Object.fromEntries(['vitality', 'attack', 'defense', 'intelligence', 'aura'].map(stat => [stat, Number(f[stat].value)])),
      health: Number(f.health?.value || 0),
      ...(item.slot === 'accessory' ? Object.fromEntries(['vitality', 'attack', 'defense', 'intelligence', 'aura'].map(stat => [`${stat}Percent`, Number(f[`${stat}Percent`].value)])) : {}) };
    try { await adminApi(`/api/admin/content/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); await load(); render(); message(`Objet ${id} enregistré.`); }
    catch (error) { message(error.message, true); }
  }));
  app.querySelector('#load-players').addEventListener('click', showPlayers);
}

async function showPlayers() {
  try {
    const players = (await adminApi('/api/admin/players')).players;
    app.querySelector('#players').innerHTML = `<div class="admin-player-list">${players.map(player => `<div class="admin-player" data-player="${player.id}"><b>${escapeHtml(player.nickname || `Participant ${player.id}`)}</b><span>${player.portraitId ? `Tête illustrée : ${escapeHtml(player.portraitId)}` : player.hasPortrait ? 'Ancien portrait' : 'Sans portrait'}</span>${player.hasPortrait ? `<button class="secondary-button" data-show>Voir</button>${player.canDeletePortrait ? '<button class="text-button" data-delete>Supprimer le portrait</button>' : ''}<img hidden alt="Portrait du participant">` : ''}</div>`).join('')}</div>`;
    app.querySelectorAll('[data-show]').forEach(button => button.addEventListener('click', async () => {
      const id = button.closest('[data-player]').dataset.player;
      try {
        const blob = remoteApi
          ? await remoteApi.request(`/api/admin/players/${id}/portrait`, { binary: true })
          : await (async () => {
            const response = await fetch(`/api/admin/players/${id}/portrait`, { headers: { Authorization: `Bearer ${secret}` } });
            if (!response.ok) throw new Error('Portrait indisponible.');
            return response.blob();
          })();
        const img = button.closest('[data-player]').querySelector('img');
        img.src = URL.createObjectURL(blob); img.hidden = false;
      } catch (error) { message(error.message, true); }
    }));
    app.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => {
      const id = button.closest('[data-player]').dataset.player;
      try { await adminApi(`/api/admin/players/${id}/portrait`, { method: 'DELETE' }); await showPlayers(); message('Portrait supprimé.'); }
      catch (error) { message(error.message, true); }
    }));
  } catch (error) { message(error.message, true); }
}

if (remoteApi || secret) load().then(render).catch(login); else login();
