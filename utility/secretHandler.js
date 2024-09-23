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
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );
  } catch (error) {
    console.log("Error fetching secret: ", error);
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
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
  const secret = response.SecretString;
  return secret.password;
}

module.exports = { getJWTSecret, getBucketSecret, getRDSSecret };
