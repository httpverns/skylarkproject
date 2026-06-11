/**
 * Skylark ARPG - Core Game Engine (Phase 3)
 * Integrated quest system, interactive objects, map transitions, and progression
 */

import { MapSystem } from './systems/map-system.js';
import { EntitySystem } from './systems/entity-system.js';
import { NPCSystem } from './systems/npc-system.js';
import { DialogueUI } from './systems/dialogue-ui.js';
import { QuestSystem } from './systems/quest-system.js';
import { InteractiveObjectSystem } from './systems/interactive-object-system.js';
import { MapTransitionSystem } from './systems/map-transition-system.js';
import { ProgressionSystem } from './systems/progression-system.js';

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
    this.questSystem = new QuestSystem(this.entitySystem, this.npcSystem);
    this.objectSystem = new InteractiveObjectSystem(this.entitySystem, this.questSystem);
    this.transitionSystem = new MapTransitionSystem(this.mapSystem, this.entitySystem);
    this.progressionSystem = new ProgressionSystem();
    this.dialogueUI = new DialogueUI();
    
    // Game state
    this.gameState = {
      mapName: 'earth_base_01',
      playerEntityId: null,
      playerX: 5,
      playerY: 5,
      selectedEntityId: null,
      interactionRange: 1,
      completedQuests: new Set(),
      activeQuestId: null
    };

    // Tile constants
    this.TILE_SIZE = 32;
    this.TILE_WIDTH = 64;
    this.TILE_HEIGHT = 32;
  }

  async init() {
    console.log('🎮 Initializing Skylark ARPG Engine (Phase 3)...');
    
    this.createCanvas();
    await this.loadGameConfig();
    await this.loadMap(this.gameState.mapName);
    this.spawnPlayer();
    await this.spawnNPCs();
    this.createInteractiveObjects();
    this.createMapTransitions();
    this.createQuests();
    this.initializeInput();
    this.setupCallbacks();
    this.start();
    
    console.log('✅ Game engine initialized (Phase 3)');
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
    const npcDefinitions = await this.loadNPCDefinitions();
    await this.npcSystem.initializeNPCs(npcDefinitions);
    
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
    return [
      { id: 'martin_crane', name: 'Martin Crane', role: 'ally', x: 7, y: 6, sprite: 'crane' },
      { id: 'dorothy_vaneman', name: 'Dorothy Vaneman', role: 'companion', x: 8, y: 7, sprite: 'dorothy' }
    ];
  }

  createInteractiveObjects() {
    // Workbench for X-metal synthesis
    this.objectSystem.createObject({
      type: 'workbench',
      name: 'X-metal Synthesis Station',
      x: 10,
      y: 5,
      initialState: 'ready',
      recipes: ['synthesize_xmetal']
    });

    // Storage chest
    this.objectSystem.createObject({
      type: 'chest',
      name: 'Equipment Storage',
      x: 12,
      y: 5,
      contents: [
        { name: 'Scanner', id: 'scanner_001', quantity: 1 },
        { name: 'Data Crystal', id: 'data_crystal_001', quantity: 3 }
      ]
    });

    // Door to lab
    this.objectSystem.createObject({
      type: 'door',
      name: 'Laboratory Door',
      x: 5,
      y: 3,
      initialState: 'closed',
      locked: false
    });
  }

  createMapTransitions() {
    // Exit to spacedock (not yet implemented)
    this.transitionSystem.createTransition({
      fromMap: 'earth_base_01',
      toMap: 'spacedock_01',
      x: 0,
      y: 6,
      destX: 5,
      destY: 5,
      name: 'Exit to Spacedock',
      type: 'door'
    });
  }

  createQuests() {
    // Main quest: Synthesize X-metal
    const mainQuest = this.questSystem.createQuest({
      title: 'Synthesize X-metal',
      description: 'Martin has discovered the formula for X-metal synthesis. Use the workbench to create the first sample.',
      giver: 'martin_crane',
      objectives: [
        { type: 'use_workbench', target: 'synthesis_station', completed: false },
        { type: 'collect_item', target: 'xmetal_sample_01', completed: false }
      ],
      rewards: {
        xp: 250,
        items: [{ name: 'X-metal Sample', id: 'xmetal_sample_01', quantity: 1 }],
        reputation: 50
      }
    });

    // Side quest: Gather research data
    const sideQuest = this.questSystem.createQuest({
      title: 'Gather Research Data',
      description: 'Dorothy needs additional data readings for her analysis. Check the laboratory instruments.',
      giver: 'dorothy_vaneman',
      objectives: [
        { type: 'use_object', target: 'lab_instrument_01', completed: false },
        { type: 'use_object', target: 'lab_instrument_02', completed: false }
      ],
      rewards: {
        xp: 150,
        items: [],
        reputation: 30
      },
      prerequisites: [] // Can do anytime
    });

    console.log(`📋 Created ${this.questSystem.quests.size} quests`);
  }

  setupCallbacks() {
    // Quest callbacks
    this.questSystem.onQuestAccepted = (quest) => {
      this.gameState.activeQuestId = quest.id;
      this.updateStatus(`Quest: ${quest.title}`);
    };

    this.questSystem.onQuestCompleted = (quest) => {
      const rewards = this.questSystem.getRewardSummary(quest.id);
      this.progressionSystem.addExperience(rewards.xp);
      this.gameState.completedQuests.add(quest.id);
      this.updateStatus(`QUEST COMPLETE: ${rewards.xp} XP earned!`);
    };
  }

  initializeInput() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.movePlayer(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') this.movePlayer(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') this.movePlayer(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') this.movePlayer(1, 0);
      if (e.key === 'e' || e.key === 'E') this.interactWithNearby();
      if (e.key === 'Escape') this.dialogueUI.close();
      if (e.key === 'q' || e.key === 'Q') this.cycleQuest();
    });
  }

  movePlayer(dx, dy) {
    const player = this.entitySystem.getEntity(this.gameState.playerEntityId);
    if (!player) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (this.mapSystem.isWalkable(newX, newY)) {
      const entitiesAtPos = this.entitySystem.getEntitiesAt(newX, newY);
      if (entitiesAtPos.some(e => !['npc', 'object'].includes(e.type))) {
        return;
      }

      this.entitySystem.moveEntity(player.id, newX, newY);
      this.updatePosition();
      this.checkForTransition(player);
    }
  }

  checkForTransition(player) {
    const transition = this.transitionSystem.getTransitionAt(player, this.gameState.mapName);
    if (transition) {
      console.log(`🚪 Found transition: ${transition.name}`);
      this.updateStatus(`Press T to travel: ${transition.name}`);
    }
  }

  interactWithNearby() {
    const player = this.entitySystem.getEntity(this.gameState.playerEntityId);
    if (!player) return;

    // Check for NPCs
    const nearbyNPCs = this.entitySystem.entities.filter(e => {
      const distance = Math.max(Math.abs(e.x - player.x), Math.abs(e.y - player.y));
      return e.type === 'npc' && distance <= this.gameState.interactionRange;
    });

    if (nearbyNPCs.length > 0) {
      const npc = nearbyNPCs[0];
      const interaction = this.npcSystem.interactWithNPC(npc.id);
      if (interaction.success) {
        this.dialogueUI.open(interaction);
      }
      return;
    }

    // Check for objects
    const nearbyObjects = this.objectSystem.getObjectsAt(player.x, player.y);
    if (nearbyObjects.length > 0) {
      const obj = nearbyObjects[0];
      const result = this.objectSystem.interact(obj.id, player);
      if (result.success) {
        this.updateStatus(result.message);
      }
    }
  }

  cycleQuest() {
    const activeQuests = this.questSystem.getActiveQuests();
    if (activeQuests.length === 0) {
      this.updateStatus('No active quests');
      return;
    }

    const currentIndex = activeQuests.findIndex(q => q.id === this.gameState.activeQuestId);
    const nextIndex = (currentIndex + 1) % activeQuests.length;
    const nextQuest = activeQuests[nextIndex];

    this.gameState.activeQuestId = nextQuest.id;
    this.updateStatus(`Quest: ${nextQuest.title} (${nextQuest.progress}%)`);
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
    // Update progression system
    const charSheet = this.progressionSystem.getCharacterSheet();
    // Updates would go here for real-time effects
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
    this.renderObjects();
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

  renderObjects() {
    const objects = this.objectSystem.getAllObjects();
    objects.forEach(obj => {
      const x = this.isometricX(obj.x, obj.y);
      const y = this.isometricY(obj.x, obj.y);
      this.drawObject(x, y, obj);
    });
  }

  drawObject(x, y, obj) {
    const w = this.TILE_WIDTH / 2;
    const h = this.TILE_HEIGHT / 2;

    const colors = {
      door: '#ff9900',
      chest: '#ffcc00',
      terminal: '#00ccff',
      workbench: '#ff6600'
    };

    const color = colors[obj.type] || '#ffff00';

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - h - 3);
    this.ctx.lineTo(x + w + 3, y - 3);
    this.ctx.lineTo(x, y + h + 3);
    this.ctx.lineTo(x - w - 3, y - 3);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.fillStyle = color;
    this.ctx.font = '8px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(obj.type[0].toUpperCase(), x, y - 12);
  }

  renderEntities() {
    const entities = this.entitySystem.getVisibleEntities();
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
