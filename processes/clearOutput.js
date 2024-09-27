const fs = require("fs");
const path = require("path");

function deleteAllFilesInOutputFolder() {
  const outputFolderPath = path.join(__dirname, "output");

  fs.readdir(outputFolderPath, (err, files) => {
    if (err) {
      console.error("Error reading the output folder:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(outputFolderPath, file);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file ${file}:`, err);
        } else {
          console.log(`Deleted file: ${file}`);
        }
      });
    });
  });
}

module.exports = { deleteAllFilesInOutputFolder };
