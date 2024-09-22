const fs = require("fs");
const path = require("path");
const accountsFilePath = path.join(__dirname, "../storage/accounts.json");

function readAccounts() {
  const data = fs.readFileSync(accountsFilePath, "utf-8");
  return JSON.parse(data);
}

// Helper function to write accounts to file
function writeAccounts(accounts) {
  fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2), "utf-8");
}

module.exports = {
  readAccounts,
  writeAccounts,
};
