// Middleware to authenticate JWT
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decodedemail = decoded.email;

    console.log("JWT token verified");
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
