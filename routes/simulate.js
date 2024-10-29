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
const { retrieveByUUID } = require("../utility/dynamoHandler");

// Initialize S3 and SQS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

// S3 and SQS configuration
const S3_BUCKET = process.env.S3_BUCKET;
const PENDING_QUEUE_URL = process.env.PENDING_QUEUE_URL;
const COMPLETED_QUEUE_URL = process.env.COMPLETED_QUEUE_URL;
const AWS_REGION = process.env.AWS_REGION;

const pollCompletedQueue = async (email, uniqueId) => {
  let polling = true;

  while (polling) {
    const receiveParams = {
      QueueUrl: COMPLETED_QUEUE_URL,
      MaxNumberOfMessages: 10, // Retrieve up to 10 messages in a single request for batch processing
      WaitTimeSeconds: 5, // Long-polling
    };

    const response = await sqsClient.send(new ReceiveMessageCommand(receiveParams));
    if (response.Messages && response.Messages.length > 0) {
      // Check each message in the batch for the correct uniqueId
      for (const message of response.Messages) {
        const { Body, ReceiptHandle } = message;
        const completedMessage = JSON.parse(Body);

        if (completedMessage.uniqueId === uniqueId) {
          const presigned = completedMessage.presignedUrl;

          // Found the right message, delete it from the queue
          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: COMPLETED_QUEUE_URL,
              ReceiptHandle,
            })
          );
          console.log(`UUID ${uniqueId} found in completed queue and deleted`);

          // Retrieve the processed data from DynamoDB instead of S3
          const resultData = await retrieveByUUID(email, uniqueId);

          if (!resultData) {
            console.error(`No data found in DynamoDB for email: ${email} and UUID: ${uniqueId}`);
            return null; // No data found, handle as needed
          }

          // Return processed data to the caller

          const returnPackage = {
            videoUrl: presigned,
            simResults: resultData.inputs,
          };

          console.log("Result data:", returnPackage);

          return returnPackage;
        }
      }
    }

    // Wait between polls to reduce excessive calls
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

// Step 1: /simulate Route to Receive Data
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const uniqueId = uuidv4();
    req.body.uniqueId = uniqueId;
    req.body.email = req.decodedemail;
    const simulationData = req.body;

    // Step 1: Store simulation data in S3
    const fileKey = `${uniqueId}.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileKey,
        Body: JSON.stringify(simulationData),
        ContentType: "application/json",
      })
    );

    // Step 2: Send the UUID to the pending queue
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: PENDING_QUEUE_URL,
        MessageBody: JSON.stringify({ uniqueId }),
      })
    );

    console.log(`UUID ${uniqueId} sent to pending queue`);

    // Step 3: Poll the completed queue and return the processed result once ready
    const resultData = await pollCompletedQueue(req.decodedemail, uniqueId);
    res.json({
      message: "Simulation completed successfully",
      resultData,
    });
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
