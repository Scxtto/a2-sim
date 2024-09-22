const fs = require("fs");
const path = require("path");

const accountsFilePath = path.join(__dirname, "../storage/accounts.json");

function getAccounts() {
  const data = fs.readFileSync(accountsFilePath, "utf-8");
  return JSON.parse(data);
}

module.exports = {
  getAccounts,
};
