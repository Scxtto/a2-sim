const express = require("express");
const fs = require("fs");
const path = require("path");
const { authenticateJWT } = require("../middleware/authenticateJwt");
const { authenticateEmail } = require("../middleware/authenticateEmail");
const router = express.Router();
const presetsFilePath = path.join(__dirname, "../storage/presets.json");

const readPresetsFromFile = () => {
  if (!fs.existsSync(presetsFilePath)) {
    return {};
  }
  const data = fs.readFileSync(presetsFilePath, "utf-8");
  return JSON.parse(data);
};

// Utility function to write presets to the file

const writePresetsToFile = (presets) => {
  fs.writeFileSync(presetsFilePath, JSON.stringify(presets, null, 2), "utf-8");
};
// Route to save a preset
router.post("/:email/savePreset", authenticateJWT, authenticateEmail, (req, res) => {
  const { email } = req.params;
  const preset = req.body;

  // Read existing presets
  const presets = readPresetsFromFile();

  // Ensure the email key exists in the presets object
  if (!presets[email]) {
    presets[email] = [];
  }

  // Add the new preset to the user's list
  presets[email].push(preset);

  // Write the updated presets back to the file
  writePresetsToFile(presets);

  res.json({ message: "Preset saved successfully" });
});

// Route to load presets
router.get("/:email/loadPresets", authenticateJWT, authenticateEmail, (req, res) => {
  const { email } = req.params;

  // Read existing presets
  const presets = readPresetsFromFile();

  // Return the presets for the specified email
  const userPresets = presets[email] || [];
  res.json(userPresets);
});

module.exports = router;
