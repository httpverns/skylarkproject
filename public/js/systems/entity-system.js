/**
 * Entity System for Skylark ARPG
 * Manages NPCs, enemies, and interactive objects
 */

export class EntitySystem {
  constructor() {
    this.entities = [];
    this.entityIdCounter = 1000;
  }

  /**
   * Create a new entity
   * @param {Object} config - Entity configuration
   * @returns {Object} Created entity
   */
  createEntity(config) {
    const entity = {
      id: this.entityIdCounter++,
      type: config.type || 'npc', // 'npc', 'enemy', 'object'
      name: config.name || 'Unknown',
      x: config.x || 0,
      y: config.y || 0,
      sprite: config.sprite || 'default',
      walkable: config.type === 'object' ? false : true,
      visible: true,
      data: config.data || {}
    };

    this.entities.push(entity);
    console.log(`🎭 Entity created: ${entity.name} (${entity.type}) at (${entity.x}, ${entity.y})`);
    return entity;
  }

  /**
   * Spawn entities on a map
   * @param {Object} mapData - Map data
   * @param {Array} entityDefinitions - Entity definitions to spawn
   */
  spawnEntitiesForMap(mapData, entityDefinitions) {
    // Clear existing entities
    this.entities = [];

    if (!entityDefinitions) return;

    entityDefinitions.forEach(def => {
      this.createEntity({
        type: def.type || 'npc',
        name: def.name,
        x: def.x,
        y: def.y,
        sprite: def.sprite,
        data: def.data || {}
      });
    });

    console.log(`🌍 Spawned ${this.entities.length} entities for map "${mapData.name}"`);
  }

  /**
   * Get entity by ID
   * @param {number} id - Entity ID
   * @returns {Object|null} Entity or null
   */
  getEntity(id) {
    return this.entities.find(e => e.id === id) || null;
  }

  /**
   * Get entities at position
   * @param {number} x - Grid X
   * @param {number} y - Grid Y
   * @returns {Array} Entities at position
   */
  getEntitiesAt(x, y) {
    return this.entities.filter(e => e.x === x && e.y === y);
  }

  /**
   * Get entities by type
   * @param {string} type - Entity type
   * @returns {Array} Matching entities
   */
  getEntitiesByType(type) {
    return this.entities.filter(e => e.type === type);
  }

  /**
   * Move entity to position
   * @param {number} id - Entity ID
   * @param {number} x - New X
   * @param {number} y - New Y
   * @returns {boolean} True if moved
   */
  moveEntity(id, x, y) {
    const entity = this.getEntity(id);
    if (!entity) return false;

    entity.x = x;
    entity.y = y;
    return true;
  }

  /**
   * Remove entity
   * @param {number} id - Entity ID
   * @returns {boolean} True if removed
   */
  removeEntity(id) {
    const index = this.entities.findIndex(e => e.id === id);
    if (index === -1) return false;

    const entity = this.entities[index];
    this.entities.splice(index, 1);
    console.log(`💀 Entity removed: ${entity.name}`);
    return true;
  }

  /**
   * Get all visible entities
   * @returns {Array} Visible entities
   */
  getVisibleEntities() {
    return this.entities.filter(e => e.visible);
  }

  /**
   * Update entity data
   * @param {number} id - Entity ID
   * @param {Object} updates - Data to update
   * @returns {boolean} True if updated
   */
  updateEntity(id, updates) {
    const entity = this.getEntity(id);
    if (!entity) return false;

    Object.assign(entity, updates);
    return true;
  }
}
