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
