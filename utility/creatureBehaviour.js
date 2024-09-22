// This file contains utility functions that are used to determine the behaviour of creatures in the simulation.

// Function to calculate the desirability of a food item for a creature
function calculateFoodDesirability(creature, food, environment, tracking) {
  const distance = Math.sqrt((creature.x - food.x) ** 2 + (creature.y - food.y) ** 2);
  const energyValue = food.energyContent;

  const focus = creature.targetFood && creature.targetFood === food ? 3 : 1;
  const competition = tracking.foodCompetitionMap.get(food.id) || 0;

  const desirability = ((energyValue * focus) / distance) * (1 / (competition + 1));

  return desirability;
}

// Function to calculate the desirability of a prey item for a predator
function calculatePreyDesirability(creature, prey, environment) {
  const distance = Math.sqrt((creature.x - prey.x) ** 2 + (creature.y - prey.y) ** 2);
  const energyValue = prey.getEnergyContent();

  const focus = creature.targetFood && creature.targetFood === prey ? 1.5 : 1;

  const competition = environment.creatures.filter(
    (otherCreature) => otherCreature.targetFood === prey
  ).length;

  const desirability = ((energyValue * focus) / distance) * (1 / Math.pow(competition + 1, 0.2));

  return desirability;
}

function moveTowards(creature, target) {
  let xDiff = target.x - creature.x;
  let yDiff = target.y - creature.y;
  let angle = Math.atan2(yDiff, xDiff);
  let xDelta = Math.cos(angle) * creature.baseSpeed * creature.speedMultiplier;
  let yDelta = Math.sin(angle) * creature.baseSpeed * creature.speedMultiplier;

  if (Math.abs(xDelta) > Math.abs(xDiff)) {
    xDelta = xDiff;
  }
  if (Math.abs(yDelta) > Math.abs(yDiff)) {
    yDelta = yDiff;
  }

  move(creature, xDelta, yDelta);
}

// Function to determine if a creature can reproduce with another creature
function move(creature, xDelta, yDelta) {
  // Move the creature by the specified deltas
  if (creature.state === "fleeing") {
    xDelta = xDelta * 2;
    yDelta = yDelta * 2;
  }
  creature.x += xDelta;
  creature.y += yDelta;

  // Reduce the fullness level based on the distance moved
  creature.fullnessLevel -= Math.abs(xDelta) * creature.metabolicBaseRate * creature.metabolicRate;
  creature.fullnessLevel -= Math.abs(yDelta) * creature.metabolicBaseRate * creature.metabolicRate;

  // Ensure the creature stays within the environment bounds
  if (creature.x < 0) creature.x = 0;
  if (creature.x > creature.envWidth) creature.x = creature.envWidth;
  if (creature.y < 0) creature.y = 0;
  if (creature.y > creature.envHeight) creature.y = creature.envHeight;
}

// Function to update the age of a creature
function updateAge(creature) {
  creature.age += creature.ageRate;
}

// Function to check the hunger level of a creature and update its health accordingly
function checkHunger(creature) {
  if (creature.fullnessLevel <= 0 && creature.reserveEnergy <= 0) {
    creature.health -= Math.abs(creature.fullnessLevel);
  } else if (creature.fullnessLevel <= 0 && creature.reserveEnergy > 0) {
    creature.reserveEnergy -= Math.abs(creature.fullnessLevel);
    creature.fullnessLevel = 0;
  } else if (creature.fullnessLevel > creature.fullnessCap) {
    creature.reserveEnergy += (creature.fullnessLevel - creature.fullnessCap) * creature.energyStorageRate;
    creature.fullnessLevel = creature.fullnessCap;
  }
}

//  Function to check the health of a creature and mark it as dead if its health drops to zero
function checkHealth(creature) {
  if (creature.health <= 0) {
    creature.dead = true;
    creature.deathCause = "hunger";
  }
}

function updateCooldowns(creature) {
  if (creature.reproductionCooldown > 0) {
    creature.reproductionCooldown--;
  }
}
// Function to check the age of a creature and mark it as dead if it exceeds the age cap
function checkAge(creature) {
  if (creature.age >= creature.ageCap) {
    const ageExcess = creature.age - creature.ageCap;
    const deathProbability = Math.min(1, ageExcess * 0.1);
    if (Math.random() < deathProbability) {
      //console.log(`Creature "${creature.speciesName} - ${creature.id}" has died of old age`);
      creature.dead = true;
      creature.deathCause = "age";
    }
  }
}

//  Function to check the survival status of a creature based on its hunger, age, and health
function checkSurvival(creature) {
  checkHunger(creature);
  checkAge(creature);
  checkHealth(creature);
}

// Function to find the closest creature of the same species to a given creature
function findClosestCreature(creature, environment) {
  let closestCreature = null;
  let minDistance = Infinity;

  for (let other of environment.creatures) {
    if (
      other.id !== creature.id &&
      other.speciesName === creature.speciesName &&
      other.reproductionCooldown <= 0
    ) {
      let distance = getDistance(creature, other);
      if (distance < minDistance) {
        minDistance = distance;
        closestCreature = other;
      }
    }
  }

  return closestCreature;
}

// Function to find the closest predator to a given creature in the environment
function findClosestPredator(creature, environment) {
  let closestCreature = null;
  let minDistance = Infinity;

  if (environment.hasPredators) {
    for (let other of environment.creatures) {
      if (
        other.id !== creature.id &&
        other.speciesName !== creature.speciesName &&
        other.dietType !== "herbivore"
      ) {
        let distance = getDistance(creature, other);
        if (distance < minDistance) {
          minDistance = distance;
          closestCreature = other;
        }
      }
    }
  }

  return closestCreature;
}

// Function to find the best food item for a creature based on its desirability
function findBestFood(creature, foods, environment, tracking) {
  let bestFood = null;
  let highestDesirability = -Infinity;

  if (creature.targetFood && !foods.includes(creature.targetFood)) {
    creature.targetFood = null;
  }

  if (creature.dietType === "herbivore" || creature.dietType === "omnivore") {
    foods.forEach((food) => {
      let desirability = calculateFoodDesirability(creature, food, environment, tracking);

      // Apply 2x multiplier for omnivores if the food is their preferred type
      if (creature.dietType === "omnivore" && creature.preferredFoodType == "Plants") {
        desirability *= 2;
      }

      if (desirability > highestDesirability) {
        highestDesirability = desirability;
        bestFood = food;
      }
    });
  }

  if (creature.dietType === "carnivore" || creature.dietType === "omnivore") {
    environment.creatures.forEach((potentialPrey) => {
      if (potentialPrey.speciesName !== creature.speciesName && potentialPrey.health > 0) {
        const desirability = calculatePreyDesirability(creature, potentialPrey, environment);

        if (creature.dietType === "omnivore" && creature.preferredFoodType == "Meat") {
          desirability *= 2;
        }

        if (desirability > highestDesirability) {
          highestDesirability = desirability;
          bestFood = potentialPrey;
        }
      }
    });
  }

  return bestFood;
}

// Function to calculate the distance between two creatures
function getDistance(creature, target) {
  return Math.sqrt((creature.x - target.x) ** 2 + (creature.y - target.y) ** 2);
}

// Function to consume a food item and update the creature's fullness level
function consumeFood(creature, food, environment) {
  creature.fullnessLevel += food.energyContent;
  environment.foods = environment.foods.filter((f) => f.id !== food.id);
  creature.targetFood = null;
  creature.tired = true;
  creature.recoveryNeeded = 2;
}

// Function to consume a prey item and update the creature's fullness level
function consumePrey(creature, prey) {
  //console.log("Creature fullness level: " + creature.fullnessLevel);
  creature.fullnessLevel = creature.fullnessLevel + prey.getEnergyContent();
  creature.targetFood = null;
  creature.tired = true;
  creature.recoveryNeeded = 60;
  //console.log("Prey consumed");
  //console.log("Creature fullness level: " + creature.fullnessLevel);
}

// Function to mutate the value of a creature's attribute based on a mutation factor
function mutateValuePercent(value, mutationFactor, factor) {
  if (Math.random() < mutationFactor) {
    //console.log("Mutating value");
    const mutation = Math.random() * (factor * 2) - factor;
    let newValue = value + value * mutation;
    if (newValue <= 0) {
      return value;
    } else {
      return newValue;
    }
  } else {
    return value;
  }
}

// Function to mutate the litter size of a creature
function mutateBirth(creature, otherCreature) {
  if (Math.random() < creature.mutationFactor && Math.random() < otherCreature.mutationFactor) {
    let newLitter = Math.round((creature.litterSize + otherCreature.litterSize) / 2 + Math.random() * 2 - 1);
    if (newLitter < 1) {
      return 1;
    } else {
      return Math.round(newLitter);
    }
  } else {
    return Math.floor((creature.litterSize + otherCreature.litterSize) / 2);
  }
}

// Function to reproduce a new creature from two parent creatures
function reproduce(creature, otherCreature, environment) {
  const factors = {
    baseSpeed: 0.1,
    speedMultiplier: 0.15,
    health: 0.15,
    ageCap: 0.05,
    fullnessCap: 0.05,
    metabolicBaseRate: 0.1,
    metabolicRate: 0.15,
    energyStorageRate: 0.1,
    reproductionCost: 0.1,
    matingHungerThreshold: 0.1,
    reproductionCooldown: 0.05,
    attackPower: 0.1,
    defencePower: 0.1,
    skittishMultiplierBase: 0.1,
    skittishMultiplierScared: 0.1,
    fleeExhaustionRate: 0.1,
    fleeRecoveryFactor: 0.1,
  };

  const newCreatureConfig = {
    speciesName: creature.speciesName,
    baseSpeed:
      (mutateValuePercent(creature.baseSpeed, creature.mutationFactor, factors.baseSpeed) +
        mutateValuePercent(otherCreature.baseSpeed, otherCreature.mutationFactor, factors.baseSpeed)) /
      2,
    speedMultiplier:
      (mutateValuePercent(creature.speedMultiplier, creature.mutationFactor, factors.speedMultiplier) +
        mutateValuePercent(
          otherCreature.speedMultiplier,
          otherCreature.mutationFactor,
          factors.speedMultiplier
        )) /
      2,
    health:
      (mutateValuePercent(creature.health, creature.mutationFactor, factors.health) +
        mutateValuePercent(otherCreature.health, otherCreature.mutationFactor, factors.health)) /
      2,
    age: 0,
    ageCap:
      (mutateValuePercent(creature.ageCap, creature.mutationFactor, factors.ageCap) +
        mutateValuePercent(otherCreature.ageCap, otherCreature.mutationFactor, factors.ageCap)) /
      2,
    ageRate: creature.ageRate,
    fullnessCap:
      (mutateValuePercent(creature.fullnessCap, creature.mutationFactor, factors.fullnessCap) +
        mutateValuePercent(otherCreature.fullnessCap, otherCreature.mutationFactor, factors.fullnessCap)) /
      2,
    initialFullness: Math.floor(
      (mutateValuePercent(creature.fullnessCap / 2, creature.mutationFactor, factors.fullnessCap) +
        mutateValuePercent(
          otherCreature.fullnessCap / 2,
          otherCreature.mutationFactor,
          factors.fullnessCap
        )) /
        2
    ),
    metabolicBaseRate:
      (mutateValuePercent(creature.metabolicBaseRate, creature.mutationFactor, factors.metabolicRate) +
        mutateValuePercent(
          otherCreature.metabolicBaseRate,
          otherCreature.mutationFactor,
          factors.metabolicRate
        )) /
      2,
    metabolicRate:
      (mutateValuePercent(creature.metabolicRate, creature.mutationFactor, factors.metabolicBaseRate) +
        mutateValuePercent(
          otherCreature.metabolicRate,
          otherCreature.mutationFactor,
          factors.metabolicBaseRate
        )) /
      2,
    energyStorageRate:
      (mutateValuePercent(creature.energyStorageRate, creature.mutationFactor, factors.energyStorageRate) +
        mutateValuePercent(
          otherCreature.energyStorageRate,
          otherCreature.mutationFactor,
          factors.energyStorageRate
        )) /
      2,
    reserveEnergy: 0,
    dietType: creature.dietType === otherCreature.dietType ? creature.dietType : "omnivore",
    dietPreference:
      creature.dietPreference && otherCreature.dietPreference && Math.random() > 0.5
        ? creature.dietPreference
        : otherCreature.dietPreference,
    reproductionCost:
      (mutateValuePercent(creature.reproductionCost, creature.mutationFactor, factors.reproductionCost) +
        mutateValuePercent(
          otherCreature.reproductionCost,
          otherCreature.mutationFactor,
          factors.reproductionCost
        )) /
      2,
    matingHungerThreshold:
      (mutateValuePercent(
        creature.matingHungerThreshold,
        creature.mutationFactor,
        factors.matingHungerThreshold
      ) +
        mutateValuePercent(
          otherCreature.matingHungerThreshold,
          otherCreature.mutationFactor,
          factors.matingHungerThreshold
        )) /
      2,
    reproductionCooldown:
      (mutateValuePercent(
        creature.reproductionCooldownCap,
        creature.mutationFactor,
        factors.reproductionCooldown
      ) +
        mutateValuePercent(
          otherCreature.reproductionCooldownCap,
          otherCreature.mutationFactor,
          factors.reproductionCooldown
        )) /
      2,
    litterSize: mutateBirth(creature, otherCreature),
    colorR: creature.colorR,
    colorG: creature.colorG,
    colorB: creature.colorB,
    size: creature.size,
    mutationFactor: creature.mutationFactor,
    attackPower:
      (mutateValuePercent(creature.attackPower, creature.mutationFactor, factors.attackPower) +
        mutateValuePercent(otherCreature.attackPower, otherCreature.mutationFactor, factors.attackPower)) /
      2,
    defencePower:
      (mutateValuePercent(creature.defencePower, creature.mutationFactor, factors.defencePower) +
        mutateValuePercent(otherCreature.defencePower, otherCreature.mutationFactor, factors.defencePower)) /
      2,
    skittishMultiplierBase:
      (mutateValuePercent(
        creature.skittishMultiplierBase,
        creature.mutationFactor,
        factors.skittishMultiplierBase
      ) +
        mutateValuePercent(
          otherCreature.skittishMultiplierBase,
          otherCreature.mutationFactor,
          factors.skittishMultiplierBase
        )) /
      2,
    skittishMultiplierScared:
      (mutateValuePercent(
        creature.skittishMultiplierScared,
        creature.mutationFactor,
        factors.skittishMultiplierScared
      ) +
        mutateValuePercent(
          otherCreature.skittishMultiplierScared,
          otherCreature.mutationFactor,
          factors.skittishMultiplierScared
        )) /
      2,
    fleeExhaustion:
      (mutateValuePercent(creature.fleeExhaustionRate, creature.mutationFactor, factors.fleeExhaustionRate) +
        mutateValuePercent(
          otherCreature.fleeExhaustionRate,
          otherCreature.mutationFactor,
          factors.fleeExhaustionRate
        )) /
      2,
    fleeRecoveryFactor:
      (mutateValuePercent(creature.fleeRecoveryFactor, creature.mutationFactor, factors.fleeRecoveryFactor) +
        mutateValuePercent(
          otherCreature.fleeRecoveryFactor,
          otherCreature.mutationFactor,
          factors.fleeRecoveryFactor
        )) /
      2,
  };

  const returnConfig = {
    id: environment.creatureID++,
    x: creature.x,
    y: otherCreature.y,
    config: newCreatureConfig,
    envWidth: creature.envWidth,
    envHeight: creature.envHeight,
  };

  return returnConfig;
}

// Function to make a creature mate with another creature and update the state of the creature and environment
function goMate(creature, environment, tracking) {
  const closestCreature = findClosestCreature(creature, environment);

  if (closestCreature) {
    // Move towards the closest creature
    moveTowards(creature, closestCreature);
    // If close enough, reproduce
    if (getDistance(creature, closestCreature) <= creature.size + creature.size / 2) {
      creature.fullnessLevel -= creature.reproductionCost;
      closestCreature.fullnessLevel -= closestCreature.reproductionCost;

      for (let i = 0; i < creature.litterSize; i++) {
        const newGenome = reproduce(creature, closestCreature, environment);
        environment.creatures.push(creature.makeBaby(newGenome));
        tracking.births.push(creature.speciesName);
      }

      creature.reproductionCooldown = creature.reproductionCooldownCap;
      closestCreature.reproductionCooldown = closestCreature.reproductionCooldownCap;
    }
    return true;
  }
  goExplore(creature);
  return false;
}

// Function to update the food competition map when a creature changes its target food
function updateFoodCompetitionMap(tracking, oldFoodID, newFoodID) {
  // Decrement the old food's competition count (if it exists in the map)
  if (oldFoodID !== null && tracking.foodCompetitionMap.has(oldFoodID)) {
    let oldCount = tracking.foodCompetitionMap.get(oldFoodID);
    if (oldCount > 1) {
      tracking.foodCompetitionMap.set(oldFoodID, oldCount - 1);
    } else {
      tracking.foodCompetitionMap.delete(oldFoodID); // Remove if count reaches 0
    }
  }

  // Increment the new food's competition count
  if (newFoodID !== null) {
    if (tracking.foodCompetitionMap.has(newFoodID)) {
      tracking.foodCompetitionMap.set(newFoodID, tracking.foodCompetitionMap.get(newFoodID) + 1);
    } else {
      tracking.foodCompetitionMap.set(newFoodID, 1);
    }
  }
}

// Function to make a creature hunt for food and update the state of the creature and environment
function goHunt(creature, foods, environment, tracking) {
  let targetID = creature.targetFood ? creature.targetFood.id : null;
  const bestFood = findBestFood(creature, foods, environment, tracking);
  if (bestFood) {
    updateFoodCompetitionMap(tracking, targetID, bestFood.id);
    creature.targetFood = bestFood;
    // Move towards the best food
    moveTowards(creature, bestFood);
    // If close enough, consume the food
    if (creature.getDistance(bestFood) <= bestFood.size + creature.size / 2) {
      if (bestFood.type === "plant") {
        consumeFood(creature, bestFood, environment);
      } else {
        //console.log("attacking prey");
        attackPrey(creature, bestFood, tracking);
      }
    }
  } else {
    //console.log("No food found");
    // Move randomly if no food is found
    const randomAngle = Math.random() * 2 * Math.PI;
    const xDelta = Math.cos(randomAngle) * creature.baseSpeed * creature.speedMultiplier;
    const yDelta = Math.sin(randomAngle) * creature.baseSpeed * creature.speedMultiplier;
    move(creature, xDelta, yDelta);
  }
}

// Function to attack a prey item and update the state of the predator and prey
function attackPrey(creature, prey, tracking) {
  prey.health = prey.health - creature.attackPower;
  if (prey.health <= 0) {
    const cause = "predation";
    tracking.deathCause[cause] = tracking.deathCause[cause] + 1;
    tracking.deaths.push(prey.speciesName);
    tracking.preyToAdd.push(prey.id);
    consumePrey(creature, prey);
  }
}

// Function to check if a creature is in danger from a predator and update its state accordingly
function checkSafety(creature, environment) {
  if (creature.state === "fleeing") {
    creature.skittishMultiplier = creature.skittishMultiplierScared;
  } else {
    creature.skittishMultiplier = creature.skittishMultiplierBase;
  }
  const closestPredator = findClosestPredator(creature, environment);
  // predator found
  if (closestPredator) {
    if (
      creature.getDistance(closestPredator) <=
      creature.baseSpeed * creature.speedMultiplier * creature.skittishMultiplier
    ) {
      //console.log("Fleeing from predator");
      creature.state = "fleeing";
      creature.predator = closestPredator;
      return true;
    } else {
      creature.state = "";
      creature.predator = null;
      return false;
    }
  } else if (creature.state === "fleeing") {
    creature.state = "";
    creature.predator = null;
  }
  return false;
}

// Function to check the state of a creature based on its hunger, tiredness, and reproduction cooldown
function checkState(creature) {
  if (creature.state === "fleeing") {
    creature.fleeCount = creature.fleeCount + 1;
    creature.fleeRecoverycooldown = creature.fleeRecoverycooldown + 1;
    return;
  }
  if (creature.fleeRecoverycooldown > 0) {
    creature.fleeRecoverycooldown = creature.fleeRecoverycooldown - 1;
  } else if (creature.fleeRecoverycooldown <= 0 && creature.fleeCount > 0) {
    creature.fleeCount = creature.fleeCount - 1;
  }

  if (creature.tired === true) {
    creature.state = "resting";
    return;
  } else if (creature.fullnessLevel > creature.matingHungerThreshold && creature.reproductionCooldown <= 0) {
    creature.state = "mating";
    return;
  } else if (creature.fullnessLevel < creature.fullnessCap) {
    creature.state = "hunting";
    return;
  } else {
    creature.state = "exploring";
    return;
  }
}

// Function to make a creature flee from a predator
function goFlee(creature) {
  const angle = Math.atan2(creature.y - creature.predator.y, creature.x - creature.predator.x);
  const xDelta = Math.cos(angle) * creature.baseSpeed * creature.speedMultiplier;
  const yDelta = Math.sin(angle) * creature.baseSpeed * creature.speedMultiplier;
  move(creature, xDelta, yDelta);
  exhaustChance(creature);
}

// Function to determine if a creature should become tired from fleeing
function exhaustChance(creature) {
  const threshold = 0.95 - creature.fleeCount * this.fleeExhaustionRate;
  if (Math.random() > threshold) {
    creature.tired = true;
    creature.recoveryNeeded = creature.fleeCount * fleeRecoveryFactor;
    creature.fleeCount = 0;
  }
}

// Function to make a creature rest and recover from tiredness
function goRest(creature) {
  creature.recoveryNeeded--;
  if (creature.recoveryNeeded <= 0) {
    creature.tired = false;
    creature.recoveryNeeded = 0;
    creature.state = "exploring";
  }
}

// Function to make a creature explore the environment by moving in a random direction
function goExplore(creature) {
  const maxTurnAngle = (18 * Math.PI) / 180; // Convert 27 degrees to radians

  // If the creature has a previous direction, slightly adjust it
  if (creature.lastDirection !== undefined && creature.lastDirection !== null) {
    const angleChange = Math.random() * 2 * maxTurnAngle - maxTurnAngle; // Small random angle change
    const angle = creature.lastDirection + angleChange; // Adjust the angle slightly
    creature.lastDirection = angle; // Save the new direction
    const xDelta = Math.cos(angle) * creature.baseSpeed * creature.speedMultiplier;
    const yDelta = Math.sin(angle) * creature.baseSpeed * creature.speedMultiplier;
    move(creature, xDelta, yDelta); // Move the creature in the adjusted direction
  } else {
    // If no previous direction, pick a random one
    const angle = Math.random() * 2 * Math.PI;
    creature.lastDirection = angle; // Save the random direction
    const xDelta = Math.cos(angle) * creature.baseSpeed * creature.speedMultiplier;
    const yDelta = Math.sin(angle) * creature.baseSpeed * creature.speedMultiplier;
    move(creature, xDelta, yDelta); // Move the creature in the random direction
  }
}

module.exports = {
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
};
