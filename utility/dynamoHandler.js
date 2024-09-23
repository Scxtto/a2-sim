const DynamoDB = require("@aws-sdk/client-dynamodb");
const DynamoDBLib = require("@aws-sdk/lib-dynamodb");

const qutUsername = "n11580062@qut.edu.au";
const tableName = "n11580062-dynamo";
const sortKey = "email";

async function createTable() {
  const client = new DynamoDB.DynamoDBClient({ region: "ap-southeast-2" });
  const docClient = DynamoDBLib.DynamoDBDocumentClient.from(client);

  command = new DynamoDB.CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      {
        AttributeName: "qut-username",
        AttributeType: "S",
      },
      {
        AttributeName: sortKey,
        AttributeType: "S", // Setting the sort key to String type
      },
    ],
    KeySchema: [
      {
        AttributeName: "qut-username",
        KeyType: "HASH",
      },
      {
        AttributeName: sortKey,
        KeyType: "RANGE",
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  });

  // Send the command to create the table
  try {
    const response = await client.send(command);
    console.log("Create Table command response:", response);
  } catch (err) {
    console.log(err);
  }

  // Add more content here
}

async function addHistory(email, historyItem) {
  const client = new DynamoDB.DynamoDBClient({ region: "ap-southeast-2" });
  const docClient = DynamoDBLib.DynamoDBDocumentClient.from(client);

  const command = new DynamoDBLib.UpdateCommand({
    TableName: tableName,
    Key: { qutUsername, [sortKey]: email },
    UpdateExpression: "SET #history = list_append(if_not_exists(#history, :empty_list), :historyItem)",
    ExpressionAttributeNames: {
      "#history": "history",
    },
    ExpressionAttributeValues: {
      ":historyItem": [historyItem], // The new history item to append
      ":empty_list": [], // Initialize as an empty list if history doesn't exist
    },
    ReturnValues: "UPDATED_NEW",
  });

  try {
    const response = await docClient.send(command);
    console.log("History added successfully:", response);
  } catch (err) {
    console.log("Error adding history:", err);
  }
}

async function retrieveAll(email) {
  const client = new DynamoDB.DynamoDBClient({ region: "ap-southeast-2" });
  const docClient = DynamoDBLib.DynamoDBDocumentClient.from(client);

  const command = new DynamoDBLib.GetCommand({
    TableName: tableName,
    Key: { email },
  });

  try {
    const response = await docClient.send(command);
    console.log("Retrieve All Response:", response.Item);
    return response.Item;
  } catch (err) {
    console.log("Error retrieving data:", err);
  }
}

module.exports = { createTable, addHistory, retrieveAll };
