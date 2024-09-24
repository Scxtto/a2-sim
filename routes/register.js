const express = require("express");
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { getClientId } = require("../utility/secretHandler");

const router = express.Router();
const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" }); // Change region as necessary

// Route to register a user
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  const clientId = await getClientId();

  const command = new SignUpCommand({
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "name",
        Value: name,
      },
    ],
  });

  try {
    const response = await client.send(command);
    console.log("User registered:", response);

    // Optionally auto-confirm the user (you can also set this to automatic in the Cognito user pool settings)
    /*
    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: userPoolId,
      Username: email,
    });
    await client.send(confirmCommand);
    */
    res.status(201).json({ message: "User registered and confirmed successfully" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
});

module.exports = router;
