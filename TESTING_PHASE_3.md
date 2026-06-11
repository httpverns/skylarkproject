# Phase 3: Testing Guide - Quest, Objects & Progression

## Quick Start

```bash
npm install  # First time
npm run dev  # Start server
# Open http://localhost:3000
```

## Test Checklist: Phase 3

### Part 1: Interactive Objects (15 min)

- [ ] Game loads without console errors
- [ ] Map renders correctly
- [ ] Player spawns at (5, 5)
- [ ] Three objects visible on map:
  - [ ] Orange diamond at (10, 5) - Workbench
  - [ ] Yellow diamond at (12, 5) - Chest
  - [ ] Orange diamond at (5, 3) - Door

**Object Interaction Tests:**

**Workbench Test:**
- [ ] Walk to (10, 5)
- [ ] Press E
- [ ] See message: "[WORKBENCH INTERFACE] Ready for crafting"
- [ ] No error in console
- [ ] Can interact multiple times

**Chest Test:**
- [ ] Walk to (12, 5)
- [ ] Press E
- [ ] See message about opening chest
- [ ] Contents shown: Data Crystal, Scanner
- [ ] Interact again - shows "already open"

**Door Test:**
- [ ] Walk to (5, 3)
- [ ] Press E - message: "The Laboratory Door opens"
- [ ] Press E again - message: "The Laboratory Door closes"
- [ ] Door state toggles correctly

### Part 2: Quest System (20 min)

**Quest Access:**
- [ ] Walk near Martin Crane (cyan diamond at 7, 6)
- [ ] Press E to open dialogue
- [ ] Dialogue shows quest offer
- [ ] Click dialogue option
- [ ] Quest accepted message appears

**Quest Tracking:**
- [ ] Press Q key
- [ ] Status bar shows: "Quest: Synthesize X-metal (0%)"
- [ ] Press Q again to cycle quests
- [ ] Can switch between multiple quests
- [ ] Progress percentage visible

### Part 3: Character Progression (15 min)

**Initial State:**
- [ ] Press Q multiple times to check initial status
- [ ] Level 1 shown
- [ ] XP bar at 0/100

**XP Gain:**
- [ ] Complete a quest (fulfill objectives)
- [ ] Quest completed message with XP amount
- [ ] Status bar shows: "QUEST COMPLETE: 250 XP earned!"

**Level Up:**
- [ ] After XP gain, watch for level up
- [ ] Console shows: "LEVEL UP! Now level 2"
- [ ] Stats increase messages

### Part 4: Performance & Stability (10 min)

- [ ] Game maintains 60 FPS (check FPS counter)
- [ ] No frame drops when interacting
- [ ] No memory leaks
- [ ] Can play for 5+ minutes without crashes

## Debug Console Commands

```javascript
// Check quest system
console.log(gameEngine.questSystem.getActiveQuests());

// Check objects
console.log(gameEngine.objectSystem.getAllObjects());

// Check progression
console.log(gameEngine.progressionSystem.getCharacterSheet());

// Manually gain XP
gameEngine.progressionSystem.addExperience(500);
```

## Expected Behavior

**Quest System:**
- Quest created with objectives
- Objectives track completion
- Auto-complete when all done
- XP awarded on completion

**Object System:**
- Door toggles open/closed
- Chest displays contents
- Terminal shows interface
- Workbench shows recipes

**Progression System:**
- XP requirements scale by 1.1x each level
- Level up increases health by 10
- Random attribute increases by 2
- Energy max increases by 5

---

**Testing Phase 3**: ~60 minutes  
**Difficulty**: Easy (basic interactions)  
