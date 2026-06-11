/**
 * Skylark ARPG - Core Game Engine (Phase 2)
 * Integrated map system, entity system, and NPC system
 */

import { MapSystem } from './systems/map-system.js';
import { EntitySystem } from './systems/entity-system.js';
import { NPCSystem } from './systems/npc-system.js';
import { DialogueUI } from './systems/dialogue-ui.js';

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.deltaTime = 0;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    
    // Game systems
    this.mapSystem = new MapSystem();
    this.entitySystem = new EntitySystem();
    this.npcSystem = new NPCSystem(this.entitySystem);
    this.dialogueUI = new DialogueUI();
    
    // Game state
    this.gameState = {
      mapName: 'earth_base_01',
      playerEntityId: null,
      playerX: 5,
      playerY: 5,
      selectedEntityId: null,
      interactionRange: 1
    };

    // Tile constants
    this.TILE_SIZE = 32;
    this.TILE_WIDTH = 64;
    this.TILE_HEIGHT = 32;
  }

  async init() {
    console.log('🎮 Initializing Skylark ARPG Engine (Phase 2)...');
    
    this.createCanvas();
    await this.loadGameConfig();
    await this.loadMap(this.gameState.mapName);
    this.spawnPlayer();
    await this.spawnNPCs();
    this.initializeInput();
    this.start();
    
    console.log('✅ Game engine initialized');
  }

  createCanvas() {
    const container = document.getElementById('game-canvas');
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    container.innerHTML = '';
    container.appendChild(canvas);
    
    console.log(`📐 Canvas created: ${canvas.width}x${canvas.height}`);
  }

  async loadGameConfig() {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      this.gameState.mapName = config.gameStartMap;
      this.gameState.playerX = config.startPosition.x;
      this.gameState.playerY = config.startPosition.y;
    } catch (error) {
      console.error('Failed to load game config:', error);
      this.updateStatus('ERROR: Failed to load config');
    }
  }

  async loadMap(mapName) {
    try {
      this.updateStatus('Loading map...');
      const mapData = await this.mapSystem.loadMap(mapName);
      this.mapSystem.currentMapName = mapName;
      this.mapSystem.currentMapData = mapData;
      this.updateStatus(`Map loaded: ${mapName}`);
    } catch (error) {
      console.error('Failed to load map:', error);
      this.updateStatus('ERROR: Failed to load map');
    }
  }

  spawnPlayer() {
    const player = this.entitySystem.createEntity({
      type: 'player',
      name: 'Richard Seaton',
      x: this.gameState.playerX,
      y: this.gameState.playerY,
      sprite: 'seaton'
    });
    this.gameState.playerEntityId = player.id;
  }

  async spawnNPCs() {
    // Load NPC definitions
    const npcDefinitions = await this.loadNPCDefinitions();
    
    // Initialize NPC system
    await this.npcSystem.initializeNPCs(npcDefinitions);
    
    // Spawn NPCs on map
    npcDefinitions.forEach(npcDef => {
      this.entitySystem.createEntity({
        type: 'npc',
        name: npcDef.name,
        x: npcDef.x || Math.floor(Math.random() * this.mapSystem.currentMapData.width),
        y: npcDef.y || Math.floor(Math.random() * this.mapSystem.currentMapData.height),
        sprite: npcDef.sprite,
        data: { npcId: npcDef.id, role: npcDef.role }
      });
    });
  }

  async loadNPCDefinitions() {
    // Hardcoded for Phase 2 - will load from data files in Phase 3
    return [
      { id: 'martin_crane', name: 'Martin Crane', role: 'ally', x: 7, y: 6, sprite: 'crane' },
      { id: 'dorothy_vaneman', name: 'Dorothy Vaneman', role: 'companion', x: 8, y: 7, sprite: 'dorothy' }
    ];
  }

  initializeInput() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.movePlayer(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') this.movePlayer(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') this.movePlayer(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') this.movePlayer(1, 0);
      if (e.key === 'e' || e.key === 'E') this.interactWithNearby();
      if (e.key === 'Escape') this.dialogueUI.close();
    });
  }

  movePlayer(dx, dy) {
    const player = this.entitySystem.getEntity(this.gameState.playerEntityId);
    if (!player) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (this.mapSystem.isWalkable(newX, newY)) {
      // Check for entities blocking
      const entitiesAtPos = this.entitySystem.getEntitiesAt(newX, newY);
      if (entitiesAtPos.some(e => !['npc', 'object'].includes(e.type))) {
        return;
      }

      this.entitySystem.moveEntity(player.id, newX, newY);
      this.updatePosition();
    }
  }

  interactWithNearby() {
    const player = this.entitySystem.getEntity(this.gameState.playerEntityId);
    if (!player) return;

    // Find NPCs in range
    const nearbyEntities = this.entitySystem.entities.filter(e => {
      const distance = Math.max(Math.abs(e.x - player.x), Math.abs(e.y - player.y));
      return e.type === 'npc' && distance <= this.gameState.interactionRange;
    });

    if (nearbyEntities.length > 0) {
      const npc = nearbyEntities[0];
      const interaction = this.npcSystem.interactWithNPC(npc.id);
      if (interaction.success) {
        this.dialogueUI.open(interaction);
      }
    }
  }

  start() {
    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this.gameLoop();
  }

  gameLoop = () => {
    const now = Date.now();
    this.deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.update(this.deltaTime);
    this.render();

    this.frameCount++;
    if (this.frameCount % 10 === 0) {
      this.fps = Math.round(1 / this.deltaTime);
      this.updateFPS();
    }

    if (this.isRunning) {
      requestAnimationFrame(this.gameLoop);
    }
  };

  update(deltaTime) {
    // TODO: Update game systems
  }

  render() {
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const player = this.entitySystem.getEntity(this.gameState.playerEntityId);
    if (!player) return;

    const cameraX = this.canvas.width / 2 - this.isometricX(player.x, player.y);
    const cameraY = this.canvas.height / 2 - this.isometricY(player.x, player.y);

    this.ctx.save();
    this.ctx.translate(cameraX, cameraY);

    this.renderMap();
    this.renderEntities();
    this.renderInteractionRange(player);

    this.ctx.restore();
  }

  renderMap() {
    if (!this.mapSystem.currentMapData) return;

    const map = this.mapSystem.currentMapData;
    const sortedTiles = [...map.tiles].sort((a, b) => (a.x + a.y) - (b.x + b.y));

    sortedTiles.forEach(tile => {
      const x = this.isometricX(tile.x, tile.y);
      const y = this.isometricY(tile.x, tile.y);
      this.drawTile(x, y, tile.type);
    });
  }

  drawTile(x, y, type) {
    const w = this.TILE_WIDTH / 2;
    const h = this.TILE_HEIGHT / 2;

    this.ctx.strokeStyle = '#0f0';
    this.ctx.lineWidth = 0.5;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y - h);
    this.ctx.lineTo(x + w, y);
    this.ctx.lineTo(x, y + h);
    this.ctx.lineTo(x - w, y);
    this.ctx.closePath();
    this.ctx.stroke();

    const colors = {
      grass: '#0a3a0a',
      wall: '#1a1a1a',
      rock: '#2a2a2a',
      tree: '#1a5a1a',
      water: '#0a2a5a'
    };

    this.ctx.fillStyle = colors[type] || '#0a2a0a';
    this.ctx.fill();
  }

  renderEntities() {
    const entities = this.entitySystem.getVisibleEntities();
    
    // Sort by isometric depth
    entities.sort((a, b) => (a.x + a.y) - (b.x + b.y));

    entities.forEach(entity => {
      const x = this.isometricX(entity.x, entity.y);
      const y = this.isometricY(entity.x, entity.y);
      this.drawEntity(x, y, entity);
    });
  }

  drawEntity(x, y, entity) {
    const w = this.TILE_WIDTH / 2;
    const h = this.TILE_HEIGHT / 2;

    const colors = {
      player: '#ffff00',
      npc: '#00ffff',
      enemy: '#ff0000',
      object: '#ffff00'
    };

    const color = colors[entity.type] || '#00ff00';

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - h - 5);
    this.ctx.lineTo(x + w + 5, y - 5);
    this.ctx.lineTo(x, y + h + 5);
    this.ctx.lineTo(x - w - 5, y - 5);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.fillStyle = color;
    this.ctx.font = '9px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(entity.name.substring(0, 3).toUpperCase(), x, y - 15);
  }

  renderInteractionRange(player) {
    if (!player) return;

    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);

    for (let dx = -this.gameState.interactionRange; dx <= this.gameState.interactionRange; dx++) {
      for (let dy = -this.gameState.interactionRange; dy <= this.gameState.interactionRange; dy++) {
        const x = this.isometricX(player.x + dx, player.y + dy);
        const y = this.isometricY(player.x + dx, player.y + dy);
        const w = this.TILE_WIDTH / 2;
        const h = this.TILE_HEIGHT / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y - h);
        this.ctx.lineTo(x + w, y);
        this.ctx.lineTo(x, y + h);
        this.ctx.lineTo(x - w, y);
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }

    this.ctx.setLineDash([]);
  }

  isometricX(gridX, gridY) {
    return (gridX - gridY) * (this.TILE_WIDTH / 2);
  }

  isometricY(gridX, gridY) {
    return (gridX + gridY) * (this.TILE_HEIGHT / 2);
  }

  updateStatus(text) {
    const elem = document.getElementById('status-text');
    if (elem) elem.textContent = text;
  }

  updatePosition() {
    const player = this.entitySystem.getEntity(this.gameState.playerEntityId);
    if (player) {
      const elem = document.getElementById('position-text');
      if (elem) elem.textContent = `${player.x}, ${player.y}`;
    }
  }

  updateFPS() {
    const elem = document.getElementById('fps-text');
    if (elem) elem.textContent = `${this.fps} fps`;
  }
}

let gameEngine;

document.addEventListener('DOMContentLoaded', async () => {
  gameEngine = new GameEngine();
  await gameEngine.init();
});
