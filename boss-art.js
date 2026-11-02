const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function bossArt(chapter, portraitUrl = null, name = null) {
  const index = Number.isInteger(chapter) && chapter >= 1 && chapter <= 5 ? chapter : 1;
  const label = portraitUrl && name ? `Boss ${index} : ${name}` : `Boss ${index} : organisateur mystère`;
  const head = portraitUrl ? `<img class="boss-head-reveal" src="${escapeHtml(portraitUrl)}" alt="Portrait de ${escapeHtml(name || 'l’organisateur')}">` : '';
  return `<div class="boss-figure boss-figure--${index}" data-boss-variant="${index}" role="img" aria-label="${escapeHtml(label)}"><img class="boss-body" src="./assets/boss-silhouette-${index}.png" alt="" aria-hidden="true">${head}</div>`;
}
