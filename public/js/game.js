/**
 * Skylark ARPG - Core Game Engine
 * Real-time isometric action RPG with player movement and collision
 */

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.animationFrameId = null;
    
    // Timing
    this.frameCount = 0;
    this.fps = 0;
    this.lastSecondTime = Date.now();
    this.deltaTime = 0;
    this.lastFrameTime = Date.now();
    
    // Isometric rendering constants
    this.TILE_WIDTH = 64;
    this.TILE_HEIGHT = 32;
    
    // Player state
    this.player = {
      x: 5,
      y: 5,
      vx: 0,
      vy: 0,
      speed: 2,
      width: 32,
      height: 32
    };
    
    // Map - simple tilemap
    this.map = null;
    this.mapWidth = 20;
    this.mapHeight = 20;
    
    // Camera for following player
    this.camera = {
      x: 0,
      y: 0
    };
    
    // Input state
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      s: false,
      a: false,
      d: false
    };
  }

  init() {
    console.log('🎮 Initializing Skylark ARPG...');
    
    this.createCanvas();
    this.generateMap();
    this.initializeInput();
    this.start();
    
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
    this.ctx = canvas.getContext('2d', { antialias: false });
    container.innerHTML = '';
    container.appendChild(canvas);
    
    console.log(`📐 Canvas created: ${canvas.width}x${canvas.height}`);
  }

  generateMap() {
    // Create a simple map with walkable (0) and non-walkable (1) tiles
    this.map = [];
    for (let y = 0; y < this.mapHeight; y++) {
      this.map[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        // Create walls on edges and some random obstacles
        if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
          this.map[y][x] = 1; // Wall
        } else if (Math.random() < 0.1) {
          this.map[y][x] = 1; // Random obstacle
        } else {
          this.map[y][x] = 0; // Walkable
        }
      }
    }
    
    // Clear starting area
    for (let y = 3; y < 8; y++) {
      for (let x = 3; x < 8; x++) {
        this.map[y][x] = 0;
      }
    }
    
    console.log(`🗺️ Map generated: ${this.mapWidth}x${this.mapHeight}`);
  }

  isWalkable(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi < 0 || xi >= this.mapWidth || yi < 0 || yi >= this.mapHeight) {
      return false;
    }
    return this.map[yi][xi] === 0;
  }

  initializeInput() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup') this.keys.ArrowUp = true;
      if (key === 'arrowdown') this.keys.ArrowDown = true;
      if (key === 'arrowleft') this.keys.ArrowLeft = true;
      if (key === 'arrowright') this.keys.ArrowRight = true;
      if (key === 'w') this.keys.w = true;
      if (key === 's') this.keys.s = true;
      if (key === 'a') this.keys.a = true;
      if (key === 'd') this.keys.d = true;
    });
    
    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup') this.keys.ArrowUp = false;
      if (key === 'arrowdown') this.keys.ArrowDown = false;
      if (key === 'arrowleft') this.keys.ArrowLeft = false;
      if (key === 'arrowright') this.keys.ArrowRight = false;
      if (key === 'w') this.keys.w = false;
      if (key === 's') this.keys.s = false;
      if (key === 'a') this.keys.a = false;
      if (key === 'd') this.keys.d = false;
    });
  }

  update(deltaTime) {
    // Handle player movement
    let moved = false;
    
    if (this.keys.ArrowUp || this.keys.w) {
      const newY = this.player.y - this.player.speed * deltaTime / 1000;
      if (this.isWalkable(this.player.x, newY)) {
        this.player.y = newY;
        moved = true;
      }
    }
    
    if (this.keys.ArrowDown || this.keys.s) {
      const newY = this.player.y + this.player.speed * deltaTime / 1000;
      if (this.isWalkable(this.player.x, newY)) {
        this.player.y = newY;
        moved = true;
      }
    }
    
    if (this.keys.ArrowLeft || this.keys.a) {
      const newX = this.player.x - this.player.speed * deltaTime / 1000;
      if (this.isWalkable(newX, this.player.y)) {
        this.player.x = newX;
        moved = true;
      }
    }
    
    if (this.keys.ArrowRight || this.keys.d) {
      const newX = this.player.x + this.player.speed * deltaTime / 1000;
      if (this.isWalkable(newX, this.player.y)) {
        this.player.x = newX;
        moved = true;
      }
    }
    
    // Update camera to follow player
    const screenCenterX = this.canvas.width / 2;
    const screenCenterY = this.canvas.height / 2;
    
    const screenX = this.player.x * this.TILE_WIDTH;
    const screenY = this.player.y * this.TILE_HEIGHT;
    
    this.camera.x = screenX - screenCenterX;
    this.camera.y = screenY - screenCenterY;
  }

  worldToScreen(worldX, worldY) {
    // Isometric projection
    const screenX = (worldX - worldY) * (this.TILE_WIDTH / 2);
    const screenY = (worldX + worldY) * (this.TILE_HEIGHT / 2);
    
    return {
      x: screenX - this.camera.x,
      y: screenY - this.camera.y
    };
  }

  render() {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw map
    this.renderMap();
    
    // Draw player
    this.renderPlayer();
    
    // Draw HUD
    this.renderHUD();
  }

  renderMap() {
    const ctx = this.ctx;
    
    // Determine which tiles are visible on screen
    const startTile = Math.floor(this.camera.x / (this.TILE_WIDTH / 2)) - 2;
    const endTile = startTile + Math.ceil(this.canvas.width / (this.TILE_WIDTH / 2)) + 4;
    
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth = 1;
    
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const screen = this.worldToScreen(x, y);
        
        // Draw tile diamond (isometric)
        ctx.beginPath();
        ctx.moveTo(screen.x + this.TILE_WIDTH / 2, screen.y);
        ctx.lineTo(screen.x + this.TILE_WIDTH, screen.y + this.TILE_HEIGHT / 2);
        ctx.lineTo(screen.x + this.TILE_WIDTH / 2, screen.y + this.TILE_HEIGHT);
        ctx.lineTo(screen.x, screen.y + this.TILE_HEIGHT / 2);
        ctx.closePath();
        
        // Color based on walkability
        if (this.map[y][x] === 1) {
          ctx.fillStyle = '#331111';
          ctx.fill();
          ctx.strokeStyle = '#660000';
        } else {
          ctx.fillStyle = '#0a2a0a';
          ctx.fill();
          ctx.strokeStyle = '#1a5a1a';
        }
        ctx.stroke();
      }
    }
  }

  renderPlayer() {
    const ctx = this.ctx;
    const screen = this.worldToScreen(this.player.x, this.player.y);
    
    // Draw player as isometric sprite shape
    ctx.save();
    
    // Draw player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      screen.x + this.TILE_WIDTH / 2,
      screen.y + this.TILE_HEIGHT - 4,
      12,
      4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw player body (green character)
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(screen.x + this.TILE_WIDTH / 2, screen.y - 8);
    ctx.lineTo(screen.x + this.TILE_WIDTH / 2 + 8, screen.y + 4);
    ctx.lineTo(screen.x + this.TILE_WIDTH / 2, screen.y + 16);
    ctx.lineTo(screen.x + this.TILE_WIDTH / 2 - 8, screen.y + 4);
    ctx.closePath();
    ctx.fill();
    
    // Draw player head
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(
      screen.x + this.TILE_WIDTH / 2,
      screen.y - 12,
      6,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.restore();
  }

  renderHUD() {
    const ctx = this.ctx;
    
    // Draw position info
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`POS: ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}`, 10, 20);
    ctx.fillText(`FPS: ${this.fps}`, 10, 35);
    ctx.fillText('WASD or ARROW KEYS to move', 10, 50);
  }

  gameLoop(currentTime) {
    // Calculate delta time
    this.deltaTime = Math.min(currentTime - this.lastFrameTime, 100);
    this.lastFrameTime = currentTime;
    
    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.lastSecondTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastSecondTime = currentTime;
    }
    
    // Update and render
    this.update(this.deltaTime);
    this.render();
    
    // Continue loop
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine();
  engine.init();
  
  // Make available globally for debugging
  window.gameEngine = engine;
});
