const { SendMessageCommand } = require("@aws-sdk/client-sqs");

const TARGET_QUEUE_URL = "https://sqs.ap-southeast-2.amazonaws.com/your-account-id/target-queue"; // replace with your actual target queue URL

/**
 * Function to push a UUID to a different SQS queue
 * @param {string} uuid - The unique identifier to be pushed to the queue
 */
async function pushUUIDToQueue(uuid) {
  try {
    const messageBody = JSON.stringify({ uuid });

    const command = new SendMessageCommand({
      QueueUrl: TARGET_QUEUE_URL,
      MessageBody: messageBody,
    });

    const response = await sqsClient.send(command);
    console.log("UUID pushed to target queue:", uuid, response);
  } catch (error) {
    console.error("Error pushing UUID to target queue:", error);
  }
}

module.exports = { pushUUIDToQueue };
