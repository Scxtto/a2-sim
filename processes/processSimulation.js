const path = require("path");
const { spawn } = require("child_process");
const { writeVideoToBucket, getPresignedURL } = require("../utility/s3Handler");
const { insertHistoryRecord } = require("../utility/rdsHandler");
const { addHistory } = require("../utility/dynamoHandler");
const { createHistoryObject } = require("../processes/logResults");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { TextEncoder } = require("util");
const runSimulation = require("../processes/simulation");
const S3 = require("@aws-sdk/client-s3");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3.S3Client({ region: "ap-southeast-2" });

// Initialize SQS client
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

async function processSimulation(uniqueId) {
  // Retrieve job data from S3
  const getObjectParams = {
    Bucket: process.env.S3_BUCKET,
    Key: `${uniqueId}.json`, // Assumes the data is stored in S3 with this naming convention
  };
  const response = await s3Client.send(new GetObjectCommand(getObjectParams));
  const simulationParams = JSON.parse(await streamToString(response.Body));
  console.log("Retrieved simulation parameters from S3 for UUID:", uniqueId);
  const simulationTimestamp = new Date().toISOString();

  // Set the aspect ratio for the video
  const aspectRatio = { aspectWidth: 1280, aspectHeight: 720 };

  // set email and uuid
  const unique_id = uniqueId;
  const email = simulationParams.email;

  // Initialize the storage for simulation results
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

  // initialize the storage for each speciesName
  const { creatures } = simulationParams;
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
    const uniqueVideoName = `simulation_${unique_id}.mp4`;
    const videoPath = path.join(__dirname, "..", "output", uniqueVideoName);
    const simStart = process.hrtime();

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
      if (code !== 0) {
        console.error(`FFmpeg process exited with code ${code}`);
      } else {
        const resultData = {
          email,
          video: uniqueVideoName,
          results: simulationResults,
        };

        const historyData = await createHistoryObject(unique_id, simulationParams, simulationResults);
        await addHistory(req.decodedemail, historyData);

        writeVideoToBucket(uniqueVideoName, videoPath);

        const simEnd = process.hrtime(simStart);
        const duration = simEnd[0] + simEnd[1] / 1e6 / 1000;
        const costEst = (0.096 / 3600) * duration;

        const jsonString = JSON.stringify(resultData);
        const encoder = new TextEncoder();
        const fileSize = encoder.encode(jsonString).length / 1024 / 1024;

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

        // Step: Send UUID and presigned URL to the completed queue
        const completedMessage = {
          uniqueId,
          presignedURL,
        };

        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: process.env.COMPLETED_QUEUE_URL,
            MessageBody: JSON.stringify(completedMessage),
          })
        );

        console.log("Completion notification sent for UUID:", uniqueId);
      }
    });

    ffmpeg.stdin.on("error", (error) => {
      console.error("Error writing to FFmpeg stdin:", error);
    });

    // Run the simulation
    await runSimulation(simulationParams, ffmpeg, simulationResults, aspectRatio);
    ffmpeg.stdin.end();
  } catch (error) {
    console.error("Error processing job:", error);
    throw error;
  }
}

module.exports = { processSimulation };

// Helper function to convert a stream to a string
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
