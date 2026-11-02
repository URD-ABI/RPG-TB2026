export function turnFeedback(before, after, action) {
  const healed = Number(/(\d+) PV récupérés/.exec(after.message || '')?.[1] || 0);
  const playerHpAfterAction = Math.min(before.playerMaxHp, before.playerHp + healed);
  const enemyActed = after.monsterHp > 0;
  const enemyStart = (after.message || '').search(/\b(?:Le monstre|Le boss|L’ennemi)\b/);
  return {
    action,
    playerDamage: Math.max(0, before.monsterHp - after.monsterHp),
    playerHpAfterAction,
    enemyDamage: enemyActed ? Math.max(0, playerHpAfterAction - after.playerHp) : 0,
    enemyAction: enemyStart >= 0 ? after.message.slice(enemyStart).trim() : before.intention || 'Le monstre riposte.',
    enemyActed
  };
}
