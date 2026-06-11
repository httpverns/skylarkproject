export class Map {
  constructor(mapData) {
    this.width = mapData.width;
    this.height = mapData.height;
    this.tiles = {};
    
    // Create tile lookup
    for (let tile of mapData.tiles) {
      this.tiles[`${tile.x},${tile.y}`] = tile;
    }
    
    this.npcs = mapData.npcs || [];
    this.entities = mapData.entities || [];
    this.quests = mapData.quests || [];
    this.interactables = [];
    
    this.initializeInteractables();
  }

  getTile(x, y) {
    return this.tiles[`${x},${y}`];
  }

  setTile(x, y, tile) {
    this.tiles[`${x},${y}`] = tile;
  }

  initializeInteractables() {
    // Add some interactive objects
    this.interactables.push({
      x: 10,
      y: 5,
      type: 'workbench',
      name: 'X-metal Workbench',
      interactive: true
    });

    this.interactables.push({
      x: 15,
      y: 10,
      type: 'chest',
      name: 'Equipment Cache',
      items: [
        { name: 'X-metal Alloy', rarity: 'rare' },
        { name: 'Energy Cell', rarity: 'common' }
      ]
    });

    this.interactables.push({
      x: 8,
      y: 15,
      type: 'terminal',
      name: 'Ancient Terminal',
      description: 'A strange alien device'
    });
  }

  getInteractableAt(x, y) {
    return this.interactables.find(obj => 
      Math.abs(obj.x - x) < 1 && Math.abs(obj.y - y) < 1
    );
  }
}
