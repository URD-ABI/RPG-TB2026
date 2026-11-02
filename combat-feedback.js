export function turnFeedback(before, after, action) {
  const healed = Number(/(\d+) PV récupérés/.exec(after.message || '')?.[1] || 0);
  const playerHpAfterAction = Math.min(before.playerMaxHp, before.playerHp + healed);
  const enemyActed = after.monsterHp > 0;
  return {
    action,
    playerDamage: Math.max(0, before.monsterHp - after.monsterHp),
    playerHpAfterAction,
    enemyDamage: enemyActed ? Math.max(0, playerHpAfterAction - after.playerHp) : 0,
    enemyAction: before.intention || 'Le monstre riposte.',
    enemyActed
  };
}
