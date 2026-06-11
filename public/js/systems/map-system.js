/**
 * Map System for Skylark ARPG
 * Handles loading, unloading, and transitions between maps
 */

export class MapSystem {
  constructor() {
    this.maps = new Map();
    this.currentMapName = null;
    this.currentMapData = null;
    this.mapTransitionInProgress = false;
  }

  /**
   * Load a map from the server
   * @param {string} mapName - Name of the map to load
   * @returns {Promise<Object>} Map data
   */
  async loadMap(mapName) {
    // Check cache first
    if (this.maps.has(mapName)) {
      console.log(`📦 Map "${mapName}" loaded from cache`);
      return this.maps.get(mapName);
    }

    try {
      // Fetch map from server
      const response = await fetch(`/api/maps/${mapName}`);
      if (!response.ok) {
        throw new Error(`Map ${mapName} not found`);
      }

      // Parse map data
      const mapData = await this.parseMapData(await response.text());
      mapData.name = mapName;

      // Cache it
      this.maps.set(mapName, mapData);
      console.log(`✅ Map "${mapName}" loaded from server`);
      return mapData;
    } catch (error) {
      console.error(`❌ Failed to load map ${mapName}:`, error);
      // Return procedurally generated fallback map
      return this.generateFallbackMap(mapName);
    }
  }

  /**
   * Parse FLARE-format map data
   * @param {string} mapText - Raw map text content
   * @returns {Object} Parsed map data
   */
  parseMapData(mapText) {
    const lines = mapText.split('\n').filter(l => l.trim());
    const mapData = {
      width: 15,
      height: 12,
      tiles: [],
      npcs: [],
      objects: [],
      spawns: []
    };

    // Parse sections
    let currentSection = null;
    for (const line of lines) {
      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1);
        continue;
      }

      if (currentSection === 'header') {
        const [key, val] = line.split('=');
        if (key === 'width') mapData.width = parseInt(val);
        if (key === 'height') mapData.height = parseInt(val);
      }
    }

    // Generate terrain if needed
    if (mapData.tiles.length === 0) {
      this.generateTerrainForMap(mapData);
    }

    return mapData;
  }

  /**
   * Generate terrain for a map
   * @param {Object} mapData - Map to populate
   */
  generateTerrainForMap(mapData) {
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        let tileType = 'grass';

        // Borders
        if (x === 0 || x === mapData.width - 1 || y === 0 || y === mapData.height - 1) {
          tileType = 'wall';
        }
        // Random obstacles
        else if (Math.random() < 0.08) {
          tileType = Math.random() < 0.6 ? 'rock' : 'tree';
        }
        // Occasional water
        else if (Math.random() < 0.03) {
          tileType = 'water';
        }

        mapData.tiles.push({
          x,
          y,
          type: tileType,
          walkable: !['wall', 'rock', 'tree', 'water'].includes(tileType)
        });
      }
    }
  }

  /**
   * Generate a fallback map if loading fails
   * @param {string} mapName - Name of the map
   * @returns {Object} Generated map data
   */
  generateFallbackMap(mapName) {
    console.log(`🔄 Generating fallback map for "${mapName}"`);
    const mapData = {
      name: mapName,
      width: 15,
      height: 12,
      tiles: [],
      npcs: [],
      objects: [],
      spawns: []
    };

    this.generateTerrainForMap(mapData);
    return mapData;
  }

  /**
   * Check if position is walkable on current map
   * @param {number} x - Grid X
   * @param {number} y - Grid Y
   * @returns {boolean} True if walkable
   */
  isWalkable(x, y) {
    if (!this.currentMapData) return false;
    if (x < 0 || x >= this.currentMapData.width) return false;
    if (y < 0 || y >= this.currentMapData.height) return false;

    const tile = this.currentMapData.tiles.find(t => t.x === x && t.y === y);
    return tile ? tile.walkable : false;
  }

  /**
   * Get a tile at position
   * @param {number} x - Grid X
   * @param {number} y - Grid Y
   * @returns {Object|null} Tile data or null
   */
  getTile(x, y) {
    if (!this.currentMapData) return null;
    return this.currentMapData.tiles.find(t => t.x === x && t.y === y) || null;
  }

  /**
   * Get all tiles of a type
   * @param {string} type - Tile type
   * @returns {Array} Array of tiles
   */
  getTilesByType(type) {
    if (!this.currentMapData) return [];
    return this.currentMapData.tiles.filter(t => t.type === type);
  }

  /**
   * Check if transition exists at position
   * @param {number} x - Grid X
   * @param {number} y - Grid Y
   * @returns {Object|null} Transition data or null
   */
  getTransitionAt(x, y) {
    if (!this.currentMapData || !this.currentMapData.transitions) return null;
    return this.currentMapData.transitions.find(t => t.x === x && t.y === y) || null;
  }

  /**
   * Get map bounds
   * @returns {Object} {x, y, width, height}
   */
  getBounds() {
    if (!this.currentMapData) return { x: 0, y: 0, width: 0, height: 0 };
    return {
      x: 0,
      y: 0,
      width: this.currentMapData.width,
      height: this.currentMapData.height
    };
  }
}
