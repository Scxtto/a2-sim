const S3 = require("@aws-sdk/client-s3");
const S3Presigner = require("@aws-sdk/s3-request-presigner");
const s3Client = new S3.S3Client({ region: "ap-southeast-2" });
const { getBucketSecret } = require("./secretHandler");

const fs = require("fs");

async function writeVideoToBucket(videoTitle, filePath) {
  try {
    const bucket = await getBucketSecret();
    const fileStream = fs.createReadStream(filePath);

    const response = await s3Client.send(
      new S3.PutObjectCommand({
        Bucket: bucket,
        Key: videoTitle,
        Body: fileStream,
        ContentType: "video/mp4",
      })
    );

    console.log(`File uploaded successfully with UUID ${videoTitle}:`, response);

    deleteFromLocal(filePath);
    console.log("Local file deleted successfully:", filePath);
  } catch (err) {
    console.error("Error uploading file to S3:", err);
  }
}

async function deleteFromLocal(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    } else {
      console.log("File deleted successfully:", filePath);
    }
  });
}

async function getPresignedURL(videoTitle) {
  try {
    const command = new S3.GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: videoTitle,
    });
    const presignedURL = await S3Presigner.getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log("Pre-signed URL to get the object:");
    console.log(presignedURL);

    return presignedURL;
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    throw err;
  }
}

module.exports = { writeVideoToBucket, getPresignedURL };
