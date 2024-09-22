const authenticateEmail = (req, res, next) => {
  try {
    const { email } = req.params;
    if (req.decodedemail !== email) {
      return res.status(401).json({ error: true, message: "Invalid JWT token" });
    }

    console.log("JWT token email match verified");
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
  authenticateEmail,
};
