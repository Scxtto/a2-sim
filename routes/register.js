const express = require("express");
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AssociateSoftwareTokenCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { getClientId, getUserPoolId } = require("../utility/secretHandler"); // Secure storage for your Client ID

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" });

// Route to handle user registration and auto-confirm email
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    const clientId = await getClientId(); // Get Cognito App Client ID

    // Step 1: Sign up the user
    const signUpCommand = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
    });

    const signUpResponse = await client.send(signUpCommand);

    const poolId = await getUserPoolId(); // Get Cognito User Pool ID

    // Step 2: Auto-confirm the user
    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: poolId, // Replace with your Cognito User Pool ID
      Username: email,
    });

    await client.send(confirmCommand); // Confirm the user

    // Send success response back to client
    res.status(200).json({
      message: "User registered and confirmed successfully",
      userSub: signUpResponse.UserSub,
      session: signUpResponse.Session,
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Error registering user", error: err });
  }
});

module.exports = router;
