const express = require("express");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");
const { authenticateJWT } = require("../middleware/authenticateJwt");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

// Initialize S3 and SQS clients
const s3Client = new S3Client({ region: AWS_REGION });
const sqsClient = new SQSClient({ region: AWS_REGION });

// S3 and SQS configuration
const S3_BUCKET = process.env.S3_BUCKET;
const PENDING_QUEUE_URL = process.env.PENDING_QUEUE_URL;
const COMPLETED_QUEUE_URL = process.env.COMPLETED_QUEUE_URL;
const AWS_REGION = process.env.AWS_REGION;

// Step 1: /simulate Route to Receive Data
router.post("/", authenticateJWT, async (req, res) => {
  try {
    // Generate a unique identifier for this simulation
    const uniqueId = uuidv4();
    req.body.uniqueId = uniqueId;
    req.body.email = req.decodedemail;

    const simulationData = req.body;

    // Step 2: Store simulation data in S3
    const fileKey = `${uniqueId}.json`;
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: fileKey,
      Body: JSON.stringify(simulationData),
      ContentType: "application/json",
    };
    await s3Client.send(new PutObjectCommand(s3Params));
    console.log(`Simulation data stored in S3 as ${fileKey}`);

    // Step 3: Send the UUID to the pending SQS queue
    const pendingMessageParams = {
      QueueUrl: PENDING_QUEUE_URL,
      MessageBody: JSON.stringify({ uniqueId }),
    };
    await sqsClient.send(new SendMessageCommand(pendingMessageParams));
    console.log(`UUID ${uniqueId} sent to pending queue`);

    const pollCompletedQueue = async () => {
      let polling = true;
      while (polling) {
        const receiveParams = {
          QueueUrl: COMPLETED_QUEUE_URL,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 10, // Long-polling
        };

        const response = await sqsClient.send(new ReceiveMessageCommand(receiveParams));
        if (response.Messages && response.Messages.length > 0) {
          const { Body, ReceiptHandle } = response.Messages[0];
          const completedMessage = JSON.parse(Body);

          if (completedMessage.uniqueId === uniqueId) {
            // Delete message from the completed queue
            await sqsClient.send(new DeleteMessageCommand({ QueueUrl: COMPLETED_QUEUE_URL, ReceiptHandle }));
            console.log(`UUID ${uniqueId} found in completed queue and deleted`);

            // Step 5: Retrieve processed data from S3
            const getObjectParams = {
              Bucket: S3_BUCKET,
              Key: `${uniqueId}-results.json`, // Assuming the processed results are stored with this naming convention
            };
            const resultData = await s3Client.send(new GetObjectCommand(getObjectParams));
            const resultBody = await streamToString(resultData.Body);

            // Send the processed data back to the user
            res.json({
              message: "Simulation completed successfully",
              resultData: JSON.parse(resultBody),
            });
            polling = false; // Stop polling once the result is retrieved
          }
        }

        // Wait briefly between polls to avoid excessive calls if job isn’t complete
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    };

    // Call the polling function immediately
    await pollCompletedQueue();
  } catch (error) {
    console.error("Error in /simulate route:", error);
    res.status(500).send("Error processing simulation request");
  }
});

module.exports = router;

// Helper function to convert a stream to a string
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
