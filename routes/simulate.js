const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const runSimulation = require("../processes/simulation"); // Adjust the path as necessary
const { v4: uuidv4 } = require("uuid"); // Use UUID for unique filenames
const { authenticateJWT } = require("../middleware/authenticateJwt");
const fs = require("fs");
//const { logResults } = require("../processes/logResults");
const { writeVideoToBucket, getPresignedURL } = require("../utility/s3Handler");
const { insertHistoryRecord } = require("../utility/rdsHandler");
const { addHistory, retrieveAll } = require("../utility/dynamoHandler");
const { createHistoryObject } = require("../processes/logResults");

const router = express.Router();

router.post("/", authenticateJWT, async (req, res) => {
  const simulationParams = req.body;
  const simulationTimestamp = new Date().toISOString();

  const aspectRatio = {
    aspectWidth: 1280,
    aspectHeight: 720,
  };

  let simulationResults = {
    creatureCount: [],
    foodCount: [],
    birthCount: [],
    deathCount: [],
    distinctCreatures: {},
    deathTypeCount: {
      age: 0,
      hunger: 0,
      predation: 0,
    },
  };

  let { creatures } = req.body;

  // Initialize the storage for each speciesName
  creatures.forEach((creature) => {
    const speciesName = creature.speciesName;
    if (!simulationResults.distinctCreatures[speciesName]) {
      simulationResults.distinctCreatures[speciesName] = {
        count: [],
        color: {
          r: creature.colorR,
          g: creature.colorG,
          b: creature.colorB,
        },
        births: [],
        deaths: [],
      };
    }
  });

  try {
    const unique_id = uuidv4();
    const uniqueVideoName = `simulation_${unique_id}.mp4`;
    const uniqueResultsName = `results_${unique_id}.json`;
    const videoPath = path.join(__dirname, "..", "output", uniqueVideoName);
    const resultsPath = path.join(__dirname, "..", "output", uniqueResultsName);

    const simStart = process.hrtime();

    console.log("Starting simulation with params:", simulationParams);

    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-f",
      "rawvideo",
      "-pixel_format",
      "rgb24",
      "-video_size",
      `${aspectRatio.aspectWidth}x${aspectRatio.aspectHeight}`,
      "-r",
      "30",
      "-i",
      "pipe:0",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      videoPath,
    ]);

    ffmpeg.on("close", async (code) => {
      try {
        if (code !== 0) {
          console.error(`FFmpeg process exited with code ${code}`);
          res.status(500).send("Error generating video");
        } else {
          //logResults(req.decodedemail, unique_id, simulationResults, simulationParams);
          const resultData = {
            email: req.decodedemail,
            video: uniqueVideoName,
            results: simulationResults,
          };

          const historyData = await createHistoryObject();

          await addHistory(req.decodedemail, historyData);
          //fs.writeFileSync(resultsPath, JSON.stringify(resultData, null, 2), "utf-8");

          console.log(" history added successfully");
          console.log("Attempting to retrieve history");
          await retrieveAll();

          writeVideoToBucket(uniqueVideoName, videoPath);

          const simEnd = process.hrtime(simStart);
          const duration = simEnd[0] + simEnd[1] / 1e6 / 1000;
          const costEst = (0.096 / 3600) * duration;
          const fileSize = fs.statSync(resultsPath).size / 1024 / 1024;

          //console.log(`Duration: ${duration.toFixed(2)} seconds`);
          //console.log(`Cost Estimate: $${costEst.toFixed(2)}`);
          //console.log(`Result file size: ${fileSize.toFixed(2)} MB`);

          await insertHistoryRecord(
            req.decodedemail,
            unique_id,
            costEst,
            simulationTimestamp,
            "success",
            "m5.large",
            fileSize,
            duration,
            null
          );

          const presignedURL = await getPresignedURL(uniqueVideoName);

          res.json({
            videoUrl: presignedURL,
            simResults: simulationResults,
          });
        }
      } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).send("Error processing request: " + error.message);
      }
    });

    ffmpeg.stdin.on("error", (error) => {
      console.error("Error writing to FFmpeg stdin:", error);
    });

    await runSimulation(simulationParams, ffmpeg, simulationResults, aspectRatio);

    ffmpeg.stdin.end();
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Error processing request: " + error.message);
  }
});

module.exports = router;
