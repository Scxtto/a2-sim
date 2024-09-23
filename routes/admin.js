const express = require("express");
const router = express.Router();

const { readAccounts, writeAccounts } = require("../utility/accountHelpers");
const { retrieveAllHistory } = require("../utility/rdsHandler");
const { authenticateJWT } = require("../middleware/authenticateJwt");

// Route to get all accounts
router.get("/getHistory", authenticateJWT, async (req, res) => {
  const history = retrieveAllHistory();
  console.log("History retrieved successfully");
  console.log(history);
  res.status(200).json(history);
});

// Route to add a new account
router.post("/addAccount", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: true, message: "Email and password are required" });
  }

  const accounts = readAccounts();

  if (accounts.find((u) => u.email === email)) {
    return res.status(400).json({ error: true, message: "Account with this email already exists" });
  }

  accounts.push({ email, password });
  writeAccounts(accounts);

  res.status(201).json({ message: "Account added successfully" });
});

// Route to update an account's password
router.put("/updateAccount", (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: true, message: "Email and new password are required" });
  }

  const accounts = readAccounts();
  const user = accounts.find((u) => u.email === email);

  if (!user) {
    return res.status(404).json({ error: true, message: "Account not found" });
  }

  user.password = newPassword;
  writeAccounts(accounts);

  res.status(200).json({ message: "Password updated successfully" });
});

// Route to delete an account
router.delete("/deleteAccount", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  let accounts = readAccounts();
  const accountIndex = accounts.findIndex((u) => u.email === email);

  if (accountIndex === -1) {
    return res.status(404).json({ error: true, message: "Account not found" });
  }

  accounts.splice(accountIndex, 1);
  writeAccounts(accounts);

  res.status(200).json({ message: "Account deleted successfully" });
});

module.exports = router;
