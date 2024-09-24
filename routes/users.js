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
router.post("/:email/savePreset", authenticateJWT, authenticateEmail, async (req, res) => {
  const { email } = req.params;
  const preset = req.body;

  try {
    // Add the new preset to the user's list in DynamoDB
    await addPreset(email, preset);

    res.json({ message: "Preset saved successfully" });
  } catch (error) {
    console.error("Error saving preset:", error);
    res.status(500).json({ message: "Error saving preset" });
  }
});

// Route to load presets
router.get("/:email/loadPresets", authenticateJWT, authenticateEmail, async (req, res) => {
  const { email } = req.params;

  try {
    // Load the user's presets from DynamoDB
    const userPresets = await loadPresets(email);

    res.json(userPresets);
  } catch (error) {
    console.error("Error loading presets:", error);
    res.status(500).json({ message: "Error loading presets" });
  }
});

module.exports = router;
