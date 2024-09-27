const Cognito = require("@aws-sdk/client-cognito-identity-provider");
const jwt = require("aws-jwt-verify");
const { getUserPoolId, getClientId } = require("./secretsHandler");

const idVerifier = jwt.CognitoJwtVerifier.create({
  tokenUse: "id", // Verifying ID tokens
  clientId: null, // This will be fetched dynamically from Secrets Manager
  userPoolId: null, // This will be fetched dynamically from Secrets Manager
});

async function authenticateUser(username, password) {
  // Fetch user pool ID and client ID from Secrets Manager
  const userPoolId = await getUserPoolId();
  const clientId = await getClientId();

  // Initialize Cognito client
  const client = new CognitoIdentityProviderClient({
    region: "ap-southeast-2",
  });

  //console.log("Authenticating user:", username);

  // Prepare the auth command for Cognito
  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
    ClientId: clientId,
  });

  try {
    // Get authentication tokens from Cognito
    const res = await client.send(command);
    //console.log("Authentication successful:", res);

    // Retrieve ID Token from the authentication result
    const idToken = res.AuthenticationResult.IdToken;

    // Verify the ID Token (if needed for your application)
    const IdTokenVerifyResult = await idVerifier.verify(idToken, {
      clientId: clientId,
      userPoolId: userPoolId,
    });

    //console.log("ID Token verified:", IdTokenVerifyResult);

    // Return the tokens and verification result
    return {
      idToken: idToken,
      accessToken: res.AuthenticationResult.AccessToken, // Optionally used
      refreshToken: res.AuthenticationResult.RefreshToken,
      expiresIn: res.AuthenticationResult.ExpiresIn,
      verifiedIdToken: IdTokenVerifyResult,
    };
  } catch (error) {
    console.error("Error authenticating user:", error);
    throw error;
  }
}

module.exports = { authenticateUser };
