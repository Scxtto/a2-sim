const {
  updateAge,
  updateCooldowns,
  checkSurvival,
  checkSafety,
  checkState,
  goMate,
  goHunt,
  goFlee,
  goRest,
  goExplore,
} = require("../utility/creatureBehaviour");

// Creature class definition
class Creature {
  constructor(id, x, y, config, width, height) {
    // Initialize creature properties from parameters and config
    this.id = id;
    this.x = x;
    this.y = y;
    this.colorR = config.colorR;
    this.colorG = config.colorG;
    this.colorB = config.colorB;
    this.baseSpeed = config.baseSpeed;
    this.metabolicRate = config.metabolicRate;
    this.fullnessLevel = config.initialFullness;
    this.fullnessCap = config.fullnessCap;
    this.energyStorageRate = config.energyStorageRate;
    this.reserveEnergy = config.reserveEnergy;
    this.dietType = config.dietType;
    this.dietPreference = config.dietPreference;
    this.reproductionCost = config.reproductionCost;
    this.matingHungerThreshold = config.matingHungerThreshold;
    this.reproductionCooldown = config.reproductionCooldown;
    this.reproductionCooldownCap = this.reproductionCooldown;
    this.litterSize = config.litterSize;
    this.size = config.size;
    this.health = config.health;
    this.age = config.age;
    this.ageCap = config.ageCap;
    this.ageRate = config.ageRate;
    this.speciesName = config.speciesName;
    this.speedMultiplier = config.speedMultiplier;
    this.metabolicBaseRate = config.metabolicBaseRate;
    this.envWidth = width;
    this.envHeight = height;
    this.mutationFactor = config.mutationFactor;
    this.attackPower = config.attackPower;
    this.defencePower = config.defencePower;
    this.fleeExhaustionRate = config.fleeExhaustion;
    this.fleeRecoveryFactor = config.fleeRecoveryFactor;
    this.skittishMultiplierBase = config.skittishMultiplierBase;
    this.skittishMultiplier = this.skittishMultiplierBase;
    this.skittishMultiplierScared = config.skittishMultiplierScared;

    // Generics
    this.state = "hunting";
    this.lastDirection = null;
    this.fleeCount = 0;
  }

  // Update creature state
  update(foods, environment, tracking) {
    // Update age and check survival status
    updateAge(this);
    updateCooldowns(this);
    checkSurvival(this);
    // If the creature is dead, exit the update function
    if (this.dead) return;
    checkSafety(this, environment);
    checkState(this);

    //console.log(`Creature ${this.id} is ${this.state}`);

    switch (this.state) {
      case "hunting":
        goHunt(this, foods, environment, tracking);
        break;
      case "mating":
        goMate(this, environment, tracking);
        break;
      case "fleeing":
        goFlee(this);
        break;
      case "resting":
        goRest(this);
        break;
      default:
        goExplore(this);
    }
  }

  // Calculate distance to a target
  getDistance(target) {
    return Math.sqrt((this.x - target.x) ** 2 + (this.y - target.y) ** 2);
  }

  getEnergyContent() {
    return this.size * 6 + (this.fullnessLevel / this.fullnessCap) * 6;
  }

  makeBaby(newGenome) {
    return new Creature(
      newGenome.id,
      newGenome.x,
      newGenome.y,
      newGenome.config,
      newGenome.envWidth,
      newGenome.envHeight
    );
  }

  // Get the current state of the creature
  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      color: {
        r: this.colorR,
        g: this.colorG,
        b: this.colorB,
      },
    };
  }
}

module.exports = Creature;
