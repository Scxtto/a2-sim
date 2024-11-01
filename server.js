const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

//const simulateRoutes = require("./routes/simulate");

const { deleteAllFilesInOutputFolder } = require("./processes/clearOutput");
const startPolling = require("./processes/pollPendingQueue");

const app = express();
const port = 5001;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).send("OK");
});
app.get("/health", (req, res) => {
  res.status(5000).send("unhealthy");
});

//app.use("/simulate", simulateRoutes);

//deleteAllFilesInOutputFolder();

app.listen(port, "0.0.0.0", () => {
  console.log("Simulation Server running on port 5001");
  startPolling();
});
