const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function renderLeaderboardRows(rows) {
  if (!rows.length) return '<p>Aucun personnage créé pour le moment.</p>';
  return rows.map(row => `<div class="leaderboard-row ${row.isSelf ? 'leaderboard-row--self' : ''}"><strong class="leaderboard-rank">#${Number(row.rank)}</strong><span class="leaderboard-identity">${row.portraitUrl ? `<img class="leaderboard-portrait" src="${escapeHtml(row.portraitUrl)}" alt="Tête de ${escapeHtml(row.nickname)}" loading="lazy">` : ''}<span class="leaderboard-name">${escapeHtml(row.nickname)}${row.isSelf ? ' <small>Vous</small>' : ''}</span></span><span class="leaderboard-level">Niv. ${Number(row.level)}</span><span class="leaderboard-xp">${Number(row.xp).toLocaleString('fr-FR')} XP</span></div>`).join('');
}
