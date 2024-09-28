const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

async function getJWTSecret() {
  const client = new SecretsManagerClient({
    region: "ap-southeast-2",
  });

  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.JWT_SECRET,
        VersionStage: "AWSCURRENT",
      })
    );
  } catch (error) {
    console.log("Error fetching secret: ", error);
    throw error;
  }

  // Parse the secret string and return only the jwt
  const secret = JSON.parse(response.SecretString);
  return secret.jwt;
}

async function getBucketSecret() {
  const client = new SecretsManagerClient({
    region: "ap-southeast-2",
  });

  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.BUCKET_SECRET,
        VersionStage: "AWSCURRENT",
      })
    );
  } catch (error) {
    throw error;
  }

  // Parse the secret string and return only the bucket
  const secret = JSON.parse(response.SecretString);
  return secret.bucket;
}

async function getRDSSecret() {
  const client = new SecretsManagerClient({
    region: "ap-southeast-2",
  });

  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.RDS_SECRET,
        VersionStage: "AWSCURRENT",
      })
    );
  } catch (error) {
    throw error;
  }

  // Parse the secret string and return only the bucket
  const secret = JSON.parse(response.SecretString);
  return secret.password;
}

// New function to retrieve the Cognito User Pool ID
async function getUserPoolId() {
  const client = new SecretsManagerClient({
    region: "ap-southeast-2",
  });

  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.COGNITO_SECRET,
        VersionStage: "AWSCURRENT",
      })
    );
  } catch (error) {
    console.error("Error fetching User Pool ID:", error);
    throw error;
  }

  const secret = JSON.parse(response.SecretString);
  return secret.pool_id;
}

// New function to retrieve the Cognito Client ID
async function getClientId() {
  const client = new SecretsManagerClient({
    region: "ap-southeast-2",
  });

  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.COGNITO_SECRET,
        VersionStage: "AWSCURRENT",
      })
    );
  } catch (error) {
    console.error("Error fetching Client ID:", error);
    throw error;
  }

  const secret = JSON.parse(response.SecretString);
  return secret.client_id;
}

module.exports = { getJWTSecret, getBucketSecret, getRDSSecret, getUserPoolId, getClientId };
