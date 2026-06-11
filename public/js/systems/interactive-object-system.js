/**
 * Interactive Object System for Skylark ARPG (Phase 3)
 * Manages doors, chests, terminals, and other interactive elements
 */

export class InteractiveObjectSystem {
  constructor(entitySystem, questSystem) {
    this.objects = new Map();
    this.objectIdCounter = 1;
    this.entitySystem = entitySystem;
    this.questSystem = questSystem;
  }

  /**
   * Create an interactive object
   * @param {Object} config - Object configuration
   * @returns {Object} Created object
   */
  createObject(config) {
    const objectId = this.objectIdCounter++;
    const objectData = {
      id: objectId,
      type: config.type, // 'door', 'chest', 'terminal', 'workbench'
      name: config.name || 'Object',
      x: config.x,
      y: config.y,
      state: config.initialState || 'closed', // closed, open, locked
      contents: config.contents || [], // For chests
      quest: config.quest || null, // Associated quest ID
      script: config.script || null, // Script to run on interaction
      locked: config.locked || false,
      requiresKey: config.requiresKey || null,
      spriteId: config.spriteId || `obj_${config.type}_${objectData.state}`
    };

    // Create entity for rendering
    this.entitySystem.createEntity({
      type: 'object',
      name: objectData.name,
      x: objectData.x,
      y: objectData.y,
      sprite: objectData.spriteId,
      data: { objectId }
    });

    this.objects.set(objectId, objectData);
    console.log(`🔧 Interactive object created: ${objectData.name} (${objectData.type})`);
    return objectData;
  }

  /**
   * Interact with an object
   * @param {number} objectId - Object ID
   * @param {Object} player - Player entity
   * @returns {Object} Interaction result
   */
  interact(objectId, player) {
    const obj = this.objects.get(objectId);
    if (!obj) {
      return { success: false, message: 'Object not found' };
    }

    // Check if locked
    if (obj.locked) {
      return {
        success: false,
        message: `The ${obj.name} is locked.`,
        requiresKey: obj.requiresKey
      };
    }

    // Handle by type
    const handler = this.getInteractionHandler(obj.type);
    if (handler) {
      return handler.call(this, obj);
    }

    return { success: true, message: `Interacted with ${obj.name}` };
  }

  /**
   * Get interaction handler for object type
   * @param {string} type - Object type
   * @returns {Function} Handler function
   */
  getInteractionHandler(type) {
    const handlers = {
      door: this.interactWithDoor,
      chest: this.interactWithChest,
      terminal: this.interactWithTerminal,
      workbench: this.interactWithWorkbench
    };
    return handlers[type] || null;
  }

  /**
   * Handle door interaction
   * @param {Object} obj - Door object
   * @returns {Object} Interaction result
   */
  interactWithDoor(obj) {
    if (obj.state === 'closed') {
      obj.state = 'open';
      return { success: true, message: `The ${obj.name} opens.` };
    } else {
      obj.state = 'closed';
      return { success: true, message: `The ${obj.name} closes.` };
    }
  }

  /**
   * Handle chest interaction
   * @param {Object} obj - Chest object
   * @returns {Object} Interaction result
   */
  interactWithChest(obj) {
    if (obj.state === 'closed') {
      obj.state = 'open';
      return {
        success: true,
        message: `You open the ${obj.name}.`,
        contents: obj.contents
      };
    } else {
      return {
        success: true,
        message: `The ${obj.name} is already open.`,
        contents: obj.contents
      };
    }
  }

  /**
   * Handle terminal interaction
   * @param {Object} obj - Terminal object
   * @returns {Object} Interaction result
   */
  interactWithTerminal(obj) {
    return {
      success: true,
      message: `[TERMINAL INTERFACE]\n${obj.name} ready for input.`,
      type: 'terminal',
      data: obj.data || {}
    };
  }

  /**
   * Handle workbench interaction
   * @param {Object} obj - Workbench object
   * @returns {Object} Interaction result
   */
  interactWithWorkbench(obj) {
    return {
      success: true,
      message: `[WORKBENCH INTERFACE]\nReady for crafting.`,
      type: 'workbench',
      recipes: obj.recipes || []
    };
  }

  /**
   * Open a locked object
   * @param {number} objectId - Object ID
   * @param {string} key - Key item ID
   * @returns {boolean} Success
   */
  unlock(objectId, key) {
    const obj = this.objects.get(objectId);
    if (!obj) return false;
    if (!obj.locked) return true;
    if (obj.requiresKey !== key) return false;

    obj.locked = false;
    console.log(`🔓 Object unlocked: ${obj.name}`);
    return true;
  }

  /**
   * Get objects at a specific location
   * @param {number} x - Grid X
   * @param {number} y - Grid Y
   * @returns {Array} Objects at location
   */
  getObjectsAt(x, y) {
    return Array.from(this.objects.values())
      .filter(obj => obj.x === x && obj.y === y);
  }

  /**
   * Get all objects
   * @returns {Array} All objects
   */
  getAllObjects() {
    return Array.from(this.objects.values());
  }
}
