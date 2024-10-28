const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const runSimulation = require("../processes/simulation");
const { writeVideoToBucket, getPresignedURL } = require("../utility/s3Handler");
const { insertHistoryRecord } = require("../utility/rdsHandler");

const sqsClient = new SQSClient({ region: "ap-southeast-2" });
const QUEUE_URL = "https://sqs.ap-southeast-2.amazonaws.com/your-account-id/simulation-queue"; // replace with your actual queue URL

async function pollQueue() {
  console.log("Polling SQS queue for simulation requests...");

  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 60,
    });

    const response = await sqsClient.send(command);

    if (response.Messages && response.Messages.length > 0) {
      for (const message of response.Messages) {
        const { Body, ReceiptHandle } = message;

        const { email, unique_id, simulationParams, simulationTimestamp } = JSON.parse(Body);
        console.log("Received simulation request:", { email, unique_id });

        await processSimulation(email, unique_id, simulationParams, simulationTimestamp);

        await sqsClient.send(new DeleteMessageCommand({ QueueUrl: QUEUE_URL, ReceiptHandle }));
        console.log("Message processed and deleted from queue:", ReceiptHandle);
      }
    }
  } catch (error) {
    console.error("Error polling SQS queue:", error);
  }
}

// Process each simulation request
async function processSimulation(email, unique_id, simulationParams, simulationTimestamp) {
  try {
    const simulationResults = {}; // Store results

    await runSimulation(simulationParams, simulationResults);

    const videoFileName = `simulation_${unique_id}.mp4`;
    const videoPath = `/path/to/video/${videoFileName}`; // Replace with actual path

    await writeVideoToBucket(videoFileName, videoPath);
    const presignedURL = await getPresignedURL(videoFileName);

    const duration = 60;
    const costEst = (0.096 / 3600) * duration;

    await insertHistoryRecord(
      email,
      unique_id,
      costEst,
      simulationTimestamp,
      "success",
      "m5.large",
      10,
      duration,
      null
    );

    console.log("Simulation processed and stored successfully.");
  } catch (error) {
    console.error("Error processing simulation:", error);
  }
}

// Start polling on an interval
module.exports = function startPolling() {
  setInterval(pollQueue, 5000); // Adjust polling interval as needed
};
