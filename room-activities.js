const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export function shopkeeperPortraits(urls = {}) {
  return `<div class="shopkeepers" aria-label="Boris et Bilal, les visages de la boutique">
    <img src="${escapeHtml(urls.Boris || '/api/portraits/Boris.png')}" alt="Boris">
    <img src="${escapeHtml(urls.Bilal || '/api/portraits/Bilal.png')}" alt="Bilal">
  </div>`;
}

export function renderRoomActivities(room, { activeTab = 'combat', specialEvent = null, training = null, watering = null, florentEvent = null, edbAccess = null, mageRobeOwned = false, shopkeepers = {} } = {}) {
  if (room.slug === 'edb') {
    const panel = edbAccess?.basementUnlocked
      ? '<p>Quentin Dahmer a été vaincu. Un passage vers le Sous-sol du CEBB est maintenant ouvert.</p><button id="enter-cebb-basement" class="primary-button">Descendre au sous-sol →</button>'
      : '<span class="eyebrow">ÉVÉNEMENT · EDB</span><h2>Le fou du bus</h2><p>Un type louche vous regarde droit dans le yeux sans jamais cligner.</p><button id="start-edb-fight" class="primary-button">Combattre</button>';
    return `<section class="room-activities"><section class="room-tab-panel paper-card">${panel}</section></section>`;
  }
  if (room.slug === 'sous-sol-cebb') {
    const panel = mageRobeOwned
      ? '<span class="eyebrow">TRÉSOR DU SOUS-SOL</span><h2>Robe du Mage Noir</h2><p>Vous avez déjà récupéré cette tenue. Elle est disponible dans votre équipement.</p>'
      : '<span class="eyebrow">TRÉSOR DU SOUS-SOL</span><h2>Robe du Mage Noir</h2><p>Une robe sombre repose sur l’établi.</p><button id="claim-mage-robe" class="primary-button">Récupérer la tenue</button>';
    return `<section class="room-activities"><section class="room-tab-panel paper-card">${panel}</section></section>`;
  }
  if (room.slug === 'bureau-florent') {
    const description = "Une énergie négative sans commune mesure émerge pour prendre possession de la pièce, laissant apparaître le fantôme d'un être capable de faire disparaître le bonheur par sa seule présence. Êtes-vous prêt à affronter cette menace pour éviter qu'elle ne revienne parmi nous et menace de nouveau l'équilibre du laboratoire ?";
    const panel = florentEvent?.unlocked
      ? `<span class="eyebrow">ÉVÉNEMENT SPÉCIAL · BUREAU FLORENT</span><h2>Fantôme du passé</h2><p>${escapeHtml(description)}</p><button id="start-florent-fight" class="primary-button">Combattre</button>`
      : `<p>Désolé, le Directeur est absent pour le moment, merci de revenir ultérieurement.</p>`;
    const reward = watering?.xpReward || 0;
    const wateringPanel = `<div class="florent-watering"><h2>Arroser les plantes</h2><p>Arrosez les plantes pour gagner 50 % de l’XP nécessaire au prochain niveau${reward ? ` : <b>${reward} XP</b>` : ''}.</p>${watering?.available ? '<button id="water-plants" class="primary-button">Arroser les plantes</button>' : reward === 0 ? `<p>${watering?.levelCap < 50 ? `Plafond niveau ${watering.levelCap} atteint : attendez la défaite du prochain boss collectif.` : 'Vous avez atteint le niveau maximal.'}</p>` : `<p class="training-cooldown">Prochain arrosage : ${new Date(watering.nextAvailableAt).toLocaleString('fr-FR')}.</p>`}<p id="watering-result" class="event-result" role="status"></p></div>`;
    return `<section class="room-activities"><section class="room-tab-panel paper-card">${panel}${wateringPanel}</section></section>`;
  }
  const tabs = [{ id: 'combat', label: 'Combat' }];
  if (room.slug === 'bureau-thesards') tabs.push({ id: 'shop', label: 'Boutique de Bibi et Bobo' });
  if (room.slug === 'gym') tabs.push({ id: 'training', label: 'Entraînement' });
  if (specialEvent?.offered) tabs.push({ id: 'special', label: 'Événement spécial ✦' });
  const selected = tabs.some(tab => tab.id === activeTab) ? activeTab : 'combat';
  const tabButtons = tabs.map(tab => `<button type="button" id="room-tab-${tab.id}" role="tab" data-room-tab="${tab.id}" aria-selected="${tab.id === selected}" aria-controls="room-tab-panel" class="${tab.id === selected ? 'active' : ''}">${escapeHtml(tab.label)}</button>`).join('');
  let panel;
  if (selected === 'shop') {
    panel = `<div class="shop-room-promo"><div><span class="eyebrow">BUREAU THÉSARDS</span><h2>Boutique de Bibi et Bobo</h2><p>Échangez vos pièces contre de l’équipement et les compétences mixtes.</p><button id="open-shop" class="primary-button">Entrer dans la boutique →</button></div>${shopkeeperPortraits(shopkeepers)}</div>`;
  } else if (selected === 'training') {
    const reward = training?.xpReward || 0;
    panel = `<span class="eyebrow">LOCAL POUBELLES · UNE FOIS TOUTES LES 24 H</span><h2>Entraînement</h2><p>Cette séance donne 50 % de l’XP nécessaire pour passer du niveau ${training?.level || 1} au suivant : <b>${reward} XP</b>.</p>${reward === 0 ? `<p>${training?.levelCap < 50 ? `Plafond niveau ${training.levelCap} atteint : attendez la défaite du prochain boss collectif.` : 'Vous avez atteint le niveau maximal.'}</p>` : training?.available ? '<button id="start-training" class="primary-button">Faire l’entraînement</button>' : `<p class="training-cooldown">Prochaine séance : ${new Date(training?.nextAvailableAt).toLocaleString('fr-FR')}.</p>`}<p id="training-result" class="event-result" role="status"></p>`;
  } else if (selected === 'special') {
    if (room.slug === 'bureau-coa') {
      const prompt = specialEvent.stage === 2
        ? "Vous êtes resté trop longtemps en ce lieu, un monstre insoupçonné risque de s'en prendre à vous. Voulez-vous l'affronter ?"
        : 'Voulez-vous observer les dessins sur le tableau ?';
      const choices = specialEvent.opened
        ? `<p class="coa-event-question">${escapeHtml(prompt)}</p><div class="coa-event-choices"><button type="button" class="primary-button" data-coa-choice="yes">Oui</button><button type="button" class="secondary-button" data-coa-choice="no">Non</button></div>`
        : '<p>Ouverture de l’événement…</p>';
      panel = `<span class="eyebrow">ÉVÉNEMENT SPÉCIAL · ${escapeHtml(room.name)}</span><h2>${escapeHtml(specialEvent.title)}</h2><p>${escapeHtml(specialEvent.description)}</p>${choices}`;
    } else if (room.slug === 'serveur') {
      const prompt = specialEvent.stage === 2
        ? "Vous remarquez un ordinateur étrange sur lequel s'accumulent des calculs. En parcourant la page, vous comprenez que l'ordinateur mine du Bitcoin. Souhaitez-vous récupérer l'argent ?"
        : specialEvent.description;
      const choices = specialEvent.opened
        ? `<p class="coa-event-question">${escapeHtml(prompt)}</p><div class="coa-event-choices"><button type="button" class="primary-button" data-server-choice="yes">Oui</button><button type="button" class="secondary-button" data-server-choice="no">Non</button></div>`
        : '<p>Ouverture de l’événement…</p>';
      panel = `<span class="eyebrow">ÉVÉNEMENT SPÉCIAL · ${escapeHtml(room.name)}</span><h2>${escapeHtml(specialEvent.title)}</h2>${choices}`;
    } else if (room.slug === 'bureau-kevin') {
      const result = specialEvent.message ? `<p class="event-result" role="status">${escapeHtml(specialEvent.message)}</p>` : '';
      const reward = specialEvent.outcome === 'success' ? '<p>Tenue et arme du Directeur Adjoint débloquées dans votre équipement.</p>' : '';
      const cooldown = specialEvent.outcome === 'failure' ? `<p class="small-note">Nouvelle tentative possible après le ${new Date(specialEvent.nextAvailableAt).toLocaleString('fr-FR')}.</p>` : '';
      const question = specialEvent.opened && !specialEvent.completed && !specialEvent.outcome
        ? `<p>${escapeHtml(specialEvent.prompt)}</p><form id="kevin-interview" class="kevin-interview"><label for="kevin-salary">Vos prétentions salariales</label><div><input id="kevin-salary" name="salary" type="number" inputmode="numeric" min="0" step="1" required placeholder="Montant en chiffres"><button type="submit" class="primary-button">Répondre →</button></div></form>`
        : '';
      panel = `<span class="eyebrow">ÉVÉNEMENT SPÉCIAL · ${escapeHtml(room.name)}</span><h2>${escapeHtml(specialEvent.title)}</h2>${specialEvent.opened ? `<p>${escapeHtml(specialEvent.description)}</p>${question}${result}${reward}${cooldown}` : '<p>Ouverture de l’événement…</p>'}`;
    } else if (room.slug === 'bureau-matthieu') {
      const result = specialEvent.message ? `<p class="event-result" role="status">${escapeHtml(specialEvent.message)}</p>` : '';
      const reward = specialEvent.completed ? '<p>Tenue du Roi des Pirates et sabre du corsaire débloqués dans votre équipement.</p>' : '';
      const cooldown = specialEvent.outcome === 'failure' ? `<p class="small-note">Nouvelle chance d’apparition après le ${new Date(specialEvent.nextAvailableAt).toLocaleString('fr-FR')}.</p>` : '';
      const question = specialEvent.opened && !specialEvent.completed && !specialEvent.outcome
        ? '<form id="matthieu-dream" class="special-answer-form"><label for="dream-answer">Votre rêve le plus cher</label><div><input id="dream-answer" name="answer" type="text" maxlength="200" required placeholder="Écrivez votre réponse"><button type="submit" class="primary-button">Voici mon rêve</button></div></form>'
        : '';
      panel = `<span class="eyebrow">ÉVÉNEMENT SPÉCIAL · ${escapeHtml(room.name)}</span><h2>${escapeHtml(specialEvent.title)}</h2>${specialEvent.opened ? `<p>${escapeHtml(specialEvent.description)}</p>${question}${result}${reward}${cooldown}` : '<p>Ouverture de l’événement…</p>'}`;
    } else {
      panel = `<span class="eyebrow">ÉVÉNEMENT SPÉCIAL · ${escapeHtml(room.name)}</span><h2>${escapeHtml(specialEvent.title)}</h2>${specialEvent.opened ? `<p>${escapeHtml(specialEvent.description)}</p><p class="event-result">Vous pourrez découvrir un nouvel événement dans cette salle après 24 h.</p>` : '<p>Ouverture de l’événement…</p>'}`;
    }
  } else {
    panel = room.combatNotice
      ? '<span class="eyebrow">COMBAT · SALLE DE RÉUNION</span><h2>Combat</h2><button id="start-fight" class="primary-button">Lancer un combat ⚔</button><p id="room-combat-notice" class="event-result" role="status"></p>'
      : '<span class="eyebrow">COMBAT CLASSIQUE</span><h2>Créatures du bâtiment</h2><p>Affrontez une créature commune du bestiaire proche de votre niveau. Chaque victoire donne 10 % de chance de trouver un équipement accessible à votre niveau, dans toutes les salles.</p><button id="start-fight" class="primary-button">Lancer un combat ⚔</button>';
  }
  return `<section class="room-activities"><div class="room-tabs" role="tablist" aria-label="Activités de ${escapeHtml(room.name)}">${tabButtons}</div><section id="room-tab-panel" class="room-tab-panel paper-card" role="tabpanel" aria-labelledby="room-tab-${selected}">${panel}</section></section>`;
}
