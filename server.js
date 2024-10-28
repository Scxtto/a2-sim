const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const simulateRoutes = require("./routes/simulate");

const { deleteAllFilesInOutputFolder } = require("./processes/clearOutput");

const app = express();
const port = 5001;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

app.use("/simulate", simulateRoutes);

//deleteAllFilesInOutputFolder();

pollPendingQueue();

app.listen(port, "0.0.0.0", () => {
  console.log("Simulation Server running on port 5001");
});
