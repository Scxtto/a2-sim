const express = require("express");
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" });

// MFA Setup: /mfa/setup
router.post("/setup", async (req, res) => {
  const { session } = req.body;

  try {
    const associateCommand = new AssociateSoftwareTokenCommand({
      Session: session,
    });

    const response = await client.send(associateCommand);

    res.status(200).json({
      secretCode: response.SecretCode, // Secret code for scanning in authenticator app
    });
  } catch (error) {
    console.error("Error setting up MFA:", error);
    res.status(500).json({ message: "Error setting up MFA", error });
  }
});

router.post("/verify", async (req, res) => {
  const { session, mfaCode } = req.body; // Use the session from registration

  try {
    const verifyCommand = new VerifySoftwareTokenCommand({
      Session: session, // Use the session instead of accessToken
      UserCode: mfaCode,
    });

    const response = await client.send(verifyCommand);

    if (response.Status === "SUCCESS") {
      res.status(200).json({ message: "MFA setup successful" });
    } else {
      res.status(400).json({ message: "Failed to verify MFA code" });
    }
  } catch (error) {
    console.error("Error verifying MFA:", error);
    res.status(500).json({ message: "Error verifying MFA", error });
  }
});

module.exports = router;
