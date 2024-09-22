const Environment = require("../classes/Environment");

const runSimulation = async (simulationParams, ffmpeg, simulationResults, aspectRatio) => {
  const { simLength, foodRespawnMultiplier, foodRespawnBase, foodEnergy } =
    simulationParams.simulationSettings;

  console.log(simulationParams);
  const { creatures } = simulationParams;

  const environment = new Environment(foodRespawnBase, foodRespawnMultiplier, foodEnergy, aspectRatio);

  // Initialize food and creatures with the parameters
  environment.setupFood();
  environment.setupCreatures(creatures);

  const binSize = Math.ceil(simLength / 80); // Number of ticks per bin
  let creatureCountBin = 0;
  let foodCountBin = 0;
  let birthCountBin = 0;
  let deathCountBin = 0;
  let deathTypeCountBin = {
    age: 0,
    hunger: 0,
    predation: 0,
  };
  let speciesBin = {}; // Initialize a bin to hold species-specific data
  Object.keys(simulationResults.distinctCreatures).forEach((speciesName) => {
    speciesBin[speciesName] = {
      count: 0,
      births: 0,
      deaths: 0,
    };
  });

  let binCounter = 0;

  // Run the simulation for the specified number of ticks
  let startTime = Date.now();
  for (let i = 0; i < simLength; i++) {
    const tracking = {
      deaths: [],
      deathCause: {
        age: 0,
        hunger: 0,
        predation: 0,
      },
      births: [],
      preyToAdd: [],
      foodCompetitionMap: new Map(),
    };
    // Update the environment for the current tick
    environment.update(tracking);

    if (environment.creatures.length === 0) {
      break;
    }

    creatureCountBin += environment.creatures.length;
    foodCountBin += environment.foods.length;
    birthCountBin += tracking.births.length;
    deathCountBin += tracking.deaths.length;
    deathTypeCountBin.age += tracking.deathCause.age;
    deathTypeCountBin.hunger += tracking.deathCause.hunger;
    deathTypeCountBin.predation += tracking.deathCause.predation;

    // Accumulate species-specific data into speciesBin
    Object.keys(simulationResults.distinctCreatures).forEach((speciesName) => {
      const speciesCount = environment.creatures.filter((c) => c.speciesName === speciesName).length;
      const speciesBirthCount = tracking.births.filter((b) => b === speciesName).length;
      const speciesDeathCount = tracking.deaths.filter((d) => d === speciesName).length;

      speciesBin[speciesName].count += speciesCount;
      speciesBin[speciesName].births += speciesBirthCount;
      speciesBin[speciesName].deaths += speciesDeathCount;
    });

    binCounter++;

    // When the bin is full, calculate averages and store the results
    if (binCounter === binSize || i === simLength - 1) {
      simulationResults.creatureCount.push(creatureCountBin / binCounter);
      simulationResults.foodCount.push(foodCountBin / binCounter);
      simulationResults.birthCount.push(birthCountBin);
      simulationResults.deathCount.push(deathCountBin);
      simulationResults.deathTypeCount.age += deathTypeCountBin.age;
      simulationResults.deathTypeCount.hunger += deathTypeCountBin.hunger;
      simulationResults.deathTypeCount.predation += deathTypeCountBin.predation;

      // Store species-specific binned data
      Object.keys(simulationResults.distinctCreatures).forEach((speciesName) => {
        simulationResults.distinctCreatures[speciesName].count.push(
          speciesBin[speciesName].count / binCounter
        );
        simulationResults.distinctCreatures[speciesName].births.push(speciesBin[speciesName].births);
        simulationResults.distinctCreatures[speciesName].deaths.push(speciesBin[speciesName].deaths);

        // Reset species bin
        speciesBin[speciesName] = {
          count: 0,
          births: 0,
          deaths: 0,
        };
      });

      // Reset bins and counter
      creatureCountBin = 0;
      foodCountBin = 0;
      birthCountBin = 0;
      deathCountBin = 0;
      deathTypeCountBin = {
        age: 0,
        hunger: 0,
        predation: 0,
      };
      binCounter = 0;
    }

    // Progress reporting every 100 ticks
    if (i % 100 === 0) {
      let now = Date.now();
      let timeTaken = now - startTime;
      startTime = now;

      // console.log(process.memoryUsage());
      const progress = ((i / simLength) * 100).toFixed(2);
      console.log(
        `Sim progress: ${progress}% - Step time: ${timeTaken}ms - creatures: ${environment.creatures.length}`
      );
    }

    const frame = generateFrame(environment, aspectRatio);
    const canContinue = ffmpeg.stdin.write(frame);
    if (!canContinue) {
      await new Promise((resolve) => ffmpeg.stdin.once("drain", resolve));
    }
  }

  console.log("All frames written, ending FFmpeg stdin");
  //console.log(simulationResults.distinctCreatures);
  ffmpeg.stdin.end(); // End the ffmpeg input stream
};

// Function to generate a frame as raw pixel data
const generateFrame = (environment, aspectRatio) => {
  const width = aspectRatio.aspectWidth;
  const height = aspectRatio.aspectHeight;
  const frame = Buffer.alloc(width * height * 3); // RGB24 format

  // Generate pixel data for each entity in the environment
  environment.foods.forEach((food) => {
    drawCircle(frame, food.x, food.y, food.size, [255, 255, 255], width); // Magenta for food
  });

  environment.creatures.forEach((creature) => {
    drawCircle(
      frame,
      Math.round(creature.x),
      Math.round(creature.y),
      creature.size,
      [creature.colorR, creature.colorG, creature.colorB],
      width
    ); // Green for creatures
  });

  return frame;
};

// Helper function to draw a circle in the raw frame buffer
const drawCircle = (frame, cx, cy, radius, color, width) => {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        const px = cx + x;
        const py = cy + y;
        if (px >= 0 && px < width && py >= 0 && py < frame.length / (width * 3)) {
          const idx = (py * width + px) * 3;
          frame[idx] = color[0]; // Red
          frame[idx + 1] = color[1]; // Green
          frame[idx + 2] = color[2]; // Blue
        }
      }
    }
  }
};

module.exports = runSimulation;
