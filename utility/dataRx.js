const axios = require("axios");
const fs = require("fs");

async function sendHistoryToDataRx(email, historyItem) {
  try {
    //const response = await axios.post("http://mainapi-service.local/rx/history", {
    const response = await axios.post("http://localhost:3000/rx/history", {
      email,
      historyItem,
    });
    console.log("History item sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending history item to MainAPI:", error.message);
  }
}

async function sendVideoToDataRx(videoTitle, filePath) {
  try {
    //const dataRxUrl = "http://data-rx-service.local/rx/video"; // DataRx API endpoint
    const dataRxUrl = "http://localhost:3000/rx/video"; // Replace with actual MainAPI URL

    const formData = new FormData();
    formData.append("videoTitle", videoTitle);
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(dataRxUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log("Video sent to DataRx API successfully:", response.data);
  } catch (error) {
    console.error("Error sending video to DataRx API:", error.message);
  }
}

async function sendRecordToDataRx(
  email,
  simUUID,
  computeCost,
  datetime,
  status,
  nodeType = null,
  resultSize = null,
  duration = null,
  failureReason = null
) {
  try {
    //    const mainApiUrl = "http://mainapi-service.local/rx/record"; // Replace with actual MainAPI URL
    const mainApiUrl = "http://localhost:3000/rx/record"; // Replace with actual MainAPI URL

    const historyRecord = {
      email,
      simUUID,
      computeCost,
      datetime,
      status,
      nodeType,
      resultSize,
      duration,
      failureReason,
    };

    const response = await axios.post(mainApiUrl, historyRecord);

    console.log("History record sent to MainAPI successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending history record to MainAPI:", error.message);
    throw error;
  }
}

module.exports = { sendHistoryToDataRx, sendVideoToDataRx, sendRecordToDataRx };
