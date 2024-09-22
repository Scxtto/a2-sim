const Creature = require("./Creature");
const Food = require("./Food");

class Environment {
  constructor(foodRespawnBase, foodRespawnMultiplier, foodEnergy, aspectRatio) {
    this.creatures = [];
    this.foods = [];
    this.width = aspectRatio.aspectWidth;
    this.height = aspectRatio.aspectHeight;
    this.foodRespawnBase = foodRespawnBase;
    this.foodEnergy = foodEnergy;
    this.baseReplicationCount = Math.floor(this.foodRespawnBase * foodRespawnMultiplier);
    this.hasPredators = false;

    // ID states
    this.creatureID = 1;
    this.foodID = 1;

    console.log("Environment created");
  }

  addCreature(creature) {
    this.creatures.push(creature);
  }

  addFood(food) {
    this.foods.push(food);
  }

  setupFood() {
    for (let i = 0; i < this.baseReplicationCount; i++) {
      let x = Math.floor(Math.random() * this.width);
      let y = Math.floor(Math.random() * this.height);
      let food = new Food(this.foodID++, x, y, this.foodEnergy);
      this.addFood(food);
    }
    console.log("Food setup complete");
  }

  setupCreatures(creatures) {
    console.log("Setting up creatures");
    creatures.forEach((creatureConfig) => {
      for (let i = 0; i < creatureConfig.initialPopulation; i++) {
        this.addCreature(
          new Creature(
            this.creatureID++,
            Math.floor(Math.random() * this.width), // Random x position
            Math.floor(Math.random() * this.height), // Random y position
            creatureConfig, // Pass the entire creatureConfig object
            this.width,
            this.height
          )
        );
        if (creatureConfig.dietType !== "herbivore") {
          this.hasPredators = true;
        }
      }
    });

    console.log("Creatures setup complete");
  }

  replenishFood() {
    if (Math.random() > 0.5) {
      for (let i = 0; i < this.baseReplicationCount; i++) {
        let x = Math.round(Math.random() * this.width);
        let y = Math.round(Math.random() * this.height);
        let food = new Food(this.foodID++, x, y, this.foodEnergy);
        this.addFood(food);
      }
    }
  }

  update(tracking) {
    this.foods.forEach((food) => {
      food.update();
    });

    this.replenishFood();

    this.creatures.forEach((creature) => {
      if (creature.targetFood) {
        const count = tracking.foodCompetitionMap.get(creature.targetFood.id) || 0;
        tracking.foodCompetitionMap.set(creature.targetFood.id, count + 1);
      }
    });

    // Array to store dead creatures and consumed food
    const creaturesToRemove = [];
    const foodToRemove = [];

    // First, update creatures and mark the ones to be removed
    this.creatures.forEach((creature) => {
      creature.update(this.foods, this, tracking);

      if (tracking.preyToAdd.length > 0) {
        tracking.preyToAdd.forEach((prey) => {
          creaturesToRemove.push(prey.id);
        });
      }

      // Check if the creature died
      if (creature.dead) {
        const cause = creature.deathCause;
        tracking.deathCause[cause] = tracking.deathCause[cause] + 1;
        tracking.deaths.push(creature.speciesName);
        creaturesToRemove.push(creature.id);
      }
    });

    // Then, remove dead creatures
    if (creaturesToRemove.length > 0) {
      this.creatures = this.creatures.filter((creature) => !creaturesToRemove.includes(creature.id));
    }

    // Next, check for consumed food and mark them
    this.foods.forEach((food) => {
      if (food.consumed) {
        foodToRemove.push(food.id);
      }
    });

    // Finally, remove consumed food
    if (foodToRemove.length > 0) {
      this.foods = this.foods.filter((food) => !foodToRemove.includes(food.id));
    }
  }
  getState() {
    return {
      creatures: this.creatures.map((creature) => creature.getState()),
      foods: this.foods.map((food) => food.getState()),
    };
  }

  // Removed draw method as it's not needed on the server-side
}

module.exports = Environment;
