const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const path = require("path");

const usersRoutes = require("./routes/users");
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const simulateRoutes = require("./routes/simulate");
const adminRoutes = require("./routes/admin");
const mfaRoutes = require("./routes/mfa");
const tokenRoutes = require("./routes/token");
const { createHistoryTable } = require("./utility/rdsHandler");
const { createTable } = require("./utility/dynamoHandler");
const { deleteAllFilesInOutputFolder } = require("./processes/clearOutput");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

app.use("/users", usersRoutes);
app.use("/login", loginRoutes);
app.use("/register", registerRoutes);
app.use("/simulate", simulateRoutes);
app.use("/mfa", mfaRoutes);
app.use("/admin", adminRoutes);
app.use("/token", tokenRoutes);
app.use("/videos", express.static(path.join(__dirname, "output")));

deleteAllFilesInOutputFolder();
createTable();
createHistoryTable();

app.listen(port, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
