// Middleware to authenticate JWT
const jwt = require("aws-jwt-verify");
const { getClientId, getUserPoolId } = require("../utility/secretHandler");

const authenticateJWT = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  console.log("Authenticating JWT token...");
  console.log("Request headers: ", req.headers);

  console.log("authorization: ", req.headers.authorization);

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

    console.log("IdTokenVerifyResult: ", IdTokenVerifyResult);
    req.decodedemail = IdTokenVerifyResult.email;
    console.log("Decoded email: ", req.decodedemail);

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: true, message: "JWT token has expired" });
    } else {
      return res.status(401).json({ error: true, message: "Invalid JWT token" });
    }
  }
};

module.exports = {
  authenticateJWT,
};
