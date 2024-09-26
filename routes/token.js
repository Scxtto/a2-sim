const express = require("express");
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { getClientId } = require("../utility/secretHandler");

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" });

router.post("/", async (req, res) => {
  const { code } = req.body;

  try {
    const clientID = await getClientId();
    const command = new InitiateAuthCommand({
      AuthFlow: "AUTHORIZATION_CODE",
      ClientId: clientID, // Your Cognito App Client ID
      AuthParameters: {
        CODE: code,
        REDIRECT_URI: "http://localhost:3000/login", // Your redirect URI
      },
    });

    const response = await client.send(command);
    console.log("Exchanging code for tokens:", response);
    res.json({
      idToken: response.AuthenticationResult.IdToken,
      accessToken: response.AuthenticationResult.AccessToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
    });
  } catch (err) {
    console.error("Error exchanging authorization code for tokens:", err);
    res.status(500).json({ message: "Error exchanging code", error: err });
  }
});

module.exports = router;
