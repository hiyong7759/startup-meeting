export { getAllRoles, getRole, selectParticipants, getRolesByDepartment, getRolesByLevel } from './roles';
export { pullGacha, pullGachaByRarity, getTopicProbabilities } from './gacha';
export {
  createNewProfile, calculateXpReward, applyXp,
  rollCardDrop, checkAchievements, getLevelThresholds,
  getCardDropProbabilities,
} from './progression';
// Keep existing exports
export { createGameState, applyMetricsDelta, checkGameOver } from './state';
export { startRound, submitDecision } from './round';
export { shouldFireEvent, selectEvent, getEvents } from './events';
export { getCharacters, getCharacter, getCharacterOpinionOrder } from './characters';
export { findMatchingOption, applyDecision } from './decisions';
