#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API: Game configuration
app.get('/api/config', (req, res) => {
  res.json({
    title: 'Skylark ARPG',
    version: '0.2.0',
    gameStartMap: 'earth_base_01',
    startPosition: { x: 5, y: 5 }
  });
});

// API: Load map data
app.get('/api/maps/:mapName', (req, res) => {
  const mapName = req.params.mapName;
  const mapDataPath = path.join(__dirname, '../public/mods/flare_game/data/maps', `${mapName}.txt`);
  
  if (fs.existsSync(mapDataPath)) {
    const mapData = fs.readFileSync(mapDataPath, 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(mapData);
  } else {
    // Return empty map data - engine will generate procedural map
    res.setHeader('Content-Type', 'text/plain');
    res.send('[header]\nwidth=15\nheight=12\n');
  }
});

// API: Load NPC dialogue
app.get('/api/dialogue/:npcId', (req, res) => {
  const npcId = req.params.npcId;
  const dialoguePath = path.join(__dirname, '../public/mods/flare_game/data/dialogue', `${npcId}.json`);
  
  if (fs.existsSync(dialoguePath)) {
    const dialogue = JSON.parse(fs.readFileSync(dialoguePath, 'utf8'));
    res.json(dialogue);
  } else {
    res.status(404).json({ error: 'Dialogue not found' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     SKYLARK ARPG - Development Server    ║
║          Phase 2: NPCs & Dialogue        ║
╚══════════════════════════════════════════╝

🚀 Game running at: http://localhost:${PORT}
📁 Assets served from: ./public
🎮 Open your browser and navigate to the URL above

🎮 GAMEPLAY HINTS:
   • Use WASD or Arrow Keys to move
   • Press E to interact with nearby NPCs
   • Press ESC to cancel dialogue
   • Interaction range shown in light green dashed lines

Press Ctrl+C to stop the server.
  `);
});
