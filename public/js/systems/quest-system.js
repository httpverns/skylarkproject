/**
 * Quest System for Skylark ARPG (Phase 3)
 * Complete implementation with tracking, objectives, and rewards
 */

export class QuestSystem {
  constructor(entitySystem, npcSystem) {
    this.quests = new Map();
    this.activeQuests = new Set();
    this.completedQuests = new Set();
    this.questIdCounter = 1;
    this.entitySystem = entitySystem;
    this.npcSystem = npcSystem;
    this.onQuestAccepted = null;
    this.onQuestCompleted = null;
  }

  /**
   * Create a quest definition
   * @param {Object} config - Quest configuration
   * @returns {Object} Created quest
   */
  createQuest(config) {
    const quest = {
      id: `quest_${this.questIdCounter++}`,
      title: config.title || 'Unknown Quest',
      description: config.description || '',
      giver: config.giver, // NPC ID
      objectives: config.objectives || [], // Array of {type, target, completed}
      rewards: config.rewards || {
        xp: 0,
        items: [],
        reputation: 0
      },
      status: 'inactive', // inactive, active, completed, failed
      progress: 0,
      startTime: null,
      completeTime: null,
      prerequisites: config.prerequisites || [] // Quest IDs that must be completed first
    };

    this.quests.set(quest.id, quest);
    return quest;
  }

  /**
   * Accept a quest
   * @param {string} questId - Quest ID
   * @returns {boolean} Success
   */
  acceptQuest(questId) {
    const quest = this.quests.get(questId);
    if (!quest) return false;
    if (quest.status !== 'inactive') return false;

    // Check prerequisites
    for (const prereqId of quest.prerequisites) {
      if (!this.completedQuests.has(prereqId)) {
        console.warn(`⚠️  Cannot accept quest: prerequisite "${prereqId}" not met`);
        return false;
      }
    }

    quest.status = 'active';
    quest.startTime = Date.now();
    this.activeQuests.add(questId);
    
    // Reset all objectives to incomplete
    quest.objectives.forEach(obj => obj.completed = false);
    
    if (this.onQuestAccepted) {
      this.onQuestAccepted(quest);
    }
    
    console.log(`📋 Quest accepted: ${quest.title}`);
    return true;
  }

  /**
   * Update quest objective progress
   * @param {string} questId - Quest ID
   * @param {number} objectiveIndex - Objective index
   * @param {boolean} completed - Is objective complete
   * @returns {boolean} Success
   */
  updateObjective(questId, objectiveIndex, completed) {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== 'active') return false;
    if (objectiveIndex >= quest.objectives.length) return false;

    quest.objectives[objectiveIndex].completed = completed;
    
    // Calculate progress
    const completedCount = quest.objectives.filter(obj => obj.completed).length;
    quest.progress = Math.round((completedCount / quest.objectives.length) * 100);

    console.log(`✓ Objective progress: ${quest.progress}%`);
    
    // Auto-complete if all objectives done
    if (this.areAllObjectivesComplete(quest)) {
      this.completeQuest(questId);
    }

    return true;
  }

  /**
   * Check if all objectives are complete
   * @param {Object} quest - Quest object
   * @returns {boolean} All objectives complete
   */
  areAllObjectivesComplete(quest) {
    return quest.objectives.every(obj => obj.completed);
  }

  /**
   * Complete a quest
   * @param {string} questId - Quest ID
   * @returns {boolean} Success
   */
  completeQuest(questId) {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== 'active') return false;

    quest.status = 'completed';
    quest.completeTime = Date.now();
    this.activeQuests.delete(questId);
    this.completedQuests.add(questId);

    if (this.onQuestCompleted) {
      this.onQuestCompleted(quest);
    }
    
    console.log(`✅ Quest completed: ${quest.title}`);
    console.log(`   Rewards: ${quest.rewards.xp} XP, ${quest.rewards.reputation} reputation`);
    return true;
  }

  /**
   * Fail a quest
   * @param {string} questId - Quest ID
   * @returns {boolean} Success
   */
  failQuest(questId) {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== 'active') return false;

    quest.status = 'failed';
    this.activeQuests.delete(questId);
    console.log(`❌ Quest failed: ${quest.title}`);
    return true;
  }

  /**
   * Get quest by ID
   * @param {string} questId - Quest ID
   * @returns {Object|null} Quest or null
   */
  getQuest(questId) {
    return this.quests.get(questId) || null;
  }

  /**
   * Get all active quests
   * @returns {Array} Active quests
   */
  getActiveQuests() {
    return Array.from(this.activeQuests).map(id => this.quests.get(id)).filter(Boolean);
  }

  /**
   * Get quests from a specific NPC
   * @param {number} npcId - NPC entity ID
   * @returns {Array} Available quests from NPC
   */
  getQuestsFromNPC(npcId) {
    return Array.from(this.quests.values())
      .filter(q => q.giver === npcId && q.status === 'inactive')
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Get quest reward summary
   * @param {string} questId - Quest ID
   * @returns {Object} Reward summary
   */
  getRewardSummary(questId) {
    const quest = this.quests.get(questId);
    if (!quest) return null;
    return {
      xp: quest.rewards.xp,
      reputation: quest.rewards.reputation,
      items: quest.rewards.items
    };
  }
}
