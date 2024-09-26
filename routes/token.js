const express = require("express");
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { getClientId, getUserPoolId } = require("../utility/secretHandler");
const jwt = require("aws-jwt-verify");

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" });

router.post("/token", async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  try {
    const bearerToken = req.headers.authorization.split(" ");

    if (bearerToken.length !== 2 || bearerToken[0] !== "Bearer") {
      return res.status(401).json({ error: true, message: "Authorization header is malformed" });
    }
    const token = bearerToken[1];
    console.log("Token: ", token);
    const client_id = await getClientId();
    const pool_id = await getUserPoolId();

    const idVerifier = jwt.CognitoJwtVerifier.create({
      userPoolId: pool_id,
      tokenUse: "id",
      clientId: client_id,
    });

    const IdTokenVerifyResult = await idVerifier.verify(token);

    return res.status(200).json({ email: IdTokenVerifyResult.email });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: true, message: "JWT token has expired" });
    } else {
      return res.status(401).json({ error: true, message: "Invalid JWT token" });
    }
  }
});

module.exports = router;
