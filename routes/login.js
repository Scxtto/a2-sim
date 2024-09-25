const express = require("express");
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { getClientId } = require("../utility/secretHandler");

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" }); // Change region as necessary

// Route to login a user
router.post("/", async (req, res) => {
  console.log("Logging in user: ", req.body);
  const { email, password, newPassword, session } = req.body;
  const clientId = await getClientId();
  console.log("Using password: ", password);
  console.log("Using client ID: ", clientId);

  try {
    let command;

    if (session && newPassword) {
      // Handle the NEW_PASSWORD_REQUIRED challenge
      command = new RespondToAuthChallengeCommand({
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        ClientId: clientId,
        ChallengeResponses: {
          USERNAME: email,
          NEW_PASSWORD: newPassword,
        },
        Session: session,
      });
    } else {
      // Standard login flow
      command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });
    }

    const response = await client.send(command);

    if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      console.log("Challenge required: NEW_PASSWORD_REQUIRED");

      // Send the challenge information back to the frontend so they can prompt for a new password
      return res.status(200).json({
        challenge: "NEW_PASSWORD_REQUIRED",
        session: response.Session,
        challengeParams: response.ChallengeParameters,
      });
    }

    console.log("Login successful:", response);

    // Handle successful login response
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
