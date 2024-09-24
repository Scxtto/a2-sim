const express = require("express");
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { getClientId } = require("../utility/secretHandler");
const router = express.Router();
const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" }); // Change region as necessary

// Route to login a user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const clientId = await getClientId();

  const command = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH", // Standard auth flow for user/password
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  try {
    const response = await client.send(command);
    console.log("Login successful:", response);

    // The response contains tokens, including an ID token, access token, and refresh token
    res.status(200).json({
      idToken: response.AuthenticationResult.IdToken,
      accessToken: response.AuthenticationResult.AccessToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      token_type: "Bearer",
      expires_in: response.AuthenticationResult.ExpiresIn,
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(401).json({ message: "Invalid email or password" });
  }
});

module.exports = router;
