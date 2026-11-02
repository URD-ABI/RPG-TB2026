import { bossArt } from './boss-art.js';

export function formatBossCountdown(startsAt, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((startsAt - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const remainingSeconds = seconds % 60;
  return `${String(days).padStart(2, '0')}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(remainingSeconds).padStart(2, '0')}s`;
}

export function bossBanner(world, now = Date.now()) {
  const bosses = world?.bosses || [];
  const active = world?.active;
  const scheduled = !active && bosses.find(boss => boss.status === 'scheduled');
  const revealed = bosses.filter(boss => boss.status === 'revealed').length;
  const chapter = active?.chapter || scheduled?.chapter || Math.min(5, revealed + 1);
  let content;
  if (active) {
    content = `<h2>Le boss est apparu !</h2><p>${active.contributors} / ${active.minContributors} participants ont contribué. Votre contribution : ${active.myWins || 0} victoire${active.myWins === 1 ? '' : 's'}.</p><div class="health-track boss-track"><i style="width:${100 * active.hp / active.maxHp}%"></i></div><p><b>${active.hp} / ${active.maxHp} PV collectifs · ${active.contributors} / ${active.minContributors} participants</b></p><button id="start-boss" class="primary-button">Combattre le boss ✦</button>`;
  } else if (scheduled) {
    content = `<h2>Arrivée du boss ${chapter}</h2><p>Un organisateur mystère approche. Préparez votre équipe !</p><time class="boss-countdown" role="timer" data-boss-countdown="${scheduled.startsAt}" datetime="${new Date(scheduled.startsAt).toISOString()}">${formatBossCountdown(scheduled.startsAt, now)}</time>`;
  } else {
    content = `<h2>${revealed === 5 ? 'Tous les organisateurs sont révélés' : 'En attente du prochain boss'}</h2><p>${revealed === 5 ? 'Bravo à toute l’équipe pour cette aventure.' : 'L’administration annoncera sa prochaine apparition.'}</p>`;
  }
  return `<section class="boss-card boss-global-banner paper-card" aria-label="Boss collectif">${bossArt(chapter)}<div class="boss-copy"><span class="eyebrow">BOSS COLLECTIF · ${revealed} / 5 RÉVÉLÉS</span>${content}</div></section>`;
}
