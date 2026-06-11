/**
 * Character Progression System for Skylark ARPG (Phase 3)
 * Manages leveling, experience, skills, and attributes
 */

export class ProgressionSystem {
  constructor() {
    this.player = {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      totalExperience: 0,
      attributes: {
        strength: 10,
        intelligence: 12,
        dexterity: 10,
        endurance: 10,
        luck: 10,
        techAptitude: 13 // X-metal affinity
      },
      skills: {
        piloting: 10,
        engineering: 15,
        combat: 5,
        hacking: 8,
        science: 15,
        diplomacy: 10
      },
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100
    };
  }

  /**
   * Add experience to player
   * @param {number} amount - XP amount
   * @returns {Object} Level up info if applicable
   */
  addExperience(amount) {
    this.player.experience += amount;
    this.player.totalExperience += amount;

    const levelUpInfo = {
      leveledUp: false,
      newLevel: this.player.level
    };

    // Check for level up
    while (this.player.experience >= this.player.experienceToNextLevel) {
      this.player.experience -= this.player.experienceToNextLevel;
      this.levelUp();
      levelUpInfo.leveledUp = true;
      levelUpInfo.newLevel = this.player.level;
    }

    console.log(`✨ +${amount} XP (${this.player.experience}/${this.player.experienceToNextLevel} to level ${this.player.level + 1})`);
    return levelUpInfo;
  }

  /**
   * Level up player
   */
  levelUp() {
    this.player.level++;
    this.player.experienceToNextLevel = Math.floor(100 * Math.pow(1.1, this.player.level - 1));
    
    // Increase attributes
    this.player.maxHealth += 10;
    this.player.health = this.player.maxHealth;
    this.player.maxEnergy += 5;
    this.player.energy = this.player.maxEnergy;

    // Increase random attribute
    const attrs = Object.keys(this.player.attributes);
    const randomAttr = attrs[Math.floor(Math.random() * attrs.length)];
    this.player.attributes[randomAttr] += 2;

    console.log(`🎉 LEVEL UP! Now level ${this.player.level}`);
    console.log(`   Max Health: +10 (${this.player.maxHealth})`);
    console.log(`   ${randomAttr}: +2 (${this.player.attributes[randomAttr]})`);
  }

  /**
   * Improve a skill
   * @param {string} skill - Skill name
   * @param {number} amount - Amount to increase
   * @returns {boolean} Success
   */
  improveSkill(skill, amount = 1) {
    if (this.player.skills[skill] === undefined) return false;
    this.player.skills[skill] += amount;
    console.log(`📈 Skill improved: ${skill} +${amount} (now ${this.player.skills[skill]})`);
    return true;
  }

  /**
   * Use energy
   * @param {number} amount - Amount to use
   * @returns {boolean} Success
   */
  useEnergy(amount) {
    if (this.player.energy >= amount) {
      this.player.energy -= amount;
      return true;
    }
    return false;
  }

  /**
   * Restore energy
   * @param {number} amount - Amount to restore
   */
  restoreEnergy(amount) {
    this.player.energy = Math.min(this.player.energy + amount, this.player.maxEnergy);
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    this.player.health -= amount;
    if (this.player.health < 0) this.player.health = 0;
  }

  /**
   * Heal
   * @param {number} amount - Healing amount
   */
  heal(amount) {
    this.player.health = Math.min(this.player.health + amount, this.player.maxHealth);
  }

  /**
   * Get player character sheet
   * @returns {Object} Character data
   */
  getCharacterSheet() {
    return {
      level: this.player.level,
      experience: this.player.experience,
      experienceToNextLevel: this.player.experienceToNextLevel,
      totalExperience: this.player.totalExperience,
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      energy: this.player.energy,
      maxEnergy: this.player.maxEnergy,
      attributes: { ...this.player.attributes },
      skills: { ...this.player.skills }
    };
  }
}
