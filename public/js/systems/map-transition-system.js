/**
 * Map Transition System for Skylark ARPG (Phase 3)
 * Handles travel between maps and area transitions
 */

export class MapTransitionSystem {
  constructor(mapSystem, entitySystem) {
    this.mapSystem = mapSystem;
    this.entitySystem = entitySystem;
    this.transitions = new Map();
    this.transitionInProgress = false;
    this.onTransitionStart = null;
    this.onTransitionEnd = null;
  }

  /**
   * Create a map transition (portal/exit)
   * @param {Object} config - Transition configuration
   */
  createTransition(config) {
    const key = `${config.fromMap}_${config.x}_${config.y}`;
    const transition = {
      key,
      fromMap: config.fromMap,
      toMap: config.toMap,
      x: config.x,
      y: config.y,
      destX: config.destX || 5,
      destY: config.destY || 5,
      type: config.type || 'portal', // portal, door, ship
      name: config.name || 'Exit',
      locked: config.locked || false,
      requiresQuest: config.requiresQuest || null
    };

    this.transitions.set(key, transition);
    console.log(`🚪 Transition created: ${transition.name} (${transition.fromMap} -> ${transition.toMap})`);
    return transition;
  }

  /**
   * Check if player is on a transition
   * @param {Object} player - Player entity
   * @param {string} currentMap - Current map name
   * @returns {Object|null} Transition or null
   */
  getTransitionAt(player, currentMap) {
    const key = `${currentMap}_${player.x}_${player.y}`;
    return this.transitions.get(key) || null;
  }

  /**
   * Can transition be used
   * @param {Object} transition - Transition object
   * @param {Object} playerData - Player game state
   * @returns {Object} {canUse: boolean, reason: string}
   */
  canUseTransition(transition, playerData) {
    if (this.transitionInProgress) {
      return { canUse: false, reason: 'Transition in progress' };
    }

    if (transition.locked) {
      return { canUse: false, reason: `${transition.name} is locked` };
    }

    if (transition.requiresQuest) {
      const hasQuest = playerData.completedQuests && 
                       playerData.completedQuests.has(transition.requiresQuest);
      if (!hasQuest) {
        return { canUse: false, reason: 'You are not ready for this journey' };
      }
    }

    return { canUse: true, reason: 'Ready to transition' };
  }

  /**
   * Execute map transition
   * @param {Object} transition - Transition object
   * @param {Object} gameEngine - Game engine reference
   * @returns {Promise<boolean>} Success
   */
  async transitionMap(transition, gameEngine) {
    // Check if can transition
    const canUse = this.canUseTransition(transition, gameEngine.gameState);
    if (!canUse.canUse) {
      console.warn(`⚠️  Cannot transition: ${canUse.reason}`);
      return false;
    }

    this.transitionInProgress = true;
    if (this.onTransitionStart) {
      this.onTransitionStart(transition);
    }

    // Fade out (would be animation in real engine)
    console.log(`📍 Transitioning to ${transition.toMap}...`);

    // Load new map
    try {
      await this.mapSystem.loadMap(transition.toMap);
      
      // Update player position
      const player = this.entitySystem.getEntity(gameEngine.gameState.playerEntityId);
      if (player) {
        player.x = transition.destX;
        player.y = transition.destY;
      }

      // Update game state
      gameEngine.gameState.mapName = transition.toMap;
      gameEngine.mapSystem.currentMapName = transition.toMap;
      gameEngine.mapSystem.currentMapData = this.mapSystem.currentMapData;

      // Re-spawn NPCs for new map
      await gameEngine.spawnNPCs();

      console.log(`✅ Transitioned to ${transition.toMap} at (${transition.destX}, ${transition.destY})`);

      this.transitionInProgress = false;
      if (this.onTransitionEnd) {
        this.onTransitionEnd(transition);
      }

      return true;
    } catch (error) {
      console.error(`❌ Transition failed: ${error.message}`);
      this.transitionInProgress = false;
      return false;
    }
  }

  /**
   * Get available transitions from current map
   * @param {string} mapName - Map name
   * @returns {Array} Available transitions
   */
  getTransitionsFromMap(mapName) {
    return Array.from(this.transitions.values())
      .filter(t => t.fromMap === mapName);
  }
}
