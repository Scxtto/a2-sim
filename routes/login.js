const express = require("express");
const jwt = require("jsonwebtoken");
const { getAccounts } = require("../utility/getAccounts"); // Adjust the path as necessary

const router = express.Router();

router.post("/", (req, res) => {
  const { email, password } = req.body;
  const accounts = getAccounts();

  // Check if the email and password match any of the users in the JSON file
  const user = accounts.find((u) => u.email === email && u.password === password);

  if (user) {
    // Generate JWT.
    const duration = 60 * 60 * 24; // 24 hours
    const expiry = Math.floor(Date.now() / 1000) + duration; // 24 hours
    const token = jwt.sign({ email, expiry }, process.env.JWT_SECRET);
    return res.status(200).json({ token, token_type: "Bearer", duration, isAdmin: user?.role === "admin" });
  } else {
    return res.status(401).json({ message: "Invalid email or password" });
  }
});

module.exports = router;
