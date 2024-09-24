async function createHistoryObject(uuid, results, inputs) {
  //console.log("Creating history object for UUID:", uuid);
  //console.log("Results:", results);
  //console.log("Inputs:", inputs);

  const historyLog = {
    uuid: uuid,
    inputs: inputs,
    results: results,
  };

  return historyLog;
}
/*
async function logResults(email, uuid, results, inputs) {
  // Function to read results from the file asynchronously
  const readResultsFromFile = async () => {
    try {
      if (!(await fs.stat(resultsFilePath).catch(() => false))) {
        return {}; // Return an empty object if the file doesn't exist
      }
      const data = await fs.readFile(resultsFilePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading results file:", error);
      return {};
    }
  };

  // Function to write results back to the file asynchronously
  const writeResultsToFile = async (resultsFile) => {
    try {
      await fs.writeFile(resultsFilePath, JSON.stringify(resultsFile, null, 2), "utf-8");
    } catch (error) {
      console.error("Error writing to results file:", error);
    }
  };

  try {
    // Read existing results
    const resultsFile = await readResultsFromFile();

    // Ensure there's an array for this email
    if (!resultsFile[email]) {
      resultsFile[email] = [];
    }

    // Append the new result data
    resultsFile[email].push({
      uuid: uuid,
      inputs: inputs,
      results: results,
    });

    // Write the updated results back to the file
    await writeResultsToFile(resultsFile);
  } catch (error) {
    console.error("Error logging results:", error);
  }
}
  */

module.exports = {
  createHistoryObject,
};
