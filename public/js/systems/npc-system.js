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
      if (npcDef.dialogue) {
        this.npcDialogue.set(npcDef.id, npcDef.dialogue);
      }

      try {
        const dialogueResponse = await fetch(`/api/dialogue/${npcDef.id}`);
        if (dialogueResponse.ok) {
          const dialogue = await dialogueResponse.json();
          this.npcDialogue.set(npcDef.id, dialogue);
        }
      } catch (error) {
        console.warn(`⚠️  No dialogue loaded for NPC "${npcDef.name}"`);
      }

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
   * @param {string|number} npcId - NPC definition ID or entity ID
   * @returns {Object} Dialogue data
   */
  getDialogue(npcId) {
    const dialogue = this.npcDialogue.get(npcId) || this.getDefaultDialogue();
    return this.normalizeDialogue(dialogue);
  }

  normalizeDialogue(dialogueData) {
    if (!dialogueData) {
      return this.getDefaultDialogue();
    }

    if (dialogueData.options) {
      return dialogueData;
    }

    const dialogueTree = dialogueData.dialogue_tree || dialogueData.tree || [];
    const nodes = {};

    dialogueTree.forEach((node) => {
      nodes[node.id] = {
        id: node.id,
        text: node.text || node.greeting || '',
        responses: (node.responses || []).map((response) => ({
          text: response.text,
          response: response.text,
          next: response.next,
          questStart: response.questStart,
          questUpdate: response.questUpdate
        }))
      };
    });

    const firstNode = dialogueTree[0];
    const startNodeId = firstNode?.id || 'start';

    return {
      greeting: dialogueData.greeting || firstNode?.text || 'Greetings, traveler.',
      currentNodeId: startNodeId,
      nodes
    };
  }

  /**
   * Get default dialogue when none is available
   * @returns {Object} Default dialogue
   */
  getDefaultDialogue() {
    return {
      greeting: 'Greetings, traveler.',
      options: [
        { text: 'Tell me about yourself', response: "I'm just a humble NPC." },
        { text: 'Goodbye', response: 'Safe travels.' }
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

    const npcKey = entity.data?.npcId || npcId;
    const state = this.npcState.get(npcKey) || this.npcState.get(npcId);
    if (state) {
      state.hasSpoken = true;
      state.lastInteractionTime = Date.now();
    }

    const dialogue = this.getDialogue(npcKey);

    return {
      success: true,
      npcId: npcKey,
      npcName: entity.name,
      dialogue,
      state
    };
  }

  /**
   * Get NPC state
   * @param {string|number} npcId - NPC ID
   * @returns {Object} NPC state
   */
  getNPCState(npcId) {
    return this.npcState.get(npcId) || null;
  }

  /**
   * Update NPC state
   * @param {string|number} npcId - NPC ID
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
   * @param {string|number} npcId - NPC ID
   * @param {string} mood - New mood
   */
  setNPCMood(npcId, mood) {
    const state = this.npcState.get(npcId);
    if (state) {
      state.mood = mood;
    }
  }
}
