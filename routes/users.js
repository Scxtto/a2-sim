const express = require("express");
const { authenticateJWT } = require("../middleware/authenticateJwt");
const { authenticateEmail } = require("../middleware/authenticateEmail");
const router = express.Router();
const { retrievePresets, upsertPreset } = require("../utility/rdsHandler");

// Route to save a preset
router.post("/:email/savePreset", authenticateJWT, authenticateEmail, async (req, res) => {
  const { email } = req.params;
  const preset = req.body; // Expecting the preset to be sent in the request body
  console.log("Preset received");
  console.log(preset);

  try {
    // Use the upsertPreset function to either insert a new preset or update an existing one
    await upsertPreset(email, preset);

    res.json({ message: "Preset saved/updated successfully" });
  } catch (error) {
    console.error("Error saving preset:", error);
    res.status(500).json({ message: "Error saving preset" });
  }
});

// Route to load presets
router.get("/:email/loadPresets", authenticateJWT, authenticateEmail, async (req, res) => {
  const { email } = req.params;

  try {
    const userPresets = await retrievePresets(email);

    if (userPresets) {
      res.json(userPresets); // Return the presets stored in the database
    } else {
      res.json([]); // If no presets are found, return an empty array
    }
  } catch (error) {
    console.error("Error loading presets:", error);
    res.status(500).json({ message: "Error loading presets" });
  }
});

module.exports = router;
