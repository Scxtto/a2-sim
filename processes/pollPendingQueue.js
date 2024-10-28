const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");

// Initialize AWS SDK clients
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const { processSimulation } = require("./processSimulation");

// Define queue URLs and bucket name
async function pollPendingQueue() {
  console.log("Polling pending queue for new jobs...");

  try {
    const receiveParams = {
      QueueUrl: process.env.PENDING_QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 10, // Long-poll for efficiency
      VisibilityTimeout: 300, // Time given to process the message before it becomes visible again
    };

    const response = await sqsClient.send(new ReceiveMessageCommand(receiveParams));

    if (response.Messages && response.Messages.length > 0) {
      const message = response.Messages[0];
      const { Body, ReceiptHandle } = message;

      // Parse the job data from the queue message
      const { uniqueId } = JSON.parse(Body);
      console.log("Received job with UUID:", uniqueId);

      // Process the job
      await processSimulation(uniqueId);

      // Delete the message from the pending queue after processing
      await sqsClient.send(
        new DeleteMessageCommand({ QueueUrl: process.env.PENDING_QUEUE_URL, ReceiptHandle })
      );
      console.log("Job processed and removed from pending queue:", uniqueId);
    }
  } catch (error) {
    console.error("Error polling pending queue:", error);
  }
}

// Start polling on an interval
module.exports = function startPolling() {
  setInterval(pollPendingQueue, 5000); // Poll every 5 seconds
};
