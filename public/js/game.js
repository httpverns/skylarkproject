import { EntitySystem } from './systems/entity-system.js';
import { NPCSystem } from './systems/npc-system.js';
import { DialogueUI } from './systems/dialogue-ui.js';
import { InteractiveObjectSystem } from './systems/interactive-object-system.js';
import { QuestSystem } from './systems/quest-system.js';
import { ProgressionSystem } from './systems/progression-system.js';
import { loadImage } from './asset-loader.js';

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.animationFrameId = null;

    this.frameCount = 0;
    this.fps = 0;
    this.lastSecondTime = Date.now();
    this.deltaTime = 0;
    this.lastFrameTime = Date.now();

    this.TILE_WIDTH = 64;
    this.TILE_HEIGHT = 32;

    this.player = {
      x: 5,
      y: 5,
      vx: 0,
      vy: 0,
      speed: 2.4,
      width: 32,
      height: 32,
      animationState: 'idle',
      attackTimer: 0
    };

    this.map = null;
    this.mapWidth = 20;
    this.mapHeight = 20;

    this.camera = { x: 0, y: 0 };

    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      s: false,
      a: false,
      d: false,
      e: false,
      q: false,
      Escape: false
    };

    this.entitySystem = new EntitySystem();
    this.npcSystem = new NPCSystem(this.entitySystem);
    this.questSystem = new QuestSystem(this.entitySystem, this.npcSystem);
    this.interactiveObjectSystem = new InteractiveObjectSystem(this.entitySystem, this.questSystem);
    this.progressionSystem = new ProgressionSystem();
    this.dialogueUI = new DialogueUI();

    this.npcEntityMap = new Map();
    this.inventory = new Map();
    this.reputation = new Map();
    this.itemCatalog = { items: [] };
    this.statusMessage = 'Preparing mission control...';
    this.selectedQuestId = null;
    this.interactRequested = false;
    this.hudElements = {};
    this.assets = {
      ground: null,
      wall: null,
      player: null,
      npc: null,
      object: null,
      player3d: null,
      npc3d: null,
      playerIdle: null,
      playerRun: null,
      playerAttack: null,
      npcIdle: null,
      npcRun: null,
      npcAttack: null
    };
    this.particles = [];
    this.effectTime = 0;

    this.bindQuestEvents();
  }

  bindQuestEvents() {
    this.questSystem.onQuestAccepted = (quest) => {
      this.setStatus(`Quest accepted: ${quest.title}`);
      this.updateHUD();
    };

    this.questSystem.onQuestCompleted = (quest) => {
      this.grantQuestRewards(quest);
      this.setStatus(`Quest complete: ${quest.title}`);
      this.updateHUD();
    };
  }

  init() {
    console.log('🎮 Initializing Skylark ARPG...');

    this.createCanvas();
    this.generateMap();
    this.initializeInput();
    this.setupHUD();
    this.loadAssets();
    this.loadGameData();

    console.log('✅ Game engine initialized');
  }

  createCanvas() {
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Cannot find game-canvas element');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.ctx.imageSmoothingEnabled = true;
    container.innerHTML = '';
    container.appendChild(canvas);

    console.log(`📐 Canvas created: ${canvas.width}x${canvas.height}`);
  }

  setupHUD() {
    this.hudElements.status = document.getElementById('status-text');
    this.hudElements.position = document.getElementById('position-text');
    this.hudElements.fps = document.getElementById('fps-text');
    this.hudElements.questLog = document.getElementById('quest-log');
    this.hudElements.inventory = document.getElementById('inventory-list');
    this.hudElements.reputation = document.getElementById('reputation-text');
    this.hudElements.playerStats = document.getElementById('player-stats');
  }

  async loadAssets() {
    const assetMap = [
      ['ground', '/assets/graphics/ground-tile.png'],
      ['wall', '/assets/graphics/wall-tile.png'],
      ['player', '/assets/graphics/player.png'],
      ['npc', '/assets/graphics/npc.png'],
      ['object', '/assets/graphics/object.png'],
      ['player3d', '/assets/graphics/player-3d.png'],
      ['npc3d', '/assets/graphics/npc-3d.png'],
      ['playerIdle', '/assets/graphics/player-idle.png'],
      ['playerRun', '/assets/graphics/player-run.png'],
      ['playerAttack', '/assets/graphics/player-attack.png'],
      ['npcIdle', '/assets/graphics/npc-idle.png'],
      ['npcRun', '/assets/graphics/npc-run.png'],
      ['npcAttack', '/assets/graphics/npc-attack.png']
    ];

    for (const [key, url] of assetMap) {
      try {
        this.assets[key] = await loadImage(url);
      } catch (error) {
        console.warn(`Unable to load ${url}`, error);
      }
    }
  }

  generateMap() {
    this.map = [];
    for (let y = 0; y < this.mapHeight; y++) {
      this.map[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
          this.map[y][x] = 1;
        } else if (Math.random() < 0.1) {
          this.map[y][x] = 1;
        } else {
          this.map[y][x] = 0;
        }
      }
    }

    for (let y = 3; y < 8; y++) {
      for (let x = 3; x < 8; x++) {
        this.map[y][x] = 0;
      }
    }

    console.log(`🗺️ Map generated: ${this.mapWidth}x${this.mapHeight}`);
  }

  async loadGameData() {
    try {
      const [npcResponse, questResponse, itemResponse] = await Promise.all([
        fetch('/data/npcs.json'),
        fetch('/data/quests.json'),
        fetch('/data/items.json')
      ]);

      const npcData = await npcResponse.json();
      const questData = await questResponse.json();
      const itemData = await itemResponse.json();

      this.itemCatalog = itemData;
      this.initializeWorld(npcData, questData);
      await this.npcSystem.initializeNPCs(npcData.npcs || []);
      this.setStatus('Mission control online. Speak with Martin or Dorothy.');
      this.updateHUD();
      this.start();
    } catch (error) {
      console.error('⚠️ Failed to load gameplay data:', error);
      this.setStatus('Unable to load mission data.');
      this.start();
    }
  }

  initializeWorld(npcData, questData) {
    this.entitySystem.entities = [];
    this.npcEntityMap.clear();
    this.inventory.clear();
    this.reputation.clear();
    this.selectedQuestId = null;
    this.questSystem = new QuestSystem(this.entitySystem, this.npcSystem);
    this.interactiveObjectSystem = new InteractiveObjectSystem(this.entitySystem, this.questSystem);
    this.progressionSystem = new ProgressionSystem();
    this.bindQuestEvents();

    this.player.x = 5;
    this.player.y = 5;

    this.spawnNPCs(npcData.npcs || []);
    this.spawnInteractables();
    this.initializeQuests(questData.quests || []);
    this.updateHUD();
  }

  spawnNPCs(npcs) {
    npcs.forEach((npcDef) => {
      const entity = this.entitySystem.createEntity({
        type: 'npc',
        name: npcDef.name,
        x: npcDef.x,
        y: npcDef.y,
        sprite: npcDef.role || 'npc',
        data: { npcId: npcDef.id }
      });

      this.npcEntityMap.set(npcDef.id, entity.id);
      this.map[npcDef.y][npcDef.x] = 0;
    });
  }

  spawnInteractables() {
    const objects = [
      { type: 'chest', name: 'Exotic Matter Cache', x: 4, y: 4, data: { rewardItem: 'exotic_matter', rewardQuantity: 1 } },
      { type: 'terminal', name: 'Catalyst Silo Terminal', x: 12, y: 4, data: { rewardItem: 'energy_catalyst', rewardQuantity: 2 } },
      { type: 'terminal', name: 'Lab Terminal 1', x: 10, y: 6, data: { rewardItem: 'analysis_report', rewardQuantity: 1 } },
      { type: 'terminal', name: 'Lab Terminal 2', x: 11, y: 7, data: { rewardItem: 'analysis_report', rewardQuantity: 1 } },
      { type: 'workbench', name: 'X-metal Workbench', x: 8, y: 8, data: { rewardItem: 'xmetal_sample', rewardQuantity: 1 } }
    ];

    objects.forEach((def) => {
      this.interactiveObjectSystem.createObject(def);
      this.map[def.y][def.x] = 0;
    });
  }

  initializeQuests(questDefinitions) {
    questDefinitions.forEach((questDef) => {
      this.questSystem.createQuest(questDef);
    });
  }

  isWalkable(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi < 0 || xi >= this.mapWidth || yi < 0 || yi >= this.mapHeight) {
      return false;
    }

    if (this.map[yi][xi] === 1) {
      return false;
    }

    return !this.entitySystem.getEntitiesAt(xi, yi).some((entity) => entity.walkable === false);
  }

  initializeInput() {
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();

      if (key === 'arrowup') this.keys.ArrowUp = true;
      if (key === 'arrowdown') this.keys.ArrowDown = true;
      if (key === 'arrowleft') this.keys.ArrowLeft = true;
      if (key === 'arrowright') this.keys.ArrowRight = true;
      if (key === 'w') this.keys.w = true;
      if (key === 's') this.keys.s = true;
      if (key === 'a') this.keys.a = true;
      if (key === 'd') this.keys.d = true;
      if (key === 'e') {
        event.preventDefault();
        this.interactRequested = true;
      }
      if (key === 'q') {
        event.preventDefault();
        this.cycleQuest();
      }
      if (key === 'escape') {
        this.dialogueUI.close();
      }
    });

    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();

      if (key === 'arrowup') this.keys.ArrowUp = false;
      if (key === 'arrowdown') this.keys.ArrowDown = false;
      if (key === 'arrowleft') this.keys.ArrowLeft = false;
      if (key === 'arrowright') this.keys.ArrowRight = false;
      if (key === 'w') this.keys.w = false;
      if (key === 's') this.keys.s = false;
      if (key === 'a') this.keys.a = false;
      if (key === 'd') this.keys.d = false;
      if (key === 'e') this.keys.e = false;
      if (key === 'q') this.keys.q = false;
      if (key === 'escape') this.keys.Escape = false;
    });
  }

  update(deltaTime) {
    this.effectTime += deltaTime / 1000;
    this.updateParticles(deltaTime);

    if (this.interactRequested) {
      this.interactRequested = false;
      this.player.attackTimer = 0.25;
      this.handleInteraction();
    }

    const moving = this.keys.ArrowUp || this.keys.w || this.keys.ArrowDown || this.keys.s || this.keys.ArrowLeft || this.keys.a || this.keys.ArrowRight || this.keys.d;

    if (this.player.attackTimer > 0) {
      this.player.attackTimer = Math.max(0, this.player.attackTimer - deltaTime / 1000);
    }

    if (this.keys.ArrowUp || this.keys.w) {
      const newY = this.player.y - this.player.speed * deltaTime / 1000;
      if (this.isWalkable(this.player.x, newY)) {
        this.player.y = newY;
      }
    }

    if (this.keys.ArrowDown || this.keys.s) {
      const newY = this.player.y + this.player.speed * deltaTime / 1000;
      if (this.isWalkable(this.player.x, newY)) {
        this.player.y = newY;
      }
    }

    if (this.keys.ArrowLeft || this.keys.a) {
      const newX = this.player.x - this.player.speed * deltaTime / 1000;
      if (this.isWalkable(newX, this.player.y)) {
        this.player.x = newX;
      }
    }

    if (this.keys.ArrowRight || this.keys.d) {
      const newX = this.player.x + this.player.speed * deltaTime / 1000;
      if (this.isWalkable(newX, this.player.y)) {
        this.player.x = newX;
      }
    }

    if (this.player.attackTimer > 0) {
      this.player.animationState = 'attack';
    } else if (moving) {
      this.player.animationState = 'run';
    } else {
      this.player.animationState = 'idle';
    }

    const screenCenterX = this.canvas.width / 2;
    const screenCenterY = this.canvas.height / 2;

    const screenX = this.player.x * this.TILE_WIDTH;
    const screenY = this.player.y * this.TILE_HEIGHT;

    this.camera.x = screenX - screenCenterX;
    this.camera.y = screenY - screenCenterY;
  }

  worldToScreen(worldX, worldY) {
    const screenX = (worldX - worldY) * (this.TILE_WIDTH / 2);
    const screenY = (worldX + worldY) * (this.TILE_HEIGHT / 2);

    return {
      x: screenX - this.camera.x,
      y: screenY - this.camera.y
    };
  }

  updateParticles(deltaTime) {
    const spawnChance = 0.03 + Math.sin(this.effectTime * 0.6) * 0.01;
    if (Math.random() < spawnChance) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: 0.06 + Math.random() * 0.08,
        life: 1.2 + Math.random() * 1.2,
        maxLife: 1.2 + Math.random() * 1.2,
        size: 1 + Math.random() * 2.2,
        alpha: 0.45 + Math.random() * 0.35
      });
    }

    this.particles = this.particles.filter((p) => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime * 60;
      p.life -= deltaTime / 1000;
      return p.life > 0;
    });
  }

  render() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#07131f');
    sky.addColorStop(0.45, '#142c41');
    sky.addColorStop(1, '#050b12');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const haze = ctx.createRadialGradient(width * 0.5, height * 0.35, 0, width * 0.5, height * 0.35, width * 0.8);
    haze.addColorStop(0, 'rgba(112, 175, 255, 0.22)');
    haze.addColorStop(0.65, 'rgba(41, 79, 124, 0.09)');
    haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    this.renderParticles();
    this.renderMap();
    this.renderWorldEntities();
    this.renderPlayer();
    this.renderHUD();
  }

  renderParticles() {
    const ctx = this.ctx;
    this.particles.forEach((p) => {
      const alpha = p.alpha * (p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#95dfff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawIsoTile(screen, isWall) {
    const ctx = this.ctx;
    const tile = isWall ? this.assets.wall : this.assets.ground;
    const width = this.TILE_WIDTH;
    const height = this.TILE_HEIGHT + 24;

    ctx.save();
    ctx.translate(screen.x, screen.y);

    ctx.beginPath();
    ctx.moveTo(width / 2, 4);
    ctx.lineTo(width, height / 2 - 2);
    ctx.lineTo(width / 2, height - 4);
    ctx.lineTo(0, height / 2 - 2);
    ctx.closePath();

    const shadow = ctx.createLinearGradient(0, 0, width, height);
    shadow.addColorStop(0, isWall ? 'rgba(0, 0, 0, 0.24)' : 'rgba(0, 0, 0, 0.22)');
    shadow.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = shadow;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width, height / 2 - 2);
    ctx.lineTo(width / 2, height);
    ctx.lineTo(0, height / 2 - 2);
    ctx.closePath();

    const topGrad = ctx.createLinearGradient(0, 0, width, height);
    topGrad.addColorStop(0, isWall ? '#5d6477' : '#4f8f4f');
    topGrad.addColorStop(0.55, isWall ? '#2f3142' : '#2d6430');
    topGrad.addColorStop(1, isWall ? '#1c1d2a' : '#172b18');
    ctx.fillStyle = topGrad;
    ctx.fill();

    if (tile) {
      ctx.globalAlpha = 0.75;
      ctx.drawImage(tile, 6, 5, width - 12, height - 10);
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (isWall) {
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width, height / 2 - 2);
      ctx.lineTo(width, height / 2 + 8);
      ctx.lineTo(width / 2, height + 4);
      ctx.closePath();
      const sideGrad = ctx.createLinearGradient(width, height / 2 - 2, width, height + 4);
      sideGrad.addColorStop(0, 'rgba(24, 20, 30, 0.72)');
      sideGrad.addColorStop(1, 'rgba(7, 7, 10, 0.95)');
      ctx.fillStyle = sideGrad;
      ctx.fill();
    }

    ctx.restore();
  }

  renderMap() {
    const ctx = this.ctx;

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const screen = this.worldToScreen(x, y);
        this.drawIsoTile(screen, this.map[y][x] === 1);
      }
    }
  }

  renderWorldEntities() {
    const ctx = this.ctx;

    this.entitySystem.getVisibleEntities().forEach((entity) => {
      const screen = this.worldToScreen(entity.x, entity.y);
      const sprite = entity.type === 'npc' ? this.assets.npc : this.assets.object;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(screen.x + this.TILE_WIDTH / 2, screen.y + this.TILE_HEIGHT + 16, 22, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fill();
      ctx.restore();

      if (entity.type === 'npc') {
        const poseSprite = this.assets.npcIdle || this.assets.npc3d || this.assets.npc || sprite;
        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = 'rgba(95, 190, 255, 0.28)';
        const bob = Math.sin(this.effectTime * 3 + entity.x * 0.8 + entity.y * 0.3) * 1.4;
        ctx.drawImage(poseSprite, screen.x - 8, screen.y - 24 + bob, 88, 112);
        ctx.restore();
      } else if (sprite) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 200, 92, 0.25)';
        const bob = Math.sin(this.effectTime * 3 + entity.x * 0.8 + entity.y * 0.3) * 1.4;
        ctx.drawImage(sprite, screen.x + 2, screen.y - 16 + bob, 60, 72);
        ctx.restore();
      } else if (entity.type === 'npc') {
        ctx.save();
        ctx.fillStyle = '#4aa3ff';
        ctx.beginPath();
        ctx.moveTo(screen.x + this.TILE_WIDTH / 2, screen.y + 4);
        ctx.lineTo(screen.x + this.TILE_WIDTH / 2 + 10, screen.y + 16);
        ctx.lineTo(screen.x + this.TILE_WIDTH / 2, screen.y + 28);
        ctx.lineTo(screen.x + this.TILE_WIDTH / 2 - 10, screen.y + 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (entity.type === 'object') {
        ctx.save();
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(screen.x + this.TILE_WIDTH / 2 - 8, screen.y + 10, 16, 16);
        ctx.restore();
      }
    });
  }

  renderPlayer() {
    const ctx = this.ctx;
    const screen = this.worldToScreen(this.player.x, this.player.y);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(screen.x + this.TILE_WIDTH / 2, screen.y + this.TILE_HEIGHT + 16, 24, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
    ctx.restore();

    if (this.assets.player3d || this.assets.playerIdle || this.assets.player) {
      ctx.save();
      ctx.shadowBlur = 26;
      ctx.shadowColor = 'rgba(34, 226, 255, 0.34)';
      const bob = Math.sin(this.effectTime * 4.5) * 2.5;
      const sprite = this.player.animationState === 'attack'
        ? this.assets.playerAttack || this.assets.playerIdle || this.assets.player3d || this.assets.player
        : this.player.animationState === 'run'
          ? this.assets.playerRun || this.assets.playerIdle || this.assets.player3d || this.assets.player
          : this.assets.playerIdle || this.assets.player3d || this.assets.player;
      ctx.drawImage(sprite, screen.x - 8, screen.y - 28 + bob, 96, 128);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.moveTo(screen.x + this.TILE_WIDTH / 2, screen.y - 8);
      ctx.lineTo(screen.x + this.TILE_WIDTH / 2 + 8, screen.y + 4);
      ctx.lineTo(screen.x + this.TILE_WIDTH / 2, screen.y + 16);
      ctx.lineTo(screen.x + this.TILE_WIDTH / 2 - 8, screen.y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(screen.x + this.TILE_WIDTH / 2, screen.y - 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderHUD() {
    const ctx = this.ctx;
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`POS: ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}`, 10, 20);
    ctx.fillText(`FPS: ${this.fps}`, 10, 35);
    ctx.fillText('WASD / ARROWS to move • E interact • Q quest', 10, 50);
  }

  gameLoop(currentTime) {
    this.deltaTime = Math.min(currentTime - this.lastFrameTime, 100);
    this.lastFrameTime = currentTime;

    this.frameCount++;
    if (currentTime - this.lastSecondTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastSecondTime = currentTime;
    }

    this.update(this.deltaTime);
    this.render();

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));

    console.log('▶️ Game loop started');
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    console.log('⏹️ Game loop stopped');
  }

  setStatus(message) {
    this.statusMessage = message;
    if (this.hudElements.status) {
      this.hudElements.status.textContent = message;
    }
  }

  updateHUD() {
    if (this.hudElements.position) {
      this.hudElements.position.textContent = `${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}`;
    }
    if (this.hudElements.fps) {
      this.hudElements.fps.textContent = `${this.fps} fps`;
    }
    if (this.hudElements.playerStats) {
      this.hudElements.playerStats.innerHTML = `
        <div class="hud-label">PLAYER</div>
        <div class="hud-value">Level ${this.progressionSystem.player.level}</div>
        <div class="hud-value">HP ${this.progressionSystem.player.health}/${this.progressionSystem.player.maxHealth}</div>
        <div class="hud-value">Energy ${this.progressionSystem.player.energy}/${this.progressionSystem.player.maxEnergy}</div>
      `;
    }

    if (this.hudElements.questLog) {
      const activeQuests = this.questSystem.getActiveQuests();
      if (activeQuests.length > 0) {
        this.hudElements.questLog.innerHTML = activeQuests.map((quest) => `<div class="quest-entry">• ${quest.title}</div>`).join('');
      } else {
        this.hudElements.questLog.innerHTML = '<div class="quest-entry">No active missions.</div>';
      }
    }

    if (this.hudElements.inventory) {
      const entries = Array.from(this.inventory.entries());
      if (entries.length > 0) {
        this.hudElements.inventory.innerHTML = entries.map(([itemId, quantity]) => `<li>${this.getItemName(itemId)} ×${quantity}</li>`).join('');
      } else {
        this.hudElements.inventory.innerHTML = '<li>No items yet</li>';
      }
    }

    if (this.hudElements.reputation) {
      const entries = Array.from(this.reputation.entries());
      if (entries.length > 0) {
        this.hudElements.reputation.innerHTML = entries.map(([faction, value]) => `<div>${faction}: ${value}</div>`).join('');
      } else {
        this.hudElements.reputation.innerHTML = '<div>No reputation yet</div>';
      }
    }
  }

  cycleQuest() {
    const activeQuests = this.questSystem.getActiveQuests();
    if (activeQuests.length === 0) {
      this.setStatus('No active missions.');
      return;
    }

    const currentIndex = activeQuests.findIndex((quest) => quest.id === this.selectedQuestId);
    const nextQuest = activeQuests[(currentIndex + 1) % activeQuests.length];
    this.selectedQuestId = nextQuest.id;
    this.setStatus(`${nextQuest.title}: ${nextQuest.description}`);
    this.updateHUD();
  }

  handleInteraction() {
    if (this.dialogueUI.isOpen) {
      this.dialogueUI.close();
      this.setStatus('Conversation closed.');
      return;
    }

    const candidates = this.getNearbyInteractables();
    if (!candidates.length) {
      this.setStatus('No target nearby.');
      return;
    }

    const target = candidates[0];
    if (target.type === 'entity') {
      const entity = target.entity;
      if (entity.type === 'npc') {
        this.interactWithNPC(entity);
      }
    } else if (target.type === 'object') {
      this.interactWithObject(target.object);
    }
  }

  getNearbyInteractables() {
    const neighbors = [];
    const playerX = Math.floor(this.player.x);
    const playerY = Math.floor(this.player.y);

    this.entitySystem.getVisibleEntities().forEach((entity) => {
      const distance = Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY);
      if (distance <= 1) {
        neighbors.push({ type: 'entity', entity, distance });
      }
    });

    this.interactiveObjectSystem.getAllObjects().forEach((object) => {
      const distance = Math.abs(object.x - playerX) + Math.abs(object.y - playerY);
      if (distance <= 1) {
        neighbors.push({ type: 'object', object, distance });
      }
    });

    neighbors.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      if (a.type === 'entity' && b.type !== 'entity') {
        return -1;
      }
      if (a.type !== 'entity' && b.type === 'entity') {
        return 1;
      }
      return 0;
    });

    return neighbors;
  }

  interactWithNPC(entity) {
    const npcId = entity.data?.npcId || entity.id;
    const result = this.npcSystem.interactWithNPC(entity.id);
    if (!result.success) {
      this.setStatus(result.message);
      return;
    }

    this.dialogueUI.onOptionSelected = (option) => this.handleDialogueOption(option, npcId);
    this.dialogueUI.open({ npcName: result.npcName, dialogue: result.dialogue });
    this.setStatus(`${result.npcName} is ready to talk.`);
  }

  handleDialogueOption(option, npcId) {
    if (option.questStart) {
      const quest = this.questSystem.getQuest(option.questStart);
      if (this.questSystem.acceptQuest(option.questStart)) {
        this.setStatus(`Quest accepted: ${quest.title}`);
      } else {
        this.setStatus('That mission is unavailable right now.');
      }
    } else if (option.questUpdate) {
      this.setStatus('Mission updated.');
    }

    this.updateHUD();
  }

  interactWithObject(object) {
    const result = this.interactiveObjectSystem.interact(object.id, this.player);
    if (!result.success) {
      this.setStatus(result.message);
      return;
    }

    if (result.contents && result.contents.length) {
      result.contents.forEach((entry) => this.addItem(entry.id, entry.quantity || 1));
    }

    if (object.data?.rewardItem) {
      this.addItem(object.data.rewardItem, object.data.rewardQuantity || 1);
    }

    if (object.type === 'workbench') {
      this.completeObjective('synthesis_workbench');
      this.addItem('xmetal_sample', 1);
      this.setStatus('The workbench produces a small X-metal sample.');
    } else if (object.type === 'terminal') {
      this.completeObjective(object.name.toLowerCase().includes('lab') ? 'lab_terminal' : 'terminal_scan');
      this.setStatus(`${object.name} scanned.`);
    } else {
      this.setStatus(result.message);
    }

    this.updateHUD();
  }

  addItem(itemId, quantity = 1) {
    const existing = this.inventory.get(itemId) || 0;
    this.inventory.set(itemId, existing + quantity);

    const questTargets = this.questSystem.getActiveQuests().flatMap((quest) => quest.objectives.map((objective, index) => ({ quest, objective, index })));
    const matching = questTargets.find((entry) => entry.objective.type === 'collect' && entry.objective.target === itemId);
    if (matching) {
      const needed = matching.objective.required || 1;
      const total = (this.inventory.get(itemId) || 0);
      this.questSystem.updateObjective(matching.quest.id, matching.index, total >= needed);
    }

    this.progressionSystem.restoreEnergy(2);
    this.setStatus(`${this.getItemName(itemId)} acquired.`);
  }

  completeObjective(target) {
    const activeQuests = this.questSystem.getActiveQuests();
    activeQuests.forEach((quest) => {
      const objectiveIndex = quest.objectives.findIndex((objective) => objective.target === target);
      if (objectiveIndex >= 0) {
        this.questSystem.updateObjective(quest.id, objectiveIndex, true);
      }
    });
  }

  grantQuestRewards(quest) {
    this.progressionSystem.addExperience(quest.rewards.xp || 0);
    const reputation = quest.rewards.reputation || {};
    Object.entries(reputation).forEach(([faction, amount]) => {
      const current = this.reputation.get(faction) || 0;
      this.reputation.set(faction, current + amount);
    });

    (quest.rewards.items || []).forEach((item) => {
      this.addItem(item.id, item.quantity || 1);
    });
  }

  getItemName(itemId) {
    const item = this.itemCatalog.items?.find((entry) => entry.id === itemId) || this.itemCatalog.weapons?.find((entry) => entry.id === itemId) || this.itemCatalog.armor?.find((entry) => entry.id === itemId);
    return item?.name || itemId;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine();
  engine.init();
  window.gameEngine = engine;
});
