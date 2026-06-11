/**
 * NPC System for Skylark ARPG
 * Handles NPC behavior, dialogue, and interaction
 */

export class NPCSystem {
  constructor(entitySystem) {
    this.entitySystem = entitySystem;
    this.npcDialogue = new Map();
    this.npcState = new Map();
  }

  /**
   * Initialize NPC dialogue from data
   * @param {Array} npcDefinitions - NPC definitions
   */
  async initializeNPCs(npcDefinitions) {
    console.log(`📖 Initializing ${npcDefinitions.length} NPCs...`);

    for (const npcDef of npcDefinitions) {
      // Load dialogue if available
      try {
        const dialogueResponse = await fetch(`/api/dialogue/${npcDef.id}`);
        if (dialogueResponse.ok) {
          const dialogue = await dialogueResponse.json();
          this.npcDialogue.set(npcDef.id, dialogue);
        }
      } catch (error) {
        console.warn(`⚠️  No dialogue loaded for NPC "${npcDef.name}"`);
      }

      // Initialize NPC state
      this.npcState.set(npcDef.id, {
        hasSpoken: false,
        questsGiven: [],
        reputation: 0,
        mood: 'neutral',
        lastInteractionTime: null
      });
    }
  }

  /**
   * Get dialogue for NPC
   * @param {number} npcId - NPC entity ID
   * @returns {Object} Dialogue data
   */
  getDialogue(npcId) {
    return this.npcDialogue.get(npcId) || this.getDefaultDialogue();
  }

  /**
   * Get default dialogue when none is available
   * @returns {Object} Default dialogue
   */
  getDefaultDialogue() {
    return {
      greeting: "Greetings, traveler.",
      options: [
        { text: "Tell me about yourself", response: "I'm just a humble NPC." },
        { text: "Goodbye", response: "Safe travels." }
      ]
    };
  }

  /**
   * Interact with NPC
   * @param {number} npcId - NPC entity ID
   * @returns {Object} Interaction result
   */
  interactWithNPC(npcId) {
    const entity = this.entitySystem.getEntity(npcId);
    if (!entity || entity.type !== 'npc') {
      return { success: false, message: 'No NPC found' };
    }

    const state = this.npcState.get(npcId);
    state.hasSpoken = true;
    state.lastInteractionTime = Date.now();

    const dialogue = this.getDialogue(npcId);

    return {
      success: true,
      npcId,
      npcName: entity.name,
      dialogue,
      state
    };
  }

  /**
   * Get NPC state
   * @param {number} npcId - NPC entity ID
   * @returns {Object} NPC state
   */
  getNPCState(npcId) {
    return this.npcState.get(npcId) || null;
  }

  /**
   * Update NPC state
   * @param {number} npcId - NPC entity ID
   * @param {Object} updates - State updates
   */
  updateNPCState(npcId, updates) {
    const state = this.npcState.get(npcId);
    if (state) {
      Object.assign(state, updates);
    }
  }

  /**
   * Change NPC mood
   * @param {number} npcId - NPC entity ID
   * @param {string} mood - New mood
   */
  setNPCMood(npcId, mood) {
    const state = this.npcState.get(npcId);
    if (state) {
      state.mood = mood;
    }
  }
}
