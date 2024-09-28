const express = require("express");
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { getClientId, getUserPoolId } = require("../utility/secretHandler");

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" });

// Route to handle user registration and auto-confirm email
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    const clientId = await getClientId();

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

    const poolId = await getUserPoolId();

    // Step 2: Auto-confirm the user
    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: poolId,
      Username: email,
    });

    await client.send(confirmCommand);

    // Step 3: Assign user to the group
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: poolId,
      Username: email,
      GroupName: "user",
    });

    await client.send(addToGroupCommand);

    // Send success response back to client
    res.status(200).json({
      message: "User registered and confirmed successfully",
      userSub: signUpResponse.UserSub,
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Error registering user", error: err });
  }
});

module.exports = router;
